<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add shuffle_questions to the exams table.
     *
     * When true, the student-facing exam page should present
     * questions in a randomised order instead of the fixed
     * order defined by the instructor.
     */
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->boolean('shuffle_questions')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn('shuffle_questions');
        });
    }
};