# SECT — Web Exam Anomaly Detection

SECT is a web-based online examination platform built for academic integrity. It combines a full-stack Laravel + React application with a machine learning layer that passively monitors student behavior during exams and flags suspicious activity using a **Cheating Probability Index (CPI)**.

The system is designed for three roles: **Admin**, **Instructor**, and **Student** — each with a dedicated dashboard and set of features.

---

## Features

**For Students**
- Take timed exams with multiple choice and essay questions
- Real-time anomaly monitoring running silently in the background
- View exam results, grades, and integrity reports per submission
- Typing baseline enrollment before taking exams

**For Instructors**
- Create and manage courses, exams, and questions
- Grade essay submissions manually
- Review per-student anomaly logs and risk scores
- See a full breakdown of flagged behavior per exam session

**For Admins**
- Manage all users (students, instructors)
- Monitor platform-wide exam activity and anomaly reports
- Handle support tickets and system logs

---

## Anomaly Detection

Anomalies are collected silently on the client side during an active exam session and sent to the backend for storage. A separate Python Flask service processes the raw data using machine learning.

Four types of events are tracked:

| Event | Algorithm | What it captures |
|---|---|---|
| Tab switching | Isolation Forest | How often and how long a student leaves the exam tab |
| Keyboard shortcuts | One-Class SVM | Use of copy, paste, and other blocked key combinations |
| Response time | Z-Score Method | Unusually fast or slow answers per question |
| Keystroke dynamics | Hidden Markov Model | Typing rhythm — dwell times and flight times between keystrokes |

Each event is stored as a raw log with metadata. The Flask service computes anomaly scores per event type, which are then combined into a single **CPI (Cheating Probability Index)** score per student per exam. The CPI drives the `flag_status` shown to instructors: `none`, `low`, `medium`, or `high`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Bootstrap 5, Axios |
| Backend | Laravel 12, PHP 8.2, Laravel Sanctum |
| Database | MySQL |
| ML Service | Python, Flask *(separate repository)* |
| Auth | Session-based via Laravel Sanctum |

---

## Project Structure

```
root/
│
├── backend/                        # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   │       ├── Admin/          # Admin-only controllers
│   │   │       ├── Instructor/     # Instructor-only controllers
│   │   │       ├── Student/        # Student-only controllers
│   │   │       ├── AuthController.php
│   │   │       ├── ProfileController.php
│   │   │       └── SupportTicketController.php
│   │   └── Models/                 # Eloquent models
│   ├── database/
│   │   └── migrations/             # All database migrations
│   └── routes/
│       └── api.php                 # All API routes
│
└── src/                            # React frontend
    ├── lib/
    │   └── api.js                  # Axios instance and interceptors (shared)
    ├── services/
    │   └── anomalyCollector.js     # Client-side anomaly event collector
    ├── components/                 # Shared UI components (auth, guards)
    ├── pages/
    │   ├── admin/                  # Admin pages
    │   ├── instructor/             # Instructor pages
    │   └── student/                # Student pages
    └── context/                    # React context providers
```

---

## Getting Started

### Requirements

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL
- Python 3.10+ *(for the ML service)*

### Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configure your `.env` file — set your database credentials, `APP_URL`, `FRONTEND_URL`, and session settings. Then run:

```bash
php artisan migrate
php artisan serve
```

### Frontend Setup

```bash
npm install
cp .env.example .env
# Set VITE_API_URL to your backend URL
npm run dev
```

### Environment Variables

**Backend `.env` (key ones)**
```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=mysql
DB_DATABASE=sect_app
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=cookie
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

**Frontend `.env`**
```env
VITE_API_URL=http://localhost:8000
```

---

## Database

Run all migrations with:

```bash
php artisan migrate
```

Key tables: `users`, `courses`, `exams`, `questions`, `exam_submissions`, `exam_results`, `tab_switch_logs`, `keyboard_shortcut_logs`, `response_time_logs`, `keystroke_dynamics_logs`, `keystroke_baselines`, `activity_logs`, `support_tickets`, `student_notifications`.

---

## API

All routes are defined in `backend/routes/api.php`. The API is prefixed with `/api` and protected via Laravel Sanctum session authentication.

Public routes:
```
POST /api/register
POST /api/login
```

All other routes require authentication via `auth:sanctum` middleware and are scoped by role using route prefixes (`/admin`, `/student`, `/instructor`).

---

## Developers

| Name | Role |
|---|---|
| Sam Esita | Lead Developer |
| John Carlo Tulin | Full Stack Developer |
| Eumy Simoun Castillo | Back End Developer |
| Jacinto Jose Guban | Front End Developer |

---

## Notes

- The ML/Flask service is maintained in a separate repository. The Laravel backend stores raw anomaly event data; Flask reads and scores it.
- Anomaly collection on the client is handled entirely by `anomalyCollector.js` — it runs silently and uses `XMLHttpRequest` with `withCredentials` to stay compatible with Sanctum sessions.
- Tab switching is detected via the Page Visibility API.
- Keystroke dynamics support mobile virtual keyboards through an `input` event fallback.
