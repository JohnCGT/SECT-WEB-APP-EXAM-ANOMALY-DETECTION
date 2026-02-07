import React from "react";
import { Link } from "react-router-dom";

const ExamManagement = () => {
  return (
    <div className="p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between mb-4">
        <h4>Exam Management</h4>
        <Link to="/admin" className="btn btn-outline-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Exam Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Midterm Exam</td>
                <td><span className="badge bg-success">Enabled</span></td>
                <td>
                  <button className="btn btn-sm btn-warning me-2">Disable</button>
                  <button className="btn btn-sm btn-danger">Reset Sessions</button>
                </td>
              </tr>
              <tr>
                <td>Final Exam</td>
                <td><span className="badge bg-secondary">Disabled</span></td>
                <td>
                  <button className="btn btn-sm btn-success me-2">Enable</button>
                  <button className="btn btn-sm btn-danger">Reset Sessions</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamManagement;