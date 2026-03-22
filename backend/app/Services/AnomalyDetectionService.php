<?php

namespace App\Services;

use App\Models\ExamSubmission;
use App\Models\KeyboardShortcutLog;
use App\Models\KeystrokeDynamicsLog;
use App\Models\ResponseTimeLog;
use App\Models\TabSwitchLog;
use Illuminate\Support\Facades\DB;

/**
 * AnomalyDetectionService
 *
 * ── Changes in this version ───────────────────────────────────────────────────
 *
 *  FIX-PREV  previous_times_ms is now written from $payload['previous_times_ms']
 *            instead of being built by querying response_time_logs.
 *
 *            The old approach queried the column to build the history list,
 *            but the column was never actually written (always null), so the
 *            query always returned an empty array — a circular dependency.
 *
 *            The collector now tracks all prior response times in memory and
 *            sends them with every response-time POST. The service just writes
 *            whatever it receives. No DB round-trip needed.
 *
 * ── All previous fixes unchanged ─────────────────────────────────────────────
 *  BUG FIX #5 — Tab hide-ping (duration=0) creates audit row but no counter
 *  BUG FIX #6 — Response-time is_baseline column preserved
 *  FIX-SUMMARY — Uses exam_results (not deleted exam_anomaly_summaries)
 *  FIX-KEYBOARD — Meta+* variants in BLOCKED list; keyboard_analysis null = enabled
 */
class AnomalyDetectionService
{
    private const BLOCKED_SHORTCUTS = [
        'Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+A',
        'Ctrl+F', 'Ctrl+G',
        'Ctrl+T', 'Ctrl+W', 'Ctrl+N',
        'Ctrl+U', 'Ctrl+Shift+I', 'Ctrl+Shift+J',
        'Meta+C', 'Meta+V', 'Meta+X', 'Meta+A',
        'Meta+F', 'Meta+T', 'Meta+W', 'Meta+N',
        'Alt+Tab', 'Meta+Tab',
        'F12', 'PrintScreen',
        'Copy', 'Cut', 'Paste',
    ];

    private const HIGH_SEVERITY_SHORTCUTS = [
        'F12', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+U', 'PrintScreen',
    ];

    private const PASTE_COMBOS = ['Ctrl+V', 'Meta+V', 'Paste'];

    // ══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ══════════════════════════════════════════════════════════════════════════

    public function processTabSwitch(ExamSubmission $submission, array $payload): TabSwitchLog
    {
        $hiddenDurationMs = (int) ($payload['hidden_duration_ms'] ?? 0);

        // BUG FIX #5 — hide-ping: audit row only, no counter increment
        if ($hiddenDurationMs === 0) {
            return TabSwitchLog::create([
                'submission_id'       => $submission->id,
                'exam_id'             => $submission->exam_id,
                'student_id'          => $submission->student_id,
                'cumulative_switches' => TabSwitchLog::where('submission_id', $submission->id)
                                            ->where('is_return_event', true)->count(),
                'hidden_duration_ms'  => 0,
                'is_return_event'     => false,
                'client_timestamp'    => $payload['timestamp'] ?? null,
                'severity'            => 'low',
                'occurred_at'         => now(),
            ]);
        }

        $currentCount = TabSwitchLog::where('submission_id', $submission->id)
                            ->where('is_return_event', true)->count();

        $log = TabSwitchLog::create([
            'submission_id'       => $submission->id,
            'exam_id'             => $submission->exam_id,
            'student_id'          => $submission->student_id,
            'cumulative_switches' => $currentCount + 1,
            'hidden_duration_ms'  => $hiddenDurationMs,
            'is_return_event'     => true,
            'client_timestamp'    => $payload['timestamp'] ?? null,
            'severity'            => 'low',
            'occurred_at'         => now(),
        ]);

        $this->incrementResultCounter($submission, 'tab_switch_count');

        return $log;
    }

    public function processKeyboardShortcut(ExamSubmission $submission, array $payload): ?KeyboardShortcutLog
    {
        $keys = trim($payload['keys'] ?? '');

        if ($keys === '' || !in_array($keys, self::BLOCKED_SHORTCUTS, true)) {
            return null;
        }

        $isPaste    = in_array($keys, self::PASTE_COMBOS, true);
        $cumulative = KeyboardShortcutLog::where('submission_id', $submission->id)->count() + 1;
        $pasteIndex = $isPaste
            ? KeyboardShortcutLog::where('submission_id', $submission->id)
                  ->where('is_paste', true)->count() + 1
            : null;

        $severity = in_array($keys, self::HIGH_SEVERITY_SHORTCUTS, true) ? 'high' : 'medium';

        $log = KeyboardShortcutLog::create([
            'submission_id'     => $submission->id,
            'exam_id'           => $submission->exam_id,
            'student_id'        => $submission->student_id,
            'question_id'       => $payload['question_id'] ?? null,
            'keys'              => $keys,
            'cumulative_count'  => $cumulative,
            'is_paste'          => $isPaste,
            'pasted_char_count' => (int) ($payload['char_count'] ?? 0),
            'paste_index'       => $pasteIndex,
            'client_timestamp'  => $payload['timestamp'] ?? null,
            'severity'          => $severity,
            'occurred_at'       => now(),
        ]);

        $this->incrementResultCounter($submission, 'keyboard_shortcut_count');

        return $log;
    }

