// src/pages/instructor/Homepage.jsx
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
  // { to: "/instructor/reports",          icon: "bi-bar-chart",            label: "Reports"   },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

const Homepage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser]                   = useState(null);
  const [exams, setExams]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [pendingEssays, setPendingEssays] = useState([]);

  useEffect(() => {
    const boot = async () => {
      try {
        const [meRes, examsRes] = await Promise.all([
          API.get("/me"),
          API.get("/exams"),
        ]);
        setUser(meRes.data.user);
        const examList = examsRes.data.exams || [];
        setExams(examList);

        const completedExams = examList.filter((e) => e.status === "completed" || e.status === "active");
        const essayChecks = await Promise.allSettled(
          completedExams.map(async (exam) => {
            const res = await API.get(`/exams/${exam.id}/essays/stats`);
            return { exam, ...res.data };
          })
        );
        const withPending = essayChecks
          .filter((r) => r.status === "fulfilled" && r.value.has_essays && r.value.pending_count > 0)
          .map((r) => r.value);
        setPendingEssays(withPending);
      } catch (err) {
        console.error("Dashboard boot failed:", err);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/instructor/login");
  };

  const stats = {
    total:     exams.length,
    active:    exams.filter((e) => e.status === "active").length,
    scheduled: exams.filter((e) => e.status === "scheduled").length,
    completed: exams.filter((e) => e.status === "completed").length,
    draft:     exams.filter((e) => e.status === "draft").length,
  };
  const totalPendingEssays = pendingEssays.reduce((s, e) => s + e.pending_count, 0);

  const isActive = (to) =>
    to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

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
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </button>
                </li>
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
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : (
            <>
              <h4 className="mb-1 fw-bold">Dashboard</h4>
              <p className="text-muted mb-4">Welcome back, {user?.name || "Instructor"}</p>

              {/* Pending Essay Grading Alert */}
              {totalPendingEssays > 0 && (
                <div className="alert alert-warning border-warning d-flex align-items-start gap-3 mb-4 shadow-sm" role="alert">
                  <div className="flex-shrink-0 mt-1">
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 40, height: 40, borderRadius: "50%",
                      background: "rgba(255,193,7,0.2)", fontSize: 20,
                    }}>✍️</span>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="alert-heading mb-1 fw-bold">
                      {totalPendingEssays} essay answer{totalPendingEssays !== 1 ? "s" : ""} waiting for your review
                    </h6>
                    <p className="mb-2 small text-muted">
                      Students' scores won't be finalised until essays are graded. Click an exam below to grade them.
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      {pendingEssays.map(({ exam, pending_count }) => (
                        <Link
                          key={exam.id}
                          to={`/instructor/exams/${exam.id}`}
                          state={{ openEssayTab: true }}
                          className="btn btn-warning btn-sm"
                        >
                          <i className="bi bi-textarea me-1"></i>
                          {exam.title}
                          <span className="badge bg-dark ms-2">{pending_count}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close flex-shrink-0"
                    onClick={() => setPendingEssays([])}
                    aria-label="Dismiss"
                  />
                </div>
              )}

              {/* Stat Cards */}
              <div className="row g-3 mb-4">
                {[
                  { label: "Total Exams",   value: stats.total,     color: "primary", icon: "bi-file-earmark-text", sub: `${stats.draft} draft`  },
                  { label: "Active Now",    value: stats.active,    color: "success", icon: "bi-play-circle",        sub: "Currently running"     },
                  { label: "Scheduled",     value: stats.scheduled, color: "warning", icon: "bi-calendar-event",     sub: "Upcoming exams"        },
                  { label: "Completed",     value: stats.completed, color: "info",    icon: "bi-check-circle",       sub: "Past exams"            },
                  {
                    label: "Pending Essays",
                    value: totalPendingEssays,
                    color: totalPendingEssays > 0 ? "warning" : "secondary",
                    icon: "bi-textarea",
                    sub: totalPendingEssays > 0 ? "Need grading" : "All graded ✓",
                    link: totalPendingEssays > 0 ? "/instructor/exams" : null,
                  },
                ].map(({ label, value, color, icon, sub, link }) => (
                  <div key={label} className="col">
                    <div
                      className={`card shadow-sm border-0 border-start border-${color} border-4 h-100`}
                      style={{ cursor: link ? "pointer" : "default" }}
                      onClick={() => link && navigate(link)}
                    >
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

              {/* Recent Exams */}
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-semibold">
                    <i className="bi bi-clock-history me-2 text-primary"></i>Recent Exams
                  </h6>
                  <Link to="/instructor/exams" className="btn btn-sm btn-outline-primary">View All</Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>EXAM</th>
                        <th>COURSE</th>
                        <th>TYPE</th>
                        <th>STATUS</th>
                        <th>START</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.length === 0 ? (
                        <tr><td colSpan="6" className="text-center text-muted py-4">No exams yet.</td></tr>
                      ) : exams.slice(0, 8).map((exam) => {
                        const pendingForExam = pendingEssays.find((p) => p.exam.id === exam.id);
                        return (
                          <tr key={exam.id}>
                            <td>
                              <Link to={`/instructor/exams/${exam.id}`} className="fw-semibold text-decoration-none text-dark">
                                {exam.title}
                              </Link>
                              {pendingForExam && (
                                <span className="badge bg-warning text-dark ms-2" title="Pending essay grading">
                                  <i className="bi bi-textarea me-1"></i>{pendingForExam.pending_count} essays
                                </span>
                              )}
                            </td>
                            <td><small className="text-muted">{exam.course?.code}</small></td>
                            <td><span className="badge bg-secondary text-capitalize">{exam.type}</span></td>
                            <td>
                              <span className={`badge text-capitalize ${
                                exam.status === "active"    ? "bg-success" :
                                exam.status === "scheduled" ? "bg-warning text-dark" :
                                exam.status === "completed" ? "bg-info" : "bg-secondary"
                              }`}>{exam.status}</span>
                            </td>
                            <td><small className="text-muted">{new Date(exam.start_time).toLocaleString()}</small></td>
                            <td>
                              <Link to={`/instructor/exams/${exam.id}`} className="btn btn-sm btn-outline-primary">
                                <i className="bi bi-eye"></i>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Links */}
              <div className="row g-3">
                {[
                  { to: "/instructor/courses",  icon: "bi-book",               color: "primary", label: "Manage Courses",        sub: "Create and manage your courses"      },
                  { to: "/instructor/exams",    icon: "bi-plus-circle",        color: "success", label: "Create New Exam",       sub: "Set up a new exam for your students"  },
                  { to: "/instructor/alerts",   icon: "bi-shield-exclamation", color: "danger",  label: "Review Anomaly Alerts", sub: "Check for suspicious exam activity"   },
                  { to: "/instructor/students", icon: "bi-people",             color: "info",    label: "Manage Students",       sub: "View and enroll students"             },
                ].map(({ to, icon, color, label, sub }) => (
                  <div key={to} className="col-md-3">
                    <Link to={to} className="text-decoration-none">
                      <div
                        className={`card shadow-sm border-0 border-start border-${color} border-3 h-100`}
                        style={{ transition: "transform 0.15s, box-shadow 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                      >
                        <div className="card-body">
                          <i className={`bi ${icon} fs-3 text-${color} mb-2 d-block`}></i>
                          <h6 className="fw-semibold mb-1">{label}</h6>
                          <small className="text-muted">{sub}</small>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Homepage;