<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Course;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    /**
     * Get all exams for authenticated instructor
     */
    public function index(Request $request)
    {
        $exams = Exam::where('instructor_id', $request->user()->id)
            ->with('course')
            ->withCount('questions')
            ->orderBy('start_time', 'desc')
            ->get();

        return response()->json(['exams' => $exams], 200);
    }

    /**
     * Create a new exam
     */
    public function store(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:midterm,final,quiz,prelim',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'duration_minutes' => 'required|integer|min:1',
        ]);

        // Verify course belongs to instructor
        $course = Course::where('id', $request->course_id)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $exam = Exam::create([
            'instructor_id' => $request->user()->id,
            'course_id' => $request->course_id,
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'duration_minutes' => $request->duration_minutes,
            'status' => 'draft',
        ]);

        return response()->json([
            'message' => 'Exam created successfully',
            'exam' => $exam->load('course')
        ], 201);
    }

    /**
     * Get single exam with questions
     */
    public function show(Request $request, $id)
    {
        $exam = Exam::where('id', $id)
            ->where('instructor_id', $request->user()->id)
            ->with(['course', 'questions' => function($query) {
                $query->orderBy('order');
            }])
            ->firstOrFail();

        return response()->json(['exam' => $exam], 200);
    }

    /**
     * Update exam
     */
    public function update(Request $request, $id)
    {
        $exam = Exam::where('id', $id)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|in:midterm,final,quiz,prelim',
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date|after:start_time',
            'duration_minutes' => 'sometimes|integer|min:1',
            'status' => 'sometimes|in:draft,scheduled,active,completed',
            'face_detection' => 'sometimes|boolean',
            'tab_switching_monitor' => 'sometimes|boolean',
            'mouse_tracking' => 'sometimes|boolean',
            'keyboard_analysis' => 'sometimes|boolean',
            'screen_recording' => 'sometimes|boolean',
            'isolation_forest' => 'sometimes|boolean',
        ]);

        $exam->update($validated);

        return response()->json([
            'message' => 'Exam updated successfully',
            'exam' => $exam->load('course')
        ], 200);
    }

    /**
     * Delete exam
     */
    public function destroy(Request $request, $id)
    {
        $exam = Exam::where('id', $id)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $exam->delete();

        return response()->json([
            'message' => 'Exam deleted successfully'
        ], 200);
    }
}