# SECT — Web Exam Anomaly Detection

**SECT** is a full-stack web application built for conducting online exams with built-in academic integrity monitoring. It tracks suspicious behavior during exams in real time and runs it through a machine learning pipeline to generate a **Cheating Probability Index (CPI)** score for each student submission.

This project was developed as a thesis system combining web development with applied machine learning for academic integrity detection.

---

## What it does

When a student takes an exam, SECT silently monitors behavioral signals in the background — things like tab switching, unusual keyboard shortcuts, response timing patterns, and typing rhythm. After the exam is submitted, those signals are sent to a Python/Flask ML service that processes them through three anomaly detection algorithms and produces a CPI score. Instructors can then review flagged submissions through a dashboard with detailed anomaly breakdowns.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Anomaly Detection & CPI](#anomaly-detection--cpi)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [API Overview](#api-overview)
- [What Gets Tracked](#what-gets-tracked)
- [Database Tables](#database-tables)
- [For Developers](#for-developers)
- [Known Issues / TODOs](#known-issues--todos)

---

## Tech Stack

**Frontend**
- React 19 + Vite
- React Router v7
- Bootstrap 5 + Bootstrap Icons
- Axios
- SweetAlert2

**Backend**
- Laravel 12 (PHP 8.2+)
- Laravel Sanctum (API authentication)
- MySQL 8.0+

**ML Service**
- Python / Flask (runs on port `5001`)
- Isolation Forest (x2 variants)
- One-Class SVM
- Hidden Markov Model (HMM)

**Dev Tools**
- XAMPP (Apache + MySQL + PHP)
- Node.js 18+
- Composer

---

## System Architecture

```
[ React Frontend ]
       ↕  REST API (Axios)
[ Laravel Backend ]  ←→  [ MySQL Database ]
       ↕  HTTP (cURL, port 5001)
[ Python / Flask ML Service ]
```

During an exam, the React frontend collects behavioral data via `anomalyCollector.js` and sends it to Laravel API endpoints in real time. When the exam ends, Laravel dispatches a background job (`ProcessExamML`) that POSTs the session data to the Flask service at `http://127.0.0.1:5001/process-exam`. The Flask service runs the ML models and returns the CPI score, which is saved back into the database.

---

## Anomaly Detection & CPI

The CPI (Cheating Probability Index) is a 0–100 score that summarizes how suspicious a student's exam session was. It's computed by the Flask ML service using a weighted combination of three models:

| Model | Role |
|---|---|
| **Isolation Forest (v1)** | Detects general outliers in behavioral features |
| **Isolation Forest (v2)** | Secondary variant with different feature weighting |
| **One-Class SVM** | Trained on baseline "normal" behavior; flags deviations |
| **Hidden Markov Model** | Analyzes keystroke timing sequences for behavioral drift |

### CPI Score Labels

| Score Range | Label |
|---|---|
| 0 – 19 | Unlikely |
| 20 – 49 | Warning |
| 50 – 79 | Suspicious |
| 80 – 100 | Highly Suspicious |

The system tracks four main behavioral signals:

- **Tab switches** — how many times and how long the student left the exam window
- **Keyboard shortcuts** — blocked combos like Ctrl+C, Ctrl+V, F12, Ctrl+Shift+I, etc.
- **Response time anomalies** — unusually fast answers that may suggest external help
- **Keystroke dynamics** — dwell times, flight times, WPM compared to a typed baseline

---

## User Roles

There are three roles in the system, each with their own set of pages and permissions.

**Admin**
- Manage all users (create, activate, deactivate accounts)
- Manage courses and exam content across the platform
- View anomaly reports for all exams
- Handle support tickets submitted by instructors and students

**Instructor**
- Create and manage their own courses and exams
- Add/remove students from courses
- View real-time anomaly alerts during active exams
- Access detailed CPI reports and behavioral breakdowns per student
- Grade essay-type questions
- Submit support tickets

**Student**
- Enroll in courses
- Take exams (with behavior monitored in the background)
- Complete a typing baseline test before their first exam
- View their own exam results and grades
- Submit support tickets

---

## Project Structure

```
/
├── src/                        # React frontend
│   ├── components/             # Shared components (Login, Register, ProtectedRoute, etc.)
│   ├── pages/
│   │   ├── admin/              # Admin dashboard pages
│   │   ├── instructor/         # Instructor pages (courses, exams, alerts, reports)
│   │   └── student/            # Student pages (dashboard, exams, grades, profile)
│   ├── lib/
│   │   ├── api.js                  # Axios instance with base URL and auth headers
│   ├── services/
│   │   ├── anomalyCollector.js     # Collects and sends behavioral signals during exams
│   └── main.jsx                # App entry point and route definitions
│
├── backend/                    # Laravel backend
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── Admin/          # Admin-specific controllers
│   │   │   ├── Instructor/     # Instructor controllers (Exam, Anomaly, Course, etc.)
│   │   │   └── Student/        # Student controllers (Exam, Dashboard, Course, etc.)
│   │   ├── Jobs/
│   │   │   ├── ProcessExamML.php       # Dispatches submission to Flask for scoring
│   │   │   └── TrainHMMBaseline.php    # Trains HMM on a student's typing baseline
│   │   ├── Models/             # Eloquent models for all database tables
│   │   └── Services/
│   │       └── AnomalyDetectionService.php  # Handles real-time anomaly logging
│   ├── database/migrations/    # All database migrations
│   └── routes/api.php          # All API route definitions
│
└── ml_service/                 # Python/Flask ML service (see note below)
    └── app.py                  # Flask app exposing /process-exam endpoint
```

> **Note:** The ML service (`ml_service/`) may need to be set up separately. See [For Developers](#for-developers) for details.

---

## Prerequisites

Make sure you have all of these installed before starting:

| Tool | Version | Link |
|---|---|---|
| XAMPP | Latest | https://www.apachefriends.org/ |
| Node.js | v18+ | https://nodejs.org/ |
| Composer | Latest | https://getcomposer.org/ |
| Python | 3.9+ | https://www.python.org/ |
| Git | Latest | https://git-scm.com/ |

**System requirements:** Windows 10/11, macOS, or Linux — minimum 4GB RAM, 2GB free disk space.

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/SECT-WEB-APP-EXAM-ANOMALY-DETECTION.git
cd SECT-WEB-APP-EXAM-ANOMALY-DETECTION
```

### 2. Backend Setup (Laravel)

```bash
cd backend
composer install
```

Copy the environment file and configure it:

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Open `.env` and update your database credentials:

```env
DB_DATABASE=sect_db
DB_USERNAME=root
DB_PASSWORD=
```

Then generate the app key and run migrations:

```bash
php artisan key:generate
php artisan migrate
```

### 3. Frontend Setup (React)

```bash
# From the project root
npm install
```

### 4. ML Service Setup (Python/Flask)

```bash
cd ml_service
pip install flask scikit-learn hmmlearn numpy pandas
```

> The Flask service must be running on port `5001` for CPI scoring to work after exam submission.

---

## Running the App

You need three things running simultaneously: XAMPP (for MySQL), the Laravel server, and the Vite dev server. Optionally, also run the Flask ML service.

**Start XAMPP** — make sure Apache and MySQL are running.

**Start the backend (Laravel):**

```bash
cd backend
php artisan serve
# Runs at http://127.0.0.1:8000
```

**Start the frontend (React + Vite):**

```bash
# From project root
npm run dev
# Runs at http://localhost:5173
```

**Start the ML service (Flask):**

```bash
cd ml_service
python app.py
# Runs at http://127.0.0.1:5001
```

Once everything is running, open your browser and go to `http://localhost:5173`.

---

## API Overview

All API routes are prefixed with `/api`. Here's a summary of the main groups:

| Prefix | Who uses it | What it covers |
|---|---|---|
| `/api/auth/*` | Everyone | Login, register, logout |
| `/api/instructor/*` | Instructors | Courses, exams, questions, student lists, reports, alerts |
| `/api/student/*` | Students | Dashboard, enrolled courses, exam taking, results, grades |
| `/api/admin/*` | Admins | User management, platform-wide exam/course management |
| `/api/anomaly/*` | System (during exams) | Tab switch events, keyboard shortcuts, response times, keystrokes |

Real-time anomaly events are sent to endpoints like:
- `POST /api/anomaly/tab-switch`
- `POST /api/anomaly/keyboard-shortcut`
- `POST /api/anomaly/response-time`
- `POST /api/anomaly/keystroke-dynamics`

---

## What Gets Tracked

The `anomalyCollector.js` file on the frontend is the heart of the monitoring system. Here's what it watches during an active exam session:

- **Tab visibility** — triggers when `document.visibilityState` changes (tab switch or window minimize)
- **Keyboard shortcuts** — intercepts and logs blocked key combos (Ctrl+C, Ctrl+V, F12, Ctrl+Shift+I, etc.)
- **Response time** — measures how long a student spends on each question before submitting
- **Keystroke dynamics** — records dwell time (how long a key is held) and flight time (gap between keystrokes) to build a typing fingerprint

All of this data is flushed to the backend in batches during the exam and compiled when the student submits.

---

## Database Tables

Key tables you should know about:

| Table | Description |
|---|---|
| `users` | All users (admin, instructor, student) — role is a column |
| `courses` | Courses created by instructors |
| `course_students` | Enrollment pivot table |
| `exams` | Exam definitions (title, duration, question shuffling, etc.) |
| `questions` | Questions belonging to an exam |
| `exam_submissions` | One row per student per exam attempt |
| `exam_results` | CPI score, flag status, and event counters per submission |
| `tab_switch_logs` | Every tab switch event during an exam |
| `keyboard_shortcut_logs` | Every blocked shortcut attempt |
| `response_time_logs` | Time spent per question |
| `keystroke_dynamics_logs` | Dwell/flight times per question |
| `keystroke_baselines` | A student's baseline typing profile (from the typing test) |
| `student_notifications` | In-app notifications for students |
| `support_tickets` | Support requests from students and instructors |

---

## For Developers

### Adding a new anomaly signal

1. Add a new log model in `backend/app/Models/`
2. Create a migration for its table
3. Add a `process*()` method in `AnomalyDetectionService.php`
4. Add a route in `routes/api.php` pointing to the relevant controller
5. Update `anomalyCollector.js` to capture and send the new signal
6. Update the Flask ML service to factor the new signal into CPI scoring

### Updating the CPI formula

The CPI scoring logic lives in the Flask service (`ml_service/app.py`). The weights for each algorithm and each behavioral signal can be adjusted there. The Laravel side just receives and stores whatever score Flask returns.

> The placeholder scoring formula (used when Flask is unavailable) is defined in `ExamAnomalySummary.php` as:  
> `tab_switches × 5 + keyboard_shortcuts × 8 + response_time_anomalies × 6 + keystroke_anomalies × 7`, clamped to 100.

### Session & CORS

Cross-origin requests are handled by Laravel Sanctum. If you run into CORS issues during development, check `config/cors.php`. Cookie-based sessions require the frontend and backend to be on the same domain or properly configured subdomain in production. See `config/session.php` for session driver settings.

### Queue Workers

The ML scoring job (`ProcessExamML`) runs through Laravel's queue. In development, run:

```bash
php artisan queue:listen --tries=1
```

Without this, CPI scores won't be generated after exam submission.

### Typing Baseline

Before a student can take their first exam, the system requires them to complete a typing test. This baseline is stored in `keystroke_baselines` and used by the HMM model to detect behavioral drift during actual exams.

---

## Known Issues / TODOs

- [ ] The Flask ML service setup is not yet included in this repository — it needs to be configured separately
- [ ] `.env.example` needs to be added if not already present (don't commit your actual `.env`)
- [ ] Essay grading is partially implemented — auto-scoring for open-ended questions is a planned feature
- [ ] Real-time CPI updates during an active exam (currently computed only after submission)
- [ ] Add unit tests for `AnomalyDetectionService`

---

## Contributing

Pull requests are welcome. If you're making changes to the ML pipeline or CPI formula, please document what you changed and why in your PR description — it makes review a lot easier.

For major changes, open an issue first to discuss what you'd like to change.

---

## Authors


| Name | Role | GitHub |
|---|---|---|
| Sam Esita | Lead Developer | https://github.com/Esitaw |
| John Carlo Tulin | Front/Backend Developer | https://github.com/JohnCGT |
| Eumy Simoun Castillo | Back-end Developer | https://github.com/eumysimouncastillo |
| Jacinto Jose Guban | Front-End Developer | https://github.com/JjGuban |

---

## License

This project is for academic and educational use.
