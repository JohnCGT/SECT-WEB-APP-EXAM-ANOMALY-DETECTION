<?php

namespace App\Http\Controllers;

use App\Models\ExamResult;
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
 * Student endpoints:
 *   POST /student/exams/{examId}/anomalies/tab-switch
 *   POST /student/exams/{examId}/anomalies/keyboard-shortcut
 *   POST /student/exams/{examId}/anomalies/response-time
 *   POST /student/exams/{examId}/anomalies/keystroke-dynamics
 *
 * Instructor endpoints:
 *   GET   /exams/{examId}/anomalies
 *   GET   /exams/{examId}/anomalies/summary
 *   GET   /exams/{examId}/submissions/{submissionId}/anomalies
 *   PATCH /exams/{examId}/anomalies/{logId}/review
 *
 * ── Changes ──────────────────────────────────────────────────────────────────
 *
 *  FIX-SUMMARY   Removed every reference to ExamAnomalySummary /
 *                exam_anomaly_summaries.  Summary data now lives in exam_results.
 *
 *  FIX-KEYBOARD  keyboard_analysis check: treat null as TRUE so exams that were
 *                created before the flag existed still record shortcuts.
 *                Also removed the 'required' on timestamp everywhere → nullable.
 *
 *  FIX-VALIDATION
 *                hidden_duration_ms  nullable (hide-ping sends 0, not absent)
 *                timestamp           nullable on all four endpoints
 *                flight_times_ms     nullable (early flush may have empty array)
 *                paste_count         added to keystroke-dynamics rules
 */
class AnomalyController extends Controller
{
    public function __construct(private AnomalyDetectionService $service) {}

    // ══════════════════════════════════════════════════════════════════════════
    // STUDENT — event ingestion
    // ══════════════════════════════════════════════════════════════════════════

    public function tabSwitch(Request $request, int $examId)
    {
        $submission = $this->getActiveSubmission($examId, $request->user()->id);
        if (!$submission) {
            return response()->json(['message' => 'No active submission found.'], 404);
        }

        // FIX-KEYBOARD: treat null as enabled (backwards-compatible default)
        if ($submission->exam->tab_switching_monitor === false) {
            return response()->json(['message' => 'Tab-switch monitoring is disabled.'], 200);
        }

        $payload = $request->validate([
            'hidden_duration_ms' => 'nullable|integer|min:0',
            'timestamp'          => 'nullable|string',
        ]);

        $payload['hidden_duration_ms'] = $payload['hidden_duration_ms'] ?? 0;

        $log = $this->service->processTabSwitch($submission, $payload);

        return response()->json([
            'message'  => 'Tab switch recorded.',
            'severity' => $log->severity,
            'log_id'   => $log->id,
        ], 201);
    }

    public function keyboardShortcut(Request $request, int $examId)
    {
        $submission = $this->getActiveSubmission($examId, $request->user()->id);
        if (!$submission) {
            return response()->json(['message' => 'No active submission found.'], 404);
        }

        // FIX-KEYBOARD: treat null as enabled
        if ($submission->exam->keyboard_analysis === false) {
            return response()->json(['message' => 'Keyboard analysis is disabled.'], 200);
        }

        $payload = $request->validate([
            'keys'        => 'required|string|max:100',
            'timestamp'   => 'nullable|string',
            'char_count'  => 'nullable|integer|min:0',
            'paste_index' => 'nullable|integer|min:1',
            'question_id' => 'nullable|integer|exists:questions,id',
        ]);

        $log = $this->service->processKeyboardShortcut($submission, $payload);

        if (!$log) {
            // Shortcut not in the monitored list — not an error, just ignore
            return response()->json(['message' => 'Shortcut not monitored.'], 200);
        }

        return response()->json([
            'message'  => 'Keyboard shortcut recorded.',
            'severity' => $log->severity,
            'log_id'   => $log->id,
        ], 201);
    }

    public function responseTime(Request $request, int $examId)
    {
        $submission = $this->getActiveSubmission($examId, $request->user()->id);
        if (!$submission) {
            return response()->json(['message' => 'No active submission found.'], 404);
        }

        $payload = $request->validate([
            'question_id'       => 'required|integer|exists:questions,id',
            'response_time_ms'  => 'required|integer|min:1',
            // FIX-PREV: collector sends the full prior-times history
            'previous_times_ms'   => 'nullable|array',
            'previous_times_ms.*' => 'integer|min:0',
            'timestamp'           => 'nullable|string',
        ]);

        $log = $this->service->processResponseTime($submission, $payload);

        if (!$log) {
            return response()->json(['message' => 'Response time not recorded (invalid data).'], 422);
        }

        return response()->json([
            'message'  => 'Response time recorded.',
            'severity' => $log->severity,
            'log_id'   => $log->id,
        ], 201);
    }

    public function keystrokeDynamics(Request $request, int $examId)
    {
        $submission = $this->getActiveSubmission($examId, $request->user()->id);
        if (!$submission) {
            return response()->json(['message' => 'No active submission found.'], 404);
        }

        // FIX-KEYBOARD: treat null as enabled
        if ($submission->exam->keyboard_analysis === false) {
            return response()->json(['message' => 'Keyboard analysis is disabled.'], 200);
        }

        $payload = $request->validate([
            'question_id'       => 'required|integer|exists:questions,id',
            'dwell_times_ms'    => 'required|array|min:1',
            'dwell_times_ms.*'  => 'integer|min:0',
            'flight_times_ms'   => 'nullable|array',        // nullable — early flush
            'flight_times_ms.*' => 'integer|min:0',
            'total_chars'       => 'required|integer|min:1',
            'duration_ms'       => 'required|integer|min:1',
            'paste_count'       => 'nullable|integer|min:0', // was missing entirely
            'timestamp'         => 'nullable|string',
        ]);

        $log = $this->service->processKeystrokeDynamics($submission, $payload);

        if (!$log) {
            return response()->json(['message' => 'Not enough data to record.'], 200);
        }

        return response()->json([
            'message'  => 'Keystroke dynamics recorded.',
            'severity' => $log->severity,
            'log_id'   => $log->id,
        ], 201);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INSTRUCTOR — review endpoints
    // ══════════════════════════════════════════════════════════════════════════

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

        return response()->json([
            'counts' => [
                'tab_switch'         => TabSwitchLog::where('exam_id', $examId)->count(),
                'keyboard_shortcut'  => KeyboardShortcutLog::where('exam_id', $examId)->count(),
                'response_time'      => ResponseTimeLog::where('exam_id', $examId)->count(),
                'keystroke_dynamics' => KeystrokeDynamicsLog::where('exam_id', $examId)->count(),
            ],
            'recent' => [
                'tab_switch'         => TabSwitchLog::where('exam_id', $examId)
                                            ->with('student:id,name,email')
                                            ->latest('occurred_at')->limit(20)->get(),
                'keyboard_shortcut'  => KeyboardShortcutLog::where('exam_id', $examId)
                                            ->with(['student:id,name,email', 'question:id,question_text,order'])
                                            ->latest('occurred_at')->limit(20)->get(),
                'response_time'      => ResponseTimeLog::where('exam_id', $examId)
                                            ->with(['student:id,name,email', 'question:id,question_text,order'])
                                            ->latest('occurred_at')->limit(20)->get(),
                'keystroke_dynamics' => KeystrokeDynamicsLog::where('exam_id', $examId)
                                            ->with(['student:id,name,email', 'question:id,question_text,order'])
                                            ->latest('occurred_at')->limit(20)->get(),
            ],
        ]);
    }

    /**
     * GET /exams/{examId}/anomalies/summary
     * Returns per-student risk data from exam_results (replaces anomaly_summaries).
     */
    public function summary(Request $request, int $examId)
    {
        $this->verifyInstructorOwnsExam($examId, $request->user()->id);

        $results = ExamResult::where('exam_id', $examId)
            ->with('student:id,name,email')
            ->orderByDesc('cpi_score')
            ->get()
            ->map(fn($r) => [
                'student'                     => $r->student,
                'submission_id'               => $r->submission_id,
                'cpi_score'                   => $r->cpi_score,
                'cpi_label'                   => $r->cpi_label,
                'is_flagged'                  => $r->is_flagged,
                'tab_switch_count'            => $r->tab_switch_count            ?? 0,
                'keyboard_shortcut_count'     => $r->keyboard_shortcut_count     ?? 0,
                'response_time_anomaly_count' => $r->response_time_anomaly_count ?? 0,
                'keystroke_anomaly_count'     => $r->keystroke_anomaly_count     ?? 0,
            ]);

        return response()->json(['summaries' => $results]);
    }

    /**
     * GET /exams/{examId}/submissions/{submissionId}/anomalies
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
            // FIX-SUMMARY: read from exam_results instead of exam_anomaly_summaries
            'summary' => ExamResult::where('submission_id', $submissionId)->first(),
            'logs'    => [
                'tab_switch'         => TabSwitchLog::where('submission_id', $submissionId)
                                            ->orderBy('occurred_at')->get(),
                'keyboard_shortcut'  => KeyboardShortcutLog::where('submission_id', $submissionId)
                                            ->with('question:id,question_text,order')
                                            ->orderBy('occurred_at')->get(),
                'response_time'      => ResponseTimeLog::where('submission_id', $submissionId)
                                            ->with('question:id,question_text,order')
                                            ->orderBy('occurred_at')->get(),
                'keystroke_dynamics' => KeystrokeDynamicsLog::where('submission_id', $submissionId)
                                            ->with('question:id,question_text,order')
                                            ->orderBy('occurred_at')->get(),
            ],
        ]);
    }

    /**
     * PATCH /exams/{examId}/anomalies/{logId}/review?type=tab_switch
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

    // ── Helpers ────────────────────────────────────────────────────────────────

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