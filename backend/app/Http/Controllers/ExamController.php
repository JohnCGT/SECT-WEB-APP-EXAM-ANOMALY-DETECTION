<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Course;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    /**
     * Get all exams for authenticated instructor
     * 
     * This method retrieves all exams created by the currently logged-in instructor.
     * Exams are returned with course information, question counts, and ordered by start time.
     * 
     * @param Request $request Contains the authenticated user
     * @return JSON response with list of exams
     */
    public function index(Request $request)
    {
        // Get all exams where the instructor_id matches the current user
        $exams = Exam::where('instructor_id', $request->user()->id)
            ->with('course') // Eager load the related course information
            ->withCount('questions') // Add a count of questions for each exam
            ->orderBy('start_time', 'desc') // Order by start time, newest first
            ->get(); // Execute query and get all results

        // Return the list of exams
        return response()->json(['exams' => $exams], 200); // 200 = OK
    }

    /**
     * Create a new exam
     * 
     * This method allows an instructor to create a new exam for one of their courses.
     * It validates the input data, verifies course ownership, and creates the exam.
     * 
     * @param Request $request Contains the exam data
     * @return JSON response with created exam details
     */
    public function store(Request $request)
    {
        // Validate incoming exam data
        $request->validate([
            'course_id' => 'required|exists:courses,id', // Must be a valid course ID
            'title' => 'required|string|max:255', // Required, max 255 characters
            'description' => 'nullable|string', // Optional description
            'type' => 'required|in:midterm,final,quiz,prelim', // Must be one of these types
            'start_time' => 'required|date', // When exam becomes available
            'end_time' => 'required|date|after:start_time', // Must be after start_time
            'duration_minutes' => 'required|integer|min:1', // How long students have to complete it
        ]);

        // Verify that the course belongs to the instructor
        // This prevents instructors from creating exams for courses they don't teach
        $course = Course::where('id', $request->course_id)
            ->where('instructor_id', $request->user()->id) // Check ownership
            ->firstOrFail(); // Throws 404 if course not found or not owned by instructor

        // Create the new exam
        $exam = Exam::create([
            'instructor_id' => $request->user()->id, // Set the creator
            'course_id' => $request->course_id,
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'duration_minutes' => $request->duration_minutes,
            'status' => $request->status ?? 'published',
        ]);

        // Return success response with the created exam and its course
        return response()->json([
            'message' => 'Exam created successfully',
            'exam' => $exam->load('course') // Load course relationship for response
        ], 201); // 201 = Created
    }

    /**
     * Get single exam with questions
     * 
     * This method retrieves a specific exam with all its questions.
     * Only the instructor who created the exam can access it.
     * Questions are ordered by their 'order' field.
     * 
     * @param Request $request Contains the authenticated user
     * @param int $id The ID of the exam to retrieve
     * @return JSON response with exam details and questions
     */
    public function show(Request $request, $id)
    {
        // Get the exam with related data
        $exam = Exam::where('id', $id)
            ->where('instructor_id', $request->user()->id) // Ensure exam belongs to instructor
            ->with(['course', 'questions' => function($query) {
                // Eager load questions ordered by their sequence
                $query->orderBy('order');
            }])
            ->firstOrFail(); // Throws 404 if exam not found or not owned by instructor

        // Return the exam with all details
        return response()->json(['exam' => $exam], 200); // 200 = OK
    }

    /**
     * Update exam
     * 
     * This method allows an instructor to update an existing exam.
     * It validates the new data and updates only the provided fields.
     * Only the instructor who created the exam can update it.
     * 
     * @param Request $request Contains the fields to update
     * @param int $id The ID of the exam to update
     * @return JSON response with updated exam details
     */
    public function update(Request $request, $id)
    {
        // Find the exam and verify ownership
        $exam = Exam::where('id', $id)
            ->where('instructor_id', $request->user()->id) // Ensure exam belongs to instructor
            ->firstOrFail(); // Throws 404 if exam not found or not owned by instructor

        // Validate the fields that are being updated
        // 'sometimes' means the field is only validated if it's present in the request
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255', // Update title if provided
            'description' => 'nullable|string', // Update description if provided
            'type' => 'sometimes|in:midterm,final,quiz,prelim', // Update type if provided
            'start_time' => 'sometimes|date', // Update start time if provided
            'end_time' => 'sometimes|date|after:start_time', // Must be after start_time
            'duration_minutes' => 'sometimes|integer|min:1', // Update duration if provided
            'status' => 'sometimes|in:draft,scheduled,active,completed', // Update status if provided
            
            // Proctoring feature toggles (optional)
            'face_detection' => 'sometimes|boolean', // Enable/disable face detection
            'tab_switching_monitor' => 'sometimes|boolean', // Monitor tab switches
            'mouse_tracking' => 'sometimes|boolean', // Track mouse movements
            'keyboard_analysis' => 'sometimes|boolean', // Analyze keyboard patterns
            'screen_recording' => 'sometimes|boolean', // Record student screen
            'isolation_forest' => 'sometimes|boolean', // ML-based anomaly detection
        ]);

        // Update the exam with validated data
        // Only the fields present in $validated will be updated
        $exam->update($validated);

        // Return success response with updated exam
        return response()->json([
            'message' => 'Exam updated successfully',
            'exam' => $exam->load('course') // Load course relationship for response
        ], 200); // 200 = OK
    }

    /**
     * Delete exam
     * 
     * This method allows an instructor to delete an exam they created.
     * Only the instructor who created the exam can delete it.
     * This will also cascade delete related records (questions, submissions, etc.)
     * depending on database foreign key constraints.
     * 
     * @param Request $request Contains the authenticated user
     * @param int $id The ID of the exam to delete
     * @return JSON response confirming deletion
     */
    public function destroy(Request $request, $id)
    {
        // Find the exam and verify ownership
        $exam = Exam::where('id', $id)
            ->where('instructor_id', $request->user()->id) // Ensure exam belongs to instructor
            ->firstOrFail(); // Throws 404 if exam not found or not owned by instructor

        // Delete the exam from the database
        $exam->delete();

        // Return success response
        return response()->json([
            'message' => 'Exam deleted successfully'
        ], 200); // 200 = OK
    }
}