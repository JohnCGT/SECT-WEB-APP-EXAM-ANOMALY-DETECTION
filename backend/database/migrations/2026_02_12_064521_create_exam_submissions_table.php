<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One submission per student per exam
        Schema::create('exam_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->integer('score')->default(0);         // total points earned
            $table->integer('total_points')->default(0);  // snapshot of exam total
            $table->enum('status', ['in_progress', 'submitted'])->default('in_progress');
            $table->timestamps();

            $table->unique(['exam_id', 'student_id']); // one attempt per student
        });

        // One answer row per question per submission
        Schema::create('exam_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('exam_submissions')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->text('answer')->nullable();       // student's answer
            $table->integer('points_earned')->default(0);
            $table->boolean('is_correct')->nullable(); // null for essay
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_answers');
        Schema::dropIfExists('exam_submissions');
    }
};