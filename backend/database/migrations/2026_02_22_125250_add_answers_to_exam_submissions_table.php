<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds the answers JSON column to exam_submissions.
     *
     * StudentExamController@submit writes graded answers directly onto
     * the submission row as a JSON array. StudentExamController@results
     * reads them back from the same column.
     *
     * Format stored:
     * [
     *   {
     *     "question_id": 1,
     *     "student_answer": "True",
     *     "correct_answer": "True",
     *     "is_correct": true,
     *     "points_earned": 5,
     *     "points_possible": 5
     *   },
     *   ...
     * ]
     */
    public function up(): void
    {
        Schema::table('exam_submissions', function (Blueprint $table) {
            $table->json('answers')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('exam_submissions', function (Blueprint $table) {
            $table->dropColumn('answers');
        });
    }
};