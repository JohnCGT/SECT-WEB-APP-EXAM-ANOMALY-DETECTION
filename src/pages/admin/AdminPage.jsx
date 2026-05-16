// src/pages/admin/AdminPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

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
  .skeleton{background:linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .dash-btn-primary{background:var(--blue);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:opacity .15s,transform .15s;text-decoration:none;}
  .dash-btn-primary:hover{opacity:.87;transform:translateY(-1px);color:#fff;}
  .dash-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .dash-btn-ghost{background:#fff;border:1px solid rgba(0,86,179,.15);color:#64748b;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:all .15s;text-decoration:none;}
  .dash-btn-ghost:hover{background:#f1f5f9;color:#1e293b;}
  .badge-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;}
  .dash-table{width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif;}
  .dash-table th{padding:10px 14px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.06em;white-space:nowrap;border-bottom:1px solid #f1f5f9;text-align:left;background:#f8faff;}
  .dash-table td{padding:12px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle;}
  .dash-table tbody tr{transition:background .15s;}
  .dash-table tbody tr:hover{background:#f8faff;}
  .dash-table tbody tr:last-child td{border-bottom:none;}
  .admin-bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bnav-item i{font-size:19px;}
  .act-card{background:#fff;border-radius:14px;border:1px solid rgba(0,86,179,.06);box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden;margin-bottom:8px;}
  @media(max-width:767px){
    .hide-mobile{display:none!important;}
    .dash-table td,.dash-table th{padding:10px 10px;font-size:12px;}
  }
`;

const NAV_ITEMS = [
  { to: "/admin",               icon: "bi-speedometer2",      label: "Dashboard" },
  { to: "/admin/users",         icon: "bi-people",            label: "Users"     },
  { to: "/admin/courses",       icon: "bi-book",              label: "Courses"   },
  { to: "/admin/exams",         icon: "bi-file-earmark-text", label: "Exams"     },
  { to: "/admin/activity-logs", icon: "bi-journal-text",      label: "Logs"      },
  { to: "/admin/support",       icon: "bi-headset",           label: "Support"   },
];

const BOTTOM_NAV = [
  { to: "/admin",               icon: "bi-speedometer2",      label: "Home"    },
  { to: "/admin/users",         icon: "bi-people",            label: "Users"   },
  { to: "/admin/courses",       icon: "bi-book",              label: "Courses" },
  { to: "/admin/exams",         icon: "bi-file-earmark-text", label: "Exams"   },
  { to: "/admin/activity-logs", icon: "bi-journal-text",      label: "Logs"    },
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

const EVENT_CONFIG = {
  "register":                 { label: "Registered",       icon: "bi-person-plus",        color: "#16a34a", bg: "#f0fdf4" },
  "login":                    { label: "Login",            icon: "bi-box-arrow-in-right", color: "#0056b3", bg: "#e8f0fe" },
  "logout":                   { label: "Logout",           icon: "bi-box-arrow-right",    color: "#64748b", bg: "#f1f5f9" },
  "course.created":           { label: "Course Created",   icon: "bi-book-half",          color: "#0056b3", bg: "#e8f0fe" },
  "course.updated":           { label: "Course Updated",   icon: "bi-pencil-square",      color: "#1a6ed8", bg: "#eff6ff" },
  "course.deleted":           { label: "Course Deleted",   icon: "bi-book",               color: "#dc3545", bg: "#fff0f0" },
  "exam.created":             { label: "Exam Created",     icon: "bi-file-earmark-plus",  color: "#0056b3", bg: "#e8f0fe" },
  "exam.updated":             { label: "Exam Updated",     icon: "bi-file-earmark-text",  color: "#1a6ed8", bg: "#eff6ff" },
  "exam.deleted":             { label: "Exam Deleted",     icon: "bi-file-earmark-x",     color: "#dc3545", bg: "#fff0f0" },
  "exam.started":             { label: "Exam Started",     icon: "bi-play-circle",        color: "#16a34a", bg: "#f0fdf4" },
  "exam.submitted":           { label: "Exam Submitted",   icon: "bi-check-circle",       color: "#16a34a", bg: "#f0fdf4" },
  "question.created":         { label: "Question Added",   icon: "bi-patch-plus",         color: "#9333ea", bg: "#fdf4ff" },
  "question.updated":         { label: "Question Edited",  icon: "bi-pencil",             color: "#9333ea", bg: "#fdf4ff" },
  "question.deleted":         { label: "Question Deleted", icon: "bi-trash",              color: "#dc3545", bg: "#fff0f0" },
  "essay.graded":             { label: "Essay Graded",     icon: "bi-award",              color: "#fd7e14", bg: "#fff8f0" },
  "admin.user_created":       { label: "User Added",       icon: "bi-person-check",       color: "#0056b3", bg: "#e8f0fe" },
  "admin.user_updated":       { label: "User Updated",     icon: "bi-person-gear",        color: "#1a6ed8", bg: "#eff6ff" },
  "admin.user_status_changed":{ label: "User Status",      icon: "bi-person-gear",        color: "#fd7e14", bg: "#fff8f0" },
  "admin.user_deleted":       { label: "User Deleted",     icon: "bi-person-x",           color: "#dc3545", bg: "#fff0f0" },
};

const ROLE_CONFIG = {
  admin:      { bg: "#fff0f0", color: "#dc3545" },
  instructor: { bg: "#eff6ff", color: "#1a6ed8" },
  student:    { bg: "#e8f0fe", color: "#0056b3" },
};

function getEventCfg(event = "") {
  if (EVENT_CONFIG[event]) return EVENT_CONFIG[event];
  const prefix = event.split(".")[0];
  const fallbacks = {
    exam:     { icon: "bi-file-earmark-text", color: "#1a6ed8", bg: "#eff6ff" },
    course:   { icon: "bi-book",              color: "#0056b3", bg: "#e8f0fe" },
    question: { icon: "bi-patch-question",    color: "#9333ea", bg: "#fdf4ff" },
    admin:    { icon: "bi-shield",            color: "#dc3545", bg: "#fff0f0" },
    essay:    { icon: "bi-award",             color: "#fd7e14", bg: "#fff8f0" },
  };
  return fallbacks[prefix] ?? { icon: "bi-activity", color: "#64748b", bg: "#f1f5f9" };
}

function EventBadge({ event = "" }) {
  const cfg = getEventCfg(event);
  const label = EVENT_CONFIG[event]?.label ?? event;
  return (
    <span className="badge-pill" style={{ background: cfg.bg, color: cfg.color }}>
      <i className={`bi ${cfg.icon}`}></i> {label}
    </span>
  );
}

function RolePill({ role = "" }) {
  const s = ROLE_CONFIG[role?.toLowerCase()] ?? { bg: "#f1f5f9", color: "#64748b" };
  return <span className="badge-pill" style={{ background: s.bg, color: s.color }}>{role || "—"}</span>;
}

function MiniAvatar({ name = "", size = 28 }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue},55%,88%)`, color: `hsl(${hue},45%,30%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.38,
    }}>
      {initials}
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function AdminSidebar({ navItems }) {
  const location = useLocation();
  const isActive = (to) => to === "/admin" ? location.pathname === to : location.pathname.startsWith(to);
  return (
    <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
      style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}>
      {navItems.map(({ to, icon, label }) => (
        <Link key={to} to={to} className={`nav-pill ${isActive(to) ? "active" : ""}`}>
          <i className={`bi ${icon}`}></i>{label}
        </Link>
      ))}
    </nav>
  );
}

function AdminBottomNav({ navItems, active }) {
  return (
    <nav className="admin-bottom-nav d-lg-none">
      {navItems.map(({ to, icon, label }) => (
        <Link key={to} to={to} className="bnav-item"
          style={{ color: active === label ? "#0056b3" : "#94a3b8", borderTop: active === label ? "2px solid #0056b3" : "2px solid transparent" }}>
          <i className={`bi ${icon}`}></i>{label}
        </Link>
      ))}
    </nav>
  );
}

function AdminTopbar({ user, onLogout }) {
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "A";
  const firstName = user?.name?.split(" ")[0] ?? "Admin";
  return (
    <div className="topbar">
      <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
        SECT Admin
      </span>
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
}

function StatCard({ label, value, color, bg, icon }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1px solid rgba(0,86,179,.06)",
      padding: "16px 18px", flex: 1, minWidth: 140,
      boxShadow: "0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,86,179,.05)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, color: value === "—" ? "#94a3b8" : color }}>{value}</p>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className={`bi ${icon}`} style={{ color, fontSize: 16 }}></i>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [stats,          setStats]          = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [user,           setUser]           = useState(null);

  const handleLogout = async () => {
    try { await api("POST", "/logout"); } catch {}
    navigate("/");
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashData, meData] = await Promise.all([
        api("GET", "/admin/dashboard"),
        api("GET", "/me").catch(() => ({ user: null })),
      ]);
      setUser(meData.user);
      setStats({
        total_users:      dashData.total_users      ?? 0,
        active_exams:     dashData.active_exams     ?? 0,
        flagged_sessions: dashData.flagged_sessions ?? 0,
        high_cpi_risk:    dashData.high_cpi_risk    ?? 0,
        open_tickets:     dashData.open_tickets     ?? 0,
      });
      setRecentActivity(dashData.recent_activity ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const STAT_CARDS = [
    { label: "Total Users",      value: stats?.total_users      ?? "—", color: "#0056b3", bg: "#e8f0fe", icon: "bi-people"            },
    { label: "Active Exams",     value: stats?.active_exams     ?? "—", color: "#1a6ed8", bg: "#dbeafe", icon: "bi-file-earmark-text" },
    { label: "Flagged Sessions", value: stats?.flagged_sessions ?? "—", color: "#dc3545", bg: "#fff0f0", icon: "bi-flag"              },
    { label: "High CPI Risk",    value: stats?.high_cpi_risk    ?? "—", color: "#fd7e14", bg: "#fff8f0", icon: "bi-graph-up-arrow"    },
    { label: "Open Tickets",     value: stats?.open_tickets     ?? "—", color: "#0056b3", bg: "#e8f0fe", icon: "bi-headset"           },
  ];

  return (
    <>
      <style>{SHARED_CSS}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        <AdminTopbar user={user} onLogout={handleLogout} />

        <div className="d-flex">
          <AdminSidebar navItems={NAV_ITEMS} />

          <main style={{ flex: 1, padding: "20px 16px", paddingBottom: 90, minWidth: 0 }}>

            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Overview</p>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px" }}>Dashboard</h1>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>System overview at a glance</p>
            </div>

            {/* Stat Cards */}
            {loading ? (
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14, flex: 1, minWidth: 130 }} />)}
              </div>
            ) : (
              <div className="fade-up" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                {STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)}
              </div>
            )}

            {/* Quick links */}
            <div className="dash-card fade-up" style={{ padding: "14px 16px", marginBottom: 14 }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>
                Quick Links
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { to: "/admin/users",        label: "Manage Users",  icon: "bi-people"            },
                  { to: "/admin/courses",       label: "View Courses",  icon: "bi-book"              },
                  { to: "/admin/exams",         label: "Manage Exams",  icon: "bi-file-earmark-text" },
                  { to: "/admin/activity-logs", label: "Activity Logs", icon: "bi-journal-text"      },
                  { to: "/admin/support",       label: "Support",       icon: "bi-headset"           },
                ].map(({ to, label, icon }) => (
                  <Link key={to} to={to} className="dash-btn-ghost" style={{ fontSize: 12, padding: "7px 13px" }}>
                    <i className={`bi ${icon}`}></i> {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* ── Recent Activity Preview ── */}
            <div className="dash-card fade-up">
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    <i className="bi bi-journal-text me-2" style={{ color: "#0056b3" }}></i>Recent Activity
                  </h2>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>Latest 5 actions across the platform</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="dash-btn-ghost" onClick={load} style={{ fontSize: 12, padding: "6px 12px" }}>
                    {loading
                      ? <span className="spinner-border spinner-border-sm" style={{ width: "0.75rem", height: "0.75rem" }} />
                      : "↻ Refresh"}
                  </button>
                  <Link to="/admin/activity-logs" className="dash-btn-primary" style={{ fontSize: 12, padding: "6px 12px" }}>
                    <i className="bi bi-journal-text"></i> View All
                  </Link>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
                </div>
              ) : recentActivity.length === 0 ? (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  <i className="bi bi-journal-text" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: .3 }}></i>
                  No activity recorded yet.
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hide-mobile" style={{ overflowX: "auto" }}>
                    <table className="dash-table">
                      <thead>
                        <tr>
                          {["User", "Role", "Event", "Description", "When"].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recentActivity.map((log, i) => (
                          <tr key={log.id ?? i}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <MiniAvatar name={log.user_name ?? "?"} size={28} />
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap" }}>
                                    {log.user_name ?? "Unknown"}
                                  </p>
                                  <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                                    {log.user_email ?? "—"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td><RolePill role={log.user_role} /></td>
                            <td><EventBadge event={log.event} /></td>
                            <td style={{ fontSize: 12, color: "#64748b", maxWidth: 260 }}>
                              <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {log.description ?? "—"}
                              </span>
                            </td>
                            <td style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                              {formatDate(log.occurred_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="d-lg-none" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {recentActivity.map((log, i) => {
                      const cfg = getEventCfg(log.event);
                      return (
                        <div key={log.id ?? i} className="act-card">
                          <div style={{ padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <i className={`bi ${cfg.icon}`} style={{ color: cfg.color, fontSize: 15 }}></i>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{log.user_name ?? "Unknown"}</span>
                                <RolePill role={log.user_role} />
                              </div>
                              <div style={{ marginBottom: 3 }}>
                                <EventBadge event={log.event} />
                              </div>
                              {log.description && (
                                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{log.description}</p>
                              )}
                              <p style={{ margin: "4px 0 0", fontSize: 10, color: "#94a3b8" }}>
                                <i className="bi bi-clock me-1"></i>{formatDate(log.occurred_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
                    <Link to="/admin/activity-logs" style={{ fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none" }}>
                      View all activity logs <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>

        <AdminBottomNav navItems={BOTTOM_NAV} active="Home" />
      </div>
    </>
  );
}