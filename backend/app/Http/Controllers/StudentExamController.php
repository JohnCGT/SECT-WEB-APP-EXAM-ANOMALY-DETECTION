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
    private function answersMatch(?string $studentAnswer, ?string $correctAnswer): bool
    {
        if ($studentAnswer === null || $correctAnswer === null) {
            return false;
        }
        return strtolower(trim($studentAnswer)) === strtolower(trim($correctAnswer));
    }

    /**
     * GET /student/grades
     *
     * Returns per-course grade summary derived from exam submissions,
     * plus overall GPA and cumulative stats.
     */
    public function grades(Request $request)
    {
        $student = $this->getStudent($request);

        $courses = $student->enrolledCourses()
            ->with([
                'instructor:id,name',
                'exams' => function ($query) {
                    $query->where('status', '!=', 'draft')
                        ->withCount('questions');
                },
                'exams.submissions' => function ($query) use ($student) {
                    $query->where('student_id', $student->id)
                        ->where('status', 'submitted');
                },
            ])
            ->get();

        $courseGrades = $courses->map(function ($course) {
            $exams = $course->exams;

            $submitted = $exams->filter(fn($e) =>
                $e->submissions->isNotEmpty()
            );

            // Per-exam breakdown
            $examBreakdown = $exams->map(function ($exam) {
                $sub = $exam->submissions->first();
                $pct = null;
                if ($sub && $exam->total_points > 0) {
                    $pct = round(($sub->score / $exam->total_points) * 100, 1);
                }
                return [
                    'id'           => $exam->id,
                    'title'        => $exam->title,
                    'type'         => $exam->type,
                    'total_points' => $exam->total_points,
                    'end_time'     => $exam->end_time,
                    'submitted'    => $sub !== null,
                    'score'        => $sub?->score,
                    'percentage'   => $pct,
                    'submitted_at' => $sub?->submitted_at,
                ];
            })->values();

            // Overall course score: average of submitted exam percentages
            $average = null;
            if ($submitted->count() > 0) {
                $total = $submitted->sum(function ($exam) {
                    $sub = $exam->submissions->first();
                    if (!$sub || $exam->total_points == 0) return 0;
                    return ($sub->score / $exam->total_points) * 100;
                });
                $average = round($total / $submitted->count(), 1);
            }

            return [
                'course_id'       => $course->id,
                'course_name'     => $course->name,
                'course_code'     => $course->code,
                'semester'        => $course->semester,
                'credits'         => $course->credits ?? 3,
                'instructor'      => $course->instructor?->name,
                'total_exams'     => $exams->count(),
                'submitted_exams' => $submitted->count(),
                'average'         => $average,
                'letter_grade'    => $this->letterGrade($average),
                'grade_points'    => $this->gradePoints($average),
                'exams'           => $examBreakdown,
            ];
        });

        // GPA = sum(grade_points * credits) / sum(credits) — only courses with a grade
        $gradedCourses = $courseGrades->filter(fn($c) => $c['average'] !== null);

        $totalWeightedPoints = $gradedCourses->sum(fn($c) =>
            $c['grade_points'] * $c['credits']
        );
        $totalCredits = $gradedCourses->sum(fn($c) => $c['credits']);

        $gpa = $totalCredits > 0
            ? round($totalWeightedPoints / $totalCredits, 2)
            : null;

        // Total credits enrolled (all courses, not just graded)
        $enrolledCredits = $courseGrades->sum(fn($c) => $c['credits']);

        return response()->json([
            'gpa'              => $gpa,
            'enrolled_credits' => $enrolledCredits,
            'graded_credits'   => $totalCredits,
            'courses'          => $courseGrades->values(),
        ]);
    }

    private function letterGrade(?float $pct): ?string
    {
        if ($pct === null) return null;
        if ($pct >= 97) return 'A+';
        if ($pct >= 93) return 'A';
        if ($pct >= 90) return 'A-';
        if ($pct >= 87) return 'B+';
        if ($pct >= 83) return 'B';
        if ($pct >= 80) return 'B-';
        if ($pct >= 77) return 'C+';
        if ($pct >= 73) return 'C';
        if ($pct >= 70) return 'C-';
        if ($pct >= 60) return 'D';
        return 'F';
    }

    private function gradePoints(?float $pct): float
    {
        if ($pct === null) return 0.0;
        if ($pct >= 97) return 4.0;
        if ($pct >= 93) return 4.0;
        if ($pct >= 90) return 3.7;
        if ($pct >= 87) return 3.3;
        if ($pct >= 83) return 3.0;
        if ($pct >= 80) return 2.7;
        if ($pct >= 77) return 2.3;
        if ($pct >= 73) return 2.0;
        if ($pct >= 70) return 1.7;
        if ($pct >= 60) return 1.0;
        return 0.0;
    }

    /**
     * GET /student/exams
     *
     * Returns all exams across every course the authenticated student
     * is enrolled in, each with their submission status if any.
     * Used by the new ExamsPage.jsx.
     */
    public function allExams(Request $request)
    {
        $student = $this->getStudent($request);

        // Collect all course IDs the student is enrolled in
        $courseIds = $student->enrolledCourses()->pluck('courses.id');

        $exams = Exam::whereIn('course_id', $courseIds)
            ->with([
                'course:id,name,code',
                'submissions' => function ($query) use ($student) {
                    $query->where('student_id', $student->id)
                          ->latest()
                          ->limit(1);
                },
            ])
            ->withCount('questions')
            ->orderBy('start_time', 'asc')
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
                    'course'           => $exam->course ? [
                        'id'   => $exam->course->id,
                        'name' => $exam->course->name,
                        'code' => $exam->course->code,
                    ] : null,
                    'submission' => $sub ? [
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

        if ($exam->shuffle_questions) {
            $seed = crc32($submission->id . '_' . $examId);
            mt_srand($seed);
            $arr = $questions->values()->all();
            for ($i = count($arr) - 1; $i > 0; $i--) {
                $j = mt_rand(0, $i);
                [$arr[$i], $arr[$j]] = [$arr[$j], $arr[$i]];
            }
            $questions = collect($arr);
        }

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
     * FIX: Essays are stored with points_earned = NULL and is_correct = null
     * at submission time. This is the only way to distinguish "not yet graded
     * by instructor" (null) from "instructor awarded 0 points" (0).
     * Previously storing 0 caused EssayGradingController to treat all essays
     * as already graded on first load.
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

            $isCorrect    = null;  // default for essay
            $pointsEarned = null;  // default for essay (null = awaiting instructor grade)

            if (in_array($question->type, ['multiple_choice', 'true_false'])) {
                // Auto-grade MC and T/F immediately
                $isCorrect    = $this->answersMatch($studentAnswer, (string) $question->correct_answer);
                $pointsEarned = $isCorrect ? $question->points : 0;
                $score       += $pointsEarned;
            }
            // Essays: points_earned stays NULL — instructor must grade manually.
            // They do NOT contribute to score until graded.

            $gradedAnswers[] = [
                'question_id'     => $question->id,
                'student_answer'  => $studentAnswer,
                'correct_answer'  => $question->correct_answer,
                'is_correct'      => $isCorrect,
                'points_earned'   => $pointsEarned,   // null for essays
                'points_possible' => $question->points,
            ];
        }

        $submission->update([
            'status'       => 'submitted',
            'submitted_at' => now(),
            'score'        => $score,   // only MC/TF score for now; essays add to it when graded
            'answers'      => $gradedAnswers,
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

        $raw     = $submission->answers;
        $answers = is_string($raw) ? json_decode($raw, true) : (array) ($raw ?? []);

        $questionResults = [];

        foreach ($exam->questions as $question) {
            $answerData = collect($answers)->firstWhere('question_id', $question->id);

            if ($question->type !== 'essay') {
                $storedStudentAnswer = $answerData['student_answer'] ?? null;
                $storedCorrectAnswer = $answerData['correct_answer'] ?? $question->correct_answer;
                $isCorrect    = $this->answersMatch(
                    $storedStudentAnswer !== null ? (string) $storedStudentAnswer : null,
                    (string) $storedCorrectAnswer
                );
                $pointsEarned = $isCorrect ? $question->points : 0;
            } else {
                // Essay: use whatever the instructor set (may still be null = pending)
                $isCorrect    = $answerData['is_correct']    ?? null;
                $pointsEarned = $answerData['points_earned'] ?? null;
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
                'feedback'       => $answerData['feedback'] ?? null,
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
            'exam' => [
                'id'          => $exam->id,
                'title'       => $exam->title,
                'description' => $exam->description,
                'type'        => $exam->type,
            ],
            'questions' => $questionResults,
        ]);
    }
}