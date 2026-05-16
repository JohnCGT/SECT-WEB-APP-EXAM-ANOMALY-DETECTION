<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Activity Logs table
 *
 * Tracks discrete user actions across the system for admin visibility.
 *
 * Logged automatically by:
 *   - AuthController      → login, logout, register
 *   - CourseController    → course.created, course.updated, course.deleted
 *   - ExamController      → exam.created, exam.updated, exam.deleted
 *   - QuestionController  → question.created, question.updated, question.deleted
 *   - EssayGradingController → essay.graded
 *   - StudentExamController  → exam.started, exam.submitted, exam.abandoned
 *
 * To log an action anywhere in the app, call the static helper:
 *
 *   ActivityLog::record($request->user(), 'exam.created', [
 *       'exam_id'    => $exam->id,
 *       'exam_title' => $exam->title,
 *       'course_id'  => $exam->course_id,
 *   ]);
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            // Who did it — nullable so we can log guest/system events too
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');

            // Snapshot of user info at the time of the action
            // (so logs survive user deletion / name changes)
            $table->string('user_name')->nullable();
            $table->string('user_email')->nullable();
            $table->string('user_role')->nullable();   // admin | instructor | student

            // What happened — dot-notation event key
            // e.g. "login", "exam.created", "course.deleted", "exam.submitted"
            $table->string('event', 100);

            // Human-readable one-line description
            // e.g. "Juan created exam 'Midterm 2026'"
            $table->string('description')->nullable();

            // Flexible JSON bag for any extra context
            // e.g. { "exam_id": 5, "exam_title": "Midterm", "course": "CS101" }
            $table->json('properties')->nullable();

            // Optional foreign-key shortcuts for fast filtering
            $table->unsignedBigInteger('subject_id')->nullable();   // e.g. exam id, course id
            $table->string('subject_type', 60)->nullable();         // e.g. "Exam", "Course"

            // Network info
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->timestamp('occurred_at')->useCurrent();
            $table->timestamps();

            // Indexes for the most common admin queries
            $table->index('user_id');
            $table->index('user_role');
            $table->index('event');
            $table->index('occurred_at');
            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};