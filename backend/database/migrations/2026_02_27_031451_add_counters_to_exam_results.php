<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds four raw-event counter columns to exam_results.
 *
 * These replace the deleted exam_anomaly_summaries table's counter columns.
 * Flask still owns cpi_score, cpi_label, *_flagged, and *_score — this
 * migration only adds the four lightweight counters that the Laravel service
 * increments in real-time as students take the exam.
 *
 * Safe to run on a live table — all columns are nullable with a default of 0.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_results', function (Blueprint $table) {
            // Only add if they don't already exist (idempotent)
            if (!Schema::hasColumn('exam_results', 'tab_switch_count')) {
                $table->unsignedInteger('tab_switch_count')->default(0)->after('student_id');
            }
            if (!Schema::hasColumn('exam_results', 'keyboard_shortcut_count')) {
                $table->unsignedInteger('keyboard_shortcut_count')->default(0)->after('tab_switch_count');
            }
            if (!Schema::hasColumn('exam_results', 'response_time_anomaly_count')) {
                $table->unsignedInteger('response_time_anomaly_count')->default(0)->after('keyboard_shortcut_count');
            }
            if (!Schema::hasColumn('exam_results', 'keystroke_anomaly_count')) {
                $table->unsignedInteger('keystroke_anomaly_count')->default(0)->after('response_time_anomaly_count');
            }
        });
    }

    public function down(): void
    {
        Schema::table('exam_results', function (Blueprint $table) {
            $table->dropColumn([
                'tab_switch_count',
                'keyboard_shortcut_count',
                'response_time_anomaly_count',
                'keystroke_anomaly_count',
            ]);
        });
    }
};