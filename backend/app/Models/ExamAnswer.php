<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAnswer extends Model
{
    protected $fillable = [
        'submission_id',
        'question_id',
        'answer',
        'points_earned',
        'is_correct',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(ExamSubmission::class, 'submission_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}