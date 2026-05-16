<?php

namespace App\Http\Controllers\Instructor;
use App\Http\Controllers\Controller;

use App\Models\ActivityLog;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $courses = Course::where('instructor_id', $request->user()->id)
            ->withCount('exams')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['courses' => $courses], 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code'          => 'required|string|unique:courses,code',
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'semester'      => 'nullable|string|in:First Semester,Second Semester,Summer',
            'academic_year' => 'nullable|string|max:20',
            'credits'       => 'nullable|integer|min:1|max:6',
        ]);

        $course = Course::create([
            'instructor_id' => $request->user()->id,
            'code'          => $request->code,
            'name'          => $request->name,
            'description'   => $request->description,
            'semester'      => $request->semester,
            'academic_year' => $request->academic_year,
            'credits'       => $request->credits ?? 3,
        ]);

        // ── Activity Log ──────────────────────────────────────────────────
        ActivityLog::record(
            $request->user(),
            'course.created',
            "{$request->user()->name} created course \"{$course->name}\" ({$course->code}).",
            [
                'course_id'   => $course->id,
                'course_code' => $course->code,
                'course_name' => $course->name,
                'semester'    => $course->semester,
            ],
            $request,
            $course->id,
            'Course'
        );
        // ─────────────────────────────────────────────────────────────────

        return response()->json([
            'message' => 'Course created successfully',
            'course'  => $course,
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $course = Course::where('id', $id)
            ->where('instructor_id', $request->user()->id)
            ->with(['exams' => function ($query) {
                $query->withCount('questions');
            }])
            ->firstOrFail();

        return response()->json(['course' => $course], 200);
    }

    public function update(Request $request, $id)
    {
        $course = Course::where('id', $id)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $request->validate([
            'code'          => 'required|string|unique:courses,code,' . $id,
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'semester'      => 'nullable|string|in:First Semester,Second Semester,Summer',
            'academic_year' => 'nullable|string|max:20',
            'credits'       => 'nullable|integer|min:1|max:6',
        ]);

        $course->update($request->only([
            'code', 'name', 'description', 'semester', 'academic_year', 'credits',
        ]));

        // ── Activity Log ──────────────────────────────────────────────────
        ActivityLog::record(
            $request->user(),
            'course.updated',
            "{$request->user()->name} updated course \"{$course->name}\" ({$course->code}).",
            [
                'course_id'   => $course->id,
                'course_code' => $course->code,
                'course_name' => $course->name,
            ],
            $request,
            $course->id,
            'Course'
        );
        // ─────────────────────────────────────────────────────────────────

        return response()->json([
            'message' => 'Course updated successfully',
            'course'  => $course,
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $course = Course::where('id', $id)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        // ── Activity Log — BEFORE delete so we still have the name ────────
        ActivityLog::record(
            $request->user(),
            'course.deleted',
            "{$request->user()->name} deleted course \"{$course->name}\" ({$course->code}).",
            [
                'course_id'   => $course->id,
                'course_code' => $course->code,
                'course_name' => $course->name,
            ],
            $request,
            $course->id,
            'Course'
        );
        // ─────────────────────────────────────────────────────────────────

        $course->delete();

        return response()->json(['message' => 'Course deleted successfully'], 200);
    }
}