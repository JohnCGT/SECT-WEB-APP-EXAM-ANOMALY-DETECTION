<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ResponseTimeLog  →  Z-Score Method
 *
 * is_baseline  — true = baseline-building row, excluded from z-score queries
 * z_score      — computed z-score (null for baseline rows)
 * direction    — 'too_fast' | 'too_slow' (null for baseline rows)
 */
class ResponseTimeLog extends Model
{
    protected $table = 'response_time_logs';

    protected $fillable = [
        'submission_id', 'exam_id', 'student_id', 'question_id',
        'response_time_ms', 'question_position', 'previous_times_ms',
        'is_baseline', 'z_score', 'direction',
        'client_timestamp', 'severity',
        'reviewed', 'reviewer_notes', 'occurred_at',
    ];

    protected $casts = [
        'previous_times_ms' => 'array',
        'is_baseline'       => 'boolean',
        'reviewed'          => 'boolean',
        'occurred_at'       => 'datetime',
    ];

    public function submission(): BelongsTo { return $this->belongsTo(ExamSubmission::class, 'submission_id'); }
    public function exam(): BelongsTo       { return $this->belongsTo(Exam::class); }
    public function student(): BelongsTo    { return $this->belongsTo(User::class, 'student_id'); }
    public function question(): BelongsTo   { return $this->belongsTo(Question::class); }
}