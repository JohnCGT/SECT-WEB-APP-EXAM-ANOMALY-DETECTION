<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->foreignId('instructor_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['midterm', 'final', 'quiz', 'prelim'])->default('quiz');
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->integer('duration_minutes'); // Exam duration
            $table->integer('total_points')->default(100);
            $table->enum('status', ['draft', 'published', 'scheduled', 'active', 'completed'])->default('published');
            
            // Monitoring settings
            $table->boolean('face_detection')->default(true);
            $table->boolean('tab_switching_monitor')->default(true);
            $table->boolean('mouse_tracking')->default(true);
            $table->boolean('keyboard_analysis')->default(true);
            $table->boolean('screen_recording')->default(false);
            $table->boolean('isolation_forest')->default(true);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};