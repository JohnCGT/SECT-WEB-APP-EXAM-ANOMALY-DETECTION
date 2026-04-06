<?php

// backend/routes/api.php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AnomalyController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseStudentController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\StudentCourseController;
use App\Http\Controllers\StudentExamController;
use App\Http\Controllers\TypingBaselineController;
use Illuminate\Support\Facades\Route;

// ── Public ────────────────────────────────────────────────────────────────────
Route::middleware(['throttle:6,1'])->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// ── Protected ─────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum'])->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // ── Admin: User Management ────────────────────────────────────────────────
    Route::prefix('admin')->group(function () {
        Route::get('/users',               [AdminUserController::class, 'index']);
        Route::post('/users',              [AdminUserController::class, 'store']);
        Route::put('/users/{id}',          [AdminUserController::class, 'update']);
        Route::patch('/users/{id}/status', [AdminUserController::class, 'updateStatus']);
        Route::delete('/users/{id}',       [AdminUserController::class, 'destroy']);
    });

    // ── Student: enrolled courses (MUST stay before /courses/{id}) ───────────
    Route::get('/student/courses',            [StudentCourseController::class, 'index']);
    Route::get('/student/courses/{courseId}', [StudentCourseController::class, 'show']);

    // ── Student: exams ────────────────────────────────────────────────────────
    Route::get('/student/courses/{courseId}/exams', [StudentExamController::class, 'courseExams']);
    Route::post('/student/exams/{examId}/start',    [StudentExamController::class, 'start']);
    Route::post('/student/exams/{examId}/submit',   [StudentExamController::class, 'submit']);
    Route::get('/student/exams/{examId}/results',   [StudentExamController::class, 'results']);

    // ── Student: typing baseline ──────────────────────────────────────────────
    Route::get('/student/typing-baseline/status', [TypingBaselineController::class, 'status']);
    Route::post('/student/typing-baseline',        [TypingBaselineController::class, 'store']);

    // ── Student: anomaly event ingestion ──────────────────────────────────────
    // Called silently by AnomalyCollector during an active exam session.
    // Hyphenated slugs match what the JS collector sends via XHR.
    // Rate-limited to 60 req/min per student to prevent flooding.
    //
    // Algorithm mapping (computation deferred to Python Flask):
    //   tab-switch         → Isolation Forest
    //   keyboard-shortcut  → One-Class SVM
    //   response-time      → Z-Score Method
    //   keystroke-dynamics → Hidden Markov Model
    Route::middleware(['throttle:60,1'])
        ->prefix('student/exams/{examId}/anomalies')
        ->group(function () {
            Route::post('/tab-switch',         [AnomalyController::class, 'tabSwitch']);
            Route::post('/keyboard-shortcut',  [AnomalyController::class, 'keyboardShortcut']);
            Route::post('/response-time',      [AnomalyController::class, 'responseTime']);
            Route::post('/keystroke-dynamics', [AnomalyController::class, 'keystrokeDynamics']);
        });

    // ── Instructor: courses ───────────────────────────────────────────────────
    Route::get('/courses',         [CourseController::class, 'index']);
    Route::post('/courses',        [CourseController::class, 'store']);
    Route::get('/courses/{id}',    [CourseController::class, 'show']);
    Route::put('/courses/{id}',    [CourseController::class, 'update']);
    Route::delete('/courses/{id}', [CourseController::class, 'destroy']);

    // ── Instructor: students per course ──────────────────────────────────────
    Route::get('/students/search',                            [CourseStudentController::class, 'search']);
    Route::get('/courses/{courseId}/students',                [CourseStudentController::class, 'index']);
    Route::post('/courses/{courseId}/students',               [CourseStudentController::class, 'store']);
    Route::delete('/courses/{courseId}/students/{studentId}', [CourseStudentController::class, 'destroy']);

    // ── Instructor: exams ─────────────────────────────────────────────────────
    Route::get('/exams',         [ExamController::class, 'index']);
    Route::post('/exams',        [ExamController::class, 'store']);
    Route::get('/exams/{id}',    [ExamController::class, 'show']);
    Route::put('/exams/{id}',    [ExamController::class, 'update']);
    Route::delete('/exams/{id}', [ExamController::class, 'destroy']);

    // ── Instructor: questions ─────────────────────────────────────────────────
    Route::get('/exams/{examId}/questions',         [QuestionController::class, 'index']);
    Route::post('/exams/{examId}/questions',        [QuestionController::class, 'store']);
    Route::put('/exams/{examId}/questions/{id}',    [QuestionController::class, 'update']);
    Route::delete('/exams/{examId}/questions/{id}', [QuestionController::class, 'destroy']);

    // ── Instructor: anomaly review ────────────────────────────────────────────
    // Instructors view risk summaries and individual event logs per exam.
    Route::prefix('exams/{examId}')->group(function () {
        Route::get('/anomalies',                             [AnomalyController::class, 'index']);
        Route::get('/anomalies/summary',                    [AnomalyController::class, 'summary']);
        Route::get('/submissions/{submissionId}/anomalies', [AnomalyController::class, 'show']);
        Route::patch('/anomalies/{logId}/review',           [AnomalyController::class, 'review']);
    });

});
