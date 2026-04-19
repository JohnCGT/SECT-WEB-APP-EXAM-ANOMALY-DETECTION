// src/pages/instructor/Reports.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import InstructorAlertBell from "../../components/InstructorAlertBell";

/* ─── Shared sidebar config ──────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/instructor",                  icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/instructor/courses",          icon: "bi-book",                 label: "Courses"   },
  { to: "/instructor/exams",            icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/instructor/students",         icon: "bi-people",               label: "Students"  },
  { to: "/instructor/alerts",           icon: "bi-exclamation-triangle", label: "Alerts"    },
  { to: "/instructor/reports",          icon: "bi-bar-chart",            label: "Reports"   },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

const Reports = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [user,       setUser]       = useState(null);
  const [reportType, setReportType] = useState("overview");

  useEffect(() => {
    API.get("/me").then((r) => setUser(r.data.user)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/");
  };

  const isActive = (to) =>
    to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

  /* ── Static sample data (replace with real API when endpoint is available) ── */
  const examReports = [
    { id: 1, title: "Midterm Exam - Data Structures",  date: "2026-02-15", students: 45, avgScore: "82%", avgCPI: "8%",  passRate: "91%", anomalyCount: 2 },
    { id: 2, title: "Final Exam - Algorithms",         date: "2026-02-10", students: 38, avgScore: "75%", avgCPI: "15%", passRate: "84%", anomalyCount: 5 },
    { id: 3, title: "Prelim Exam - Database Systems",  date: "2026-02-05", students: 41, avgScore: "88%", avgCPI: "12%", passRate: "95%", anomalyCount: 3 },
  ];

  const studentReports = [
    { rank: 1, name: "Isabel Garcia",   avgScore: "95%", examsTaken: 6, avgCPI: "2%",  anomalies: 0, reliability: "Excellent" },
    { rank: 2, name: "Juan Dela Cruz",  avgScore: "92%", examsTaken: 5, avgCPI: "3%",  anomalies: 1, reliability: "Excellent" },
    { rank: 3, name: "Ana Rodriguez",   avgScore: "88%", examsTaken: 6, avgCPI: "5%",  anomalies: 1, reliability: "Good"      },
    { rank: 4, name: "Sofia Martinez",  avgScore: "85%", examsTaken: 6, avgCPI: "8%",  anomalies: 2, reliability: "Good"      },
    { rank: 5, name: "Maria Santos",    avgScore: "80%", examsTaken: 4, avgCPI: "10%", anomalies: 2, reliability: "Average"   },
  ];

  const getReliabilityBadge = (r) =>
    ({ Excellent: "bg-success", Good: "bg-info", Average: "bg-warning text-dark", Poor: "bg-danger" }[r] ?? "bg-secondary");

  const getCPIColor = (cpi) => {
    const v = parseInt(cpi);
    return v < 10 ? "text-success" : v < 30 ? "text-warning" : "text-danger";
  };

  const REPORT_TABS = [
    { key: "overview",  label: "Overview"            },
    { key: "exams",     label: "Exam Reports"        },
    { key: "students",  label: "Student Performance" },
    { key: "anomalies", label: "Anomaly Analysis"    },
  ];

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="d-flex flex-column min-vh-100">

      {/* ── Navbar ── */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold text-primary" href="#">SECT Instructor</a>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <InstructorAlertBell />
            <div className="dropdown">
              <button className="btn btn-light dropdown-toggle fw-bold" type="button" data-bs-toggle="dropdown">
                <i className="bi bi-person-circle me-2"></i>{user?.name || "Instructor"}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><Link className="dropdown-item" to="/instructor/account-settings"><i className="bi bi-gear me-2"></i>Account Settings</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile"><i className="bi bi-person me-2"></i>Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="d-flex flex-grow-1">

        {/* ── Sidebar ── */}
        <nav className="bg-white border-end d-flex flex-column align-items-center py-3" style={{ width: 72, minHeight: "100%" }}>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <Link key={to} to={to}
              className={`nav-link d-flex flex-column align-items-center py-2 px-1 mb-2 rounded ${
                isActive(to) ? "text-primary bg-primary bg-opacity-10 fw-bold" : "text-secondary"
              }`}
              style={{ fontSize: 10, width: 56, textAlign: "center" }} title={label}>
              <i className={`bi ${icon} fs-5 mb-1`}></i>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* ── Main ── */}
        <div className="flex-grow-1 p-4 bg-light">

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-0 fw-bold">Analytics & Reports</h4>
              <p className="text-muted mb-0 small">Exam performance, detection metrics, and student analytics</p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary btn-sm">
                <i className="bi bi-file-earmark-pdf me-2"></i>Export PDF
              </button>
              <button className="btn btn-outline-primary btn-sm">
                <i className="bi bi-file-earmark-excel me-2"></i>Export Excel
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            {[
              { label: "Total Exams Analyzed", value: "12",    color: "primary", icon: "bi-file-earmark-text", sub: "↑ 20% from last month" },
              { label: "Average CPI Score",    value: "11%",   color: "success", icon: "bi-shield-check",       sub: "↓ 3% improvement"     },
              { label: "Detection Accuracy",   value: "96.5%", color: "info",    icon: "bi-cpu",                sub: "Combined algorithms"   },
              { label: "Students Flagged",     value: "7",     color: "danger",  icon: "bi-exclamation-circle", sub: "8.2% of total"        },
            ].map(({ label, value, color, icon, sub }) => (
              <div key={label} className="col-md-3">
                <div className={`card shadow-sm border-0 border-start border-${color} border-4`}>
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className={`bi ${icon} text-${color}`}></i>
                      <h6 className="card-title text-muted mb-0 small">{label}</h6>
                    </div>
                    <p className={`card-text display-6 fw-bold text-${color} mb-0`}>{value}</p>
                    <small className={`text-${color}`}>{sub}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tab Selector */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body py-2">
              <ul className="nav nav-tabs border-0">
                {REPORT_TABS.map(({ key, label }) => (
                  <li key={key} className="nav-item">
                    <button
                      className={`nav-link ${reportType === key ? "active fw-semibold" : "text-muted"}`}
                      onClick={() => setReportType(key)}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Overview ── */}
          {reportType === "overview" && (
            <div className="row g-3">
              <div className="col-md-8">
                {/* CPI Trend Chart */}
                <div className="card shadow-sm border-0 mb-3">
                  <div className="card-body">
                    <h6 className="card-title mb-3 fw-semibold">Cheating Probability Index Trends</h6>
                    <div className="d-flex justify-content-around align-items-end" style={{ height: 220 }}>
                      {[
                        { week: "Week 1", pct: "7%",  height: 160, color: "success" },
                        { week: "Week 2", pct: "9%",  height: 178, color: "success" },
                        { week: "Week 3", pct: "12%", height: 200, color: "warning" },
                        { week: "Week 4", pct: "11%", height: 188, color: "success" },
                        { week: "Week 5", pct: "8%",  height: 155, color: "success" },
                      ].map(({ week, pct, height, color }) => (
                        <div key={week} className="text-center">
                          <div className={`bg-${color} rounded-top mb-2 mx-auto`} style={{ width: 52, height }} />
                          <small className="text-muted d-block">{week}</small>
                          <div className={`fw-bold text-${color}`}>{pct}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Exam Summary Table */}
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white">
                    <h6 className="mb-0 fw-semibold">Exam Performance Summary</h6>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
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
                            <td className="text-muted small">{exam.date}</td>
                            <td>{exam.students}</td>
                            <td className="fw-bold text-primary">{exam.avgScore}</td>
                            <td><span className={`fw-bold ${getCPIColor(exam.avgCPI)}`}>{exam.avgCPI}</span></td>
                            <td>{exam.passRate}</td>
                            <td>
                              {exam.anomalyCount > 0
                                ? <span className="badge bg-warning text-dark">{exam.anomalyCount}</span>
                                : <span className="text-success fw-semibold">0</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                {/* Algorithm Performance */}
                <div className="card shadow-sm border-0 mb-3">
                  <div className="card-body">
                    <h6 className="card-title mb-3 fw-semibold">Algorithm Performance</h6>
                    {[
                      { name: "Isolation Forest (IF)", accuracy: 96.8, count: 245, color: "success" },
                      { name: "One-Class SVM",          accuracy: 94.2, count: 231, color: "primary" },
                    ].map(({ name, accuracy, count, color }) => (
                      <div key={name} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="fw-semibold small">{name}</span>
                          <span className={`text-${color} fw-bold small`}>{accuracy}%</span>
                        </div>
                        <div className="progress mb-1" style={{ height: 8 }}>
                          <div className={`progress-bar bg-${color}`} style={{ width: `${accuracy}%` }} />
                        </div>
                        <small className="text-muted">{count} anomalies detected</small>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Anomaly Types */}
                <div className="card shadow-sm border-0 mb-3">
                  <div className="card-body">
                    <h6 className="card-title mb-3 fw-semibold">Anomaly Types</h6>
                    {[
                      { label: "Tab Switching",         count: 35, color: "warning" },
                      { label: "Keyboard Patterns",     count: 18, color: "primary" },
                      { label: "Unusual Response Time", count: 28, color: "info"    },
                      { label: "Other",                 count: 12, color: "secondary"},
                    ].map(({ label, count, color }) => (
                      <div key={label} className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small">{label}</span>
                        <span className={`badge bg-${color}`}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Health */}
                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <h6 className="card-title mb-3 fw-semibold">System Health</h6>
                    <div className="d-flex justify-content-around text-center">
                      {["Detection", "Database", "API"].map((name) => (
                        <div key={name}>
                          <i className="bi bi-circle-fill text-success fs-4"></i>
                          <div className="small text-muted">{name}</div>
                          <div className="fw-bold text-success small">Online</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Exam Reports ── */}
          {reportType === "exams" && (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white">
                <h6 className="mb-0 fw-semibold">All Exam Reports</h6>
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
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
                        <td className="text-muted small">{exam.date}</td>
                        <td>{exam.students}</td>
                        <td className="fw-bold text-primary">{exam.avgScore}</td>
                        <td><span className={`fw-bold ${getCPIColor(exam.avgCPI)}`}>{exam.avgCPI}</span></td>
                        <td>{exam.passRate}</td>
                        <td>
                          {exam.anomalyCount > 0
                            ? <span className="badge bg-warning text-dark">{exam.anomalyCount}</span>
                            : <span className="text-success fw-semibold">0</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Student Performance ── */}
          {reportType === "students" && (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white">
                <h6 className="mb-0 fw-semibold">Top Performing Students</h6>
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>RANK</th>
                      <th>STUDENT</th>
                      <th>AVG SCORE</th>
                      <th>EXAMS TAKEN</th>
                      <th>AVG CPI</th>
                      <th>ANOMALIES</th>
                      <th>RELIABILITY</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentReports.map((s) => (
                      <tr key={s.rank}>
                        <td className="fw-bold text-muted">#{s.rank}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: 30, height: 30, fontSize: 12 }}
                            >
                              {s.name.charAt(0)}
                            </div>
                            <span className="fw-semibold">{s.name}</span>
                          </div>
                        </td>
                        <td className="text-primary fw-bold">{s.avgScore}</td>
                        <td>{s.examsTaken}</td>
                        <td><span className={`fw-bold ${getCPIColor(s.avgCPI)}`}>{s.avgCPI}</span></td>
                        <td>
                          {s.anomalies > 0
                            ? <span className="badge bg-warning text-dark">{s.anomalies}</span>
                            : <span className="text-success fw-semibold">0</span>}
                        </td>
                        <td><span className={`badge ${getReliabilityBadge(s.reliability)}`}>{s.reliability}</span></td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary">
                            <i className="bi bi-eye me-1"></i>Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Anomaly Analysis ── */}
          {reportType === "anomalies" && (
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <h6 className="card-title mb-3 fw-semibold">Detection Metrics</h6>
                    {[
                      { label: "True Positives",  value: "142",   pct: "85%", color: "success" },
                      { label: "False Positives", value: "18",    pct: "10%", color: "warning" },
                      { label: "True Negatives",  value: "1,235", pct: "95%", color: "success" },
                      { label: "False Negatives", value: "5",     pct: "3%",  color: "danger"  },
                    ].map(({ label, value, pct, color }) => (
                      <div key={label} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small">{label}</span>
                          <span className={`fw-bold text-${color} small`}>{value}</span>
                        </div>
                        <div className="progress" style={{ height: 8 }}>
                          <div className={`progress-bar bg-${color}`} style={{ width: pct }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <h6 className="card-title mb-3 fw-semibold">Performance Indicators</h6>
                    <div className="row g-3">
                      {[
                        { label: "Precision",    value: "96.5%", color: "success" },
                        { label: "Recall",       value: "96.6%", color: "success" },
                        { label: "F1-Score",     value: "96.5%", color: "primary" },
                        { label: "Specificity",  value: "98.4%", color: "info"    },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="col-6">
                          <div className="border rounded-3 p-3 text-center">
                            <div className={`display-6 fw-bold text-${color}`}>{value}</div>
                            <small className="text-muted">{label}</small>
                          </div>
                        </div>
                      ))}
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