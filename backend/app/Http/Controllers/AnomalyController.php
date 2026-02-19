<?php

namespace App\Http\Controllers;

use App\Models\ExamAnomalyLog;
use App\Models\ExamAnomalySummary;
use App\Models\ExamSubmission;
use App\Models\Exam;
use App\Services\AnomalyDetectionService;
use Illuminate\Http\Request;

/**
 * AnomalyController
 *
 * ── Student-facing endpoints (called by the frontend collector) ──────────
 *   POST /student/exams/{examId}/anomalies/tab-switch
 *   POST /student/exams/{examId}/anomalies/keyboard-shortcut
 *   POST /student/exams/{examId}/anomalies/response-time
 *   POST /student/exams/{examId}/anomalies/keystroke-dynamics
 *
 * ── Instructor-facing endpoints ───────────────────────────────────────────
 *   GET  /exams/{examId}/anomalies                    — all logs for an exam
 *   GET  /exams/{examId}/anomalies/summary            — risk summaries per student
 *   GET  /exams/{examId}/submissions/{submissionId}/anomalies — one student detail
 *   PATCH /exams/{examId}/anomalies/{logId}/review    — mark log reviewed
 */
class AnomalyController extends Controller
{
    public function __construct(private AnomalyDetectionService $service) {}

    // ══════════════════════════════════════════════════════════════════════
    // STUDENT — event ingestion
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Receive a tab-switch event from the frontend.
     *
     * Body: { hidden_duration_ms: int, timestamp: string }
     */
    public function tabSwitch(Request $request, int $examId)
    {
        $submission = $this->getActiveSubmission($examId, $request->user()->id);
        if (!$submission) {
            return response()->json(['message' => 'No active submission found.'], 404);
        }

        // Verify tab_switching_monitor is enabled for this exam
        if (!$submission->exam->tab_switching_monitor) {
            return response()->json(['message' => 'Tab-switch monitoring is disabled for this exam.'], 200);
        }

        $payload = $request->validate([
            'hidden_duration_ms' => 'nullable|integer|min:0',
            'timestamp'          => 'nullable|string',
        ]);

        $log = $this->service->processTabSwitch($submission, $payload);

        return response()->json([
            'message'  => 'Tab switch recorded.',
            'severity' => $log->severity,
            'log_id'   => $log->id,
        ], 201);
    }

    /**
     * Receive a keyboard-shortcut event from the frontend.
     *
     * Body: { keys: string, timestamp: string }
     */
    public function keyboardShortcut(Request $request, int $examId)
    {
        $submission = $this->getActiveSubmission($examId, $request->user()->id);
        if (!$submission) {
            return response()->json(['message' => 'No active submission found.'], 404);
        }

        if (!$submission->exam->keyboard_analysis) {
            return response()->json(['message' => 'Keyboard analysis is disabled for this exam.'], 200);
        }

        $payload = $request->validate([
            'keys'      => 'required|string|max:100',
            'timestamp' => 'nullable|string',
        ]);

        $log = $this->service->processKeyboardShortcut($submission, $payload);

        if (!$log) {
            return response()->json(['message' => 'Shortcut is not monitored.'], 200);
        }

        return response()->json([
            'message'  => 'Keyboard shortcut recorded.',
            'severity' => $log->severity,
            'log_id'   => $log->id,
        ], 201);
    }

    /**
     * Receive a response-time measurement from the frontend.
     *
     * Body: { question_id: int, response_time_ms: int, timestamp: string }
     */
    public function responseTime(Request $request, int $examId)
    {
        $submission = $this->getActiveSubmission($examId, $request->user()->id);
        if (!$submission) {
            return response()->json(['message' => 'No active submission found.'], 404);
        }

        $payload = $request->validate([
            'question_id'      => 'required|integer|exists:questions,id',
            'response_time_ms' => 'required|integer|min:1',
            'timestamp'        => 'nullable|string',
        ]);

        $log = $this->service->processResponseTime($submission, $payload);

        if (!$log) {
            return response()->json(['message' => 'Response time within normal range.'], 200);
        }

        return response()->json([
            'message'  => 'Response time recorded.',
            'severity' => $log->severity,
            'log_id'   => $log->id,
        ], 201);
    }

    /**
     * Receive keystroke-dynamics data from the frontend.
     *
     * Body: {
     *   question_id     : int,
     *   dwell_times_ms  : int[],
     *   flight_times_ms : int[],
     *   total_chars     : int,
     *   duration_ms     : int,
     *   timestamp       : string
     * }
     */
    public function keystrokeDynamics(Request $request, int $examId)
    {
        $submission = $this->getActiveSubmission($examId, $request->user()->id);
        if (!$submission) {
            return response()->json(['message' => 'No active submission found.'], 404);
        }

        if (!$submission->exam->keyboard_analysis) {
            return response()->json(['message' => 'Keyboard analysis is disabled for this exam.'], 200);
        }

        $payload = $request->validate([
            'question_id'     => 'required|integer|exists:questions,id',
            'dwell_times_ms'  => 'required|array|min:1',
            'dwell_times_ms.*'=> 'integer|min:0',
            'flight_times_ms' => 'nullable|array',
            'flight_times_ms.*'=> 'integer|min:0',
            'total_chars'     => 'required|integer|min:1',
            'duration_ms'     => 'required|integer|min:1',
            'timestamp'       => 'nullable|string',
        ]);

        $log = $this->service->processKeystrokeDynamics($submission, $payload);

        if (!$log) {
            return response()->json(['message' => 'Keystroke dynamics within normal range.'], 200);
        }

        return response()->json([
            'message'  => 'Keystroke dynamics recorded.',
            'severity' => $log->severity,
            'log_id'   => $log->id,
        ], 201);
    }

