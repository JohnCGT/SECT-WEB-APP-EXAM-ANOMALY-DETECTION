import React from "react";
import { Link } from "react-router-dom";

const AdminPage = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold text-danger">
            SECT Admin
          </span>

          {/* Search */}
          <form className="d-flex mx-auto" style={{ width: "40%" }}>
            <input
              className="form-control"
              type="search"
              placeholder="Search users, exams, reports..."
            />
          </form>

          {/* Account Dropdown */}
          <div className="dropdown">
            <button
              className="btn btn-light dropdown-toggle fw-bold"
              data-bs-toggle="dropdown"
            >
              Admin Panel
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <Link className="dropdown-item" to="/">
                  Logout
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Layout */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <nav
          className="d-flex justify-content-center bg-white border-end"
          style={{ width: "110px" }}
        >
          <ul className="nav flex-column p-3 align-items-center">
            <li className="nav-item mb-3">
              <Link
                to="/admin"
                className="nav-link bg-danger text-white rounded d-flex flex-column align-items-center py-3"
              >
                <i className="bi bi-speedometer2 fs-4"></i>
                <span>Dashboard</span>
              </Link>
            </li>

            <li className="nav-item mb-3">
              <Link
                to="/admin/users"
                className="nav-link text-dark d-flex flex-column align-items-center py-3"
              >
                <i className="bi bi-people fs-4"></i>
                <span>Users</span>
              </Link>
            </li>

            <li className="nav-item mb-3">
              <Link
                to="/admin/exams"
                className="nav-link text-dark d-flex flex-column align-items-center py-3"
              >
                <i className="bi bi-journal-text fs-4"></i>
                <span>Exams</span>
              </Link>
            </li>

            <li className="nav-item mb-3">
              <Link
                to="/admin/anomalies"
                className="nav-link text-dark d-flex flex-column align-items-center py-3"
              >
                <i className="bi bi-exclamation-triangle fs-4"></i>
                <span>Anomalies</span>
              </Link>
            </li>

            <li className="nav-item mb-3">
              <Link
                to="/admin/logs"
                className="nav-link text-dark d-flex flex-column align-items-center py-3"
              >
                <i className="bi bi-bar-chart fs-4"></i>
                <span>Logs</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <div className="flex-grow-1 p-4 bg-light">
          <h4 className="mb-4">Admin Dashboard</h4>

          {/* Overview Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h6 className="text-muted">Total Users</h6>
                  <p className="display-6 fw-bold">124</p>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h6 className="text-muted">Active Exams</h6>
                  <p className="display-6 fw-bold text-primary">5</p>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h6 className="text-muted">Flagged Sessions</h6>
                  <p className="display-6 fw-bold text-danger">8</p>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h6 className="text-muted">High CPI Risk</h6>
                  <p className="display-6 fw-bold text-warning">3</p>
                </div>
              </div>
            </div>
          </div>

          {/* CPI Report Table */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="mb-3">
                Cheating Probability Index Reports
              </h6>
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Student</th>
                    <th>Exam</th>
                    <th>CPI</th>
                    <th>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Juan Dela Cruz</td>
                    <td>Final Exam</td>
                    <td>0.87</td>
                    <td className="fw-bold text-danger">High</td>
                  </tr>
                  <tr>
                    <td>Maria Santos</td>
                    <td>Midterm</td>
                    <td>0.22</td>
                    <td className="fw-bold text-success">Low</td>
                  </tr>
                  <tr>
                    <td>Carlos Reyes</td>
                    <td>Quiz 2</td>
                    <td>0.51</td>
                    <td className="fw-bold text-warning">Medium</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminPage;