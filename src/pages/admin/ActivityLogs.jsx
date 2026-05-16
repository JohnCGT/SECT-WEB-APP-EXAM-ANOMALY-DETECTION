// src/pages/admin/ActivityLogs.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

/* ─── Shared CSS (same design system as other admin pages) ───────────── */
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
  .dash-btn-ghost{background:#fff;border:1px solid rgba(0,86,179,.15);color:#64748b;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:all .15s;text-decoration:none;}
  .dash-btn-ghost:hover{background:#f1f5f9;color:#1e293b;}
  .badge-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;flex-shrink:0;}
  .dash-table{width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif;}
  .dash-table th{padding:10px 14px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.06em;white-space:nowrap;border-bottom:1px solid #f1f5f9;text-align:left;background:#f8faff;}
  .dash-table td{padding:12px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle;}
  .dash-table tbody tr{transition:background .15s;}
  .dash-table tbody tr:hover{background:#f8faff;}
  .dash-table tbody tr:last-child td{border-bottom:none;}
  .filter-btn{border:none;border-radius:20px;padding:5px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;white-space:nowrap;}
  .filter-btn:hover{opacity:.85;transform:translateY(-1px);}
  .stat-chip{flex:1;min-width:120px;border-radius:14px;padding:12px;display:flex;align-items:center;gap:8px;border:1px solid rgba(0,86,179,.06);background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.04);}
  .stat-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .log-card{background:#fff;border-radius:14px;border:1px solid rgba(0,86,179,.06);box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden;margin-bottom:8px;}
  .admin-bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bnav-item i{font-size:19px;}
  .page-btn{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,86,179,.15);background:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;color:#64748b;padding:0 6px;}
  .page-btn:hover{background:var(--blue-lite);border-color:var(--blue);color:var(--blue);}
  .page-btn.active{background:var(--blue);border-color:var(--blue);color:#fff;}
  .page-btn:disabled{opacity:.4;cursor:not-allowed;}
  .filters-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
  @media(max-width:991px){.hide-md{display:none!important;}}
  @media(max-width:767px){
    .hide-mobile{display:none!important;}
    .show-mobile{display:flex!important;}
    .dash-table td,.dash-table th{padding:8px 10px;font-size:12px;}
    .stat-chip{min-width:calc(50% - 5px);}
  }
  @media(max-width:480px){.stat-chip{min-width:100%;}}
`;

/* ─── Nav config (Anomalies → Activity Logs) ─────────────────────────── */
const NAV_ITEMS = [
  { to: "/admin",                icon: "bi-speedometer2",      label: "Dashboard" },
  { to: "/admin/users",          icon: "bi-people",            label: "Users"     },
  { to: "/admin/courses",        icon: "bi-book",              label: "Courses"   },
  { to: "/admin/exams",          icon: "bi-file-earmark-text", label: "Exams"     },
  { to: "/admin/activity-logs",  icon: "bi-journal-text",      label: "Logs"      },
  { to: "/admin/support",        icon: "bi-headset",           label: "Support"   },
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

/* ─── Event metadata ─────────────────────────────────────────────────── */
const EVENT_CONFIG = {
  // Auth
  "register":                { label: "Registered",        icon: "bi-person-plus",          color: "#16a34a", bg: "#f0fdf4" },
  "login":                   { label: "Login",             icon: "bi-box-arrow-in-right",   color: "#0056b3", bg: "#e8f0fe" },
  "logout":                  { label: "Logout",            icon: "bi-box-arrow-right",      color: "#64748b", bg: "#f1f5f9" },
  // Courses
  "course.created":          { label: "Course Created",    icon: "bi-book-half",            color: "#0056b3", bg: "#e8f0fe" },
  "course.updated":          { label: "Course Updated",    icon: "bi-pencil-square",        color: "#1a6ed8", bg: "#eff6ff" },
  "course.deleted":          { label: "Course Deleted",    icon: "bi-book",                 color: "#dc3545", bg: "#fff0f0" },
  // Exams
  "exam.created":            { label: "Exam Created",      icon: "bi-file-earmark-plus",    color: "#0056b3", bg: "#e8f0fe" },
  "exam.updated":            { label: "Exam Updated",      icon: "bi-file-earmark-text",    color: "#1a6ed8", bg: "#eff6ff" },
  "exam.deleted":            { label: "Exam Deleted",      icon: "bi-file-earmark-x",       color: "#dc3545", bg: "#fff0f0" },
  "exam.status_changed":     { label: "Status Changed",    icon: "bi-toggle-on",            color: "#fd7e14", bg: "#fff8f0" },
  "exam.started":            { label: "Exam Started",      icon: "bi-play-circle",          color: "#16a34a", bg: "#f0fdf4" },
  "exam.submitted":          { label: "Exam Submitted",    icon: "bi-check-circle",         color: "#16a34a", bg: "#f0fdf4" },
  "exam.abandoned":          { label: "Exam Abandoned",    icon: "bi-x-circle",             color: "#dc3545", bg: "#fff0f0" },
  // Questions
  "question.created":        { label: "Question Added",    icon: "bi-patch-plus",           color: "#9333ea", bg: "#fdf4ff" },
  "question.updated":        { label: "Question Edited",   icon: "bi-pencil",               color: "#9333ea", bg: "#fdf4ff" },
  "question.deleted":        { label: "Question Deleted",  icon: "bi-trash",                color: "#dc3545", bg: "#fff0f0" },
  // Grading
  "essay.graded":            { label: "Essay Graded",      icon: "bi-award",                color: "#fd7e14", bg: "#fff8f0" },
  // Admin actions
  "admin.user_created":      { label: "User Added",        icon: "bi-person-check",         color: "#0056b3", bg: "#e8f0fe" },
  "admin.user_status_changed":{ label: "User Status",      icon: "bi-person-gear",          color: "#fd7e14", bg: "#fff8f0" },
  "admin.user_deleted":      { label: "User Deleted",      icon: "bi-person-x",             color: "#dc3545", bg: "#fff0f0" },
};

const ROLE_CONFIG = {
  admin:      { bg: "#fff0f0", color: "#dc3545" },
  instructor: { bg: "#eff6ff", color: "#1a6ed8" },
  student:    { bg: "#e8f0fe", color: "#0056b3" },
};

/* Map a raw event key to its config, falling back gracefully */
function getEventCfg(event = "") {
  if (EVENT_CONFIG[event]) return EVENT_CONFIG[event];
  // prefix match — e.g. "exam.something_new" → exam style
  const prefix = event.split(".")[0];
  const fallbacks = {
    exam:     { icon: "bi-file-earmark-text", color: "#1a6ed8", bg: "#eff6ff" },
    course:   { icon: "bi-book",              color: "#0056b3", bg: "#e8f0fe" },
    question: { icon: "bi-patch-question",    color: "#9333ea", bg: "#fdf4ff" },
    admin:    { icon: "bi-shield",            color: "#dc3545", bg: "#fff0f0" },
    essay:    { icon: "bi-award",             color: "#fd7e14", bg: "#fff8f0" },
  };
  return fallbacks[prefix] ?? { icon: "bi-activity", color: "#64748b", bg: "#f1f5f9", label: event };
}

/* ─── Event filter groups ────────────────────────────────────────────── */
const EVENT_FILTERS = [
  { key: "all",      label: "All Events" },
  { key: "login",    label: "Auth"       },
  { key: "course",   label: "Courses"    },
  { key: "exam",     label: "Exams"      },
  { key: "question", label: "Questions"  },
  { key: "essay",    label: "Grading"    },
  { key: "admin",    label: "Admin"      },
];

const ROLE_FILTERS = [
  { key: "all",        label: "All Roles"   },
  { key: "student",    label: "Students"    },
  { key: "instructor", label: "Instructors" },
  { key: "admin",      label: "Admins"      },
];

/* ─── Small components ───────────────────────────────────────────────── */
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3800); return () => clearTimeout(t); }, [onDone]);
  const isErr = type === "error";
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: isErr ? "#fff0f0" : "#f0fdf4",
      color: isErr ? "#dc3545" : "#16a34a",
      padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 8px 32px rgba(0,0,0,.14)",
      border: `1px solid ${isErr ? "#fecaca" : "#bbf7d0"}`,
      fontFamily: "'DM Sans', sans-serif",
      animation: "fadeUp .25s ease",
    }}>
      <i className={`bi ${isErr ? "bi-x-circle-fill" : "bi-check-circle-fill"}`}></i>
      {msg}
    </div>
  );
}

function Pagination({ meta, onChange }) {
  const { current_page: page, last_page: totalPages, total } = meta;
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
      <button className="page-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        <i className="bi bi-chevron-right" style={{ fontSize: 11 }}></i>
      </button>
      <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>
        {total} total record{total !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

function MiniAvatar({ name = "", size = 30 }) {
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

function RolePill({ role = "" }) {
  const s = ROLE_CONFIG[role?.toLowerCase()] ?? { bg: "#f1f5f9", color: "#64748b" };
  return <span className="badge-pill" style={{ background: s.bg, color: s.color }}>{role || "—"}</span>;
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

function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════ */
export default function ActivityLogs() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user,        setUser]        = useState(null);
  const [logs,        setLogs]        = useState([]);
  const [meta,        setMeta]        = useState({ current_page: 1, last_page: 1, total: 0 });
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState("");
  const [roleFilter,  setRoleFilter]  = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [toast,       setToast]       = useState(null);

  const notify   = (msg, type = "success") => setToast({ msg, type });
  const isActive = (to) => to === "/admin" ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = async () => {
    try { await api("POST", "/logout"); } catch {}
    navigate("/");
  };

  const load = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, per_page: 50 });
      if (roleFilter  !== "all") params.set("role",   roleFilter);
      if (eventFilter !== "all") params.set("event",  eventFilter);
      if (search.trim())         params.set("search", search.trim());

      const [res, meRes] = await Promise.all([
        api("GET", `/admin/activity-logs?${params}`),
        api("GET", "/me").catch(() => ({ user: null })),
      ]);

      setLogs(res.data ?? []);
      setMeta(res.meta ?? { current_page: 1, last_page: 1, total: 0 });
      if (res.summary) setSummary(res.summary);
      setUser(meRes.user);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, eventFilter, search]);

  useEffect(() => { load(page); }, [page, roleFilter, eventFilter]);

  /* Debounce search so we don't fire on every keystroke */
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handlePageChange = (p) => { setPage(p); load(p); };

  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "A";
  const firstName = user?.name?.split(" ")[0] ?? "Admin";

  const STATS = [
    { label: "Total (30 days)",   value: summary?.total_30d      ?? "—", color: "#0056b3", bg: "#e8f0fe", icon: "bi-journal-text"    },
    { label: "Logins (30 days)",  value: summary?.logins_30d     ?? "—", color: "#16a34a", bg: "#f0fdf4", icon: "bi-box-arrow-in-right" },
    { label: "Instructor Events", value: summary?.instructor_30d ?? "—", color: "#1a6ed8", bg: "#eff6ff", icon: "bi-person-badge"     },
    { label: "Student Events",    value: summary?.student_30d    ?? "—", color: "#9333ea", bg: "#fdf4ff", icon: "bi-mortarboard"      },
  ];

  return (
    <>
      <style>{SHARED_CSS}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* ── Topbar ── */}
        <div className="topbar">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
            SECT Admin
          </span>
          <div className="hide-mobile" style={{ flex: 1, maxWidth: 380, position: "relative" }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13 }}></i>
            <input className="dash-search" placeholder="Search user or description…"
              value={search} onChange={e => setSearch(e.target.value)} />
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
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}
                    style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="d-flex">

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
          <main style={{ flex: 1, padding: "20px 16px", paddingBottom: 90, minWidth: 0 }}>

            {/* Mobile search */}
            <div className="d-lg-none mb-3" style={{ position: "relative" }}>
              <i className="bi bi-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, zIndex: 1 }}></i>
              <input className="dash-search" style={{ paddingLeft: 36 }} placeholder="Search user or description…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Page header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Monitoring</p>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px" }}>Activity Logs</h1>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Full audit trail of user actions across the platform</p>
              </div>
              <button className="dash-btn-ghost" onClick={() => load(page)} style={{ flexShrink: 0, fontSize: 12, padding: "7px 13px" }}>
                {loading
                  ? <span className="spinner-border spinner-border-sm" style={{ width: "0.75rem", height: "0.75rem" }} />
                  : <><i className="bi bi-arrow-clockwise"></i><span className="d-none d-sm-inline"> Refresh</span></>}
              </button>
            </div>

            {/* Stat chips */}
            <div className="fade-up" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
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

            {/* Filters + Table card */}
            <div className="dash-card fade-up">

              {/* Toolbar */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>

                {/* Event filter row */}
                <div className="filters-row" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", flexShrink: 0 }}>
                    Event:
                  </span>
                  {EVENT_FILTERS.map(({ key, label }) => {
                    const cfg = key !== "all" ? (getEventCfg(key + ".x")) : null;
                    const active = eventFilter === key;
                    return (
                      <button key={key} className="filter-btn"
                        onClick={() => { setEventFilter(key); setPage(1); }}
                        style={{
                          background: active ? (cfg?.color ?? "#0056b3") : "#f1f5f9",
                          color: active ? "#fff" : "#64748b",
                        }}>
                        {key !== "all" && <i className={`bi ${cfg?.icon ?? "bi-dot"}`} style={{ marginRight: 4, fontSize: 11 }}></i>}
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Role filter row */}
                <div className="filters-row">
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", flexShrink: 0 }}>
                    Role:
                  </span>
                  {ROLE_FILTERS.map(({ key, label }) => {
                    const cfg = ROLE_CONFIG[key];
                    const active = roleFilter === key;
                    return (
                      <button key={key} className="filter-btn"
                        onClick={() => { setRoleFilter(key); setPage(1); }}
                        style={{
                          background: active ? (cfg?.color ?? "#0056b3") : "#f1f5f9",
                          color: active ? "#fff" : "#64748b",
                        }}>
                        {label}
                      </button>
                    );
                  })}
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>
                    {meta.total} record{meta.total !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Content */}
              {loading ? (
                <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8" }}>
                  <i className="bi bi-journal-text" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: .3 }}></i>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    {search || roleFilter !== "all" || eventFilter !== "all"
                      ? "No activity logs match your filters."
                      : "No activity logs recorded yet."}
                  </p>
                </div>
              ) : (
                <>
                  {/* ── Desktop table ── */}
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
                        {logs.map((log, i) => (
                          <tr key={log.id ?? i}>
                            {/* User */}
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <MiniAvatar name={log.user_name ?? "?"} size={28} />
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap" }}>
                                    {log.user_name ?? "Unknown"}
                                  </p>
                                  <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                                    {log.user_email ?? "—"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            {/* Role */}
                            <td><RolePill role={log.user_role} /></td>
                            {/* Event */}
                            <td><EventBadge event={log.event} /></td>
                            {/* Description */}
                            <td style={{ fontSize: 12, color: "#64748b", maxWidth: 280 }}>
                              <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {log.description ?? "—"}
                              </span>
                            </td>
                            {/* When */}
                            <td style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                              {formatDate(log.occurred_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Mobile cards ── */}
                  <div className="d-lg-none" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {logs.map((log, i) => {
                      const cfg = getEventCfg(log.event);
                      return (
                        <div key={log.id ?? i} className="log-card">
                          <div style={{ padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                            {/* Icon */}
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <i className={`bi ${cfg.icon}`} style={{ color: cfg.color, fontSize: 16 }}></i>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                                  {log.user_name ?? "Unknown"}
                                </span>
                                <RolePill role={log.user_role} />
                              </div>
                              <p style={{ margin: "2px 0 4px", fontSize: 11, color: "#64748b" }}>
                                {log.user_email ?? "—"}
                              </p>
                              <div style={{ marginBottom: 4 }}>
                                <EventBadge event={log.event} />
                              </div>
                              {log.description && (
                                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>
                                  {log.description}
                                </p>
                              )}
                              {log.occurred_at && (
                                <p style={{ margin: "4px 0 0", fontSize: 10, color: "#94a3b8" }}>
                                  <i className="bi bi-clock me-1"></i>
                                  {formatDate(log.occurred_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Pagination meta={meta} onChange={handlePageChange} />
                </>
              )}
            </div>
          </main>
        </div>

        {/* ── Bottom Nav ── */}
        <nav className="admin-bottom-nav d-lg-none">
          {BOTTOM_NAV.map(({ to, icon, label }) => (
            <Link key={to} to={to} className="bnav-item"
              style={{ color: isActive(to) ? "#0056b3" : "#94a3b8", borderTop: isActive(to) ? "2px solid #0056b3" : "2px solid transparent" }}>
              <i className={`bi ${icon}`}></i>{label}
            </Link>
          ))}
        </nav>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}