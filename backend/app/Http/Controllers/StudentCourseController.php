<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class StudentCourseController extends Controller
{
    /**
     * Return all courses the authenticated student is enrolled in.
     */
    public function index(Request $request)
    {
        $student = $request->user();

        if ($student->role !== 'student') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $courses = $student->enrolledCourses()
            ->with([
                'instructor:id,name,email',
                'exams' => function ($q) {
                    $q->whereIn('status', ['scheduled', 'active', 'completed'])
                      ->select(
                          'id', 'course_id', 'title', 'type',
                          'start_time', 'end_time',
                          'duration_minutes', 'total_points', 'status'
                      )
                      ->orderBy('start_time');
                },
            ])
            ->get()
            ->map(function ($course) {
                return [
                    'id'          => $course->id,
                    'code'        => $course->code,
                    'name'        => $course->name,
                    'description' => $course->description,
                    'semester'    => $course->semester,
                    'credits'     => $course->credits,
                    'instructor'  => $course->instructor,
                    'exams'       => $course->exams,
                    'exams_count' => $course->exams->count(),
                    'enrolled_at' => $course->pivot->enrolled_at,
                ];
            });

        return response()->json(['courses' => $courses]);
    }

    /**
     * Return a single course the student is enrolled in.
     */
    public function show(Request $request, $courseId)
    {
        $student = $request->user();

        if ($student->role !== 'student') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $course = $student->enrolledCourses()
            ->with([
                'instructor:id,name,email',
                'exams' => function ($q) {
                    $q->whereIn('status', ['scheduled', 'active', 'completed'])
                      ->orderBy('start_time');
                },
            ])
            ->where('courses.id', $courseId)
            ->first();

        if (!$course) {
            return response()->json(['message' => 'Course not found or not enrolled.'], 404);
        }

        return response()->json(['course' => $course]);
    }
}
