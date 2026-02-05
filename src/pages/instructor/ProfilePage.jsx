import React from "react";
import { Link } from "react-router-dom";

const ProfilePage = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold text-primary" href="#">SECT Instructor</a>
          
          {/* Search Bar */}
          <form className="d-flex mx-auto" style={{ width: '40%' }}>
            <input 
              className="form-control" 
              type="search" 
              placeholder="Search..." 
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
              <span className="me-2 fw-bold">Welcome, Instructor Name</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdown">
              <li><Link className="dropdown-item" to="/instructor/account-settings">Account Settings</Link></li>
              <li><Link className="dropdown-item" to="/instructor/profile">Profile</Link></li>
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
            style={{ width: '110px', minHeight: '100%' }}
        >
            <ul className="nav flex-column p-3 align-items-center">
                <li className="nav-item mb-3">
                    <Link
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        to="/instructor"
                    >
                        <i className="bi bi-speedometer2 fs-4 mb-1"></i>
                        <span>Dashboard</span>
                    </Link>
                </li>
                <li className="nav-item mb-3">
                    <Link
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        to="/instructor/exams"
                    >
                        <i className="bi bi-file-earmark-text fs-3 mb-1"></i>
                        <span>Exams</span>
                    </Link>
                </li>
                <li className="nav-item mb-3">
                    <a
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        href="#"
                    >
                        <i className="bi bi-people fs-3 mb-1"></i>
                        <span>Students</span>
                    </a>
                </li>
                <li className="nav-item mb-3">
                    <a
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        href="#"
                    >
                        <i className="bi bi-exclamation-triangle fs-3 mb-1"></i>
                        <span>Alerts</span>
                    </a>
                </li>
                <li className="nav-item mb-3">
                    <a
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        href="#"
                    >
                        <i className="bi bi-bar-chart fs-3 mb-1"></i>
                        <span>Reports</span>
                    </a>
                </li>
                <li className="nav-item mb-3">
                    <a
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        href="#"
                    >
                        <i className="bi bi-gear fs-3 mb-1"></i>
                        <span>Settings</span>
                    </a>
                </li>
            </ul>
        </nav>

        {/* Main Content */}
        <div className="flex-grow-1 p-4 bg-light">
          <h4 className="mb-4">Instructor Profile</h4>

          {/* Profile Header */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 text-center">
                  <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '150px', height: '150px' }}>
                    <i className="bi bi-person-fill text-white" style={{ fontSize: '80px' }}></i>
                  </div>
                  <div className="mt-3">
                    <button className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-camera me-1"></i>Change Photo
                    </button>
                  </div>
                </div>
                <div className="col-md-9">
                  <h5 className="fw-bold">Dr. Maria Elena Santos</h5>
                  <p className="text-muted mb-3">
                    <i className="bi bi-briefcase me-2"></i>Professor, Computer Science Department
                  </p>
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-2">
                        <i className="bi bi-envelope me-2 text-primary"></i>
                        <strong>Email:</strong> maria.santos@university.edu.ph
                      </p>
                      <p className="mb-2">
                        <i className="bi bi-telephone me-2 text-primary"></i>
                        <strong>Phone:</strong> +63 912 345 6789
                      </p>
                      <p className="mb-2">
                        <i className="bi bi-building me-2 text-primary"></i>
                        <strong>Department:</strong> Computer Science
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-2">
                        <i className="bi bi-calendar me-2 text-primary"></i>
                        <strong>Member Since:</strong> January 2020
                      </p>
                      <p className="mb-2">
                        <i className="bi bi-geo-alt me-2 text-primary"></i>
                        <strong>Office:</strong> Room 305, Engineering Building
                      </p>
                      <p className="mb-2">
                        <i className="bi bi-clock me-2 text-primary"></i>
                        <strong>Consultation Hours:</strong> Mon-Fri, 2:00 PM - 4:00 PM
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
                  <h6 className="card-title text-muted">Total Exams Created</h6>
                  <p className="card-text display-6 fw-bold text-primary">47</p>
                  <small className="text-success">↑ 12 this semester</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Total Students Taught</h6>
                  <p className="card-text display-6 fw-bold text-info">342</p>
                  <small className="text-muted">Across 8 classes</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Detection Accuracy</h6>
                  <p className="card-text display-6 fw-bold text-success">96.5%</p>
                  <small className="text-success">Average across all exams</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Active Courses</h6>
                  <p className="card-text display-6 fw-bold text-warning">5</p>
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
                  <a className="nav-link" data-bs-toggle="tab" href="#activity">Activity History</a>
                </li>
              </ul>

              <div className="tab-content mt-4">
                {/* About Tab */}
                <div id="about" className="tab-pane fade show active">
                  <h6 className="fw-bold mb-3">Professional Bio</h6>
                  <p className="text-muted">
                    Dr. Maria Elena Santos is a Professor in the Computer Science Department with over 15 years 
                    of teaching experience. She specializes in database systems, web development, and educational 
                    technology. Dr. Santos has published numerous papers on online learning assessment and 
                    academic integrity in digital environments.
                  </p>
                  
                  <h6 className="fw-bold mb-3 mt-4">Education</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <strong>Ph.D. in Computer Science</strong> - University of the Philippines, 2012
                    </li>
                    <li className="mb-2">
                      <strong>M.S. in Information Technology</strong> - Ateneo de Manila University, 2008
                    </li>
                    <li className="mb-2">
                      <strong>B.S. in Computer Science</strong> - De La Salle University, 2005
                    </li>
                  </ul>

                  <h6 className="fw-bold mb-3 mt-4">Research Interests</h6>
                  <div>
                    <span className="badge bg-primary me-2 mb-2">Educational Technology</span>
                    <span className="badge bg-primary me-2 mb-2">Academic Integrity</span>
                    <span className="badge bg-primary me-2 mb-2">Machine Learning</span>
                    <span className="badge bg-primary me-2 mb-2">Web Development</span>
                    <span className="badge bg-primary me-2 mb-2">Database Systems</span>
                  </div>
                </div>

                {/* Courses Tab */}
                <div id="courses" className="tab-pane fade">
                  <h6 className="fw-bold mb-3">Current Semester Courses</h6>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>COURSE CODE</th>
                          <th>COURSE NAME</th>
                          <th>SCHEDULE</th>
                          <th>STUDENTS</th>
                          <th>EXAMS</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>CS 101</td>
                          <td>Introduction to Data Structures</td>
                          <td>MWF 9:00 AM - 10:30 AM</td>
                          <td>45</td>
                          <td>3 Active</td>
                        </tr>
                        <tr>
                          <td>CS 102</td>
                          <td>Algorithm Analysis</td>
                          <td>TTH 1:00 PM - 2:30 PM</td>
                          <td>40</td>
                          <td>2 Active</td>
                        </tr>
                        <tr>
                          <td>CS 201</td>
                          <td>Database Systems</td>
                          <td>MWF 2:00 PM - 3:30 PM</td>
                          <td>38</td>
                          <td>2 Active</td>
                        </tr>
                        <tr>
                          <td>CS 202</td>
                          <td>Network Security</td>
                          <td>TTH 10:00 AM - 11:30 AM</td>
                          <td>35</td>
                          <td>2 Active</td>
                        </tr>
                        <tr>
                          <td>CS 301</td>
                          <td>Advanced Web Development</td>
                          <td>MWF 11:00 AM - 12:30 PM</td>
                          <td>42</td>
                          <td>3 Active</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Activity History Tab */}
                <div id="activity" className="tab-pane fade">
                  <h6 className="fw-bold mb-3">Recent Activity</h6>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <i className="bi bi-file-earmark-text text-primary me-2"></i>
                          <strong>Created exam:</strong> Midterm Examination - Data Structures
                        </div>
                        <small className="text-muted">2 hours ago</small>
                      </div>
                    </li>
                    <li className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                          <strong>Reviewed alert:</strong> Suspicious behavior detected - Student ID: 2021-12345
                        </div>
                        <small className="text-muted">5 hours ago</small>
                      </div>
                    </li>
                    <li className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <i className="bi bi-bar-chart text-info me-2"></i>
                          <strong>Generated report:</strong> Monthly Exam Performance Report
                        </div>
                        <small className="text-muted">1 day ago</small>
                      </div>
                    </li>
                    <li className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <i className="bi bi-pencil text-success me-2"></i>
                          <strong>Updated exam:</strong> Quiz 3 - Algorithm Analysis
                        </div>
                        <small className="text-muted">2 days ago</small>
                      </div>
                    </li>
                    <li className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <i className="bi bi-people text-primary me-2"></i>
                          <strong>Added students:</strong> 5 new students to CS 301
                        </div>
                        <small className="text-muted">3 days ago</small>
                      </div>
                    </li>
                    <li className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <i className="bi bi-check-circle text-success me-2"></i>
                          <strong>Completed exam:</strong> Prelim Exam - Web Development
                        </div>
                        <small className="text-muted">4 days ago</small>
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

export default ProfilePage;
