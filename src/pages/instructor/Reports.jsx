import React, { useState } from "react";
import { Link } from "react-router-dom";

const Reports = () => {
  const [reportType, setReportType] = useState("overview");

  const examReports = [
    {
      id: 1,
      title: "Midterm Exam - Data Structures",
      date: "2026-02-15",
      students: 45,
      avgScore: "82%",
      avgCPI: "8%",
      passRate: "91%",
      anomalyCount: 2
    },
    {
      id: 2,
      title: "Final Exam - Algorithms",
      date: "2026-02-10",
      students: 38,
      avgScore: "75%",
      avgCPI: "15%",
      passRate: "84%",
      anomalyCount: 5
    },
    {
      id: 3,
      title: "Prelim Exam - Database Systems",
      date: "2026-02-05",
      students: 41,
      avgScore: "88%",
      avgCPI: "12%",
      passRate: "95%",
      anomalyCount: 3
    }
  ];

  const studentReports = [
    {
      rank: 1,
      name: "Isabel Garcia",
      avgScore: "95%",
      examsTaken: 6,
      avgCPI: "2%",
      anomalies: 0,
      reliability: "Excellent"
    },
    {
      rank: 2,
      name: "Juan Dela Cruz",
      avgScore: "92%",
      examsTaken: 5,
      avgCPI: "3%",
      anomalies: 1,
      reliability: "Excellent"
    },
    {
      rank: 3,
      name: "Ana Rodriguez",
      avgScore: "88%",
      examsTaken: 6,
      avgCPI: "5%",
      anomalies: 1,
      reliability: "Good"
    },
    {
      rank: 4,
      name: "Sofia Martinez",
      avgScore: "85%",
      examsTaken: 6,
      avgCPI: "8%",
      anomalies: 2,
      reliability: "Good"
    },
    {
      rank: 5,
      name: "Maria Santos",
      avgScore: "80%",
      examsTaken: 4,
      avgCPI: "10%",
      anomalies: 2,
      reliability: "Average"
    }
  ];

  const getReliabilityBadge = (reliability) => {
    const badges = {
      Excellent: "bg-success",
      Good: "bg-info",
      Average: "bg-warning text-dark",
      Poor: "bg-danger"
    };
    return badges[reliability] || "bg-secondary";
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
              placeholder="Search reports..." 
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
            <h4>Analytics & Reports</h4>
            <div className="btn-group">
              <button className="btn btn-primary">
                <i className="bi bi-file-earmark-pdf me-2"></i>Export PDF
              </button>
              <button className="btn btn-outline-primary">
                <i className="bi bi-file-earmark-excel me-2"></i>Export Excel
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Total Exams Analyzed</h6>
                  <p className="card-text display-6 fw-bold text-primary">12</p>
                  <small className="text-success">↑ 20% from last month</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Average CPI Score</h6>
                  <p className="card-text display-6 fw-bold text-success">11%</p>
                  <small className="text-success">↓ 3% improvement</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Detection Accuracy</h6>
                  <p className="card-text display-6 fw-bold text-info">96.5%</p>
                  <small className="text-info">Combined algorithms</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Students Flagged</h6>
                  <p className="card-text display-6 fw-bold text-danger">7</p>
                  <small className="text-danger">8.2% of total students</small>
                </div>
              </div>
            </div>
          </div>

          {/* Report Type Selector */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="btn-group mb-3" role="group">
                <button 
                  className={`btn ${reportType === "overview" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setReportType("overview")}
                >
                  Overview
                </button>
                <button 
                  className={`btn ${reportType === "exams" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setReportType("exams")}
                >
                  Exam Reports
                </button>
                <button 
                  className={`btn ${reportType === "students" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setReportType("students")}
                >
                  Student Performance
                </button>
                <button 
                  className={`btn ${reportType === "anomalies" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setReportType("anomalies")}
                >
                  Anomaly Analysis
                </button>
              </div>
            </div>
          </div>

          {/* Overview Report */}
          {reportType === "overview" && (
            <div className="row g-3">
              <div className="col-md-8">
                <div className="card shadow-sm border-0 mb-3">
                  <div className="card-body">
                    <h6 className="card-title mb-3">Cheating Probability Index Trends</h6>
                    <div className="d-flex justify-content-around align-items-end" style={{ height: '250px' }}>
                      <div className="text-center">
                        <div className="bg-success mb-2" style={{ width: '60px', height: '180px' }}></div>
                        <small>Week 1</small>
                        <div className="fw-bold text-success">7%</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-success mb-2" style={{ width: '60px', height: '195px' }}></div>
                        <small>Week 2</small>
                        <div className="fw-bold text-success">9%</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-warning mb-2" style={{ width: '60px', height: '215px' }}></div>
                        <small>Week 3</small>
                        <div className="fw-bold text-warning">12%</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-success mb-2" style={{ width: '60px', height: '200px' }}></div>
                        <small>Week 4</small>
                        <div className="fw-bold text-success">11%</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-success mb-2" style={{ width: '60px', height: '175px' }}></div>
                        <small>Week 5</small>
                        <div className="fw-bold text-success">8%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <h6 className="card-title mb-3">Exam Performance Summary</h6>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>EXAM</th>
                            <th>DATE</th>
                            <th>STUDENTS</th>
                            <th>AVG SCORE</th>
                            <th>AVG CPI</th>
                            <th>PASS RATE</th>
                            <th>ANOMALIES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examReports.map((exam) => (
                            <tr key={exam.id}>
                              <td className="fw-semibold">{exam.title}</td>
                              <td>{exam.date}</td>
                              <td>{exam.students}</td>
                              <td className="fw-bold text-primary">{exam.avgScore}</td>
                              <td>
                                <span className={`fw-bold ${getCPIColor(exam.avgCPI)}`}>
                                  {exam.avgCPI}
                                </span>
                              </td>
                              <td>{exam.passRate}</td>
                              <td>
                                {exam.anomalyCount > 0 ? (
                                  <span className="badge bg-warning">{exam.anomalyCount}</span>
                                ) : (
                                  <span className="text-success">0</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card shadow-sm border-0 mb-3">
                  <div className="card-body">
                    <h6 className="card-title mb-3">Algorithm Performance</h6>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="fw-semibold">Isolation Forest (IF)</span>
                        <span className="text-success fw-bold">96.8%</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div className="progress-bar bg-success" style={{ width: '96.8%' }}></div>
                      </div>
                      <small className="text-muted">245 anomalies detected</small>
                    </div>
                    <div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="fw-semibold">One-Class SVM</span>
                        <span className="text-primary fw-bold">94.2%</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div className="progress-bar bg-primary" style={{ width: '94.2%' }}></div>
                      </div>
                      <small className="text-muted">231 anomalies detected</small>
                    </div>
                  </div>
                </div>

                <div className="card shadow-sm border-0 mb-3">
                  <div className="card-body">
                    <h6 className="card-title mb-3">Anomaly Types</h6>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <div className="d-flex justify-content-between">
                          <span>Face Detection Issues</span>
                          <span className="badge bg-danger">42</span>
                        </div>
                      </li>
                      <li className="mb-2">
                        <div className="d-flex justify-content-between">
                          <span>Tab Switching</span>
                          <span className="badge bg-warning">35</span>
                        </div>
                      </li>
                      <li className="mb-2">
                        <div className="d-flex justify-content-between">
                          <span>Mouse Anomalies</span>
                          <span className="badge bg-info">28</span>
                        </div>
                      </li>
                      <li className="mb-2">
                        <div className="d-flex justify-content-between">
                          <span>Keyboard Patterns</span>
                          <span className="badge bg-primary">18</span>
                        </div>
                      </li>
                      <li>
                        <div className="d-flex justify-content-between">
                          <span>Other</span>
                          <span className="badge bg-secondary">12</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <h6 className="card-title mb-3">System Health</h6>
                    <div className="d-flex justify-content-around text-center">
                      <div>
                        <div className="display-6 text-success">●</div>
                        <small className="text-muted">Detection</small>
                        <div className="fw-bold text-success">Online</div>
                      </div>
                      <div>
                        <div className="display-6 text-success">●</div>
                        <small className="text-muted">Database</small>
                        <div className="fw-bold text-success">Online</div>
                      </div>
                      <div>
                        <div className="display-6 text-success">●</div>
                        <small className="text-muted">API</small>
                        <div className="fw-bold text-success">Online</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Student Performance Report */}
          {reportType === "students" && (
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h6 className="card-title mb-3">Top Performing Students</h6>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>RANK</th>
                        <th>STUDENT NAME</th>
                        <th>AVG SCORE</th>
                        <th>EXAMS TAKEN</th>
                        <th>AVG CPI</th>
                        <th>ANOMALIES</th>
                        <th>RELIABILITY</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentReports.map((student) => (
                        <tr key={student.rank}>
                          <td className="fw-bold">{student.rank}</td>
                          <td className="fw-semibold">{student.name}</td>
                          <td className="text-primary fw-bold">{student.avgScore}</td>
                          <td>{student.examsTaken}</td>
                          <td>
                            <span className={`fw-bold ${getCPIColor(student.avgCPI)}`}>
                              {student.avgCPI}
                            </span>
                          </td>
                          <td>
                            {student.anomalies > 0 ? (
                              <span className="badge bg-warning">{student.anomalies}</span>
                            ) : (
                              <span className="text-success">0</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${getReliabilityBadge(student.reliability)}`}>
                              {student.reliability}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-eye me-1"></i>View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Anomaly Analysis Report */}
          {reportType === "anomalies" && (
            <div className="row g-3">
              <div className="col-md-12">
                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <h6 className="card-title mb-3">Anomaly Detection Summary</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <h6 className="text-muted mb-3">Detection Metrics</h6>
                        <ul className="list-unstyled">
                          <li className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span>True Positives</span>
                              <span className="fw-bold text-success">142</span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div className="progress-bar bg-success" style={{ width: '85%' }}></div>
                            </div>
                          </li>
                          <li className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span>False Positives</span>
                              <span className="fw-bold text-warning">18</span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div className="progress-bar bg-warning" style={{ width: '10%' }}></div>
                            </div>
                          </li>
                          <li className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span>True Negatives</span>
                              <span className="fw-bold text-success">1,235</span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div className="progress-bar bg-success" style={{ width: '95%' }}></div>
                            </div>
                          </li>
                          <li>
                            <div className="d-flex justify-content-between mb-1">
                              <span>False Negatives</span>
                              <span className="fw-bold text-danger">5</span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div className="progress-bar bg-danger" style={{ width: '3%' }}></div>
                            </div>
                          </li>
                        </ul>
                      </div>
                      <div className="col-md-6">
                        <h6 className="text-muted mb-3">Performance Indicators</h6>
                        <div className="row text-center">
                          <div className="col-6 mb-3">
                            <div className="border rounded p-3">
                              <div className="display-6 fw-bold text-success">96.5%</div>
                              <small className="text-muted">Precision</small>
                            </div>
                          </div>
                          <div className="col-6 mb-3">
                            <div className="border rounded p-3">
                              <div className="display-6 fw-bold text-success">96.6%</div>
                              <small className="text-muted">Recall</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="border rounded p-3">
                              <div className="display-6 fw-bold text-primary">96.5%</div>
                              <small className="text-muted">F1-Score</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="border rounded p-3">
                              <div className="display-6 fw-bold text-info">98.4%</div>
                              <small className="text-muted">Specificity</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;