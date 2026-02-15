<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Exam;
use App\Models\ExamSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentExamController extends Controller
{
    /**
     * Get all exams for a specific course that the student is enrolled in
     * 
     * This method retrieves all exams for a course, along with the student's
     * submission status for each exam (if any).
     * 
     * @param int $courseId The ID of the course
     * @return JSON response with list of exams
     */
    public function courseExams($courseId)
    {
        // Get the currently authenticated student
        $student = auth()->user();

        // Verify that the student is enrolled in the course
        // Uses whereHas to check the many-to-many relationship between students and courses
        $course = Course::whereHas('students', function ($query) use ($student) {
            $query->where('users.id', $student->id);  // FIXED: was users_id
        })->findOrFail($courseId); // Throws 404 if course not found or student not enrolled

        // Get all exams for this course
        $exams = Exam::where('course_id', $courseId)
            ->withCount('questions') // Add count of questions for each exam
            ->with(['submissions' => function ($query) use ($student) {
                // Eager load only the submissions for this specific student
                $query->where('student_id', $student->id);
            }])
            ->orderBy('start_time', 'desc') // Newest exams first
            ->get()
            ->map(function ($exam) {
                // Transform each exam to include relevant information
                return [
                    'id' => $exam->id,
                    'title' => $exam->title,
                    'description' => $exam->description,
                    'type' => $exam->type, // e.g., midterm, final, quiz, prelim
                    'start_time' => $exam->start_time,
                    'end_time' => $exam->end_time,
                    'duration_minutes' => $exam->duration_minutes,
                    'total_points' => $exam->total_points,
                    'questions_count' => $exam->questions_count,
                    // Include submission data if student has submitted this exam
                    'submission' => $exam->submissions->first() ? [
                        'id' => $exam->submissions->first()->id,
                        'status' => $exam->submissions->first()->status, // draft, in_progress, or submitted
                        'score' => $exam->submissions->first()->score,
                        'total_points' => $exam->submissions->first()->total_points,
                        'started_at' => $exam->submissions->first()->started_at,
                        'submitted_at' => $exam->submissions->first()->submitted_at,
                    ] : null, // null if no submission exists
                ];
            });

        // Return the list of exams
        return response()->json(['exams' => $exams]);
    }

    /**
     * Start an exam
     * 
     * This method allows a student to start taking an exam.
     * It performs several checks and creates/retrieves an exam submission.
     * 
     * @param int $examId The ID of the exam to start
     * @return JSON response with exam questions and submission details
     */
    public function start($examId)
    {
        // Get the currently authenticated student
        $student = auth()->user();
        
        // Get the exam with its questions, ordered by their sequence
        $exam = Exam::with(['questions' => function ($query) {
            $query->orderBy('order'); // Questions appear in the specified order
        }])->findOrFail($examId); // Throws 404 if exam not found

        // Verify the student is enrolled in the course this exam belongs to
        $course = Course::whereHas('students', function ($query) use ($student) {
            $query->where('users.id', $student->id);  // FIXED: was users_id
        })->findOrFail($exam->course_id); // Throws 404 if not enrolled

        // Check if the exam is within the allowed time window
        $now = now();
        
        // Check if exam hasn't started yet
        if ($now < $exam->start_time) {
            return response()->json(['message' => 'This exam has not started yet.'], 403);
        }
        
        // Check if exam has already ended
        if ($now > $exam->end_time) {
            return response()->json(['message' => 'This exam has ended.'], 403);
        }

        // Check if student has already submitted this exam
        $existingSubmission = ExamSubmission::where('exam_id', $examId)
            ->where('student_id', $student->id)
            ->first();

        // Prevent starting exam if already submitted
        if ($existingSubmission && $existingSubmission->status === 'submitted') {
            return response()->json(['message' => 'You have already submitted this exam.'], 403);
        }

        // Create a new submission or retrieve existing in-progress submission
        // firstOrCreate ensures only one submission per student per exam
        $submission = ExamSubmission::firstOrCreate(
            ['exam_id' => $examId, 'student_id' => $student->id], // Search criteria
            ['status' => 'in_progress', 'started_at' => now(), 'total_points' => $exam->total_points] // Values if creating new
        );

        // Prepare questions for the exam (without revealing correct answers)
        $questions = $exam->questions->map(function ($question) {
            return [
                'id' => $question->id,
                'type' => $question->type, // e.g., multiple_choice, true_false, essay
                'question_text' => $question->question_text,
                'points' => $question->points, // Points this question is worth
                'order' => $question->order, // Question sequence number
                'options' => $question->options, // Answer choices (for multiple choice)
                'max_words' => $question->max_words, // Word limit (for essay questions)
            ];
        });

        // Return exam details, questions, and submission info
        return response()->json([
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'description' => $exam->description,
                'duration_minutes' => $exam->duration_minutes,
                'start_time' => $exam->start_time,
                'end_time' => $exam->end_time,
                'total_points' => $exam->total_points,
            ],
            'questions' => $questions,
            'submission' => ['id' => $submission->id, 'started_at' => $submission->started_at],
        ]);
    }

    /**
     * Submit exam answers
     * 
     * This method handles the submission of exam answers by a student.
     * It grades objective questions (multiple choice, true/false) automatically
     * and stores all answers for later review.
     * 
     * @param Request $request Contains the student's answers
     * @param int $examId The ID of the exam being submitted
     * @return JSON response with submission results and score
     */
    public function submit(Request $request, $examId)
    {
        // Get the currently authenticated student
        $student = auth()->user();
        
        // Get the exam with all its questions
        $exam = Exam::with('questions')->findOrFail($examId);

        // Find the student's in-progress submission for this exam
        $submission = ExamSubmission::where('exam_id', $examId)
            ->where('student_id', $student->id)
            ->where('status', 'in_progress') // Only allow submitting in-progress exams
            ->firstOrFail(); // Throws 404 if no in-progress submission found

        // Validate that answers are provided in the correct format
        $request->validate(['answers' => 'required|array']);

        // Get the submitted answers (format: question_id => answer)
        $answers = $request->input('answers');
        
        // Initialize score counter
        $score = 0;
        
        // Array to store graded answers with details
        $gradedAnswers = [];

        // Grade each question in the exam
        foreach ($exam->questions as $question) {
            // Get the student's answer for this question (null if not answered)
            $studentAnswer = $answers[$question->id] ?? null;
            
            // Initialize grading variables
            $isCorrect = false;
            $pointsEarned = 0;

            // Auto-grade objective question types
            if ($question->type === 'multiple_choice' || $question->type === 'true_false') {
                // Compare student's answer with correct answer
                $isCorrect = $studentAnswer === $question->correct_answer;
                
                // Award full points if correct, 0 if incorrect
                $pointsEarned = $isCorrect ? $question->points : 0;
            }
            // Note: Essay questions are not auto-graded (manual grading required)

            // Add points to total score
            $score += $pointsEarned;

            // Store detailed grading information for this question
            $gradedAnswers[] = [
                'question_id' => $question->id,
                'student_answer' => $studentAnswer, // What the student answered
                'correct_answer' => $question->correct_answer, // The correct answer
                'is_correct' => $isCorrect, // Whether the answer was correct
                'points_earned' => $pointsEarned, // Points awarded
                'points_possible' => $question->points, // Maximum points for this question
            ];
        }

        // Update the submission with final results
        $submission->update([
            'status' => 'submitted', // Mark as submitted (can no longer edit)
            'submitted_at' => now(), // Record submission timestamp
            'score' => $score, // Total score earned
            'answers' => $gradedAnswers, // Store all graded answers
        ]);

        // Return success response with submission details
        return response()->json([
            'message' => 'Exam submitted successfully.',
            'submission' => [
                'id' => $submission->id,
                'score' => $submission->score,
                'total_points' => $submission->total_points,
                'submitted_at' => $submission->submitted_at,
            ],
        ]);
    }

    /**
     * View exam results
     * 
     * This method retrieves the results of a submitted exam, including
     * the student's answers, correct answers, and score breakdown.
     * Only accessible after the exam has been submitted.
     * 
     * @param int $examId The ID of the exam
     * @return JSON response with detailed exam results
     */
    public function results($examId)
    {
        // Get the currently authenticated student
        $student = auth()->user();

        // Find the student's submitted exam submission
        $submission = ExamSubmission::with(['exam.questions'])
            ->where('exam_id', $examId)
            ->where('student_id', $student->id)
            ->where('status', 'submitted') // Only show results for submitted exams
            ->firstOrFail(); // Throws 404 if not found or not submitted

        // Get the exam details
        $exam = $submission->exam;
        
        // Initialize array for question results
        $questionResults = [];
        
        // Get the stored answers from the submission
        $answers = $submission->answers ?? [];

        // Build detailed results for each question
        foreach ($exam->questions as $question) {
            // Find the grading data for this specific question
            $answerData = collect($answers)->firstWhere('question_id', $question->id);

            // Compile complete information for each question
            $questionResults[] = [
                'id' => $question->id,
                'question_text' => $question->question_text,
                'type' => $question->type,
                'points' => $question->points, // Maximum points possible
                'options' => $question->options, // Answer choices (for review)
                'student_answer' => $answerData['student_answer'] ?? null, // What student answered
                'correct_answer' => $question->correct_answer, // Show correct answer
                'is_correct' => $answerData['is_correct'] ?? false, // Whether it was correct
                'points_earned' => $answerData['points_earned'] ?? 0, // Points awarded
            ];
        }

        // Return comprehensive exam results
        return response()->json([
            'submission' => [
                'id' => $submission->id,
                'score' => $submission->score, // Total points earned
                'total_points' => $submission->total_points, // Maximum points possible
                // Calculate percentage score
                'percentage' => $submission->total_points > 0 
                    ? round(($submission->score / $submission->total_points) * 100, 2)
                    : 0, // Avoid division by zero
                'started_at' => $submission->started_at, // When exam was started
                'submitted_at' => $submission->submitted_at, // When exam was submitted
            ],
            'exam' => ['id' => $exam->id, 'title' => $exam->title, 'description' => $exam->description],
            'questions' => $questionResults, // Detailed results for each question
        ]);
    }
}