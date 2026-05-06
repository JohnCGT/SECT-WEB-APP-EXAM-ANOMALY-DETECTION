<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    /**
     * Get all courses for authenticated instructor
     */
    public function index(Request $request)
    {
        $courses = Course::where('instructor_id', $request->user()->id)
            ->withCount('exams')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['courses' => $courses], 200);
    }

    /**
     * Create a new course
     */
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

        return response()->json([
            'message' => 'Course created successfully',
            'course'  => $course,
        ], 201);
    }

    /**
     * Get single course with exams
     */
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

    /**
     * Update course
     */
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
            'code',
            'name',
            'description',
            'semester',
            'academic_year',
            'credits',
        ]));

        return response()->json([
            'message' => 'Course updated successfully',
            'course'  => $course,
        ], 200);
    }

    /**
     * Delete course
     */
    public function destroy(Request $request, $id)
    {
        $course = Course::where('id', $id)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $course->delete();

        return response()->json([
            'message' => 'Course deleted successfully',
        ], 200);
    }
}