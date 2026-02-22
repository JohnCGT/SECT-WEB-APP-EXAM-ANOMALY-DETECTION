<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ExamAnomalyLog
 *
 * One row per anomaly event captured during an exam session.
 * Severity is stored as 'low' by default — the Python Flask service
 * will compute real severity using the appropriate algorithm per type:
 *
 *   tab_switch         → Isolation Forest
 *   keyboard_shortcut  → One-Class SVM
 *   response_time      → Z-Score Method
 *   keystroke_dynamics → Hidden Markov Model
 *
 * Raw feature data is stored in the metadata JSON column so Flask
 * can perform feature extraction without re-querying the DB.
 *
 * metadata structure per type:
 * ─────────────────────────────────────────────────────────────────────
 *
 * tab_switch:
 * {
 *   "cumulative_switches": 3,
 *   "hidden_duration_ms": 4200,
 *   "client_timestamp": "2025-01-01T10:05:00Z"
 * }
 *
 * keyboard_shortcut:
 * {
 *   "keys": "Ctrl+C",
 *   "cumulative_count": 2,
 *   "is_paste": false,
 *   "pasted_char_count": 0,
 *   "paste_index": null,
 *   "client_timestamp": "2025-01-01T10:06:00Z"
 * }
 *
 * response_time:
 * {
 *   "question_id": 42,
 *   "response_time_ms": 850,
 *   "question_position": 3,
 *   "previous_times_ms": [12000, 8000, 15000],
 *   "client_timestamp": "2025-01-01T10:07:00Z"
 * }
 *
 * keystroke_dynamics:
 * {
 *   "question_id": 42,
 *   "dwell_times_ms": [95, 110, 88],
 *   "flight_times_ms": [210, 190, 230],
 *   "avg_dwell_ms": 97.67,
 *   "avg_flight_ms": 210.0,
 *   "wpm": 145.0,
 *   "total_chars": 120,
 *   "paste_count": 0,
 *   "duration_ms": 48000,
 *   "keystroke_count": 3,
 *   "client_timestamp": "2025-01-01T10:08:00Z"
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