    public function processResponseTime(ExamSubmission $submission, array $payload): ?ResponseTimeLog
    {
        $questionId     = $payload['question_id']      ?? null;
        $responseTimeMs = (int) ($payload['response_time_ms'] ?? 0);

        if (!$questionId || $responseTimeMs <= 0) {
            return null;
        }

        $position = ResponseTimeLog::where('submission_id', $submission->id)->count() + 1;

        // FIX-PREV: write previous_times_ms directly from the collector payload.
        // The collector maintains the full history in memory and sends it here,
        // so we no longer need to query the DB to rebuild the list.
        $previousTimes = $payload['previous_times_ms'] ?? [];

        $log = ResponseTimeLog::create([
            'submission_id'     => $submission->id,
            'exam_id'           => $submission->exam_id,
            'student_id'        => $submission->student_id,
            'question_id'       => $questionId,
            'response_time_ms'  => $responseTimeMs,
            'question_position' => $position,
            'previous_times_ms' => $previousTimes,   // FIX-PREV: now correctly populated
            'is_baseline'       => false,
            'z_score'           => null,
            'client_timestamp'  => $payload['timestamp'] ?? null,
            'severity'          => 'low',
            'occurred_at'       => now(),
        ]);

        $this->incrementResultCounter($submission, 'response_time_anomaly_count');

        return $log;
    }

    public function processKeystrokeDynamics(ExamSubmission $submission, array $payload): ?KeystrokeDynamicsLog
    {
        $questionId  = $payload['question_id']     ?? null;
        $dwellTimes  = $payload['dwell_times_ms']  ?? [];
        $flightTimes = $payload['flight_times_ms'] ?? [];
        $totalChars  = (int) ($payload['total_chars'] ?? 0);
        $durationMs  = (int) ($payload['duration_ms']  ?? 0);

        if (!$questionId || count($dwellTimes) < 3 || $durationMs <= 0) {
            return null;
        }

        $avgDwell  = array_sum($dwellTimes) / count($dwellTimes);
        $avgFlight = count($flightTimes) > 0
            ? array_sum($flightTimes) / count($flightTimes)
            : 0;
        $wpm = ($totalChars / 5) / ($durationMs / 60000);

        $log = KeystrokeDynamicsLog::create([
            'submission_id'    => $submission->id,
            'exam_id'          => $submission->exam_id,
            'student_id'       => $submission->student_id,
            'question_id'      => $questionId,
            'dwell_times_ms'   => $dwellTimes,
            'flight_times_ms'  => $flightTimes,
            'avg_dwell_ms'     => round($avgDwell, 2),
            'avg_flight_ms'    => round($avgFlight, 2),
            'wpm'              => round($wpm, 2),
            'total_chars'      => $totalChars,
            'paste_count'      => (int) ($payload['paste_count'] ?? 0),
            'duration_ms'      => $durationMs,
            'keystroke_count'  => count($dwellTimes),
            'is_baseline'      => false,
            'hmm_log_prob'     => null,
            'reason'           => null,
            'client_timestamp' => $payload['timestamp'] ?? null,
            'severity'         => 'low',
            'occurred_at'      => now(),
        ]);

        $this->incrementResultCounter($submission, 'keystroke_anomaly_count');

        return $log;
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private function incrementResultCounter(ExamSubmission $submission, string $counter): void
    {
        DB::table('exam_results')->insertOrIgnore([
            'submission_id'               => $submission->id,
            'exam_id'                     => $submission->exam_id,
            'student_id'                  => $submission->student_id,
            'is_flagged'                  => false,
            'cpi_score'                   => 0,
            'cpi_label'                   => 'Unlikely',
            'tab_switch_count'            => 0,
            'keyboard_shortcut_count'     => 0,
            'response_time_anomaly_count' => 0,
            'keystroke_anomaly_count'     => 0,
            'processed_at'                => now(),
            'created_at'                  => now(),
            'updated_at'                  => now(),
        ]);

        DB::table('exam_results')
            ->where('submission_id', $submission->id)
            ->update([
                $counter     => DB::raw("`{$counter}` + 1"),
                'updated_at' => now(),
            ]);
    }
}