<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->enum('type', ['multiple_choice', 'true_false', 'essay']);
            $table->text('question_text');
            $table->integer('points')->default(1);
            $table->integer('order')->default(0); // Question order in exam
            
            // For multiple choice
            $table->json('options')->nullable(); // ["Option A", "Option B", "Option C", "Option D"]
            $table->string('correct_answer')->nullable(); // For MC and T/F
            
            // For essay
            $table->integer('max_words')->nullable();
            $table->text('rubric')->nullable(); // Grading rubric for essay
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};