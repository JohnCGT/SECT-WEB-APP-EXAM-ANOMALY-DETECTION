// Import tools
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import pages

// Login and Register
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";

// Instructors Page
import Homepage from "./pages/instructor/Homepage";
import ExamPage from "./pages/instructor/ExamPage";
import ProfilePage from "./pages/instructor/ProfilePage";
import AccountSettings from "./pages/instructor/AccountSettings";
import Students from "./pages/instructor/Students";
import Reports from "./pages/instructor/Reports";
import Alerts from "./pages/instructor/Alerts";

// Students Page
import Dashboard from "./pages/student/Dashboard";
import SubjectPage from "./pages/student/SubjectPage";
import TasksPage from "./pages/student/TasksPage";
import GradesPage from "./pages/student/GradesPage";
import StudentAccountSettings from "./pages/student/StudentAccountSettings";

// Admin Page
import AdminPage from "./pages/admin/AdminPage";
import UserManagement from "./pages/admin/UserManagement";
import ExamManagement from "./pages/admin/ExamManagement";
import AnomalyReports from "./pages/admin/AnomalyReports";
import SystemLogs from "./pages/admin/SystemLogs";

// Import bootstrap
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import 'bootstrap-icons/font/bootstrap-icons.css';

// Routes
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* Login and Register */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Instructor Page - JC */}
        <Route path="/instructor" element={<Homepage />} />
        <Route path="/instructor/exams" element={<ExamPage />} />
        <Route path="/instructor/profile" element={<ProfilePage />} />
        <Route path="/instructor/account-settings" element={<AccountSettings />} />
        <Route path="/instructor/alerts" element={<Alerts />} />
        <Route path="/instructor/reports" element={<Reports />} />
        <Route path="/instructor/students" element={<Students />} />

        {/* Student Page - Esita */}
        <Route path="/student" element={<Dashboard />} />
        <Route path="/student/subjects" element={<SubjectPage />} />
        <Route path="/student/tasks" element={<TasksPage />} />
        <Route path="/student/grades" element={<GradesPage />} />
        <Route path="/student/account-settings" element={<StudentAccountSettings />} />        
        
        {/* Admin Page - Guban */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/exams" element={<ExamManagement />} />
        <Route path="/admin/anomalies" element={<AnomalyReports />} />
        <Route path="/admin/logs" element={<SystemLogs />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);