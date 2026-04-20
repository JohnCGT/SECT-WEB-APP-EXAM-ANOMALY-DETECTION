<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ExamSubmission;
use App\Models\Question;
use Illuminate\Http\Request;

/**
 * EssayGradingController
 *
 * Instructor endpoints:
 *   GET   /exams/{examId}/essays/pending                         — all ungraded essay answers
 *   GET   /exams/{examId}/essays/stats                           — quick pending count (badge)
 *   PATCH /exams/{examId}/essays/{submissionId}                  — grade essay answers
 *   GET   /exams/{examId}/submissions/{submissionId}/student-pdf — full data for per-student PDF
 */
class EssayGradingController extends Controller
{
    // ── Helpers ──────────────────────────────────────────────────────────────

    private function verifyOwnership(int $examId, int $instructorId): Exam
    {
        return Exam::where('id', $examId)
            ->where('instructor_id', $instructorId)
            ->firstOrFail();
    }

    // ── GET /exams/{examId}/essays/pending ────────────────────────────────────
    public function pending(Request $request, int $examId)
    {
        $exam = $this->verifyOwnership($examId, $request->user()->id);

        $essayQuestions = Question::where('exam_id', $examId)
            ->where('type', 'essay')
            ->get()
            ->keyBy('id');

        if ($essayQuestions->isEmpty()) {
            return response()->json(['pending_count' => 0, 'submissions' => []]);
        }

        $submissions = ExamSubmission::where('exam_id', $examId)
            ->where('status', 'submitted')
            ->with('student:id,name,email')
            ->orderBy('submitted_at', 'desc')
            ->get();

        $result       = [];
        $pendingCount = 0;

        foreach ($submissions as $submission) {
            $raw     = $submission->answers;
            $answers = is_string($raw) ? json_decode($raw, true) : (array) ($raw ?? []);
            $essays  = [];

            foreach ($essayQuestions as $qId => $question) {
                $answerData    = collect($answers)->firstWhere('question_id', $qId);
                $studentAnswer = $answerData['student_answer'] ?? null;
                $pointsEarned  = $answerData['points_earned']  ?? null;

                if ($studentAnswer === null || trim($studentAnswer) === '') continue;

                $essays[] = [
                    'question_id'    => $question->id,
                    'question_text'  => $question->question_text,
                    'points'         => $question->points,
                    'max_words'      => $question->max_words,
                    'rubric'         => $question->rubric,
                    'student_answer' => $studentAnswer,
                    'points_earned'  => $pointsEarned,
                    'feedback'       => $answerData['feedback'] ?? null,
                    'is_graded'      => $pointsEarned !== null,
                ];

                if ($pointsEarned === null) $pendingCount++;
            }

            if (empty($essays)) continue;

            $result[] = [
                'submission_id' => $submission->id,
                'student'       => $submission->student,
                'submitted_at'  => $submission->submitted_at,
                'score'         => $submission->score,
                'total_points'  => $submission->total_points,
                'essays'        => $essays,
            ];
        }

        return response()->json(['pending_count' => $pendingCount, 'submissions' => $result]);
    }

    // ── PATCH /exams/{examId}/essays/{submissionId} ───────────────────────────
    public function grade(Request $request, int $examId, int $submissionId)
    {
        $exam = $this->verifyOwnership($examId, $request->user()->id);

        $submission = ExamSubmission::where('id', $submissionId)
            ->where('exam_id', $examId)
            ->where('status', 'submitted')
            ->firstOrFail();

        $request->validate([
            'grades'                 => 'required|array|min:1',
            'grades.*.question_id'   => 'required|integer|exists:questions,id',
            'grades.*.points_earned' => 'required|numeric|min:0',
            'grades.*.feedback'      => 'nullable|string|max:2000',
        ]);

        $essayQuestions = Question::where('exam_id', $examId)
            ->where('type', 'essay')
            ->get()
            ->keyBy('id');

        foreach ($request->grades as $grade) {
            $q = $essayQuestions->get($grade['question_id']);
            if ($q && $grade['points_earned'] > $q->points) {
                return response()->json([
                    'message' => "Points awarded ({$grade['points_earned']}) cannot exceed max ({$q->points}) for question {$q->id}.",
                ], 422);
            }
        }

        $raw      = $submission->answers;
        $answers  = is_string($raw) ? json_decode($raw, true) : (array) ($raw ?? []);
        $gradeMap = collect($request->grades)->keyBy('question_id');

        $newAnswers = array_map(function ($answer) use ($gradeMap) {
            $grade = $gradeMap->get($answer['question_id'] ?? null);
            if ($grade) {
                $answer['points_earned'] = (float) $grade['points_earned'];
                $answer['is_correct']    = $grade['points_earned'] > 0;
                if (!empty($grade['feedback'])) {
                    $answer['feedback'] = $grade['feedback'];
                }
            }
            return $answer;
        }, $answers);

        $newScore = collect($newAnswers)->sum(fn ($a) => (float) ($a['points_earned'] ?? 0));
        $submission->update(['answers' => $newAnswers, 'score' => $newScore]);

        return response()->json([
            'message'    => 'Essays graded successfully.',
            'submission' => [
                'id'           => $submission->id,
                'score'        => $submission->score,
                'total_points' => $submission->total_points,
            ],
        ]);
    }

