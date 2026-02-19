<?php

namespace App\Services;

use App\Models\ExamAnomalyLog;
use App\Models\ExamAnomalySummary;
use App\Models\ExamSubmission;

/**
 * AnomalyDetectionService
 *
 * Central service that receives raw event data from the frontend collectors,
 * applies server-side analysis, persists log entries, and updates the
 * per-submission risk summary.
 *
 * All public methods return the created ExamAnomalyLog model so the
 * controller can return it in the API response.
 */
class AnomalyDetectionService
{
    // ── Thresholds ─────────────────────────────────────────────────────────

    /** Tab switches that trigger medium / high severity */
    private const TAB_MEDIUM = 3;
    private const TAB_HIGH   = 6;

    /**
     * Keyboard combos that are always suspicious in an exam context.
     * The frontend sends a normalized string like "Ctrl+C".
     */
    private const BLOCKED_SHORTCUTS = [
        'Ctrl+C', 'Ctrl+V', 'Ctrl+X',          // clipboard
        'Ctrl+A',                                 // select all
        'Ctrl+F', 'Ctrl+G',                      // find/search
        'Ctrl+T', 'Ctrl+W', 'Ctrl+N',           // tab/window mgmt
        'Alt+Tab', 'Meta+Tab',                   // window switch
        'F12', 'Ctrl+Shift+I', 'Ctrl+Shift+J',  // dev tools
        'Ctrl+U',                                 // view source
        'PrintScreen',                            // screenshot
    ];

    /** Z-score threshold above which a response time is anomalous */
    private const RESPONSE_TIME_Z_THRESHOLD = 2.5;

    /** Minimum answers needed before we start comparing response times */
    private const RESPONSE_TIME_MIN_SAMPLES = 3;

    /** Z-score threshold for keystroke dynamics */
    private const KEYSTROKE_Z_THRESHOLD = 2.5;

    /** WPM above which typing is humanly implausible (auto-fill suspicion) */
    private const KEYSTROKE_MAX_WPM = 120;

    // ── Public API ─────────────────────────────────────────────────────────

