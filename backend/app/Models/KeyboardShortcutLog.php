<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * KeyboardShortcutLog  →  One-Class SVM
 *
 * keys               — combo label e.g. "Ctrl+V"
 * cumulative_count   — running total of shortcuts in this session
 * is_paste           — true for Ctrl+V / Meta+V / Paste
 * pasted_char_count  — characters pasted (0 when not a paste)
 * paste_index        — nth paste in the session (null when not a paste)
 * svm_score          — decision function value backfilled by Flask
 */
class KeyboardShortcutLog extends Model
{
    protected $table = 'keyboard_shortcut_logs';

    protected $fillable = [
        'submission_id', 'exam_id', 'student_id', 'question_id',
        'keys', 'cumulative_count', 'is_paste', 'pasted_char_count', 'paste_index',
        'client_timestamp', 'severity', 'svm_score',
        'reviewed', 'reviewer_notes', 'occurred_at',
    ];

    protected $casts = [
        'is_paste'    => 'boolean',
        'reviewed'    => 'boolean',
        'occurred_at' => 'datetime',
    ];

    public function submission(): BelongsTo { return $this->belongsTo(ExamSubmission::class, 'submission_id'); }
    public function exam(): BelongsTo       { return $this->belongsTo(Exam::class); }
    public function student(): BelongsTo    { return $this->belongsTo(User::class, 'student_id'); }
    public function question(): BelongsTo   { return $this->belongsTo(Question::class); }
}