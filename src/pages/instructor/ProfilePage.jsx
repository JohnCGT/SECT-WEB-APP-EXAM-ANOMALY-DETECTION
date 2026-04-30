// src/pages/instructor/ProfilePage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import InstructorAlertBell from "../../components/InstructorAlertBell";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{--blue:#0056b3;--blue-lite:#e8f0fe;--slate:#64748b;--card-bg:#fff;--card-br:16px;--card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);}
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;transition:box-shadow .2s,transform .2s;}
  .glass-sidebar{background:rgba(255,255,255,0.60);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);}
  .nav-pill{display:flex;flex-direction:column;align-items:center;padding:10px 8px;border-radius:12px;gap:4px;font-size:11px;font-weight:600;text-decoration:none;color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;}
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .topbar{background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:100;height:56px;}
  .avatar-sm{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .stat-chip{flex:1;min-width:140px;background:#fff;border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);padding:16px 18px;}
  .tab-btn{padding:10px 18px;border:none;background:none;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;border-bottom:2px solid transparent;font-family:'DM Sans',sans-serif;transition:color .15s,border-color .15s;}
  .tab-btn.active{color:#0056b3;border-bottom-color:#0056b3;}
  .activity-dot{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .btn-outline-dash{display:inline-flex;align-items:center;gap:6px;background:transparent;color:#0056b3;border:1.5px solid rgba(0,86,179,.25);border-radius:10px;padding:7px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:none;transition:background .15s;}
  .btn-outline-dash:hover{background:var(--blue-lite);}
  .status-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}
  .filter-select{border:1.5px solid rgba(0,86,179,.15);border-radius:8px;padding:5px 10px;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;color:#374151;background:#f8faff;outline:none;cursor:pointer;}
  .filter-select:focus{border-color:#0056b3;}
  .sort-btn{display:inline-flex;align-items:center;gap:5px;background:transparent;color:#64748b;border:1.5px solid rgba(0,86,179,.15);border-radius:8px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s,color .15s;}
  .sort-btn:hover{background:var(--blue-lite);color:#0056b3;border-color:#0056b3;}
  .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,.08);}
  .bottom-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bottom-nav-item i{font-size:19px;}
  @media(max-width:991px){.main-content{padding:16px 12px 88px!important;}}
  @media(max-width:767px){.profile-header{flex-direction:column!important;}.stats-row{flex-wrap:wrap!important;}.activity-controls{flex-wrap:wrap!important;}}
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
  completed: { bg: "#eff6ff", color: "#1d4ed8" },
  scheduled: { bg: "#fff7ed", color: "#c2410c" },
  draft:     { bg: "#f1f5f9", color: "#64748b" },
};

// Returns initials from a full name: "John Doe" → "JD", "Alice" → "A"
const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "I";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user,      setUser]      = useState(null);
  const [exams,     setExams]     = useState([]);
  const [courses,   setCourses]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("courses");

  // Activity controls
  const [sortOrder,     setSortOrder]     = useState("desc"); // "asc" | "desc"
  const [filterType,    setFilterType]    = useState("all");  // "all" | "course" | "exam"
  const [filterCourse,  setFilterCourse]  = useState("all");  // course id or "all"

  const isActive  = to => to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);
  const initials  = getInitials(user?.name);
  const firstName = user?.name?.split(" ")[0] ?? "Instructor";

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
    window.location.href = "/instructor/login";
  };

  const stats = {
    totalExams:     exams.length,
    activeCourses:  courses.length,
    activeExams:    exams.filter(e => e.status === "active").length,
    completedExams: exams.filter(e => e.status === "completed").length,
  };

  const STAT_CHIPS = [
    { label: "Total Exams Created", value: stats.totalExams,     color: "#0056b3", bg: "#e8f0fe", icon: "bi-file-earmark-text", sub: `${stats.activeExams} currently active`  },
    { label: "Active Courses",      value: stats.activeCourses,  color: "#1d4ed8", bg: "#eff6ff", icon: "bi-book",               sub: "This semester"                          },
    { label: "Completed Exams",     value: stats.completedExams, color: "#15803d", bg: "#f0fdf4", icon: "bi-check-circle",       sub: "All time"                               },
  ];

  const PROFILE_TABS = [
    { key: "courses",  label: "Courses",          icon: "bi-book"          },
    { key: "activity", label: "Activity History", icon: "bi-clock-history" },
  ];

  // Filtered + sorted activity list
  const activityItems = useMemo(() => {
    let items = [...exams];

    if (filterType === "course") {
      // Show only items that are courses (map courses as pseudo-activity)
      items = courses.map(c => ({
        id:         `c-${c.id}`,
        title:      c.name,
        status:     "active",
        created_at: c.created_at,
        _type:      "course",
        course:     { code: c.code },
      }));
    } else if (filterType === "exam") {
      items = exams.map(e => ({ ...e, _type: "exam" }));
    } else {
      items = [
        ...exams.map(e => ({ ...e, _type: "exam" })),
        ...courses.map(c => ({
          id:         `c-${c.id}`,
          title:      c.name,
          status:     "active",
          created_at: c.created_at,
          _type:      "course",
          course:     { code: c.code },
        })),
      ];
    }

    // Filter by course
    if (filterCourse !== "all") {
      items = items.filter(item =>
        item._type === "exam" && String(item.course_id) === String(filterCourse)
      );
    }

    // Sort by date
    items.sort((a, b) => {
      const da = new Date(a.created_at || a.start_time || 0).getTime();
      const db = new Date(b.created_at || b.start_time || 0).getTime();
      return sortOrder === "desc" ? db - da : da - db;
    });

    return items;
  }, [exams, courses, filterType, filterCourse, sortOrder]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day:   "numeric",
      year:  "numeric",
      hour:  "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div className="spinner-border" style={{ color: "#0056b3" }} role="status"></div>
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* Topbar */}
        <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>SECT Instructor</span>
          <div className="ms-auto d-flex align-items-center gap-2">
            <InstructorAlertBell />
            <div className="dropdown">
              <button className="d-flex align-items-center gap-2 dropdown-toggle" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }} data-bs-toggle="dropdown">
                <div className="avatar-sm">{firstName.charAt(0).toUpperCase()}</div>
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
          {/* Sidebar */}
          <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
            style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}>
            {NAV_ITEMS.map(({ to, icon, label }) => (
              <Link key={to} to={to} className={`nav-pill ${isActive(to) ? "active" : ""}`}>
                <i className={`bi ${icon}`}></i>{label}
              </Link>
            ))}
          </nav>

          {/* Main */}
          <main className="main-content" style={{ flex: 1, padding: "24px 20px", paddingBottom: 100, minWidth: 0 }}>

            <div className="fade-up mb-4">
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>👤 Instructor Profile</h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Your public profile and teaching summary</p>
            </div>

            {/* Profile header card */}
            <div className="dash-card fade-up mb-4" style={{ padding: 24 }}>
              <div className="profile-header" style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                {/* Initials avatar — no upload */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: "50%",
                    background: "#0056b3", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 32, fontWeight: 700, letterSpacing: "-.5px",
                    userSelect: "none",
                  }}>
                    {initials}
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{user?.name || "Instructor"}</h2>
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: "#64748b" }}>
                    <i className="bi bi-briefcase me-1"></i>Instructor, Emilio Aguinaldo College
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      <i className="bi bi-envelope me-1" style={{ color: "#0056b3" }}></i>{user?.email || "—"}
                    </span>
                  </div>
                </div>

                <Link to="/instructor/account-settings" className="btn-outline-dash" style={{ flexShrink: 0 }}>
                  <i className="bi bi-pencil"></i>Edit Profile
                </Link>
              </div>
            </div>

            {/* Stat chips */}
            <div className="stats-row fade-up" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {STAT_CHIPS.map(({ label, value, color, bg, icon, sub }) => (
                <div key={label} className="stat-chip">
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <i className={`bi ${icon}`} style={{ color, fontSize: 14 }}></i>
                  </div>
                  <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                  <p style={{ margin: "4px 0 2px", fontSize: 11, fontWeight: 600, color: "#0f172a" }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="dash-card fade-up">
              <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "0 8px", overflowX: "auto" }}>
                {PROFILE_TABS.map(({ key, label, icon }) => (
                  <button key={key} className={`tab-btn ${activeTab === key ? "active" : ""}`} onClick={() => setActiveTab(key)}>
                    <i className={`bi ${icon} me-2`}></i>{label}
                  </button>
                ))}
              </div>

              <div style={{ padding: 24 }}>

                {/* ── Courses ── */}
                {activeTab === "courses" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Your Courses</h3>
                      <Link to="/instructor/courses" className="btn-outline-dash"><i className="bi bi-arrow-right"></i>Manage Courses</Link>
                    </div>
                    {courses.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                        <i className="bi bi-book" style={{ fontSize: 32, display: "block", marginBottom: 10, opacity: .3 }}></i>
                        <p style={{ margin: 0, fontSize: 13 }}>No courses yet.</p>
                      </div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: "#f8faff", borderBottom: "1px solid #f1f5f9" }}>
                              {["Code","Course Name","Description","Exams"].map(h => (
                                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {courses.map(c => {
                              const courseExams = exams.filter(e => e.course_id === c.id);
                              return (
                                <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                  <td style={{ padding: "12px 16px" }}>
                                    <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "#e8f0fe", color: "#0056b3" }}>{c.code}</span>
                                  </td>
                                  <td style={{ padding: "12px 16px" }}>
                                    <Link to={`/instructor/courses/${c.id}`} style={{ fontWeight: 600, color: "#1e293b", textDecoration: "none" }}>{c.name}</Link>
                                  </td>
                                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>{c.description || "—"}</td>
                                  <td style={{ padding: "12px 16px" }}>
                                    <span style={{ display: "inline-flex", padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#64748b" }}>{courseExams.length}</span>
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
                    {/* Controls row */}
                    <div className="activity-controls" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a", flex: 1, minWidth: 120 }}>Recent Activity</h3>

                      {/* Sort toggle */}
                      <button className="sort-btn" onClick={() => setSortOrder(o => o === "desc" ? "asc" : "desc")}>
                        <i className={`bi bi-sort-${sortOrder === "desc" ? "down" : "up"}`}></i>
                        {sortOrder === "desc" ? "Newest first" : "Oldest first"}
                      </button>

                      {/* Type filter */}
                      <select className="filter-select" value={filterType} onChange={e => { setFilterType(e.target.value); setFilterCourse("all"); }}>
                        <option value="all">All types</option>
                        <option value="exam">Exams only</option>
                        <option value="course">Courses only</option>
                      </select>

                      {/* Course filter (only for exams) */}
                      {(filterType === "all" || filterType === "exam") && courses.length > 0 && (
                        <select className="filter-select" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
                          <option value="all">All courses</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {activityItems.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                        <i className="bi bi-clock-history" style={{ fontSize: 32, display: "block", marginBottom: 10, opacity: .3 }}></i>
                        <p style={{ margin: 0, fontSize: 13 }}>No activity found.</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {activityItems.map(item => {
                          const isExam   = item._type === "exam";
                          const st       = STATUS_STYLES[item.status] ?? STATUS_STYLES.draft;
                          const dotBg    = item.status === "active" ? "#f0fdf4" : item.status === "completed" ? "#eff6ff" : "#f1f5f9";
                          const dotColor = item.status === "active" ? "#22c55e" : item.status === "completed" ? "#3b82f6" : "#94a3b8";
                          const dotIcon  = isExam
                            ? (item.status === "active" ? "bi-play-circle" : item.status === "completed" ? "bi-check-circle" : "bi-file-earmark-text")
                            : "bi-book";
                          const dateStr  = item.created_at || item.start_time;

                          return (
                            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f1f5f9", gap: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                                <div className="activity-dot" style={{ background: dotBg, flexShrink: 0 }}>
                                  <i className={`bi ${dotIcon}`} style={{ color: dotColor, fontSize: 15 }}></i>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</p>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                                    {item.course?.code && (
                                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{item.course.code}</span>
                                    )}
                                    <span className="status-badge" style={{ background: st.bg, color: st.color }}>{item.status}</span>
                                    <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>
                                      {isExam ? "Exam" : "Course"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0, textAlign: "right", whiteSpace: "nowrap" }}>
                                {formatDateTime(dateStr)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Bottom Nav */}
        <nav className="bottom-nav d-lg-none">
          {NAV_ITEMS.slice(0, 5).map(({ to, icon, label }) => (
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

export default ProfilePage;