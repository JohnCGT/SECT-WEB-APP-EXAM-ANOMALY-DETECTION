import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold text-primary d-flex align-items-center gap-2">
            🎓 SECT Student Portal
          </span>

          {/* Search Bar */}
          <form className="d-flex mx-auto" style={{ width: "38%" }}>
            <input
              className="form-control rounded-pill px-4"
              type="search"
              placeholder="Search subjects, exams, deadlines..."
              aria-label="Search"
            />
          </form>

          {/* Account Dropdown */}
          <div className="dropdown">
            <button
              className="btn btn-light rounded-pill px-3 d-flex align-items-center gap-2 shadow-sm"
              type="button"
              data-bs-toggle="dropdown"
            >
              <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                A
              </span>
              <span className="fw-semibold">Alex</span>
              <i className="bi bi-chevron-down small"></i>
            </button>

            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
              <li><a className="dropdown-item" href="#">My Profile</a></li>
              <li><a className="dropdown-item" href="#">Academic Settings</a></li>
              <li><hr className="dropdown-divider" /></li>
              <li><Link className="dropdown-item text-danger" to="/">Logout</Link></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <nav
          className="bg-white border-end shadow-sm"
          style={{ width: "110px", minHeight: "100%" }}
        >
          <ul className="nav flex-column p-3 align-items-center gap-2">
            <li className="nav-item w-100">
              <a className="nav-link active bg-primary text-white rounded-4 fw-semibold d-flex flex-column align-items-center py-3 shadow-sm" href="#">
                <i className="bi bi-speedometer2 fs-4 mb-1"></i>
                <span>Home</span>
              </a>
            </li>

           <li className="nav-item w-100">
              <Link
                className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4 hover-shadow"
                to="/student/subjects"
              >
                <i className="bi bi-journal-bookmark fs-4 mb-1"></i>
                <span>Subjects</span>
              </Link>
            </li>

            <li className="nav-item mb-100">
              <Link
                className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                to="/student/tasks"
              >
                <i className="bi bi-pencil-square fs-3 mb-1"></i>
                <span>Tasks</span>
              </Link>
            </li>


            <li className="nav-item w-100">
              <Link
                className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4"
                to="/student/grades"
              >
                <i className="bi bi-graph-up-arrow fs-4 mb-1"></i>
                <span>Grades</span>
              </Link>
            </li>

            <li className="nav-item w-100">
              <Link
                className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4"
                to="/student/account-settings"
              >
                <i className="bi bi-gear fs-4 mb-1"></i>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <div className="flex-grow-1 p-4">
          {/* Hero Section */}
          <div className="rounded-4 p-4 mb-4 text-white shadow-sm"
               style={{
                 background: "linear-gradient(135deg, #4f46e5, #3b82f6)"
               }}>
            <h4 className="fw-bold mb-1">Welcome back, Alex 👋</h4>
            <p className="mb-0 opacity-75">
              You’re doing great — stay consistent and keep learning.
            </p>
          </div>

          {/* Progress Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small">Upcoming Exams</span>
                    <i className="bi bi-alarm text-warning fs-5"></i>
                  </div>
                  <h2 className="fw-bold text-warning mb-1">3</h2>
                  <small className="text-muted">This week</small>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small">Tasks Remaining</span>
                    <i className="bi bi-list-check text-primary fs-5"></i>
                  </div>
                  <h2 className="fw-bold text-primary mb-1">12</h2>
                  <small className="text-muted">To be submitted</small>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small">Overall Progress</span>
                    <i className="bi bi-award text-success fs-5"></i>
                  </div>
                  <h2 className="fw-bold text-success mb-1">68%</h2>
                  <small className="text-muted">Semester completion</small>
                </div>
              </div>
            </div>
          </div>

          {/* Main Section */}
          <div className="row g-4">
            {/* Left Column */}
            <div className="col-md-8">
              {/* My Learning */}
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">📚 My Learning Progress</h6>
                    <button className="btn btn-sm btn-outline-primary rounded-pill">
                      View All
                    </button>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="border rounded-4 p-3 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong>Data Structures</strong>
                          <span className="badge bg-primary-subtle text-primary">Ongoing</span>
                        </div>
                        <small className="text-muted d-block mb-2">
                          Arrays, Trees, Graphs
                        </small>
                        <div className="progress mb-1" style={{ height: "8px" }}>
                          <div className="progress-bar bg-primary" style={{ width: "45%" }}></div>
                        </div>
                        <small className="text-muted">45% complete</small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border rounded-4 p-3 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong>Database Management</strong>
                          <span className="badge bg-success-subtle text-success">On Track</span>
                        </div>
                        <small className="text-muted d-block mb-2">
                          SQL, Normalization
                        </small>
                        <div className="progress mb-1" style={{ height: "8px" }}>
                          <div className="progress-bar bg-success" style={{ width: "82%" }}></div>
                        </div>
                        <small className="text-muted">82% complete</small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border rounded-4 p-3 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong>UI/UX Principles</strong>
                          <span className="badge bg-warning-subtle text-warning">Just Started</span>
                        </div>
                        <small className="text-muted d-block mb-2">
                          Wireframing & Prototyping
                        </small>
                        <div className="progress mb-1" style={{ height: "8px" }}>
                          <div className="progress-bar bg-warning" style={{ width: "12%" }}></div>
                        </div>
                        <small className="text-muted">12% complete</small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border border-dashed rounded-4 p-3 h-100 text-center text-muted d-flex flex-column justify-content-center">
                        <i className="bi bi-plus-circle fs-3 mb-2"></i>
                        <strong>Explore New Courses</strong>
                        <small>Expand your skills</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deadlines */}
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">⏰ Upcoming Deadlines</h6>

                  <div className="d-flex justify-content-between align-items-center border-bottom py-3">
                    <div>
                      <strong>Database Normalization Quiz</strong>
                      <div className="text-muted small">
                        Due Oct 25 • 11:59 PM
                      </div>
                    </div>
                    <button className="btn btn-sm btn-outline-primary rounded-pill">
                      Start
                    </button>
                  </div>

                  <div className="d-flex justify-content-between align-items-center py-3">
                    <div>
                      <strong>Final Project Submission</strong>
                      <div className="text-muted small">
                        Due Oct 28 • 5:00 PM
                      </div>
                    </div>
                    <button className="btn btn-sm btn-outline-success rounded-pill">
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-md-4">
              

              {/* Announcements */}
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">📢 Announcements</h6>
                  <div className="border rounded-4 p-3">
                    <span className="badge bg-primary mb-2">Admin</span>
                    <p className="mb-1 small">
                      System maintenance scheduled tonight at 2:00 AM.
                    </p>
                    <small className="text-muted">2 hours ago</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;