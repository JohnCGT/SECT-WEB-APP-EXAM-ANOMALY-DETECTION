<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseStudentController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\QuestionController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::middleware(['throttle:6,1'])->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// Protected routes — Sanctum session-based auth
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Courses
    Route::get('/courses',       [CourseController::class, 'index']);
    Route::post('/courses',      [CourseController::class, 'store']);
    Route::get('/courses/{id}',  [CourseController::class, 'show']);
    Route::put('/courses/{id}',  [CourseController::class, 'update']);
    Route::delete('/courses/{id}', [CourseController::class, 'destroy']);

    // Course Students (enroll / manage)
    Route::get('/students/search', [CourseStudentController::class, 'search']);
    Route::get('/courses/{courseId}/students',                   [CourseStudentController::class, 'index']);
    Route::post('/courses/{courseId}/students',                  [CourseStudentController::class, 'store']);
    Route::delete('/courses/{courseId}/students/{studentId}',    [CourseStudentController::class, 'destroy']);

    // Exams
    Route::get('/exams',         [ExamController::class, 'index']);
    Route::post('/exams',        [ExamController::class, 'store']);
    Route::get('/exams/{id}',    [ExamController::class, 'show']);
    Route::put('/exams/{id}',    [ExamController::class, 'update']);
    Route::delete('/exams/{id}', [ExamController::class, 'destroy']);

    // Questions
    Route::get('/exams/{examId}/questions',           [QuestionController::class, 'index']);
    Route::post('/exams/{examId}/questions',          [QuestionController::class, 'store']);
    Route::put('/exams/{examId}/questions/{id}',      [QuestionController::class, 'update']);
    Route::delete('/exams/{examId}/questions/{id}',   [QuestionController::class, 'destroy']);
});