// src/pages/admin/AdminCourseManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

/* ─── Shared CSS ─────────────────────────────────────────────────────── */
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{
    --blue:#0056b3;--blue-mid:#1a6ed8;--blue-lite:#e8f0fe;
    --slate:#64748b;--slate-lt:#94a3b8;
    --card-bg:#ffffff;--card-br:16px;
    --card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);
    --danger:#dc3545;--warn:#fd7e14;--green:#16a34a;
  }
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;}
  .glass-sidebar{background:rgba(255,255,255,0.60);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);}
  .nav-pill{display:flex;flex-direction:column;align-items:center;padding:10px 8px;border-radius:12px;gap:4px;font-size:11px;font-weight:600;text-decoration:none;color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;}
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .topbar{background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:200;height:56px;display:flex;align-items:center;padding:0 20px;gap:12px;}
  .dash-avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  .dash-search{border:1px solid rgba(0,86,179,.15);border-radius:10px;background:#f8faff;padding:7px 14px 7px 36px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;width:100%;transition:border-color .2s,box-shadow .2s;}
  .dash-search:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .skeleton{background:linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .dash-btn-primary{background:var(--blue);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:opacity .15s,transform .15s;text-decoration:none;}
  .dash-btn-primary:hover{opacity:.87;transform:translateY(-1px);color:#fff;}
  .dash-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .dash-btn-ghost{background:#fff;border:1px solid rgba(0,86,179,.15);color:#64748b;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:all .15s;text-decoration:none;}
  .dash-btn-ghost:hover{background:#f1f5f9;color:#1e293b;}
  .badge-pill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;flex-shrink:0;}
  .dash-table{width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif;}
  .dash-table th{padding:10px 14px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.06em;white-space:nowrap;border-bottom:1px solid #f1f5f9;text-align:left;background:#f8faff;}
  .dash-table td{padding:12px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle;}
  .dash-table tbody tr{transition:background .15s;}
  .dash-table tbody tr:hover{background:#f8faff;}
  .dash-table tbody tr:last-child td{border-bottom:none;}
  .admin-bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bnav-item i{font-size:19px;}
  .stat-chips-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;}
  .stat-chip{flex:1;min-width:130px;border-radius:14px;padding:12px;display:flex;align-items:center;gap:8px;border:1px solid rgba(0,86,179,.06);background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.04);}
  .stat-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  /* Course card */
  .course-row{background:#fff;border-radius:14px;border:1px solid rgba(0,86,179,.06);box-shadow:0 1px 3px rgba(0,0,0,.04);transition:box-shadow .2s,transform .2s;overflow:hidden;}
  .course-row:hover{box-shadow:0 2px 8px rgba(0,86,179,.10);transform:translateY(-1px);}
  /* Pagination */
  .page-btn{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,86,179,.15);background:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;color:#64748b;padding:0 6px;}
  .page-btn:hover{background:var(--blue-lite);border-color:var(--blue);color:var(--blue);}
  .page-btn.active{background:var(--blue);border-color:var(--blue);color:#fff;}
  .page-btn:disabled{opacity:.4;cursor:not-allowed;}
  @media(max-width:991px){.hide-md{display:none!important;}}
  @media(max-width:767px){
    .hide-mobile{display:none!important;}
    .dash-table td,.dash-table th{padding:8px 10px;font-size:12px;}
    .stat-chip{min-width:calc(50% - 5px);}
  }
  @media(max-width:480px){
    .stat-chip{min-width:100%;}
  }
`;

const NAV_ITEMS = [
  { to: "/admin",           icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/admin/users",     icon: "bi-people",               label: "Users"     },
  { to: "/admin/courses",   icon: "bi-book",                 label: "Courses"   },
  { to: "/admin/exams",     icon: "bi-file-earmark-text",    label: "Exams"     },
  // { to: "/admin/anomalies", icon: "bi-exclamation-triangle", label: "Anomalies" },
  { to: "/admin/support",   icon: "bi-headset",              label: "Support"   },
];

const BOTTOM_NAV = [
  { to: "/admin",           icon: "bi-speedometer2",      label: "Home"     },
  { to: "/admin/users",     icon: "bi-people",            label: "Users"    },
  { to: "/admin/courses",   icon: "bi-book",              label: "Courses"  },
  { to: "/admin/exams",     icon: "bi-file-earmark-text", label: "Exams"    },
  { to: "/admin/support",   icon: "bi-headset",           label: "Support"  },
];

const BASE = import.meta?.env?.VITE_API_URL ?? "/api";
async function api(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" },
    credentials: "include",
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? "Request failed.");
  return json;
}

const PER_PAGE = 20;

function MiniAvatar({ name = "", size = 28 }) {
  const initial = name.charAt(0)?.toUpperCase() || "?";
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue},55%,88%)`, color: `hsl(${hue},45%,30%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.42,
    }}>
      {initial}
    </div>
  );
}

function Pagination({ total, page, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);
  const visible = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
      <button className="page-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <i className="bi bi-chevron-left" style={{ fontSize: 11 }}></i>
      </button>
      {visible.map((p, idx) => {
        const prev = visible[idx - 1];
        return (
          <React.Fragment key={p}>
            {prev && p - prev > 1 && <span style={{ color: "#94a3b8", fontSize: 13 }}>…</span>}
            <button className={`page-btn ${p === page ? "active" : ""}`} onClick={() => onChange(p)}>{p}</button>
          </React.Fragment>
        );
      })}
      <button className="page-btn" disabled={page === Math.ceil(total / perPage)} onClick={() => onChange(page + 1)}>
        <i className="bi bi-chevron-right" style={{ fontSize: 11 }}></i>
      </button>
      <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
      </span>
    </div>
  );
}

export default function AdminCourseManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user,    setUser]    = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);

  const isActive = (to) => to === "/admin" ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = async () => {
    try { await api("POST", "/logout"); } catch {}
    navigate("/");
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, meRes] = await Promise.all([
        api("GET", "/admin/courses"),
        api("GET", "/me").catch(() => ({ user: null })),
      ]);
      setCourses(res.data ?? (Array.isArray(res) ? res : []));
      setUser(meRes.user);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    return !q
      || c.code?.toLowerCase().includes(q)
      || c.name?.toLowerCase().includes(q)
      || c.instructor?.name?.toLowerCase().includes(q)
      || c.semester?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const instructorSet = new Set(courses.map(c => c.instructor?.id).filter(Boolean));
  const totalStudents = courses.reduce((a, c) => a + (c.students_count ?? 0), 0);
  const totalExams    = courses.reduce((a, c) => a + (c.exams_count    ?? 0), 0);

  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "A";
  const firstName = user?.name?.split(" ")[0] ?? "Admin";

  const STATS = [
    { label: "Total Courses",    value: courses.length,    color: "#0056b3", bg: "#e8f0fe", icon: "bi-book"    },
    { label: "Instructors",      value: instructorSet.size, color: "#1a6ed8", bg: "#dbeafe", icon: "bi-person-badge" },
    { label: "Total Enrollments",value: totalStudents,     color: "#16a34a", bg: "#f0fdf4", icon: "bi-people"  },
    { label: "Total Exams",      value: totalExams,        color: "#fd7e14", bg: "#fff8f0", icon: "bi-file-earmark-text" },
  ];

  return (
    <>
      <style>{SHARED_CSS}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* Topbar */}
        <div className="topbar">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
            SECT Admin
          </span>
          <div className="hide-mobile" style={{ flex: 1, maxWidth: 380, position: "relative" }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13 }}></i>
            <input className="dash-search" placeholder="Search courses…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <NotificationBell />
            <div className="dropdown">
              <button className="d-flex align-items-center gap-2 dropdown-toggle"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }}
                data-bs-toggle="dropdown">
                <div className="dash-avatar">{initial}</div>
                <span className="d-none d-sm-inline" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{firstName}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
                <li><Link className="dropdown-item" to="/admin/profile">My Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout}
                  style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="d-flex">
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
          <main style={{ flex: 1, padding: "20px 16px", paddingBottom: 90, minWidth: 0 }}>

            {/* Mobile search */}
            <div className="d-lg-none mb-3" style={{ position: "relative" }}>
              <i className="bi bi-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, zIndex: 1 }}></i>
              <input className="dash-search" style={{ paddingLeft: 36 }} placeholder="Search courses…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>

            {/* Page header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Admin</p>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px" }}>Course Management</h1>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>All courses across all instructors — read-only view</p>
              </div>
              <button className="dash-btn-ghost" onClick={load} style={{ flexShrink: 0, fontSize: 12, padding: "7px 13px" }}>
                <i className="bi bi-arrow-clockwise"></i>
                <span className="d-none d-sm-inline"> Refresh</span>
              </button>
            </div>

            {/* Stats */}
            <div className="stat-chips-row fade-up">
              {STATS.map(({ label, value, color, bg, icon }) => (
                <div key={label} className="stat-chip">
                  <div className="stat-icon" style={{ background: bg }}>
                    <i className={`bi ${icon}`} style={{ color, fontSize: 15 }}></i>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 600, color, opacity: .75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Table card */}
            <div className="dash-card fade-up">
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  <i className="bi bi-book me-2" style={{ color: "#0056b3" }}></i>All Courses
                </h2>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{filtered.length} course{filtered.length !== 1 ? "s" : ""}</span>
              </div>

              {loading ? (
                <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
                </div>
              ) : pageData.length === 0 ? (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8" }}>
                  <i className="bi bi-book" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: .3 }}></i>
                  <p style={{ margin: 0, fontSize: 13 }}>{search ? "No courses match your search." : "No courses found."}</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hide-mobile" style={{ overflowX: "auto" }}>
                    <table className="dash-table">
                      <thead>
                        <tr>
                          {["Course", "Instructor", "Semester", "Credits", "Students", "Exams", "Created"].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.map((course) => (
                          <tr key={course.id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                  background: "#e8f0fe", display: "flex", alignItems: "center",
                                  justifyContent: "center", fontSize: 10, fontWeight: 800,
                                  color: "#0056b3", textAlign: "center", lineHeight: 1.2, wordBreak: "break-all",
                                }}>
                                  {course.code}
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{course.name}</p>
                                  <span className="badge-pill" style={{ background: "#e8f0fe", color: "#0056b3" }}>{course.code}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              {course.instructor ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <MiniAvatar name={course.instructor.name} size={28} />
                                  <div>
                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{course.instructor.name}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{course.instructor.email}</p>
                                  </div>
                                </div>
                              ) : <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>}
                            </td>
                            <td style={{ fontSize: 12, color: "#64748b" }}>{course.semester ?? "—"}</td>
                            <td>
                              <span className="badge-pill" style={{ background: "#e8f0fe", color: "#0056b3" }}>
                                {course.credits ?? "—"} cr
                              </span>
                            </td>
                            <td style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{course.students_count ?? 0}</td>
                            <td style={{ fontSize: 14, fontWeight: 700, color: "#1a6ed8" }}>{course.exams_count ?? 0}</td>
                            <td style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                              {course.created_at
                                ? new Date(course.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="d-lg-none" style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px" }}>
                    {pageData.map(course => (
                      <div key={course.id} className="course-row">
                        <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 10, background: "#e8f0fe",
                            color: "#0056b3", display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, fontSize: 10, flexShrink: 0, textAlign: "center", lineHeight: 1.2, wordBreak: "break-all",
                          }}>
                            {course.code}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{course.name}</p>
                            {course.instructor && (
                              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                                <i className="bi bi-person me-1"></i>{course.instructor.name}
                              </p>
                            )}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                              {course.semester && <span className="badge-pill" style={{ background: "#f1f5f9", color: "#64748b" }}>{course.semester}</span>}
                              <span className="badge-pill" style={{ background: "#e8f0fe", color: "#0056b3" }}>{course.credits ?? "—"} cr</span>
                              <span className="badge-pill" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                                <i className="bi bi-people me-1"></i>{course.students_count ?? 0}
                              </span>
                              <span className="badge-pill" style={{ background: "#eff6ff", color: "#1a6ed8" }}>
                                <i className="bi bi-file-earmark-text me-1"></i>{course.exams_count ?? 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage} />
                </>
              )}
            </div>
          </main>
        </div>

        {/* Bottom Nav */}
        <nav className="admin-bottom-nav d-lg-none">
          {BOTTOM_NAV.map(({ to, icon, label }) => (
            <Link key={to} to={to} className="bnav-item"
              style={{ color: isActive(to) ? "#0056b3" : "#94a3b8", borderTop: isActive(to) ? "2px solid #0056b3" : "2px solid transparent" }}>
              <i className={`bi ${icon}`}></i>{label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}