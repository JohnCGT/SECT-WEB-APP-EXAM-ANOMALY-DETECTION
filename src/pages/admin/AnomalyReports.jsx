import React from "react";
import { Link } from "react-router-dom";

const AnomalyReports = () => {
  return (
    <div className="p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between mb-4">
        <h4>Anomaly Reports</h4>
        <Link to="/admin" className="btn btn-outline-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Student</th>
                <th>CPI Score</th>
                <th>Anomaly Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Juan Dela Cruz</td>
                <td>0.87</td>
                <td><span className="badge bg-danger">Multiple Sessions</span></td>
              </tr>
              <tr>
                <td>Maria Santos</td>
                <td>0.92</td>
                <td><span className="badge bg-warning text-dark">Tab Switching</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnomalyReports;