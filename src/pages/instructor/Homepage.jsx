// src/pages/instructor/Homepage.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import InstructorAlertBell from "../../components/InstructorAlertBell";

/* ─── Shared Design Tokens (mirrors student Dashboard) ──────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{
    --blue:#0056b3;--blue-mid:#1a6ed8;--blue-lite:#e8f0fe;
    --slate:#64748b;--slate-lt:#94a3b8;
    --card-bg:#ffffff;--card-br:16px;
    --card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);
  }
  .dash-card{
    background:var(--card-bg);border-radius:var(--card-br);
    box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);
    transition:box-shadow .2s,transform .2s;overflow:hidden;
  }
  .dash-card:hover{box-shadow:0 2px 6px rgba(0,0,0,.06),0 8px 28px rgba(0,86,179,.10);transform:translateY(-1px);}
  .glass-sidebar{
    background:rgba(255,255,255,0.60);
    backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
    border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);
  }
  .nav-pill{
    display:flex;flex-direction:column;align-items:center;
    padding:10px 8px;border-radius:12px;gap:4px;
    font-size:11px;font-weight:600;text-decoration:none;
    color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;
  }
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .topbar{
    background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:100;height:56px;
  }
  .avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  .skeleton{
    background:linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);
    background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;
  }
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .stat-card{
    flex:1;min-width:0;background:#fff;border-radius:var(--card-br);
    box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);
    padding:18px 20px;transition:box-shadow .2s,transform .2s;
  }
  .stat-card:hover{box-shadow:0 2px 6px rgba(0,0,0,.06),0 8px 28px rgba(0,86,179,.10);transform:translateY(-1px);}
  .stat-card.clickable{cursor:pointer;}
  .quick-link{
    display:block;text-decoration:none;
    background:#fff;border-radius:var(--card-br);
    box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);
    padding:20px;transition:box-shadow .2s,transform .2s,border-color .2s;
  }
  .quick-link:hover{box-shadow:0 2px 6px rgba(0,0,0,.06),0 8px 28px rgba(0,86,179,.10);transform:translateY(-2px);border-color:rgba(0,86,179,.18);}
  .status-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}
  .bottom-nav{
    position:fixed;bottom:0;left:0;right:0;height:64px;
    background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);
    border-top:1px solid rgba(0,86,179,.10);
    display:flex;align-items:stretch;z-index:1030;
    box-shadow:0 -4px 24px rgba(0,86,179,.08);
  }
  .bottom-nav-item{
    flex:1;display:flex;flex-direction:column;align-items:center;
    justify-content:center;font-size:10px;font-weight:600;gap:3px;
    text-decoration:none;transition:color .2s;
  }
  .bottom-nav-item i{font-size:19px;}
  @media(max-width:991px){.main-content{padding:16px 12px 88px!important;}}
  @media(max-width:575px){
    .stats-grid{grid-template-columns:1fr 1fr!important;}
    .quick-links-grid{grid-template-columns:1fr 1fr!important;}
  }
`;

const NAV_ITEMS = [
  { to: "/instructor",                  icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/instructor/courses",          icon: "bi-book",                 label: "Courses"   },
  { to: "/instructor/exams",            icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/instructor/students",         icon: "bi-people",               label: "Students"  },
  { to: "/instructor/alerts",           icon: "bi-exclamation-triangle", label: "Alerts"    },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

const STATUS_STYLES = {
  active:    { bg: "#f0fdf4", color: "#15803d" },
  scheduled: { bg: "#fff7ed", color: "#c2410c" },
  completed: { bg: "#eff6ff", color: "#1d4ed8" },
  draft:     { bg: "#f8faff", color: "#64748b" },
};

const Homepage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser]                   = useState(null);
  const [exams, setExams]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [pendingEssays, setPendingEssays] = useState([]);
  const [dismissAlert, setDismissAlert]   = useState(false);

  useEffect(() => {
    const boot = async () => {
      try {
        const [meRes, examsRes] = await Promise.all([API.get("/me"), API.get("/exams")]);
        setUser(meRes.data.user);
        const examList = examsRes.data.exams || [];
        setExams(examList);
        const completedExams = examList.filter(e => e.status === "completed" || e.status === "active");
        const essayChecks = await Promise.allSettled(
          completedExams.map(async exam => {
            const res = await API.get(`/exams/${exam.id}/essays/stats`);
            return { exam, ...res.data };
          })
        );
        setPendingEssays(
          essayChecks
            .filter(r => r.status === "fulfilled" && r.value.has_essays && r.value.pending_count > 0)
            .map(r => r.value)
        );
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
    window.location.href = "/instructor/login";
  };

  const isActive = to => to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);
  const firstName = user?.name?.split(" ")[0] ?? "Instructor";
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "I";

  const stats = exams ? {
    total:     exams.length,
    active:    exams.filter(e => e.status === "active").length,
    scheduled: exams.filter(e => e.status === "scheduled").length,
    completed: exams.filter(e => e.status === "completed").length,
    draft:     exams.filter(e => e.status === "draft").length,
  } : null;

  const totalPendingEssays = pendingEssays.reduce((s, e) => s + e.pending_count, 0);

  const STAT_CARDS = stats ? [
    { label: "Total Exams",    value: stats.total,     color: "#0056b3", bg: "#e8f0fe", icon: "bi-file-earmark-text", sub: `${stats.draft} draft`  },
    { label: "Active Now",     value: stats.active,    color: "#15803d", bg: "#f0fdf4", icon: "bi-play-circle",        sub: "Currently running"     },
    { label: "Scheduled",      value: stats.scheduled, color: "#c2410c", bg: "#fff7ed", icon: "bi-calendar-event",     sub: "Upcoming exams"        },
    { label: "Completed",      value: stats.completed, color: "#1d4ed8", bg: "#eff6ff", icon: "bi-check-circle",       sub: "Past exams"            },
    {
      label: "Pending Essays",
      value: totalPendingEssays,
      color: totalPendingEssays > 0 ? "#c2410c" : "#64748b",
      bg:    totalPendingEssays > 0 ? "#fff7ed" : "#f8faff",
      icon:  "bi-textarea",
      sub:   totalPendingEssays > 0 ? "Need grading" : "All graded ✓",
      link:  totalPendingEssays > 0 ? "/instructor/exams" : null,
    },
  ] : null;

  const QUICK_LINKS = [
    { to: "/instructor/courses",  icon: "bi-book",               color: "#0056b3", bg: "#e8f0fe", label: "Manage Courses",        sub: "Create and manage your courses"      },
    { to: "/instructor/exams",    icon: "bi-plus-circle",        color: "#15803d", bg: "#f0fdf4", label: "Create New Exam",       sub: "Set up a new exam for students"      },
    { to: "/instructor/alerts",   icon: "bi-shield-exclamation", color: "#dc2626", bg: "#fef2f2", label: "Anomaly Alerts",        sub: "Check for suspicious exam activity"  },
    { to: "/instructor/students", icon: "bi-people",             color: "#1d4ed8", bg: "#eff6ff", label: "Manage Students",       sub: "View and enroll students"            },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* ── Topbar ── */}
        <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
            SECT Instructor
          </span>
          <div className="ms-auto d-flex align-items-center gap-2">
            <InstructorAlertBell />
            <div className="dropdown">
              <button className="d-flex align-items-center gap-2 dropdown-toggle"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }}
                data-bs-toggle="dropdown">
                <div className="avatar">{initial}</div>
                <span className="d-none d-sm-inline" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{firstName}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
                <li><Link className="dropdown-item" to="/instructor/account-settings"><i className="bi bi-gear me-2"></i>Account Settings</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile"><i className="bi bi-person me-2"></i>Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout} style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}><i className="bi bi-box-arrow-right me-2"></i>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-stretch">

          {/* ── Sidebar ── */}
          <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
            style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}>
            {NAV_ITEMS.map(({ to, icon, label }) => (
              <Link key={to} to={to} className={`nav-pill ${isActive(to) ? "active" : ""}`}>
                <i className={`bi ${icon}`}></i>{label}
              </Link>
            ))}
          </nav>

          {/* ── Main ── */}
          <main className="main-content" style={{ flex: 1, padding: "24px 20px", paddingBottom: 100, minWidth: 0 }}>

            {/* Greeting */}
            <div className="mb-4 fade-up">
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Welcome back,</p>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px", lineHeight: 1.2 }}>
                {user?.name ?? "Instructor"} 👋
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                {user ? user.email : "Loading your profile…"}
              </p>
            </div>

            {/* Pending Essays Alert */}
            {totalPendingEssays > 0 && !dismissAlert && (
              <div className="dash-card fade-up mb-4" style={{ padding: "16px 20px", borderLeft: "4px solid #f59e0b", background: "#fffbeb" }}>
                <div className="d-flex align-items-start gap-3">
                  <span style={{ fontSize: 24, flexShrink: 0 }}>✍️</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#92400e" }}>
                      {totalPendingEssays} essay answer{totalPendingEssays !== 1 ? "s" : ""} waiting for review
                    </p>
                    <p style={{ margin: "0 0 10px", fontSize: 12, color: "#78350f" }}>
                      Scores won't be finalised until essays are graded.
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      {pendingEssays.map(({ exam, pending_count }) => (
                        <Link key={exam.id} to={`/instructor/exams/${exam.id}`} state={{ openEssayTab: true }}
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: "#f59e0b", color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
                          <i className="bi bi-textarea"></i>{exam.title}
                          <span style={{ background: "rgba(0,0,0,.2)", borderRadius: 99, padding: "1px 6px", fontSize: 10 }}>{pending_count}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setDismissAlert(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#92400e", fontSize: 16, flexShrink: 0 }}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Stat Cards */}
            {loading ? (
              <div className="fade-up mb-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
                {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 96, borderRadius: 16 }} />)}
              </div>
            ) : (
              <div className="fade-up mb-4 stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
                {STAT_CARDS.map(({ label, value, color, bg, icon, sub, link }) => (
                  <div key={label} className={`stat-card${link ? " clickable" : ""}`}
                    onClick={() => link && navigate(link)}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      <i className={`bi ${icon}`} style={{ color, fontSize: 15 }}></i>
                    </div>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{sub}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Exams */}
            <div className="dash-card fade-up mb-4">
              <div className="d-flex justify-content-between align-items-center p-4 pb-0">
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>🕐 Recent Exams</h2>
                <Link to="/instructor/exams" style={{ fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
              </div>

              {loading ? (
                <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ display: "flex", gap: 12 }}>
                      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: 12, width: "55%", marginBottom: 8 }} />
                        <div className="skeleton" style={{ height: 10, width: "35%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !exams || exams.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                  <i className="bi bi-file-earmark-text" style={{ fontSize: 28, display: "block", marginBottom: 8 }}></i>
                  <span style={{ fontSize: 13 }}>No exams yet. Create your first exam!</span>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                        {["Exam", "Course", "Type", "Status", "Start Time", ""].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", textTransform: "uppercase", background: "#f8faff" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {exams.slice(0, 8).map(exam => {
                        const pendingForExam = pendingEssays.find(p => p.exam.id === exam.id);
                        const st = STATUS_STYLES[exam.status] ?? STATUS_STYLES.draft;
                        return (
                          <tr key={exam.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Link to={`/instructor/exams/${exam.id}`} style={{ fontWeight: 700, color: "#1e293b", textDecoration: "none" }}>{exam.title}</Link>
                                {pendingForExam && (
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "#fff7ed", color: "#c2410c" }}>
                                    {pendingForExam.pending_count} essays
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>{exam.course?.code}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#f1f5f9", color: "#64748b", textTransform: "capitalize" }}>{exam.type}</span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span className="status-badge" style={{ background: st.bg, color: st.color }}>{exam.status}</span>
                            </td>
                            <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>{new Date(exam.start_time).toLocaleString()}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <Link to={`/instructor/exams/${exam.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(0,86,179,.2)", color: "#0056b3", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                                <i className="bi bi-eye"></i>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="fade-up">
              <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>⚡ Quick Actions</h2>
              <div className="quick-links-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
                {QUICK_LINKS.map(({ to, icon, color, bg, label, sub }) => (
                  <Link key={to} to={to} className="quick-link">
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <i className={`bi ${icon}`} style={{ color, fontSize: 18 }}></i>
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{sub}</p>
                  </Link>
                ))}
              </div>
            </div>
          </main>
        </div>

        {/* ── Bottom Nav (mobile) ── */}
        <nav className="bottom-nav d-lg-none">
          {NAV_ITEMS.slice(0,5).map(({ to, icon, label }) => (
            <Link key={to} to={to} className="bottom-nav-item"
              style={{ color: isActive(to) ? "#0056b3" : "#94a3b8", borderTop: isActive(to) ? "2px solid #0056b3" : "2px solid transparent" }}>
              <i className={`bi ${icon}`}></i>{label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Homepage;