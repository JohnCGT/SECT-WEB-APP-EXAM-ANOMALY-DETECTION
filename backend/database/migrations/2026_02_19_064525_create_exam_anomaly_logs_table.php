<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Creates the exam_anomaly_logs table.
     *
     * Each row represents a single anomaly event detected during an exam session.
     * The four supported detection algorithms are:
     *   - tab_switch          : student switched away from the exam tab/window
     *   - keyboard_shortcut   : student pressed a suspicious key combination
     *   - response_time       : answer was submitted unusually fast or slow
     *   - keystroke_dynamics  : typing rhythm deviated from the student's baseline
     */
    public function up(): void
    {
        Schema::create('exam_anomaly_logs', function (Blueprint $table) {
            $table->id();

            // Foreign keys ──────────────────────────────────────────────────
            $table->foreignId('submission_id')
                  ->constrained('exam_submissions')
                  ->onDelete('cascade');

            $table->foreignId('exam_id')
                  ->constrained('exams')
                  ->onDelete('cascade');

            $table->foreignId('student_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // Which question triggered this event (nullable for non-question events)
            $table->foreignId('question_id')
                  ->nullable()
                  ->constrained('questions')
                  ->onDelete('set null');

            // Anomaly classification ────────────────────────────────────────
            $table->enum('type', [
                'tab_switch',
                'keyboard_shortcut',
                'response_time',
                'keystroke_dynamics',
            ]);

            /**
             * Severity levels:
             *   low    – informational, single occurrence is expected
             *   medium – pattern worth watching; multiple hits → review
             *   high   – strong cheating signal; likely needs manual review
             */
            $table->enum('severity', ['low', 'medium', 'high'])->default('low');

            // Flexible payload — structure varies per anomaly type (see docs below)
            $table->json('metadata')->nullable();

            // Whether an instructor has manually reviewed this log entry
            $table->boolean('reviewed')->default(false);
            $table->text('reviewer_notes')->nullable();

            // When the event occurred on the client (may differ from created_at)
            $table->timestamp('occurred_at')->nullable();

            $table->timestamps();

            // Indexes for common query patterns
            $table->index(['submission_id', 'type']);
            $table->index(['exam_id', 'student_id']);
            $table->index(['exam_id', 'severity']);
        });

        /**
         * Stores the per-submission anomaly summary / risk profile.
         * Updated incrementally as new anomaly events arrive so instructors
         * can see a live risk score without scanning every log row.
         */
        Schema::create('exam_anomaly_summaries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('submission_id')
                  ->unique()                          // one summary per submission
                  ->constrained('exam_submissions')
                  ->onDelete('cascade');

            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');

            // Running counts per anomaly type
            $table->unsignedInteger('tab_switch_count')->default(0);
            $table->unsignedInteger('keyboard_shortcut_count')->default(0);
            $table->unsignedInteger('response_time_anomaly_count')->default(0);
            $table->unsignedInteger('keystroke_anomaly_count')->default(0);

            // Aggregated risk score (0–100). Recalculated on every new event.
            $table->unsignedTinyInteger('risk_score')->default(0);

            /**
             * Flag levels:
             *   none     – no anomalies detected
             *   warning  – low-level anomalies; instructor informed
             *   flagged  – multiple/high-severity anomalies; requires review
             */
            $table->enum('flag_status', ['none', 'warning', 'flagged'])->default('none');

            // Timestamp of the most recent anomaly event (handy for ordering)
            $table->timestamp('last_anomaly_at')->nullable();

            $table->timestamps();

            $table->index(['exam_id', 'flag_status']);
            $table->index(['exam_id', 'risk_score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_anomaly_summaries');
        Schema::dropIfExists('exam_anomaly_logs');
    }
};
