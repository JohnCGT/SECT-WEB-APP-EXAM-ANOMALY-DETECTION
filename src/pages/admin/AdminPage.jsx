// src/pages/admin/AdminPage.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
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
    border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:200;height:56px;
    display:flex;align-items:center;padding:0 20px;gap:12px;
  }
  .dash-avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  .skeleton{background:linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .dash-btn-primary{
    background:var(--blue);color:#fff;border:none;border-radius:10px;
    padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;
    font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;
    transition:opacity .15s,transform .15s;text-decoration:none;
  }
  .dash-btn-primary:hover{opacity:.87;transform:translateY(-1px);color:#fff;}
  .dash-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .dash-btn-ghost{
    background:#fff;border:1px solid rgba(0,86,179,.15);color:#64748b;
    border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;
    transition:all .15s;text-decoration:none;
  }
  .dash-btn-ghost:hover{background:#f1f5f9;color:#1e293b;}
  .action-btn{
    width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,86,179,.12);
    background:#fff;display:inline-flex;align-items:center;justify-content:center;
    cursor:pointer;transition:all .15s;font-size:13px;text-decoration:none;color:#64748b;flex-shrink:0;
  }
  .action-btn:hover{background:var(--blue-lite);border-color:var(--blue);color:var(--blue);}
  .action-btn.del:hover{background:#fef2f2;border-color:#ef4444;color:#ef4444;}
  .action-btn.warn:hover{background:#fff7ed;border-color:#f59e0b;color:#f59e0b;}
  .action-btn.suc:hover{background:#f0fdf4;border-color:#22c55e;color:#22c55e;}
  .badge-pill{
    display:inline-flex;align-items:center;padding:2px 9px;border-radius:99px;
    font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;
  }
  .dash-table{width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif;}
  .dash-table th{padding:10px 14px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.06em;white-space:nowrap;border-bottom:1px solid #f1f5f9;text-align:left;background:#f8faff;}
  .dash-table td{padding:12px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle;}
  .dash-table tbody tr{transition:background .15s;}
  .dash-table tbody tr:hover{background:#f8faff;}
  .dash-table tbody tr:last-child td{border-bottom:none;}
  .form-ctrl{
    width:100%;border:1px solid rgba(0,86,179,.15);border-radius:10px;
    padding:9px 13px;font-size:13px;color:#1e293b;outline:none;
    font-family:'DM Sans',sans-serif;background:#f8faff;
    transition:border-color .2s,box-shadow .2s;
  }
  .form-ctrl:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .form-ctrl:disabled{opacity:.6;cursor:not-allowed;}
  .form-lbl{font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;display:block;}
  .dash-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);backdrop-filter:blur(4px);z-index:1055;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;}
  .dash-modal{background:#fff;border-radius:20px;width:100%;max-width:520px;box-shadow:0 24px 64px rgba(0,0,0,.18);overflow:hidden;display:flex;flex-direction:column;max-height:calc(100vh - 32px);animation:fadeUp .25s ease;}
  .dash-modal-hdr{padding:22px 24px 16px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0;}
  .dash-modal-body{overflow-y:auto;padding:20px 24px;flex:1;}
  .dash-modal-ftr{padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;}
  .admin-bottom-nav{
    position:fixed;bottom:0;left:0;right:0;height:64px;
    background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);
    border-top:1px solid rgba(0,86,179,0.10);
    display:flex;align-items:stretch;z-index:1030;
    box-shadow:0 -4px 24px rgba(0,86,179,0.08);
  }
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bnav-item i{font-size:19px;}
  .stat-chip{
    flex:1;min-width:0;border-radius:14px;padding:12px;
    display:flex;align-items:center;gap:8px;
    border:1px solid rgba(0,86,179,.06);background:#fff;
    box-shadow:0 1px 3px rgba(0,0,0,.04);cursor:pointer;
    transition:border-color .15s,box-shadow .15s,transform .15s;
  }
  .stat-chip:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,86,179,.10);}
  .stat-chip.selected{border-color:currentColor;box-shadow:0 4px 16px rgba(0,86,179,.12);}
  @media(max-width:767px){
    .hide-mobile{display:none!important;}
    .dash-table td,.dash-table th{padding:10px 10px;font-size:12px;}
  }
  @media(max-width:575px){
    .dash-table td,.dash-table th{padding:8px;}
  }
`;

/* ─── Nav items ──────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/admin",           icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/admin/users",     icon: "bi-people",               label: "Users"     },
  { to: "/admin/courses",   icon: "bi-book",                 label: "Courses"   },
  { to: "/admin/exams",     icon: "bi-file-earmark-text",    label: "Exams"     },
  // { to: "/admin/anomalies", icon: "bi-exclamation-triangle", label: "Anomalies" },
  { to: "/admin/support",   icon: "bi-headset",              label: "Support"   },
];

const BOTTOM_NAV = [
  { to: "/admin",           icon: "bi-speedometer2",      label: "Home"      },
  { to: "/admin/users",     icon: "bi-people",            label: "Users"     },
  { to: "/admin/exams",     icon: "bi-file-earmark-text", label: "Exams"     },
  // { to: "/admin/anomalies", icon: "bi-exclamation-triangle", label: "Flags"  },
  { to: "/admin/support",   icon: "bi-headset",           label: "Support"   },
];

/* ─── API helper ─────────────────────────────────────────────────────── */
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

/* ─── Shared Layout Components ───────────────────────────────────────── */
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
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "A";
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
            <li><button className="dropdown-item text-danger" onClick={onLogout}
              style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>Logout</button></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ─── CPI label chip ─────────────────────────────────────────────────── */
function CpiChip({ label }) {
  const MAP = {
    High:     { bg: "#fff0f0", color: "#dc3545" },
    Medium:   { bg: "#fff8f0", color: "#fd7e14" },
    Low:      { bg: "#f0fdf4", color: "#16a34a" },
    Unlikely: { bg: "#e8f0fe", color: "#0056b3" },
  };
  const s = MAP[label] ?? MAP.Unlikely;
  return (
    <span className="badge-pill" style={{ background: s.bg, color: s.color }}>{label}</span>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────── */
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
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, color: value === "—" ? "#94a3b8" : color, fontFamily: "'DM Sans', sans-serif" }}>{value}</p>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className={`bi ${icon}`} style={{ color, fontSize: 16 }}></i>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD PAGE
════════════════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user,    setUser]    = useState(null);

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
      setResults(dashData.recent_results ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const STAT_CARDS = [
    { label: "Total Users",      value: stats?.total_users      ?? "—", color: "#0056b3", bg: "#e8f0fe", icon: "bi-people"              },
    { label: "Active Exams",     value: stats?.active_exams     ?? "—", color: "#1a6ed8", bg: "#dbeafe", icon: "bi-file-earmark-text"   },
    { label: "Flagged Sessions", value: stats?.flagged_sessions ?? "—", color: "#dc3545", bg: "#fff0f0", icon: "bi-flag"                },
    { label: "High CPI Risk",    value: stats?.high_cpi_risk    ?? "—", color: "#fd7e14", bg: "#fff8f0", icon: "bi-exclamation-triangle" },
    { label: "Open Tickets",     value: stats?.open_tickets     ?? "—", color: "#0056b3", bg: "#e8f0fe", icon: "bi-headset"             },
  ];

  return (
    <>
      <style>{SHARED_CSS}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        <AdminTopbar user={user} onLogout={handleLogout} />

        <div className="d-flex">
          <AdminSidebar navItems={NAV_ITEMS} />

          <main style={{ flex: 1, padding: "20px 16px", paddingBottom: 90, minWidth: 0 }}>

            {/* Page header */}
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
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>Quick Links</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { to: "/admin/users",     label: "Manage Users",   icon: "bi-people"              },
                  { to: "/admin/courses",   label: "View Courses",   icon: "bi-book"                },
                  { to: "/admin/exams",     label: "Manage Exams",   icon: "bi-file-earmark-text"   },
                  { to: "/admin/anomalies", label: "View Anomalies", icon: "bi-exclamation-triangle" },
                  { to: "/admin/support",   label: "Support Center", icon: "bi-headset"             },
                ].map(({ to, label, icon }) => (
                  <Link key={to} to={to} className="dash-btn-ghost" style={{ fontSize: 12, padding: "7px 13px" }}>
                    <i className={`bi ${icon}`}></i> {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* CPI Report Table */}
            <div className="dash-card fade-up">
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    <i className="bi bi-graph-up-arrow me-2" style={{ color: "#0056b3" }}></i>Recent CPI Reports
                  </h2>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>Cheating Probability Index — latest submissions</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="dash-btn-ghost" onClick={load} style={{ fontSize: 12, padding: "6px 12px" }}>
                    {loading ? <span className="spinner-border spinner-border-sm" style={{ width: "0.75rem", height: "0.75rem" }} /> : "↻ Refresh"}
                  </button>
                  <Link to="/admin/anomalies" className="dash-btn-primary" style={{ fontSize: 12, padding: "6px 12px" }}>
                    View All
                  </Link>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  <span className="spinner-border spinner-border-sm me-2" style={{ color: "#0056b3" }} />Loading dashboard data…
                </div>
              ) : results.length === 0 ? (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  <i className="bi bi-graph-up" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: .3 }}></i>
                  No CPI reports yet.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="dash-table">
                    <thead>
                      <tr>
                        {["Student", "Exam", "CPI Score", "Risk Level", "Flagged Signals", "Processed"].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={r.id ?? i}>
                          <td style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>{r.student?.name ?? "—"}</td>
                          <td style={{ fontSize: 12, color: "#64748b" }}>{r.exam?.title ?? "—"}</td>
                          <td>
                            <span style={{
                              fontSize: 14, fontWeight: 700,
                              color: r.cpi_score >= 0.7 ? "#dc3545" : r.cpi_score >= 0.4 ? "#fd7e14" : "#16a34a",
                            }}>
                              {typeof r.cpi_score === "number" ? r.cpi_score.toFixed(2) : "—"}
                            </span>
                          </td>
                          <td><CpiChip label={r.cpi_label ?? "Unlikely"} /></td>
                          <td>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {r.iso_tab_flagged && <span className="badge-pill" style={{ background: "#fff0f0", color: "#dc3545" }}>Tab</span>}
                              {r.svm_flagged     && <span className="badge-pill" style={{ background: "#fff8f0", color: "#fd7e14" }}>Keys</span>}
                              {r.rt_flagged      && <span className="badge-pill" style={{ background: "#eff6ff", color: "#1a6ed8" }}>Time</span>}
                              {r.hmm_flagged     && <span className="badge-pill" style={{ background: "#fdf4ff", color: "#9333ea" }}>HMM</span>}
                              {!r.iso_tab_flagged && !r.svm_flagged && !r.rt_flagged && !r.hmm_flagged &&
                                <span style={{ fontSize: 11, color: "#94a3b8" }}>None</span>}
                            </div>
                          </td>
                          <td style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                            {r.processed_at
                              ? new Date(r.processed_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                              : "Pending"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>

        <AdminBottomNav navItems={BOTTOM_NAV} active="Home" />
      </div>
    </>
  );
}