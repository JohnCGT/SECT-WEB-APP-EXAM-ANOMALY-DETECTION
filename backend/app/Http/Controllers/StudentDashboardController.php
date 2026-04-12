<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Exam;
use App\Models\ExamSubmission;
use App\Models\Announcement;


class StudentDashboardController extends Controller
{
    // GET /student/dashboard/exams/upcoming
    public function upcomingExams(Request $request)
    {
        $user = $request->user();

        $exams = Exam::with('course')
            ->whereHas('course.students', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->whereIn('status', ['scheduled', 'active'])  // ← your enum values
            ->where('start_time', '>', now())              // ← start_time not scheduled_at
            ->orderBy('start_time')
            ->limit(5)
            ->get()
            ->map(fn($e) => [
                'id'               => $e->id,
                'title'            => $e->title,
                'course'           => $e->course->name ?? null,
                'type'             => $e->type,            // midterm/final/quiz/prelim
                'start_time'       => $e->start_time,      // ← start_time
                'end_time'         => $e->end_time,
                'duration_minutes' => $e->duration_minutes,
                'status'           => $e->status,
            ]);

        return response()->json($exams);
    }

    // GET /student/dashboard/exams/active
    public function activeExam(Request $request)
    {
        $user = $request->user();

        $exam = Exam::with('course')
            ->whereHas('course.students', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where('status', 'active')                    // ← 'active' not 'ongoing'
            ->first();

        return response()->json($exam ? [
            'id'       => $exam->id,
            'title'    => $exam->title,
            'course'   => $exam->course->name ?? null,
            'end_time' => $exam->end_time,                 // ← end_time not ends_at
        ] : null);
    }

    // GET /student/dashboard/exams/results
    public function recentResults(Request $request)
    {
        $results = ExamSubmission::with('exam.course')
            ->where('student_id', $request->user()->id)  // ← student_id, confirmed from StudentExamController
            ->where('status', 'submitted')               // ← only completed submissions
            ->orderByDesc('submitted_at')
            ->limit(5)
            ->get()
            ->map(fn($s) => [
                'exam'    => $s->exam->title ?? 'Exam',
                'course'  => $s->exam->course->name ?? null,
                'type'    => $s->exam->type ?? null,
                'score'   => $s->score,
                'total'   => $s->total_points,
                'passed'  => $s->total_points > 0
                            ? ($s->score / $s->total_points) >= 0.60  // adjust passing threshold as needed
                            : null,
                'date'    => $s->submitted_at,
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
            ->get(['id', 'title', 'body','created_at']);

        return response()->json($items);
    }
}