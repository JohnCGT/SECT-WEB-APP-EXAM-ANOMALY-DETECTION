<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('keystroke_baselines', function (Blueprint $table) {
            $table->id();
            
            // Connects to the 'users' table
            $table->foreignId('student_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // Stores IKI (Inter-Keystroke Interval) sequence
            $table->json('flight_times_ms');

            $table->timestamp('recorded_at')->useCurrent();
            
            // Ensures one baseline per student
            $table->unique('student_id');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('keystroke_baselines');
    }
};
