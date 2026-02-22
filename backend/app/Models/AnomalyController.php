<?php

namespace App\Http\Controllers;

use App\Models\ExamAnomalyLog;
use App\Models\ExamAnomalySummary;
use App\Models\ExamSubmission;
use App\Models\Exam;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnomalyController extends Controller
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Get the student's active submission for a given exam.
     * Returns 403 if none found.
     */
    private function getSubmission(int $examId, int $studentId)
    {
        return ExamSubmission::where('exam_id', $examId)
            ->where('student_id', $studentId)
            ->where('status', 'in_progress')
            ->firstOrFail();
    }

    /**
     * Upsert the anomaly summary row and recalculate risk score.
     */
    private function upsertSummary(
        int    $submissionId,
        int    $examId,
        int    $studentId,
        string $counter          // exact column name to increment
    ): ExamAnomalySummary {

        // Ensure the row exists first
        ExamAnomalySummary::firstOrCreate(
            ['submission_id' => $submissionId],
            [
                'exam_id'                     => $examId,
                'student_id'                  => $studentId,
                'tab_switch_count'            => 0,
                'keyboard_shortcut_count'     => 0,
                'response_time_anomaly_count' => 0,
                'keystroke_anomaly_count'     => 0,
                'risk_score'                  => 0,
                'flag_status'                 => 'none',
                'last_anomaly_at'             => now(),
            ]
        );

        // Increment directly via DB query — avoids model caching issues
        // where increment() on a freshly created row silently stays at 0
        DB::table('exam_anomaly_summaries')
            ->where('submission_id', $submissionId)
            ->update([
                $counter          => DB::raw("`{$counter}` + 1"),
                'last_anomaly_at' => now(),
                'updated_at'      => now(),
            ]);

        // Reload fresh so recalculate() sees the updated counts
        $summary = ExamAnomalySummary::where('submission_id', $submissionId)->firstOrFail();
        $summary->recalculate();

        return $summary->fresh();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TAB SWITCH  →  Raw data for Isolation Forest
    //
    // Feature extraction will need:
    //   - how many times the student switched tabs (cumulative)
    //   - how long the tab was hidden each time (hidden_duration_ms)
    //   - when it happened relative to exam start (occurred_at)
    //
    // These three fields are enough for IF to learn a normal "focus" pattern
    // and flag outlier sessions.
    // ─────────────────────────────────────────────────────────────────────────
    public function tabSwitch(Request $request, int $examId)
    {
        $student    = auth()->user();
        $submission = $this->getSubmission($examId, $student->id);

        $request->validate([
            'hidden_duration_ms' => 'required|integer|min:0',
            'timestamp'          => 'required|string',
        ]);

        // Count how many tab-switch logs already exist for this submission
        // so Flask can use cumulative_switches as a feature directly.
        $cumulativeSwitches = ExamAnomalyLog::where('submission_id', $submission->id)
            ->where('type', 'tab_switch')
            ->count() + 1;

        $log = ExamAnomalyLog::create([
            'submission_id' => $submission->id,
            'exam_id'       => $examId,
            'student_id'    => $student->id,
            'question_id'   => null, // tab switches are not question-specific
            'type'          => 'tab_switch',
            'severity'      => 'low', // severity assigned by Flask later
            'occurred_at'   => now(),

            // Raw features for Isolation Forest
            'metadata' => [
                'cumulative_switches' => $cumulativeSwitches,   // feature 1
                'hidden_duration_ms'  => $request->hidden_duration_ms, // feature 2
                'client_timestamp'    => $request->timestamp,   // feature 3 (relative timing)
            ],
        ]);

        $summary = $this->upsertSummary(
            $submission->id, $examId, $student->id, 'tab_switch_count'
        );

        return response()->json([
            'message'     => 'Tab switch recorded.',
            'severity'    => $log->severity,
            'flag_status' => $summary->flag_status,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // KEYBOARD SHORTCUT  →  Raw data for One-Class SVM
    //
    // Feature extraction will need:
    //   - which key combo was pressed (keys)
    //   - cumulative count of shortcuts in the session
    //   - for paste events: how many characters were pasted
    //   - which question was active at the time
    //
    // One-Class SVM will learn the "normal" shortcut distribution (none)
    // and flag sessions that deviate.
    // ─────────────────────────────────────────────────────────────────────────
    public function keyboardShortcut(Request $request, int $examId)
    {
        $student    = auth()->user();
        $submission = $this->getSubmission($examId, $student->id);

        $request->validate([
            'keys'        => 'required|string',
            'timestamp'   => 'required|string',
            // paste-specific fields (optional)
            'char_count'  => 'nullable|integer|min:0',
            'paste_index' => 'nullable|integer|min:1',
            'question_id' => 'nullable|integer|exists:questions,id',
        ]);

        $cumulativeShortcuts = ExamAnomalyLog::where('submission_id', $submission->id)
            ->where('type', 'keyboard_shortcut')
            ->count() + 1;

        $log = ExamAnomalyLog::create([
            'submission_id' => $submission->id,
            'exam_id'       => $examId,
            'student_id'    => $student->id,
            'question_id'   => $request->question_id ?? null,
            'type'          => 'keyboard_shortcut',
            'severity'      => 'low',
            'occurred_at'   => now(),

            // Raw features for One-Class SVM
            'metadata' => [
                'keys'                => $request->keys,              // feature 1: combo label
                'cumulative_count'    => $cumulativeShortcuts,        // feature 2
                'is_paste'            => in_array($request->keys, ['Paste', 'Ctrl+V', 'Meta+V']), // feature 3
                'pasted_char_count'   => $request->char_count ?? 0,   // feature 4
                'paste_index'         => $request->paste_index ?? null,
                'client_timestamp'    => $request->timestamp,
            ],
        ]);

        $summary = $this->upsertSummary(
            $submission->id, $examId, $student->id, 'keyboard_shortcut_count'
        );

        return response()->json([
            'message'     => 'Keyboard shortcut recorded.',
            'severity'    => $log->severity,
            'flag_status' => $summary->flag_status,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE TIME  →  Raw data for Z-Score Method
    //
    // Feature extraction will need:
    //   - response_time_ms for this question
    //   - all previous response times in the session (to compute mean + std)
    //   - question order (position in exam)
    //
    // Flask will compute:
    //   z = (response_time_ms - mean) / std
    // and flag questions where |z| > threshold (e.g. 2.5).
    // ─────────────────────────────────────────────────────────────────────────
    public function responseTime(Request $request, int $examId)
    {
        $student    = auth()->user();
        $submission = $this->getSubmission($examId, $student->id);

        $request->validate([
            'question_id'      => 'required|integer|exists:questions,id',
            'response_time_ms' => 'required|integer|min:0',
            'timestamp'        => 'required|string',
        ]);

        // Collect all previous response times for this submission so Flask
        // can compute the running mean/std without hitting the DB again.
        $previousTimes = ExamAnomalyLog::where('submission_id', $submission->id)
            ->where('type', 'response_time')
            ->pluck('metadata')
            ->map(fn($m) => $m['response_time_ms'] ?? null)
            ->filter()
            ->values()
            ->toArray();

        $log = ExamAnomalyLog::create([
            'submission_id' => $submission->id,
            'exam_id'       => $examId,
            'student_id'    => $student->id,
            'question_id'   => $request->question_id,
            'type'          => 'response_time',
            'severity'      => 'low',
            'occurred_at'   => now(),

            // Raw features for Z-Score
            'metadata' => [
                'question_id'          => $request->question_id,      // feature 1
                'response_time_ms'     => $request->response_time_ms, // feature 2
                'question_position'    => count($previousTimes) + 1,  // feature 3: nth question answered
                'previous_times_ms'    => $previousTimes,             // feature 4: history for z-score
                'client_timestamp'     => $request->timestamp,
            ],
        ]);

        $summary = $this->upsertSummary(
            $submission->id, $examId, $student->id, 'response_time_anomaly_count'
        );

        return response()->json([
            'message'     => 'Response time recorded.',
            'severity'    => $log->severity,
            'flag_status' => $summary->flag_status,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // KEYSTROKE DYNAMICS  →  Raw data for Hidden Markov Model
    //
    // Feature extraction will need:
    //   - dwell_times_ms[]  : how long each key was held down
    //   - flight_times_ms[] : time between key releases
    //   - total_chars       : how many characters were typed
    //   - paste_count       : how many times student pasted
    //   - duration_ms       : total time spent on the field
    //   - wpm               : derived typing speed
    //
    // HMM will model the sequence of (dwell, flight) pairs as observations
    // and flag sessions whose emission probability is below a threshold.
    // ─────────────────────────────────────────────────────────────────────────
    public function keystrokeDynamics(Request $request, int $examId)
    {
        $student    = auth()->user();
        $submission = $this->getSubmission($examId, $student->id);

        $request->validate([
            'question_id'     => 'required|integer|exists:questions,id',
            'dwell_times_ms'  => 'required|array|min:1',
            'dwell_times_ms.*'=> 'integer|min:0',
            'flight_times_ms' => 'required|array',
            'flight_times_ms.*'=> 'integer|min:0',
            'total_chars'     => 'required|integer|min:0',
            'paste_count'     => 'nullable|integer|min:0',
            'duration_ms'     => 'required|integer|min:1',
            'timestamp'       => 'required|string',
        ]);

        $dwellTimes  = $request->dwell_times_ms;
        $flightTimes = $request->flight_times_ms;
        $durationSec = $request->duration_ms / 1000;
        $totalChars  = $request->total_chars;

        // Derive basic stats here so Flask has them pre-computed if needed,
        // but raw arrays are always stored for full HMM sequence modeling.
        $avgDwell  = count($dwellTimes)  > 0 ? array_sum($dwellTimes)  / count($dwellTimes)  : 0;
        $avgFlight = count($flightTimes) > 0 ? array_sum($flightTimes) / count($flightTimes) : 0;
        $wpm       = $durationSec > 0 ? round(($totalChars / 5) / ($durationSec / 60), 2) : 0;

        $log = ExamAnomalyLog::create([
            'submission_id' => $submission->id,
            'exam_id'       => $examId,
            'student_id'    => $student->id,
            'question_id'   => $request->question_id,
            'type'          => 'keystroke_dynamics',
            'severity'      => 'low',
            'occurred_at'   => now(),

            // Raw features for Hidden Markov Model
            'metadata' => [
                'question_id'      => $request->question_id,

                // Raw sequences — HMM needs these as observation vectors
                'dwell_times_ms'   => $dwellTimes,    // feature set 1
                'flight_times_ms'  => $flightTimes,   // feature set 2

                // Derived scalars — useful for baseline comparison in Flask
                'avg_dwell_ms'     => round($avgDwell, 2),   // feature 3
                'avg_flight_ms'    => round($avgFlight, 2),  // feature 4
                'wpm'              => $wpm,                   // feature 5
                'total_chars'      => $totalChars,            // feature 6
                'paste_count'      => $request->paste_count ?? 0, // feature 7
                'duration_ms'      => $request->duration_ms, // feature 8
                'keystroke_count'  => count($dwellTimes),    // feature 9

                'client_timestamp' => $request->timestamp,
            ],
        ]);

        $summary = $this->upsertSummary(
            $submission->id, $examId, $student->id, 'keystroke_anomaly_count'
        );

        return response()->json([
            'message'     => 'Keystroke dynamics recorded.',
            'severity'    => $log->severity,
            'flag_status' => $summary->flag_status,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INSTRUCTOR VIEWS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * List all anomaly logs for an exam (instructor only).
     */
    public function index(Request $request, int $examId)
    {
        $exam = Exam::where('id', $examId)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $logs = ExamAnomalyLog::where('exam_id', $examId)
            ->with(['student:id,name,email', 'question:id,question_text,order'])
            ->orderBy('occurred_at', 'desc')
            ->paginate(50);

        return response()->json($logs);
    }

    /**
     * Risk summary for all students in an exam (instructor only).
     */
    public function summary(Request $request, int $examId)
    {
        $exam = Exam::where('id', $examId)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $summaries = ExamAnomalySummary::where('exam_id', $examId)
            ->with(['student:id,name,email'])
            ->orderBy('risk_score', 'desc')
            ->get();

        return response()->json(['summaries' => $summaries]);
    }

    /**
     * All anomaly logs for a single student submission (instructor only).
     */
    public function show(Request $request, int $examId, int $submissionId)
    {
        $exam = Exam::where('id', $examId)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $logs = ExamAnomalyLog::where('exam_id', $examId)
            ->where('submission_id', $submissionId)
            ->with(['question:id,question_text,order'])
            ->orderBy('occurred_at', 'asc')
            ->get();

        $summary = ExamAnomalySummary::where('submission_id', $submissionId)->first();

        return response()->json([
            'summary' => $summary,
            'logs'    => $logs,
        ]);
    }

    /**
     * Mark a log entry as reviewed (instructor only).
     */
    public function review(Request $request, int $examId, int $logId)
    {
        $exam = Exam::where('id', $examId)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $request->validate([
            'reviewed'       => 'required|boolean',
            'reviewer_notes' => 'nullable|string|max:1000',
        ]);

        $log = ExamAnomalyLog::where('id', $logId)
            ->where('exam_id', $examId)
            ->firstOrFail();

        $log->update([
            'reviewed'       => $request->reviewed,
            'reviewer_notes' => $request->reviewer_notes,
        ]);

        return response()->json(['message' => 'Log reviewed.', 'log' => $log]);
    }
}