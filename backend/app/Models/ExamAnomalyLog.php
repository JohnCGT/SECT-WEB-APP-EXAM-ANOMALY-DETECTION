<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ExamAnomalyLog
 *
 * Represents a single anomaly event captured during an exam session.
 *
 * metadata JSON structure per type
 * ──────────────────────────────────────────────────────────────────────────
 *
 * tab_switch:
 * {
 *   "count_in_session": 3,          // cumulative switches so far
 *   "hidden_duration_ms": 4200,     // how long the tab was hidden (ms)
 *   "timestamp": "2025-01-01T10:05:00Z"
 * }
 *
 * keyboard_shortcut:
 * {
 *   "keys": "Ctrl+C",               // the key combo pressed
 *   "timestamp": "2025-01-01T10:06:00Z"
 * }
 *
 * response_time:
 * {
 *   "question_id": 42,
 *   "response_time_ms": 850,        // time from question display to answer
 *   "z_score": 2.9,                 // deviation from student's mean response time
 *   "mean_ms": 12000,
 *   "std_ms": 3800
 * }
 *
 * keystroke_dynamics:
 * {
 *   "question_id": 42,
 *   "avg_dwell_ms": 95,             // average key-hold duration
 *   "avg_flight_ms": 210,           // average between-key gap
 *   "wpm": 145,                     // calculated words-per-minute
 *   "z_score": 3.1,
 *   "baseline_wpm": 62              // student's established baseline
 * }
 */
class ExamAnomalyLog extends Model
{
    protected $fillable = [
        'submission_id',
        'exam_id',
        'student_id',
        'question_id',
        'type',
        'severity',
        'metadata',
        'reviewed',
        'reviewer_notes',
        'occurred_at',
    ];

    protected $casts = [
        'metadata'    => 'array',
        'reviewed'    => 'boolean',
        'occurred_at' => 'datetime',
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

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
