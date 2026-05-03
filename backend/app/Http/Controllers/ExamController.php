<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Course;
use App\Models\StudentNotification;
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
            'course_id'        => 'required|exists:courses,id', // Must be a valid course ID
            'title'            => 'required|string|max:255', // Required, max 255 characters
            'description'      => 'nullable|string', // Optional description
            'type'             => 'required|in:midterm,final,quiz,prelim', // Must be one of these types
            'start_time'       => 'required|date', // When exam becomes available
            'end_time'         => 'required|date|after:start_time', // Must be after start_time
            'duration_minutes' => 'required|integer|min:1', // How long students have to complete it
        ]);

        // Verify that the course belongs to the instructor
        // This prevents instructors from creating exams for courses they don't teach
        $course = Course::where('id', $request->course_id)
            ->where('instructor_id', $request->user()->id) // Check ownership
            ->firstOrFail(); // Throws 404 if course not found or not owned by instructor

        // Create the new exam
        $exam = Exam::create([
            'instructor_id'    => $request->user()->id, // Set the creator
            'course_id'        => $request->course_id,
            'title'            => $request->title,
            'description'      => $request->description,
            'type'             => $request->type,
            'start_time'       => $request->start_time,
            'end_time'         => $request->end_time,
            'duration_minutes' => $request->duration_minutes,
            'status'           => $request->status ?? 'published',
        ]);

        // ── Notify all enrolled students ──
        // $exam is now defined, so we can safely reference it here
        $studentIds = \App\Models\Course::find($exam->course_id)
            ->students()
            ->pluck('users.id');

        $notifications = $studentIds->map(fn($sid) => [
            'student_id'  => $sid,
            'type'        => 'new_exam',
            'title'       => 'New Exam Posted',
            'body'        => "A new {$exam->type} has been posted: \"{$exam->title}\"",
            'url'         => "/student/exams/{$exam->id}",
            'exam_id'     => $exam->id,
            'is_read'     => false,
            'created_at'  => now(),
            'updated_at'  => now(),
        ])->toArray();

        StudentNotification::insert($notifications);

        // Return success response with the created exam and its course
        return response()->json([
            'message' => 'Exam created successfully',
            'exam'    => $exam->load('course'), // Load course relationship for response
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
            ->with(['course', 'questions' => function ($query) {
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
            'title'            => 'sometimes|string|max:255', // Update title if provided
            'description'      => 'nullable|string', // Update description if provided
            'type'             => 'sometimes|in:midterm,final,quiz,prelim', // Update type if provided
            'start_time'       => 'sometimes|date', // Update start time if provided
            'end_time'         => 'sometimes|date|after:start_time', // Must be after start_time
            'duration_minutes' => 'sometimes|integer|min:1', // Update duration if provided
            'status'           => 'sometimes|in:draft,scheduled,active,completed', // Update status if provided

            // Proctoring feature toggles (optional)
            'face_detection'        => 'sometimes|boolean', // Enable/disable face detection
            'tab_switching_monitor' => 'sometimes|boolean', // Monitor tab switches
            'mouse_tracking'        => 'sometimes|boolean', // Track mouse movements
            'keyboard_analysis'     => 'sometimes|boolean', // Analyze keyboard patterns
            'screen_recording'      => 'sometimes|boolean', // Record student screen
            'isolation_forest'      => 'sometimes|boolean', // ML-based anomaly detection
            'shuffle_questions'     => 'sometimes|boolean', // Randomize question order
        ]);

        // Update the exam with validated data
        // Only the fields present in $validated will be updated
        $exam->update($validated);

        // Return success response with updated exam
        return response()->json([
            'message' => 'Exam updated successfully',
            'exam'    => $exam->load('course'), // Load course relationship for response
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
        return response()->json(['message' => 'Exam deleted successfully'], 200); // 200 = OK
    }

    /**
     * GET /exams/{id}/submissions
     *
     * BUG FIX: Removed incorrect (array) cast when decoding submission answers.
     * Using (array) on an already-decoded associative array collapses it into an
     * indexed array of values, destroying the keys (question_id, points_earned, etc.),
     * which caused every essay to appear as graded (essayCount=0 → ungraded_count=0).
     */
    public function submissions(Request $request, $id)
    {
        $exam = \App\Models\Exam::where('id', $id)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $enrolledStudents = \Illuminate\Support\Facades\DB::table('course_students')
            ->where('course_id', $exam->course_id)
            ->pluck('student_id')
            ->toArray();

        $submissions = \App\Models\ExamSubmission::where('exam_id', $id)
            ->with('student:id,name,email')
            ->get()
            ->keyBy('student_id');

        $results = \App\Models\ExamResult::where('exam_id', $id)
            ->get()
            ->keyBy('submission_id');

        $essayQIds = \App\Models\Question::where('exam_id', $id)
            ->where('type', 'essay')
            ->pluck('id')
            ->toArray();

        $students = \App\Models\User::whereIn('id', $enrolledStudents)
            ->select('id', 'name', 'email')
            ->get()
            ->keyBy('id');

        $rows = [];

        foreach ($students as $studentId => $student) {
            $sub    = $submissions->get($studentId);
            $result = $sub ? $results->get($sub->id) : null;

            $essayCount    = 0;
            $gradedCount   = 0;
            $ungradedCount = 0;

            if ($sub && !empty($essayQIds)) {
                $raw = $sub->answers;

                // FIX: Do NOT use (array) cast — it destroys associative arrays.
                // When Eloquent has no cast, $raw is a JSON string; when it does
                // have a cast, $raw is already a PHP array. Either way, we must
                // NOT wrap with (array) because that turns ['question_id'=>1, ...]
                // into [1, ...] (indexed values only), making every key lookup fail.
                $answers = is_string($raw) ? json_decode($raw, true) : ($raw ?? []);

                foreach ($answers as $a) {
                    if (!in_array($a['question_id'] ?? null, $essayQIds)) continue;
                    if (empty($a['student_answer'])) continue;

                    $essayCount++;
                    // points_earned is NULL (not set/not graded) vs 0.0 (graded zero)
                    if (($a['points_earned'] ?? null) !== null) {
                        $gradedCount++;
                    } else {
                        $ungradedCount++;
                    }
                }
            }

            $rows[] = [
                'id'             => $sub?->id,
                'student_id'     => $studentId,
                'student'        => $student,
                'status'         => $sub ? $sub->status : 'not_started',
                'score'          => $sub?->score,
                'total_points'   => $sub?->total_points ?? $exam->total_points,
                'started_at'     => $sub?->started_at,
                'submitted_at'   => $sub?->submitted_at,
                'cpi_score'      => $result?->cpi_score,
                'cpi_label'      => $result?->cpi_label,
                'is_flagged'     => $result?->is_flagged ?? false,
                'essay_count'    => $essayCount,
                'graded_count'   => $gradedCount,
                'ungraded_count' => $ungradedCount,
            ];
        }

        usort($rows, function ($a, $b) {
            $order = ['submitted' => 0, 'in_progress' => 1, 'not_started' => 2];
            $oa    = $order[$a['status']] ?? 3;
            $ob    = $order[$b['status']] ?? 3;

            if ($oa !== $ob) return $oa - $ob;

            if ($a['status'] === 'submitted' && $b['status'] === 'submitted') {
                return strcmp($b['submitted_at'] ?? '', $a['submitted_at'] ?? '');
            }

            return strcmp($a['student']['name'] ?? '', $b['student']['name'] ?? '');
        });

        return response()->json(['submissions' => $rows]);
    }
}