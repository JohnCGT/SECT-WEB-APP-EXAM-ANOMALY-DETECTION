import React from "react";
import { Link } from "react-router-dom";

const AccountSettings = () => {
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
                        className="nav-link text-white active bg-primary rounded fs-6 fw-semibold d-flex flex-column align-items-center py-3"
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
                    <Link
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        to="/instructor/students"
                    >
                        <i className="bi bi-people fs-3 mb-1"></i>
                        <span>Students</span>
                    </Link>
                </li>
                <li className="nav-item mb-3">
                    <Link
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        to="/instructor/alerts"
                    >
                        <i className="bi bi-exclamation-triangle fs-3 mb-1"></i>
                        <span>Alerts</span>
                    </Link>
                </li>
                <li className="nav-item mb-3">
                    <Link
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        to="/instructor/reports"
                    >
                        <i className="bi bi-bar-chart fs-3 mb-1"></i>
                        <span>Reports</span>
                    </Link>
                </li>              
                <li className="nav-item mb-3">
                    <Link
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        to="/instructor/account-settings"
                    >
                        <i className="bi bi-file-earmark-text fs-3 mb-1"></i>
                        <span>Settings</span>
                    </Link>  
                </li>
            </ul>
        </nav>

        {/* Main Content */}
        <div className="flex-grow-1 p-4 bg-light">
          <h4 className="mb-4">Account Settings</h4>

          {/* Settings Navigation */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <ul className="nav nav-tabs" role="tablist">
                <li className="nav-item">
                  <a className="nav-link active" data-bs-toggle="tab" href="#general">General</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" data-bs-toggle="tab" href="#security">Security</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" data-bs-toggle="tab" href="#notifications">Notifications</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" data-bs-toggle="tab" href="#monitoring">Monitoring Settings</a>
                </li>
              </ul>

              <div className="tab-content mt-4">
                {/* General Settings Tab */}
                <div id="general" className="tab-pane fade show active">
                  <h6 className="fw-bold mb-3">Personal Information</h6>
                  <form>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">First Name</label>
                        <input type="text" className="form-control" value="Maria Elena" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Last Name</label>
                        <input type="text" className="form-control" value="Santos" />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <input type="email" className="form-control" value="maria.santos@university.edu.ph" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone Number</label>
                      <input type="tel" className="form-control" value="+63 912 345 6789" />
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Department</label>
                        <select className="form-select">
                          <option selected>Computer Science</option>
                          <option>Information Technology</option>
                          <option>Engineering</option>
                          <option>Mathematics</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Office Location</label>
                        <input type="text" className="form-control" value="Room 305, Engineering Building" />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Consultation Hours</label>
                      <input type="text" className="form-control" value="Mon-Fri, 2:00 PM - 4:00 PM" />
                    </div>
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                  </form>
                </div>

                {/* Security Settings Tab */}
                <div id="security" className="tab-pane fade">
                  <h6 className="fw-bold mb-3">Change Password</h6>
                  <form>
                    <div className="mb-3">
                      <label className="form-label">Current Password</label>
                      <input type="password" className="form-control" placeholder="Enter current password" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">New Password</label>
                      <input type="password" className="form-control" placeholder="Enter new password" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Confirm New Password</label>
                      <input type="password" className="form-control" placeholder="Confirm new password" />
                    </div>
                    <button type="submit" className="btn btn-primary">Update Password</button>
                  </form>

                  <hr className="my-4" />

                  <h6 className="fw-bold mb-3">Two-Factor Authentication</h6>
                  <div className="card bg-light border-0">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Two-Factor Authentication</strong>
                          <p className="text-muted mb-0 small">Add an extra layer of security to your account</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="2fa" />
                          <label className="form-check-label" htmlFor="2fa"></label>
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
                          <td>Feb 05, 2026 - 8:30 AM</td>
                          <td>192.168.1.100</td>
                          <td>Windows PC - Chrome</td>
                          <td>Manila, Philippines</td>
                        </tr>
                        <tr>
                          <td>Feb 04, 2026 - 2:15 PM</td>
                          <td>192.168.1.100</td>
                          <td>Windows PC - Chrome</td>
                          <td>Manila, Philippines</td>
                        </tr>
                        <tr>
                          <td>Feb 03, 2026 - 9:00 AM</td>
                          <td>192.168.1.101</td>
                          <td>Android - Chrome Mobile</td>
                          <td>Quezon City, Philippines</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notification Settings Tab */}
                <div id="notifications" className="tab-pane fade">
                  <h6 className="fw-bold mb-3">Email Notifications</h6>
                  <div className="card bg-light border-0 mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Exam Alerts</strong>
                          <p className="text-muted mb-0 small">Receive notifications when exams start or end</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="examAlerts" defaultChecked />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Cheating Alerts</strong>
                          <p className="text-muted mb-0 small">Get notified when suspicious behavior is detected</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="cheatingAlerts" defaultChecked />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Student Submissions</strong>
                          <p className="text-muted mb-0 small">Notify when students complete their exams</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="submissions" defaultChecked />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>System Updates</strong>
                          <p className="text-muted mb-0 small">Receive notifications about system maintenance and updates</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="systemUpdates" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3 mt-4">Notification Preferences</h6>
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
                      <div className="mb-3">
                        <label className="form-label">CPI Threshold for Alerts</label>
                        <input type="number" className="form-control" value="50" />
                        <small className="text-muted">Alert me when student CPI exceeds this percentage</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monitoring Settings Tab */}
                <div id="monitoring" className="tab-pane fade">
                  <h6 className="fw-bold mb-3">Default Exam Monitoring Settings</h6>
                  <p className="text-muted">These settings will be applied to all new exams by default</p>
                  
                  <div className="card bg-light border-0 mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Face Detection</strong>
                          <p className="text-muted mb-0 small">Monitor student presence through webcam</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="faceDetection" defaultChecked />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Tab Switching Detection</strong>
                          <p className="text-muted mb-0 small">Track when students switch browser tabs</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="tabSwitching" defaultChecked />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Mouse Activity Tracking</strong>
                          <p className="text-muted mb-0 small">Monitor mouse movement patterns</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="mouseTracking" defaultChecked />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Keyboard Pattern Analysis</strong>
                          <p className="text-muted mb-0 small">Analyze typing patterns and speed</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="keyboardPatterns" defaultChecked />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Screen Recording</strong>
                          <p className="text-muted mb-0 small">Record student screen during exam</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="screenRecording" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3 mt-4">Anomaly Detection Algorithms</h6>
                  <div className="card bg-light border-0">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <strong>Isolation Forest Algorithm</strong>
                          <p className="text-muted mb-0 small">Primary anomaly detection method</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="isolationForest" defaultChecked />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>One-Class SVM Algorithm</strong>
                          <p className="text-muted mb-0 small">Secondary validation method</p>
                        </div>
                        <div className="form-check form-switch">
                          <input className="form-check-input" type="checkbox" id="oneClassSVM" defaultChecked />
                        </div>
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3 mt-4">Detection Sensitivity</h6>
                  <div className="card bg-light border-0">
                    <div className="card-body">
                      <label className="form-label">Anomaly Detection Sensitivity</label>
                      <input type="range" className="form-range" min="1" max="5" defaultValue="3" />
                      <div className="d-flex justify-content-between">
                        <small className="text-muted">Low (Fewer alerts)</small>
                        <small className="text-muted">Medium</small>
                        <small className="text-muted">High (More alerts)</small>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button className="btn btn-primary">Save Monitoring Settings</button>
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

export default AccountSettings;
