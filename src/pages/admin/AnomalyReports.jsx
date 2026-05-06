// src/pages/admin/AnomalyReports.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

/* ─── Shared CSS (instructor design system) ──────────────────────────── */
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
  .anomaly-card{background:#fff;border-radius:14px;border:1px solid rgba(0,86,179,.06);box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden;margin-bottom:8px;}
  .admin-bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bnav-item i{font-size:19px;}
  .page-btn{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,86,179,.15);background:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;color:#64748b;padding:0 6px;}
  .page-btn:hover{background:var(--blue-lite);border-color:var(--blue);color:var(--blue);}
  .page-btn.active{background:var(--blue);border-color:var(--blue);color:#fff;}
  .page-btn:disabled{opacity:.4;cursor:not-allowed;}
  /* filters toolbar wrap */
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

const NAV_ITEMS = [
  { to: "/admin",           icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/admin/users",     icon: "bi-people",               label: "Users"     },
  { to: "/admin/courses",   icon: "bi-book",                 label: "Courses"   },
  { to: "/admin/exams",     icon: "bi-file-earmark-text",    label: "Exams"     },
  // { to: "/admin/anomalies", icon: "bi-exclamation-triangle", label: "Anomalies" },
  { to: "/admin/support",   icon: "bi-headset",              label: "Support"   },
];
const BOTTOM_NAV = [
  { to: "/admin",           icon: "bi-speedometer2",         label: "Home"      },
  { to: "/admin/users",     icon: "bi-people",               label: "Users"     },
  // { to: "/admin/anomalies", icon: "bi-exclamation-triangle", label: "Anomalies" },
  { to: "/admin/exams",     icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/admin/support",   icon: "bi-headset",              label: "Support"   },
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

const PER_PAGE = 15;

const TYPE_CONFIG = {
  tab_switch:        { label: "Tab Switch",        icon: "bi-window-split",   color: "#dc3545", bg: "#fff0f0", algo: "Isolation Forest"    },
  keyboard_shortcut: { label: "Keyboard Shortcut", icon: "bi-keyboard",       color: "#fd7e14", bg: "#fff8f0", algo: "One-Class SVM"        },
  response_time:     { label: "Response Time",     icon: "bi-stopwatch",      color: "#1a6ed8", bg: "#eff6ff", algo: "Z-Score"              },
  keystroke:         { label: "Keystroke",         icon: "bi-type",           color: "#9333ea", bg: "#fdf4ff", algo: "Hidden Markov Model"  },
};

const SEV_CONFIG = {
  high:   { bg: "#fff0f0", color: "#dc3545" },
  medium: { bg: "#fff8f0", color: "#fd7e14" },
  low:    { bg: "#f0fdf4", color: "#16a34a" },
};

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
      <button className="page-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        <i className="bi bi-chevron-right" style={{ fontSize: 11 }}></i>
      </button>
      <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
      </span>
    </div>
  );
}

/* Detail text for an anomaly row */
function anomalyDetail(a) {
  if (a.type === "tab_switch")        return `${a.hidden_duration_ms ?? "?"}ms hidden`;
  if (a.type === "keyboard_shortcut") return `Keys: ${a.keys ?? "?"}${a.is_paste ? " (paste)" : ""}`;
  if (a.type === "response_time")     return `${a.direction ?? "?"} · z=${typeof a.z_score === "number" ? a.z_score.toFixed(2) : "?"}`;
  if (a.type === "keystroke")         return `WPM: ${a.wpm ?? "?"} · z=${typeof a.z_score === "number" ? a.z_score.toFixed(2) : "?"}`;
  return "—";
}

export default function AnomalyReports() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user,       setUser]       = useState(null);
  const [anomalies,  setAnomalies]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [sevFilter,  setSevFilter]  = useState("all");
  const [search,     setSearch]     = useState("");
  const [toast,      setToast]      = useState(null);
  const [page,       setPage]       = useState(1);

  const notify  = (msg, type = "success") => setToast({ msg, type });
  const isActive = (to) => to === "/admin" ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = async () => {
    try { await api("POST", "/logout"); } catch {}
    navigate("/");
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (sevFilter  !== "all") params.set("severity", sevFilter);
      const [res, meRes] = await Promise.all([
        api("GET", `/admin/anomalies?${params}`),
        api("GET", "/me").catch(() => ({ user: null })),
      ]);
      setAnomalies(res.data ?? (Array.isArray(res) ? res : []));
      setUser(meRes.user);
    } catch (err) { notify(err.message, "error"); }
    finally { setLoading(false); }
  }, [typeFilter, sevFilter]);

  useEffect(() => { load(); setPage(1); }, [load]);

  const filtered = anomalies.filter(a => {
    const q = search.toLowerCase();
    return !q || a.student?.name?.toLowerCase().includes(q) || a.exam?.title?.toLowerCase().includes(q);
  });

  const pageData   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const typeCounts = anomalies.reduce((acc, a) => { acc[a.type] = (acc[a.type] ?? 0) + 1; return acc; }, {});
  const highCount  = anomalies.filter(a => a.severity === "high").length;

  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "A";
  const firstName = user?.name?.split(" ")[0] ?? "Admin";

  const STATS = [
    { label: "Total Signals", value: anomalies.length,                  color: "#0056b3", bg: "#e8f0fe", icon: "bi-broadcast"            },
    { label: "High Severity", value: highCount,                          color: "#dc3545", bg: "#fff0f0", icon: "bi-exclamation-octagon"  },
    { label: "Tab Switches",  value: typeCounts.tab_switch        ?? 0, color: "#dc3545", bg: "#fff0f0", icon: "bi-window-split"          },
    { label: "Kbd Shortcuts", value: typeCounts.keyboard_shortcut ?? 0, color: "#fd7e14", bg: "#fff8f0", icon: "bi-keyboard"              },
    { label: "Resp. Time",    value: typeCounts.response_time     ?? 0, color: "#1a6ed8", bg: "#eff6ff", icon: "bi-stopwatch"             },
    { label: "Keystroke",     value: typeCounts.keystroke         ?? 0, color: "#9333ea", bg: "#fdf4ff", icon: "bi-type"                  },
  ];

  const TYPE_FILTERS = [
    { key: "all",               label: "All Types"         },
    { key: "tab_switch",        label: "Tab Switch"        },
    { key: "keyboard_shortcut", label: "Kbd Shortcut"      },
    { key: "response_time",     label: "Response Time"     },
    { key: "keystroke",         label: "Keystroke"         },
  ];
  const SEV_FILTERS = [
    { key: "all",    label: "All"    },
    { key: "high",   label: "High"   },
    { key: "medium", label: "Medium" },
    { key: "low",    label: "Low"    },
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
            <input className="dash-search" placeholder="Search student or exam…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
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
              <input className="dash-search" style={{ paddingLeft: 36 }} placeholder="Search student or exam…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>

            {/* Page header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Monitoring</p>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px" }}>Anomaly Reports</h1>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Behavioral signal log across all monitored exams</p>
              </div>
              <button className="dash-btn-ghost" onClick={load} style={{ flexShrink: 0, fontSize: 12, padding: "7px 13px" }}>
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
                <div className="filters-row" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", flexShrink: 0 }}>Type:</span>
                  {TYPE_FILTERS.map(({ key, label }) => {
                    const cfg = TYPE_CONFIG[key];
                    const active = typeFilter === key;
                    return (
                      <button key={key} className="filter-btn" onClick={() => { setTypeFilter(key); setPage(1); }}
                        style={{
                          background: active ? (cfg?.color ?? "#0056b3") : "#f1f5f9",
                          color: active ? "#fff" : "#64748b",
                        }}>
                        {key !== "all" && <i className={`bi ${cfg?.icon}`} style={{ marginRight: 4, fontSize: 11 }}></i>}
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="filters-row">
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", flexShrink: 0 }}>Severity:</span>
                  {SEV_FILTERS.map(({ key, label }) => {
                    const cfg = SEV_CONFIG[key];
                    const active = sevFilter === key;
                    return (
                      <button key={key} className="filter-btn" onClick={() => { setSevFilter(key); setPage(1); }}
                        style={{
                          background: active ? (cfg?.color ?? "#0056b3") : "#f1f5f9",
                          color: active ? "#fff" : "#64748b",
                        }}>
                        {label}
                      </button>
                    );
                  })}
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
                </div>
              </div>

              {/* Desktop table */}
              {loading ? (
                <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
                </div>
              ) : pageData.length === 0 ? (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8" }}>
                  <i className="bi bi-broadcast" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: .3 }}></i>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    {search || typeFilter !== "all" || sevFilter !== "all"
                      ? "No anomalies match your filters."
                      : "No anomaly records found."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop */}
                  <div className="hide-mobile" style={{ overflowX: "auto" }}>
                    <table className="dash-table">
                      <thead>
                        <tr>
                          {["Student", "Exam", "Type", "Algorithm", "Severity", "Detail", "Occurred"].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.map((a, i) => {
                          const tc = TYPE_CONFIG[a.type] ?? { label: a.type, icon: "bi-question", color: "#64748b", bg: "#f1f5f9", algo: "—" };
                          const sc = SEV_CONFIG[a.severity] ?? { bg: "#f1f5f9", color: "#64748b" };
                          return (
                            <tr key={a.id ?? i}>
                              <td style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>{a.student?.name ?? "—"}</td>
                              <td style={{ fontSize: 12, color: "#64748b", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.exam?.title ?? "—"}</td>
                              <td>
                                <span className="badge-pill" style={{ background: tc.bg, color: tc.color }}>
                                  <i className={`bi ${tc.icon}`}></i> {tc.label}
                                </span>
                              </td>
                              <td style={{ fontSize: 11, color: "#94a3b8" }}>{tc.algo}</td>
                              <td>
                                <span className="badge-pill" style={{ background: sc.bg, color: sc.color }}>
                                  {a.severity ?? "low"}
                                </span>
                              </td>
                              <td style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{anomalyDetail(a)}</td>
                              <td style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                                {a.occurred_at
                                  ? new Date(a.occurred_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="d-lg-none" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {pageData.map((a, i) => {
                      const tc = TYPE_CONFIG[a.type] ?? { label: a.type, icon: "bi-question", color: "#64748b", bg: "#f1f5f9", algo: "—" };
                      const sc = SEV_CONFIG[a.severity] ?? { bg: "#f1f5f9", color: "#64748b" };
                      return (
                        <div key={a.id ?? i} className="anomaly-card">
                          <div style={{ padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <i className={`bi ${tc.icon}`} style={{ color: tc.color, fontSize: 16 }}></i>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{a.student?.name ?? "—"}</span>
                                <span className="badge-pill" style={{ background: sc.bg, color: sc.color }}>{a.severity ?? "low"}</span>
                              </div>
                              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.exam?.title ?? "—"}</p>
                              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                                <span className="badge-pill" style={{ background: tc.bg, color: tc.color }}>
                                  <i className={`bi ${tc.icon}`}></i> {tc.label}
                                </span>
                                <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'DM Mono', monospace", alignSelf: "center" }}>{anomalyDetail(a)}</span>
                              </div>
                              {a.occurred_at && (
                                <p style={{ margin: "4px 0 0", fontSize: 10, color: "#94a3b8" }}>
                                  <i className="bi bi-clock me-1"></i>
                                  {new Date(a.occurred_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}