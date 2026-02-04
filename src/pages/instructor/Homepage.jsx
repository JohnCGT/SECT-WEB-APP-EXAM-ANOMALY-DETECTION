import React from "react";
import { Link } from "react-router-dom";

const Homepage = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">SECT Instructor</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item"><a className="nav-link active" href="#">Dashboard</a></li>
              <li className="nav-item"><a className="nav-link" href="#">Exams</a></li>
              <li className="nav-item"><a className="nav-link" href="#">Students</a></li>
              <li className="nav-item"><Link className="nav-link" to="/">Logout</Link></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mt-4 flex-grow-1">
        {/* Dashboard Cards */}
        <div className="row g-4">
          <div className="col-md-3">
            <div className="card text-center shadow-sm p-3">
              <div className="card-body">
                <h6 className="card-title">Total Exams</h6>
                <p className="card-text display-6">12</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center shadow-sm p-3">
              <div className="card-body">
                <h6 className="card-title">Active Students</h6>
                <p className="card-text display-6">85</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center shadow-sm p-3">
              <div className="card-body">
                <h6 className="card-title">Cheating Alerts</h6>
                <p className="card-text display-6 text-danger">3</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center shadow-sm p-3">
              <div className="card-body">
                <h6 className="card-title">Pending Exams</h6>
                <p className="card-text display-6">5</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Summary Section */}
        <div className="row mt-4">
          <div className="col-md-8">
            <div className="card shadow-sm p-3">
              <h6>Exam Trends (Placeholder Chart)</h6>
              <div className="bg-secondary text-white text-center py-5 mt-3">
                Chart Area
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm p-3 mb-3">
              <h6>Students by Status</h6>
              <ul className="list-group list-group-flush mt-2">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Completed <span className="badge bg-primary rounded-pill">45</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Ongoing <span className="badge bg-warning rounded-pill">25</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Pending <span className="badge bg-secondary rounded-pill">15</span>
                </li>
              </ul>
            </div>
            <div className="card shadow-sm p-3">
              <h6>Cheating Alerts</h6>
              <p className="display-6 text-danger text-center">3</p>
            </div>
          </div>
        </div>

        {/* Table of Students */}
        <div className="mt-4">
          <h5>Student List</h5>
          <table className="table table-striped table-hover shadow-sm mt-2">
            <thead className="table-primary">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Exam Status</th>
                <th>Cheating Score</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>Juan Dela Cruz</td><td>juan@example.com</td><td>Completed</td><td>0%</td></tr>
              <tr><td>2</td><td>Maria Santos</td><td>maria@example.com</td><td>Ongoing</td><td>10%</td></tr>
              <tr><td>3</td><td>Carlos Reyes</td><td>carlos@example.com</td><td>Completed</td><td>25%</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary text-white text-center py-3 mt-auto">
        &copy; 2026 SECT Web Exam Anomaly Detection
      </footer>
    </div>
  );
};

export default Homepage;
