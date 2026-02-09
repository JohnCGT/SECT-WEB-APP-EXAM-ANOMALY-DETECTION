import React from "react";
import { Link } from "react-router-dom";

const StudentProfile = () => {
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
              className="btn btn-light dropdown-toggle d-flex align-items-center"
              type="button"
              id="accountDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <span className="me-2 fw-bold">Welcome, Student Name</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdown">
              <li><Link className="dropdown-item" to="/student/account-settings">Account Settings</Link></li>
              <li><Link className="dropdown-item" to="/student/profile">Profile</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li><Link className="dropdown-item" to="/">Logout</Link></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Layout with Sidebar */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <nav
          className="text-black d-flex justify-content-center"
          style={{ width: "110px", minHeight: "100%" }}
        >
          <ul className="nav flex-column p-3 align-items-center">
            <li className="nav-item mb-3">
              <Link
                className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                to="/student"
              >
                <i className="bi bi-speedometer2 fs-4 mb-1"></i>
                <span>Home</span>
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link
                className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                to="/student/subjects"
              >
                <i className="bi bi-journal-bookmark fs-3 mb-1"></i>
                <span>Subjects</span>
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link
                className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                to="/student/tasks"
              >
                <i className="bi bi-pencil-square fs-4 mb-1"></i>
                <span>Tasks</span>
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link
                className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                to="/student/grades"
              >
                <i className="bi bi-graph-up-arrow fs-4 mb-1"></i>
                <span>Grades</span>
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link
                className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                to="/student/account-settings"
              >
                <i className="bi bi-gear fs-3 mb-1"></i>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <div className="flex-grow-1 p-4 bg-light">
          <h4 className="mb-4">Student Profile</h4>

          {/* Profile Header */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 text-center">
                  <div
                    className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={{ width: "150px", height: "150px" }}
                  >
                    <i className="bi bi-person-fill text-white" style={{ fontSize: "80px" }}></i>
                  </div>
                  <div className="mt-3">
                    <button className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-camera me-1"></i>Change Photo
                    </button>
                  </div>
                </div>
                <div className="col-md-9">
                  <h5 className="fw-bold">Alex Dela Cruz</h5>
                  <p className="text-muted mb-3">
                    <i className="bi bi-mortarboard me-2"></i>Bachelor of Science in Computer Science
                  </p>
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-2">
                        <i className="bi bi-envelope me-2 text-primary"></i>
                        <strong>Email:</strong> alex.delacruz@student.university.edu.ph
                      </p>
                      <p className="mb-2">
                        <i className="bi bi-telephone me-2 text-primary"></i>
                        <strong>Phone:</strong> +63 917 654 3210
                      </p>
                      <p className="mb-2">
                        <i className="bi bi-person-badge me-2 text-primary"></i>
                        <strong>Student ID:</strong> 2022-04567
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-2">
                        <i className="bi bi-calendar me-2 text-primary"></i>
                        <strong>Year Level:</strong> 3rd Year
                      </p>
                      <p className="mb-2">
                        <i className="bi bi-building me-2 text-primary"></i>
                        <strong>College:</strong> College of Computing Studies
                      </p>
                      <p className="mb-2">
                        <i className="bi bi-book me-2 text-primary"></i>
                        <strong>Section:</strong> BSCS-3A
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Current GPA</h6>
                  <p className="card-text display-6 fw-bold text-primary">3.84</p>
                  <small className="text-success">↑ +0.2 this semester</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Credits Earned</h6>
                  <p className="card-text display-6 fw-bold text-info">92</p>
                  <small className="text-muted">out of 120</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Class Rank</h6>
                  <p className="card-text display-6 fw-bold text-success">#14</p>
                  <small className="text-muted">Top 5% of batch</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Active Subjects</h6>
                  <p className="card-text display-6 fw-bold text-warning">6</p>
                  <small className="text-muted">Current semester</small>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Information Tabs */}
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <ul className="nav nav-tabs" role="tablist">
                <li className="nav-item">
                  <a className="nav-link active" data-bs-toggle="tab" href="#about">About</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" data-bs-toggle="tab" href="#courses">Courses</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" data-bs-toggle="tab" href="#activity">Activity</a>
                </li>
              </ul>

              <div className="tab-content mt-4">
                {/* About Tab */}
                <div id="about" className="tab-pane fade show active">
                  <h6 className="fw-bold mb-3">Student Bio</h6>
                  <p className="text-muted">
                    Alex Dela Cruz is a third-year Computer Science student with strong interests in
                    software engineering, cybersecurity, and data analytics. He consistently
                    maintains academic excellence while actively participating in tech-related
                    student organizations.
                  </p>

                  <h6 className="fw-bold mb-3 mt-4">Academic Interests</h6>
                  <div>
                    <span className="badge bg-primary me-2 mb-2">Web Development</span>
                    <span className="badge bg-primary me-2 mb-2">Cybersecurity</span>
                    <span className="badge bg-primary me-2 mb-2">Data Science</span>
                    <span className="badge bg-primary me-2 mb-2">AI & ML</span>
                    <span className="badge bg-primary me-2 mb-2">Software Engineering</span>
                  </div>
                </div>

                {/* Courses Tab */}
                <div id="courses" className="tab-pane fade">
                  <h6 className="fw-bold mb-3">Enrolled Courses</h6>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>COURSE CODE</th>
                          <th>COURSE NAME</th>
                          <th>SCHEDULE</th>
                          <th>INSTRUCTOR</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>CS 101</td>
                          <td>Data Structures</td>
                          <td>MWF 9:00 AM - 10:30 AM</td>
                          <td>Dr. Santos</td>
                          <td><span className="badge bg-success">Active</span></td>
                        </tr>
                        <tr>
                          <td>CS 102</td>
                          <td>Algorithm Analysis</td>
                          <td>TTH 1:00 PM - 2:30 PM</td>
                          <td>Prof. Reyes</td>
                          <td><span className="badge bg-success">Active</span></td>
                        </tr>
                        <tr>
                          <td>CS 201</td>
                          <td>Database Systems</td>
                          <td>MWF 2:00 PM - 3:30 PM</td>
                          <td>Dr. Gomez</td>
                          <td><span className="badge bg-success">Active</span></td>
                        </tr>
                        <tr>
                          <td>CS 202</td>
                          <td>Network Security</td>
                          <td>TTH 10:00 AM - 11:30 AM</td>
                          <td>Engr. Cruz</td>
                          <td><span className="badge bg-success">Active</span></td>
                        </tr>
                        <tr>
                          <td>CS 301</td>
                          <td>Advanced Web Development</td>
                          <td>MWF 11:00 AM - 12:30 PM</td>
                          <td>Ms. Lim</td>
                          <td><span className="badge bg-success">Active</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Activity Tab */}
                <div id="activity" className="tab-pane fade">
                  <h6 className="fw-bold mb-3">Recent Activity</h6>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <i className="bi bi-file-earmark-text text-primary me-2"></i>
                          <strong>Submitted:</strong> Data Structures Assignment 3
                        </div>
                        <small className="text-muted">2 hours ago</small>
                      </div>
                    </li>
                    <li className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <i className="bi bi-check-circle text-success me-2"></i>
                          <strong>Completed exam:</strong> Algorithm Analysis Quiz 2
                        </div>
                        <small className="text-muted">1 day ago</small>
                      </div>
                    </li>
                    <li className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <i className="bi bi-bar-chart text-info me-2"></i>
                          <strong>Viewed grades:</strong> Database Systems Midterm
                        </div>
                        <small className="text-muted">2 days ago</small>
                      </div>
                    </li>
                    <li className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <i className="bi bi-clock text-warning me-2"></i>
                          <strong>Upcoming exam:</strong> Network Security Final
                        </div>
                        <small className="text-muted">3 days from now</small>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentProfile;