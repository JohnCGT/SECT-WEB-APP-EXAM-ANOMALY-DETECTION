// src/pages/admin/AdminPage.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

/* ─── Inject fonts & keyframes once ──────────────────────────────────── */
(function bootstrap() {
  if (document.getElementById("admin-base-styles")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Epilogue:wght@400;500;600&display=swap";
  document.head.appendChild(link);

  const style = document.createElement("style");
  style.id = "admin-base-styles";
  style.textContent = `
    *{box-sizing:border-box}
    body{margin:0;font-family:'Epilogue',sans-serif}
    @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
    @keyframes slideUp {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes rowIn   {from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
    @keyframes ddIn    {from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
    .a-btn{transition:filter .15s,transform .12s,opacity .15s;cursor:pointer}
    .a-btn:hover:not(:disabled){filter:brightness(1.07);transform:translateY(-1px)}
    .a-btn:active:not(:disabled){transform:translateY(0)}
    .a-btn:disabled{opacity:.5;cursor:not-allowed}
    .a-row{animation:rowIn .2s ease both}
    .a-tr td{transition:background .12s}
    .a-tr:hover td{background:#F5F4FF}
    .a-nav-link{transition:all .15s;text-decoration:none}
    .a-nav-link:hover{background:rgba(108,99,255,.08)!important}
    .a-dd-item{transition:background .12s}
    .a-dd-item:hover{background:#F5F4FF}
    ::-webkit-scrollbar{width:6px;height:6px}
    ::-webkit-scrollbar-track{background:#F4F3FF}
    ::-webkit-scrollbar-thumb{background:#D0CEFF;border-radius:3px}
  `;
  document.head.appendChild(style);
})();

/* ─── Design tokens ──────────────────────────────────────────────────── */
const C = {
  bg:"#F4F3FF", card:"#FFFFFF", border:"#E6E4FF",
  accent:"#6C63FF", text:"#0D0C1D", muted:"#7A788F",
  danger:"#E53935", warn:"#FB8C00", green:"#2E7D32", sidebar:"#0D0C1D",
};

/* ─── API helper ─────────────────────────────────────────────────────── */
const BASE = import.meta?.env?.VITE_API_URL ?? "/api";
async function api(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type":"application/json","Accept":"application/json","X-Requested-With":"XMLHttpRequest" },
    credentials: "include",
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? "Request failed.");
  return json;
}

/* ─── Sidebar nav items ──────────────────────────────────────────────── */
const NAV = [
  { to:"/admin",           icon:"⊞", label:"Dashboard" },
  { to:"/admin/users",     icon:"👥", label:"Users"     },
  { to:"/admin/courses",   icon:"📚", label:"Courses"   },
  { to:"/admin/exams",     icon:"📋", label:"Exams"     },
  { to:"/admin/anomalies", icon:"⚠️", label:"Anomalies" },
  { to:"/admin/support",   icon:"🎫", label:"Support"   },
];

