<?php

namespace App\Models;

// ── Required for Sanctum token-based authentication ──────────────────────────
// Without HasApiTokens, auth()->user() returns null or throws "undefined method"
// errors because Sanctum can't resolve the user from the Bearer token.
use Laravel\Sanctum\HasApiTokens;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    // HasApiTokens MUST be first — it overrides createToken(), tokens(), etc.
    use HasApiTokens, HasFactory, Notifiable;

    // ── Mass-assignable fields ────────────────────────────────────────────────
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',      // 'instructor' | 'student'
    ];

    // ── Hidden from serialization ─────────────────────────────────────────────
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // ── Casts ─────────────────────────────────────────────────────────────────
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
    ];

    // ── Role helpers ──────────────────────────────────────────────────────────
    public function isInstructor(): bool
    {
        return $this->role === 'instructor';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    /** Courses this student is enrolled in (many-to-many) */
    public function courses()
    {
        return $this->belongsToMany(Course::class, 'course_student', 'user_id', 'course_id')
                    ->withTimestamps()
                    ->withPivot('enrolled_at');
    }

    /** Exam submissions made by this student */
    public function examSubmissions()
    {
        return $this->hasMany(ExamSubmission::class, 'student_id');
    }

    /** Anomaly logs generated for this student */
    public function anomalyLogs()
    {
        return $this->hasMany(ExamAnomalyLog::class, 'student_id');
    }

    /** Courses created by this instructor */
    public function instructorCourses()
    {
        return $this->hasMany(Course::class, 'instructor_id');
    }
}