<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ExamAnomalySummary
 *
 * One row per submission. Stores running counts and a risk score
 * so instructors can see a live overview without scanning every log.
 *
 * Risk score is a placeholder computation until Flask returns real scores.
 * Formula (0–100):
 *   base = tab_switch_count        * 5
 *        + keyboard_shortcut_count * 8
 *        + response_time_count     * 6
 *        + keystroke_count         * 7
 *   clamped to 100
 *
 * Flag thresholds:
 *   none    → 0–19
 *   warning → 20–49
 *   flagged → 50+
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

    /**
     * Recalculate risk_score and flag_status from current counts.
     * Called after every new anomaly event is logged.
     * Will be replaced by Flask ML scores in a future update.
     */
    public function recalculate(): void
    {
        $score = min(100,
            ($this->tab_switch_count             * 5) +
            ($this->keyboard_shortcut_count      * 8) +
            ($this->response_time_anomaly_count  * 6) +
            ($this->keystroke_anomaly_count      * 7)
        );

        $flag = match (true) {
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