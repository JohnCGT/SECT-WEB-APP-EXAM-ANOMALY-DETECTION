// src/pages/admin/AnomalyReports.jsx
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
    .a-tr td{transition:background .12s}
    .a-tr:hover td{background:#F5F4FF}
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
                display:"flex", alignItems:"center", gap:10,
                padding:"10px 14px", borderRadius:10, fontSize:13, fontWeight:600,
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
          fontSize:14, fontWeight:800, fontFamily:"'Syne',sans-serif", color:"#fff", cursor:"pointer" }}>A</div>
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

/* ─── Anomaly type config ─────────────────────────────────────────────── */
const TYPE_CONFIG = {
  tab_switch:        { label:"Tab Switch",       icon:"🪟", color:"#E53935", bg:"#FFEBEE", algo:"Isolation Forest"    },
  keyboard_shortcut: { label:"Keyboard Shortcut",icon:"⌨️", color:"#FB8C00", bg:"#FFF3E0", algo:"One-Class SVM"        },
  response_time:     { label:"Response Time",    icon:"⏱️", color:"#1E88E5", bg:"#E3F2FD", algo:"Z-Score"              },
  keystroke:         { label:"Keystroke",        icon:"🔡", color:"#6A1B9A", bg:"#F3E5F5", algo:"Hidden Markov Model"  },
};

