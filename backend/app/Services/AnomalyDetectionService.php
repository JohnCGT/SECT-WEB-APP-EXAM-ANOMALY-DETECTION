<?php

namespace App\Services;

use App\Models\ExamAnomalyLog;
use App\Models\ExamAnomalySummary;
use App\Models\ExamSubmission;

/**
 * AnomalyDetectionService — Fixed
 *
 * Backend bug fixes:
 *
 *  BUG 5 — Tab switch double-counted
 *    The frontend now posts TWICE per switch (on hide + on return).
 *    The backend was incrementing the counter for every POST, so each
 *    real switch appeared as 2 events and the risk score inflated.
 *    Fix: ignore posts where hidden_duration_ms === 0 (the "on-hide" ping).
 *    Only the return-post with a real duration increments the counter.
 *
 *  BUG 6 — Response time Z-score never triggered
 *    The minimum sample check used `< 3` but the baseline logs (stored with
 *    note:'baseline_building') were never excluded from the prior-times query,
 *    so the same 3 baseline rows kept being re-used and z-scores were always 0.
 *    Fix: exclude baseline_building logs from the priorTimes query.
 *
 *  BUG 7 — keyboard_analysis exam flag was checked for tab_switch events
 *    The tab_switch check in AnomalyController correctly used tab_switching_monitor,
 *    but the service itself didn't recheck — the controller guard is enough,
 *    no change needed in the service. Documented for clarity.
 */
class AnomalyDetectionService
{
    private const TAB_MEDIUM = 3;
    private const TAB_HIGH   = 6;

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

    private const RESPONSE_TIME_Z_THRESHOLD  = 2.5;
    private const RESPONSE_TIME_MIN_SAMPLES  = 3;
    private const KEYSTROKE_Z_THRESHOLD      = 2.5;
    private const KEYSTROKE_MAX_WPM          = 120;

    // ── Public API ─────────────────────────────────────────────────────────

    public function processTabSwitch(ExamSubmission $submission, array $payload): ?ExamAnomalyLog
    {
        $hiddenDurationMs = $payload['hidden_duration_ms'] ?? 0;

        // BUG FIX #5 — The frontend posts twice: once on hide (duration=0)
        // and once on return (duration=real). Only count the return post.
        if ($hiddenDurationMs === 0) {
            // Store a lightweight ping log for audit trail but don't flag/count it
            return $this->createLog($submission, [
                'type'        => 'tab_switch',
                'severity'    => 'low',
                'question_id' => null,
                'metadata'    => [
                    'event'     => 'tab_hidden',
                    'timestamp' => $payload['timestamp'] ?? now()->toISOString(),
                ],
                'occurred_at' => $payload['timestamp'] ?? now(),
            ]);
            // Note: we intentionally do NOT increment summary counts here
        }

        // This is the return-post with real duration — count it
        $summary  = $this->getOrCreateSummary($submission);
        $newCount = $summary->tab_switch_count + 1;

        $severity = match(true) {
            $newCount >= self::TAB_HIGH   => 'high',
            $newCount >= self::TAB_MEDIUM => 'medium',
            default                       => 'low',
        };

        $log = $this->createLog($submission, [
            'type'        => 'tab_switch',
            'severity'    => $severity,
            'question_id' => null,
            'metadata'    => [
                'count_in_session'   => $newCount,
                'hidden_duration_ms' => $hiddenDurationMs,
                'timestamp'          => $payload['timestamp'] ?? now()->toISOString(),
            ],
            'occurred_at' => $payload['timestamp'] ?? now(),
        ]);

        $summary->increment('tab_switch_count');
        $summary->refresh()->recalculate();

        return $log;
    }