    // ══════════════════════════════════════════════════════════════════════
    // INSTRUCTOR — review endpoints
    // ══════════════════════════════════════════════════════════════════════

    /**
     * List all anomaly logs for an exam (paginated).
     * Query params: type, severity, page
     *
     * GET /exams/{examId}/anomalies
     */
    public function index(Request $request, int $examId)
    {
        $this->verifyInstructorOwnsExam($examId, $request->user()->id);

        $query = ExamAnomalyLog::where('exam_id', $examId)
            ->with(['student:id,name,email', 'question:id,question_text,order'])
            ->orderBy('occurred_at', 'desc');

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }
        if ($request->filled('severity')) {
            $query->where('severity', $request->input('severity'));
        }

        return response()->json([
            'logs' => $query->paginate(50),
        ]);
    }

    /**
     * Risk-score summary for every student in an exam.
     *
     * GET /exams/{examId}/anomalies/summary
     */
    public function summary(Request $request, int $examId)
    {
        $this->verifyInstructorOwnsExam($examId, $request->user()->id);

        $summaries = ExamAnomalySummary::where('exam_id', $examId)
            ->with('student:id,name,email')
            ->orderBy('risk_score', 'desc')
            ->get()
            ->map(fn ($s) => [
                'student'                      => $s->student,
                'submission_id'                => $s->submission_id,
                'risk_score'                   => $s->risk_score,
                'flag_status'                  => $s->flag_status,
                'tab_switch_count'             => $s->tab_switch_count,
                'keyboard_shortcut_count'      => $s->keyboard_shortcut_count,
                'response_time_anomaly_count'  => $s->response_time_anomaly_count,
                'keystroke_anomaly_count'       => $s->keystroke_anomaly_count,
                'last_anomaly_at'              => $s->last_anomaly_at,
            ]);

        return response()->json(['summaries' => $summaries]);
    }

    /**
     * Detailed anomaly log for a single student submission.
     *
     * GET /exams/{examId}/submissions/{submissionId}/anomalies
     */
    public function show(Request $request, int $examId, int $submissionId)
    {
        $this->verifyInstructorOwnsExam($examId, $request->user()->id);

        $submission = ExamSubmission::where('id', $submissionId)
            ->where('exam_id', $examId)
            ->with('student:id,name,email')
            ->firstOrFail();

        $summary = ExamAnomalySummary::where('submission_id', $submissionId)->first();

        $logs = ExamAnomalyLog::where('submission_id', $submissionId)
            ->with('question:id,question_text,order')
            ->orderBy('occurred_at')
            ->get();

        return response()->json([
            'student'    => $submission->student,
            'submission' => [
                'id'           => $submission->id,
                'status'       => $submission->status,
                'started_at'   => $submission->started_at,
                'submitted_at' => $submission->submitted_at,
                'score'        => $submission->score,
                'total_points' => $submission->total_points,
            ],
            'summary'    => $summary,
            'logs'       => $logs,
        ]);
    }

    /**
     * Mark an anomaly log entry as reviewed.
     *
     * PATCH /exams/{examId}/anomalies/{logId}/review
     * Body: { reviewed: bool, reviewer_notes: string }
     */
    public function review(Request $request, int $examId, int $logId)
    {
        $this->verifyInstructorOwnsExam($examId, $request->user()->id);

        $log = ExamAnomalyLog::where('id', $logId)
            ->where('exam_id', $examId)
            ->firstOrFail();

        $data = $request->validate([
            'reviewed'       => 'required|boolean',
            'reviewer_notes' => 'nullable|string|max:1000',
        ]);

        $log->update($data);

        return response()->json([
            'message' => 'Review saved.',
            'log'     => $log,
        ]);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * Fetch the student's active (in_progress) submission for an exam,
     * eagerly loading the exam so we can check feature flags.
     */
    private function getActiveSubmission(int $examId, int $studentId): ?ExamSubmission
    {
        return ExamSubmission::where('exam_id', $examId)
            ->where('student_id', $studentId)
            ->where('status', 'in_progress')
            ->with('exam')
            ->first();
    }

    /**
     * Ensure the authenticated instructor owns the given exam.
     * Aborts with 403 / 404 if not.
     */
    private function verifyInstructorOwnsExam(int $examId, int $instructorId): void
    {
        Exam::where('id', $examId)
            ->where('instructor_id', $instructorId)
            ->firstOrFail();
    }
}
