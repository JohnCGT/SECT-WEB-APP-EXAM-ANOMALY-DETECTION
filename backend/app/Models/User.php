<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * Fields that can be mass assigned
     * These are the fields we can fill when creating a user
     */
    protected $fillable = [
        'name',      // User's full name
        'email',     // User's email
        'password',  // User's password (will be hashed)
        'role',      // User's role (admin/instructor/student)
    ];

    /**
     * Fields to hide in JSON responses
     * Password should never be sent to frontend
     */
    protected $hidden = [
        'password',
    ];

    /**
     * Enable automatic timestamp management
     * Laravel will automatically set created_at and updated_at
     */
    public $timestamps = true;

    /**
     * Check if user is admin
     */
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is instructor
     */
    public function isInstructor()
    {
        return $this->role === 'instructor';
    }

    /**
     * Check if user is student
     */
    public function isStudent()
    {
        return $this->role === 'student';
    }
}