    public function processKeyboardShortcut(ExamSubmission $submission, array $payload): ?ExamAnomalyLog
    {
        $keys = $payload['keys'] ?? '';

        if (!in_array($keys, self::BLOCKED_SHORTCUTS, true)) {
            return null;
        }

        $summary = $this->getOrCreateSummary($submission);

        $highPatterns = ['F12', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+U', 'PrintScreen'];
        $severity     = in_array($keys, $highPatterns, true) ? 'high' : 'medium';

        $log = $this->createLog($submission, [
            'type'        => 'keyboard_shortcut',
            'severity'    => $severity,
            'question_id' => null,
            'metadata'    => [
                'keys'      => $keys,
                'timestamp' => $payload['timestamp'] ?? now()->toISOString(),
            ],
            'occurred_at' => $payload['timestamp'] ?? now(),
        ]);

        $summary->increment('keyboard_shortcut_count');
        $summary->refresh()->recalculate();

        return $log;
    }

    public function processResponseTime(ExamSubmission $submission, array $payload): ?ExamAnomalyLog
    {
        $questionId     = $payload['question_id']     ?? null;
        $responseTimeMs = $payload['response_time_ms'] ?? null;

        if (!$questionId || !$responseTimeMs || $responseTimeMs <= 0) {
            return null;
        }

        // BUG FIX #6 — Exclude baseline_building logs from the prior-times
        // query so they don't pollute the Z-score calculation with circular data.
        $priorTimes = ExamAnomalyLog::where('submission_id', $submission->id)
            ->where('type', 'response_time')
            ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.note')) != 'baseline_building'
                        OR JSON_EXTRACT(metadata, '$.note') IS NULL")
            ->pluck('metadata')
            ->map(fn ($m) => $m['response_time_ms'] ?? null)
            ->filter()
            ->values()
            ->toArray();

        if (count($priorTimes) < self::RESPONSE_TIME_MIN_SAMPLES) {
            // Store baseline sample — tagged so it's excluded from future Z-scores
            return $this->createLog($submission, [
                'type'        => 'response_time',
                'severity'    => 'low',
                'question_id' => $questionId,
                'metadata'    => [
                    'question_id'      => $questionId,
                    'response_time_ms' => $responseTimeMs,
                    'note'             => 'baseline_building',
                    'timestamp'        => $payload['timestamp'] ?? now()->toISOString(),
                ],
                'occurred_at' => $payload['timestamp'] ?? now(),
            ]);
        }

        [$mean, $std] = $this->meanStd($priorTimes);

        if ($std < 1) return null;

        $zScore = abs($responseTimeMs - $mean) / $std;

        if ($zScore < self::RESPONSE_TIME_Z_THRESHOLD) return null;

        $severity = $zScore >= 4.0 ? 'high' : 'medium';
        $summary  = $this->getOrCreateSummary($submission);

        $log = $this->createLog($submission, [
            'type'        => 'response_time',
            'severity'    => $severity,
            'question_id' => $questionId,
            'metadata'    => [
                'question_id'      => $questionId,
                'response_time_ms' => $responseTimeMs,
                'z_score'          => round($zScore, 3),
                'mean_ms'          => round($mean, 1),
                'std_ms'           => round($std, 1),
                'direction'        => $responseTimeMs < $mean ? 'too_fast' : 'too_slow',
                'timestamp'        => $payload['timestamp'] ?? now()->toISOString(),
            ],
            'occurred_at' => $payload['timestamp'] ?? now(),
        ]);

        $summary->increment('response_time_anomaly_count');
        $summary->refresh()->recalculate();

        return $log;
    }

    public function processKeystrokeDynamics(ExamSubmission $submission, array $payload): ?ExamAnomalyLog
    {
        $questionId  = $payload['question_id']    ?? null;
        $dwellTimes  = $payload['dwell_times_ms'] ?? [];
        $flightTimes = $payload['flight_times_ms'] ?? [];
        $totalChars  = $payload['total_chars']    ?? 0;
        $durationMs  = $payload['duration_ms']    ?? 0;

        if (!$questionId || count($dwellTimes) < 5 || $durationMs <= 0) {
            return null;
        }

        $avgDwell  = array_sum($dwellTimes)  / count($dwellTimes);
        $avgFlight = count($flightTimes) > 0
            ? array_sum($flightTimes) / count($flightTimes)
            : 0;

        $wpm = ($totalChars / 5) / ($durationMs / 60000);

        // Rule 1: Impossibly fast typing
        if ($wpm > self::KEYSTROKE_MAX_WPM) {
            $summary = $this->getOrCreateSummary($submission);

            $log = $this->createLog($submission, [
                'type'        => 'keystroke_dynamics',
                'severity'    => 'high',
                'question_id' => $questionId,
                'metadata'    => [
                    'question_id'   => $questionId,
                    'avg_dwell_ms'  => round($avgDwell, 1),
                    'avg_flight_ms' => round($avgFlight, 1),
                    'wpm'           => round($wpm, 1),
                    'reason'        => 'impossible_speed',
                    'timestamp'     => $payload['timestamp'] ?? now()->toISOString(),
                ],
                'occurred_at' => $payload['timestamp'] ?? now(),
            ]);

            $summary->increment('keystroke_anomaly_count');
            $summary->refresh()->recalculate();
            return $log;
        }

        // Rule 2: Z-score vs session baseline (excluding baseline_building rows)
        $priorWpms = ExamAnomalyLog::where('submission_id', $submission->id)
            ->where('type', 'keystroke_dynamics')
            ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.note')) != 'baseline_building'
                        OR JSON_EXTRACT(metadata, '$.note') IS NULL")
            ->pluck('metadata')
            ->map(fn ($m) => $m['wpm'] ?? null)
            ->filter()
            ->values()
            ->toArray();

        if (count($priorWpms) < self::RESPONSE_TIME_MIN_SAMPLES) {
            return $this->createLog($submission, [
                'type'        => 'keystroke_dynamics',
                'severity'    => 'low',
                'question_id' => $questionId,
                'metadata'    => [
                    'question_id'   => $questionId,
                    'avg_dwell_ms'  => round($avgDwell, 1),
                    'avg_flight_ms' => round($avgFlight, 1),
                    'wpm'           => round($wpm, 1),
                    'note'          => 'baseline_building',
                    'timestamp'     => $payload['timestamp'] ?? now()->toISOString(),
                ],
                'occurred_at' => $payload['timestamp'] ?? now(),
            ]);
        }

        [$meanWpm, $stdWpm] = $this->meanStd($priorWpms);

        if ($stdWpm < 1) return null;

        $zScore = abs($wpm - $meanWpm) / $stdWpm;

        if ($zScore < self::KEYSTROKE_Z_THRESHOLD) return null;

        $severity = $zScore >= 4.0 ? 'high' : 'medium';
        $summary  = $this->getOrCreateSummary($submission);

        $log = $this->createLog($submission, [
            'type'        => 'keystroke_dynamics',
            'severity'    => $severity,
            'question_id' => $questionId,
            'metadata'    => [
                'question_id'   => $questionId,
                'avg_dwell_ms'  => round($avgDwell, 1),
                'avg_flight_ms' => round($avgFlight, 1),
                'wpm'           => round($wpm, 1),
                'z_score'       => round($zScore, 3),
                'baseline_wpm'  => round($meanWpm, 1),
                'reason'        => 'statistical_deviation',
                'timestamp'     => $payload['timestamp'] ?? now()->toISOString(),
            ],
            'occurred_at' => $payload['timestamp'] ?? now(),
        ]);

        $summary->increment('keystroke_anomaly_count');
        $summary->refresh()->recalculate();

        return $log;
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private function getOrCreateSummary(ExamSubmission $submission): ExamAnomalySummary
    {
        return ExamAnomalySummary::firstOrCreate(
            ['submission_id' => $submission->id],
            [
                'exam_id'    => $submission->exam_id,
                'student_id' => $submission->student_id,
            ]
        );
    }

    private function createLog(ExamSubmission $submission, array $data): ExamAnomalyLog
    {
        return ExamAnomalyLog::create([
            'submission_id' => $submission->id,
            'exam_id'       => $submission->exam_id,
            'student_id'    => $submission->student_id,
            'question_id'   => $data['question_id'] ?? null,
            'type'          => $data['type'],
            'severity'      => $data['severity'],
            'metadata'      => $data['metadata'] ?? [],
            'occurred_at'   => $data['occurred_at'] ?? now(),
        ]);
    }

    private function meanStd(array $values): array
    {
        $n        = count($values);
        $mean     = array_sum($values) / $n;
        $variance = array_sum(array_map(fn ($v) => ($v - $mean) ** 2, $values)) / $n;
        return [$mean, sqrt($variance)];
    }
}