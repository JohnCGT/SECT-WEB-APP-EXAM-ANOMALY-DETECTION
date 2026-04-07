// src/pages/admin/SystemLogs.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";

/* ─── Inject shared styles ───────────────────────────────────────────── */
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
    *{box-sizing:border-box}body{margin:0;font-family:'Epilogue',sans-serif}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes rowIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
    .a-btn{transition:filter .15s,transform .12s,opacity .15s;cursor:pointer}
    .a-btn:hover:not(:disabled){filter:brightness(1.07);transform:translateY(-1px)}
    .a-btn:active:not(:disabled){transform:translateY(0)}
    .a-btn:disabled{opacity:.5;cursor:not-allowed}
    .a-row{animation:rowIn .2s ease both}
    .a-nav-link{transition:all .15s;text-decoration:none}
    .a-nav-link:hover{background:rgba(108,99,255,.08)!important}
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

/* ─── API ────────────────────────────────────────────────────────────── */
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

/* ─── Sidebar ────────────────────────────────────────────────────────── */
const NAV = [
  { to:"/admin",           icon:"⊞", label:"Dashboard" },
  { to:"/admin/users",     icon:"👥", label:"Users"     },
  { to:"/admin/exams",     icon:"📋", label:"Exams"     },
  { to:"/admin/anomalies", icon:"⚠️", label:"Anomalies" },
  { to:"/admin/logs",      icon:"📊", label:"Logs"      },
];
function Sidebar() {
  const loc = useLocation();
  return (
    <nav style={{ width:200, background:C.sidebar, display:"flex", flexDirection:"column",
      padding:"24px 0", flexShrink:0, minHeight:"100vh" }}>
      <div style={{ padding:"0 20px 24px", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
        <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:".14em" }}>SECT</p>
        <p style={{ margin:"2px 0 0", fontSize:18, fontWeight:800, fontFamily:"'Syne',sans-serif", color:"#fff" }}>Admin</p>
      </div>
      <ul style={{ listStyle:"none", margin:"16px 0 0", padding:"0 10px", flexGrow:1 }}>
        {NAV.map(({ to, icon, label }) => {
          const active = loc.pathname === to || (to !== "/admin" && loc.pathname.startsWith(to));
          return (
            <li key={to} style={{ marginBottom:4 }}>
              <Link to={to} className="a-nav-link" style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                borderRadius:10, fontSize:13, fontWeight:600,
                background: active ? "rgba(108,99,255,.22)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,.55)",
                borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent",
              }}><span style={{ fontSize:16 }}>{icon}</span>{label}</Link>
            </li>
          );
        })}
      </ul>
      <div style={{ padding:"16px 10px 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
        <Link to="/" className="a-nav-link" style={{
          display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
          borderRadius:10, fontSize:13, fontWeight:600, color:"rgba(255,255,255,.4)",
        }}><span>⏻</span> Logout</Link>
      </div>
    </nav>
  );
}

