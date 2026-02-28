<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TabSwitchLog  →  Isolation Forest
 *
 * is_return_event  — false = hide ping (duration=0, not counted in summary)
 *                    true  = return event with real duration (counted)
 * if_score         — raw anomaly score backfilled by Flask
 */
class TabSwitchLog extends Model
{
    protected $table = 'tab_switch_logs';

    protected $fillable = [
        'submission_id', 'exam_id', 'student_id',
        'cumulative_switches', 'hidden_duration_ms',
        'is_return_event', 'client_timestamp',
        'severity', 'if_score',
        'reviewed', 'reviewer_notes', 'occurred_at',
    ];

    protected $casts = [
        'is_return_event' => 'boolean',
        'reviewed'        => 'boolean',
        'occurred_at'     => 'datetime',
    ];

    public function submission(): BelongsTo { return $this->belongsTo(ExamSubmission::class, 'submission_id'); }
    public function exam(): BelongsTo       { return $this->belongsTo(Exam::class); }
    public function student(): BelongsTo    { return $this->belongsTo(User::class, 'student_id'); }
}