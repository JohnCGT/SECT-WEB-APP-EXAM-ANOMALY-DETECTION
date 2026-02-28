<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Replaces the old exam_anomaly_logs table with four dedicated tables.
 *
 *   tab_switch_logs          → Isolation Forest
 *   keyboard_shortcut_logs   → One-Class SVM
 *   response_time_logs       → Z-Score Method
 *   keystroke_dynamics_logs  → Hidden Markov Model
 *   exam_anomaly_summaries   → one row per submission (unchanged schema)
 *
 * Extra columns vs the first draft:
 *   tab_switch_logs         : is_return_event  (bool) — distinguishes hide ping from real event
 *   response_time_logs      : is_baseline      (bool) — baseline rows excluded from z-score queries
 *                           : direction        (string) — 'too_fast' | 'too_slow'
 *   keystroke_dynamics_logs : is_baseline      (bool) — baseline rows excluded from wpm queries
 *                           : z_score          (float) — statistical deviation score
 *                           : reason           (string) — 'impossible_speed' | 'statistical_deviation' | 'baseline_building'
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Tab Switch  →  Isolation Forest ───────────────────────────────
        Schema::create('tab_switch_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('exam_submissions')->onDelete('cascade');
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');

            // Isolation Forest features
            $table->unsignedInteger('cumulative_switches');  // nth real switch in session
            $table->unsignedInteger('hidden_duration_ms');   // how long tab was hidden

            // BUG FIX #5 — distinguishes hide ping (false) from return event (true)
            // Only return events increment the summary counter
            $table->boolean('is_return_event')->default(true);

            $table->string('client_timestamp')->nullable();

            // Backfilled by Flask after IF scoring
            $table->enum('severity', ['low', 'medium', 'high'])->default('low');
            $table->float('if_score')->nullable();

            $table->boolean('reviewed')->default(false);
            $table->text('reviewer_notes')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();

            $table->index(['submission_id']);
            $table->index(['exam_id', 'student_id']);
            $table->index(['exam_id', 'severity']);
            $table->index(['submission_id', 'is_return_event']); // fast count of real switches
        });

        // ── 2. Keyboard Shortcut  →  One-Class SVM ───────────────────────────
        Schema::create('keyboard_shortcut_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('exam_submissions')->onDelete('cascade');
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('question_id')->nullable()->constrained('questions')->onDelete('set null');

            // One-Class SVM features
            $table->string('keys', 100);
            $table->unsignedInteger('cumulative_count');
            $table->boolean('is_paste')->default(false);
            $table->unsignedInteger('pasted_char_count')->default(0);
            $table->unsignedInteger('paste_index')->nullable();
            $table->string('client_timestamp')->nullable();

            // Backfilled by Flask after SVM scoring
            $table->enum('severity', ['low', 'medium', 'high'])->default('low');
            $table->float('svm_score')->nullable();

            $table->boolean('reviewed')->default(false);
            $table->text('reviewer_notes')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();

            $table->index(['submission_id']);
            $table->index(['exam_id', 'student_id']);
            $table->index(['exam_id', 'severity']);
            $table->index(['submission_id', 'is_paste']);
        });

        // ── 3. Response Time  →  Z-Score Method ──────────────────────────────
        Schema::create('response_time_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('exam_submissions')->onDelete('cascade');
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');

            // Z-Score features
            $table->unsignedInteger('response_time_ms');
            $table->unsignedSmallInteger('question_position');
            $table->json('previous_times_ms')->nullable();

            // BUG FIX #6 — baseline rows are excluded from future z-score queries
            $table->boolean('is_baseline')->default(false);

            // Computed values (baseline rows have null z_score / direction)
            $table->float('z_score')->nullable();
            $table->string('direction')->nullable(); // 'too_fast' | 'too_slow'

            $table->string('client_timestamp')->nullable();

            // Backfilled by Flask
            $table->enum('severity', ['low', 'medium', 'high'])->default('low');

            $table->boolean('reviewed')->default(false);
            $table->text('reviewer_notes')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();

            $table->index(['submission_id']);
            $table->index(['exam_id', 'student_id']);
            $table->index(['exam_id', 'severity']);
            $table->index(['submission_id', 'is_baseline']); // fast exclusion of baseline rows
            $table->index(['submission_id', 'question_position']);
        });

        // ── 4. Keystroke Dynamics  →  Hidden Markov Model ────────────────────
        Schema::create('keystroke_dynamics_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('exam_submissions')->onDelete('cascade');
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');

            // HMM raw observation sequences
            $table->json('dwell_times_ms');
            $table->json('flight_times_ms')->nullable();

            // Pre-computed scalars
            $table->float('avg_dwell_ms');
            $table->float('avg_flight_ms')->default(0);
            $table->float('wpm')->default(0);
            $table->unsignedInteger('total_chars');
            $table->unsignedSmallInteger('paste_count')->default(0);
            $table->unsignedInteger('duration_ms');
            $table->unsignedInteger('keystroke_count');

            // BUG FIX #6 — baseline rows excluded from z-score wpm queries
            $table->boolean('is_baseline')->default(false);

            // Computed values
            $table->float('z_score')->nullable();
            $table->string('reason')->nullable(); // 'impossible_speed' | 'statistical_deviation' | 'baseline_building'

            $table->string('client_timestamp')->nullable();

            // Backfilled by Flask after HMM scoring
            $table->enum('severity', ['low', 'medium', 'high'])->default('low');
            $table->float('hmm_log_prob')->nullable();

            $table->boolean('reviewed')->default(false);
            $table->text('reviewer_notes')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();

            $table->index(['submission_id']);
            $table->index(['exam_id', 'student_id']);
            $table->index(['exam_id', 'severity']);
            $table->index(['submission_id', 'is_baseline']); // fast exclusion of baseline rows
        });

        // ── 5. Summary (unchanged schema) ─────────────────────────────────────
        Schema::create('exam_anomaly_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->unique()->constrained('exam_submissions')->onDelete('cascade');
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');

            $table->unsignedInteger('tab_switch_count')->default(0);
            $table->unsignedInteger('keyboard_shortcut_count')->default(0);
            $table->unsignedInteger('response_time_anomaly_count')->default(0);
            $table->unsignedInteger('keystroke_anomaly_count')->default(0);

            $table->unsignedTinyInteger('risk_score')->default(0);
            $table->enum('flag_status', ['none', 'warning', 'flagged'])->default('none');
            $table->timestamp('last_anomaly_at')->nullable();
            $table->timestamps();

            $table->index(['exam_id', 'flag_status']);
            $table->index(['exam_id', 'risk_score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_anomaly_summaries');
        Schema::dropIfExists('keystroke_dynamics_logs');
        Schema::dropIfExists('response_time_logs');
        Schema::dropIfExists('keyboard_shortcut_logs');
        Schema::dropIfExists('tab_switch_logs');
    }
};