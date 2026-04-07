<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamSubmission;
use Illuminate\Http\Request;
use App\Jobs\ProcessExamML;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

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
    private function assertEnrolled($student, int $courseId): void
    {
        $enrolled = $student->enrolledCourses()
            ->where('courses.id', $courseId)
            ->exists();

        if (!$enrolled) {
            abort(403, 'You are not enrolled in this course.');
        }
    }

    // ── Private helper: case-insensitive, whitespace-trimmed answer comparison
    // Fixes the strict === comparison bug in submit() that caused correct answers
    // to be graded as wrong when casing or whitespace differed.
    private function answersMatch(?string $studentAnswer, ?string $correctAnswer): bool
    {
        if ($studentAnswer === null || $correctAnswer === null) {
            return false;
        }
        return strtolower(trim($studentAnswer)) === strtolower(trim($correctAnswer));
    }

    /**
     * GET /student/courses/{courseId}/exams
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
     */
    public function start(Request $request, $examId)
    {
        $student = $this->getStudent($request);

        $exam = Exam::with(['questions' => function ($query) {
            $query->orderBy('order');
        }])->findOrFail($examId);

        $this->assertEnrolled($student, (int) $exam->course_id);

        $now = now();

        if ($now < $exam->start_time) {
            return response()->json(['message' => 'This exam has not started yet.'], 403);
        }

        if ($now > $exam->end_time) {
            return response()->json(['message' => 'This exam has ended.'], 403);
        }

        // --- NEW CHECK START ---
        // Check if exam has essay questions
        $hasEssay = $exam->questions->contains('type', 'essay');

        if ($hasEssay) {
            $hasBaseline = DB::table('keystroke_baselines')
                ->where('student_id', $student->id)
                ->exists();

            if (!$hasBaseline) {
                return response()->json([
                    'requires_typing_test' => true,
                    'message' => 'Please complete the typing test before starting this exam.',
                ], 403);
            }
        }
        // --- NEW CHECK END ---

        $existing = ExamSubmission::where('exam_id', $examId)
            ->where('student_id', $student->id)
            ->first();

        if ($existing && $existing->status === 'submitted') {
            return response()->json(['message' => 'You have already submitted this exam.'], 403);
        }

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
     * BUG FIX 1: Changed strict === comparison to answersMatch() which uses
     * case-insensitive, trimmed comparison. This fixes cases where:
     *   - "True" !== "true" (casing mismatch)
     *   - "Option A " !== "Option A" (trailing whitespace from DB)
     *   - "v" !== "v " (whitespace stored in correct_answer)
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
            $studentAnswer = isset($answers[$question->id])
                ? (string) $answers[$question->id]
                : null;

            $isCorrect    = false;
            $pointsEarned = 0;

            if (in_array($question->type, ['multiple_choice', 'true_false'])) {
                // FIX: use answersMatch() instead of strict ===
                // This handles casing differences (e.g. "true" vs "True")
                // and whitespace differences (e.g. "v " vs "v")
                $isCorrect    = $this->answersMatch($studentAnswer, (string) $question->correct_answer);
                $pointsEarned = $isCorrect ? $question->points : 0;
            }

            $score += $pointsEarned;

            $gradedAnswers[] = [
                'question_id'     => $question->id,
                'student_answer'  => $studentAnswer,
                'correct_answer'  => $question->correct_answer,
                'is_correct'      => $isCorrect,       // PHP bool → JSON true/false
                'points_earned'   => $pointsEarned,
                'points_possible' => $question->points,
            ];
        }

        $submission->update([
            'status'       => 'submitted',
            'submitted_at' => now(),
            'score'        => $score,
            'answers'      => $gradedAnswers, // stored as JSON array
        ]);

        // ── Trigger ML processing in the background ───────────────────────────
        $rawStart = $submission->getRawOriginal('started_at');
        $rawEnd   = $submission->getRawOriginal('submitted_at');

        $examStart = Carbon::createFromFormat('Y-m-d H:i:s', $rawStart, 'Asia/Manila')
                        ->utc()
                        ->toIso8601String();

        $examEnd = Carbon::createFromFormat('Y-m-d H:i:s', $rawEnd, 'Asia/Manila')
                        ->utc()
                        ->toIso8601String();

        ProcessExamML::dispatch($submission->id, $examStart, $examEnd);
        // ─────────────────────────────────────────────────────────────────────

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
     * BUG FIX 2: $submission->answers must be decoded as an array before
     * using collect()->firstWhere(). If the ExamSubmission model does NOT
     * cast 'answers' to 'array', $submission->answers is a raw JSON string
     * and collect() iterates over characters — firstWhere() always returns
     * null, so every question falls back to 'is_correct' => false.
     *
     * Fix: explicitly json_decode if the value is still a string.
     */
    public function results(Request $request, $examId)
    {
        $student = $this->getStudent($request);

        $submission = ExamSubmission::with(['exam.questions'])
            ->where('exam_id', $examId)
            ->where('student_id', $student->id)
            ->where('status', 'submitted')
            ->firstOrFail();

        $exam = $submission->exam;

        // FIX: ensure $answers is always a PHP array, not a JSON string.
        // Laravel auto-casts json columns to array IF the model declares
        // protected $casts = ['answers' => 'array'].
        // If it doesn't, we get a raw string back and collect() breaks.
        $raw     = $submission->answers;
        $answers = is_string($raw) ? json_decode($raw, true) : (array) ($raw ?? []);

        $questionResults = [];

        foreach ($exam->questions as $question) {
            $answerData = collect($answers)->firstWhere('question_id', $question->id);

            // Re-derive is_correct from the stored answers for MC/TF in case
            // the grading at submit time had the strict === bug.
            // For essays, keep whatever the instructor set.
            $storedIsCorrect = $answerData['is_correct'] ?? null;

            if ($question->type !== 'essay') {
                $storedStudentAnswer  = $answerData['student_answer'] ?? null;
                $storedCorrectAnswer  = $answerData['correct_answer'] ?? $question->correct_answer;
                // Re-derive using the same trimmed/lowercased comparison
                $derivedIsCorrect = $this->answersMatch(
                    $storedStudentAnswer !== null ? (string) $storedStudentAnswer : null,
                    (string) $storedCorrectAnswer
                );
                // Use derived value — this self-heals old submissions graded with the old bug
                $isCorrect    = $derivedIsCorrect;
                $pointsEarned = $derivedIsCorrect ? $question->points : 0;
            } else {
                // Essay: trust whatever is stored (manual grading)
                $isCorrect    = $storedIsCorrect;
                $pointsEarned = $answerData['points_earned'] ?? 0;
            }

            $questionResults[] = [
                'id'             => $question->id,
                'order'          => $question->order,
                'question_text'  => $question->question_text,
                'type'           => $question->type,
                'points'         => $question->points,
                'options'        => $question->options,
                'rubric'         => $question->rubric ?? null,
                'student_answer' => $answerData['student_answer'] ?? null,
                'correct_answer' => $question->correct_answer,
                'is_correct'     => $isCorrect,
                'points_earned'  => $pointsEarned,
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
                'type'        => $exam->type,
            ],
            'questions' => $questionResults,
        ]);
    }
}