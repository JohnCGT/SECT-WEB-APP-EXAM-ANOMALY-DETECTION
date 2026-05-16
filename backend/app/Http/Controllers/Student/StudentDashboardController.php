<?php
namespace App\Http\Controllers\Student;
use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use App\Models\Exam;
use App\Models\ExamSubmission;
use App\Models\ExamResult;
use App\Models\Announcement;
use App\Models\KeystrokeDynamicsLog;

class StudentDashboardController extends Controller
{
    // GET /student/dashboard/exams/upcoming
    public function upcomingExams(Request $request)
    {
        $user = $request->user();

        // Get course IDs the student is enrolled in — same approach as StudentCourseController
        $courseIds = $user->enrolledCourses()->pluck('courses.id');

        $exams = Exam::with('course')
            ->whereIn('course_id', $courseIds)
            ->whereNotIn('status', ['draft', 'cancelled', 'closed'])
            ->where('start_time', '>', now())
            ->orderBy('start_time')
            ->limit(5)
            ->get()
            ->map(fn($e) => [
                'id'               => $e->id,
                'title'            => $e->title,
                'course'           => $e->course->name ?? null,
                'course_id'        => $e->course_id,        // ← needed for View all link
                'type'             => $e->type,
                'start_time'       => $e->start_time,
                'end_time'         => $e->end_time,
                'duration_minutes' => $e->duration_minutes,
                'status'           => $e->status,
            ]);

        return response()->json($exams);
    }

    // GET /student/dashboard/exams/active
    public function activeExam(Request $request)
    {
        $user    = $request->user();
        $courseIds = $user->enrolledCourses()->pluck('courses.id');

        $exam = Exam::with('course')
            ->whereIn('course_id', $courseIds)
            ->where('status', 'active')
            ->first();

        return response()->json($exam ? [
            'id'       => $exam->id,
            'title'    => $exam->title,
            'course'   => $exam->course->name ?? null,
            'end_time' => $exam->end_time,
        ] : null);
    }

    // GET /student/dashboard/exams/results
    public function recentResults(Request $request)
    {
        $results = ExamSubmission::with('exam.course')
            ->where('student_id', $request->user()->id)
            ->where('status', 'submitted')
            ->orderByDesc('submitted_at')
            ->limit(5)
            ->get()
            ->map(fn($s) => [
                'exam'   => $s->exam->title ?? 'Exam',
                'course' => $s->exam->course->name ?? null,
                'type'   => $s->exam->type ?? null,
                'score'  => $s->score,
                'total'  => $s->total_points,
                'passed' => $s->total_points > 0
                            ? ($s->score / $s->total_points) >= 0.60
                            : null,
                'date'   => $s->submitted_at,
            ]);

        return response()->json($results);
    }

    // GET /student/dashboard/announcements
    public function announcements(Request $request)
    {
        $items = Announcement::where('is_active', true)
            ->where('target', 'all')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'title', 'body', 'created_at']);

        return response()->json($items);
    }

    // GET /student/dashboard/score-stats
    // Aggregate score statistics across all submitted exams
    public function scoreStats(Request $request)
    {
        $subs = ExamSubmission::where('student_id', $request->user()->id)
            ->where('status', 'submitted')
            ->where('total_points', '>', 0)
            ->get();

        if ($subs->isEmpty()) {
            return response()->json([
                'total_taken'  => 0,
                'avg_pct'      => null,
                'highest_pct'  => null,
                'lowest_pct'   => null,
                'pass_count'   => 0,
                'fail_count'   => 0,
            ]);
        }

        $percentages = $subs->map(fn($s) => ($s->score / $s->total_points) * 100);

        return response()->json([
            'total_taken'  => $subs->count(),
            'avg_pct'      => round($percentages->avg(), 1),
            'highest_pct'  => round($percentages->max(), 1),
            'lowest_pct'   => round($percentages->min(), 1),
            'pass_count'   => $percentages->filter(fn($p) => $p >= 60)->count(),
            'fail_count'   => $percentages->filter(fn($p) => $p < 60)->count(),
        ]);
    }

    // GET /student/dashboard/integrity
    // CPI scores and flag breakdown from exam_results (Flask-populated)
    public function integrityStats(Request $request)
    {
        $results = ExamResult::where('student_id', $request->user()->id)->get();

        if ($results->isEmpty()) {
            return response()->json([
                'total_exams'   => 0,
                'flagged_count' => 0,
                'avg_cpi'       => null,
                'cpi_label'     => null,
                'flags'         => [
                    'tab_switch'    => 0,
                    'keyboard'      => 0,
                    'response_time' => 0,
                    'keystroke'     => 0,
                ],
            ]);
        }

        return response()->json([
            'total_exams'   => $results->count(),
            'flagged_count' => $results->where('is_flagged', true)->count(),
            'avg_cpi'       => round($results->avg('cpi_score'), 2),
            'cpi_label'     => $results->sortByDesc('processed_at')->first()?->cpi_label ?? 'N/A',
            'flags'         => [
                'tab_switch'    => $results->where('iso_tab_flagged', true)->count(),
                'keyboard'      => $results->where('svm_flagged', true)->count(),
                'response_time' => $results->where('rt_flagged', true)->count(),
                'keystroke'     => $results->where('hmm_flagged', true)->count(),
            ],
        ]);
    }

    // GET /student/dashboard/typing-stats
    // Average WPM from keystroke_dynamics_logs (excludes baseline rows)
    public function typingStats(Request $request)
    {
        $rows = KeystrokeDynamicsLog::where('student_id', $request->user()->id)
            ->where('is_baseline', false)
            ->where('wpm', '>', 0)
            ->get();

        if ($rows->isEmpty()) {
            return response()->json([
                'avg_wpm' => null,
                'max_wpm' => null,
                'samples' => 0,
            ]);
        }

        return response()->json([
            'avg_wpm' => round($rows->avg('wpm'), 1),
            'max_wpm' => round($rows->max('wpm'), 1),
            'samples' => $rows->count(),
        ]);
    }
}