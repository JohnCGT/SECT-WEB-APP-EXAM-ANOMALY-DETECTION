<?php

namespace App\Http\Controllers\Student;
use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\Exam;
use App\Models\Announcement;

class StudentSearchController extends Controller
{
    public function search(Request $request)
    {
        $q      = trim($request->query('q', ''));
        $student = $request->user();

        if (strlen($q) < 2) {
            return response()->json(['results' => []]);
        }

        $results = [];

        // ── 1. Courses the student is enrolled in ──
        $courses = Course::whereHas('students', fn($sq) => $sq->where('student_id', $student->id))
            ->where(fn($cq) => $cq->where('name', 'like', "%{$q}%")
                                ->orWhere('code', 'like', "%{$q}%"))
            ->limit(5)
            ->get();

        foreach ($courses as $c) {
            $results[] = [
                'type'     => 'subject',
                'title'    => "{$c->code} — {$c->name}",
                'subtitle' => 'Subject',
                'url'      => "/student/courses/{$c->id}/exams",
            ];
        }

        // ── 2. Exams in the student's enrolled courses ──
        $enrolledCourseIds = Course::whereHas('students', fn($sq) => $sq->where('student_id', $student->id))
            ->pluck('id');

        $exams = Exam::whereIn('course_id', $enrolledCourseIds)
            ->where('title', 'like', "%{$q}%")
            ->with('course:id,code')
            ->limit(5)
            ->get();

        foreach ($exams as $e) {
            $results[] = [
                'type'     => 'exam',
                'title'    => $e->title,
                'subtitle' => $e->course->code ?? 'Exam',
                'url'      => "/student/exams/{$e->id}",
            ];
        }

        // ── 3. Announcements ──
        $announcements = Announcement::where(
                fn($aq) => $aq->where('title', 'like', "%{$q}%")
                               ->orWhere('body',  'like', "%{$q}%")
            )
            ->limit(3)
            ->get();

        foreach ($announcements as $a) {
            $results[] = [
                'type'     => 'announcement',
                'title'    => $a->title,
                'subtitle' => 'Announcement',
                'url'      => null,   // no dedicated page; set a URL if you have one
            ];
        }

        return response()->json(['results' => $results]);
    }
}