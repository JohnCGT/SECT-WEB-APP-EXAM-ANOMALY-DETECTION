import React, { useState } from "react";
import { Link } from "react-router-dom";

const Students = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const students = [
    {
      id: 1,
      name: "Juan Dela Cruz",
      email: "juan@example.com",
      studentId: "2021-00001",
      examsCompleted: 5,
      examsOngoing: 0,
      avgCPI: "3%",
      totalAnomalies: 1,
      status: "Active",
      lastExam: "2026-02-05"
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria@example.com",
      studentId: "2021-00002",
      examsCompleted: 3,
      examsOngoing: 1,
      avgCPI: "10%",
      totalAnomalies: 2,
      status: "Active",
      lastExam: "2026-02-08"
    },
    {
      id: 3,
      name: "Carlos Reyes",
      email: "carlos@example.com",
      studentId: "2021-00003",
      examsCompleted: 4,
      examsOngoing: 0,
      avgCPI: "25%",
      totalAnomalies: 5,
      status: "Flagged",
      lastExam: "2026-02-07"
    },
    {
      id: 4,
      name: "Ana Rodriguez",
      email: "ana@example.com",
      studentId: "2021-00004",
      examsCompleted: 5,
      examsOngoing: 1,
      avgCPI: "5%",
      totalAnomalies: 1,
      status: "Active",
      lastExam: "2026-02-08"
    },
    {
      id: 5,
      name: "Miguel Torres",
      email: "miguel@example.com",
      studentId: "2021-00005",
      examsCompleted: 2,
      examsOngoing: 0,
      avgCPI: "78%",
      totalAnomalies: 12,
      status: "Suspended",
      lastExam: "2026-02-03"
    },
    {
      id: 6,
      name: "Isabel Garcia",
      email: "isabel@example.com",
      studentId: "2021-00006",
      examsCompleted: 6,
      examsOngoing: 0,
      avgCPI: "2%",
      totalAnomalies: 0,
      status: "Active",
      lastExam: "2026-02-06"
    },
    {
      id: 7,
      name: "Roberto Fernandez",
      email: "roberto@example.com",
      studentId: "2021-00007",
      examsCompleted: 4,
      examsOngoing: 0,
      avgCPI: "15%",
      totalAnomalies: 3,
      status: "Active",
      lastExam: "2026-02-05"
    },
    {
      id: 8,
      name: "Sofia Martinez",
      email: "sofia@example.com",
      studentId: "2021-00008",
      examsCompleted: 5,
      examsOngoing: 1,
      avgCPI: "8%",
      totalAnomalies: 2,
      status: "Active",
      lastExam: "2026-02-08"
    }
  ];

  const getStatusBadge = (status) => {
    const badges = {
      Active: "bg-success",
      Flagged: "bg-warning text-dark",
      Suspended: "bg-danger"
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
              placeholder="Search students..." 
              aria-label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            <h4>Students Management</h4>
            <button className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>Add Student
            </button>
          </div>

          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Total Students</h6>
                  <p className="card-text display-6 fw-bold text-primary">85</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Active</h6>
                  <p className="card-text display-6 fw-bold text-success">78</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Flagged</h6>
                  <p className="card-text display-6 fw-bold text-warning">5</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Suspended</h6>
                  <p className="card-text display-6 fw-bold text-danger">2</p>
                </div>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h6 className="card-title mb-3">Student List</h6>
              
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>STUDENT ID</th>
                      <th>NAME</th>
                      <th>EMAIL</th>
                      <th>EXAMS COMPLETED</th>
                      <th>ONGOING</th>
                      <th>AVG CPI</th>
                      <th>ANOMALIES</th>
                      <th>STATUS</th>
                      <th>LAST EXAM</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.id}</td>
                        <td className="fw-semibold">{student.studentId}</td>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>{student.examsCompleted}</td>
                        <td>{student.examsOngoing}</td>
                        <td>
                          <span className={`fw-bold ${getCPIColor(student.avgCPI)}`}>
                            {student.avgCPI}
                          </span>
                        </td>
                        <td>
                          {student.totalAnomalies > 0 ? (
                            <span className={`badge ${student.totalAnomalies > 5 ? 'bg-danger' : 'bg-warning'}`}>
                              {student.totalAnomalies}
                            </span>
                          ) : (
                            <span className="text-success">0</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(student.status)}`}>
                            {student.status}
                          </span>
                        </td>
                        <td>{student.lastExam}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" title="View Profile">
                              <i className="bi bi-eye"></i>
                            </button>
                            <button className="btn btn-outline-info" title="View History">
                              <i className="bi bi-clock-history"></i>
                            </button>
                            <button className="btn btn-outline-secondary" title="Edit">
                              <i className="bi bi-pencil"></i>
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

          {/* Additional Info */}
          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title mb-3">CPI Distribution</h6>
                  <div className="d-flex justify-content-around align-items-end" style={{ height: '150px' }}>
                    <div className="text-center">
                      <div className="bg-success mb-2" style={{ width: '60px', height: '120px' }}></div>
                      <small>Low (0-10%)</small>
                      <div className="fw-bold">65</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-warning mb-2" style={{ width: '60px', height: '70px' }}></div>
                      <small>Medium (11-30%)</small>
                      <div className="fw-bold">15</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-danger mb-2" style={{ width: '60px', height: '30px' }}></div>
                      <small>High (31%+)</small>
                      <div className="fw-bold">5</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title mb-3">Recent Activity</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2 pb-2 border-bottom">
                      <div className="d-flex justify-content-between">
                        <span><strong>Maria Santos</strong> started an exam</span>
                        <small className="text-muted">5 min ago</small>
                      </div>
                    </li>
                    <li className="mb-2 pb-2 border-bottom">
                      <div className="d-flex justify-content-between">
                        <span><strong>Carlos Reyes</strong> completed exam</span>
                        <small className="text-muted">15 min ago</small>
                      </div>
                    </li>
                    <li className="mb-2 pb-2 border-bottom">
                      <div className="d-flex justify-content-between">
                        <span><strong>Ana Rodriguez</strong> flagged for anomaly</span>
                        <small className="text-muted text-danger">30 min ago</small>
                      </div>
                    </li>
                    <li className="mb-2">
                      <div className="d-flex justify-content-between">
                        <span><strong>Isabel Garcia</strong> completed exam</span>
                        <small className="text-muted">1 hour ago</small>
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

export default Students;