<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamSubmission;
use Illuminate\Http\Request;

class StudentExamController extends Controller
{
    // ── Private helper: resolve authenticated student  ───────────────────────
    private function getStudent(Request $request)
    {
        $student = $request->user();

        if (!$student) {
            abort(401, 'Unauthenticated.');
        }

        return $student;
    }

    // ── Private helper: verify student is enrolled in course ─────────────────
    // Mirrors exactly how StudentCourseController checks enrollment,
    // using the enrolledCourses() relationship on User (pivot: course_students, student_id)
    private function assertEnrolled($student, int $courseId): void
    {
        $enrolled = $student->enrolledCourses()
            ->where('courses.id', $courseId)
            ->exists();

        if (!$enrolled) {
            abort(403, 'You are not enrolled in this course.');
        }
    }

    /**
     * GET /student/courses/{courseId}/exams
     *
     * Returns all exams for a course the student is enrolled in,
     * along with their submission status for each exam.
     */
    public function courseExams(Request $request, $courseId)
    {
        $student = $this->getStudent($request);
        $this->assertEnrolled($student, (int) $courseId);

        $exams = Exam::where('course_id', $courseId)
            ->withCount('questions')
            ->with(['submissions' => function ($query) use ($student) {
                $query->where('student_id', $student->id);
            }])
            ->orderBy('start_time', 'desc')
            ->get()
            ->map(function ($exam) {
                $sub = $exam->submissions->first();
                return [
                    'id'               => $exam->id,
                    'title'            => $exam->title,
                    'description'      => $exam->description,
                    'type'             => $exam->type,
                    'start_time'       => $exam->start_time,
                    'end_time'         => $exam->end_time,
                    'duration_minutes' => $exam->duration_minutes,
                    'total_points'     => $exam->total_points,
                    'questions_count'  => $exam->questions_count,
                    'submission'       => $sub ? [
                        'id'           => $sub->id,
                        'status'       => $sub->status,
                        'score'        => $sub->score,
                        'total_points' => $sub->total_points,
                        'started_at'   => $sub->started_at,
                        'submitted_at' => $sub->submitted_at,
                    ] : null,
                ];
            });

        return response()->json(['exams' => $exams]);
    }

    /**
     * POST /student/exams/{examId}/start
     *
     * Starts an exam for the authenticated student.
     * Creates a submission with status = 'in_progress'.
     * If an in_progress submission already exists, returns it (resume).
     */
    public function start(Request $request, $examId)
    {
        $student = $this->getStudent($request);

        $exam = Exam::with(['questions' => function ($query) {
            $query->orderBy('order');
        }])->findOrFail($examId);

        // Use enrolledCourses() — consistent with StudentCourseController
        $this->assertEnrolled($student, (int) $exam->course_id);

        $now = now();

        if ($now < $exam->start_time) {
            return response()->json(['message' => 'This exam has not started yet.'], 403);
        }

        if ($now > $exam->end_time) {
            return response()->json(['message' => 'This exam has ended.'], 403);
        }

        // Check for existing submission
        $existing = ExamSubmission::where('exam_id', $examId)
            ->where('student_id', $student->id)
            ->first();

        if ($existing && $existing->status === 'submitted') {
            return response()->json(['message' => 'You have already submitted this exam.'], 403);
        }

        // Create submission or return existing in_progress one.
        // Status MUST be 'in_progress' — AnomalyController::getActiveSubmission()
        // queries for this exact value.
        $submission = ExamSubmission::firstOrCreate(
            [
                'exam_id'    => $examId,
                'student_id' => $student->id,
            ],
            [
                'status'       => 'in_progress',
                'started_at'   => now(),
                'total_points' => $exam->total_points,
            ]
        );

        $questions = $exam->questions->map(function ($question) {
            return [
                'id'            => $question->id,
                'type'          => $question->type,
                'question_text' => $question->question_text,
                'points'        => $question->points,
                'order'         => $question->order,
                'options'       => $question->options,
                'max_words'     => $question->max_words ?? null,
            ];
        });

        return response()->json([
            'exam' => [
                'id'               => $exam->id,
                'title'            => $exam->title,
                'description'      => $exam->description,
                'duration_minutes' => $exam->duration_minutes,
                'start_time'       => $exam->start_time,
                'end_time'         => $exam->end_time,
                'total_points'     => $exam->total_points,
            ],
            'questions'  => $questions,
            'submission' => [
                'id'         => $submission->id,
                'started_at' => $submission->started_at,
                'status'     => $submission->status,
            ],
        ]);
    }

    /**
     * POST /student/exams/{examId}/submit
     *
     * Grades objective questions and marks submission as submitted.
     * Status changes: 'in_progress' → 'submitted'
     */
    public function submit(Request $request, $examId)
    {
        $student = $this->getStudent($request);

        $exam = Exam::with('questions')->findOrFail($examId);

        $submission = ExamSubmission::where('exam_id', $examId)
            ->where('student_id', $student->id)
            ->where('status', 'in_progress')
            ->firstOrFail();

        $request->validate(['answers' => 'required|array']);

        $answers       = $request->input('answers');
        $score         = 0;
        $gradedAnswers = [];

        foreach ($exam->questions as $question) {
            $studentAnswer = $answers[$question->id] ?? null;
            $isCorrect     = false;
            $pointsEarned  = 0;

            if (in_array($question->type, ['multiple_choice', 'true_false'])) {
                $isCorrect    = $studentAnswer === $question->correct_answer;
                $pointsEarned = $isCorrect ? $question->points : 0;
            }

            $score += $pointsEarned;

            $gradedAnswers[] = [
                'question_id'     => $question->id,
                'student_answer'  => $studentAnswer,
                'correct_answer'  => $question->correct_answer,
                'is_correct'      => $isCorrect,
                'points_earned'   => $pointsEarned,
                'points_possible' => $question->points,
            ];
        }

        $submission->update([
            'status'       => 'submitted',
            'submitted_at' => now(),
            'score'        => $score,
            'answers'      => $gradedAnswers,
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
     * GET /student/exams/{examId}/results
     *
     * Returns detailed results for a submitted exam.
     */
    public function results(Request $request, $examId)
    {
        $student = $this->getStudent($request);

        $submission = ExamSubmission::with(['exam.questions'])
            ->where('exam_id', $examId)
            ->where('student_id', $student->id)
            ->where('status', 'submitted')
            ->firstOrFail();

        $exam            = $submission->exam;
        $answers         = $submission->answers ?? [];
        $questionResults = [];

        foreach ($exam->questions as $question) {
            $answerData = collect($answers)->firstWhere('question_id', $question->id);

            $questionResults[] = [
                'id'             => $question->id,
                'question_text'  => $question->question_text,
                'type'           => $question->type,
                'points'         => $question->points,
                'options'        => $question->options,
                'student_answer' => $answerData['student_answer'] ?? null,
                'correct_answer' => $question->correct_answer,
                'is_correct'     => $answerData['is_correct'] ?? false,
                'points_earned'  => $answerData['points_earned'] ?? 0,
            ];
        }

        return response()->json([
            'submission' => [
                'id'           => $submission->id,
                'score'        => $submission->score,
                'total_points' => $submission->total_points,
                'percentage'   => $submission->total_points > 0
                    ? round(($submission->score / $submission->total_points) * 100, 2)
                    : 0,
                'started_at'   => $submission->started_at,
                'submitted_at' => $submission->submitted_at,
            ],
            'exam'      => [
                'id'          => $exam->id,
                'title'       => $exam->title,
                'description' => $exam->description,
            ],
            'questions' => $questionResults,
        ]);
    }
}