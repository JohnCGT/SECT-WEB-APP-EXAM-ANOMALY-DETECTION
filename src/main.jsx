// Import tools
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import pages
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import Homepage from "./pages/instructor/Homepage";
import ExamPage from "./pages/instructor/ExamPage";
import ProfilePage from "./pages/instructor/ProfilePage";
import AccountSettings from "./pages/instructor/AccountSettings";
import Students from "./pages/instructor/Students";
import Reports from "./pages/instructor/Reports";
import Alerts from "./pages/instructor/Alerts";

import Dashboard from "./pages/student/Dashboard";
import AdminPage from "./pages/admin/AdminPage";

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
        
        {/* Admin Page - Guban */}
        <Route path="/admin" element={<AdminPage />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);