import React from "react";
import { Link } from "react-router-dom";

const SystemLogs = () => {
  return (
    <div className="p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between mb-4">
        <h4>System Logs</h4>
        <Link to="/admin" className="btn btn-outline-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <ul className="list-group">
            <li className="list-group-item">
              Admin logged in – 10:45 AM
            </li>
            <li className="list-group-item">
              Exam reset for Midterm – 11:02 AM
            </li>
            <li className="list-group-item">
              User suspended: Juan Dela Cruz – 11:15 AM
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;