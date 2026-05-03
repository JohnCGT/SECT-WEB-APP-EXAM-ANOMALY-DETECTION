<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->string('type'); // 'new_exam' | 'results_updated'
            $table->string('title');
            $table->string('body');
            $table->string('url')->nullable();
            $table->foreignId('exam_id')->nullable()->constrained('exams')->onDelete('cascade');
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->index(['student_id', 'is_read']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_notifications');
    }
};