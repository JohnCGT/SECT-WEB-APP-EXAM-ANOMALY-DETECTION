<?php

namespace App\Http\Controllers\Instructor;
use App\Http\Controllers\Controller;

use App\Models\ActivityLog;
use App\Models\Question;
use App\Models\Exam;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function index(Request $request, $examId)
    {
        $exam = Exam::where('id', $examId)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $questions = $exam->questions()->orderBy('order')->get();

        return response()->json(['questions' => $questions], 200);
    }

    public function store(Request $request, $examId)
    {
        $exam = Exam::where('id', $examId)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $request->validate([
            'type'           => 'required|in:multiple_choice,true_false,essay',
            'question_text'  => 'required|string',
            'points'         => 'required|integer|min:1',
            'options'        => 'required_if:type,multiple_choice|array|min:2',
            'correct_answer' => 'required_if:type,multiple_choice,true_false',
            'max_words'      => 'nullable|integer|min:1',
            'rubric'         => 'nullable|string',
        ]);

        $lastOrder = $exam->questions()->max('order') ?? 0;

        $question = Question::create([
            'exam_id'        => $examId,
            'type'           => $request->type,
            'question_text'  => $request->question_text,
            'points'         => $request->points,
            'order'          => $lastOrder + 1,
            'options'        => $request->options,
            'correct_answer' => $request->correct_answer,
            'max_words'      => $request->max_words,
            'rubric'         => $request->rubric,
        ]);

        $exam->update(['total_points' => $exam->questions()->sum('points')]);

        // ── Activity Log ──────────────────────────────────────────────────
        ActivityLog::record(
            $request->user(),
            'question.created',
            "{$request->user()->name} added a {$question->type} question to exam \"{$exam->title}\".",
            [
                'question_id'   => $question->id,
                'question_type' => $question->type,
                'points'        => $question->points,
                'exam_id'       => $exam->id,
                'exam_title'    => $exam->title,
            ],
            $request,
            $question->id,
            'Question'
        );
        // ─────────────────────────────────────────────────────────────────

        return response()->json([
            'message'  => 'Question added successfully',
            'question' => $question,
        ], 201);
    }

    public function update(Request $request, $examId, $id)
    {
        $exam = Exam::where('id', $examId)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $question = Question::where('id', $id)
            ->where('exam_id', $examId)
            ->firstOrFail();

        $validated = $request->validate([
            'type'           => 'sometimes|in:multiple_choice,true_false,essay',
            'question_text'  => 'sometimes|string',
            'points'         => 'sometimes|integer|min:1',
            'options'        => 'sometimes|array|min:2',
            'correct_answer' => 'sometimes|string',
            'max_words'      => 'nullable|integer|min:1',
            'rubric'         => 'nullable|string',
            'order'          => 'sometimes|integer|min:0',
        ]);

        $question->update($validated);
        $exam->update(['total_points' => $exam->questions()->sum('points')]);

        // ── Activity Log ──────────────────────────────────────────────────
        ActivityLog::record(
            $request->user(),
            'question.updated',
            "{$request->user()->name} edited a question in exam \"{$exam->title}\".",
            [
                'question_id' => $question->id,
                'exam_id'     => $exam->id,
                'exam_title'  => $exam->title,
                'changes'     => array_keys($validated),
            ],
            $request,
            $question->id,
            'Question'
        );
        // ─────────────────────────────────────────────────────────────────

        return response()->json([
            'message'  => 'Question updated successfully',
            'question' => $question,
        ], 200);
    }

    public function destroy(Request $request, $examId, $id)
    {
        $exam = Exam::where('id', $examId)
            ->where('instructor_id', $request->user()->id)
            ->firstOrFail();

        $question = Question::where('id', $id)
            ->where('exam_id', $examId)
            ->firstOrFail();

        // ── Activity Log — BEFORE delete so we still have question data ───
        ActivityLog::record(
            $request->user(),
            'question.deleted',
            "{$request->user()->name} deleted a {$question->type} question from exam \"{$exam->title}\".",
            [
                'question_id'   => $question->id,
                'question_type' => $question->type,
                'exam_id'       => $exam->id,
                'exam_title'    => $exam->title,
            ],
            $request,
            $question->id,
            'Question'
        );
        // ─────────────────────────────────────────────────────────────────

        $question->delete();
        $exam->update(['total_points' => $exam->questions()->sum('points')]);

        return response()->json(['message' => 'Question deleted successfully'], 200);
    }
}