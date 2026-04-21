<?php

// backend/routes/api.php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminProfileController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AnomalyController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseStudentController;
use App\Http\Controllers\EssayGradingController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\StudentCourseController;
use App\Http\Controllers\StudentExamController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\TypingBaselineController;
use App\Http\Controllers\StudentDashboardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

// ── Public ────────────────────────────────────────────────────────────────────
//
// THROTTLE: Currently DISABLED for register & login.
// To RE-ENABLE: uncomment the two Route::middleware lines and the closing });
// To DISABLE:   comment them out again (as they are now)
//
// Route::middleware(['throttle:6,1'])->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
// });

// ── Protected ─────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum'])->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);
    Route::put('/profile',          [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);
    Route::post('/profile/photo',   [ProfileController::class, 'uploadPhoto']);

    // ── Admin ─────────────────────────────────────────────────────────────────
    Route::prefix('admin')->group(function () {
        Route::get('/profile',   [AdminProfileController::class, 'show']);
        Route::patch('/profile', [AdminProfileController::class, 'update']);

        Route::get('/dashboard',     [AdminDashboardController::class, 'dashboard']);
        Route::get('/notifications', [AdminDashboardController::class, 'notifications']);

        // User Management
        Route::get('/users',               [AdminUserController::class, 'index']);
        Route::post('/users',              [AdminUserController::class, 'store']);
        Route::put('/users/{id}',          [AdminUserController::class, 'update']);
        Route::patch('/users/{id}/status', [AdminUserController::class, 'updateStatus']);
        Route::delete('/users/{id}',       [AdminUserController::class, 'destroy']);

        Route::get('/courses', [AdminDashboardController::class, 'courses']);

        // Exam Management (admin-wide — sees all instructors' exams)
        Route::get('/exams',                  [AdminDashboardController::class, 'exams']);
        Route::patch('/exams/{id}/status',    [AdminDashboardController::class, 'updateExamStatus']);
        Route::delete('/exams/{id}/sessions', [AdminDashboardController::class, 'resetSessions']);

        // Anomaly Reports (admin-wide feed — merges all four anomaly log tables)
        Route::get('/anomalies', [AdminDashboardController::class, 'anomalies']);

        // System Logs
        // Requires spatie/laravel-activitylog: composer require spatie/laravel-activitylog
        // Then publish & migrate: php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider"
        //                          php artisan migrate
        Route::get('/logs', [AdminDashboardController::class, 'logs']);

        Route::get('/support',        [SupportTicketController::class, 'adminIndex']);
        Route::get('/support/{id}',   [SupportTicketController::class, 'adminShow']);
        Route::patch('/support/{id}', [SupportTicketController::class, 'adminUpdate']);
    });

    // ── Support Tickets ───────────────────────────────────────────────────────
    //
    // THROTTLE: Currently ENABLED for support ticket creation (5 requests/min).
    // To DISABLE: comment out the Route::middleware line and its closing });
    //             and un-indent the Route::post line inside it
    // To RE-ENABLE: uncomment them (as they are now)
    //
    Route::middleware(['throttle:5,1'])->group(function () {
        Route::post('/support/tickets', [SupportTicketController::class, 'store']);
    });
    Route::get('/support/tickets',      [SupportTicketController::class, 'myTickets']);
    Route::get('/support/tickets/{id}', [SupportTicketController::class, 'myShow']);

    // ── Student: enrolled courses ─────────────────────────────────────────────
    Route::get('/student/courses',            [StudentCourseController::class, 'index']);
    Route::get('/student/courses/{courseId}', [StudentCourseController::class, 'show']);

    // ── Student: exams ────────────────────────────────────────────────────────
    // ⚠️  /student/exams MUST come before /student/exams/{examId}/* so Laravel
    //     doesn't swallow the literal "exams" word as a route parameter.
    Route::get('/student/exams',                    [StudentExamController::class, 'allExams']);
    Route::get('/student/grades',                   [StudentExamController::class, 'grades']);
    Route::get('/student/courses/{courseId}/exams', [StudentExamController::class, 'courseExams']);
    Route::post('/student/exams/{examId}/start',    [StudentExamController::class, 'start']);
    Route::post('/student/exams/{examId}/submit',   [StudentExamController::class, 'submit']);
    Route::get('/student/exams/{examId}/results',   [StudentExamController::class, 'results']);

    // ── Student: typing baseline ──────────────────────────────────────────────
    Route::get('/student/typing-baseline/status', [TypingBaselineController::class, 'status']);
    Route::post('/student/typing-baseline',        [TypingBaselineController::class, 'store']);
    Route::get('/student/dashboard/typing-stats',  [StudentDashboardController::class, 'typingStats']);

    // ── Student: dashboard ────────────────────────────────────────────────────
    Route::get('/student/dashboard/exams/upcoming', [StudentDashboardController::class, 'upcomingExams']);
    Route::get('/student/dashboard/exams/active',   [StudentDashboardController::class, 'activeExam']);
    Route::get('/student/dashboard/exams/results',  [StudentDashboardController::class, 'recentResults']);
    Route::get('/student/dashboard/announcements',  [StudentDashboardController::class, 'announcements']);
    Route::get('/student/dashboard/integrity',      [StudentDashboardController::class, 'integrityStats']);
    Route::get('/student/dashboard/score-stats',    [StudentDashboardController::class, 'scoreStats']);

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
    //
    // THROTTLE: Currently ENABLED for anomaly ingestion (60 requests/min).
    // To DISABLE: comment out the ->middleware(['throttle:60,1']) line
    // To RE-ENABLE: uncomment it (as it is now)
    //
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

    // ── Instructor: students per course ───────────────────────────────────────
    Route::get('/students/search',                            [CourseStudentController::class, 'search']);
    Route::get('/courses/{courseId}/students',                [CourseStudentController::class, 'index']);
    Route::post('/courses/{courseId}/students',               [CourseStudentController::class, 'store']);
    Route::delete('/courses/{courseId}/students/{studentId}', [CourseStudentController::class, 'destroy']);

    // ── Instructor: exams ─────────────────────────────────────────────────────
    Route::get('/exams',                   [ExamController::class, 'index']);
    Route::post('/exams',                  [ExamController::class, 'store']);
    Route::get('/exams/{id}',              [ExamController::class, 'show']);
    Route::put('/exams/{id}',              [ExamController::class, 'update']);
    Route::delete('/exams/{id}',           [ExamController::class, 'destroy']);
    // All submissions for an exam (Student Results tab)
    Route::get('/exams/{id}/submissions',  [ExamController::class, 'submissions']);

    // ── Instructor: questions ─────────────────────────────────────────────────
    Route::get('/exams/{examId}/questions',         [QuestionController::class, 'index']);
    Route::post('/exams/{examId}/questions',        [QuestionController::class, 'store']);
    Route::put('/exams/{examId}/questions/{id}',    [QuestionController::class, 'update']);
    Route::delete('/exams/{examId}/questions/{id}', [QuestionController::class, 'destroy']);

    // ── Instructor: essay grading ─────────────────────────────────────────────
    Route::prefix('exams/{examId}/essays')->group(function () {
        Route::get('/pending',          [EssayGradingController::class, 'pending']);
        Route::get('/stats',            [EssayGradingController::class, 'stats']);
        Route::patch('/{submissionId}', [EssayGradingController::class, 'grade']);
    });

    // ── Instructor: per-student PDF data + anomaly review ─────────────────────
    // NOTE: /submissions/{submissionId}/student-pdf MUST be declared BEFORE
    //       /submissions/{submissionId}/anomalies to avoid route shadowing.
    Route::prefix('exams/{examId}')->group(function () {
        // Per-student PDF data endpoint
        Route::get('/submissions/{submissionId}/student-pdf',
            [EssayGradingController::class, 'submissionPdf']);

        // Anomaly review
        Route::get('/anomalies',                              [AnomalyController::class, 'index']);
        Route::get('/anomalies/summary',                      [AnomalyController::class, 'summary']);
        Route::get('/submissions/{submissionId}/anomalies',   [AnomalyController::class, 'show']);
        Route::patch('/anomalies/{logId}/review',             [AnomalyController::class, 'review']);
    });

});