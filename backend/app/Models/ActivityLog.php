<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;

/**
 * ActivityLog model
 *
 * Usage anywhere in a controller:
 *
 *   use App\Models\ActivityLog;
 *
 *   ActivityLog::record($request->user(), 'exam.created', 'Juan created exam "Midterm 2026"', [
 *       'exam_id'    => $exam->id,
 *       'exam_title' => $exam->title,
 *   ], $request, $exam->id, 'Exam');
 *
 * Or with the shorter form (no subject, no request):
 *
 *   ActivityLog::record($user, 'login', 'User logged in');
 */
class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'user_name',
        'user_email',
        'user_role',
        'event',
        'description',
        'properties',
        'subject_id',
        'subject_type',
        'ip_address',
        'user_agent',
        'occurred_at',
    ];

    protected $casts = [
        'properties'  => 'array',
        'occurred_at' => 'datetime',
    ];

    /* ── Relationship ─────────────────────────────────────────────────── */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /* ── Static helper ────────────────────────────────────────────────── */

    /**
     * @param  \App\Models\User|null  $user
     * @param  string                 $event        e.g. 'exam.created'
     * @param  string|null            $description  Human-readable sentence
     * @param  array                  $properties   Extra JSON context
     * @param  Request|null           $request      For IP + User-Agent
     * @param  int|null               $subjectId    e.g. exam id
     * @param  string|null            $subjectType  e.g. 'Exam'
     */
    public static function record(
        $user,
        string $event,
        ?string $description = null,
        array $properties = [],
        ?Request $request = null,
        ?int $subjectId = null,
        ?string $subjectType = null
    ): self {
        return static::create([
            'user_id'      => $user?->id,
            'user_name'    => $user?->name,
            'user_email'   => $user?->email,
            'user_role'    => $user?->role,
            'event'        => $event,
            'description'  => $description,
            'properties'   => $properties ?: null,
            'subject_id'   => $subjectId,
            'subject_type' => $subjectType,
            'ip_address'   => $request?->ip(),
            'user_agent'   => $request ? substr($request->userAgent() ?? '', 0, 500) : null,
            'occurred_at'  => now(),
        ]);
    }
}