import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";

/* ─── Shared design-system styles (mirrors Dashboard) ─── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  body, html {
    margin: 0; padding: 0;
    background: #f0f4fb;
    font-family: 'DM Sans', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  :root {
    --blue:      #0056b3;
    --blue-mid:  #1a6ed8;
    --blue-lite: #e8f0fe;
    --slate:     #64748b;
    --slate-lt:  #94a3b8;
    --card-bg:   #ffffff;
    --card-br:   16px;
    --card-sh:   0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,86,179,.06);
  }

  /* Topbar */
  .topbar {
    background: rgba(255,255,255,0.80);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(0,86,179,.08);
    position: sticky; top: 0; z-index: 100;
    height: 56px;
  }

  /* Glass sidebar */
  .glass-sidebar {
    background: rgba(255,255,255,0.60);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-right: 1px solid rgba(255,255,255,0.80);
    box-shadow: 4px 0 24px rgba(0,86,179,.07);
  }
  .nav-pill {
    display: flex; flex-direction: column; align-items: center;
    padding: 10px 8px; border-radius: 12px; gap: 4px;
    font-size: 11px; font-weight: 600; text-decoration: none;
    color: var(--slate); transition: background .15s, color .15s, transform .15s;
    width: 100%;
  }
  .nav-pill:hover  { background: var(--blue-lite); color: var(--blue); transform: translateY(-1px); }
  .nav-pill.active { background: var(--blue); color: #fff; box-shadow: 0 4px 14px rgba(0,86,179,.35); }
  .nav-pill i { font-size: 18px; }

  /* Cards */
  .dash-card {
    background: var(--card-bg);
    border-radius: var(--card-br);
    box-shadow: var(--card-sh);
    border: 1px solid rgba(0,86,179,.06);
    transition: box-shadow .2s, transform .2s;
    overflow: hidden;
  }
  .dash-card:hover {
    box-shadow: 0 2px 6px rgba(0,0,0,.06), 0 8px 28px rgba(0,86,179,.10);
    transform: translateY(-1px);
  }

  /* Course card specific */
  .course-card {
    background: var(--card-bg);
    border-radius: var(--card-br);
    box-shadow: var(--card-sh);
    border: 1px solid rgba(0,86,179,.06);
    transition: box-shadow .22s, transform .22s, border-color .22s;
    overflow: hidden;
    display: flex; flex-direction: column;
    height: 100%;
  }
  .course-card:hover {
    box-shadow: 0 4px 24px rgba(0,86,179,.13);
    transform: translateY(-3px);
    border-color: rgba(0,86,179,.18);
  }

  /* Search input */
  .search-input {
    border: 1px solid rgba(0,86,179,.15); border-radius: 10px;
    background: #f8faff; padding: 7px 14px 7px 36px;
    font-size: 13px; color: #1e293b; outline: none;
    font-family: 'DM Sans', sans-serif;
    transition: border-color .2s, box-shadow .2s; width: 100%;
  }
  .search-input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(0,86,179,.10);
    background: #fff;
  }

  /* Avatar */
  .avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: var(--blue); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; flex-shrink: 0;
  }

  /* Tab pill */
  .tab-pill {
    padding: 6px 16px; border-radius: 99px; border: none;
    font-size: 13px; font-weight: 600; cursor: pointer;
    background: transparent; color: var(--slate-lt);
    transition: background .15s, color .15s;
    font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
  }
  .tab-pill.active { background: var(--blue-lite); color: var(--blue); }
  .tab-pill:hover:not(.active) { color: var(--slate); background: #f1f5f9; }

  /* Tag */
  .tag {
    display: inline-flex; align-items: center;
    padding: 2px 9px; border-radius: 99px;
    font-size: 11px; font-weight: 600; letter-spacing: .02em;
  }

  /* Progress bar */
  .prog-track { height: 4px; border-radius: 99px; background: #eef2ff; overflow: hidden; }
  .prog-fill  { height: 100%; border-radius: 99px; transition: width 1s cubic-bezier(.4,0,.2,1); }

  /* Fade-in */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .35s ease both; }

  /* Bottom nav mobile */
  .bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0; height: 64px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid rgba(0,86,179,0.10);
    display: flex; align-items: stretch; z-index: 1030;
    box-shadow: 0 -4px 24px rgba(0,86,179,0.08);
  }
  .bottom-nav a {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; font-size: 10px; font-weight: 600; gap: 3px;
    text-decoration: none; color: #94a3b8; transition: color .2s;
    border-top: 2px solid transparent;
  }
  .bottom-nav a.active { color: #0056b3; border-top-color: #0056b3; }
  .bottom-nav a i { font-size: 19px; }
`;

const NAV_ITEMS = [
  { to: "/student",                  icon: "bi-speedometer2",     label: "Home"     },
  { to: "/student/subjects",         icon: "bi-journal-bookmark", label: "Subjects" },
  { to: "/student/exams",            icon: "bi-pencil-square",    label: "Exams" },
  { to: "/student/grades",           icon: "bi-graph-up-arrow",   label: "Grades"   },
  { to: "/student/account-settings", icon: "bi-gear",             label: "Settings" },
];

const CARD_ACCENTS = [
  { bg: "#eef2ff", iconColor: "#0056b3", icon: "bi-code-slash"      },
  { bg: "#fff7ed", iconColor: "#f59e0b", icon: "bi-database"         },
  { bg: "#fdf2f8", iconColor: "#ec4899", icon: "bi-palette"          },
  { bg: "#f0fdf4", iconColor: "#22c55e", icon: "bi-journal-text"     },
  { bg: "#fef9c3", iconColor: "#ca8a04", icon: "bi-lightning-charge" },
  { bg: "#f0f9ff", iconColor: "#0ea5e9", icon: "bi-globe"            },
];
const getAccent = (i) => CARD_ACCENTS[i % CARD_ACCENTS.length];

const TABS = ["all", "progress", "completed", "archived"];
const TAB_LABELS = { all: "All Subjects", progress: "In Progress", completed: "Completed", archived: "Archived" };

/* ─── Bottom Nav ─── */
const BottomNav = ({ active }) => (
  <nav className="bottom-nav d-lg-none">
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={active === label ? "active" : ""}>
        <i className={`bi ${icon}`}></i>{label}
      </Link>
    ))}
  </nav>
);

/* ─── Topbar ─── */
const Topbar = ({ user, onLogout, searchTerm, onSearch }) => {
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "S";
  const firstName = user?.name?.split(" ")[0] ?? "Student";
  return (
    <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
      <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
        SECT Portal
      </span>
      <div className="d-none d-md-flex align-items-center ms-4 position-relative" style={{ flex: 1, maxWidth: 320 }}>
        <i className="bi bi-search" style={{ position: "absolute", left: 12, color: "#94a3b8", fontSize: 13, zIndex: 1 }}></i>
        <input className="search-input" placeholder="Search subjects…" value={searchTerm} onChange={e => onSearch(e.target.value)} />
      </div>
      <div className="ms-auto d-flex align-items-center gap-2">
        <button style={{ background: "transparent", border: "none", position: "relative", padding: "4px 8px", cursor: "pointer" }}>
          <i className="bi bi-bell" style={{ fontSize: 18, color: "#64748b" }}></i>
          <span style={{ position: "absolute", top: 2, right: 6, width: 7, height: 7, background: "#ef4444", borderRadius: "50%", border: "1.5px solid #f0f4fb" }}></span>
        </button>
        <div className="dropdown">
          <button className="d-flex align-items-center gap-2 dropdown-toggle"
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }}
            data-bs-toggle="dropdown">
            <div className="avatar">{initial}</div>
            <span className="d-none d-sm-inline" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{firstName}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
            <li><Link className="dropdown-item" to="/student/profile">My Profile</Link></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger" onClick={onLogout}
                style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ─── Sidebar ─── */
const Sidebar = ({ active }) => (
  <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
    style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}>
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={`nav-pill${active === label ? " active" : ""}`}>
        <i className={`bi ${icon}`}></i>{label}
      </Link>
    ))}
  </nav>
);

/* ─── Empty state ─── */
const EmptyState = ({ icon, title, subtitle }) => (
  <div style={{ textAlign: "center", padding: "64px 24px", color: "#94a3b8" }}>
    <i className={`bi ${icon}`} style={{ fontSize: 48, display: "block", marginBottom: 16, opacity: .5 }}></i>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#64748b" }}>{title}</p>
    {subtitle && <p style={{ margin: "6px 0 0", fontSize: 13 }}>{subtitle}</p>}
  </div>
);

/* ══════════════════════════════════════
   SUBJECT PAGE
══════════════════════════════════════ */
const SubjectPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser]     = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [uRes, cRes] = await Promise.all([API.get("/me"), API.get("/student/courses")]);
        setUser(uRes.data.user);
        setCourses(cRes.data.courses || []);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Unknown error";
        setError(`Failed to load: ${msg}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/");
  };

  const filtered = useMemo(() => {
    if (activeTab === "completed" || activeTab === "archived") return [];
    let list = [...courses];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.instructor?.name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [courses, searchTerm, activeTab]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f4fb" }}>
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        <Topbar user={user} onLogout={handleLogout} searchTerm={searchTerm} onSearch={setSearchTerm} />

        <div className="d-flex align-items-stretch">
          <Sidebar active="Subjects" />

          <main style={{ flex: 1, padding: "24px 20px", paddingBottom: 100, minWidth: 0 }}>

            {/* Mobile search */}
            <div className="d-md-none mb-3 position-relative">
              <i className="bi bi-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, zIndex: 1 }}></i>
              <input className="search-input" placeholder="Search subjects…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* Page header */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>Academic</p>
              <h1 style={{ margin: "4px 0 4px", fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-.4px" }}>My Subjects</h1>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                {courses.length} course{courses.length !== 1 ? "s" : ""} enrolled this semester
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ color: "#ef4444", marginTop: 2 }}></i>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#dc2626" }}>Could not load courses</p>
                  <p style={{ margin: "2px 0 8px", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{error}</p>
                  <button onClick={() => window.location.reload()}
                    style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24, overflowX: "auto", paddingBottom: 2 }}>
              {TABS.map(tab => (
                <button key={tab} className={`tab-pill${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}>
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            {/* Stats strip */}
            {!error && (activeTab === "all" || activeTab === "progress") && courses.length > 0 && (
              <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                  { label: "Enrolled",  val: courses.length,  color: "#0056b3", bg: "#e8f0fe"  },
                  { label: "In Progress", val: courses.length, color: "#22c55e", bg: "#f0fdf4" },
                  { label: "Exams Total", val: courses.reduce((a, c) => a + (c.exams?.length || 0), 0), color: "#f59e0b", bg: "#fff7ed" },
                ].map(s => (
                  <div key={s.label} className="fade-up" style={{
                    background: s.bg, borderRadius: 12, padding: "10px 16px",
                    display: "flex", alignItems: "center", gap: 10, minWidth: 120
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.color, opacity: .8 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Course grid */}
            {(activeTab === "all" || activeTab === "progress") && !error && (
              filtered.length === 0 ? (
                <EmptyState
                  icon="bi-journal-x"
                  title={searchTerm ? "No subjects match your search" : "No courses enrolled yet"}
                  subtitle={searchTerm ? "Try a different keyword" : "Contact your instructor to be added to a course"}
                />
              ) : (
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                  {filtered.map((course, i) => {
                    const acc      = getAccent(i);
                    const examCount = course.exams?.length || 0;
                    const pct       = Math.min(100, Math.round((examCount / Math.max(1, 5)) * 100));
                    return (
                      <div key={course.id} className="course-card fade-up">
                        {/* Card top banner */}
                        <div style={{ background: acc.bg, padding: "20px 20px 16px", position: "relative" }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 12, background: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,.08)", marginBottom: 10
                          }}>
                            <i className={`bi ${acc.icon}`} style={{ fontSize: 20, color: acc.iconColor }}></i>
                          </div>
                          {/* Course code badge */}
                          <span style={{
                            position: "absolute", top: 12, right: 12,
                            background: acc.iconColor, color: "#fff",
                            borderRadius: 99, padding: "2px 9px", fontSize: 10, fontWeight: 700
                          }}>{course.code}</span>
                        </div>

                        {/* Card body */}
                        <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>
                            {course.semester || "Current Semester"}
                          </p>
                          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{course.name}</h3>
                          <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5, flexGrow: 1 }}>
                            {course.description || `${examCount} exam${examCount !== 1 ? "s" : ""} available in this course.`}
                          </p>

                          {/* Progress bar */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Progress</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: acc.iconColor }}>{pct}%</span>
                            </div>
                            <div className="prog-track">
                              <div className="prog-fill" style={{ width: `${pct}%`, background: acc.iconColor }} />
                            </div>
                          </div>

                          {/* Footer */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #f1f5f9", marginTop: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <i className="bi bi-person-fill" style={{ fontSize: 11, color: "#64748b" }}></i>
                              </div>
                              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                                {course.instructor?.name ? course.instructor.name.split(" ").slice(-1)[0] : "Instructor"}
                              </span>
                            </div>
                            <Link to={`/student/courses/${course.id}/exams`} style={{
                              background: acc.iconColor, color: "#fff",
                              borderRadius: 99, padding: "5px 14px", fontSize: 11, fontWeight: 700,
                              textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
                              transition: "opacity .15s"
                            }} onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                               onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                              Exams <i className="bi bi-arrow-right"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {activeTab === "completed" && (
              <EmptyState icon="bi-patch-check" title="No completed subjects yet"
                subtitle="Completed courses will appear here once grading is finalized." />
            )}
            {activeTab === "archived" && (
              <EmptyState icon="bi-archive" title="No archived subjects"
                subtitle="Archived subjects will appear here." />
            )}
          </main>
        </div>

        <BottomNav active="Subjects" />
      </div>
    </>
  );
};

export default SubjectPage;