    /**
     * Process a tab-switch event.
     *
     * @param  ExamSubmission $submission
     * @param  array          $payload  { hidden_duration_ms, timestamp }
     * @return ExamAnomalyLog
     */
    public function processTabSwitch(ExamSubmission $submission, array $payload): ExamAnomalyLog
    {
        $summary = $this->getOrCreateSummary($submission);
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
                'count_in_session'  => $newCount,
                'hidden_duration_ms'=> $payload['hidden_duration_ms'] ?? null,
                'timestamp'         => $payload['timestamp'] ?? now()->toISOString(),
            ],
            'occurred_at' => $payload['timestamp'] ?? now(),
        ]);

        $summary->increment('tab_switch_count');
        $summary->refresh()->recalculate();

        return $log;
    }

    /**
     * Process a keyboard shortcut event.
     *
     * @param  ExamSubmission $submission
     * @param  array          $payload  { keys, timestamp }
     * @return ExamAnomalyLog|null  null if the shortcut is not suspicious
     */
    public function processKeyboardShortcut(ExamSubmission $submission, array $payload): ?ExamAnomalyLog
    {
        $keys = $payload['keys'] ?? '';

        if (!in_array($keys, self::BLOCKED_SHORTCUTS, true)) {
            return null; // Not a suspicious combo — ignore
        }

        $summary = $this->getOrCreateSummary($submission);

        // Clipboard shortcuts are high; developer-tool shortcuts are high; rest medium
        $highPatterns = ['F12', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+U', 'PrintScreen'];
        $severity = in_array($keys, $highPatterns, true) ? 'high' : 'medium';

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

    /**
     * Process a question response-time event.
     *
     * The frontend records how long (ms) the student spent on a question
     * before submitting an answer. We compare this against the student's
     * own mean / std from previous questions in the same session using a
     * Z-score. An extremely short time may indicate copy-paste or lookup;
     * an extremely long time may indicate distraction or external help.
     *
     * @param  ExamSubmission $submission
     * @param  array          $payload  { question_id, response_time_ms, timestamp }
     * @return ExamAnomalyLog|null
     */
    public function processResponseTime(ExamSubmission $submission, array $payload): ?ExamAnomalyLog
    {
        $questionId    = $payload['question_id']    ?? null;
        $responseTimeMs = $payload['response_time_ms'] ?? null;

        if (!$questionId || !$responseTimeMs || $responseTimeMs <= 0) {
            return null;
        }

        // Pull prior response times for this student in this session
        $priorTimes = ExamAnomalyLog::where('submission_id', $submission->id)
            ->where('type', 'response_time')
            ->pluck('metadata')
            ->map(fn ($m) => $m['response_time_ms'] ?? null)
            ->filter()
            ->values()
            ->toArray();

        if (count($priorTimes) < self::RESPONSE_TIME_MIN_SAMPLES) {
            // Not enough data yet — store the time but don't flag
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

        if ($std < 1) {
            return null; // All times identical — skip to avoid division by zero
        }

        $zScore = abs($responseTimeMs - $mean) / $std;

        if ($zScore < self::RESPONSE_TIME_Z_THRESHOLD) {
            return null; // Within normal range
        }

        // Severity: z ≥ 4 is high, z ≥ 2.5 is medium
        $severity = $zScore >= 4.0 ? 'high' : 'medium';

        $summary = $this->getOrCreateSummary($submission);

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

    /**
     * Process a keystroke-dynamics event.
     *
     * The frontend records dwell times (key-hold duration) and flight times
     * (gap between key releases and next key press) for each answer field.
     * We derive WPM and compare against the session baseline.
     *
     * @param  ExamSubmission $submission
     * @param  array          $payload  {
     *           question_id,
     *           dwell_times_ms  : int[],   // hold durations
     *           flight_times_ms : int[],   // between-key gaps
     *           total_chars     : int,
     *           duration_ms     : int,     // total typing time
     *           timestamp       : string
     *         }
     * @return ExamAnomalyLog|null
     */
    public function processKeystrokeDynamics(ExamSubmission $submission, array $payload): ?ExamAnomalyLog
    {
        $questionId  = $payload['question_id']    ?? null;
        $dwellTimes  = $payload['dwell_times_ms'] ?? [];
        $flightTimes = $payload['flight_times_ms'] ?? [];
        $totalChars  = $payload['total_chars']    ?? 0;
        $durationMs  = $payload['duration_ms']    ?? 0;

        if (!$questionId || count($dwellTimes) < 5 || $durationMs <= 0) {
            return null; // Not enough data to be meaningful
        }

        $avgDwell  = array_sum($dwellTimes)  / count($dwellTimes);
        $avgFlight = count($flightTimes) > 0
            ? array_sum($flightTimes) / count($flightTimes)
            : 0;

        // WPM: assume average word = 5 characters
        $wpm = ($totalChars / 5) / ($durationMs / 60000);

        // ── Rule 1: Impossibly fast typing ──────────────────────────────
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

        // ── Rule 2: Z-score against session baseline ─────────────────────
        $priorWpms = ExamAnomalyLog::where('submission_id', $submission->id)
            ->where('type', 'keystroke_dynamics')
            ->pluck('metadata')
            ->map(fn ($m) => $m['wpm'] ?? null)
            ->filter()
            ->values()
            ->toArray();

        if (count($priorWpms) < self::RESPONSE_TIME_MIN_SAMPLES) {
            // Store baseline sample, no flag yet
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

        if ($stdWpm < 1) {
            return null;
        }

        $zScore = abs($wpm - $meanWpm) / $stdWpm;

        if ($zScore < self::KEYSTROKE_Z_THRESHOLD) {
            return null;
        }

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

    /**
     * Returns [mean, standard_deviation] for an array of numbers.
     *
     * @param  float[] $values
     * @return array{float, float}
     */
    private function meanStd(array $values): array
    {
        $n    = count($values);
        $mean = array_sum($values) / $n;
        $variance = array_sum(array_map(fn ($v) => ($v - $mean) ** 2, $values)) / $n;

        return [$mean, sqrt($variance)];
    }
}
