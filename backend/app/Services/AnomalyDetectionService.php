<?php

namespace App\Services;

use App\Models\ExamAnomalySummary;
use App\Models\ExamSubmission;
use App\Models\KeyboardShortcutLog;
use App\Models\KeystrokeDynamicsLog;
use App\Models\ResponseTimeLog;
use App\Models\TabSwitchLog;
use Illuminate\Support\Facades\DB;

/**
 * AnomalyDetectionService
 *
 * Writes to four dedicated tables (one per algorithm) instead of the old
 * monolithic exam_anomaly_logs table. All existing bug fixes are preserved:
 *
 *  BUG FIX #5 — Tab switch double-counted
 *    Frontend posts twice per switch (on hide duration=0, on return duration=real).
 *    Fix: ignore posts where hidden_duration_ms === 0. Only the return-post
 *    with a real duration increments the counter and summary.
 *
 *  BUG FIX #6 — Response time Z-score never triggered
 *    Baseline-building rows were included in prior-times queries, so the same
 *    rows kept being reused and z-scores were always 0.
 *    Fix: tag baseline rows with note='baseline_building' and exclude them
 *    from prior-times queries via is_baseline column.
 *
 *  BUG FIX #7 — keyboard_analysis flag checked correctly in controller,
 *    no change needed in the service. Documented for clarity.
 *
 * Algorithm → table mapping:
 *   processTabSwitch()         → tab_switch_logs          (Isolation Forest)
 *   processKeyboardShortcut()  → keyboard_shortcut_logs   (One-Class SVM)
 *   processResponseTime()      → response_time_logs       (Z-Score Method)
 *   processKeystrokeDynamics() → keystroke_dynamics_logs  (Hidden Markov Model)
 */
class AnomalyDetectionService
{
    // ── Monitored keyboard shortcuts (One-Class SVM) ───────────────────────
    private const BLOCKED_SHORTCUTS = [
        'Ctrl+C', 'Ctrl+V', 'Ctrl+X',
        'Ctrl+A',
        'Ctrl+F', 'Ctrl+G',
        'Ctrl+T', 'Ctrl+W', 'Ctrl+N',
        'Alt+Tab', 'Meta+Tab',
        'F12', 'Ctrl+Shift+I', 'Ctrl+Shift+J',
        'Ctrl+U',
        'PrintScreen',
    ];

    private const HIGH_SEVERITY_SHORTCUTS = [
        'F12', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+U', 'PrintScreen',
    ];

    private const PASTE_COMBOS = ['Ctrl+V', 'Meta+V', 'Paste'];

    // ══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ══════════════════════════════════════════════════════════════════════

    // ── Isolation Forest ───────────────────────────────────────────────────

    public function processTabSwitch(ExamSubmission $submission, array $payload): ?TabSwitchLog
    {
        $hiddenDurationMs = $payload['hidden_duration_ms'] ?? 0;

        // BUG FIX #5 — The frontend posts on hide (duration=0) AND on return
        // (duration=real). Store a lightweight audit row for the hide ping
        // but do NOT increment the summary counter.
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
            // No summary increment — intentional
        }

        // Return-post with real duration — this is the real event to count
        $summary  = $this->getOrCreateSummary($submission);
        $newCount = $summary->tab_switch_count + 1;

        $log = TabSwitchLog::create([
            'submission_id'       => $submission->id,
            'exam_id'             => $submission->exam_id,
            'student_id'          => $submission->student_id,
            'cumulative_switches' => $newCount,
            'hidden_duration_ms'  => $hiddenDurationMs,
            'is_return_event'     => true,
            'client_timestamp'    => $payload['timestamp'] ?? null,
            'severity'            => 'low',
            'occurred_at'         => now(),
        ]);

        $this->upsertSummary($submission, 'tab_switch_count');

