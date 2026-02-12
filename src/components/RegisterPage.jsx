import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { fetchCsrfToken } from "../api";
import Swal from 'sweetalert2';

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear field error on change
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Step 1: Fetch CSRF cookie — required by Sanctum before any POST
      await fetchCsrfToken();

      // Step 2: Send register request
      const res = await API.post('/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });

      const { user } = res.data;

      // Step 3: Persist user so protected routes don't bounce back
      localStorage.setItem('user', JSON.stringify(user));

      // Step 4: Show success alert
      await Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        text: `Welcome, ${user.name}!`,
        timer: 1500,
        showConfirmButton: false,
      });

      // Step 5: Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'instructor') {
        navigate('/instructor/exams');
      } else if (user.role === 'student') {
        navigate('/student');
      }

    } catch (err) {
      console.error('Register error:', err);

      // Handle Laravel validation errors (422)
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        await Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: err.response.data.message || 'Please fix the errors below.',
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: err.response?.data?.message || 'Something went wrong. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
      <div className="card shadow p-4" style={{ maxWidth: "420px", width: "100%" }}>
        <h2 className="text-center mb-4">Register</h2>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              id="name"
              name="name"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
            {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              id="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              disabled={loading}
            />
            {errors.email && <div className="invalid-feedback">{errors.email[0]}</div>}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              id="password"
              name="password"
              placeholder="Min 8 chars, upper, lower, number, special"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              disabled={loading}
            />
            {errors.password && <div className="invalid-feedback">{errors.password[0]}</div>}
          </div>

          {/* Role */}
          <div className="mb-3">
            <label htmlFor="role" className="form-label">Role</label>
            <select
              className={`form-select ${errors.role ? 'is-invalid' : ''}`}
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && <div className="invalid-feedback">{errors.role[0]}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-3">
          Already have an account? <Link to="/">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;