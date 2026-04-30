<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Course;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    /**
     * Get all exams for authenticated instructor.
     * Times are stored and returned in UTC; the frontend localises for display.
     */
    public function index(Request $request)
    {
        $exams = Exam::where('instructor_id', $request->user()->id)
            ->with('course')
            ->withCount('questions')
            ->orderBy('start_time', 'desc')
            ->get();

        return response()->json(['exams' => $exams], 200);
    }

    /**
     * Create a new exam.
     * Accepts ISO-8601 timestamps (with or without timezone offset).
     * All times are stored in UTC via Laravel's datetime cast.
     */
    public function store(Request $request)
    {
        $request->validate([
            'course_id'        => 'required|exists:courses,id',
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'type'             => 'required|in:midterm,final,quiz,prelim',
            'start_time'       => 'required|date',
            'end_time'         => 'required|date|after:start_time',
            // FIX #4: integer only — no decimals allowed
            'duration_minutes' => 'required|integer|min:1',
        ]);

        $course = Course::where('id', $request->course_id)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $exam = Exam::create([
            'instructor_id'    => $request->user()->id,
            'course_id'        => $request->course_id,
            'title'            => $request->title,
            'description'      => $request->description,
            'type'             => $request->type,
            // Carbon parses the incoming string and stores as UTC
            'start_time'       => $request->start_time,
            'end_time'         => $request->end_time,
            'duration_minutes' => (int) $request->duration_minutes,
            'status'           => $request->status ?? 'scheduled',
        ]);

        return response()->json([
            'message' => 'Exam created successfully',
            'exam'    => $exam->load('course'),
        ], 201);
    }

    /**
     * Get single exam with questions.
     */
    public function show(Request $request, $id)
    {
        $exam = Exam::where('id', $id)
            ->where('instructor_id', $request->user()->id)
            ->with(['course', 'questions' => function ($query) {
                $query->orderBy('order');
            }])
            ->firstOrFail();

        return response()->json(['exam' => $exam], 200);
    }

    /**
     * Update exam.
     * FIX #2: Accepts ISO-8601 strings (the frontend sends UTC ISO strings).
     * FIX #4: duration_minutes validated as integer.
     */
    public function update(Request $request, $id)
    {
        $exam = Exam::where('id', $id)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'description'      => 'nullable|string',
            'type'             => 'sometimes|in:midterm,final,quiz,prelim',
            'start_time'       => 'sometimes|date',
            'end_time'         => 'sometimes|date|after:start_time',
            // FIX #4: integer only
            'duration_minutes' => 'sometimes|integer|min:1',
            'status'           => 'sometimes|in:draft,scheduled,active,completed',

            'face_detection'        => 'sometimes|boolean',
            'tab_switching_monitor' => 'sometimes|boolean',
            'mouse_tracking'        => 'sometimes|boolean',
            'keyboard_analysis'     => 'sometimes|boolean',
            'screen_recording'      => 'sometimes|boolean',
            'isolation_forest'      => 'sometimes|boolean',
            'shuffle_questions'     => 'sometimes|boolean',
        ]);

        // Ensure duration is always stored as integer
        if (isset($validated['duration_minutes'])) {
            $validated['duration_minutes'] = (int) $validated['duration_minutes'];
        }

        $exam->update($validated);

        return response()->json([
            'message' => 'Exam updated successfully',
            'exam'    => $exam->load('course'),
        ], 200);
    }

    /**
     * Delete exam.
     */
    public function destroy(Request $request, $id)
    {
        $exam = Exam::where('id', $id)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $exam->delete();

        return response()->json(['message' => 'Exam deleted successfully'], 200);
    }

    /**
     * GET /exams/{id}/submissions
     */
    public function submissions(Request $request, $id)
    {
        $exam = \App\Models\Exam::where('id', $id)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $enrolledStudents = \Illuminate\Support\Facades\DB::table('course_students')
            ->where('course_id', $exam->course_id)
            ->pluck('student_id')
            ->toArray();

        $submissions = \App\Models\ExamSubmission::where('exam_id', $id)
            ->with('student:id,name,email')
            ->get()
            ->keyBy('student_id');

        $results = \App\Models\ExamResult::where('exam_id', $id)
            ->get()
            ->keyBy('submission_id');

        $essayQIds = \App\Models\Question::where('exam_id', $id)
            ->where('type', 'essay')
            ->pluck('id')
            ->toArray();

        $students = \App\Models\User::whereIn('id', $enrolledStudents)
            ->select('id', 'name', 'email')
            ->get()
            ->keyBy('id');

        $rows = [];

        foreach ($students as $studentId => $student) {
            $sub    = $submissions->get($studentId);
            $result = $sub ? $results->get($sub->id) : null;

            $essayCount    = 0;
            $gradedCount   = 0;
            $ungradedCount = 0;

            if ($sub && !empty($essayQIds)) {
                $raw     = $sub->answers;
                $answers = is_string($raw) ? json_decode($raw, true) : ($raw ?? []);

                foreach ($answers as $a) {
                    if (!in_array($a['question_id'] ?? null, $essayQIds)) continue;
                    if (empty($a['student_answer'])) continue;

                    $essayCount++;
                    if (($a['points_earned'] ?? null) !== null) {
                        $gradedCount++;
                    } else {
                        $ungradedCount++;
                    }
                }
            }

            $rows[] = [
                'id'             => $sub?->id,
                'student_id'     => $studentId,
                'student'        => $student,
                'status'         => $sub ? $sub->status : 'not_started',
                'score'          => $sub?->score,
                'total_points'   => $sub?->total_points ?? $exam->total_points,
                'started_at'     => $sub?->started_at,
                'submitted_at'   => $sub?->submitted_at,
                'cpi_score'      => $result?->cpi_score,
                'cpi_label'      => $result?->cpi_label,
                'is_flagged'     => $result?->is_flagged ?? false,
                'essay_count'    => $essayCount,
                'graded_count'   => $gradedCount,
                'ungraded_count' => $ungradedCount,
            ];
        }

        usort($rows, function ($a, $b) {
            $order = ['submitted' => 0, 'in_progress' => 1, 'not_started' => 2];
            $oa    = $order[$a['status']] ?? 3;
            $ob    = $order[$b['status']] ?? 3;

            if ($oa !== $ob) return $oa - $ob;

            if ($a['status'] === 'submitted' && $b['status'] === 'submitted') {
                return strcmp($b['submitted_at'] ?? '', $a['submitted_at'] ?? '');
            }

            return strcmp($a['student']['name'] ?? '', $b['student']['name'] ?? '');
        });

        return response()->json(['submissions' => $rows]);
    }
}