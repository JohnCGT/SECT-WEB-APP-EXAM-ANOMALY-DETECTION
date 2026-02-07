import React, { useState } from "react";
import { Link } from "react-router-dom";

const Alerts = () => {
  const [filterSeverity, setFilterSeverity] = useState("all");

  const alerts = [
    {
      id: 1,
      timestamp: "2026-02-08 14:32:15",
      student: "Miguel Torres",
      studentId: "2021-00005",
      exam: "Final Exam - Algorithms",
      type: "Face Detection",
      severity: "Critical",
      description: "No face detected for 45 seconds",
      cpi: "78%",
      status: "Unresolved",
      algorithm: "IF"
    },
    {
      id: 2,
      timestamp: "2026-02-08 14:28:42",
      student: "Carlos Reyes",
      studentId: "2021-00003",
      exam: "Final Exam - Algorithms",
      type: "Tab Switching",
      severity: "High",
      description: "Switched tabs 12 times in 5 minutes",
      cpi: "45%",
      status: "Under Review",
      algorithm: "OCSVM"
    },
    {
      id: 3,
      timestamp: "2026-02-08 14:15:21",
      student: "Maria Santos",
      studentId: "2021-00002",
      exam: "Midterm - Web Development",
      type: "Mouse Activity",
      severity: "Medium",
      description: "Unusual mouse movement pattern detected",
      cpi: "18%",
      status: "Resolved",
      algorithm: "IF"
    },
    {
      id: 4,
      timestamp: "2026-02-08 13:45:33",
      student: "Ana Rodriguez",
      studentId: "2021-00004",
      exam: "Final Exam - Algorithms",
      type: "Keyboard Pattern",
      severity: "Low",
      description: "Typing speed deviation detected",
      cpi: "12%",
      status: "Dismissed",
      algorithm: "OCSVM"
    },
    {
      id: 5,
      timestamp: "2026-02-08 13:22:18",
      student: "Miguel Torres",
      studentId: "2021-00005",
      exam: "Final Exam - Algorithms",
      type: "Multiple Faces",
      severity: "Critical",
      description: "Multiple faces detected in frame",
      cpi: "95%",
      status: "Unresolved",
      algorithm: "IF"
    },
    {
      id: 6,
      timestamp: "2026-02-08 12:58:47",
      student: "Roberto Fernandez",
      studentId: "2021-00007",
      exam: "Quiz 3 - Machine Learning",
      type: "Face Detection",
      severity: "Medium",
      description: "Face partially obscured for 15 seconds",
      cpi: "22%",
      status: "Under Review",
      algorithm: "OCSVM"
    },
    {
      id: 7,
      timestamp: "2026-02-08 12:30:05",
      student: "Sofia Martinez",
      studentId: "2021-00008",
      exam: "Midterm - Web Development",
      type: "Window Focus",
      severity: "High",
      description: "Lost window focus 8 times",
      cpi: "38%",
      status: "Resolved",
      algorithm: "IF"
    }
  ];

  const getSeverityBadge = (severity) => {
    const badges = {
      Critical: "bg-danger",
      High: "bg-warning text-dark",
      Medium: "bg-info",
      Low: "bg-secondary"
    };
    return badges[severity] || "bg-secondary";
  };

  const getStatusBadge = (status) => {
    const badges = {
      Unresolved: "bg-danger",
      "Under Review": "bg-warning text-dark",
      Resolved: "bg-success",
      Dismissed: "bg-secondary"
    };
    return badges[status] || "bg-secondary";
  };

  const getCPIColor = (cpi) => {
    const value = parseInt(cpi);
    if (value < 10) return "text-success";
    if (value < 30) return "text-warning";
    return "text-danger";
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold text-primary" href="#">SECT Instructor</a>
          
          <form className="d-flex mx-auto" style={{ width: '40%' }}>
            <input 
              className="form-control" 
              type="search" 
              placeholder="Search alerts..." 
              aria-label="Search"
            />
          </form>

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
              <li><Link className="dropdown-item" to="/instructor/profile">Account Settings</Link></li>
              <li><Link className="dropdown-item" to="/instructor/account-settings">Profile</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li><Link className="dropdown-item" to="/">Logout</Link></li>
            </ul>
          </div>
        </div>
      </nav>

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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>Cheating Alerts & Anomalies</h4>
            <div className="btn-group">
              <button className="btn btn-outline-primary">
                <i className="bi bi-funnel me-2"></i>Filter
              </button>
              <button className="btn btn-outline-secondary">
                <i className="bi bi-download me-2"></i>Export
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0 border-start border-danger border-4">
                <div className="card-body">
                  <h6 className="card-title text-muted">Critical Alerts</h6>
                  <p className="card-text display-6 fw-bold text-danger">3</p>
                  <small className="text-danger">Requires immediate attention</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0 border-start border-warning border-4">
                <div className="card-body">
                  <h6 className="card-title text-muted">High Priority</h6>
                  <p className="card-text display-6 fw-bold text-warning">5</p>
                  <small className="text-warning">Review soon</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0 border-start border-info border-4">
                <div className="card-body">
                  <h6 className="card-title text-muted">Medium Priority</h6>
                  <p className="card-text display-6 fw-bold text-info">8</p>
                  <small className="text-info">Monitor closely</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0 border-start border-secondary border-4">
                <div className="card-body">
                  <h6 className="card-title text-muted">Total Alerts (24h)</h6>
                  <p className="card-text display-6 fw-bold text-primary">23</p>
                  <small className="text-muted">Last updated: now</small>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="card shadow-sm border-0 mb-3">
            <div className="card-body">
              <div className="btn-group mb-3" role="group">
                <button 
                  className={`btn ${filterSeverity === "all" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setFilterSeverity("all")}
                >
                  All Alerts
                </button>
                <button 
                  className={`btn ${filterSeverity === "critical" ? "btn-danger" : "btn-outline-danger"}`}
                  onClick={() => setFilterSeverity("critical")}
                >
                  Critical
                </button>
                <button 
                  className={`btn ${filterSeverity === "high" ? "btn-warning" : "btn-outline-warning"}`}
                  onClick={() => setFilterSeverity("high")}
                >
                  High
                </button>
                <button 
                  className={`btn ${filterSeverity === "medium" ? "btn-info" : "btn-outline-info"}`}
                  onClick={() => setFilterSeverity("medium")}
                >
                  Medium
                </button>
                <button 
                  className={`btn ${filterSeverity === "low" ? "btn-secondary" : "btn-outline-secondary"}`}
                  onClick={() => setFilterSeverity("low")}
                >
                  Low
                </button>
              </div>
            </div>
          </div>

          {/* Alerts Table */}
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h6 className="card-title mb-3">Recent Alerts</h6>
              
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>TIMESTAMP</th>
                      <th>STUDENT</th>
                      <th>EXAM</th>
                      <th>ALERT TYPE</th>
                      <th>SEVERITY</th>
                      <th>DESCRIPTION</th>
                      <th>CPI</th>
                      <th>ALGORITHM</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => (
                      <tr key={alert.id}>
                        <td>{alert.id}</td>
                        <td>
                          <div className="small">{alert.timestamp}</div>
                        </td>
                        <td>
                          <div className="fw-semibold">{alert.student}</div>
                          <small className="text-muted">{alert.studentId}</small>
                        </td>
                        <td className="small">{alert.exam}</td>
                        <td>
                          <span className="badge bg-dark">{alert.type}</span>
                        </td>
                        <td>
                          <span className={`badge ${getSeverityBadge(alert.severity)}`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="small">{alert.description}</td>
                        <td>
                          <span className={`fw-bold ${getCPIColor(alert.cpi)}`}>
                            {alert.cpi}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${alert.algorithm === 'IF' ? 'bg-success' : 'bg-primary'}`}>
                            {alert.algorithm}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(alert.status)}`}>
                            {alert.status}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" title="View Details">
                              <i className="bi bi-eye"></i>
                            </button>
                            <button className="btn btn-outline-success" title="Resolve">
                              <i className="bi bi-check-circle"></i>
                            </button>
                            <button className="btn btn-outline-danger" title="Flag Student">
                              <i className="bi bi-flag"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Alert Statistics */}
          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title mb-3">Alert Types Distribution</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Face Detection</span>
                        <div className="progress flex-grow-1 mx-3" style={{ height: '10px' }}>
                          <div className="progress-bar bg-danger" style={{ width: '35%' }}></div>
                        </div>
                        <span className="fw-bold">35%</span>
                      </div>
                    </li>
                    <li className="mb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Tab Switching</span>
                        <div className="progress flex-grow-1 mx-3" style={{ height: '10px' }}>
                          <div className="progress-bar bg-warning" style={{ width: '28%' }}></div>
                        </div>
                        <span className="fw-bold">28%</span>
                      </div>
                    </li>
                    <li className="mb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Mouse Activity</span>
                        <div className="progress flex-grow-1 mx-3" style={{ height: '10px' }}>
                          <div className="progress-bar bg-info" style={{ width: '18%' }}></div>
                        </div>
                        <span className="fw-bold">18%</span>
                      </div>
                    </li>
                    <li className="mb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Keyboard Pattern</span>
                        <div className="progress flex-grow-1 mx-3" style={{ height: '10px' }}>
                          <div className="progress-bar bg-primary" style={{ width: '12%' }}></div>
                        </div>
                        <span className="fw-bold">12%</span>
                      </div>
                    </li>
                    <li>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Other</span>
                        <div className="progress flex-grow-1 mx-3" style={{ height: '10px' }}>
                          <div className="progress-bar bg-secondary" style={{ width: '7%' }}></div>
                        </div>
                        <span className="fw-bold">7%</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title mb-3">Algorithm Performance</h6>
                  <div className="row text-center mb-3">
                    <div className="col-6">
                      <div className="border rounded p-3">
                        <div className="display-6 fw-bold text-success">IF</div>
                        <small className="text-muted">Isolation Forest</small>
                        <div className="mt-2">
                          <div className="text-success fw-bold">96.8%</div>
                          <small className="text-muted">Accuracy</small>
                        </div>
                        <div className="mt-2">
                          <small className="text-success">12 alerts detected</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded p-3">
                        <div className="display-6 fw-bold text-primary">OCSVM</div>
                        <small className="text-muted">One-Class SVM</small>
                        <div className="mt-2">
                          <div className="text-primary fw-bold">94.2%</div>
                          <small className="text-muted">Accuracy</small>
                        </div>
                        <div className="mt-2">
                          <small className="text-primary">11 alerts detected</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <small className="text-muted">Combined Detection Rate: 95.5%</small>
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

export default Alerts;