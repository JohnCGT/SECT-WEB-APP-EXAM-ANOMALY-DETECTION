import React from "react";
import { Link } from "react-router-dom";

const AdminPage = () => {
  return (
    <div className="container-fluid bg-light min-vh-100 p-4">
      <h1 className="mb-4 text-dark">Admin Dashboard</h1>

      {/* Overview Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Total Users</h6>
              <p className="display-6 fw-bold">124</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Active Exams</h6>
              <p className="display-6 fw-bold">5</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Flagged Sessions</h6>
              <p className="display-6 fw-bold text-danger">8</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">Cheating Detection Reports</h5>
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Student</th>
                <th>Exam</th>
                <th>CPI Score</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Student A</td>
                <td>Final Exam</td>
                <td>0.87</td>
                <td className="text-danger fw-bold">High</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;