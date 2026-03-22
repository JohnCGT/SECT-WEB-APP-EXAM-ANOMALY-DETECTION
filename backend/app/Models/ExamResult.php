<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamResult extends Model
{
    protected $fillable = [
        'submission_id',
        'exam_id',
        'student_id',
        'is_flagged',
        'cpi_score',
        'cpi_label',
        // Per-algorithm flags (Flask writes these)
        'iso_tab_flagged',
        'svm_flagged',
        'rt_flagged',
        'hmm_flagged',
        // Per-algorithm scores (Flask writes these)
        'iso_tab_score',
        'svm_score',
        'rt_score',
        'hmm_score',
        // Raw event counters (Laravel service writes these)
        'tab_switch_count',
        'keyboard_shortcut_count',
        'response_time_anomaly_count',
        'keystroke_anomaly_count',
        'processed_at',
    ];

    protected $casts = [
        'is_flagged'       => 'boolean',
        'iso_tab_flagged'  => 'boolean',
        'svm_flagged'      => 'boolean',
        'rt_flagged'       => 'boolean',
        'hmm_flagged'      => 'boolean',
        'processed_at'     => 'datetime',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(ExamSubmission::class);
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}