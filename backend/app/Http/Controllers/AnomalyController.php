<?php

namespace App\Http\Controllers;

use App\Models\ExamAnomalySummary;
use App\Models\ExamSubmission;
use App\Models\KeyboardShortcutLog;
use App\Models\KeystrokeDynamicsLog;
use App\Models\ResponseTimeLog;
use App\Models\TabSwitchLog;
use App\Models\Exam;
use App\Services\AnomalyDetectionService;
use Illuminate\Http\Request;

/**
 * AnomalyController
 *
 * Student endpoints (called silently by the frontend collector):
 *   POST /student/exams/{examId}/anomalies/tab-switch
 *   POST /student/exams/{examId}/anomalies/keyboard-shortcut
 *   POST /student/exams/{examId}/anomalies/response-time
 *   POST /student/exams/{examId}/anomalies/keystroke-dynamics
 *
 * Instructor endpoints:
 *   GET   /exams/{examId}/anomalies                             — logs by type
 *   GET   /exams/{examId}/anomalies/summary                    — risk scores per student
 *   GET   /exams/{examId}/submissions/{submissionId}/anomalies — single student detail
 *   PATCH /exams/{examId}/anomalies/{logId}/review             — mark log reviewed
 */
class AnomalyController extends Controller
{
    public function __construct(private AnomalyDetectionService $service) {}

    // ══════════════════════════════════════════════════════════════════════
    // STUDENT — event ingestion
    // ══════════════════════════════════════════════════════════════════════

