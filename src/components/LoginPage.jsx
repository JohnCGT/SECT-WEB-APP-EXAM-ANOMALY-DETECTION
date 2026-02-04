import React from "react";
import "../styles/LoginPage.css";

const LoginPage = () => {
  return (
    <div className="container-fluid d-flex justify-content-center align-items-center vh-100 bg-light">
    <div className="card shadow p-4" style={{ width: "350px", maxWidth: "90%" }}>
        <h2 className="text-center mb-4">Login</h2>
        <form>
        <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
            type="email"
            className="form-control"
            id="email"
            placeholder="Enter your email"
            />
        </div>
        <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
            type="password"
            className="form-control"
            id="password"
            placeholder="Enter your password"
            />
        </div>
        <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>
    </div>
    </div>

  );
};

export default LoginPage;
