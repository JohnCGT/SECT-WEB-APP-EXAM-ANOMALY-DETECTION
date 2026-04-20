<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exam extends Model
{
    protected $fillable = [
        'course_id',
        'instructor_id',
        'title',
        'description',
        'type',
        'start_time',
        'end_time',
        'duration_minutes',
        'total_points',
        'status',
        'face_detection',
        'tab_switching_monitor',
        'mouse_tracking',
        'keyboard_analysis',
        'screen_recording',
        'isolation_forest',
        'shuffle_questions',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'face_detection' => 'boolean',
        'tab_switching_monitor' => 'boolean',
        'mouse_tracking' => 'boolean',
        'keyboard_analysis' => 'boolean',
        'screen_recording' => 'boolean',
        'isolation_forest' => 'boolean',
        'shuffle_questions' => 'boolean',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(ExamSubmission::class);
    }
    
}