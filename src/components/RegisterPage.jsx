import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

const RegisterPage = () => {
  // State management for form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");  // Default to student
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  /**
   * Handle registration form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevent page refresh
    setLoading(true);
    setError("");

    // Client-side validation - Password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Client-side validation - Password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Send registration request to backend
      const response = await API.post('/register', { 
        name: name.trim(),                    // Remove extra spaces
        email: email.trim().toLowerCase(),    // Normalize email
        password,                             // Password (will be hashed by backend)
        role                                  // User role
      });
      
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Show success message
      alert('Registration successful!');
      
      // Redirect based on role
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'instructor') {
        navigate('/instructor');
      } else {
        navigate('/student');
      }
    } catch (err) {
      // Handle errors
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      
      // Show validation errors if any
      if (err.response?.data?.errors) {
        const errors = Object.values(err.response.data.errors).flat();
        setError(errors.join('. '));
      } else {
        setError(err.response?.data?.message || 'Registration failed!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <h2 className="text-center mb-4">Register</h2>
        
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-control" 
              id="name" 
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength="2"
              maxLength="255"
              disabled={loading}
            />
          </div>

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
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="8"
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          {/* Confirm Password Input */}
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input 
              type="password" 
              className="form-control" 
              id="confirmPassword" 
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="8"
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          {/* Role Selection */}
          <div className="mb-3">
            <label htmlFor="role" className="form-label">Register as</label>
            <select 
              className="form-select" 
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              disabled={loading}
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-success w-100"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center mt-3">
          Already have an account? <Link to="/">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;