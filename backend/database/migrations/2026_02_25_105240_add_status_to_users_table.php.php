<?php

// backend/database/migrations/2024_01_01_000002_add_status_to_users_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add a 'status' column to the users table.
     * Defaults to 'active'. Can be 'active' or 'suspended'.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add after 'role' column, default active
            $table->string('status')->default('active')->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