    public function tabSwitch(Request $request, int $examId)
    {
        $submission = $this->getActiveSubmission($examId, $request->user()->id);
        if (!$submission) {
            return response()->json(['message' => 'No active submission found.'], 404);
        }
        if (!$submission->exam->tab_switching_monitor) {
            return response()->json(['message' => 'Tab-switch monitoring is disabled for this exam.'], 200);
        }

        $payload = $request->validate([
            'hidden_duration_ms' => 'nullable|integer|min:0',
            'timestamp'          => 'nullable|string',
        ]);

        $log = $this->service->processTabSwitch($submission, $payload);

        return response()->json(['message' => 'Tab switch recorded.', 'severity' => $log->severity, 'log_id' => $log->id], 201);
    }

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
            'keys'        => 'required|string|max:100',
            'timestamp'   => 'nullable|string',
            'char_count'  => 'nullable|integer|min:0',
            'question_id' => 'nullable|integer|exists:questions,id',
        ]);

        $log = $this->service->processKeyboardShortcut($submission, $payload);

        if (!$log) {
            return response()->json(['message' => 'Shortcut is not monitored.'], 200);
        }

        return response()->json(['message' => 'Keyboard shortcut recorded.', 'severity' => $log->severity, 'log_id' => $log->id], 201);
    }

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

        return response()->json(['message' => 'Response time recorded.', 'severity' => $log->severity, 'log_id' => $log->id], 201);
    }

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
            'question_id'      => 'required|integer|exists:questions,id',
            'dwell_times_ms'   => 'required|array|min:1',
            'dwell_times_ms.*' => 'integer|min:0',
            'flight_times_ms'  => 'nullable|array',
            'flight_times_ms.*'=> 'integer|min:0',
            'total_chars'      => 'required|integer|min:1',
            'duration_ms'      => 'required|integer|min:1',
            'timestamp'        => 'nullable|string',
        ]);

        $log = $this->service->processKeystrokeDynamics($submission, $payload);

        return response()->json(['message' => 'Keystroke dynamics recorded.', 'severity' => $log->severity, 'log_id' => $log->id], 201);
    }

    // ══════════════════════════════════════════════════════════════════════
    // INSTRUCTOR — review endpoints
    // ══════════════════════════════════════════════════════════════════════

    /**
     * GET /exams/{examId}/anomalies?type=tab_switch&severity=high
     *
     * With ?type  → query only that table, return paginated logs.
     * Without     → return counts + latest 20 rows per table for the overview.
     */
    public function index(Request $request, int $examId)
    {
        $this->verifyInstructorOwnsExam($examId, $request->user()->id);

        $type     = $request->input('type');
        $severity = $request->input('severity');

        $modelClass = match ($type) {
            'tab_switch'         => TabSwitchLog::class,
            'keyboard_shortcut'  => KeyboardShortcutLog::class,
            'response_time'      => ResponseTimeLog::class,
            'keystroke_dynamics' => KeystrokeDynamicsLog::class,
            default              => null,
        };

        if ($modelClass) {
            $query = $modelClass::where('exam_id', $examId)
                ->with('student:id,name,email')
                ->orderBy('occurred_at', 'desc');

            if ($severity) {
                $query->where('severity', $severity);
            }

            return response()->json(['type' => $type, 'logs' => $query->paginate(50)]);
        }

        // No type filter — overview counts + latest 20 per table
        return response()->json([
            'counts' => [
                'tab_switch'         => TabSwitchLog::where('exam_id', $examId)->count(),
                'keyboard_shortcut'  => KeyboardShortcutLog::where('exam_id', $examId)->count(),
                'response_time'      => ResponseTimeLog::where('exam_id', $examId)->count(),
                'keystroke_dynamics' => KeystrokeDynamicsLog::where('exam_id', $examId)->count(),
            ],
            'recent' => [
                'tab_switch'         => TabSwitchLog::where('exam_id', $examId)->with('student:id,name,email')->latest('occurred_at')->limit(20)->get(),
                'keyboard_shortcut'  => KeyboardShortcutLog::where('exam_id', $examId)->with(['student:id,name,email', 'question:id,question_text,order'])->latest('occurred_at')->limit(20)->get(),
                'response_time'      => ResponseTimeLog::where('exam_id', $examId)->with(['student:id,name,email', 'question:id,question_text,order'])->latest('occurred_at')->limit(20)->get(),
                'keystroke_dynamics' => KeystrokeDynamicsLog::where('exam_id', $examId)->with(['student:id,name,email', 'question:id,question_text,order'])->latest('occurred_at')->limit(20)->get(),
            ],
        ]);
    }

    /**
     * GET /exams/{examId}/anomalies/summary
     */
    public function summary(Request $request, int $examId)
    {
        $this->verifyInstructorOwnsExam($examId, $request->user()->id);

        $summaries = ExamAnomalySummary::where('exam_id', $examId)
            ->with('student:id,name,email')
            ->orderBy('risk_score', 'desc')
            ->get()
            ->map(fn($s) => [
                'student'                     => $s->student,
                'submission_id'               => $s->submission_id,
                'risk_score'                  => $s->risk_score,
                'flag_status'                 => $s->flag_status,
                'tab_switch_count'            => $s->tab_switch_count,
                'keyboard_shortcut_count'     => $s->keyboard_shortcut_count,
                'response_time_anomaly_count' => $s->response_time_anomaly_count,
                'keystroke_anomaly_count'     => $s->keystroke_anomaly_count,
                'last_anomaly_at'             => $s->last_anomaly_at,
            ]);

        return response()->json(['summaries' => $summaries]);
    }

    /**
     * GET /exams/{examId}/submissions/{submissionId}/anomalies
     *
     * Returns all four log types grouped under 'logs', plus the summary row.
     */
    public function show(Request $request, int $examId, int $submissionId)
    {
        $this->verifyInstructorOwnsExam($examId, $request->user()->id);

        $submission = ExamSubmission::where('id', $submissionId)
            ->where('exam_id', $examId)
            ->with('student:id,name,email')
            ->firstOrFail();

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
            'summary' => ExamAnomalySummary::where('submission_id', $submissionId)->first(),
            'logs'    => [
                'tab_switch'         => TabSwitchLog::where('submission_id', $submissionId)->orderBy('occurred_at')->get(),
                'keyboard_shortcut'  => KeyboardShortcutLog::where('submission_id', $submissionId)->with('question:id,question_text,order')->orderBy('occurred_at')->get(),
                'response_time'      => ResponseTimeLog::where('submission_id', $submissionId)->with('question:id,question_text,order')->orderBy('occurred_at')->get(),
                'keystroke_dynamics' => KeystrokeDynamicsLog::where('submission_id', $submissionId)->with('question:id,question_text,order')->orderBy('occurred_at')->get(),
            ],
        ]);
    }

    /**
     * PATCH /exams/{examId}/anomalies/{logId}/review?type=tab_switch
     *
     * ?type is required — tells the controller which table to update.
     */
    public function review(Request $request, int $examId, int $logId)
    {
        $this->verifyInstructorOwnsExam($examId, $request->user()->id);

        $modelClass = match ($request->input('type')) {
            'tab_switch'         => TabSwitchLog::class,
            'keyboard_shortcut'  => KeyboardShortcutLog::class,
            'response_time'      => ResponseTimeLog::class,
            'keystroke_dynamics' => KeystrokeDynamicsLog::class,
            default              => null,
        };

        if (!$modelClass) {
            return response()->json(['message' => 'Invalid or missing ?type parameter.'], 422);
        }

        $log = $modelClass::where('id', $logId)->where('exam_id', $examId)->firstOrFail();

        $log->update($request->validate([
            'reviewed'       => 'required|boolean',
            'reviewer_notes' => 'nullable|string|max:1000',
        ]));

        return response()->json(['message' => 'Review saved.', 'log' => $log]);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private function getActiveSubmission(int $examId, int $studentId): ?ExamSubmission
    {
        return ExamSubmission::where('exam_id', $examId)
            ->where('student_id', $studentId)
            ->where('status', 'in_progress')
            ->with('exam')
            ->first();
    }

    private function verifyInstructorOwnsExam(int $examId, int $instructorId): void
    {
        Exam::where('id', $examId)->where('instructor_id', $instructorId)->firstOrFail();
    }
}