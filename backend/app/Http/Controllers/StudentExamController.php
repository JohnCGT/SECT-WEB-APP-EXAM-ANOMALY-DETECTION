<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamAnswer;
use App\Models\ExamSubmission;
use Illuminate\Http\Request;

class StudentExamController extends Controller
{
    /**
     * List all accessible exams for a course the student is enrolled in.
     * Strips correct_answer so students can't see answers before submitting.
     */
    public function courseExams(Request $request, $courseId)
    {
        $student = $request->user();

        // Verify enrollment
        $enrolled = $student->enrolledCourses()
            ->where('courses.id', $courseId)
            ->exists();

        if (!$enrolled) {
            return response()->json(['message' => 'You are not enrolled in this course.'], 403);
        }

        $exams = Exam::where('course_id', $courseId)
            ->whereIn('status', ['scheduled', 'active', 'completed'])
            ->withCount('questions')
            ->orderBy('start_time')
            ->get()
            ->map(function ($exam) use ($student) {
                // Attach this student's submission status if any
                $submission = ExamSubmission::where('exam_id', $exam->id)
                    ->where('student_id', $student->id)
                    ->first();

                return [
                    'id'              => $exam->id,
                    'title'           => $exam->title,
                    'description'     => $exam->description,
                    'type'            => $exam->type,
                    'start_time'      => $exam->start_time,
                    'end_time'        => $exam->end_time,
                    'duration_minutes'=> $exam->duration_minutes,
                    'total_points'    => $exam->total_points,
                    'status'          => $exam->status,
                    'questions_count' => $exam->questions_count,
                    'submission'      => $submission ? [
                        'id'           => $submission->id,
                        'status'       => $submission->status,
                        'score'        => $submission->score,
                        'total_points' => $submission->total_points,
                        'submitted_at' => $submission->submitted_at,
                    ] : null,
                ];
            });

        return response()->json(['exams' => $exams]);
    }

    /**
     * Start an exam — creates a submission record and returns questions (without correct_answer).
     */
    public function start(Request $request, $examId)
    {
        $student = $request->user();

        $exam = Exam::with('questions')->findOrFail($examId);

        // Check student is enrolled in the course
        $enrolled = $student->enrolledCourses()
            ->where('courses.id', $exam->course_id)
            ->exists();

        if (!$enrolled) {
            return response()->json(['message' => 'You are not enrolled in this course.'], 403);
        }

        // Only allow active or scheduled exams
        if (!in_array($exam->status, ['active', 'scheduled'])) {
            return response()->json(['message' => 'This exam is not available.'], 403);
        }

        // Check time window
        $now = now();
        if ($now->lt($exam->start_time)) {
            return response()->json(['message' => 'This exam has not started yet.'], 403);
        }
        if ($now->gt($exam->end_time)) {
            return response()->json(['message' => 'This exam has already ended.'], 403);
        }

        // Prevent re-taking a submitted exam
        $existing = ExamSubmission::where('exam_id', $examId)
            ->where('student_id', $student->id)
            ->first();

        if ($existing && $existing->status === 'submitted') {
            return response()->json(['message' => 'You have already submitted this exam.'], 409);
        }

        // Create or resume submission
        $submission = $existing ?? ExamSubmission::create([
            'exam_id'      => $examId,
            'student_id'   => $student->id,
            'started_at'   => now(),
            'total_points' => $exam->total_points,
            'status'       => 'in_progress',
        ]);

        // Return questions — strip correct_answer and rubric answers
        $questions = $exam->questions->sortBy('order')->values()->map(function ($q) {
            return [
                'id'            => $q->id,
                'type'          => $q->type,
                'question_text' => $q->question_text,
                'points'        => $q->points,
                'order'         => $q->order,
                'options'       => $q->options,   // choices for MC
                'max_words'     => $q->max_words, // for essay
                // correct_answer intentionally omitted
            ];
        });

        return response()->json([
            'submission' => [
                'id'         => $submission->id,
                'started_at' => $submission->started_at,
            ],
            'exam' => [
                'id'               => $exam->id,
                'title'            => $exam->title,
                'description'      => $exam->description,
                'duration_minutes' => $exam->duration_minutes,
                'total_points'     => $exam->total_points,
                'end_time'         => $exam->end_time,
            ],
            'questions' => $questions,
        ]);
    }

