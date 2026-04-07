<?php

// backend/app/Http/Controllers/AdminDashboardController.php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamSubmission;
use App\Models\KeyboardShortcutLog;
use App\Models\KeystrokeDynamicsLog;
use App\Models\ResponseTimeLog;
use App\Models\TabSwitchLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    // ── Private guard ─────────────────────────────────────────────────────────

    private function authorizeAdmin(): void
    {
        if (!auth()->check() || !auth()->user()->isAdmin()) {
            abort(403, 'Forbidden: Admins only.');
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/admin/dashboard
    //
    // Returns four overview counters + the 10 most recent CPI results.
    //
    // Response shape:
    // {
    //   "total_users":       int,
    //   "active_exams":      int,
    //   "flagged_sessions":  int,
    //   "high_cpi_risk":     int,
    //   "recent_results":    ExamResult[] (with student + exam, ordered by processed_at desc)
    // }
    // ══════════════════════════════════════════════════════════════════════════
    public function dashboard()
    {
        $this->authorizeAdmin();

        $totalUsers      = User::count();
        $activeExams     = Exam::where('status', 'active')->count();
        $flaggedSessions = ExamResult::where('is_flagged', true)->count();
        $highCpiRisk     = ExamResult::where('cpi_score', '>=', 0.70)->count();

        $recentResults = ExamResult::with([
                'student:id,name,email',
                'exam:id,title,type',
            ])
            ->orderByDesc('processed_at')
            ->limit(10)
            ->get()
            ->map(fn($r) => $this->formatResult($r));

        return response()->json([
            'total_users'      => $totalUsers,
            'active_exams'     => $activeExams,
            'flagged_sessions' => $flaggedSessions,
            'high_cpi_risk'    => $highCpiRisk,
            'recent_results'   => $recentResults,
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/admin/exams
    //
    // Returns ALL exams across all instructors (admin-wide view).
    // Supports optional ?status= filter.
    //
    // Response shape:
    // {
    //   "data": Exam[] — each item includes course, instructor,
    //                    submissions_count, and flagged_count
    // }
    // ══════════════════════════════════════════════════════════════════════════
    public function exams(Request $request)
    {
        $this->authorizeAdmin();

        $query = Exam::with([
                'course:id,code,name',
                'instructor:id,name,email',
            ])
            ->withCount('submissions')
            ->withCount(['submissions as flagged_count' => function ($q) {
                // Count only submissions that have a flagged exam_result
                $q->whereHas('examResult', fn($r) => $r->where('is_flagged', true));
            }])
            ->orderByDesc('start_time');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $exams = $query->get()->map(fn($exam) => [
            'id'                => $exam->id,
            'title'             => $exam->title,
            'type'              => $exam->type,
            'status'            => $exam->status,
            'duration_minutes'  => $exam->duration_minutes,
            'total_points'      => $exam->total_points,
            'start_time'        => $exam->start_time,
            'end_time'          => $exam->end_time,
            'course'            => $exam->course,
            'instructor'        => $exam->instructor,
            'submissions_count' => $exam->submissions_count,
            'flagged_count'     => $exam->flagged_count,
        ]);

        return response()->json(['data' => $exams]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PATCH /api/admin/exams/{id}/status
    //
    // Toggle exam status. Admin can set any valid status value.
    // Body: { "status": "draft" | "scheduled" | "active" | "completed" }
    //
    // Response: { "message": string, "exam": { id, title, status } }
    // ══════════════════════════════════════════════════════════════════════════
    public function updateExamStatus(Request $request, int $id)
    {
        $this->authorizeAdmin();

        $exam = Exam::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:draft,scheduled,active,completed',
        ]);

        $exam->status = $validated['status'];
        $exam->save();

        return response()->json([
            'message' => 'Exam status updated.',
            'exam'    => [
                'id'     => $exam->id,
                'title'  => $exam->title,
                'status' => $exam->status,
            ],
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DELETE /api/admin/exams/{id}/sessions
    //
    // Wipes all student submissions for an exam so students can retake it.
    // Cascades to exam_answers, exam_results, and all four anomaly log tables
    // via the FK onDelete('cascade') constraints in your migrations.
    //
    // Response: { "message": string, "deleted_count": int }
    // ══════════════════════════════════════════════════════════════════════════
    public function resetSessions(int $id)
    {
        $this->authorizeAdmin();

        $exam = Exam::findOrFail($id);

        $deleted = ExamSubmission::where('exam_id', $id)->count();
        ExamSubmission::where('exam_id', $id)->delete();

        return response()->json([
            'message'       => "All {$deleted} session(s) for \"{$exam->title}\" have been reset.",
            'deleted_count' => $deleted,
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/admin/anomalies
    //
    // Returns a unified, paginated anomaly feed by merging all four log tables.
    // Query params:
    //   ?type      = tab_switch | keyboard_shortcut | response_time | keystroke
    //   ?severity  = low | medium | high
    //   ?exam_id   = int  (optional — filter to one exam)
    //   ?per_page  = int  (default 50)
    //
    // Response shape:
    // {
    //   "data": [
    //     {
    //       "id":          int,
    //       "type":        string,
    //       "severity":    string,
    //       "student":     { id, name, email },
    //       "exam":        { id, title },
    //       "occurred_at": ISO string,
    //       // type-specific fields:
    //       "hidden_duration_ms": int?,   -- tab_switch
    //       "keys":               string?,-- keyboard_shortcut
    //       "is_paste":           bool?,  -- keyboard_shortcut
    //       "z_score":            float?, -- response_time / keystroke
    //       "direction":          string?,-- response_time
    //       "wpm":                float?, -- keystroke
    //     },
    //     …
    //   ],
    //   "meta": { … pagination … }
    // }
    // ══════════════════════════════════════════════════════════════════════════
    public function anomalies(Request $request)
    {
        $this->authorizeAdmin();

        $type     = $request->input('type');
        $severity = $request->input('severity');
        $examId   = $request->input('exam_id');
        $perPage  = min((int) $request->input('per_page', 50), 200);

        // Build a merged result from whichever tables the filter allows
        $sources = [];

        if (!$type || $type === 'tab_switch') {
            $sources[] = $this->queryTabSwitch($severity, $examId);
        }
        if (!$type || $type === 'keyboard_shortcut') {
            $sources[] = $this->queryKeyboardShortcut($severity, $examId);
        }
        if (!$type || $type === 'response_time') {
            $sources[] = $this->queryResponseTime($severity, $examId);
        }
        if (!$type || $type === 'keystroke') {
            $sources[] = $this->queryKeystroke($severity, $examId);
        }

        // Merge, sort by occurred_at desc, and paginate in-memory.
        // For very large datasets consider converting to a DB VIEW or using
        // a raw UNION query; this approach is fine up to ~10k total rows.
        $merged = collect($sources)->flatten(1)->sortByDesc('occurred_at')->values();

        $page      = max(1, (int) $request->input('page', 1));
        $total     = $merged->count();
        $paginated = $merged->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'data' => $paginated,
            'meta' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage),
            ],
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/admin/logs
    //
    // Returns system activity logs.
    //
    // REQUIRES: composer require spatie/laravel-activitylog
    //           php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider"
    //           php artisan migrate
    //
    // Once installed, log admin actions like:
    //   activity()->causedBy($user)->log("User suspended: {$target->name}");
    //
    // Query params:
    //   ?event    = user_created | user_suspended | user_deleted |
    //               exam_enabled | exam_disabled | sessions_reset | admin_login …
    //   ?per_page = int (default 50)
    //
    // Response: { "data": Activity[], "meta": { pagination } }
    // ══════════════════════════════════════════════════════════════════════════
    public function logs(Request $request)
    {
        $this->authorizeAdmin();

        // Guard: check if spatie/laravel-activitylog is installed
        if (!class_exists(\Spatie\Activitylog\Models\Activity::class)) {
            return response()->json([
                'data' => [],
                'meta' => ['total' => 0, 'per_page' => 50, 'current_page' => 1, 'last_page' => 1],
                'warning' => 'Activity log package not installed. Run: composer require spatie/laravel-activitylog',
            ]);
        }

        $event   = $request->input('event');
        $perPage = min((int) $request->input('per_page', 50), 200);

        $query = \Spatie\Activitylog\Models\Activity::with('causer:id,name,role')
            ->latest();

        if ($event) {
            $query->where('event', $event);
        }

        $paginated = $query->paginate($perPage);

        $data = collect($paginated->items())->map(fn($log) => [
            'id'           => $log->id,
            'event'        => $log->event,
            'description'  => $log->description,
            'causer'       => $log->causer ? [
                'name' => $log->causer->name,
                'role' => $log->causer->role ?? 'unknown',
            ] : null,
            'subject_type' => $log->subject_type,
            'subject_id'   => $log->subject_id,
            'properties'   => $log->properties,
            'created_at'   => $log->created_at?->toISOString(),
        ]);

        return response()->json([
            'data' => $data,
            'meta' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Private query helpers — one per anomaly table
    // Each returns a plain array of normalized items ready to merge.
    // ══════════════════════════════════════════════════════════════════════════

    private function queryTabSwitch(?string $severity, ?int $examId): array
    {
        return TabSwitchLog::with(['student:id,name,email', 'exam:id,title'])
            ->when($severity, fn($q) => $q->where('severity', $severity))
            ->when($examId,   fn($q) => $q->where('exam_id', $examId))
            ->where('is_return_event', true)   // only count real switches, not hide pings
            ->orderByDesc('occurred_at')
            ->limit(500)    // safety cap per source
            ->get()
            ->map(fn($log) => [
                'id'                 => $log->id,
                'type'               => 'tab_switch',
                'severity'           => $log->severity,
                'student'            => $log->student,
                'exam'               => $log->exam,
                'occurred_at'        => $log->occurred_at,
                'hidden_duration_ms' => $log->hidden_duration_ms,
                // extra fields expected by AnomalyReports.jsx
                'z_score'    => null,
                'direction'  => null,
                'keys'       => null,
                'is_paste'   => null,
                'wpm'        => null,
            ])
            ->all();
    }

    private function queryKeyboardShortcut(?string $severity, ?int $examId): array
    {
        return KeyboardShortcutLog::with(['student:id,name,email', 'exam:id,title'])
            ->when($severity, fn($q) => $q->where('severity', $severity))
            ->when($examId,   fn($q) => $q->where('exam_id', $examId))
            ->orderByDesc('occurred_at')
            ->limit(500)
            ->get()
            ->map(fn($log) => [
                'id'                 => $log->id,
                'type'               => 'keyboard_shortcut',
                'severity'           => $log->severity,
                'student'            => $log->student,
                'exam'               => $log->exam,
                'occurred_at'        => $log->occurred_at,
                'keys'               => $log->keys,
                'is_paste'           => $log->is_paste,
                'pasted_char_count'  => $log->pasted_char_count,
                // nulls for fields not applicable to this type
                'hidden_duration_ms' => null,
                'z_score'            => null,
                'direction'          => null,
                'wpm'                => null,
            ])
            ->all();
    }

    private function queryResponseTime(?string $severity, ?int $examId): array
    {
        return ResponseTimeLog::with(['student:id,name,email', 'exam:id,title'])
            ->when($severity, fn($q) => $q->where('severity', $severity))
            ->when($examId,   fn($q) => $q->where('exam_id', $examId))
            ->where('is_baseline', false)       // exclude baseline rows from anomaly feed
            ->whereNotNull('z_score')           // only show rows that were actually scored
            ->orderByDesc('occurred_at')
            ->limit(500)
            ->get()
            ->map(fn($log) => [
                'id'                 => $log->id,
                'type'               => 'response_time',
                'severity'           => $log->severity,
                'student'            => $log->student,
                'exam'               => $log->exam,
                'occurred_at'        => $log->occurred_at,
                'z_score'            => $log->z_score,
                'direction'          => $log->direction,
                'response_time_ms'   => $log->response_time_ms,
                // nulls
                'hidden_duration_ms' => null,
                'keys'               => null,
                'is_paste'           => null,
                'wpm'                => null,
            ])
            ->all();
    }

    private function queryKeystroke(?string $severity, ?int $examId): array
    {
        return KeystrokeDynamicsLog::with(['student:id,name,email', 'exam:id,title'])
            ->when($severity, fn($q) => $q->where('severity', $severity))
            ->when($examId,   fn($q) => $q->where('exam_id', $examId))
            ->where('is_baseline', false)       // exclude baseline rows
            ->whereNotNull('z_score')
            ->orderByDesc('occurred_at')
            ->limit(500)
            ->get()
            ->map(fn($log) => [
                'id'                 => $log->id,
                'type'               => 'keystroke',
                'severity'           => $log->severity,
                'student'            => $log->student,
                'exam'               => $log->exam,
                'occurred_at'        => $log->occurred_at,
                'z_score'            => $log->z_score,
                'wpm'                => $log->wpm,
                'reason'             => $log->reason,
                // nulls
                'hidden_duration_ms' => null,
                'direction'          => null,
                'keys'               => null,
                'is_paste'           => null,
            ])
            ->all();
    }

    // ── Shared result formatter ───────────────────────────────────────────────

    private function formatResult(ExamResult $r): array
    {
        return [
            'id'               => $r->id,
            'submission_id'    => $r->submission_id,
            'student'          => $r->student,
            'exam'             => $r->exam,
            'cpi_score'        => $r->cpi_score,
            'cpi_label'        => $r->cpi_label,
            'is_flagged'       => $r->is_flagged,
            'iso_tab_flagged'  => $r->iso_tab_flagged,
            'svm_flagged'      => $r->svm_flagged,
            'rt_flagged'       => $r->rt_flagged,
            'hmm_flagged'      => $r->hmm_flagged,
            'processed_at'     => $r->processed_at?->toISOString(),
        ];
    }
}