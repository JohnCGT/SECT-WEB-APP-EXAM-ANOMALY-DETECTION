import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import API from "../api";

/**
 * ProtectedRoute
 * 
 * Wraps any route that requires authentication.
 * - Shows a spinner while checking the session
 * - Redirects to "/" if not authenticated
 * - Redirects to "/" if the user's role doesn't match the required role
 * 
 * Usage:
 *   <Route path="/instructor/exams" element={
 *     <ProtectedRoute role="instructor"><ExamPage /></ProtectedRoute>
 *   } />
 */
const ProtectedRoute = ({ children, role }) => {
  const [authState, setAuthState] = useState({
    checking: true,  // true while /me is in flight
    authenticated: false,
    user: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      // First check localStorage for a quick optimistic read
      const stored = localStorage.getItem("user");

      try {
        // Always verify with the server — localStorage can be stale
        const res = await API.get("/me");
        const user = res.data.user;

        // Update localStorage with fresh data
        localStorage.setItem("user", JSON.stringify(user));

        setAuthState({
          checking: false,
          authenticated: true,
          user,
        });
      } catch (err) {
        // /me failed — session is gone or never existed
        localStorage.removeItem("user");
        setAuthState({
          checking: false,
          authenticated: false,
          user: null,
        });
      }
    };

    checkAuth();
  }, []);

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

  // ── Authenticated but wrong role ──
  if (role && authState.user?.role !== role) {
    // Redirect each role to their own home
    const roleHome = {
      admin: "/admin",
      instructor: "/instructor/exams",
      student: "/student",
    };
    return <Navigate to={roleHome[authState.user?.role] || "/"} replace />;
  }

  // ── All good — render the page ──
  return children;
};

export default ProtectedRoute;