/* ─── Shared Sidebar ─────────────────────────────────────────────────── */
export function AdminSidebar() {
  const loc = useLocation();
  return (
    <nav style={{
      width:200, background:C.sidebar, display:"flex", flexDirection:"column",
      padding:"24px 0", flexShrink:0, minHeight:"100vh",
      position:"sticky", top:0, height:"100vh",
    }}>
      <div style={{ padding:"0 20px 24px", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
        <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.accent,
          textTransform:"uppercase", letterSpacing:".14em" }}>SECT</p>
        <p style={{ margin:"2px 0 0", fontSize:18, fontWeight:800,
          fontFamily:"'Syne',sans-serif", color:"#fff" }}>Admin</p>
      </div>
      <ul style={{ listStyle:"none", margin:"16px 0 0", padding:"0 10px", flexGrow:1 }}>
        {NAV.map(({ to, icon, label }) => {
          const active = loc.pathname === to || (to !== "/admin" && loc.pathname.startsWith(to));
          return (
            <li key={to} style={{ marginBottom:4 }}>
              <Link to={to} className="a-nav-link" style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"10px 14px", borderRadius:10, fontSize:13, fontWeight:600,
                background: active ? "rgba(108,99,255,.22)" : "transparent",
                color:      active ? "#fff" : "rgba(255,255,255,.55)",
                borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent",
              }}>
                <span style={{ fontSize:16 }}>{icon}</span>{label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div style={{ padding:"16px 10px 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
        <Link to="/" className="a-nav-link" style={{
          display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
          borderRadius:10, fontSize:13, fontWeight:600, color:"rgba(255,255,255,.4)",
        }}>
          <span>⏻</span> Logout
        </Link>
      </div>
    </nav>
  );
}

/* ─── Avatar Dropdown (shared) ───────────────────────────────────────── */
function AvatarDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleLogout = async () => {
    try { await api("POST", "/logout"); } catch {}
    navigate("/");
  };

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          width:36, height:36, borderRadius:"50%",
          background: open ? "#5550d4" : C.accent,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, fontWeight:800, fontFamily:"'Syne',sans-serif",
          color:"#fff", cursor:"pointer",
          border:`2px solid ${open ? C.accent : C.border}`,
          transition:"background .15s, border-color .15s",
        }}
      >A</div>

      {open && (
        <div style={{
          position:"absolute", top:44, right:0, zIndex:1200,
          background:C.card, border:`1px solid ${C.border}`,
          borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,.16)",
          overflow:"hidden", minWidth:170,
          animation:"ddIn .15s ease",
        }}>
          <Link
            to="/admin/profile"
            onClick={() => setOpen(false)}
            className="a-dd-item"
            style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"12px 16px", textDecoration:"none",
              fontSize:13, fontWeight:600, color:C.text,
              borderBottom:`1px solid ${C.border}`,
            }}
          >
            <span>👤</span> My Profile
          </Link>
          <button
            onClick={handleLogout}
            className="a-dd-item"
            style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"12px 16px", width:"100%",
              background:"transparent", border:"none",
              fontSize:13, fontWeight:600, color:C.danger,
              cursor:"pointer", fontFamily:"'Epilogue',sans-serif",
              textAlign:"left",
            }}
          >
            <span>⏻</span> Logout
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Shared Topbar ──────────────────────────────────────────────────── */
export function AdminTopbar({ title, subtitle }) {
  return (
    <div style={{
      height:60, background:C.card, borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 28px", flexShrink:0,
    }}>
      <div>
        <p style={{ margin:0, fontSize:16, fontWeight:700,
          fontFamily:"'Syne',sans-serif", color:C.text }}>{title}</p>
        {subtitle && <p style={{ margin:0, fontSize:12, color:C.muted }}>{subtitle}</p>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <NotificationBell />
        <AvatarDropdown />
      </div>
    </div>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────── */
function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background:C.card, borderRadius:14, border:`1px solid ${C.border}`,
      padding:"20px 22px", flex:1, minWidth:160,
      boxShadow:"0 2px 12px rgba(108,99,255,.06)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.muted,
            textTransform:"uppercase", letterSpacing:".08em" }}>{label}</p>
          <p style={{ margin:"6px 0 0", fontSize:32, fontWeight:800,
            fontFamily:"'Syne',sans-serif", color: value === "—" ? C.muted : color }}>{value}</p>
        </div>
        <span style={{
          fontSize:22, width:44, height:44, borderRadius:10,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:`${color}18`,
        }}>{icon}</span>
      </div>
    </div>
  );
}

