import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import Swal from 'sweetalert2';  // Import SweetAlert2

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  /**
   * Handle login form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Send login request to backend
      const res = await API.post('/login', { 
        email: email.trim().toLowerCase(),
        password 
      });
      
      const { user } = res.data;
      
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Show success toast
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });

      await Toast.fire({
        icon: 'success',
        title: `Welcome back, ${user.name}!`
      });
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'instructor') {
        navigate('/instructor');
      } else if (user.role === 'student') {
        navigate('/student');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Show error with SweetAlert
      await Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: err.response?.data?.message || 'Invalid email or password',
      });
      
      setError(err.response?.data?.message || 'Login failed! Please check your credentials.');
    } finally {
      setLoading(false);
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