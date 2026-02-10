<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/**
 * Public routes - accessible without authentication
 */

// Register new user
// POST /api/register
Route::post('/register', [AuthController::class, 'register']);

// Login user
// POST /api/login
Route::post('/login', [AuthController::class, 'login']);

/**
 * Protected routes (for future use)
 * Uncomment when you add authentication middleware
 */
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});