<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * KeystrokeDynamicsLog  →  Hidden Markov Model
 *
 * is_baseline   — true = baseline-building row, excluded from z-score wpm queries
 * z_score       — statistical deviation score (null for baseline / impossible_speed rows)
 * reason        — 'impossible_speed' | 'statistical_deviation' | 'baseline_building'
 * hmm_log_prob  — log-emission-probability backfilled by Flask
 */
class KeystrokeDynamicsLog extends Model
{
    protected $table = 'keystroke_dynamics_logs';

    protected $fillable = [
        'submission_id', 'exam_id', 'student_id', 'question_id',
        'dwell_times_ms', 'flight_times_ms',
        'avg_dwell_ms', 'avg_flight_ms', 'wpm',
        'total_chars', 'paste_count', 'duration_ms', 'keystroke_count',
        'is_baseline', 'z_score', 'reason',
        'client_timestamp', 'severity', 'hmm_log_prob',
        'reviewed', 'reviewer_notes', 'occurred_at',
    ];

    protected $casts = [
        'dwell_times_ms'  => 'array',
        'flight_times_ms' => 'array',
        'is_baseline'     => 'boolean',
        'reviewed'        => 'boolean',
        'occurred_at'     => 'datetime',
    ];

    public function submission(): BelongsTo { return $this->belongsTo(ExamSubmission::class, 'submission_id'); }
    public function exam(): BelongsTo       { return $this->belongsTo(Exam::class); }
    public function student(): BelongsTo    { return $this->belongsTo(User::class, 'student_id'); }
    public function question(): BelongsTo   { return $this->belongsTo(Question::class); }
}