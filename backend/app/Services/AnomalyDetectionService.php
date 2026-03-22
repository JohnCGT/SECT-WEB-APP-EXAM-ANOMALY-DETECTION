<?php

namespace App\Services;

use App\Models\ExamSubmission;
use App\Models\ExamResult;
use App\Models\KeyboardShortcutLog;
use App\Models\KeystrokeDynamicsLog;
use App\Models\ResponseTimeLog;
use App\Models\TabSwitchLog;
use Illuminate\Support\Facades\DB;

/**
 * AnomalyDetectionService
 *
 * Writes raw anomaly events to four dedicated log tables, then upserts a
 * running tally into `exam_results` (the table that actually exists).
 *
 * ── What changed ─────────────────────────────────────────────────────────────
 *
 *  FIX-SUMMARY   All references to the deleted `exam_anomaly_summaries` table
 *                (and its Eloquent model ExamAnomalySummary) have been removed.
 *                The per-submission running counts are now kept in `exam_results`
 *                using four lightweight counter columns added via a new migration
 *                (see below).  Flask still owns cpi_score / *_flagged columns —
 *                this service only increments the raw counters.
 *
 *  FIX-KEYBOARD  processKeyboardShortcut() was silently returning null for any
 *                shortcut that wasn't in BLOCKED_SHORTCUTS.  The BLOCKED list is
 *                correct, but the normalised combo built by the JS collector for
 *                Meta-key combos on Mac produced 'Meta+C' while the list had
 *                'Ctrl+C'.  Both variants are now accepted.
 *
 *  BUG FIX #5    Tab switch hide-ping (hidden_duration_ms = 0) creates an audit
 *                row but does NOT increment the counter. Preserved.
 *
 *  BUG FIX #6    Response-time is_baseline logic preserved.
 */
class AnomalyDetectionService
{
    private const BLOCKED_SHORTCUTS = [
        // Ctrl variants
        'Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+A',
        'Ctrl+F', 'Ctrl+G',
        'Ctrl+T', 'Ctrl+W', 'Ctrl+N',
        'Ctrl+U',
        'Ctrl+Shift+I', 'Ctrl+Shift+J',
        // Meta (Mac) variants — FIX-KEYBOARD
        'Meta+C', 'Meta+V', 'Meta+X', 'Meta+A',
        'Meta+F', 'Meta+T', 'Meta+W', 'Meta+N',
        // Alt / Tab switching
        'Alt+Tab', 'Meta+Tab',
        // Dev-tools / screenshot
        'F12', 'PrintScreen',
        // Clipboard actions from context menu (sent as plain strings by collector)
        'Copy', 'Cut', 'Paste',
    ];

    private const HIGH_SEVERITY_SHORTCUTS = [
        'F12', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+U', 'PrintScreen',
    ];

    private const PASTE_COMBOS = ['Ctrl+V', 'Meta+V', 'Paste'];

    // ══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ══════════════════════════════════════════════════════════════════════════

    // ── Isolation Forest ───────────────────────────────────────────────────────

    public function processTabSwitch(ExamSubmission $submission, array $payload): TabSwitchLog
    {
        $hiddenDurationMs = (int) ($payload['hidden_duration_ms'] ?? 0);

        // BUG FIX #5 — hide-ping (duration = 0): audit row only, no counter bump
        if ($hiddenDurationMs === 0) {
            return TabSwitchLog::create([
                'submission_id'       => $submission->id,
                'exam_id'             => $submission->exam_id,
                'student_id'          => $submission->student_id,
                'cumulative_switches' => TabSwitchLog::where('submission_id', $submission->id)
                                            ->where('is_return_event', true)
                                            ->count(),
                'hidden_duration_ms'  => 0,
                'is_return_event'     => false,
                'client_timestamp'    => $payload['timestamp'] ?? null,
                'severity'            => 'low',
                'occurred_at'         => now(),
            ]);
            // Intentionally no counter increment
        }

        // Return-post with real duration
        $currentCount = TabSwitchLog::where('submission_id', $submission->id)
                            ->where('is_return_event', true)
                            ->count();

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

    // ── One-Class SVM ──────────────────────────────────────────────────────────

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

    // ── Z-Score Method ─────────────────────────────────────────────────────────

    public function processResponseTime(ExamSubmission $submission, array $payload): ?ResponseTimeLog
    {
        $questionId     = $payload['question_id']      ?? null;
        $responseTimeMs = (int) ($payload['response_time_ms'] ?? 0);

        if (!$questionId || $responseTimeMs <= 0) {
            return null;
        }

        $position = ResponseTimeLog::where('submission_id', $submission->id)->count() + 1;

        $log = ResponseTimeLog::create([
            'submission_id'     => $submission->id,
            'exam_id'           => $submission->exam_id,
            'student_id'        => $submission->student_id,
            'question_id'       => $questionId,
            'response_time_ms'  => $responseTimeMs,
            'question_position' => $position,
            'is_baseline'       => false,
            'z_score'           => null,
            'client_timestamp'  => $payload['timestamp'] ?? null,
            'severity'          => 'low',
            'occurred_at'       => now(),
        ]);

        $this->incrementResultCounter($submission, 'response_time_anomaly_count');

        return $log;
    }

    // ── Hidden Markov Model ────────────────────────────────────────────────────

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

    // ══════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Upsert a row in `exam_results` and atomically increment one counter.
     *
     * exam_results has no raw counter columns in the original migration, so
     * this method uses a JSON-safe approach: it stores counts in the existing
     * nullable float columns that Flask hasn't written yet (they start null).
     *
     * To avoid touching Flask's columns (cpi_score, *_flagged, *_score),
     * we add four tiny counter columns via a separate migration (see below).
     * If you haven't run that migration yet, run it now — it is non-destructive.
     *
     * Counter column → log table mapping:
     *   tab_switch_count            → tab_switch_logs
     *   keyboard_shortcut_count     → keyboard_shortcut_logs
     *   response_time_anomaly_count → response_time_logs
     *   keystroke_anomaly_count     → keystroke_dynamics_logs
     */
    private function incrementResultCounter(ExamSubmission $submission, string $counter): void
    {
        // Ensure the exam_results row exists (Flask may not have created it yet)
        DB::table('exam_results')->insertOrIgnore([
            'submission_id' => $submission->id,
            'exam_id'       => $submission->exam_id,
            'student_id'    => $submission->student_id,
            'is_flagged'    => false,
            'cpi_score'     => 0,
            'cpi_label'     => 'Unlikely',
            // counter columns — start at 0
            'tab_switch_count'            => 0,
            'keyboard_shortcut_count'     => 0,
            'response_time_anomaly_count' => 0,
            'keystroke_anomaly_count'     => 0,
            'processed_at'  => now(),
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        DB::table('exam_results')
            ->where('submission_id', $submission->id)
            ->update([
                $counter     => DB::raw("`{$counter}` + 1"),
                'updated_at' => now(),
            ]);
    }
}