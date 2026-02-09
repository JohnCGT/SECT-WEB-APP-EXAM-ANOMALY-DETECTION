import React from "react";
import { Link } from "react-router-dom";

const GradesPage = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold text-primary d-flex align-items-center gap-2">
            🎓 SECT Student Portal
          </span>

          {/* Search */}
          <form className="d-flex mx-auto" style={{ width: "38%" }}>
            <input
              className="form-control rounded-pill px-4"
              type="search"
              placeholder="Search grades..."
            />
          </form>

          {/* Profile */}
          <div className="dropdown">
            <button
              className="btn btn-light rounded-pill px-3 d-flex align-items-center gap-2 shadow-sm"
              data-bs-toggle="dropdown"
            >
              <span
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32 }}
              >
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
          className="bg-white border-end shadow-sm"
          style={{ width: "110px", minHeight: "100%" }}
        >
          <ul className="nav flex-column p-3 align-items-center gap-2">
            <li className="nav-item w-100">
              <Link
                to="/student"
                className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4"
              >
                <i className="bi bi-speedometer2 fs-4 mb-1"></i>
                <span>Home</span>
              </Link>
            </li>

            <li className="nav-item w-100">
              <Link
                to="/student/subjects"
                className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4"
              >
                <i className="bi bi-journal-bookmark fs-4 mb-1"></i>
                <span>Subjects</span>
              </Link>
            </li>

            <li className="nav-item w-100">
              <Link
                to="/student/tasks"
                className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4"
              >
                <i className="bi bi-pencil-square fs-4 mb-1"></i>
                <span>Tasks</span>
              </Link>
            </li>

            <li className="nav-item w-100">
              <Link
                to="/student/grades"
                className="nav-link active bg-primary text-white rounded-4 fw-semibold d-flex flex-column align-items-center py-3 shadow-sm"
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
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold mb-1">📊 Academic Performance</h4>
              <small className="text-muted">
                Grades & Analytics • Current Semester
              </small>
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-secondary rounded-pill">
                <i className="bi bi-printer me-1"></i>
                Print
              </button>
              <button className="btn btn-sm btn-primary rounded-pill">
                <i className="bi bi-download me-1"></i>
                Export Transcript
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
                <small className="text-uppercase text-muted fw-semibold">
                  Overall GPA
                </small>
                <h2 className="fw-bold mt-2 mb-0">3.84</h2>
                <small className="text-success fw-semibold">▲ +0.2</small>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
                <small className="text-uppercase text-muted fw-semibold">
                  Credits Earned
                </small>
                <h2 className="fw-bold mt-2 mb-1">92 / 120</h2>
                <div className="progress" style={{ height: 6 }}>
                  <div
                    className="progress-bar bg-dark"
                    style={{ width: "76%" }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
                <small className="text-uppercase text-muted fw-semibold">
                  Class Rank
                </small>
                <h2 className="fw-bold mt-2 mb-0">#14</h2>
                <small className="text-muted">Top 5%</small>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-primary text-white">
                <small className="text-uppercase text-white-50 fw-semibold">
                  Status
                </small>
                <h5 className="fw-bold mt-2 mb-0">Dean’s List</h5>
                <small className="text-white-50">
                  Maintained for 3 semesters
                </small>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Left Column */}
            <div className="col-lg-8">
              {/* Toolbar */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Current Semester Grades</h6>
                <div className="btn-group btn-group-sm">
                  <button className="btn btn-primary">Grades</button>
                </div>
              </div>

              {/* Grades Table */}
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr className="small text-uppercase text-muted">
                        <th>Course</th>
                        <th>Midterm</th>
                        <th>Finals</th>
                        <th>Assignments</th>
                        <th className="text-end">Total</th>
                        <th className="text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                              <i className="bi bi-code-slash"></i>
                            </div>
                            <div>
                              <div className="fw-semibold">Data Structures</div>
                              <small className="text-muted">CS-101</small>
                            </div>
                          </div>
                        </td>
                        <td>88 / 100</td>
                        <td className="text-muted fst-italic">Pending</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: 6 }}>
                              <div className="progress-bar bg-primary" style={{ width: "95%" }}></div>
                            </div>
                            <small className="fw-semibold">95%</small>
                          </div>
                        </td>
                        <td className="text-end fw-semibold">92.5%</td>
                        <td className="text-center">
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            A
                          </span>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="bg-warning-subtle text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                              <i className="bi bi-database"></i>
                            </div>
                            <div>
                              <div className="fw-semibold">Database Mgmt</div>
                              <small className="text-muted">DB-202</small>
                            </div>
                          </div>
                        </td>
                        <td>76 / 100</td>
                        <td className="text-muted fst-italic">Pending</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: 6 }}>
                              <div className="progress-bar bg-warning" style={{ width: "82%" }}></div>
                            </div>
                            <small className="fw-semibold">82%</small>
                          </div>
                        </td>
                        <td className="text-end fw-semibold">79.2%</td>
                        <td className="text-center">
                          <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                            B+
                          </span>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="bg-danger-subtle text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                              <i className="bi bi-palette"></i>
                            </div>
                            <div>
                              <div className="fw-semibold">UI / UX Principles</div>
                              <small className="text-muted">DS-301</small>
                            </div>
                          </div>
                        </td>
                        <td>94 / 100</td>
                        <td className="text-muted fst-italic">Pending</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: 6 }}>
                              <div className="progress-bar bg-danger" style={{ width: "98%" }}></div>
                            </div>
                            <small className="fw-semibold">98%</small>
                          </div>
                        </td>
                        <td className="text-end fw-semibold">96.4%</td>
                        <td className="text-center">
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            A+
                          </span>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                              <i className="bi bi-hdd-network"></i>
                            </div>
                            <div>
                              <div className="fw-semibold">System Architecture II</div>
                              <small className="text-muted">SA-400</small>
                            </div>
                          </div>
                        </td>
                        <td>81 / 100</td>
                        <td className="text-muted fst-italic">Pending</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: 6 }}>
                              <div className="progress-bar bg-success" style={{ width: "88%" }}></div>
                            </div>
                            <small className="fw-semibold">88%</small>
                          </div>
                        </td>
                        <td className="text-end fw-semibold">84.5%</td>
                        <td className="text-center">
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                            A-
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top bg-light small">
                  <span className="text-muted">Last updated: Just now</span>
                  <button className="btn btn-sm btn-link fw-semibold">
                    View Full Grade Breakdown →
                  </button>
                </div>
              </div>

              {/* History */}
              <h6 className="fw-bold mb-3">History</h6>

              <div className="card border-0 shadow-sm rounded-4 p-3 mb-2 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                    <span className="fw-semibold small">S22</span>
                  </div>
                  <div>
                    <div className="fw-semibold small">Spring Semester 2022</div>
                    <small className="text-muted">GPA: 3.92 • 18 Credits</small>
                  </div>
                </div>
                <i className="bi bi-chevron-down text-muted"></i>
              </div>

              <div className="card border-0 shadow-sm rounded-4 p-3 mb-2 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                    <span className="fw-semibold small">F21</span>
                  </div>
                  <div>
                    <div className="fw-semibold small">Fall Semester 2021</div>
                    <small className="text-muted">GPA: 3.75 • 16 Credits</small>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-lg-4">
              {/* GPA Trend */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0">GPA Trend</h6>
                  <i className="bi bi-graph-up text-muted"></i>
                </div>

                <div className="d-flex align-items-end justify-content-between gap-2" style={{ height: 160 }}>
                  {[80, 85, 92, 90, 96].map((h, i) => (
                    <div key={i} className="flex-grow-1 text-center">
                      <div
                        className={`w-100 rounded-top ${i === 4 ? "bg-dark" : "bg-primary-subtle"}`}
                        style={{ height: `${h}%`, minHeight: 20 }}
                      ></div>
                      <small className={`d-block mt-2 ${i === 4 ? "fw-bold text-dark" : "text-muted"}`}>
                        {["Y1 S1", "Y1 S2", "Y2 S1", "Y2 S2", "Now"][i]}
                      </small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Assessments */}
              <div className="card border-0 shadow-sm rounded-4 p-4">
                <h6 className="fw-bold mb-3">Upcoming Assessments</h6>
                <ul className="list-unstyled mb-0">
                  <li className="d-flex justify-content-between align-items-center mb-2 small">
                    <div className="d-flex align-items-center gap-2">
                      <span className="bg-primary rounded-circle" style={{ width: 8, height: 8 }}></span>
                      Algo Final Exam
                    </div>
                    <span className="text-muted">Dec 12</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-center mb-2 small">
                    <div className="d-flex align-items-center gap-2">
                      <span className="bg-warning rounded-circle" style={{ width: 8, height: 8 }}></span>
                      DB Project Demo
                    </div>
                    <span className="text-muted">Dec 15</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-center small">
                    <div className="d-flex align-items-center gap-2">
                      <span className="bg-danger rounded-circle" style={{ width: 8, height: 8 }}></span>
                      Portfolio Review
                    </div>
                    <span className="text-muted">Dec 18</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradesPage;