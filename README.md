# 🎓 Exam Anomaly Detection System

A comprehensive full-stack web application for detecting and managing exam anomalies with role-based authentication (Admin, Instructor, Student). Built with modern web technologies to ensure secure, scalable, and efficient exam monitoring.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation Guide](#️-installation-guide)
  - [Step 1: Clone Repository](#step-1-clone-repository)
  - [Step 2: Install Composer](#step-2-install-composer)
  - [Step 3: Backend Setup (Laravel)](#step-3-backend-setup-laravel)
  - [Step 4: Frontend Setup (React)](#step-4-frontend-setup-react)
- [Running the Application](#️-running-the-application)
- [Project Structure](#-project-structure)
- [User Roles & Routes](#-user-roles--routes)
- [Testing the System](#-testing-the-system)
- [Security Features](#-security-features)
- [Database Schema](#️-database-schema)
- [API Endpoints](#-api-endpoints)
- [Troubleshooting](#-troubleshooting)
- [Development Guide](#-development-guide)
- [Deployment](#-deployment)
- [License](#-license)
- [Authors](#-authors)

---

## ✨ Features

- 🔐 **Secure Authentication** - Role-based access control with encrypted passwords
- 👥 **Multi-Role System** - Admin, Instructor, and Student roles with specific permissions
- 📊 **Exam Management** - Create, edit, and monitor exams in real-time
- 🚨 **Anomaly Detection** - Automated detection of suspicious exam activities
- 📈 **Detailed Reports** - Comprehensive analytics and reporting system
- 🎨 **Modern UI** - Responsive design with Bootstrap 5
- 🔔 **Real-time Alerts** - Instant notifications for anomaly detection
- 📱 **Mobile Responsive** - Works seamlessly on all devices

---

## 🚀 Tech Stack

### Frontend
- **React.js 18+** - Modern UI library with hooks
- **React Router v6** - Client-side routing and navigation
- **Bootstrap 5** - Responsive CSS framework
- **Axios** - Promise-based HTTP client for API requests
- **SweetAlert2** - Beautiful, responsive, and customizable alerts
- **Vite** - Fast build tool and development server

### Backend
- **Laravel 11** - Modern PHP framework with elegant syntax
- **MySQL 8.0+** - Relational database management system
- **Composer** - Dependency manager for PHP
- **Laravel Sanctum** - API authentication (optional)

### Development Tools
- **XAMPP** - Local development environment (Apache + MySQL + PHP)
- **Node.js 18+** - JavaScript runtime
- **npm** - Package manager for JavaScript
- **Git** - Version control system

---

## 📋 Prerequisites

Before starting installation, ensure you have the following installed on your system:

### Required Software

| Software | Version | Download Link | Purpose |
|----------|---------|---------------|---------|
| **XAMPP** | Latest | [Download](https://www.apachefriends.org/) | Apache + MySQL + PHP environment |
| **Node.js** | v18+ | [Download](https://nodejs.org/) | JavaScript runtime for React |
| **Composer** | Latest | [Download](https://getcomposer.org/) | PHP dependency manager |
| **Git** | Latest | [Download](https://git-scm.com/) | Version control (Optional) |

### System Requirements
- **OS:** Windows 10/11, macOS, or Linux
- **RAM:** Minimum 4GB (8GB recommended)
- **Disk Space:** At least 2GB free space
- **Browser:** Modern browser (Chrome, Firefox, Edge, Safari)

---

## 🛠️ Installation Guide

Follow these steps carefully to set up the application on your local machine.

---

### Step 1: Clone Repository

```bash
# Using Git
git clone <your-repo-url>
cd SECT-WEB-APP-EXAM-ANOMALY-DETECTION

# OR download ZIP file from GitHub
# Extract the ZIP file
# Navigate to the extracted folder
```

**Note:** If you don't have Git installed, you can download the repository as a ZIP file and extract it.

---

### Step 2: Install Composer

Composer is essential for managing PHP dependencies in Laravel.

#### 2.1 Download Composer

1. Visit: [https://getcomposer.org/download/](https://getcomposer.org/download/)
2. Download **Composer-Setup.exe** (for Windows)
3. For Mac/Linux, follow instructions on the website

#### 2.2 Install Composer (Windows)

1. Run **Composer-Setup.exe**
2. When prompted, select PHP executable path:
   - Common path: `C:\xampp\php\php.exe`
   - Or your custom XAMPP installation path: `F:\XAMP\php\php.exe`
3. Click **Next** through the installation wizard
4. Complete the installation

#### 2.3 Verify Composer Installation

```bash
# Open Command Prompt or PowerShell
composer --version

# Expected output:
# Composer version 2.x.x
```

**Troubleshooting:** If `composer` command is not recognized:
- Close and reopen your terminal/command prompt
- Restart your computer
- Check if Composer is added to system PATH

---

### Step 3: Backend Setup (Laravel)

#### 3.1 Navigate to Project Directory

```bash
# Open terminal/command prompt in project folder
cd SECT-WEB-APP-EXAM-ANOMALY-DETECTION
```

#### 3.2 Create Laravel Backend (If not exists)

```bash
# Only run this if 'backend' folder doesn't exist
composer create-project laravel/laravel backend
```

**Note:** Skip this step if the `backend` folder already exists in your project.

#### 3.3 Install Backend Dependencies

```bash
cd backend
composer install
```

This command will:
- Download all Laravel dependencies
- Install required PHP packages
- Set up vendor directory

**Expected output:**
```
Loading composer repositories with package information
Installing dependencies from lock file
...
Package manifest generated successfully.
78 packages installed successfully
```

#### 3.4 Environment Configuration

```bash
# Windows (Command Prompt)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

# Mac/Linux
cp .env.example .env
```

#### 3.5 Generate Application Key

```bash
php artisan key:generate
```

This creates a unique encryption key for your application.

**Expected output:**
```
Application key set successfully.
```

#### 3.6 Configure Database Connection

Open `backend/.env` file in a text editor and update these lines:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sect_app
DB_USERNAME=root
DB_PASSWORD=
```

**Important Notes:**
- ✅ Ensure NO `#` symbol before these lines (they should NOT be commented out)
- ✅ `DB_PASSWORD=` should be empty (no password for XAMPP default)
- ✅ `DB_DATABASE=sect_app` must match your database name

#### 3.7 Start XAMPP Services

1. Open **XAMPP Control Panel**
2. Click **Start** next to **Apache**
3. Click **Start** next to **MySQL**
4. Both should show green "Running" status

#### 3.8 Create Database

1. Open browser and navigate to: `http://localhost/phpmyadmin`
2. Click **"New"** in the left sidebar
3. Enter database name: **sect_app**
4. Select collation: **utf8mb4_unicode_ci** (default is fine)
5. Click **"Create"**

#### 3.9 Clear Laravel Cache

```bash
# Clear configuration cache
php artisan config:clear

# Clear application cache
php artisan cache:clear

# Clear route cache
php artisan route:clear
```

#### 3.10 Run Database Migrations

```bash
# Run migrations to create tables
php artisan migrate:fresh
```

**Expected output:**
```
Dropping all tables .................................. 35ms DONE
Migration table created successfully.
Running migrations.

2014_10_12_000000_create_users_table .................. 50ms DONE
2014_10_12_100000_create_password_reset_tokens_table .. 25ms DONE
2019_08_19_000000_create_failed_jobs_table ............ 30ms DONE
...
```

#### 3.11 Verify Tables Created

1. Go back to phpMyAdmin: `http://localhost/phpmyadmin`
2. Click on **sect_app** database
3. You should see these tables:
   - ✅ `users`
   - ✅ `password_reset_tokens`
   - ✅ `failed_jobs`
   - ✅ `cache`
   - ✅ `cache_locks`
   - ✅ `jobs`
   - ✅ `job_batches`
   - ✅ `sessions`
   - ✅ `migrations`

---

### Step 4: Frontend Setup (React)

#### 4.1 Navigate to Project Root

```bash
# If you're in backend folder, go back to project root
cd ..

# Verify you're in the correct directory
# You should see: package.json, src/, backend/, etc.
```

#### 4.2 Install Node.js Dependencies

```bash
# Install all dependencies from package.json
npm install
```

This command installs:
- React and React DOM
- React Router
- Vite
- ESLint
- And other core dependencies

**Expected output:**
```
added 250 packages, and audited 251 packages in 45s

50 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

**Time required:** 1-3 minutes depending on internet speed

#### 4.3 Install Axios (HTTP Client)

Axios is used for making API requests from React to Laravel backend.

```bash
npm install axios
```

**What is Axios?**
- Promise-based HTTP client
- Handles request/response interceptors
- Automatic JSON transformation
- Better error handling than fetch API

**Expected output:**
```
added 5 packages in 8s
```

**Verification:**
```bash
# Check package.json - you should see:
# "axios": "^1.x.x"
```

#### 4.4 Install SweetAlert2 (Beautiful Alerts)

SweetAlert2 provides beautiful, responsive, and customizable popup alerts.

```bash
npm install sweetalert2
```

**What is SweetAlert2?**
- Beautiful modal popups
- Replaces default JavaScript alerts
- Fully customizable
- Promise-based
- Responsive design

**Expected output:**
```
added 1 package in 5s
```

**Verification:**
```bash
# Check package.json - you should see:
# "sweetalert2": "^11.x.x"
```

#### 4.5 Install Additional Dependencies (Optional)

If your project requires additional packages:

```bash
# React Icons (if needed)
npm install react-icons

# Date manipulation (if needed)
npm install date-fns

# Form validation (if needed)
npm install react-hook-form

# State management (if needed)
npm install zustand
```

#### 4.6 Verify All Installations

```bash
# Check installed packages
npm list --depth=0
```

**Expected to see:**
```
├── axios@1.x.x
├── bootstrap@5.x.x
├── react@18.x.x
├── react-dom@18.x.x
├── react-router-dom@6.x.x
├── sweetalert2@11.x.x
├── vite@5.x.x
└── ... (other packages)
```

#### 4.7 Configure API Base URL

Check `src/api.js` to ensure proper backend URL:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Laravel API URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

---

## ▶️ Running the Application

You need **TWO SEPARATE TERMINALS** running simultaneously for the application to work.

### Terminal 1: Laravel Backend Server

```bash
# Navigate to backend folder
cd backend

# Start Laravel development server
php artisan serve
```

**Expected output:**
```
INFO  Server running on [http://127.0.0.1:8000].

Press Ctrl+C to stop the server
```

**Server runs at:** `http://localhost:8000`

**Available endpoints:**
- API: `http://localhost:8000/api`
- Health check: `http://localhost:8000/api/health`

### Terminal 2: React Development Server

```bash
# Open a NEW terminal
# Navigate to project root (NOT backend folder)
cd SECT-WEB-APP-EXAM-ANOMALY-DETECTION

# Start Vite development server
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**Application runs at:** `http://localhost:5173`

### Verify Both Servers Are Running

1. **Backend test:** Open `http://localhost:8000` in browser
   - Should see Laravel welcome page
2. **Frontend test:** Open `http://localhost:5173` in browser
   - Should see your React application

### Stopping the Servers

- Press **Ctrl + C** in each terminal to stop the servers
- Close the terminals when done

---

## 📁 Project Structure

```
SECT-WEB-APP-EXAM-ANOMALY-DETECTION/
│
├── backend/                              # Laravel Backend
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── AuthController.php    # Authentication logic
│   │   │   └── Middleware/
│   │   │       └── RoleMiddleware.php    # Role-based access control
│   │   └── Models/
│   │       └── User.php                  # User model with role
│   │
│   ├── config/
│   │   ├── cors.php                      # CORS configuration
│   │   ├── database.php                  # Database configuration
│   │   └── auth.php                      # Authentication configuration
│   │
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 2014_10_12_000000_create_users_table.php
│   │   │   └── ...                       # Other migration files
│   │   └── seeders/
│   │       └── DatabaseSeeder.php        # Database seeders
│   │
│   ├── routes/
│   │   ├── api.php                       # API routes
│   │   └── web.php                       # Web routes
│   │
│   ├── .env                              # Environment variables
│   ├── .env.example                      # Environment template
│   ├── composer.json                     # PHP dependencies
│   └── artisan                           # Laravel CLI
│
├── src/                                  # React Frontend
│   ├── components/
│   │   ├── LoginPage.jsx                 # Login component
│   │   ├── RegisterPage.jsx              # Registration component
│   │   └── Navbar.jsx                    # Navigation bar
│   │
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminPage.jsx             # Admin dashboard
│   │   │   └── UserManagement.jsx        # User management
│   │   │
│   │   ├── instructor/
│   │   │   ├── Homepage.jsx              # Instructor dashboard
│   │   │   ├── ExamPage.jsx              # Exam management
│   │   │   ├── StudentsPage.jsx          # Student list
│   │   │   ├── ReportsPage.jsx           # Reports & analytics
│   │   │   ├── AlertsPage.jsx            # Anomaly alerts
│   │   │   ├── ProfilePage.jsx           # Instructor profile
│   │   │   └── AccountSettings.jsx       # Account settings
│   │   │
│   │   └── student/
│   │       ├── Dashboard.jsx             # Student dashboard
│   │       ├── ExamsList.jsx             # Available exams
│   │       └── Results.jsx               # Exam results
│   │
│   ├── utils/
│   │   ├── auth.js                       # Authentication utilities
│   │   └── validation.js                 # Form validation
│   │
│   ├── api.js                            # Axios API configuration
│   ├── App.jsx                           # Main app component
│   ├── main.jsx                          # App entry point
│   └── index.css                         # Global styles
│
├── public/                               # Static assets
│   ├── images/
│   └── favicon.ico
│
├── node_modules/                         # Node.js dependencies (auto-generated)
├── vendor/                               # PHP dependencies (auto-generated)
│
├── .gitignore                            # Git ignore rules
├── package.json                          # Frontend dependencies
├── package-lock.json                     # Lock file for npm
├── vite.config.js                        # Vite configuration
└── README.md                             # This file
```

---

## 🔐 User Roles & Routes

### Admin Role

**Access Level:** Full system control and user management

**Routes:**
- `/admin` - Admin dashboard
- `/admin/users` - User management (CRUD operations)
- `/admin/analytics` - System-wide analytics
- `/admin/settings` - Global system settings

**Permissions:**
- ✅ Create/Edit/Delete all users
- ✅ View all exams and results
- ✅ Access system logs
- ✅ Configure system settings
- ✅ Generate system reports

---

### Instructor Role

**Access Level:** Exam management and student monitoring

**Routes:**
- `/instructor` - Instructor dashboard
- `/instructor/exams` - Create and manage exams
- `/instructor/students` - View student list and performance
- `/instructor/reports` - Generate exam reports
- `/instructor/alerts` - View anomaly alerts
- `/instructor/profile` - View/edit instructor profile
- `/instructor/account-settings` - Account settings

**Permissions:**
- ✅ Create/Edit/Delete own exams
- ✅ View students assigned to courses
- ✅ Monitor exam sessions
- ✅ View anomaly reports
- ✅ Generate exam analytics
- ❌ Cannot manage other instructors
- ❌ Cannot access system settings

---

### Student Role

**Access Level:** Take exams and view personal results

**Routes:**
- `/student` - Student dashboard
- `/student/exams` - Available exams
- `/student/exam/:id` - Take specific exam
- `/student/results` - View exam results
- `/student/profile` - View/edit student profile

**Permissions:**
- ✅ Take assigned exams
- ✅ View own results
- ✅ View exam schedule
- ✅ Update personal profile
- ❌ Cannot view other students' data
- ❌ Cannot create exams
- ❌ Cannot access system settings

---

## 🧪 Testing the System

### Test 1: User Registration

1. **Navigate to registration page:**
   ```
   http://localhost:5173/register
   ```

2. **Fill in the registration form:**
   - **Name:** `John Doe`
   - **Email:** `john@test.com`
   - **Password:** `12345678`
   - **Confirm Password:** `12345678`
   - **Role:** Select `Student`

3. **Click "Register" button**

4. **Expected behavior:**
   - ✅ Success alert appears: "Registration successful!"
   - ✅ Automatic redirect to `/student` dashboard
   - ✅ User is logged in automatically

5. **Verify in database:**
   - Open phpMyAdmin: `http://localhost/phpmyadmin`
   - Navigate to `sect_app` → `users` table
   - Find newly created user with:
     - ✅ Email: `john@test.com`
     - ✅ Role: `student`
     - ✅ Password: Encrypted (bcrypt hash)

---

### Test 2: User Login

1. **Navigate to login page:**
   ```
   http://localhost:5173/
   ```

2. **Enter credentials:**
   - **Email:** `john@test.com`
   - **Password:** `12345678`

3. **Click "Login" button**

4. **Expected behavior:**
   - ✅ Success alert: "Login successful"
   - ✅ Redirect based on user role:
     - Admin → `/admin`
     - Instructor → `/instructor`
     - Student → `/student`

---

### Test 3: Role-Based Access

**Test Admin Access:**

1. **Create admin user:**
   - Register with role: `Admin`
   - Login with admin credentials

2. **Verify access:**
   - ✅ Can access `/admin` route
   - ✅ Can view all users
   - ✅ Can access system settings

3. **Test restrictions:**
   - ❌ Student cannot access `/admin`
   - ❌ Instructor cannot access `/admin`

**Test Instructor Access:**

1. **Create instructor user:**
   - Register with role: `Instructor`
   - Login with instructor credentials

2. **Verify access:**
   - ✅ Can access `/instructor/*` routes
   - ✅ Can create exams
   - ✅ Can view assigned students

3. **Test restrictions:**
   - ❌ Cannot access `/admin` routes
   - ❌ Cannot view other instructors' exams

**Test Student Access:**

1. **Login as student**

2. **Verify access:**
   - ✅ Can access `/student/*` routes
   - ✅ Can take exams
   - ✅ Can view own results

3. **Test restrictions:**
   - ❌ Cannot access `/admin` routes
   - ❌ Cannot access `/instructor` routes
   - ❌ Cannot view other students' data

---

### Test 4: API Endpoints

**Test using Postman or browser console:**

1. **Test registration API:**
   ```javascript
   fetch('http://localhost:8000/api/register', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       name: 'Test User',
       email: 'test@example.com',
       password: '12345678',
       role: 'student'
     })
   })
   .then(res => res.json())
   .then(data => console.log(data));
   ```

2. **Test login API:**
   ```javascript
   fetch('http://localhost:8000/api/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'test@example.com',
       password: '12345678'
     })
   })
   .then(res => res.json())
   .then(data => console.log(data));
   ```

---

### Test 5: Error Handling

**Test validation errors:**

1. **Register with invalid email:**
   - Email: `notanemail`
   - Should show: "Please provide a valid email"

2. **Register with short password:**
   - Password: `123`
   - Should show: "Password must be at least 8 characters"

3. **Register with existing email:**
   - Use email that already exists
   - Should show: "Email already exists"

4. **Login with wrong password:**
   - Should show: "Invalid credentials"

---

## 🔒 Security Features

This application implements multiple layers of security:

### Authentication & Authorization

✅ **Password Hashing**
- Passwords encrypted using Bcrypt algorithm
- Salt rounds: 12 (Laravel default)
- Impossible to reverse-engineer original password

✅ **Role-Based Access Control (RBAC)**
- Three distinct roles: Admin, Instructor, Student
- Route-level protection
- Component-level permission checks

✅ **Session Management**
- Secure session storage
- Automatic session timeout (configurable)
- Session regeneration on login

### Data Protection

✅ **SQL Injection Protection**
- Laravel Eloquent ORM with parameterized queries
- Automatic escaping of user input
- No raw SQL queries in application code

✅ **Cross-Site Scripting (XSS) Protection**
- Laravel's built-in XSS protection
- Input sanitization
- Output escaping in Blade templates
- React's built-in XSS protection

✅ **Cross-Site Request Forgery (CSRF) Protection**
- CSRF tokens for all state-changing operations
- Laravel's CSRF middleware
- Token validation on every request

### Network Security

✅ **CORS Configuration**
- Restricted origins (localhost only in development)
- Configurable allowed origins for production
- Credentials support enabled

✅ **HTTPS Ready**
- SSL/TLS certificate support
- Secure cookie flags for production
- Force HTTPS in production environment

### Input Validation

✅ **Server-Side Validation**
- Laravel validation rules
- Custom validation messages
- Request validation middleware

✅ **Client-Side Validation**
- Real-time form validation
- Input sanitization before sending
- User-friendly error messages

### Database Security

✅ **Email Uniqueness Constraint**
- Database-level unique index on email
- Prevents duplicate accounts
- Race condition protection

✅ **Encrypted Sensitive Data**
- Passwords: Bcrypt hashed
- API tokens: Encrypted (if using Sanctum)
- Environment variables: Not committed to version control

### Additional Security Measures

✅ **Rate Limiting**
- API request throttling
- Login attempt limiting (configurable)
- Prevents brute force attacks

✅ **Environment Variables**
- Sensitive data in `.env` file
- Not tracked in version control
- Different configs for dev/prod

✅ **Error Handling**
- No sensitive information in error messages
- Stack traces hidden in production
- Logging of security events

✅ **Dependency Management**
- Regular security updates
- Vulnerability scanning
- Composer and npm audit checks

---

## 🗄️ Database Schema

### Users Table

**Table Name:** `users`

| Column       | Type                | Attributes                    | Description                           |
|--------------|---------------------|-------------------------------|---------------------------------------|
| `id`         | BIGINT UNSIGNED     | Primary Key, Auto Increment   | Unique user identifier                |
| `name`       | VARCHAR(255)        | NOT NULL                      | User's full name                      |
| `email`      | VARCHAR(255)        | UNIQUE, NOT NULL              | User's email (for login)              |
| `password`   | VARCHAR(255)        | NOT NULL                      | Bcrypt hashed password                |
| `role`       | VARCHAR(50)         | NOT NULL, Default: 'student'  | User role (admin/instructor/student)  |
| `created_at` | TIMESTAMP           | NULL                          | Account creation timestamp            |
| `updated_at` | TIMESTAMP           | NULL                          | Last update timestamp                 |

**Indexes:**
- Primary Key: `id`
- Unique Index: `email`
- Index: `role` (for faster role-based queries)

**Sample Data:**
```sql
INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES
('Admin User', 'admin@test.com', '$2y$12$encrypted_hash', 'admin', NOW(), NOW()),
('John Teacher', 'teacher@test.com', '$2y$12$encrypted_hash', 'instructor', NOW(), NOW()),
('Jane Student', 'student@test.com', '$2y$12$encrypted_hash', 'student', NOW(), NOW());
```

---

### Future Tables (To be implemented)

**Exams Table**
```sql
exams (
    id,
    title,
    description,
    instructor_id (FK),
    duration_minutes,
    total_points,
    start_time,
    end_time,
    status,
    created_at,
    updated_at
)
```

**Exam Sessions Table**
```sql
exam_sessions (
    id,
    exam_id (FK),
    student_id (FK),
    start_time,
    end_time,
    score,
    status,
    created_at,
    updated_at
)
```

**Anomalies Table**
```sql
anomalies (
    id,
    session_id (FK),
    type,
    description,
    severity,
    detected_at,
    created_at,
    updated_at
)
```

---

## 🌐 API Endpoints

### Base URL
```
Development: http://localhost:8000/api
Production: https://your-domain.com/api
```

---

### Public Endpoints (No Authentication Required)

#### 1. Register New User

**Endpoint:** `POST /api/register`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "12345678",
  "password_confirmation": "12345678",
  "role": "student"
}
```

**Validation Rules:**
- `name`: Required, string, max 255 characters
- `email`: Required, valid email, unique in database
- `password`: Required, min 8 characters
- `password_confirmation`: Required, must match password
- `role`: Required, must be one of: admin, instructor, student

**Success Response (201 Created):**
```json
{
  "message": "Registration successful!",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "created_at": "2024-01-15T10:30:00.000000Z",
    "updated_at": "2024-01-15T10:30:00.000000Z"
  }
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "message": "The email has already been taken.",
  "errors": {
    "email": [
      "The email has already been taken."
    ]
  }
}
```

**Example using Axios:**
```javascript
import api from './api';

const register = async (userData) => {
  try {
    const response = await api.post('/register', userData);
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

---

#### 2. User Login

**Endpoint:** `POST /api/login`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "12345678"
}
```

**Validation Rules:**
- `email`: Required, valid email format
- `password`: Required, min 8 characters

**Success Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials"
}
```

**Example using Axios:**
```javascript
import api from './api';

const login = async (credentials) => {
  try {
    const response = await api.post('/login', credentials);
    
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    // Redirect based on role
    const { role } = response.data.user;
    if (role === 'admin') window.location.href = '/admin';
    else if (role === 'instructor') window.location.href = '/instructor';
    else window.location.href = '/student';
    
  } catch (error) {
    console.error('Login failed:', error.response.data);
  }
};
```

---

### Protected Endpoints (Authentication Required)

**Note:** These endpoints will be implemented with Laravel Sanctum for token-based authentication.

#### 3. Get Current User

**Endpoint:** `GET /api/user`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student"
}
```

---

#### 4. Logout

**Endpoint:** `POST /api/logout`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### Error Responses

**400 Bad Request:**
```json
{
  "message": "Invalid request format"
}
```

**401 Unauthorized:**
```json
{
  "message": "Unauthenticated"
}
```

**403 Forbidden:**
```json
{
  "message": "You do not have permission to access this resource"
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found"
}
```

**422 Unprocessable Entity:**
```json
{
  "message": "The given data was invalid",
  "errors": {
    "field_name": [
      "Validation error message"
    ]
  }
}
```

**500 Internal Server Error:**
```json
{
  "message": "Server error occurred"
}
```

---

## 🐛 Troubleshooting

### Common Issues and Solutions

---

#### Issue 1: "Composer command not found"

**Symptoms:**
```bash
'composer' is not recognized as an internal or external command
```

**Solution:**
1. Close and reopen your terminal/command prompt
2. Restart your computer
3. Verify Composer installation:
   ```bash
   composer --version
   ```
4. If still not working, manually add Composer to PATH:
   - Windows: Add `C:\ProgramData\ComposerSetup\bin` to system PATH
   - Mac/Linux: Add Composer directory to `.bashrc` or `.zshrc`

---

#### Issue 2: "Port 8000 already in use"

**Symptoms:**
```bash
Failed to listen on 127.0.0.1:8000 (reason: Address already in use)
```

**Solution:**

**Option 1: Use different port**
```bash
php artisan serve --port=8001
```
Then update `src/api.js`:
```javascript
baseURL: 'http://localhost:8001/api'
```

**Option 2: Kill process using port 8000**

Windows:
```bash
netstat -ano | findstr :8000
taskkill /PID {PID_NUMBER} /F
```

Mac/Linux:
```bash
lsof -ti:8000 | xargs kill -9
```

---

#### Issue 3: "CORS Policy Error"

**Symptoms:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**

1. **Verify XAMPP Apache is running** (should be green)

2. **Check Laravel CORS configuration:**
   ```bash
   cd backend
   php artisan config:clear
   ```

3. **Verify `backend/config/cors.php`:**
   ```php
   'allowed_origins' => ['http://localhost:5173'],
   'allowed_methods' => ['*'],
   'allowed_headers' => ['*'],
   'supports_credentials' => true,
   ```

4. **Restart Laravel server:**
   ```bash
   php artisan serve
   ```

---

#### Issue 4: "Database connection failed"

**Symptoms:**
```
SQLSTATE[HY000] [2002] No connection could be made
```

**Solution:**

1. **Verify MySQL is running in XAMPP:**
   - Open XAMPP Control Panel
   - MySQL should show green "Running" status

2. **Check `.env` database credentials:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=sect_app
   DB_USERNAME=root
   DB_PASSWORD=
   ```

3. **Verify database exists:**
   - Open phpMyAdmin: `http://localhost/phpmyadmin`
   - Check if `sect_app` database exists

4. **Clear Laravel cache:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

5. **Test database connection:**
   ```bash
   php artisan migrate:status
   ```

---

#### Issue 5: "422 Unprocessable Entity"

**Symptoms:**
- Registration/Login returns 422 error
- Form submission fails

**Solution:**

1. **Open browser console (F12)** to see exact validation errors

2. **Common validation errors:**
   - Email already exists → Use different email
   - Password too short → Min 8 characters
   - Invalid email format → Check email syntax
   - Missing required fields → Fill all fields

3. **Check API request in Network tab:**
   - Open DevTools (F12)
   - Go to Network tab
   - Submit form
   - Click on request to see response details

---

#### Issue 6: "Migration tables not created"

**Symptoms:**
```bash
php artisan migrate:fresh
# No tables visible in phpMyAdmin
```

**Solution:**

1. **Verify you're in backend directory:**
   ```bash
   cd backend
   ```

2. **Clear all caches:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   php artisan view:clear
   ```

3. **Check database configuration:**
   ```bash
   php artisan config:show database
   ```

4. **Run migrations with verbose output:**
   ```bash
   php artisan migrate:fresh --verbose
   ```

5. **If still failing, check migration files:**
   ```bash
   ls database/migrations/
   ```

---

#### Issue 7: "npm install fails"

**Symptoms:**
```bash
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**

1. **Delete node_modules and package-lock.json:**
   ```bash
   rm -rf node_modules
   rm package-lock.json
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

3. **Reinstall with legacy peer deps:**
   ```bash
   npm install --legacy-peer-deps
   ```

4. **If still failing, use specific Node version:**
   - Ensure Node.js v18 or v20 is installed
   - Consider using `nvm` to manage Node versions

---

#### Issue 8: "Email already exists"

**Symptoms:**
- Cannot register with same email twice

**Solution:**

**Option 1: Use different email**

**Option 2: Delete existing user from database**
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Navigate to `sect_app` → `users` table
3. Find user with that email
4. Click "Delete" to remove user

**Option 3: Reset entire database**
```bash
cd backend
php artisan migrate:fresh
```
**Warning:** This deletes ALL data!

---

#### Issue 9: "React app shows blank page"

**Symptoms:**
- `http://localhost:5173` shows blank white page

**Solution:**

1. **Check browser console (F12) for errors**

2. **Common causes:**
   - JavaScript error in component
   - Missing import statement
   - Routing issue

3. **Verify Vite server is running:**
   ```bash
   npm run dev
   ```

4. **Check `src/main.jsx` for errors**

5. **Try rebuilding:**
   ```bash
   rm -rf node_modules
   npm install
   npm run dev
   ```

---

#### Issue 10: "SweetAlert2 not showing"

**Symptoms:**
- Alerts don't appear after actions

**Solution:**

1. **Verify SweetAlert2 is installed:**
   ```bash
   npm list sweetalert2
   ```

2. **Check import statement:**
   ```javascript
   import Swal from 'sweetalert2';
   ```

3. **Test SweetAlert2:**
   ```javascript
   Swal.fire('Test', 'This is a test alert', 'success');
   ```

4. **Reinstall if necessary:**
   ```bash
   npm uninstall sweetalert2
   npm install sweetalert2
   ```

---

### Getting Help

If you encounter issues not listed here:

1. **Check Laravel logs:**
   ```bash
   tail -f backend/storage/logs/laravel.log
   ```

2. **Check browser console (F12)** for frontend errors

3. **Enable debug mode in `.env`:**
   ```env
   APP_DEBUG=true
   ```

4. **Search Laravel documentation:** [https://laravel.com/docs](https://laravel.com/docs)

5. **Search React documentation:** [https://react.dev](https://react.dev)

6. **Open GitHub issue** with error details

---

## 📝 Development Guide

### Adding New Features

---

#### 1. Adding Backend API Routes

**File:** `backend/routes/api.php`

```php
use App\Http\Controllers\ExamController;

// Add new route
Route::post('/exams', [ExamController::class, 'create']);
Route::get('/exams', [ExamController::class, 'index']);
Route::get('/exams/{id}', [ExamController::class, 'show']);
Route::put('/exams/{id}', [ExamController::class, 'update']);
Route::delete('/exams/{id}', [ExamController::class, 'destroy']);
```

---

#### 2. Creating New Controller

```bash
# Create controller
php artisan make:controller ExamController

# Create controller with resource methods
php artisan make:controller ExamController --resource
```

**File:** `backend/app/Http/Controllers/ExamController.php`

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Exam;

class ExamController extends Controller
{
    public function index()
    {
        $exams = Exam::all();
        return response()->json($exams);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'duration' => 'required|integer|min:1',
        ]);

        $exam = Exam::create($validated);
        
        return response()->json([
            'message' => 'Exam created successfully',
            'exam' => $exam
        ], 201);
    }
}
```

---

#### 3. Creating Database Migration

```bash
# Create new migration
php artisan make:migration create_exams_table

# Run migration
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Reset all migrations
php artisan migrate:fresh
```

**File:** `backend/database/migrations/{timestamp}_create_exams_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->integer('duration_minutes');
            $table->foreignId('instructor_id')->constrained('users');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('exams');
    }
};
```

---

#### 4. Creating New Model

```bash
# Create model
php artisan make:model Exam

# Create model with migration
php artisan make:model Exam -m

# Create model with migration and controller
php artisan make:model Exam -mc
```

**File:** `backend/app/Models/Exam.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    protected $fillable = [
        'title',
        'description',
        'duration_minutes',
        'instructor_id'
    ];

    // Relationship
    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function sessions()
    {
        return $this->hasMany(ExamSession::class);
    }
}
```

---

#### 5. Adding Frontend Routes

**File:** `src/main.jsx`

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ExamsList from './pages/instructor/ExamsList';
import CreateExam from './pages/instructor/CreateExam';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Existing routes */}
        <Route path="/instructor/exams" element={<ExamsList />} />
        <Route path="/instructor/exams/create" element={<CreateExam />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

#### 6. Creating New React Component

**File:** `src/components/ExamCard.jsx`

```jsx
import React from 'react';
import './ExamCard.css';

const ExamCard = ({ exam, onEdit, onDelete }) => {
  return (
    <div className="exam-card">
      <h3>{exam.title}</h3>
      <p>{exam.description}</p>
      <div className="exam-actions">
        <button onClick={() => onEdit(exam.id)} className="btn-edit">
          Edit
        </button>
        <button onClick={() => onDelete(exam.id)} className="btn-delete">
          Delete
        </button>
      </div>
    </div>
  );
};

export default ExamCard;
```

---

#### 7. Making API Calls with Axios

**File:** `src/pages/instructor/ExamsList.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import api from '../../api';
import Swal from 'sweetalert2';
import ExamCard from '../../components/ExamCard';

const ExamsList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/exams');
      setExams(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exams:', error);
      Swal.fire('Error', 'Failed to load exams', 'error');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/exams/${id}`);
        setExams(exams.filter(exam => exam.id !== id));
        Swal.fire('Deleted!', 'Exam has been deleted', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to delete exam', 'error');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading exams...</div>;
  }

  return (
    <div className="exams-list">
      <h1>My Exams</h1>
      <div className="exams-grid">
        {exams.map(exam => (
          <ExamCard
            key={exam.id}
            exam={exam}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default ExamsList;
```

---

### Code Style Guidelines

#### PHP/Laravel

- Follow PSR-12 coding standards
- Use meaningful variable and function names
- Add comments for complex logic
- Keep controllers thin, use services for business logic

```php
// Good
public function createExam(Request $request)
{
    $examData = $this->validateExamData($request);
    $exam = $this->examService->create($examData);
    return response()->json($exam, 201);
}

// Bad
public function create(Request $r)
{
    $e = Exam::create($r->all());
    return $e;
}
```

#### JavaScript/React

- Use functional components with hooks
- Follow ESLint rules
- Use destructuring for props
- Keep components small and focused

```jsx
// Good
const ExamCard = ({ title, description, onEdit }) => {
  const handleEdit = () => {
    onEdit(title);
  };

  return (
    <div className="exam-card">
      <h3>{title}</h3>
      <p>{description}</p>
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
};

// Bad
function ExamCard(props) {
  return <div>{props.title}{props.description}</div>
}
```

---

### Useful Laravel Commands

```bash
# Cache management
php artisan config:clear     # Clear config cache
php artisan cache:clear      # Clear application cache
php artisan route:clear      # Clear route cache
php artisan view:clear       # Clear view cache

# Database
php artisan migrate          # Run new migrations
php artisan migrate:fresh    # Drop all tables and re-migrate
php artisan migrate:rollback # Rollback last migration
php artisan db:seed          # Run database seeders

# Make commands
php artisan make:controller  # Create controller
php artisan make:model       # Create model
php artisan make:migration   # Create migration
php artisan make:middleware  # Create middleware
php artisan make:request     # Create form request

# Other
php artisan route:list       # List all routes
php artisan tinker           # Laravel REPL
php artisan serve            # Start dev server
```

---

## 🚀 Deployment

### Production Checklist

Before deploying to production:

#### Backend (Laravel)

- [ ] Set `APP_ENV=production` in `.env`
- [ ] Set `APP_DEBUG=false` in `.env`
- [ ] Generate new `APP_KEY` on production server
- [ ] Configure production database credentials
- [ ] Set up SSL certificate (HTTPS)
- [ ] Configure proper CORS origins
- [ ] Run `php artisan config:cache`
- [ ] Run `php artisan route:cache`
- [ ] Run `php artisan view:cache`
- [ ] Set up automatic backups
- [ ] Configure error logging
- [ ] Set up monitoring (Sentry, etc.)

#### Frontend (React)

- [ ] Update API base URL to production
- [ ] Build production bundle: `npm run build`
- [ ] Test build locally: `npm run preview`
- [ ] Deploy `dist/` folder to web server
- [ ] Configure web server for SPA routing
- [ ] Set up CDN for static assets
- [ ] Enable Gzip compression
- [ ] Configure caching headers

---

### Deployment Platforms

**Recommended hosting options:**

- **Frontend:** Vercel, Netlify, GitHub Pages
- **Backend:** DigitalOcean, AWS, Heroku, Laravel Forge
- **Database:** MySQL on hosting provider or managed service

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 SECT Web App Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👨‍💻 Authors & Contributors

### Development Team

- **JC** - Instructor Pages & Backend Integration
- **Esita** - Student Pages & Exam Interface
- **Guban** - Admin Pages & User Management

### Contributors

Thank you to all contributors who have helped make this project better!

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/SECT-WEB-APP-EXAM-ANOMALY-DETECTION.git
   ```

2. **Create your feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow coding standards
   - Add tests if applicable

4. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

5. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```

6. **Open a Pull Request**
   - Describe your changes
   - Reference any related issues

### Contribution Guidelines

- Follow the existing code style
- Write clear commit messages
- Update documentation as needed
- Test your changes thoroughly
- Be respectful in discussions

---

## 📞 Support & Contact

### Getting Help

**For Issues:**
- Check the [Troubleshooting](#-troubleshooting) section
- Search existing GitHub issues
- Open a new issue with detailed description

**For Questions:**
- Contact the development team
- Check Laravel documentation: [https://laravel.com/docs](https://laravel.com/docs)
- Check React documentation: [https://react.dev](https://react.dev)

### Useful Resources

- **Laravel Documentation:** [https://laravel.com/docs](https://laravel.com/docs)
- **React Documentation:** [https://react.dev](https://react.dev)
- **Bootstrap Documentation:** [https://getbootstrap.com/docs](https://getbootstrap.com/docs)
- **Axios Documentation:** [https://axios-http.com/docs](https://axios-http.com/docs)
- **SweetAlert2 Documentation:** [https://sweetalert2.github.io](https://sweetalert2.github.io)

---

## ✅ Quick Start Checklist

Before running the application, ensure all these are complete:

### Installation

- [ ] XAMPP installed
- [ ] Node.js installed (v18+)
- [ ] Composer installed
- [ ] Git installed (optional)

### Backend Setup

- [ ] Navigated to project directory
- [ ] Composer dependencies installed (`composer install`)
- [ ] `.env` file created from `.env.example`
- [ ] Application key generated (`php artisan key:generate`)
- [ ] Database credentials configured in `.env`
- [ ] XAMPP MySQL service started (green status)
- [ ] Database `sect_app` created in phpMyAdmin
- [ ] Laravel cache cleared
- [ ] Migrations run successfully (`php artisan migrate:fresh`)
- [ ] Tables visible in phpMyAdmin

### Frontend Setup

- [ ] Node.js dependencies installed (`npm install`)
- [ ] Axios installed (`npm install axios`)
- [ ] SweetAlert2 installed (`npm install sweetalert2`)
- [ ] API base URL configured in `src/api.js`

### Running

- [ ] Laravel server running (`php artisan serve`) on port 8000
- [ ] React dev server running (`npm run dev`) on port 5173
- [ ] Both terminals open and servers active

### Testing

- [ ] Backend accessible at `http://localhost:8000`
- [ ] Frontend accessible at `http://localhost:5173`
- [ ] Registration working
- [ ] Login working
- [ ] Role-based routing working

---

## 🎉 Success!

If all checklist items are complete:

✅ **Backend API:** `http://localhost:8000`  
✅ **Frontend App:** `http://localhost:5173`  
✅ **phpMyAdmin:** `http://localhost/phpmyadmin`  
✅ **Database:** `sect_app`

**You're ready to develop! Happy Coding! 🚀**

---

## 📊 Project Status

**Current Version:** 1.0.0  
**Status:** In Active Development  
**Last Updated:** February 2026

### Roadmap

- [x] User authentication system
- [x] Role-based access control
- [ ] Exam creation and management
- [ ] Real-time anomaly detection
- [ ] Reporting dashboard
- [ ] Email notifications
- [ ] Exam analytics
- [ ] Mobile app

---

## 🙏 Acknowledgments

- Laravel Framework by Taylor Otwell
- React.js by Facebook/Meta
- Bootstrap team for the CSS framework
- All open-source contributors

---

**Made with ❤️ by the SECT Team**

*For more information, visit our [GitHub repository](https://github.com/your-repo)*

---

**Last Updated:** February 15, 2026
