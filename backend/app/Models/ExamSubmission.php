<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ExamSubmission extends Model
{
    protected $fillable = [
        'exam_id', 'student_id',
        'started_at', 'submitted_at',
        'score', 'total_points', 'status', 'answers',
    ];

    protected $casts = [
        'started_at'   => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function exam(): BelongsTo    { return $this->belongsTo(Exam::class); }
    public function student(): BelongsTo { return $this->belongsTo(User::class, 'student_id'); }
    public function answers(): HasMany   { return $this->hasMany(ExamAnswer::class, 'submission_id'); }

    // ── Anomaly relationships ──────────────────────────────────────────────
    public function anomalySummary(): HasOne        { return $this->hasOne(ExamAnomalySummary::class, 'submission_id'); }
    public function tabSwitchLogs(): HasMany         { return $this->hasMany(TabSwitchLog::class, 'submission_id'); }
    public function keyboardShortcutLogs(): HasMany  { return $this->hasMany(KeyboardShortcutLog::class, 'submission_id'); }
    public function responseTimeLogs(): HasMany      { return $this->hasMany(ResponseTimeLog::class, 'submission_id'); }
    public function keystrokeDynamicsLogs(): HasMany { return $this->hasMany(KeystrokeDynamicsLog::class, 'submission_id'); }
}