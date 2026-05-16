<?php

namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

/**
 * ActivityLogController
 *
 * Admin endpoint:
 *   GET /admin/activity-logs
 *
 * Query parameters (all optional):
 *   role      — filter by user role: admin | instructor | student
 *   event     — filter by event key or prefix (e.g. "exam" matches exam.*)
 *   search    — full-text search on user_name, user_email, description
 *   from      — ISO date start  e.g. 2026-05-01
 *   to        — ISO date end    e.g. 2026-05-31
 *   per_page  — default 50, max 200
 */
class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::query()
            ->orderByDesc('occurred_at');

        // ── Role filter ───────────────────────────────────────────────────
        if ($role = $request->input('role')) {
            $query->where('user_role', $role);
        }

        // ── Event filter (prefix match) ───────────────────────────────────
        if ($event = $request->input('event')) {
            // "exam" matches exam.created, exam.updated, exam.deleted, etc.
            $query->where(function ($q) use ($event) {
                $q->where('event', $event)
                  ->orWhere('event', 'like', $event . '.%');
            });
        }

        // ── Full-text search ──────────────────────────────────────────────
        if ($search = $request->input('search')) {
            $like = '%' . $search . '%';
            $query->where(function ($q) use ($like) {
                $q->where('user_name',   'like', $like)
                  ->orWhere('user_email', 'like', $like)
                  ->orWhere('description', 'like', $like);
            });
        }

        // ── Date range ────────────────────────────────────────────────────
        if ($from = $request->input('from')) {
            $query->whereDate('occurred_at', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $query->whereDate('occurred_at', '<=', $to);
        }

        // ── Pagination ────────────────────────────────────────────────────
        $perPage = min((int) ($request->input('per_page', 50)), 200);
        $logs    = $query->paginate($perPage);

        // ── Summary counts for the stat chips ────────────────────────────
        // These always count the full unfiltered set (last 30 days)
        $since = now()->subDays(30);
        $summary = [
            'total_30d'      => ActivityLog::where('occurred_at', '>=', $since)->count(),
            'logins_30d'     => ActivityLog::where('event', 'login')
                                           ->where('occurred_at', '>=', $since)->count(),
            'instructor_30d' => ActivityLog::where('user_role', 'instructor')
                                           ->where('occurred_at', '>=', $since)->count(),
            'student_30d'    => ActivityLog::where('user_role', 'student')
                                           ->where('occurred_at', '>=', $since)->count(),
        ];

        return response()->json([
            'data'    => $logs->items(),
            'meta'    => [
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'per_page'     => $logs->perPage(),
                'total'        => $logs->total(),
            ],
            'summary' => $summary,
        ]);
    }
}