<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KeystrokeBaseline extends Model
{
    protected $fillable = [
        'student_id',
        'flight_times_ms',
        'recorded_at',
    ];

    protected $casts = [
        'flight_times_ms' => 'array',
        'recorded_at'     => 'datetime',
    ];
}
