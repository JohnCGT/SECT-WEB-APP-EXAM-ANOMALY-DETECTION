import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import API from "../lib/api";

/**
 * ProtectedRoute
 *
 * Wraps any route that requires authentication.
 * - Shows a spinner while checking the session
 * - Redirects to "/" if not authenticated
 * - Redirects to the correct home if the user's role doesn't match
 *
 * Auth is verified exclusively against the server session cookie.
 * No localStorage is used — session cookies are HttpOnly and XSS-safe.
 *
 * Usage:
 *   <Route path="/instructor/exams" element={
 *     <ProtectedRoute role="instructor"><ExamPage /></ProtectedRoute>
 *   } />
 */
const ProtectedRoute = ({ children, role }) => {
  const [authState, setAuthState] = useState({
    checking: true,       // true while /me is in flight
    authenticated: false,
    user: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Single source of truth: the server session
        const res  = await API.get("/me");
        const user = res.data.user;

        setAuthState({
          checking:      false,
          authenticated: true,
          user,
        });
      } catch {
        // /me returned 401 — session is gone or never existed
        setAuthState({
          checking:      false,
          authenticated: false,
          user:          null,
        });
      }
    };

    checkAuth();
  }, []);

  // ── Poll every 3 s — kick out if session changed ──
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await API.get("/me");
        if (res.data.user.role !== role) window.location.href = roleLoginPage(role);
      } catch {
        window.location.href = roleLoginPage(role);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [role]);

  // ── Still waiting for /me response — show a full-screen spinner ──
  if (authState.checking) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // ── Not authenticated at all ──
  if (!authState.authenticated) {
    return <Navigate to="/" replace />;
  }

  // ── Authenticated but wrong role — redirect to their own home ──
  if (role && authState.user?.role !== role) {
    const roleHome = {
      admin:      "/admin",
      instructor: "/instructor/exams",
      student:    "/student",
    };
    return <Navigate to={roleHome[authState.user?.role] || "/"} replace />;
  }

  // ── All good — render the page ──
  return children;
};

const roleLoginPage = (role) => {
  const pages = {
    admin:      "/admin/login",
    instructor: "/instructor/login",
    student:    "/",
  };
  return pages[role] ?? "/";
};

export default ProtectedRoute;