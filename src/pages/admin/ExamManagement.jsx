// src/pages/admin/ExamManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

(function bootstrap() {
  if (document.getElementById("admin-base-styles")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Epilogue:wght@400;500;600&display=swap";
  document.head.appendChild(link);
  const style = document.createElement("style");
  style.id = "admin-base-styles";
  style.textContent = `
    *{box-sizing:border-box}body{margin:0;font-family:'Epilogue',sans-serif}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes popIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
    @keyframes rowIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
    @keyframes ddIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
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

const C = {
  bg:"#F4F3FF", card:"#FFFFFF", border:"#E6E4FF",
  accent:"#6C63FF", text:"#0D0C1D", muted:"#7A788F",
  danger:"#E53935", warn:"#FB8C00", green:"#2E7D32", sidebar:"#0D0C1D",
};

const BASE = import.meta?.env?.VITE_API_URL ?? "/api";
async function api(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type":"application/json","Accept":"application/json","X-Requested-With":"XMLHttpRequest" },
    credentials:"include",
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? "Request failed.");
  return json;
}

const NAV = [
  { to:"/admin",           icon:"⊞", label:"Dashboard" },
  { to:"/admin/users",     icon:"👥", label:"Users"     },
  { to:"/admin/courses",   icon:"📚", label:"Courses"   },
  { to:"/admin/exams",     icon:"📋", label:"Exams"     },
  { to:"/admin/anomalies", icon:"⚠️", label:"Anomalies" },
  { to:"/admin/support",   icon:"🎫", label:"Support"   },
];

function Sidebar() {
  const loc = useLocation();
  return (
    <nav style={{ width:200, background:C.sidebar, display:"flex", flexDirection:"column",
      padding:"24px 0", flexShrink:0, minHeight:"100vh", position:"sticky", top:0, height:"100vh" }}>
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
                color:      active ? "#fff" : "rgba(255,255,255,.55)",
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
      <div onClick={() => setOpen(v => !v)} style={{
        width:36, height:36, borderRadius:"50%",
        background: open ? "#5550d4" : C.accent,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:14, fontWeight:800, fontFamily:"'Syne',sans-serif",
        color:"#fff", cursor:"pointer",
        border:`2px solid ${open ? C.accent : C.border}`,
        transition:"background .15s",
      }}>A</div>
      {open && (
        <div style={{
          position:"absolute", top:44, right:0, zIndex:1200,
          background:C.card, border:`1px solid ${C.border}`,
          borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,.16)",
          overflow:"hidden", minWidth:170, animation:"ddIn .15s ease",
        }}>
          <Link to="/admin/profile" onClick={() => setOpen(false)} className="a-dd-item" style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"12px 16px", textDecoration:"none",
            fontSize:13, fontWeight:600, color:C.text,
            borderBottom:`1px solid ${C.border}`,
          }}><span>👤</span> My Profile</Link>
          <button onClick={handleLogout} className="a-dd-item" style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"12px 16px", width:"100%",
            background:"transparent", border:"none",
            fontSize:13, fontWeight:600, color:C.danger,
            cursor:"pointer", fontFamily:"'Epilogue',sans-serif", textAlign:"left",
          }}><span>⏻</span> Logout</button>
        </div>
      )}
    </div>
  );
}

function Topbar({ title, subtitle }) {
  return (
    <div style={{ height:60, background:C.card, borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 28px", flexShrink:0 }}>
      <div>
        <p style={{ margin:0, fontSize:16, fontWeight:700, fontFamily:"'Syne',sans-serif", color:C.text }}>{title}</p>
        {subtitle && <p style={{ margin:0, fontSize:12, color:C.muted }}>{subtitle}</p>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <NotificationBell />
        <AvatarDropdown />
      </div>
    </div>
  );
}

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

function ConfirmModal({ title, body, confirmLabel, confirmVariant, onConfirm, onClose, busy }) {
  const COLORS = { danger:C.danger, warn:C.warn, primary:C.accent };
  const color  = COLORS[confirmVariant] ?? C.accent;
  return (
    <div onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position:"fixed", inset:0, zIndex:999,
      background:"rgba(10,9,25,.5)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      animation:"fadeIn .15s ease",
    }}>
      <div onMouseDown={e => e.stopPropagation()} style={{
        background:C.card, borderRadius:16, padding:"28px 30px", width:380, maxWidth:"94vw",
        boxShadow:"0 24px 70px rgba(0,0,0,.22)", animation:"popIn .2s ease",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h3 style={{ margin:0, fontSize:18, fontWeight:800, fontFamily:"'Syne',sans-serif", color:C.text }}>{title}</h3>
          <button onClick={onClose} style={{ border:"none", background:"none", fontSize:22, cursor:"pointer", color:C.muted }}>×</button>
        </div>
        <p style={{ margin:"0 0 22px", fontSize:14, color:C.muted, lineHeight:1.6 }}>{body}</p>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button className="a-btn" onClick={onClose} style={{
            border:`1.5px solid ${C.border}`, background:"transparent", borderRadius:8,
            padding:"8px 16px", fontSize:13, fontWeight:600, color:C.muted, fontFamily:"'Epilogue',sans-serif",
          }}>Cancel</button>
          <button className="a-btn" onClick={onConfirm} disabled={busy} style={{
            border:"none", background:color, borderRadius:8,
            padding:"8px 18px", fontSize:13, fontWeight:600, color:"#fff", fontFamily:"'Epilogue',sans-serif",
          }}>{busy ? "Working…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const STATUS_CFG = {
  active:    { bg:"#E8F5E9", color:"#2E7D32", dot:"#4CAF50" },
  scheduled: { bg:"#E3F2FD", color:"#1565C0", dot:"#1E88E5" },
  draft:     { bg:"#F4F3FF", color:"#6C63FF", dot:"#6C63FF" },
  completed: { bg:"#ECEFF1", color:"#546E7A", dot:"#90A4AE" },
};
const TYPE_CFG = {
  midterm: { bg:"#EDE9FF", color:"#3D34B0" },
  final:   { bg:"#FCE4EC", color:"#B71C1C" },
  quiz:    { bg:"#E8F5E9", color:"#2E7D32" },
  prelim:  { bg:"#FFF3E0", color:"#E65100" },
};

function StatusChip({ status }) {
  const s = STATUS_CFG[status?.toLowerCase()] ?? { bg:"#F1F1F1", color:"#555", dot:"#999" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
      borderRadius:20, fontSize:11, fontWeight:700, background:s.bg, color:s.color,
      textTransform:"uppercase", letterSpacing:".05em" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.dot }} />{status}
    </span>
  );
}
function TypeChip({ type }) {
  const s = TYPE_CFG[type?.toLowerCase()] ?? { bg:"#F1F1F1", color:"#555" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 10px",
      borderRadius:20, fontSize:11, fontWeight:700, background:s.bg, color:s.color,
      textTransform:"capitalize", letterSpacing:".04em" }}>{type}</span>
  );
}

export default function ExamManagement() {
  const [exams,        setExams]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search,       setSearch]       = useState("");
  const [modal,        setModal]        = useState(null);
  const [busy,         setBusy]         = useState(false);
  const [toast,        setToast]        = useState(null);

  const notify     = (msg, type="success") => setToast({ msg, type });
  const closeModal = () => setModal(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("GET", "/admin/exams");
      setExams(res.data ?? (Array.isArray(res) ? res : []));
    } catch (err) { notify(err.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async () => {
    const exam = modal.exam;
    const newStatus = exam.status === "active" ? "draft" : "active";
    setBusy(true);
    setExams(e => e.map(x => x.id === exam.id ? { ...x, status:newStatus } : x));
    try {
      await api("PATCH", `/admin/exams/${exam.id}/status`, { status:newStatus });
      notify(`Exam ${newStatus === "active" ? "enabled" : "disabled"}.`);
      closeModal();
    } catch (err) {
      setExams(e => e.map(x => x.id === exam.id ? { ...x, status:exam.status } : x));
      notify(err.message, "error");
    } finally { setBusy(false); }
  };

  const handleReset = async () => {
    const { id, title } = modal.exam;
    setBusy(true);
    try {
      await api("DELETE", `/admin/exams/${id}/sessions`);
      notify(`Sessions reset for "${title}".`);
      closeModal();
      load();
    } catch (err) { notify(err.message, "error"); }
    finally { setBusy(false); }
  };

  const filtered = exams.filter(e => {
    const q  = search.toLowerCase();
    const ok = !q || e.title?.toLowerCase().includes(q)
                  || e.course?.name?.toLowerCase().includes(q)
                  || e.course?.code?.toLowerCase().includes(q);
    return ok && (statusFilter === "all" || e.status?.toLowerCase() === statusFilter);
  });

  const counts = {
    all:       exams.length,
    active:    exams.filter(e => e.status === "active").length,
    scheduled: exams.filter(e => e.status === "scheduled").length,
    draft:     exams.filter(e => e.status === "draft").length,
    completed: exams.filter(e => e.status === "completed").length,
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'Epilogue',sans-serif" }}>
      <Sidebar />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Topbar title="Exam Management" subtitle="Control exam access, sessions and monitoring settings" />

        <div style={{ flex:1, padding:"28px", overflowY:"auto" }}>
          {/* Status stat cards */}
          <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
            {[
              { key:"all",       label:"All Exams", color:C.accent  },
              { key:"active",    label:"Active",    color:C.green   },
              { key:"scheduled", label:"Scheduled", color:"#1E88E5" },
              { key:"draft",     label:"Draft",     color:C.accent  },
              { key:"completed", label:"Completed", color:C.muted   },
            ].map(({ key, label, color }) => (
              <div key={key} onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
                className="a-btn" style={{
                  flex:1, minWidth:110, borderRadius:12, padding:"14px 18px", cursor:"pointer",
                  background: statusFilter === key ? color : C.card,
                  border:`1.5px solid ${statusFilter === key ? color : C.border}`,
                  boxShadow:"0 2px 10px rgba(108,99,255,.05)",
                }}>
                <p style={{ margin:0, fontSize:26, fontWeight:800, fontFamily:"'Syne',sans-serif",
                  color: statusFilter === key ? "#fff" : color }}>{counts[key]}</p>
                <p style={{ margin:"2px 0 0", fontSize:12, fontWeight:600, textTransform:"uppercase",
                  letterSpacing:".06em", color: statusFilter === key ? "rgba(255,255,255,.8)" : C.muted }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Table card */}
          <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`,
            boxShadow:"0 2px 12px rgba(108,99,255,.05)", overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`,
              display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ position:"relative", flex:1, minWidth:200 }}>
                <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:13, color:C.muted }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search exam or course…" style={{
                    width:"100%", padding:"8px 12px 8px 34px", border:`1.5px solid ${C.border}`,
                    borderRadius:8, fontSize:13, fontFamily:"'Epilogue',sans-serif",
                    color:C.text, background:"#fff", outline:"none",
                  }} />
              </div>
              {["all","active","scheduled","draft","completed"].map(s => (
                <button key={s} className="a-btn" onClick={() => setStatusFilter(s)} style={{
                  border:"none", borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:700,
                  cursor:"pointer", fontFamily:"'Epilogue',sans-serif", textTransform:"capitalize",
                  background: statusFilter === s ? C.accent : C.bg,
                  color: statusFilter === s ? "#fff" : C.muted,
                }}>{s === "all" ? "All" : s}</button>
              ))}
              <button className="a-btn" onClick={load} style={{
                border:`1.5px solid ${C.border}`, background:"transparent", borderRadius:8,
                padding:"7px 14px", fontSize:12, fontWeight:600, color:C.muted, fontFamily:"'Epilogue',sans-serif",
              }}>↻ Refresh</button>
            </div>

            {loading ? (
              <div style={{ padding:60, textAlign:"center", color:C.muted, fontSize:14 }}>Loading exams…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:60, textAlign:"center", color:C.muted, fontSize:14 }}>
                {search || statusFilter !== "all" ? "No exams match your filters." : "No exams found."}
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#FAFAFE", borderBottom:`1px solid ${C.border}` }}>
                    {["Exam","Course","Type","Status","Duration","Submissions","Flagged","Actions"].map(h => (
                      <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11,
                        fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exam, i) => {
                    const isActive = exam.status === "active";
                    return (
                      <tr key={exam.id} className="a-tr a-row"
                        style={{ borderBottom:`1px solid ${C.border}`, animationDelay:`${i*25}ms` }}>
                        <td style={{ padding:"12px 16px" }}>
                          <p style={{ margin:0, fontSize:14, fontWeight:600, color:C.text }}>{exam.title}</p>
                          <p style={{ margin:"2px 0 0", fontSize:11, color:C.muted }}>
                            {exam.start_time ? new Date(exam.start_time).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}) : "—"}
                          </p>
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          <p style={{ margin:0, fontSize:13, fontWeight:600, color:C.text }}>{exam.course?.code ?? "—"}</p>
                          <p style={{ margin:"2px 0 0", fontSize:11, color:C.muted }}>{exam.course?.name ?? ""}</p>
                        </td>
                        <td style={{ padding:"12px 16px" }}><TypeChip type={exam.type} /></td>
                        <td style={{ padding:"12px 16px" }}><StatusChip status={exam.status} /></td>
                        <td style={{ padding:"12px 16px", fontSize:13, color:C.muted }}>
                          {exam.duration_minutes ? `${exam.duration_minutes} min` : "—"}
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:14, fontWeight:700,
                          fontFamily:"'Syne',sans-serif", color:C.text }}>
                          {exam.submissions_count ?? "—"}
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          {(exam.flagged_count ?? 0) > 0
                            ? <span style={{ fontSize:14, fontWeight:700, fontFamily:"'Syne',sans-serif", color:C.danger }}>{exam.flagged_count}</span>
                            : <span style={{ fontSize:13, color:C.muted }}>0</span>}
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            <button className="a-btn" onClick={() => setModal({ type:"toggle", exam })} style={{
                              border:"none", borderRadius:7, padding:"5px 12px", fontSize:12, fontWeight:600,
                              fontFamily:"'Epilogue',sans-serif", cursor:"pointer",
                              background: isActive ? "#FFF3E0" : "#E8F5E9",
                              color: isActive ? C.warn : C.green,
                            }}>{isActive ? "Disable" : "Enable"}</button>
                            <button className="a-btn" onClick={() => setModal({ type:"reset", exam })} style={{
                              border:"none", borderRadius:7, padding:"5px 12px", fontSize:12, fontWeight:600,
                              fontFamily:"'Epilogue',sans-serif", cursor:"pointer",
                              background:"#FFEBEE", color:C.danger,
                            }}>Reset Sessions</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {!loading && filtered.length > 0 && (
              <div style={{ padding:"10px 20px", borderTop:`1px solid ${C.border}`,
                fontSize:12, color:C.muted, textAlign:"right" }}>
                Showing {filtered.length} of {exams.length} exams
              </div>
            )}
          </div>
        </div>
      </div>

      {modal?.type === "toggle" && (
        <ConfirmModal
          title={modal.exam.status === "active" ? "Disable Exam" : "Enable Exam"}
          body={modal.exam.status === "active"
            ? `Disabling "${modal.exam.title}" will prevent students from starting or continuing it.`
            : `Enabling "${modal.exam.title}" will allow eligible students to access it.`}
          confirmLabel={modal.exam.status === "active" ? "Yes, Disable" : "Yes, Enable"}
          confirmVariant={modal.exam.status === "active" ? "warn" : "primary"}
          onConfirm={handleToggleStatus} onClose={closeModal} busy={busy}
        />
      )}
      {modal?.type === "reset" && (
        <ConfirmModal
          title="Reset Exam Sessions"
          body={`This will permanently delete all submissions for "${modal.exam.title}". This cannot be undone.`}
          confirmLabel="Yes, Reset" confirmVariant="danger"
          onConfirm={handleReset} onClose={closeModal} busy={busy}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}