/* ─── Topbar ─────────────────────────────────────────────────────────── */
function Topbar({ title, subtitle }) {
  return (
    <div style={{ height:60, background:C.card, borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 28px", flexShrink:0 }}>
      <div>
        <p style={{ margin:0, fontSize:16, fontWeight:700, fontFamily:"'Syne',sans-serif", color:C.text }}>{title}</p>
        {subtitle && <p style={{ margin:0, fontSize:12, color:C.muted }}>{subtitle}</p>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <input placeholder="Search…" style={{
          padding:"7px 14px", border:`1.5px solid ${C.border}`, borderRadius:20,
          fontSize:13, fontFamily:"'Epilogue',sans-serif", color:C.text,
          background:C.bg, outline:"none", width:220,
        }} />
        <div style={{ width:36, height:36, borderRadius:"50%", background:C.accent,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, fontWeight:800, fontFamily:"'Syne',sans-serif", color:"#fff" }}>A</div>
      </div>
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────── */
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3800); return () => clearTimeout(t); }, [onDone]);
  const isErr = type === "error";
  return (
    <div style={{
      position:"fixed", bottom:28, right:28, zIndex:9999,
      background: isErr ? "#FFEBEE" : "#E8F5E9", color: isErr ? C.danger : C.green,
      padding:"12px 20px", borderRadius:10, fontSize:14, fontWeight:500,
      fontFamily:"'Epilogue',sans-serif", display:"flex", alignItems:"center", gap:10,
      boxShadow:"0 6px 30px rgba(0,0,0,.14)", animation:"slideUp .25s ease",
    }}>
      <span style={{ fontWeight:700 }}>{isErr ? "✕" : "✓"}</span>{msg}
    </div>
  );
}

/* ─── Log event type config ──────────────────────────────────────────── */
/**
 * NOTE: System logs require a backend implementation.
 * Recommended: install spatie/laravel-activitylog (https://spatie.be/docs/laravel-activitylog)
 * and log admin/instructor actions via:
 *   activity()->causedBy($user)->on($subject)->log("Event description");
 *
 * GET /api/admin/logs should return:
 * { data: [{ id, event, description, causer: {name, role}, subject_type, subject_id,
 *            properties: {…}, created_at }] }
 */
const EVENT_CFG = {
  user_created:     { icon:"👤", label:"User Created",      color:C.green,   bg:"#E8F5E9" },
  user_updated:     { icon:"✏️", label:"User Updated",      color:"#1565C0", bg:"#E3F2FD" },
  user_suspended:   { icon:"🔒", label:"User Suspended",    color:C.warn,    bg:"#FFF3E0" },
  user_deleted:     { icon:"🗑️", label:"User Deleted",      color:C.danger,  bg:"#FFEBEE" },
  exam_created:     { icon:"📝", label:"Exam Created",      color:C.accent,  bg:"#EDE9FF" },
  exam_updated:     { icon:"📋", label:"Exam Updated",      color:"#1565C0", bg:"#E3F2FD" },
  exam_enabled:     { icon:"✅", label:"Exam Enabled",      color:C.green,   bg:"#E8F5E9" },
  exam_disabled:    { icon:"⛔", label:"Exam Disabled",     color:C.warn,    bg:"#FFF3E0" },
  sessions_reset:   { icon:"🔄", label:"Sessions Reset",    color:C.danger,  bg:"#FFEBEE" },
  admin_login:      { icon:"🔑", label:"Admin Login",       color:C.muted,   bg:"#F4F3FF" },
  flagged_session:  { icon:"🚩", label:"Session Flagged",   color:C.danger,  bg:"#FFEBEE" },
};

const DEFAULT_EVENT = { icon:"📌", label:"System Event", color:C.muted, bg:"#F4F3FF" };

/* ─── Log timeline item ──────────────────────────────────────────────── */
function LogItem({ log, index }) {
  const cfg = EVENT_CFG[log.event] ?? DEFAULT_EVENT;
  return (
    <div className="a-row" style={{
      display:"flex", gap:16, padding:"16px 22px",
      borderBottom:`1px solid ${C.border}`,
      animationDelay:`${index * 20}ms`,
    }}>
      {/* Icon */}
      <div style={{
        width:38, height:38, borderRadius:10, flexShrink:0,
        background:cfg.bg, display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:18,
      }}>{cfg.icon}</div>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
          <div>
            <span style={{
              display:"inline-block", padding:"2px 8px", borderRadius:12,
              fontSize:10, fontWeight:700, background:cfg.bg, color:cfg.color,
              textTransform:"uppercase", letterSpacing:".07em", marginBottom:4,
            }}>{cfg.label}</span>
            <p style={{ margin:0, fontSize:14, color:C.text, fontWeight:500, lineHeight:1.5 }}>
              {log.description ?? "System event recorded."}
            </p>
            {log.causer && (
              <p style={{ margin:"3px 0 0", fontSize:12, color:C.muted }}>
                by <strong style={{ color:C.text }}>{log.causer.name}</strong>
                {log.causer.role && <span style={{ marginLeft:4, opacity:.6 }}>({log.causer.role})</span>}
              </p>
            )}
          </div>
          <span style={{ fontSize:11, color:C.muted, whiteSpace:"nowrap", flexShrink:0 }}>
            {log.created_at
              ? new Date(log.created_at).toLocaleString("en-PH", {
                  month:"short", day:"numeric", hour:"2-digit", minute:"2-digit",
                })
              : "—"}
          </span>
        </div>

        {/* Properties/metadata */}
        {log.properties && Object.keys(log.properties).length > 0 && (
          <div style={{ marginTop:8, display:"flex", gap:6, flexWrap:"wrap" }}>
            {Object.entries(log.properties).slice(0, 4).map(([k, v]) => (
              <span key={k} style={{
                fontSize:11, padding:"2px 8px", borderRadius:6,
                background:C.bg, color:C.muted, fontFamily:"monospace",
              }}>
                {k}: {String(v)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function SystemLogs() {
  const [logs,        setLogs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [eventFilter, setEventFilter] = useState("all");
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [toast,       setToast]       = useState(null);

  const notify = (msg, type = "success") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      /**
       * GET /api/admin/logs
       * Optional query param: event (e.g. user_created, exam_enabled, …)
       *
       * ⚠️  Backend requirement: No system_logs table exists in your current migrations.
       * You need to either:
       *   1. Install spatie/laravel-activitylog and call activity()->log() in your
       *      controllers whenever admin actions happen (recommended).
       *   2. Create a custom system_logs table and a LogService that writes to it.
       *
       * Expected response shape:
       * { data: [{ id, event, description, causer:{name,role}, subject_type,
       *            subject_id, properties:{…}, created_at }] }
       */
      const params = new URLSearchParams();
      if (eventFilter !== "all") params.set("event", eventFilter);
      const res = await api("GET", `/admin/logs?${params}`);
      setLogs(res.data ?? (Array.isArray(res) ? res : []));
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [eventFilter]);

  useEffect(() => { load(); setPage(1); }, [load]);

  /* Client-side search + pagination */
  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    return !q
      || l.description?.toLowerCase().includes(q)
      || l.causer?.name?.toLowerCase().includes(q);
  });

  const PER_PAGE = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* Group by date for timeline headers */
  const grouped = pageData.reduce((acc, log, i) => {
    const date = log.created_at
      ? new Date(log.created_at).toLocaleDateString("en-PH", { weekday:"long", year:"numeric", month:"long", day:"numeric" })
      : "Unknown Date";
    if (!acc[date]) acc[date] = [];
    acc[date].push({ log, i });
    return acc;
  }, {});

  const EVENT_FILTER_OPTIONS = [
    { value:"all",            label:"All Events"        },
    { value:"user_created",   label:"User Created"      },
    { value:"user_suspended", label:"User Suspended"    },
    { value:"user_deleted",   label:"User Deleted"      },
    { value:"exam_enabled",   label:"Exam Enabled"      },
    { value:"exam_disabled",  label:"Exam Disabled"     },
    { value:"sessions_reset", label:"Sessions Reset"    },
    { value:"admin_login",    label:"Admin Login"       },
    { value:"flagged_session",label:"Session Flagged"   },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'Epilogue',sans-serif" }}>
      <Sidebar />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Topbar title="System Logs" subtitle="Full audit trail of admin and system activity" />

        <div style={{ flex:1, padding:"28px", overflowY:"auto" }}>

          {/* Backend warning banner */}
          <div style={{
            background:"#FFF8E1", border:"1.5px solid #FFE082",
            borderRadius:10, padding:"12px 18px", marginBottom:22,
            display:"flex", alignItems:"flex-start", gap:12,
          }}>
            <span style={{ fontSize:18, flexShrink:0 }}>⚠️</span>
            <div>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#F57F17" }}>Backend implementation required</p>
              <p style={{ margin:"3px 0 0", fontSize:12, color:"#795548", lineHeight:1.5 }}>
                System logs need a logging layer. Install{" "}
                <code style={{ background:"#FFF3E0", padding:"1px 5px", borderRadius:4 }}>spatie/laravel-activitylog</code>{" "}
                and log admin actions in your controllers. See the comment in this file's API call for the expected response shape.
              </p>
            </div>
          </div>

          {/* Filters + log list */}
          <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`,
            boxShadow:"0 2px 12px rgba(108,99,255,.05)", overflow:"hidden" }}>

            {/* Toolbar */}
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`,
              display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              {/* Search */}
              <div style={{ position:"relative", flex:1, minWidth:200 }}>
                <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:13, color:C.muted }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search description or user…" style={{
                    width:"100%", padding:"8px 12px 8px 34px",
                    border:`1.5px solid ${C.border}`, borderRadius:8,
                    fontSize:13, fontFamily:"'Epilogue',sans-serif", color:C.text,
                    background:"#fff", outline:"none",
                  }} />
              </div>

              {/* Event type select */}
              <select value={eventFilter} onChange={e => { setEventFilter(e.target.value); setPage(1); }} style={{
                padding:"8px 14px", border:`1.5px solid ${C.border}`, borderRadius:8,
                fontSize:12, fontFamily:"'Epilogue',sans-serif", fontWeight:600,
                color:C.text, background:"#fff", cursor:"pointer", outline:"none",
              }}>
                {EVENT_FILTER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <button className="a-btn" onClick={load} style={{
                border:`1.5px solid ${C.border}`, background:"transparent", borderRadius:8,
                padding:"7px 14px", fontSize:12, fontWeight:600, color:C.muted,
                fontFamily:"'Epilogue',sans-serif",
              }}>↻ Refresh</button>

              <span style={{ fontSize:12, color:C.muted, marginLeft:"auto" }}>
                {logs.length} total events
              </span>
            </div>

            {/* Log entries */}
            {loading ? (
              <div style={{ padding:60, textAlign:"center", color:C.muted, fontSize:14 }}>Loading logs…</div>
            ) : pageData.length === 0 ? (
              <div style={{ padding:60, textAlign:"center" }}>
                <p style={{ fontSize:32, margin:"0 0 8px" }}>📋</p>
                <p style={{ fontSize:14, color:C.muted, margin:0 }}>
                  {search || eventFilter !== "all" ? "No logs match your filters." : "No system logs yet. Once you install an activity logger and perform admin actions, they'll appear here."}
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([date, entries]) => (
                <div key={date}>
                  {/* Date header */}
                  <div style={{
                    padding:"8px 22px", background:C.bg,
                    borderBottom:`1px solid ${C.border}`,
                    borderTop:`1px solid ${C.border}`,
                    fontSize:11, fontWeight:700, color:C.muted,
                    textTransform:"uppercase", letterSpacing:".1em",
                  }}>
                    {date}
                  </div>
                  {entries.map(({ log, i }) => (
                    <LogItem key={log.id ?? i} log={log} index={i} />
                  ))}
                </div>
              ))
            )}

            {/* Pagination */}
            {!loading && filtered.length > PER_PAGE && (
              <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.border}`,
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:C.muted }}>
                  {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
                </span>
                <div style={{ display:"flex", gap:6 }}>
                  <button className="a-btn" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} style={{
                    border:`1.5px solid ${C.border}`, background:"transparent", borderRadius:6,
                    padding:"5px 12px", fontSize:12, fontWeight:600, color:C.muted,
                  }}>← Prev</button>
                  <span style={{ fontSize:12, color:C.text, display:"flex", alignItems:"center", padding:"0 8px" }}>
                    {page} / {totalPages}
                  </span>
                  <button className="a-btn" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} style={{
                    border:`1.5px solid ${C.border}`, background:"transparent", borderRadius:6,
                    padding:"5px 12px", fontSize:12, fontWeight:600, color:C.muted,
                  }}>Next →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}