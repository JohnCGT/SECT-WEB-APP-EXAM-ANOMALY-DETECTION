import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";

// Instructor Pages
import Homepage from "./pages/instructor/Homepage";
import CoursesPage from "./pages/instructor/CoursesPage";
import ExamPage from "./pages/instructor/ExamPage";
import ProfilePage from "./pages/instructor/ProfilePage";
import AccountSettings from "./pages/instructor/AccountSettings";
import Students from "./pages/instructor/Students";
import Reports from "./pages/instructor/Reports";
import Alerts from "./pages/instructor/Alerts";
import ExamDetail from "./pages/instructor/ExamDetail";
import CourseDetail from "./pages/instructor/CourseDetail";
import ExamEdit from "./pages/instructor/ExamEdit";
import InstructorSupport from "./pages/instructor/InstructorSupport";

// Student Pages
import Dashboard from "./pages/student/Dashboard";
import SubjectPage from "./pages/student/SubjectPage";
import ExamsPage from "./pages/student/ExamsPage";
import GradesPage from "./pages/student/GradesPage";
import StudentAccountSettings from "./pages/student/StudentAccountSettings";
import StudentProfile from "./pages/student/StudentProfile";
import CourseExamsPage from "./pages/student/CourseExamPage";
import TakeExamPage from "./pages/student/TakeExamPage";
import ExamResultsPage from "./pages/student/ExamResultsPage";
import TypingTestPage from "./pages/student/TypingTestPage";
import StudentSupport from "./pages/student/StudentSupport";

// Admin Pages
import AdminPage from "./pages/admin/AdminPage";
import AdminProfile from "./pages/admin/AdminProfile";
import UserManagement from "./pages/admin/UserManagement";
import AdminCourseManagement from "./pages/admin/AdminCourseManagement";
import ExamManagement from "./pages/admin/ExamManagement";
import ActivityLogs from "./pages/admin/ActivityLogs";
import SupportTickets from "./pages/admin/SupportTickets";

// Bootstrap
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* ── Public: Student (default) ─────────────────────────────────────── */}
        <Route path="/"         element={<LoginPage role="student" />} />
        <Route path="/register" element={<RegisterPage role="student" />} />

        {/* ── Public: Instructor ───────────────────────────────────────────── */}
        <Route path="/instructor/login"    element={<LoginPage role="instructor" />} />
        <Route path="/instructor/register" element={<RegisterPage role="instructor" />} />

        {/* ── Public: Admin ────────────────────────────────────────────────── */}
        <Route path="/admin/login" element={<LoginPage role="admin" />} />
        {/* No public register for admin */}

        {/* ── Instructor ───────────────────────────────────────────────────── */}
        <Route
          path="/instructor"
          element={<ProtectedRoute role="instructor"><Homepage /></ProtectedRoute>}
        />
        <Route
          path="/instructor/courses"
          element={<ProtectedRoute role="instructor"><CoursesPage /></ProtectedRoute>}
        />
        <Route
          path="/instructor/courses/:id"
          element={<ProtectedRoute role="instructor"><CourseDetail /></ProtectedRoute>}
        />
        <Route
          path="/instructor/exams"
          element={<ProtectedRoute role="instructor"><ExamPage /></ProtectedRoute>}
        />
        <Route
          path="/instructor/exams/:id"
          element={<ProtectedRoute role="instructor"><ExamDetail /></ProtectedRoute>}
        />
        <Route
          path="/instructor/exams/:id/edit"
          element={<ProtectedRoute role="instructor"><ExamEdit /></ProtectedRoute>}
        />
        <Route
          path="/instructor/profile"
          element={<ProtectedRoute role="instructor"><ProfilePage /></ProtectedRoute>}
        />
        <Route
          path="/instructor/account-settings"
          element={<ProtectedRoute role="instructor"><AccountSettings /></ProtectedRoute>}
        />
        <Route
          path="/instructor/alerts"
          element={<ProtectedRoute role="instructor"><Alerts /></ProtectedRoute>}
        />
        <Route
          path="/instructor/reports"
          element={<ProtectedRoute role="instructor"><Reports /></ProtectedRoute>}
        />
        <Route
          path="/instructor/students"
          element={<ProtectedRoute role="instructor"><Students /></ProtectedRoute>}
        />
        <Route
          path="/instructor/support"
          element={<ProtectedRoute role="instructor"><InstructorSupport /></ProtectedRoute>}
        />

        {/* ── Student ──────────────────────────────────────────────────────── */}
        <Route
          path="/student"
          element={<ProtectedRoute role="student"><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/student/subjects"
          element={<ProtectedRoute role="student"><SubjectPage /></ProtectedRoute>}
        />
        <Route
          path="/student/exams"
          element={<ProtectedRoute role="student"><ExamsPage /></ProtectedRoute>}
        />
        <Route
          path="/student/grades"
          element={<ProtectedRoute role="student"><GradesPage /></ProtectedRoute>}
        />
        <Route
          path="/student/account-settings"
          element={<ProtectedRoute role="student"><StudentAccountSettings /></ProtectedRoute>}
        />
        <Route
          path="/student/profile"
          element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>}
        />
        <Route
          path="/student/courses/:courseId/exams"
          element={<ProtectedRoute role="student"><CourseExamsPage /></ProtectedRoute>}
        />
        <Route
          path="/student/exams/:examId/take"
          element={<ProtectedRoute role="student"><TakeExamPage /></ProtectedRoute>}
        />
        <Route
          path="/student/exams/:examId/results"
          element={<ProtectedRoute role="student"><ExamResultsPage /></ProtectedRoute>}
        />
        <Route
          path="/student/typing-test"
          element={<ProtectedRoute role="student"><TypingTestPage /></ProtectedRoute>}
        />
        <Route
          path="/student/support"
          element={<ProtectedRoute role="student"><StudentSupport /></ProtectedRoute>}
        />

        {/* ── Admin ────────────────────────────────────────────────────────── */}
        <Route
          path="/admin"
          element={<ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/profile"
          element={<ProtectedRoute role="admin"><AdminProfile /></ProtectedRoute>}
        />
        <Route
          path="/admin/users"
          element={<ProtectedRoute role="admin"><UserManagement /></ProtectedRoute>}
        />
        <Route
          path="/admin/courses"
          element={<ProtectedRoute role="admin"><AdminCourseManagement /></ProtectedRoute>}
        />
        <Route
          path="/admin/exams"
          element={<ProtectedRoute role="admin"><ExamManagement /></ProtectedRoute>}
        />
        {/* Activity Logs — replaces /admin/anomalies */}
        <Route
          path="/admin/activity-logs"
          element={<ProtectedRoute role="admin"><ActivityLogs /></ProtectedRoute>}
        />
        <Route
          path="/admin/support"
          element={<ProtectedRoute role="admin"><SupportTickets /></ProtectedRoute>}
        />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);