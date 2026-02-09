import React from "react";
import { Link } from "react-router-dom";

const StudentAccountSettings = () => {
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
                         <li>
                           <Link className="dropdown-item" to="/student/profile">
                              My Profile
                           </Link>
                         </li>
                         <li><hr className="dropdown-divider" /></li>
                            <li>
                          <Link className="dropdown-item text-danger" to="/">
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
          className="text-black d-flex justify-content-center bg-white border-end shadow-sm"
          style={{ width: "110px", minHeight: "100%" }}
        >
          <ul className="nav flex-column p-3 align-items-center">
            <li className="nav-item mb-100">
              <Link
                className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                to="/student"
              >
                <i className="bi bi-speedometer2 fs-4 mb-1"></i>
                <span>Home</span>
              </Link>
            </li>

            <li className="nav-item mb-100">
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

            <li className="nav-item mb-100">
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
                className="nav-link text-white fw-semibold bg-primary d-flex flex-column align-items-center py-3 rounded-4"
                to="/student/account-settings"
              >
                <i className="bi bi-gear fs-4 mb-1"></i>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <div className="flex-grow-1 p-4 bg-light">
          <h4 className="mb-4">Account Settings</h4>

          {/* Tabs */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <ul className="nav nav-tabs" role="tablist">
                <li className="nav-item">
                  <a
                    className="nav-link active"
                    data-bs-toggle="tab"
                    href="#general"
                  >
                    General
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" data-bs-toggle="tab" href="#security">
                    Security
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link"
                    data-bs-toggle="tab"
                    href="#notifications"
                  >
                    Notifications
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link"
                    data-bs-toggle="tab"
                    href="#preferences"
                  >
                    Learning Preferences
                  </a>
                </li>
              </ul>

              <div className="tab-content mt-4">
                {/* GENERAL */}
                <div id="general" className="tab-pane fade show active">
                  <h6 className="fw-bold mb-3">Personal Information</h6>
                  <form>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value="Juan"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value="Dela Cruz"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        value="juan.delacruz@student.edu.ph"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        value="+63 912 345 6789"
                      />
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Course</label>
                        <select className="form-select">
                          <option selected>BS Computer Science</option>
                          <option>BS Information Technology</option>
                          <option>BS Engineering</option>
                          <option>BS Mathematics</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Year Level</label>
                        <select className="form-select">
                          <option selected>3rd Year</option>
                          <option>1st Year</option>
                          <option>2nd Year</option>
                          <option>4th Year</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                  </form>
                </div>

                {/* SECURITY */}
                <div id="security" className="tab-pane fade">
                  <h6 className="fw-bold mb-3">Change Password</h6>
                  <form>
                    <div className="mb-3">
                      <label className="form-label">Current Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Update Password
                    </button>
                  </form>

                  <hr className="my-4" />

                  <h6 className="fw-bold mb-3">Two-Factor Authentication</h6>
                  <div className="card bg-light border-0">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Two-Factor Authentication</strong>
                          <p className="text-muted mb-0 small">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="2faStudent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="my-4" />

                  <h6 className="fw-bold mb-3">Login History</h6>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>DATE & TIME</th>
                          <th>IP ADDRESS</th>
                          <th>DEVICE</th>
                          <th>LOCATION</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Feb 05, 2026 - 7:45 PM</td>
                          <td>192.168.1.120</td>
                          <td>Windows PC - Chrome</td>
                          <td>Manila, Philippines</td>
                        </tr>
                        <tr>
                          <td>Feb 04, 2026 - 3:20 PM</td>
                          <td>192.168.1.120</td>
                          <td>Android - Chrome</td>
                          <td>Quezon City, Philippines</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* NOTIFICATIONS */}
                <div id="notifications" className="tab-pane fade">
                  <h6 className="fw-bold mb-3">Email Notifications</h6>
                  <div className="card bg-light border-0 mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Assignment Deadlines</strong>
                          <p className="text-muted mb-0 small">
                            Get notified when assignments are due
                          </p>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            defaultChecked
                          />
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Exam Schedules</strong>
                          <p className="text-muted mb-0 small">
                            Receive reminders before exams start
                          </p>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            defaultChecked
                          />
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Grades Posted</strong>
                          <p className="text-muted mb-0 small">
                            Get notified when new grades are released
                          </p>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            defaultChecked
                          />
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>System Announcements</strong>
                          <p className="text-muted mb-0 small">
                            Receive important academic updates
                          </p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3 mt-4">
                    Notification Preferences
                  </h6>
                  <div className="card bg-light border-0">
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label">Alert Frequency</label>
                        <select className="form-select">
                          <option selected>Real-time</option>
                          <option>Hourly Digest</option>
                          <option>Daily Summary</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LEARNING PREFERENCES */}
                <div id="preferences" className="tab-pane fade">
                  <h6 className="fw-bold mb-3">Learning Preferences</h6>
                  <p className="text-muted">
                    Customize how you receive course materials and reminders
                  </p>

                  <div className="card bg-light border-0 mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Enable Study Reminders</strong>
                          <p className="text-muted mb-0 small">
                            Get reminders to review lessons
                          </p>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            defaultChecked
                          />
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Auto-Download Course Files</strong>
                          <p className="text-muted mb-0 small">
                            Automatically download materials when available
                          </p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Preferred Study Mode</strong>
                          <p className="text-muted mb-0 small">
                            Choose how you prefer to learn
                          </p>
                        </div>
                        <select className="form-select w-50">
                          <option selected>Visual</option>
                          <option>Reading/Writing</option>
                          <option>Hands-on</option>
                          <option>Mixed</option>
                        </select>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Weekly Study Goal (hours)</strong>
                          <p className="text-muted mb-0 small">
                            Set your target study hours per week
                          </p>
                        </div>
                        <input
                          type="number"
                          className="form-control w-25"
                          defaultValue="10"
                        />
                      </div>
                    </div>
                  </div>

                  <button className="btn btn-primary">
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAccountSettings;