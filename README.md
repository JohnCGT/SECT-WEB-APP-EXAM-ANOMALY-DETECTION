# Exam Anomaly Detection System

A full-stack web application for exam anomaly detection with role-based authentication (Admin, Instructor, Student).

## 🚀 Tech Stack

### Frontend
- **React.js** - UI Library
- **React Router** - Navigation
- **Bootstrap 5** - Styling
- **Axios** - HTTP Client
- **SweetAlert2** - Beautiful Alerts
- **Vite** - Build Tool

### Backend
- **Laravel 11** - PHP Framework
- **MySQL** - Database
- **Composer** - PHP Dependency Manager

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **XAMPP** (Apache + MySQL) - [Download](https://www.apachefriends.org/)
- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **Composer** (PHP Package Manager) - [Download](https://getcomposer.org/)
- **Git** (Optional) - [Download](https://git-scm.com/)

---

## 🛠️ Installation Guide

### Step 1: Clone Repository
```bash
git clone <your-repo-url>
cd SECT-WEB-APP-EXAM-ANOMALY-DETECTION
```

Or download and extract the ZIP file.

---

### Step 2: Install Composer

1. Download Composer from: `https://getcomposer.org/download/`
2. Run `Composer-Setup.exe`
3. Select PHP path: `F:\XAMP\php\php.exe` (or your XAMPP PHP location)
4. Complete installation
5. Verify installation:
```bash
composer --version
```

---

### Step 3: Backend Setup (Laravel)
```bash
composer create-project laravel/laravel backend
```

#### 3.1 Install Dependencies
```bash
cd backend
composer install
```

#### 3.2 Environment Configuration
```bash
# Copy .env.example to .env
copy .env.example .env

# Generate application key
php artisan key:generate
```

#### 3.3 Configure Database

Open `backend/.env` and update these lines:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sect_app
DB_USERNAME=root
DB_PASSWORD=
```

**Important:** Make sure these lines are NOT commented out (no `#` symbol)!

#### 3.4 Create Database

1. Start **XAMPP Control Panel**
2. Start **Apache** and **MySQL**
3. Open phpMyAdmin: `http://localhost/phpmyadmin`
4. Click **"New"** → Database name: `sect_app` → Click **"Create"**

#### 3.5 Run Migrations
```bash
# Clear cache
php artisan config:clear
php artisan cache:clear

# Run migrations to create tables
php artisan migrate:fresh
```

You should see tables created:
- users
- cache
- jobs
- sessions
- password_reset_tokens
- migrations

---

### Step 4: Frontend Setup (React)

#### 4.1 Install Dependencies
```bash
# Go back to project root
cd ..

# Install npm packages
npm install
```

#### 4.2 Install Additional Packages
```bash
# Install Axios for API calls
npm install axios

# Install SweetAlert2 for beautiful alerts
npm install sweetalert2
```

---

## ▶️ Running the Application

You need **TWO** terminal windows running simultaneously:

### Terminal 1: Backend (Laravel)
```bash
cd backend
php artisan serve
```

Server runs at: `http://localhost:8000`

### Terminal 2: Frontend (React)
```bash
# In project root
npm run dev
```

Application runs at: `http://localhost:5173`

---

## 📁 Project Structure
```
SECT-WEB-APP-EXAM-ANOMALY-DETECTION/
│
├── backend/                          # Laravel Backend
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   │       └── AuthController.php    # Authentication logic
│   │   └── Models/
│   │       └── User.php                  # User model
│   ├── config/
│   │   └── cors.php                      # CORS configuration
│   ├── database/
│   │   └── migrations/
│   │       └── 0001_01_01_000000_create_users_table.php
│   ├── routes/
│   │   └── api.php                       # API routes
│   └── .env                              # Environment configuration
│
├── src/                              # React Frontend
│   ├── components/
│   │   ├── LoginPage.jsx                 # Login page
│   │   └── RegisterPage.jsx              # Registration page
│   ├── pages/
│   │   ├── admin/
│   │   │   └── AdminPage.jsx
│   │   ├── instructor/
│   │   │   ├── Homepage.jsx
│   │   │   ├── ExamPage.jsx
│   │   │   └── ...
│   │   └── student/
│   │       └── Dashboard.jsx
│   ├── api.js                            # Axios API configuration
│   └── main.jsx                          # App entry point
│
├── package.json                      # Frontend dependencies
└── README.md                         # This file
```

---

## 🔐 User Roles & Routes

### Admin
- **Route:** `/admin`
- **Access:** Full system control

### Instructor
- **Routes:** 
  - `/instructor` - Dashboard
  - `/instructor/exams` - Exam management
  - `/instructor/students` - Student list
  - `/instructor/reports` - Reports
  - `/instructor/alerts` - Alerts
  - `/instructor/profile` - Profile
  - `/instructor/account-settings` - Settings

### Student
- **Route:** `/student`
- **Access:** Take exams and view results

---

## 🧪 Testing the System

### Test Registration

1. Navigate to: `http://localhost:5173/register`
2. Fill in the form:
   - **Name:** John Doe
   - **Email:** john@test.com
   - **Password:** 12345678
   - **Confirm Password:** 12345678
   - **Role:** Student
3. Click **"Register"**
4. Should show success alert and redirect to `/student`

### Test Login

1. Navigate to: `http://localhost:5173/`
2. Login with:
   - **Email:** john@test.com
   - **Password:** 12345678
3. Should redirect based on role

### Verify Database

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Click `sect_app` database
3. Click `users` table
4. You should see registered users with encrypted passwords

---

## 🔒 Security Features

✅ **Password Hashing** - Bcrypt encryption  
✅ **SQL Injection Protection** - Eloquent ORM  
✅ **XSS Protection** - Laravel built-in  
✅ **CORS Configuration** - Restricted origins  
✅ **Input Validation** - Server-side validation  
✅ **Email Uniqueness** - Database constraint  
✅ **Role-Based Access Control** - Route protection  

---

## 🗄️ Database Schema

### Users Table

| Column       | Type      | Description                    |
|--------------|-----------|--------------------------------|
| id           | BIGINT    | Primary key (auto-increment)   |
| name         | VARCHAR   | User's full name               |
| email        | VARCHAR   | Email (unique)                 |
| password     | VARCHAR   | Hashed password (bcrypt)       |
| role         | VARCHAR   | User role (admin/instructor/student) |
| created_at   | TIMESTAMP | Account creation date          |
| updated_at   | TIMESTAMP | Last update date               |

---

## 🌐 API Endpoints

### Public Endpoints

#### Register User
```http
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "12345678",
  "role": "student"
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful!",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

#### Login User
```http
POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "12345678"
}
```

**Response (200 OK):**
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

---

## 🐛 Troubleshooting

### Issue: Composer not found
**Solution:** Restart PowerShell/Terminal after installing Composer

### Issue: Port 8000 already in use
**Solution:**
```bash
php artisan serve --port=8001
```
Then update `src/api.js` baseURL to `http://localhost:8001/api`

### Issue: CORS error
**Solution:**
- Verify XAMPP Apache is running
- Check `backend/config/cors.php` configuration
- Run `php artisan config:clear`

### Issue: Database connection failed
**Solution:**
- Verify XAMPP MySQL is running (green in control panel)
- Check `backend/.env` database credentials
- Run `php artisan config:clear`

### Issue: 422 Validation Error
**Solution:** Open browser console (F12) to see exact validation error

### Issue: Tables not created
**Solution:**
```bash
cd backend
php artisan migrate:fresh
```

### Issue: Email already exists
**Solution:** Use a different email or delete existing user from phpMyAdmin

---

## 📝 Development Notes

### Adding New Routes

**Backend (`routes/api.php`):**
```php
Route::post('/new-endpoint', [YourController::class, 'method']);
```

**Frontend (`src/main.jsx`):**
```jsx
<Route path="/new-page" element={<NewPage />} />
```

### Creating New Migration
```bash
php artisan make:migration create_table_name
```

### Creating New Controller
```bash
php artisan make:controller ControllerName
```

### Clearing Laravel Cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

---

## 🔄 Updating the Application

### Update Backend Dependencies
```bash
cd backend
composer update
```

### Update Frontend Dependencies
```bash
npm update
```

---

## 📦 Environment Variables

### Backend (.env)
```env
# Application
APP_NAME=Laravel
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sect_app
DB_USERNAME=root
DB_PASSWORD=

# Session
SESSION_DRIVER=database
SESSION_LIFETIME=120
```

### Frontend (Vite)

Configure in `src/api.js`:
```javascript
baseURL: 'http://localhost:8000/api'
```

---

## 👥 Default Test Accounts

After installation, you can create these test accounts:

| Role       | Email               | Password  |
|------------|---------------------|-----------|
| Admin      | admin@test.com      | 12345678  |
| Instructor | teacher@test.com    | 12345678  |
| Student    | student@test.com    | 12345678  |

---

## 🚀 Deployment (Production)

### Backend (Laravel)

1. Set `APP_ENV=production` in `.env`
2. Set `APP_DEBUG=false` in `.env`
3. Run `php artisan config:cache`
4. Run `php artisan route:cache`
5. Configure proper database credentials
6. Set up SSL certificate

### Frontend (React)

1. Build production files:
```bash
npm run build
```
2. Deploy `dist/` folder to web server
3. Configure web server for SPA routing

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Authors

- **JC** - Instructor Pages
- **Esita** - Student Pages
- **Guban** - Admin Pages

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For issues and questions:
- Check the **Troubleshooting** section above
- Open an issue on GitHub
- Contact the development team

---

## ✅ Quick Start Checklist

Before running the application, ensure:

- [ ] XAMPP installed and MySQL running
- [ ] Composer installed
- [ ] Node.js installed
- [ ] Database `sect_app` created in phpMyAdmin
- [ ] Backend `.env` configured correctly
- [ ] Backend dependencies installed (`composer install`)
- [ ] Migrations run successfully (`php artisan migrate:fresh`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Laravel server running (`php artisan serve`)
- [ ] React server running (`npm run dev`)

---

## 🎉 Success!

If everything is set up correctly:
- Backend API: `http://localhost:8000`
- Frontend App: `http://localhost:5173`
- phpMyAdmin: `http://localhost/phpmyadmin`

**Happy Coding! 🚀**