    /**
     * Submit the exam — grade MC/T-F automatically, mark essay as pending.
     */
    public function submit(Request $request, $examId)
    {
        $student = $request->user();

        $exam = Exam::with('questions')->findOrFail($examId);

        $submission = ExamSubmission::where('exam_id', $examId)
            ->where('student_id', $student->id)
            ->firstOrFail();

        if ($submission->status === 'submitted') {
            return response()->json(['message' => 'Exam already submitted.'], 409);
        }

        $request->validate([
            'answers'   => ['required', 'array'],
            'answers.*' => ['nullable', 'string'],
        ]);

        $answersInput = $request->answers; // [ question_id => answer_string ]

        $totalScore = 0;

        foreach ($exam->questions as $question) {
            $studentAnswer = $answersInput[$question->id] ?? null;
            $isCorrect     = null;
            $pointsEarned  = 0;

            if ($question->type === 'multiple_choice' || $question->type === 'true_false') {
                if ($studentAnswer !== null) {
                    $isCorrect    = strtolower(trim($studentAnswer)) === strtolower(trim($question->correct_answer));
                    $pointsEarned = $isCorrect ? $question->points : 0;
                }
            }
            // Essay: is_correct stays null, pointsEarned stays 0 until manual grading

            $totalScore += $pointsEarned;

            ExamAnswer::updateOrCreate(
                [
                    'submission_id' => $submission->id,
                    'question_id'   => $question->id,
                ],
                [
                    'answer'        => $studentAnswer,
                    'is_correct'    => $isCorrect,
                    'points_earned' => $pointsEarned,
                ]
            );
        }

        $submission->update([
            'score'        => $totalScore,
            'total_points' => $exam->total_points,
            'status'       => 'submitted',
            'submitted_at' => now(),
        ]);

        return response()->json([
            'message'    => 'Exam submitted successfully.',
            'submission' => [
                'id'           => $submission->id,
                'score'        => $submission->score,
                'total_points' => $submission->total_points,
                'submitted_at' => $submission->submitted_at,
            ],
        ]);
    }

    /**
     * Get full results with per-question feedback.
     */
    public function results(Request $request, $examId)
    {
        $student = $request->user();

        $submission = ExamSubmission::where('exam_id', $examId)
            ->where('student_id', $student->id)
            ->where('status', 'submitted')
            ->firstOrFail();

        $exam = Exam::with(['questions' => function ($q) {
            $q->orderBy('order');
        }])->findOrFail($examId);

        // Map questions with student answer + grading
        $answersMap = $submission->answers->keyBy('question_id');

        $results = $exam->questions->map(function ($question) use ($answersMap) {
            $answer = $answersMap->get($question->id);

            return [
                'id'             => $question->id,
                'type'           => $question->type,
                'question_text'  => $question->question_text,
                'points'         => $question->points,
                'order'          => $question->order,
                'options'        => $question->options,
                'correct_answer' => $question->correct_answer, // revealed on results
                'rubric'         => $question->rubric,
                'student_answer' => $answer?->answer,
                'is_correct'     => $answer?->is_correct,
                'points_earned'  => $answer?->points_earned ?? 0,
            ];
        });

        $percentage = $submission->total_points > 0
            ? round(($submission->score / $submission->total_points) * 100, 1)
            : 0;

        return response()->json([
            'submission' => [
                'id'           => $submission->id,
                'score'        => $submission->score,
                'total_points' => $submission->total_points,
                'percentage'   => $percentage,
                'submitted_at' => $submission->submitted_at,
                'started_at'   => $submission->started_at,
            ],
            'exam' => [
                'id'    => $exam->id,
                'title' => $exam->title,
                'type'  => $exam->type,
            ],
            'questions' => $results,
        ]);
    }
}