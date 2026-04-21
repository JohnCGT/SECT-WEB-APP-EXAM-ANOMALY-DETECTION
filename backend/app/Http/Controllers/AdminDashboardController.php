<?php

// backend/app/Http/Controllers/AdminDashboardController.php
// Changes vs previous version:
//   + courses() method added for GET /api/admin/courses

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamSubmission;
use App\Models\KeyboardShortcutLog;
use App\Models\KeystrokeDynamicsLog;
use App\Models\ResponseTimeLog;
use App\Models\SupportTicket;
use App\Models\TabSwitchLog;
use App\Models\User;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    private function authorizeAdmin(): void
    {
        if (!auth()->check() || !auth()->user()->isAdmin()) {
            abort(403, 'Forbidden: Admins only.');
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/admin/dashboard
    // ══════════════════════════════════════════════════════════════════════════
    public function dashboard()
    {
        $this->authorizeAdmin();

        return response()->json([
            'total_users'      => User::count(),
            'active_exams'     => Exam::where('status', 'active')->count(),
            'flagged_sessions' => ExamResult::where('is_flagged', true)->count(),
            'high_cpi_risk'    => ExamResult::where('cpi_score', '>=', 0.70)->count(),
            'open_tickets'     => SupportTicket::where('status', 'open')->count(),

            'recent_results' => ExamResult::with([
                    'student:id,name,email',
                    'exam:id,title,type',
                ])
                ->orderByDesc('processed_at')
                ->limit(10)
                ->get()
                ->map(fn($r) => $this->formatResult($r)),
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/admin/notifications
    // ══════════════════════════════════════════════════════════════════════════
    public function notifications()
    {
        $this->authorizeAdmin();

        $notifs = collect();

        SupportTicket::with('user:id,name,role')
            ->where('status', 'open')
            ->orderByDesc('created_at')
            ->limit(30)
            ->get()
            ->each(function ($t) use (&$notifs) {
                $notifs->push([
                    'id'         => "ticket_{$t->id}",
                    'type'       => 'new_ticket',
                    'title'      => "New ticket from {$t->user?->name}",
                    'body'       => $t->subject,
                    'link'       => '/admin/support',
                    'created_at' => $t->created_at?->toISOString(),
                ]);
            });

        ExamResult::with(['student:id,name', 'exam:id,title'])
            ->where('cpi_score', '>=', 0.70)
            ->where('is_flagged', true)
            ->orderByDesc('processed_at')
            ->limit(20)
            ->get()
            ->each(function ($r) use (&$notifs) {
                $notifs->push([
                    'id'         => "cpi_{$r->id}",
                    'type'       => 'high_cpi',
                    'title'      => "High CPI: {$r->student?->name}",
                    'body'       => "Score {$r->cpi_score} on \"{$r->exam?->title}\"",
                    'link'       => '/admin/anomalies',
                    'created_at' => $r->processed_at?->toISOString(),
                ]);
            });

        return response()->json([
            'data' => $notifs->sortByDesc('created_at')->values()->take(20),
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/admin/courses
    //
    // Admin-wide view of ALL courses across all instructors.
    // Response: { data: [{ id, code, name, semester, credits,
    //   instructor: {id,name,email}, students_count, exams_count }] }
    // ══════════════════════════════════════════════════════════════════════════
    public function courses(Request $request)
    {
        $this->authorizeAdmin();

        $query = Course::with('instructor:id,name,email')
            ->withCount('students')
            ->withCount('exams')
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('code', 'like', "%{$s}%")
                  ->orWhere('name', 'like', "%{$s}%");
            });
        }

        $courses = $query->get()->map(fn($c) => [
            'id'             => $c->id,
            'code'           => $c->code,
            'name'           => $c->name,
            'description'    => $c->description,
            'semester'       => $c->semester,
            'credits'        => $c->credits,
            'instructor'     => $c->instructor,
            'students_count' => $c->students_count,
            'exams_count'    => $c->exams_count,
            'created_at'     => $c->created_at?->toISOString(),
        ]);

        return response()->json(['data' => $courses]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/admin/exams
    // ══════════════════════════════════════════════════════════════════════════
    public function exams(Request $request)
    {
        $this->authorizeAdmin();

        $query = Exam::with(['course:id,code,name', 'instructor:id,name,email'])
            ->withCount('submissions')
            ->withCount(['submissions as flagged_count' => function ($q) {
                // Now works because ExamSubmission::examResult() HasOne exists
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
            'exam'    => ['id' => $exam->id, 'title' => $exam->title, 'status' => $exam->status],
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DELETE /api/admin/exams/{id}/sessions
    // ══════════════════════════════════════════════════════════════════════════
    public function resetSessions(int $id)
    {
        $this->authorizeAdmin();

        $exam    = Exam::findOrFail($id);
        $deleted = ExamSubmission::where('exam_id', $id)->count();
        ExamSubmission::where('exam_id', $id)->delete();

        return response()->json([
            'message'       => "All {$deleted} session(s) for \"{$exam->title}\" have been reset.",
            'deleted_count' => $deleted,
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/admin/anomalies
    // ══════════════════════════════════════════════════════════════════════════
    public function anomalies(Request $request)
    {
        $this->authorizeAdmin();

        $type    = $request->input('type');
        $severity = $request->input('severity');
        $examId  = $request->input('exam_id');
        $perPage = min((int) $request->input('per_page', 50), 200);
        $page    = max(1, (int) $request->input('page', 1));

        $sources = [];
        if (!$type || $type === 'tab_switch')        $sources[] = $this->queryTabSwitch($severity, $examId);
        if (!$type || $type === 'keyboard_shortcut') $sources[] = $this->queryKeyboardShortcut($severity, $examId);
        if (!$type || $type === 'response_time')     $sources[] = $this->queryResponseTime($severity, $examId);
        if (!$type || $type === 'keystroke')         $sources[] = $this->queryKeystroke($severity, $examId);

        $merged    = collect($sources)->flatten(1)->sortByDesc('occurred_at')->values();
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

    // ── Anomaly query helpers ─────────────────────────────────────────────────

    private function queryTabSwitch(?string $severity, ?int $examId): array
    {
        return TabSwitchLog::with(['student:id,name,email', 'exam:id,title'])
            ->when($severity, fn($q) => $q->where('severity', $severity))
            ->when($examId,   fn($q) => $q->where('exam_id', $examId))
            ->where('is_return_event', true)
            ->orderByDesc('occurred_at')->limit(500)->get()
            ->map(fn($l) => ['id'=>$l->id,'type'=>'tab_switch','severity'=>$l->severity,
                'student'=>$l->student,'exam'=>$l->exam,'occurred_at'=>$l->occurred_at,
                'hidden_duration_ms'=>$l->hidden_duration_ms,
                'z_score'=>null,'direction'=>null,'keys'=>null,'is_paste'=>null,'wpm'=>null])
            ->all();
    }

    private function queryKeyboardShortcut(?string $severity, ?int $examId): array
    {
        return KeyboardShortcutLog::with(['student:id,name,email', 'exam:id,title'])
            ->when($severity, fn($q) => $q->where('severity', $severity))
            ->when($examId,   fn($q) => $q->where('exam_id', $examId))
            ->orderByDesc('occurred_at')->limit(500)->get()
            ->map(fn($l) => ['id'=>$l->id,'type'=>'keyboard_shortcut','severity'=>$l->severity,
                'student'=>$l->student,'exam'=>$l->exam,'occurred_at'=>$l->occurred_at,
                'keys'=>$l->keys,'is_paste'=>$l->is_paste,'pasted_char_count'=>$l->pasted_char_count,
                'hidden_duration_ms'=>null,'z_score'=>null,'direction'=>null,'wpm'=>null])
            ->all();
    }

    private function queryResponseTime(?string $severity, ?int $examId): array
    {
        return ResponseTimeLog::with(['student:id,name,email', 'exam:id,title'])
            ->when($severity, fn($q) => $q->where('severity', $severity))
            ->when($examId,   fn($q) => $q->where('exam_id', $examId))
            ->where('is_baseline', false)->whereNotNull('z_score')
            ->orderByDesc('occurred_at')->limit(500)->get()
            ->map(fn($l) => ['id'=>$l->id,'type'=>'response_time','severity'=>$l->severity,
                'student'=>$l->student,'exam'=>$l->exam,'occurred_at'=>$l->occurred_at,
                'z_score'=>$l->z_score,'direction'=>$l->direction,'response_time_ms'=>$l->response_time_ms,
                'hidden_duration_ms'=>null,'keys'=>null,'is_paste'=>null,'wpm'=>null])
            ->all();
    }

    private function queryKeystroke(?string $severity, ?int $examId): array
    {
        return KeystrokeDynamicsLog::with(['student:id,name,email', 'exam:id,title'])
            ->when($severity, fn($q) => $q->where('severity', $severity))
            ->when($examId,   fn($q) => $q->where('exam_id', $examId))
            ->where('is_baseline', false)->whereNotNull('z_score')
            ->orderByDesc('occurred_at')->limit(500)->get()
            ->map(fn($l) => ['id'=>$l->id,'type'=>'keystroke','severity'=>$l->severity,
                'student'=>$l->student,'exam'=>$l->exam,'occurred_at'=>$l->occurred_at,
                'z_score'=>$l->z_score,'wpm'=>$l->wpm,'reason'=>$l->reason,
                'hidden_duration_ms'=>null,'direction'=>null,'keys'=>null,'is_paste'=>null])
            ->all();
    }

    private function formatResult(ExamResult $r): array
    {
        return [
            'id'              => $r->id,
            'submission_id'   => $r->submission_id,
            'student'         => $r->student,
            'exam'            => $r->exam,
            'cpi_score'       => $r->cpi_score,
            'cpi_label'       => $r->cpi_label,
            'is_flagged'      => $r->is_flagged,
            'iso_tab_flagged' => $r->iso_tab_flagged,
            'svm_flagged'     => $r->svm_flagged,
            'rt_flagged'      => $r->rt_flagged,
            'hmm_flagged'     => $r->hmm_flagged,
            'processed_at'    => $r->processed_at?->toISOString(),
        ];
    }
}