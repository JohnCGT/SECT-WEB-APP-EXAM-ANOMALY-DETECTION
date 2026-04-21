<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'phone',
        'course',
        'year_level',
    ];

    protected $hidden = [
        'password',
    ];

    public $timestamps = true;

    /* ── Role helpers ── */
    public function isAdmin()      { return $this->role === 'admin'; }
    public function isInstructor() { return $this->role === 'instructor'; }
    public function isStudent()    { return $this->role === 'student'; }

    /* ── Status helpers ── */
    public function isActive()    { return ($this->status ?? 'active') === 'active'; }
    public function isSuspended() { return $this->status === 'suspended'; }

    /* ── Instructor: courses they teach ── */
    public function courses()
    {
        return $this->hasMany(Course::class, 'instructor_id');
    }

    /* ── Student: courses they are enrolled in ── */
    public function enrolledCourses()
    {
        return $this->belongsToMany(
            Course::class,
            'course_students',
            'student_id',
            'course_id'
        )
        ->withPivot('enrolled_at')
        ->withTimestamps();
    }
}