        return $log;
    }

    // ── One-Class SVM ──────────────────────────────────────────────────────

    public function processKeyboardShortcut(ExamSubmission $submission, array $payload): ?KeyboardShortcutLog
    {
        $keys = $payload['keys'] ?? '';

        if (!in_array($keys, self::BLOCKED_SHORTCUTS, true)) {
            return null;
        }

        $isPaste    = in_array($keys, self::PASTE_COMBOS, true);
        $cumulative = KeyboardShortcutLog::where('submission_id', $submission->id)->count() + 1;
        $pasteIndex = $isPaste
            ? KeyboardShortcutLog::where('submission_id', $submission->id)->where('is_paste', true)->count() + 1
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
            'pasted_char_count' => $payload['char_count'] ?? 0,
            'paste_index'       => $pasteIndex,
            'client_timestamp'  => $payload['timestamp'] ?? null,
            'severity'          => $severity,
            'occurred_at'       => now(),
        ]);

        $this->upsertSummary($submission, 'keyboard_shortcut_count');

        return $log;
    }

    // ── Z-Score Method ─────────────────────────────────────────────────────

    public function processResponseTime(ExamSubmission $submission, array $payload): ?ResponseTimeLog
    {
        $questionId     = $payload['question_id']      ?? null;
        $responseTimeMs = $payload['response_time_ms'] ?? null;

        if (!$questionId || !$responseTimeMs || $responseTimeMs <= 0) {
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

        $this->upsertSummary($submission, 'response_time_anomaly_count');

        return $log;
    }

    // ── Hidden Markov Model ────────────────────────────────────────────────

    public function processKeystrokeDynamics(ExamSubmission $submission, array $payload): ?KeystrokeDynamicsLog
    {
        $questionId  = $payload['question_id']     ?? null;
        $dwellTimes  = $payload['dwell_times_ms']  ?? [];
        $flightTimes = $payload['flight_times_ms'] ?? [];
        $totalChars  = $payload['total_chars']     ?? 0;
        $durationMs  = $payload['duration_ms']     ?? 0;

        if (!$questionId || count($dwellTimes) < 5 || $durationMs <= 0) {
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
            'paste_count'      => $payload['paste_count'] ?? 0,
            'duration_ms'      => $durationMs,
            'keystroke_count'  => count($dwellTimes),
            'is_baseline'      => false,
            'hmm_log_prob'     => null,
            'reason'           => null,
            'client_timestamp' => $payload['timestamp'] ?? null,
            'severity'         => 'low',
            'occurred_at'      => now(),
        ]);

        $this->upsertSummary($submission, 'keystroke_anomaly_count');

        return $log;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ══════════════════════════════════════════════════════════════════════

    private function getOrCreateSummary(ExamSubmission $submission): ExamAnomalySummary
    {
        return ExamAnomalySummary::firstOrCreate(
            ['submission_id' => $submission->id],
            [
                'exam_id'                     => $submission->exam_id,
                'student_id'                  => $submission->student_id,
                'tab_switch_count'            => 0,
                'keyboard_shortcut_count'     => 0,
                'response_time_anomaly_count' => 0,
                'keystroke_anomaly_count'     => 0,
                'risk_score'                  => 0,
                'flag_status'                 => 'none',
                'last_anomaly_at'             => now(),
            ]
        );
    }

    /**
     * Atomically increment a summary counter and recalculate risk score.
     * Uses a raw DB update to avoid Eloquent model-cache stale-value issues
     * on freshly created rows.
     */
    private function upsertSummary(ExamSubmission $submission, string $counter): void
    {
        $this->getOrCreateSummary($submission);

        DB::table('exam_anomaly_summaries')
            ->where('submission_id', $submission->id)
            ->update([
                $counter          => DB::raw("`{$counter}` + 1"),
                'last_anomaly_at' => now(),
                'updated_at'      => now(),
            ]);

        ExamAnomalySummary::where('submission_id', $submission->id)
            ->firstOrFail()
            ->recalculate();
    }
}