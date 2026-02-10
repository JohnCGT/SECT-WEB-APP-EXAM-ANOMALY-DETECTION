import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

const LoginPage = () => {
  // State management
  const [email, setEmail] = useState("");           // Store email input
  const [password, setPassword] = useState("");     // Store password input
  const [loading, setLoading] = useState(false);    // Loading state for button
  const [error, setError] = useState("");           // Error message
  const navigate = useNavigate();                   // Navigation hook

  /**
   * Handle login form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevent page refresh
    setLoading(true);    // Show loading state
    setError("");        // Clear previous errors

    try {
      // Send login request to backend
      const res = await API.post('/login', { 
        email: email.trim().toLowerCase(),  // Normalize email
        password 
      });
      
      // Extract user data from response
      const { user } = res.data;
      
      // Save user to localStorage (browser storage)
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'instructor') {
        navigate('/instructor');
      } else if (user.role === 'student') {
        navigate('/student');
      }
    } catch (err) {
      // Handle errors
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed! Please check your credentials.');
    } finally {
      setLoading(false);  // Hide loading state
    }
  };

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <h2 className="text-center mb-4">Login</h2>
        
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              id="email" 
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              id="password" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center mt-3">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;