/* ─── CPI badge ──────────────────────────────────────────────────────── */
function CpiBadge({ label }) {
  const MAP = {
    High:     { bg:"#FFEBEE", color:C.danger },
    Medium:   { bg:"#FFF3E0", color:C.warn   },
    Low:      { bg:"#E8F5E9", color:C.green  },
    Unlikely: { bg:"#F3F2FF", color:C.accent },
  };
  const s = MAP[label] ?? MAP.Unlikely;
  return (
    <span style={{
      padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
      background:s.bg, color:s.color, textTransform:"uppercase", letterSpacing:".05em",
    }}>{label}</span>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────── */
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3800); return () => clearTimeout(t); }, [onDone]);
  const isErr = type === "error";
  return (
    <div style={{
      position:"fixed", bottom:28, right:28, zIndex:9999,
      background: isErr ? "#FFEBEE" : "#E8F5E9",
      color:      isErr ? C.danger  : C.green,
      padding:"12px 20px", borderRadius:10, fontSize:14, fontWeight:500,
      fontFamily:"'Epilogue',sans-serif",
      display:"flex", alignItems:"center", gap:10,
      boxShadow:"0 6px 30px rgba(0,0,0,.14)",
      animation:"slideUp .25s ease",
    }}>
      <span style={{ fontWeight:700 }}>{isErr ? "✕" : "✓"}</span>{msg}
    </div>
  );
}