const SEV_CONFIG = {
  high:   { bg:"#FFEBEE", color:"#E53935" },
  medium: { bg:"#FFF3E0", color:"#FB8C00" },
  low:    { bg:"#E8F5E9", color:"#2E7D32" },
};

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function AnomalyReports() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [sevFilter,  setSevFilter]  = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast]   = useState(null);
  const [page, setPage]     = useState(1);

  const notify = (msg, type = "success") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      /**
       * GET /api/admin/anomalies
       * Query params: type (tab_switch|keyboard_shortcut|response_time|keystroke), severity (low|medium|high)
       *
       * Expects a unified anomaly feed. Your backend should UNION the four anomaly log
       * tables (tab_switch_logs, keyboard_shortcut_logs, response_time_logs,
       * keystroke_dynamics_logs) and attach student + exam info.
       *
       * Response shape: { data: [{ id, type, severity, student: {name}, exam: {title},
       *   cpi_score, detail: {…}, occurred_at }] }
       */
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (sevFilter  !== "all") params.set("severity", sevFilter);
      const res = await api("GET", `/admin/anomalies?${params}`);
      setAnomalies(res.data ?? (Array.isArray(res) ? res : []));
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, sevFilter]);

  useEffect(() => { load(); setPage(1); }, [load]);

  /* client-side search + pagination */
  const filtered = anomalies.filter(a => {
    const q = search.toLowerCase();
    return !q || a.student?.name?.toLowerCase().includes(q) || a.exam?.title?.toLowerCase().includes(q);
  });
  const PER_PAGE = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* Counts by type */
  const typeCounts = anomalies.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1; return acc;
  }, {});
  const highCount = anomalies.filter(a => a.severity === "high").length;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'Epilogue',sans-serif" }}>
      <Sidebar />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Topbar title="Anomaly Reports" subtitle="Behavioral signal log across all monitored exams" />

        <div style={{ flex:1, padding:"28px", overflowY:"auto" }}>

          {/* Summary stat row */}
          <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
            {[
              { label:"Total Signals",  value: anomalies.length,                   color: C.accent,  icon:"📡" },
              { label:"High Severity",  value: highCount,                           color: C.danger,  icon:"🚨" },
              { label:"Tab Switches",   value: typeCounts.tab_switch        ?? 0,   color:"#E53935",  icon:"🪟" },
              { label:"Kbd Shortcuts",  value: typeCounts.keyboard_shortcut ?? 0,   color:"#FB8C00",  icon:"⌨️" },
              { label:"Resp. Time",     value: typeCounts.response_time     ?? 0,   color:"#1E88E5",  icon:"⏱️" },
              { label:"Keystroke",      value: typeCounts.keystroke         ?? 0,   color:"#6A1B9A",  icon:"🔡" },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{
                background:C.card, borderRadius:12, border:`1px solid ${C.border}`,
                padding:"14px 18px", flex:1, minWidth:120,
                boxShadow:"0 2px 10px rgba(108,99,255,.05)",
              }}>
                <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.muted,
                  textTransform:"uppercase", letterSpacing:".08em" }}>{label}</p>
                <p style={{ margin:"4px 0 0", fontSize:26, fontWeight:800,
                  fontFamily:"'Syne',sans-serif", color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filters + table */}
          <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`,
            boxShadow:"0 2px 12px rgba(108,99,255,.05)", overflow:"hidden" }}>

            {/* Toolbar */}
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`,
              display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              {/* Search */}
              <div style={{ position:"relative", flex:1, minWidth:200 }}>
                <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:13, color:C.muted }}>🔍</span>
                <input className="a-btn" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search student or exam…" style={{
                    width:"100%", padding:"8px 12px 8px 34px", border:`1.5px solid ${C.border}`,
                    borderRadius:8, fontSize:13, fontFamily:"'Epilogue',sans-serif",
                    color:C.text, background:"#fff", outline:"none",
                  }} />
              </div>

              {/* Type filter */}
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {["all","tab_switch","keyboard_shortcut","response_time","keystroke"].map(t => {
                  const cfg = TYPE_CONFIG[t];
                  return (
                    <button key={t} className="a-btn" onClick={() => { setTypeFilter(t); setPage(1); }} style={{
                      border:"none", borderRadius:20, padding:"6px 14px",
                      fontSize:12, fontWeight:700, cursor:"pointer",
                      fontFamily:"'Epilogue',sans-serif",
                      background: typeFilter === t ? (cfg?.color ?? C.accent) : C.bg,
                      color: typeFilter === t ? "#fff" : C.muted,
                    }}>
                      {t === "all" ? "All Types" : (cfg?.label ?? t)}
                    </button>
                  );
                })}
              </div>

              {/* Severity filter */}
              <div style={{ display:"flex", gap:6 }}>
                {["all","high","medium","low"].map(s => (
                  <button key={s} className="a-btn" onClick={() => { setSevFilter(s); setPage(1); }} style={{
                    border:"none", borderRadius:20, padding:"6px 12px",
                    fontSize:12, fontWeight:700, cursor:"pointer",
                    fontFamily:"'Epilogue',sans-serif", textTransform:"capitalize",
                    background: sevFilter === s ? (SEV_CONFIG[s]?.color ?? C.accent) : C.bg,
                    color: sevFilter === s ? "#fff" : C.muted,
                  }}>{s === "all" ? "All Severity" : s}</button>
                ))}
              </div>

              <button className="a-btn" onClick={load} style={{
                border:`1.5px solid ${C.border}`, background:"transparent",
                borderRadius:8, padding:"7px 14px", fontSize:12,
                fontFamily:"'Epilogue',sans-serif", fontWeight:600, color:C.muted,
              }}>↻</button>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ padding:60, textAlign:"center", color:C.muted, fontSize:14 }}>Loading anomalies…</div>
            ) : pageData.length === 0 ? (
              <div style={{ padding:60, textAlign:"center", color:C.muted, fontSize:14 }}>
                {search || typeFilter !== "all" || sevFilter !== "all" ? "No anomalies match your filters." : "No anomaly records found."}
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#FAFAFE", borderBottom:`1px solid ${C.border}` }}>
                    {["Student","Exam","Type","Algorithm","Severity","Detail","Occurred"].map(h => (
                      <th key={h} style={{ padding:"11px 18px", textAlign:"left", fontSize:11,
                        fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((a, i) => {
                    const tc  = TYPE_CONFIG[a.type] ?? { label:a.type, icon:"❓", color:C.muted, bg:"#F1F1F1", algo:"—" };
                    const sc  = SEV_CONFIG[a.severity] ?? { bg:"#F1F1F1", color:C.muted };
                    return (
                      <tr key={a.id ?? i} className="a-tr a-row"
                        style={{ borderBottom:`1px solid ${C.border}`, animationDelay:`${i*25}ms` }}>
                        <td style={{ padding:"12px 18px", fontSize:14, fontWeight:600, color:C.text }}>
                          {a.student?.name ?? "—"}
                        </td>
                        <td style={{ padding:"12px 18px", fontSize:13, color:C.muted }}>
                          {a.exam?.title ?? "—"}
                        </td>
                        <td style={{ padding:"12px 18px" }}>
                          <span style={{
                            display:"inline-flex", alignItems:"center", gap:5,
                            padding:"3px 10px", borderRadius:20, fontSize:11,
                            fontWeight:700, background:tc.bg, color:tc.color,
                          }}>
                            {tc.icon} {tc.label}
                          </span>
                        </td>
                        <td style={{ padding:"12px 18px", fontSize:12, color:C.muted }}>{tc.algo}</td>
                        <td style={{ padding:"12px 18px" }}>
                          <span style={{
                            padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                            background:sc.bg, color:sc.color,
                            textTransform:"uppercase", letterSpacing:".05em",
                          }}>{a.severity ?? "low"}</span>
                        </td>
                        <td style={{ padding:"12px 18px", fontSize:12, color:C.muted, maxWidth:200 }}>
                          {/* Detail varies by type */}
                          {a.type === "tab_switch" && `${a.hidden_duration_ms ?? "?"}ms hidden`}
                          {a.type === "keyboard_shortcut" && `Keys: ${a.keys ?? "?"}${a.is_paste ? " (paste)" : ""}`}
                          {a.type === "response_time" && `${a.direction ?? "?"} · z=${typeof a.z_score === "number" ? a.z_score.toFixed(2) : "?"}`}
                          {a.type === "keystroke" && `WPM: ${a.wpm ?? "?"} · z=${typeof a.z_score === "number" ? a.z_score.toFixed(2) : "?"}`}
                          {!["tab_switch","keyboard_shortcut","response_time","keystroke"].includes(a.type) && "—"}
                        </td>
                        <td style={{ padding:"12px 18px", fontSize:12, color:C.muted }}>
                          {a.occurred_at
                            ? new Date(a.occurred_at).toLocaleString("en-PH", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination footer */}
            {!loading && filtered.length > PER_PAGE && (
              <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.border}`,
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:C.muted }}>
                  Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
                </span>
                <div style={{ display:"flex", gap:6 }}>
                  <button className="a-btn" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} style={{
                    border:`1.5px solid ${C.border}`, background:"transparent", borderRadius:6,
                    padding:"5px 12px", fontSize:12, fontWeight:600, color:C.muted, cursor:"pointer",
                  }}>← Prev</button>
                  <span style={{ fontSize:12, color:C.text, display:"flex", alignItems:"center", padding:"0 8px" }}>
                    {page} / {totalPages}
                  </span>
                  <button className="a-btn" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} style={{
                    border:`1.5px solid ${C.border}`, background:"transparent", borderRadius:6,
                    padding:"5px 12px", fontSize:12, fontWeight:600, color:C.muted, cursor:"pointer",
                  }}>Next →</button>
                </div>
              </div>
            )}
            {!loading && filtered.length > 0 && filtered.length <= PER_PAGE && (
              <div style={{ padding:"10px 20px", borderTop:`1px solid ${C.border}`,
                fontSize:12, color:C.muted, textAlign:"right" }}>
                {filtered.length} records
              </div>
            )}
          </div>
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}