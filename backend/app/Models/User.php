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
    ];

    protected $hidden = [
        'password',
    ];

    public $timestamps = true;

    /* ── Role helpers ── */
    public function isAdmin()      { return $this->role === 'admin'; }
    public function isInstructor() { return $this->role === 'instructor'; }
    public function isStudent()    { return $this->role === 'student'; }

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
            'course_students', // pivot table
            'student_id',      // FK for this model (User)
            'course_id'        // FK for related model (Course)
        )
        ->withPivot('enrolled_at')
        ->withTimestamps();
    }
}
