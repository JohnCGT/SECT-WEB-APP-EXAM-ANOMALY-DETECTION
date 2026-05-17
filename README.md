# SECT — Web Exam Anomaly Detection

SECT is a web-based online examination platform built for academic integrity. It handles exam creation, student proctoring, and real-time behavioral anomaly detection using machine learning. The system quietly monitors student activity during an active exam and flags suspicious behavior without interrupting the student's session.

This was built as a thesis project, combining full-stack web development with machine learning-based academic integrity detection.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [How Anomaly Detection Works](#how-anomaly-detection-works)
- [Cheating Probability Index](#cheating-probability-index)
- [Exam Monitoring Settings](#exam-monitoring-settings)
- [User Roles](#user-roles)
- [API Overview](#api-overview)
- [Developers](#developers)

---

## Overview

When a student starts an exam, the `AnomalyCollector` class runs silently in the browser. It listens for behavioral signals — tab switching, keyboard shortcuts, how long a student spends on a question, and how they type — and sends each event to the Laravel backend via XHR. The backend logs every event into dedicated tables, one per signal type. After an exam is submitted, a Python Flask service reads those logs and runs the appropriate machine learning algorithm on each signal type. Results are written back into the `exam_results` table as a final CPI score and per-algorithm flags. Instructors can then open the anomaly review dashboard to see the full log per student and decide whether to act on it.

The system is intentionally non-blocking. If a signal fails to post, it is logged silently and the exam continues unaffected.

---

## Tech Stack

**Frontend**
- React 19 with Vite
- React Router v7
- Axios for HTTP requests
- Bootstrap 5 and Bootstrap Icons
- SweetAlert2 for confirmation dialogs

**Backend**
- PHP 8.2
- Laravel 12
- Laravel Sanctum for session-based authentication
- MySQL

**Anomaly Detection Service**
- Python 3.10+
- Flask
- Isolation Forest (tab switching)
- One-Class SVM (keyboard shortcuts)
- Hidden Markov Model (keystroke dynamics)
- Z-Score Method (response time)

---

## Project Structure

```
SECT-WEB-APP-EXAM-ANOMALY-DETECTION/
│
├── src/                              # React frontend
│   ├── lib/
│   │   └── api.js                    # Axios instance, CSRF handling, interceptors
│   ├── services/
│   │   └── anomalyCollector.js       # Behavioral event collector (runs during exam)
│   ├── components/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── InstructorAlertBell.jsx
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminPage.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   ├── ExamManagement.jsx
│   │   │   ├── AdminCourseManagement.jsx
│   │   │   ├── AnomalyReports.jsx
│   │   │   ├── SupportTickets.jsx
│   │   │   ├── ActivityLogs.jsx
│   │   │   ├── AdminProfile.jsx
│   │   │   └── NotificationBell.jsx
│   │   ├── instructor/
│   │   │   ├── Homepage.jsx
│   │   │   ├── CoursesPage.jsx
│   │   │   ├── CourseDetail.jsx
│   │   │   ├── ExamPage.jsx
│   │   │   ├── ExamDetail.jsx
│   │   │   ├── ExamEdit.jsx
│   │   │   ├── Students.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Alerts.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── AccountSettings.jsx
│   │   │   └── InstructorSupport.jsx
│   │   └── student/
│   │       ├── Dashboard.jsx
│   │       ├── SubjectPage.jsx
│   │       ├── ExamsPage.jsx
│   │       ├── CourseExamPage.jsx
│   │       ├── TakeExamPage.jsx
│   │       ├── ExamResultsPage.jsx
│   │       ├── GradesPage.jsx
│   │       ├── TypingTestPage.jsx
│   │       ├── StudentProfile.jsx
│   │       ├── StudentAccountSettings.jsx
│   │       └── StudentSupport.jsx
│   └── styles/
│
└── backend/                          # Laravel API
    ├── app/
    │   ├── Http/
    │   │   └── Controllers/
    │   │       ├── Admin/
    │   │       │   ├── AdminDashboardController.php
    │   │       │   ├── AdminProfileController.php
    │   │       │   └── AdminUserController.php
    │   │       ├── Instructor/
    │   │       │   ├── AnomalyController.php
    │   │       │   ├── CourseController.php
    │   │       │   ├── CourseStudentController.php
    │   │       │   ├── EssayGradingController.php
    │   │       │   ├── ExamController.php
    │   │       │   └── QuestionController.php
    │   │       ├── Student/
    │   │       │   ├── StudentCourseController.php
    │   │       │   ├── StudentDashboardController.php
    │   │       │   ├── StudentExamController.php
    │   │       │   ├── StudentNotificationController.php
    │   │       │   ├── StudentSearchController.php
    │   │       │   └── TypingBaselineController.php
    │   │       ├── AuthController.php
    │   │       ├── ProfileController.php
    │   │       └── SupportTicketController.php
    │   └── Models/
    │       ├── User.php
    │       ├── Course.php
    │       ├── Exam.php
    │       ├── Question.php
    │       ├── ExamSubmission.php
    │       ├── ExamAnswer.php
    │       ├── ExamResult.php
    │       ├── TabSwitchLog.php
    │       ├── KeyboardShortcutLog.php
    │       ├── ResponseTimeLog.php
    │       ├── KeystrokeDynamicsLog.php
    │       ├── KeystrokeBaseline.php
    │       ├── StudentNotification.php
    │       ├── SupportTicket.php
    │       └── ActivityLog.php
    ├── routes/
    │   └── api.php
    └── database/
        └── migrations/
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PHP 8.2+
- Composer
- MySQL
- Python 3.10+ with Flask (for the anomaly detection service)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/sect-web-app.git
cd sect-web-app
```

### 2. Frontend setup

```bash
# Install dependencies
npm install

# Copy and configure the frontend environment file
cp .env.example .env

# Start the development server
npm run dev
```

### 3. Backend setup

```bash
cd backend

# Install PHP dependencies
composer install

# Copy and configure the backend environment file
cp .env.example .env

# Generate the application key
php artisan key:generate

# Run all database migrations
php artisan migrate

# Start the Laravel development server
php artisan serve
```

### 4. Rebuild the autoloader

Only needed after moving or adding controllers. Run this if you see class-not-found errors:

```bash
cd backend
composer dump-autoload
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

---

## Environment Variables

### Backend — `backend/.env`

```env
APP_NAME=SECT
APP_ENV=local
APP_KEY=                        # generated by php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sect_app
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=localhost

SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

### Frontend — `.env` (project root)

```env
VITE_API_URL=http://localhost:8000
```

> Do not commit either `.env` file to version control. Both are listed in `.gitignore` by default.

---

## Database Schema

SECT uses a purpose-built schema where each anomaly signal type has its own dedicated table. This makes it straightforward for the Flask service to query exactly the data it needs per algorithm without filtering across a single bloated log table.

### Core tables

| Table | Description |
|---|---|
| `users` | All users — students, instructors, and admins share this table with a `role` column |
| `courses` | Courses created by instructors, with code, name, semester, and credits |
| `course_students` | Enrollment — links students to courses |
| `exams` | Exam records tied to a course and instructor, includes monitoring toggle settings |
| `questions` | Questions per exam; supports `multiple_choice`, `true_false`, and `essay` types |
| `exam_submissions` | One row per student per exam; tracks start time, submit time, score, and status |
| `exam_answers` | One row per question per submission; stores the student's answer and points earned |
| `keystroke_baselines` | One baseline per student, recorded via the typing test before any exam |

### Anomaly log tables

Each table maps to one machine learning algorithm and stores the raw features that algorithm needs.

| Table | Algorithm | Key features stored |
|---|---|---|
| `tab_switch_logs` | Isolation Forest | `cumulative_switches`, `hidden_duration_ms`, `is_return_event` |
| `keyboard_shortcut_logs` | One-Class SVM | `keys`, `cumulative_count`, `is_paste`, `pasted_char_count` |
| `response_time_logs` | Z-Score Method | `response_time_ms`, `question_position`, `previous_times_ms`, `z_score`, `direction` |
| `keystroke_dynamics_logs` | Hidden Markov Model | `dwell_times_ms`, `flight_times_ms`, `avg_dwell_ms`, `wpm`, `keystroke_count` |

### Results table

| Table | Description |
|---|---|
| `exam_results` | One row per submission; written by Flask after scoring. Stores the CPI score, CPI label, and per-algorithm flags (`iso_tab_flagged`, `svm_flagged`, `rt_flagged`, `hmm_flagged`) and raw scores |

### Supporting tables

| Table | Description |
|---|---|
| `student_notifications` | In-app notifications for students |
| `support_tickets` | Student and instructor support requests |
| `activity_logs` | System-wide event log for admin review |

---

## How Anomaly Detection Works

### Step 1 — Signal collection (frontend)

`anomalyCollector.js` attaches event listeners when an exam starts. It runs entirely in the browser and collects four types of behavioral signals:

**Tab switching** — fires on the browser's `visibilitychange` event. When the tab is hidden, a ping is sent immediately with `hidden_duration_ms: 0`. When the student returns, a second event is sent with the actual time elapsed. Only the return event counts toward the summary counter. This prevents a single leave from inflating the count.

**Keyboard shortcuts** — fires on `keydown` at the document level using capture mode. A predefined blocklist of combos (`Ctrl+C`, `Ctrl+V`, `Ctrl+T`, `F12`, `PrintScreen`, and others) triggers an immediate post. Paste events on essay fields are also captured separately with character count and paste index so the algorithm can weigh them differently.

**Response time** — tracked per question. The collector records when a question becomes active and sends the elapsed time when the student moves to the next question or submits. All previous response times for the session are included in the payload so Flask can compute z-scores on the fly without querying the database again.

**Keystroke dynamics** — attached to each essay textarea. Records how long each key is held down (`dwell_times_ms`) and the gap between key releases (`flight_times_ms`). The buffer flushes automatically after 2 seconds of typing inactivity or when the field loses focus. Mobile virtual keyboards, which suppress key events on iOS and Android, are handled via an `input` event fallback that synthesizes a realistic 80ms dwell time.

### Step 2 — Storage (Laravel backend)

Each signal type is received by `AnomalyController` and written to its dedicated log table. The controller validates the payload, writes the raw feature data, and returns a current flag status to the frontend. No machine learning computation happens here — that is intentionally deferred to the Flask service so the exam experience is never delayed by scoring overhead.

### Step 3 — Scoring (Python Flask)

After a submission is completed, Flask reads the raw logs for that submission and runs each algorithm independently:

| Signal | Algorithm | How it works |
|---|---|---|
| Tab switching | Isolation Forest | Trains on session-level features (`cumulative_switches`, `hidden_duration_ms`). Flags sessions that are statistical outliers relative to the normal distribution of behavior. |
| Keyboard shortcuts | One-Class SVM | Learns the boundary of normal shortcut behavior (ideally none). Sessions that exceed the boundary in frequency, paste count, or pasted character volume are flagged. |
| Response time | Z-Score | For each question, computes how many standard deviations the response time is from the student's session mean. Questions where `|z| > threshold` are flagged as either `too_fast` or `too_slow`. |
| Keystroke dynamics | Hidden Markov Model | Models the sequence of `(dwell, flight)` pairs as observations against the student's pre-recorded baseline. Flags sessions whose emission probability falls below a trained threshold. |

Flask writes the scores and per-algorithm flags back into `exam_results` and backfills the `severity` column on each individual log row.

### Step 4 — Review (instructor dashboard)

Instructors open the anomaly review panel for any exam. They can see the CPI score and label per student, a full chronological log of every event grouped by signal type, per-algorithm flags and raw scores, and they can mark individual log entries as reviewed with personal notes.

---

## Cheating Probability Index

The CPI is a single score from 0 to 100 that summarizes anomaly signals from all four algorithms into one number per submission. Flask computes it after scoring and writes it to `exam_results.cpi_score`. The four per-algorithm scores are weighted and combined into the final CPI.

| CPI Score | Label |
|---|---|
| 0 – 25 | Unlikely |
| 26 – 50 | Possible |
| 51 – 75 | Probable |
| 76 – 100 | Highly Probable |

`is_flagged` is set to `true` when the score crosses a configured threshold. Instructors see the label and score side by side on the student results table, making it easy to prioritize who to review first.

---

## Exam Monitoring Settings

Each exam has per-toggle monitoring settings that instructors configure when creating or editing an exam. The collector checks these flags before attaching any listeners, so students are never monitored for signals the instructor did not enable.

| Setting | What it controls |
|---|---|
| `tab_switching_monitor` | Whether tab-switch events are collected and scored |
| `keyboard_analysis` | Whether keyboard shortcut events are collected and scored |
| `isolation_forest` | Whether Isolation Forest scoring runs for this exam |
| `face_detection` | Reserved for future camera-based proctoring |
| `mouse_tracking` | Reserved for future mouse movement analysis |
| `screen_recording` | Reserved — disabled by default |

---

## User Roles

### Admin

- Create, update, and deactivate user accounts for students and instructors
- View all courses and exams across the entire platform
- Monitor anomaly reports system-wide
- Manage and respond to support tickets
- Review system-wide activity logs

### Instructor

- Create and manage courses and enroll students by search
- Build exams with multiple question types: multiple choice, true/false, and essay
- Configure per-exam monitoring settings and toggle individual algorithms
- View all student submissions and grade essay questions against a rubric
- Review the full anomaly log and CPI score for each student per exam
- Mark anomaly log entries as reviewed with personal notes

### Student

- View enrolled courses and browse upcoming and active exams
- Take exams in a monitored environment with the collector running in the background
- View grades and detailed results after submission
- Complete a typing baseline test before taking exams, which the HMM uses for comparison
- Submit and track support tickets

---

## API Overview

All routes are prefixed with `/api`. Protected routes require a valid Sanctum session cookie.

### Auth (public)
```
POST   /api/register
POST   /api/login
```

### Auth (protected)
```
POST   /api/logout
GET    /api/me
PUT    /api/profile
PUT    /api/profile/password
POST   /api/profile/photo
```

### Admin
```
GET    /api/admin/dashboard
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/{id}
PATCH  /api/admin/users/{id}/status
DELETE /api/admin/users/{id}
GET    /api/admin/courses
GET    /api/admin/exams
PATCH  /api/admin/exams/{id}/status
GET    /api/admin/anomalies
GET    /api/admin/logs
GET    /api/admin/support
PATCH  /api/admin/support/{id}
```

### Instructor — Courses & Students
```
GET    /api/courses
POST   /api/courses
GET    /api/courses/{id}
PUT    /api/courses/{id}
DELETE /api/courses/{id}
GET    /api/courses/{courseId}/students
POST   /api/courses/{courseId}/students
DELETE /api/courses/{courseId}/students/{studentId}
GET    /api/students/search
```

### Instructor — Exams & Questions
```
GET    /api/exams
POST   /api/exams
GET    /api/exams/{id}
PUT    /api/exams/{id}
DELETE /api/exams/{id}
GET    /api/exams/{id}/submissions
GET    /api/exams/{examId}/questions
POST   /api/exams/{examId}/questions
PUT    /api/exams/{examId}/questions/{id}
DELETE /api/exams/{examId}/questions/{id}
```

### Instructor — Anomaly Review
```
GET    /api/exams/{examId}/anomalies
GET    /api/exams/{examId}/anomalies/summary
GET    /api/exams/{examId}/submissions/{submissionId}/anomalies
PATCH  /api/exams/{examId}/anomalies/{logId}/review
```

### Instructor — Essay Grading
```
GET    /api/exams/{examId}/essays/pending
GET    /api/exams/{examId}/essays/stats
PATCH  /api/exams/{examId}/essays/{submissionId}
GET    /api/exams/{examId}/submissions/{submissionId}/student-pdf
```

### Student — Exams
```
GET    /api/student/exams
GET    /api/student/courses/{courseId}/exams
POST   /api/student/exams/{examId}/start
POST   /api/student/exams/{examId}/submit
GET    /api/student/exams/{examId}/results
GET    /api/student/grades
```

### Student — Anomaly Ingestion
```
# Rate limited to 60 requests per minute per student
POST   /api/student/exams/{examId}/anomalies/tab-switch
POST   /api/student/exams/{examId}/anomalies/keyboard-shortcut
POST   /api/student/exams/{examId}/anomalies/response-time
POST   /api/student/exams/{examId}/anomalies/keystroke-dynamics
```

### Student — Dashboard & Misc
```
GET    /api/student/dashboard/exams/upcoming
GET    /api/student/dashboard/exams/active
GET    /api/student/dashboard/exams/results
GET    /api/student/dashboard/integrity
GET    /api/student/dashboard/score-stats
GET    /api/student/dashboard/typing-stats
GET    /api/student/courses
GET    /api/student/courses/{courseId}
GET    /api/student/search
GET    /api/student/typing-baseline/status
POST   /api/student/typing-baseline
GET    /api/student/notifications
PATCH  /api/student/notifications/read-all
PATCH  /api/student/notifications/{id}/read
```

---

## Developers

| Name | Role |
|---|---|
| [John Carlo Tulin](https://github.com/) | placeholder |
| [Eumy Simoun Castillo](https://github.com/) | placeholder |
| [Jacinto Jose Guban](https://github.com/) | placeholder |
| [Sam Esita](https://github.com/) | placeholder |

---

*SECT is an academic thesis project. It is not intended for production use without further security review.*
