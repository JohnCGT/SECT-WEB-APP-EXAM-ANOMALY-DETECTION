<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates users table with role-based authentication
     */
    public function up(): void
    {
        // Users table - stores all user accounts
        Schema::create('users', function (Blueprint $table) {
            $table->id();                           // Auto-increment primary key
            $table->string('name');                 // User's full name
            $table->string('email')->unique();      // Email (must be unique)
            $table->string('password');             // Hashed password
            $table->string('role');                 // Role: admin, instructor, student
            $table->timestamps();                   // created_at, updated_at
        });

        // Password reset tokens table
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // Sessions table
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     * Drops all tables when rolling back
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};