    // ── GET /exams/{examId}/essays/stats ──────────────────────────────────────
    public function stats(Request $request, int $examId)
    {
        $exam = $this->verifyOwnership($examId, $request->user()->id);

        $essayQIds = Question::where('exam_id', $examId)
            ->where('type', 'essay')
            ->pluck('id')
            ->toArray();

        if (empty($essayQIds)) {
            return response()->json(['pending_count' => 0, 'has_essays' => false]);
        }

        $submissions = ExamSubmission::where('exam_id', $examId)
            ->where('status', 'submitted')
            ->get(['answers']);

        $pending = 0;
        foreach ($submissions as $submission) {
            $raw     = $submission->answers;
            $answers = is_string($raw) ? json_decode($raw, true) : (array) ($raw ?? []);
            foreach ($answers as $a) {
                if (
                    in_array($a['question_id'] ?? null, $essayQIds) &&
                    !empty($a['student_answer']) &&
                    ($a['points_earned'] ?? null) === null
                ) {
                    $pending++;
                }
            }
        }

        return response()->json(['has_essays' => true, 'pending_count' => $pending]);
    }

    // ── GET /exams/{examId}/submissions/{submissionId}/student-pdf ────────────
    /**
     * Returns the complete data payload the client needs to build a per-student PDF.
     * No server-side PDF library is needed — jsPDF handles rendering in the browser.
     *
     * Includes:
     *  - Exam metadata
     *  - Student info
     *  - Submission stats (score, %, timing)
     *  - Full CPI integrity breakdown from exam_results
     *  - All questions with the student's answer, correctness, points, and feedback
     */
    public function submissionPdf(Request $request, int $examId, int $submissionId)
    {
        $exam = $this->verifyOwnership($examId, $request->user()->id);

        $submission = ExamSubmission::where('id', $submissionId)
            ->where('exam_id', $examId)
            ->with(['student:id,name,email', 'exam.course'])
            ->firstOrFail();

        $questions = Question::where('exam_id', $examId)
            ->orderBy('order')
            ->get()
            ->keyBy('id');

        $raw     = $submission->answers;
        $answers = is_string($raw) ? json_decode($raw, true) : (array) ($raw ?? []);

        $answerList = [];
        foreach ($questions as $question) {
            $answerData    = collect($answers)->firstWhere('question_id', $question->id);
            $studentAnswer = $answerData['student_answer'] ?? null;
            $pointsEarned  = $answerData['points_earned']  ?? null;
            $isCorrect     = $answerData['is_correct']     ?? null;
            $feedback      = $answerData['feedback']       ?? null;

            // Re-derive MC/TF correctness so old buggy submissions are self-healed
            if (in_array($question->type, ['multiple_choice', 'true_false']) && $studentAnswer !== null) {
                $isCorrect    = strtolower(trim((string) $studentAnswer))
                             === strtolower(trim((string) $question->correct_answer));
                $pointsEarned = $isCorrect ? $question->points : 0;
            }

            $answerList[] = [
                'question_id'    => $question->id,
                'order'          => $question->order,
                'question_text'  => $question->question_text,
                'type'           => $question->type,
                'points'         => $question->points,
                'options'        => $question->options,
                'correct_answer' => $question->correct_answer,
                'student_answer' => $studentAnswer,
                'is_correct'     => $isCorrect,
                'points_earned'  => $pointsEarned,
                'feedback'       => $feedback,
                'rubric'         => $question->rubric,
                'max_words'      => $question->max_words,
            ];
        }

        $examResult = ExamResult::where('submission_id', $submissionId)->first();

        $integrity = $examResult ? [
            'cpi_score'                   => $examResult->cpi_score,
            'cpi_label'                   => $examResult->cpi_label,
            'is_flagged'                  => $examResult->is_flagged,
            'iso_tab_score'               => $examResult->iso_tab_score,
            'iso_tab_flagged'             => $examResult->iso_tab_flagged,
            'svm_score'                   => $examResult->svm_score,
            'svm_flagged'                 => $examResult->svm_flagged,
            'rt_score'                    => $examResult->rt_score,
            'rt_flagged'                  => $examResult->rt_flagged,
            'hmm_score'                   => $examResult->hmm_score,
            'hmm_flagged'                 => $examResult->hmm_flagged,
            'tab_switch_count'            => $examResult->tab_switch_count            ?? 0,
            'keyboard_shortcut_count'     => $examResult->keyboard_shortcut_count     ?? 0,
            'response_time_anomaly_count' => $examResult->response_time_anomaly_count ?? 0,
            'keystroke_anomaly_count'     => $examResult->keystroke_anomaly_count     ?? 0,
        ] : null;

        $totalPoints = $questions->sum('points');
        $score       = (float) ($submission->score ?? 0);

        return response()->json([
            'exam' => [
                'id'               => $exam->id,
                'title'            => $exam->title,
                'type'             => $exam->type,
                'course'           => $exam->course ? [
                    'code' => $exam->course->code,
                    'name' => $exam->course->name,
                ] : null,
                'duration_minutes' => $exam->duration_minutes,
                'start_time'       => $exam->start_time,
                'end_time'         => $exam->end_time,
                'total_points'     => $totalPoints,
            ],
            'student'    => $submission->student,
            'submission' => [
                'id'           => $submission->id,
                'status'       => $submission->status,
                'score'        => $score,
                'total_points' => $totalPoints,
                'percentage'   => $totalPoints > 0 ? round(($score / $totalPoints) * 100, 2) : 0,
                'started_at'   => $submission->started_at,
                'submitted_at' => $submission->submitted_at,
            ],
            'integrity' => $integrity,
            'answers'   => $answerList,
        ]);
    }
}