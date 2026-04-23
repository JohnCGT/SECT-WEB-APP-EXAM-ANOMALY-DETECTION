// src/pages/instructor/ProfilePage.jsx
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

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user,       setUser]       = useState(null);
  const [exams,      setExams]      = useState([]);
  const [courses,    setCourses]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("about");

  const isActive = (to) =>
    to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

  /* ── Boot ── */
  useEffect(() => {
    const boot = async () => {
      try {
        const [meRes, examsRes, coursesRes] = await Promise.all([
          API.get("/me"),
          API.get("/exams"),
          API.get("/courses"),
        ]);
        setUser(meRes.data.user);
        setExams(examsRes.data.exams || []);
        setCourses(coursesRes.data.courses || []);
      } catch {
        // gracefully degrade
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    window.location.href = "/instructor/login";
  };

  /* ── Derived stats ── */
  const stats = {
    totalExams:    exams.length,
    activeCourses: courses.length,
    activeExams:   exams.filter((e) => e.status === "active").length,
    completedExams:exams.filter((e) => e.status === "completed").length,
  };

  const PROFILE_TABS = [
    { key: "about",    label: "About",          icon: "bi-person-lines-fill" },
    { key: "courses",  label: "Courses",         icon: "bi-book"              },
    { key: "activity", label: "Activity History",icon: "bi-clock-history"     },
  ];

  /* ── Loading ── */
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

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

          <div className="mb-4">
            <h4 className="mb-0 fw-bold">Instructor Profile</h4>
            <p className="text-muted mb-0 small">Your public profile and teaching summary</p>
          </div>

          {/* Profile Header Card */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center gap-4 flex-wrap">
                {/* Avatar */}
                <div className="position-relative flex-shrink-0">
                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{ width: 100, height: 100, fontSize: 36 }}>
                    {user?.name?.charAt(0).toUpperCase() || "I"}
                  </div>
                  <button className="btn btn-sm btn-light border position-absolute bottom-0 end-0 rounded-circle p-1"
                    style={{ width: 28, height: 28 }} title="Change photo">
                    <i className="bi bi-camera" style={{ fontSize: 12 }}></i>
                  </button>
                </div>

                {/* Info */}
                <div className="flex-grow-1">
                  <h5 className="fw-bold mb-0">{user?.name || "Instructor"}</h5>
                  <p className="text-muted mb-2 small">
                    <i className="bi bi-briefcase me-1"></i>Professor, Computer Science Department
                  </p>
                  <div className="d-flex flex-wrap gap-3">
                    <span className="small text-muted">
                      <i className="bi bi-envelope me-1 text-primary"></i>{user?.email || "—"}
                    </span>
                    <span className="small text-muted">
                      <i className="bi bi-building me-1 text-primary"></i>Computer Science
                    </span>
                    <span className="small text-muted">
                      <i className="bi bi-calendar me-1 text-primary"></i>
                      Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
                    </span>
                  </div>
                </div>

                <Link to="/instructor/account-settings" className="btn btn-outline-primary btn-sm flex-shrink-0">
                  <i className="bi bi-pencil me-1"></i>Edit Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            {[
              { label: "Total Exams Created", value: stats.totalExams,     color: "primary", icon: "bi-file-earmark-text", sub: `${stats.activeExams} currently active`     },
              { label: "Active Courses",      value: stats.activeCourses,  color: "info",    icon: "bi-book",               sub: "This semester"                             },
              { label: "Completed Exams",     value: stats.completedExams, color: "success", icon: "bi-check-circle",       sub: "All time"                                  },
              { label: "Detection Accuracy",  value: "96.5%",              color: "warning", icon: "bi-shield-check",       sub: "Avg across all exams"                      },
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

          {/* Detail Tabs */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
              <ul className="nav nav-tabs border-0">
                {PROFILE_TABS.map(({ key, label, icon }) => (
                  <li key={key} className="nav-item">
                    <button
                      className={`nav-link ${activeTab === key ? "active fw-semibold" : "text-muted"}`}
                      onClick={() => setActiveTab(key)}
                    >
                      <i className={`bi ${icon} me-2`}></i>{label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-body p-4">

              {/* ── About ── */}
              {activeTab === "about" && (
                <>
                  <h6 className="fw-semibold mb-2">Professional Bio</h6>
                  <p className="text-muted mb-4">
                    Professor in the Computer Science Department with extensive teaching experience. Specializes in
                    database systems, web development, and educational technology. Published research on online
                    learning assessment and academic integrity in digital environments.
                  </p>

                  <h6 className="fw-semibold mb-2">Research Interests</h6>
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {["Educational Technology", "Academic Integrity", "Machine Learning", "Web Development", "Database Systems"].map((t) => (
                      <span key={t} className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-semibold">
                        {t}
                      </span>
                    ))}
                  </div>

                  <h6 className="fw-semibold mb-2">Contact Information</h6>
                  <div className="row g-2">
                    {[
                      { icon: "bi-envelope",   label: "Email",               value: user?.email || "—"              },
                      { icon: "bi-geo-alt",    label: "Office",              value: "Room 305, Engineering Building" },
                      { icon: "bi-clock",      label: "Consultation Hours",  value: "Mon-Fri, 2:00 PM – 4:00 PM"   },
                    ].map(({ icon, label, value }) => (
                      <div key={label} className="col-md-6">
                        <div className="d-flex align-items-center gap-2">
                          <i className={`bi ${icon} text-primary`}></i>
                          <span className="small"><strong>{label}:</strong> {value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── Courses ── */}
              {activeTab === "courses" && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-semibold mb-0">Your Courses</h6>
                    <Link to="/instructor/courses" className="btn btn-sm btn-outline-primary">
                      <i className="bi bi-arrow-right me-1"></i>Manage Courses
                    </Link>
                  </div>
                  {courses.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-book fs-2 d-block mb-2 opacity-25"></i>
                      <p className="mb-0">No courses yet.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr><th>CODE</th><th>COURSE NAME</th><th>DESCRIPTION</th><th>EXAMS</th></tr>
                        </thead>
                        <tbody>
                          {courses.map((c) => {
                            const courseExams = exams.filter((e) => e.course_id === c.id);
                            return (
                              <tr key={c.id}>
                                <td>
                                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-semibold">
                                    {c.code}
                                  </span>
                                </td>
                                <td className="fw-semibold">
                                  <Link to={`/instructor/courses/${c.id}`} className="text-decoration-none text-dark">
                                    {c.name}
                                  </Link>
                                </td>
                                <td className="text-muted small">{c.description || "—"}</td>
                                <td>
                                  <span className="badge bg-secondary">{courseExams.length}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* ── Activity ── */}
              {activeTab === "activity" && (
                <>
                  <h6 className="fw-semibold mb-3">Recent Activity</h6>
                  {exams.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-clock-history fs-2 d-block mb-2 opacity-25"></i>
                      <p className="mb-0">No recent activity.</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {exams.slice(0, 8).map((exam) => (
                        <div key={exam.id} className="list-group-item px-0 py-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="d-flex gap-3">
                              <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
                                exam.status === "active" ? "bg-success bg-opacity-10" :
                                exam.status === "completed" ? "bg-info bg-opacity-10" : "bg-secondary bg-opacity-10"
                              }`} style={{ width: 36, height: 36 }}>
                                <i className={`bi ${
                                  exam.status === "active" ? "bi-play-circle text-success" :
                                  exam.status === "completed" ? "bi-check-circle text-info" :
                                  "bi-file-earmark-text text-secondary"
                                }`}></i>
                              </div>
                              <div>
                                <div className="fw-semibold small">{exam.title}</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>
                                  {exam.course?.code || ""} &middot;{" "}
                                  <span className={`badge ${
                                    exam.status === "active" ? "bg-success" :
                                    exam.status === "completed" ? "bg-info" :
                                    exam.status === "scheduled" ? "bg-warning text-dark" : "bg-secondary"
                                  } text-capitalize`}>{exam.status}</span>
                                </div>
                              </div>
                            </div>
                            <small className="text-muted flex-shrink-0">
                              {new Date(exam.created_at || exam.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
