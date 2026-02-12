<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

// Define rate limiter
RateLimiter::for('login', function ($request) {
    return Limit::perMinute(5)->by($request->ip());
});

// Public routes with rate limiting
Route::middleware(['web', 'throttle:login'])->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes
Route::middleware(['web', 'auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Courses
    Route::get('/courses', [CourseController::class, 'index']);
    Route::post('/courses', [CourseController::class, 'store']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);
    Route::put('/courses/{id}', [CourseController::class, 'update']);
    Route::delete('/courses/{id}', [CourseController::class, 'destroy']);
    
    // Exams
    Route::get('/exams', [ExamController::class, 'index']);
    Route::post('/exams', [ExamController::class, 'store']);
    Route::get('/exams/{id}', [ExamController::class, 'show']);
    Route::put('/exams/{id}', [ExamController::class, 'update']);
    Route::delete('/exams/{id}', [ExamController::class, 'destroy']);
    
    // Questions
    Route::get('/exams/{examId}/questions', [QuestionController::class, 'index']);
    Route::post('/exams/{examId}/questions', [QuestionController::class, 'store']);
    Route::put('/exams/{examId}/questions/{id}', [QuestionController::class, 'update']);
    Route::delete('/exams/{examId}/questions/{id}', [QuestionController::class, 'destroy']);
});