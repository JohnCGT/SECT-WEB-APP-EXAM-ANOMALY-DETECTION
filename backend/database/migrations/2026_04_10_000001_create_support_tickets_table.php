<?php

// backend/database/migrations/2026_04_10_000001_create_support_tickets_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Support Tickets
 *
 * Students and instructors can submit complaints/issues via their respective UIs.
 * Admins read and respond here via GET/PATCH /api/admin/support.
 *
 * The submitter UI (student/instructor side) should POST to /api/support/tickets.
 * The admin panel reads from /api/admin/support.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();

            // Who submitted it
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            // Ticket content
            $table->string('subject', 255);
            $table->text('message');

            // Classification
            $table->enum('category', [
                'technical',   // App crashes, bugs, connectivity
                'exam_issue',  // Can't start, timer bug, locked out
                'account',     // Login, password, profile
                'grading',     // Score disputes, answer key issues
                'other',
            ])->default('other');

            $table->enum('priority', ['low', 'medium', 'high'])->default('low');

            // Lifecycle
            $table->enum('status', [
                'open',         // Just submitted, no admin response yet
                'in_progress',  // Admin has responded / is working on it
                'resolved',     // Issue fixed
                'closed',       // Archived / won't fix
            ])->default('open');

            // Admin response (nullable — filled when admin replies)
            $table->text('admin_response')->nullable();
            $table->foreignId('responded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('responded_at')->nullable();

            // Optional: link ticket to a specific exam
            $table->foreignId('exam_id')->nullable()->constrained('exams')->onDelete('set null');

            $table->timestamps();

            // Indexes for the admin list view queries
            $table->index(['status', 'priority']);
            $table->index(['user_id']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};