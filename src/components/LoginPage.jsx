import React from "react";
import { Link } from "react-router-dom";

const LoginPage = () => {
  return (
    <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <h2 className="text-center mb-4">Login</h2>
        <form>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input type="email" className="form-control" id="email" placeholder="Enter your email" />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input type="password" className="form-control" id="password" placeholder="Enter your password" />
          </div>
          <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>
        <p className="text-center mt-3">
          Don’t have an account? <Link to="/register">Register here</Link>
        </p>
        <p className="text-center mt-3">
          Go to instructor? <Link to="/instructor">Instructor Dashboard</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