/* ─── Main Dashboard Page ────────────────────────────────────────────── */
export default function AdminPage() {
  const [stats,   setStats]   = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  const notify = (msg, type="success") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("GET", "/admin/dashboard");
      setStats({
        total_users:      data.total_users      ?? 0,
        active_exams:     data.active_exams     ?? 0,
        flagged_sessions: data.flagged_sessions ?? 0,
        high_cpi_risk:    data.high_cpi_risk    ?? 0,
        open_tickets:     data.open_tickets     ?? 0,
      });
      setResults(data.recent_results ?? []);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const STAT_CARDS = [
    { label:"Total Users",      value:stats?.total_users      ?? "—", color:C.accent,  icon:"👥" },
    { label:"Active Exams",     value:stats?.active_exams     ?? "—", color:"#1E88E5", icon:"📋" },
    { label:"Flagged Sessions", value:stats?.flagged_sessions ?? "—", color:C.danger,  icon:"🚩" },
    { label:"High CPI Risk",    value:stats?.high_cpi_risk    ?? "—", color:C.warn,    icon:"⚠️" },
    { label:"Open Tickets",     value:stats?.open_tickets     ?? "—", color:C.accent,  icon:"🎫" },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'Epilogue',sans-serif" }}>
      <AdminSidebar />

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <AdminTopbar title="Dashboard" subtitle="System overview at a glance" />

        <div style={{ flex:1, padding:"28px", overflowY:"auto" }}>

          {/* Stat cards */}
          <div style={{ display:"flex", gap:16, marginBottom:28, flexWrap:"wrap" }}>
            {STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)}
          </div>

          {/* Quick links */}
          <div style={{ display:"flex", gap:14, marginBottom:28, flexWrap:"wrap" }}>
            {[
              { to:"/admin/users",     label:"Manage Users",   color:C.accent  },
              { to:"/admin/courses",   label:"View Courses",   color:"#1E88E5" },
              { to:"/admin/exams",     label:"Manage Exams",   color:"#1E88E5" },
              { to:"/admin/anomalies", label:"View Anomalies", color:C.danger  },
              { to:"/admin/support",   label:"Support Center", color:C.accent  },
            ].map(({ to, label, color }) => (
              <Link key={to} to={to} className="a-btn" style={{
                textDecoration:"none", padding:"9px 18px", borderRadius:10,
                background:C.card, border:`1.5px solid ${C.border}`,
                fontSize:13, fontWeight:600, color,
                display:"flex", alignItems:"center", gap:6,
              }}>
                {label} →
              </Link>
            ))}
          </div>

          {/* CPI Report Table */}
          <div style={{
            background:C.card, borderRadius:14, border:`1px solid ${C.border}`,
            boxShadow:"0 2px 12px rgba(108,99,255,.05)", overflow:"hidden",
          }}>
            <div style={{
              padding:"18px 22px", borderBottom:`1px solid ${C.border}`,
              display:"flex", justifyContent:"space-between", alignItems:"center",
            }}>
              <div>
                <h3 style={{ margin:0, fontSize:16, fontWeight:800,
                  fontFamily:"'Syne',sans-serif", color:C.text }}>Recent CPI Reports</h3>
                <p style={{ margin:"2px 0 0", fontSize:13, color:C.muted }}>
                  Cheating Probability Index — latest submissions
                </p>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button className="a-btn" onClick={load} style={{
                  border:`1.5px solid ${C.border}`, background:"transparent",
                  borderRadius:8, padding:"7px 14px", fontSize:12,
                  fontFamily:"'Epilogue',sans-serif", fontWeight:600, color:C.muted,
                }}>↻ Refresh</button>
                <Link to="/admin/anomalies" style={{
                  textDecoration:"none", padding:"7px 14px", borderRadius:8,
                  fontSize:12, fontWeight:600, color:C.accent,
                  border:`1.5px solid ${C.accent}`,
                }}>View All</Link>
              </div>
            </div>

            {loading ? (
              <div style={{ padding:50, textAlign:"center", color:C.muted, fontSize:14 }}>
                Loading dashboard data…
              </div>
            ) : results.length === 0 ? (
              <div style={{ padding:50, textAlign:"center", color:C.muted, fontSize:14 }}>
                No CPI reports yet.
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#FAFAFE", borderBottom:`1px solid ${C.border}` }}>
                    {["Student","Exam","CPI Score","Risk Level","Flagged Signals","Processed"].map(h => (
                      <th key={h} style={{ padding:"11px 18px", textAlign:"left", fontSize:11,
                        fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.id ?? i} className="a-tr a-row"
                      style={{ borderBottom:`1px solid ${C.border}`, animationDelay:`${i*30}ms` }}>
                      <td style={{ padding:"13px 18px", fontSize:14, fontWeight:600, color:C.text }}>
                        {r.student?.name ?? "—"}
                      </td>
                      <td style={{ padding:"13px 18px", fontSize:13, color:C.muted }}>
                        {r.exam?.title ?? "—"}
                      </td>
                      <td style={{ padding:"13px 18px" }}>
                        <span style={{
                          fontSize:15, fontWeight:800, fontFamily:"'Syne',sans-serif",
                          color: r.cpi_score >= 0.7 ? C.danger : r.cpi_score >= 0.4 ? C.warn : C.green,
                        }}>
                          {typeof r.cpi_score === "number" ? r.cpi_score.toFixed(2) : "—"}
                        </span>
                      </td>
                      <td style={{ padding:"13px 18px" }}>
                        <CpiBadge label={r.cpi_label ?? "Unlikely"} />
                      </td>
                      <td style={{ padding:"13px 18px" }}>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {r.iso_tab_flagged && <span style={{ fontSize:11, background:"#FFEBEE", color:C.danger,   padding:"2px 7px", borderRadius:6 }}>Tab</span>}
                          {r.svm_flagged     && <span style={{ fontSize:11, background:"#FFF3E0", color:C.warn,     padding:"2px 7px", borderRadius:6 }}>Keys</span>}
                          {r.rt_flagged      && <span style={{ fontSize:11, background:"#E3F2FD", color:"#1565C0", padding:"2px 7px", borderRadius:6 }}>Time</span>}
                          {r.hmm_flagged     && <span style={{ fontSize:11, background:"#F3E5F5", color:"#6A1B9A", padding:"2px 7px", borderRadius:6 }}>HMM</span>}
                          {!r.iso_tab_flagged && !r.svm_flagged && !r.rt_flagged && !r.hmm_flagged &&
                            <span style={{ fontSize:11, color:C.muted }}>None</span>}
                        </div>
                      </td>
                      <td style={{ padding:"13px 18px", fontSize:12, color:C.muted }}>
                        {r.processed_at
                          ? new Date(r.processed_at).toLocaleString("en-PH", {
                              month:"short", day:"numeric", hour:"2-digit", minute:"2-digit",
                            })
                          : "Pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
