import React from "react";
import { Link } from "react-router-dom";

const Homepage = () => {
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
              <li><a className="dropdown-item" href="#">Account Settings</a></li>
              <li><a className="dropdown-item" href="#">Profile</a></li>
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
                    <a
                        className="nav-link text-white active bg-primary rounded fs-6 fw-semibold d-flex flex-column align-items-center py-3"
                        href="#"
                    >
                        <i className="bi bi-speedometer2 fs-4 mb-1"></i>
                        <span>Dashboard</span>
                    </a>
                </li>
                <li className="nav-item mb-3">
                    <a
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        href="#"
                    >
                        <i className="bi bi-file-earmark-text fs-3 mb-1"></i>
                        <span>Exams</span>
                    </a>
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
          <h4 className="mb-4">Dashboard</h4>

          {/* Dashboard Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Total Exams</h6>
                  <p className="card-text display-6 fw-bold text-primary">12</p>
                  <small className="text-success">5 Pending</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Active Students</h6>
                  <p className="card-text display-6 fw-bold text-info">85</p>
                  <small className="text-success">Currently taking exams</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Pending Exams</h6>
                  <p className="card-text display-6 fw-bold text-warning">5</p>
                  <small className="text-muted">Awaiting deployment</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Cheating Alerts</h6>
                  <p className="card-text display-6 fw-bold text-danger">3</p>
                  <small className="text-danger">Requires attention</small>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title">Exam Status by Stage</h6>
                  <div className="d-flex justify-content-around align-items-end mt-4" style={{ height: '200px' }}>
                    <div className="bg-success" style={{ width: '50px', height: '160px' }}></div>
                    <div className="bg-warning" style={{ width: '50px', height: '90px' }}></div>
                    <div className="bg-info" style={{ width: '50px', height: '120px' }}></div>
                    <div className="bg-secondary" style={{ width: '50px', height: '60px' }}></div>
                  </div>
                  <div className="d-flex justify-content-around mt-2">
                    <small>Completed</small>
                    <small>Ongoing</small>
                    <small>Pending</small>
                    <small>Cancelled</small>
                  </div>
                  <div className="text-center mt-3">
                    <small className="text-muted">Total: 12 exams</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title">Students by Exam Status</h6>
                  <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                    <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'conic-gradient(#28a745 0deg 190deg, #ffc107 190deg 280deg, #6c757d 280deg 360deg)' }}></div>
                  </div>
                  <div className="mt-3">
                    <small className="d-block"><span className="text-success">●</span> Completed: 45 students</small>
                    <small className="d-block"><span className="text-warning">●</span> Ongoing: 25 students</small>
                    <small className="d-block"><span className="text-secondary">●</span> Pending: 15 students</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title">Anomaly Detection Metrics</h6>
                  <ul className="list-unstyled mt-3">
                    <li className="d-flex justify-content-between mb-2">
                      <span>Face Detection</span>
                      <div className="progress flex-grow-1 mx-2" style={{ height: '10px' }}>
                        <div className="progress-bar bg-success" style={{ width: '95%' }}></div>
                      </div>
                      <span>95%</span>
                    </li>
                    <li className="d-flex justify-content-between mb-2">
                      <span>Tab Switching</span>
                      <div className="progress flex-grow-1 mx-2" style={{ height: '10px' }}>
                        <div className="progress-bar bg-warning" style={{ width: '15%' }}></div>
                      </div>
                      <span>15%</span>
                    </li>
                    <li className="d-flex justify-content-between mb-2">
                      <span>Mouse Activity</span>
                      <div className="progress flex-grow-1 mx-2" style={{ height: '10px' }}>
                        <div className="progress-bar bg-info" style={{ width: '78%' }}></div>
                      </div>
                      <span>78%</span>
                    </li>
                    <li className="d-flex justify-content-between mb-2">
                      <span>Keyboard Pattern</span>
                      <div className="progress flex-grow-1 mx-2" style={{ height: '10px' }}>
                        <div className="progress-bar bg-primary" style={{ width: '82%' }}></div>
                      </div>
                      <span>82%</span>
                    </li>
                    <li className="d-flex justify-content-between mb-2">
                      <span>Overall Compliance</span>
                      <div className="progress flex-grow-1 mx-2" style={{ height: '10px' }}>
                        <div className="progress-bar bg-success" style={{ width: '88%' }}></div>
                      </div>
                      <span>88%</span>
                    </li>
                    <li className="d-flex justify-content-between mb-2">
                      <span>Cheating Risk</span>
                      <div className="progress flex-grow-1 mx-2" style={{ height: '10px' }}>
                        <div className="progress-bar bg-danger" style={{ width: '12%' }}></div>
                      </div>
                      <span>12%</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Student List Table and Anomaly Detection Stats */}
          <div className="row g-4">
            <div className="col-md-8">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title mb-3">Student List</h6>
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>NAME</th>
                        <th>EMAIL</th>
                        <th>EXAM STATUS</th>
                        <th>CPI SCORE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td>Juan Dela Cruz</td>
                        <td>juan@example.com</td>
                        <td><span className="badge bg-success">Completed</span></td>
                        <td><span className="text-success">0%</span></td>
                      </tr>
                      <tr>
                        <td>2</td>
                        <td>Maria Santos</td>
                        <td>maria@example.com</td>
                        <td><span className="badge bg-warning text-dark">Ongoing</span></td>
                        <td><span className="text-warning">10%</span></td>
                      </tr>
                      <tr>
                        <td>3</td>
                        <td>Carlos Reyes</td>
                        <td>carlos@example.com</td>
                        <td><span className="badge bg-success">Completed</span></td>
                        <td><span className="text-warning">25%</span></td>
                      </tr>
                      <tr>
                        <td>4</td>
                        <td>Ana Rodriguez</td>
                        <td>ana@example.com</td>
                        <td><span className="badge bg-primary">Ongoing</span></td>
                        <td><span className="text-success">5%</span></td>
                      </tr>
                      <tr>
                        <td>5</td>
                        <td>Miguel Torres</td>
                        <td>miguel@example.com</td>
                        <td><span className="badge bg-danger">Flagged</span></td>
                        <td><span className="text-danger">78%</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0 mb-3">
                <div className="card-body">
                  <h6 className="card-title mb-3">Detection Algorithm Status</h6>
                  <div className="row text-center mb-3">
                    <div className="col-6">
                      <div className="border rounded p-3">
                        <div className="display-6 fw-bold text-success">IF</div>
                        <small className="text-muted">Isolation Forest</small>
                        <div className="text-success small mt-2">Active</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded p-3">
                        <div className="display-6 fw-bold text-primary">OCSVM</div>
                        <small className="text-muted">One-Class SVM</small>
                        <div className="text-primary small mt-2">Active</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title mb-3">Anomaly Detection Summary</h6>
                  <div className="row text-center">
                    <div className="col-6 mb-3">
                      <div className="border rounded p-3">
                        <div className="display-6 fw-bold text-success">82</div>
                        <small className="text-muted">Normal</small>
                        <div className="text-success small">↑ Behavior</div>
                      </div>
                    </div>
                    <div className="col-6 mb-3">
                      <div className="border rounded p-3">
                        <div className="display-6 fw-bold text-danger">3</div>
                        <small className="text-muted">Anomalies</small>
                        <div className="text-danger small">↓ Detected</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <small className="text-muted">Accuracy: 96.5%</small>
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

export default Homepage;