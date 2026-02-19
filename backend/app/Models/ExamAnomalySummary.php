<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ExamAnomalySummary
 *
 * A live risk profile for one exam submission.
 * Updated incrementally each time a new anomaly event is logged,
 * so instructors can query a single row instead of aggregating logs.
 *
 * Risk score formula (0–100):
 *   base = tab_switch_count        * 5
 *        + keyboard_shortcut_count * 8
 *        + response_time_count     * 6
 *        + keystroke_count         * 7
 *   clamped to 100
 *
 * Flag thresholds:
 *   none    → risk_score  0–19
 *   warning → risk_score 20–49
 *   flagged → risk_score 50+
 */
class ExamAnomalySummary extends Model
{
    protected $fillable = [
        'submission_id',
        'exam_id',
        'student_id',
        'tab_switch_count',
        'keyboard_shortcut_count',
        'response_time_anomaly_count',
        'keystroke_anomaly_count',
        'risk_score',
        'flag_status',
        'last_anomaly_at',
    ];

    protected $casts = [
        'last_anomaly_at' => 'datetime',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function submission(): BelongsTo
    {
        return $this->belongsTo(ExamSubmission::class, 'submission_id');
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Recalculate and persist risk_score + flag_status from current counts.
     * Call after incrementing any counter column.
     */
    public function recalculate(): void
    {
        $score = min(100,
            ($this->tab_switch_count        * 5)  +
            ($this->keyboard_shortcut_count * 8)  +
            ($this->response_time_anomaly_count * 6) +
            ($this->keystroke_anomaly_count * 7)
        );

        $flag = match(true) {
            $score >= 50 => 'flagged',
            $score >= 20 => 'warning',
            default      => 'none',
        };

        $this->update([
            'risk_score'  => $score,
            'flag_status' => $flag,
        ]);
    }
}
