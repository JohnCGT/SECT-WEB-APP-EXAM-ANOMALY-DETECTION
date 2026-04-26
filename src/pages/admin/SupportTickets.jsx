// src/pages/admin/SupportTickets.jsx
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
    .a-input{transition:border-color .15s,box-shadow .15s}
    .a-input:focus{outline:none;border-color:#6C63FF!important;box-shadow:0 0 0 3px rgba(108,99,255,.18)!important}
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
  const res  = await fetch(BASE + path, opts);
  if (res.status === 419) throw new Error("Session expired. Please refresh.");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.errors ? Object.values(json.errors).flat().join(" ") : json?.message ?? "Something went wrong.";
    throw new Error(msg);
  }
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
            display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
            textDecoration:"none", fontSize:13, fontWeight:600, color:C.text,
            borderBottom:`1px solid ${C.border}`,
          }}><span>👤</span> My Profile</Link>
          <button onClick={handleLogout} className="a-dd-item" style={{
            display:"flex", alignItems:"center", gap:10, padding:"12px 16px", width:"100%",
            background:"transparent", border:"none", fontSize:13, fontWeight:600,
            color:C.danger, cursor:"pointer", fontFamily:"'Epilogue',sans-serif", textAlign:"left",
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

function Modal({ title, onClose, children, width=480 }) {
  return (
    <div onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position:"fixed", inset:0, zIndex:999,
      background:"rgba(10,9,25,.5)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      animation:"fadeIn .15s ease",
    }}>
      <div onMouseDown={e => e.stopPropagation()} style={{
        background:C.card, borderRadius:16, padding:"28px 30px",
        width, maxWidth:"94vw", maxHeight:"90vh", overflowY:"auto",
        boxShadow:"0 24px 70px rgba(0,0,0,.22)", animation:"popIn .2s ease",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <h3 style={{ margin:0, fontSize:20, fontWeight:800, fontFamily:"'Syne',sans-serif", color:C.text }}>{title}</h3>
          <button onClick={onClose} style={{ border:"none", background:"none", fontSize:22, cursor:"pointer", color:C.muted, lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const STATUS_CFG = {
  open:        { bg:"#EDE9FF", color:"#3D34B0", dot:C.accent,  label:"Open"        },
  in_progress: { bg:"#FFF3E0", color:"#E65100", dot:C.warn,    label:"In Progress" },
  resolved:    { bg:"#E8F5E9", color:"#2E7D32", dot:C.green,   label:"Resolved"    },
  closed:      { bg:"#ECEFF1", color:"#546E7A", dot:"#90A4AE", label:"Closed"      },
};
const PRIORITY_CFG = {
  low:    { bg:"#E8F5E9", color:"#2E7D32" },
  medium: { bg:"#FFF3E0", color:"#E65100" },
  high:   { bg:"#FFEBEE", color:C.danger  },
};
const CATEGORY_CFG = {
  technical:  { icon:"🛠️", label:"Technical Issue" },
  exam_issue: { icon:"📋", label:"Exam Issue"       },
  account:    { icon:"👤", label:"Account"          },
  grading:    { icon:"📝", label:"Grading"          },
  other:      { icon:"💬", label:"Other"            },
};
const ROLE_CFG = {
  student:    { bg:"#EDE9FF", color:"#3D34B0" },
  instructor: { bg:"#E3F2FD", color:"#1565C0" },
};

function StatusChip({ status }) {
  const s = STATUS_CFG[status] ?? STATUS_CFG.open;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
      background:s.bg, color:s.color, textTransform:"uppercase", letterSpacing:".05em" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.dot }} />{s.label}
    </span>
  );
}
function PriorityChip({ priority }) {
  const s = PRIORITY_CFG[priority] ?? PRIORITY_CFG.low;
  return (
    <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
      background:s.bg, color:s.color, textTransform:"capitalize", letterSpacing:".04em" }}>
      {priority}
    </span>
  );
}
function Avatar({ name="" }) {
  const initials = name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase() || "?";
  const hue = [...name].reduce((a,c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      width:34, height:34, borderRadius:"50%", flexShrink:0,
      background:`hsl(${hue},55%,88%)`, color:`hsl(${hue},45%,30%)`,
      fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif",
    }}>{initials}</span>
  );
}

function TicketModal({ ticket, onClose, onUpdated, notify }) {
  const [reply,  setReply]  = useState(ticket.admin_response ?? "");
  const [status, setStatus] = useState(ticket.status);
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api("PATCH", `/admin/support/${ticket.id}`, { status, admin_response:reply });
      notify("Response saved.");
      onUpdated(res.ticket ?? { ...ticket, status, admin_response:reply });
      onClose();
    } catch (err) { notify(err.message, "error"); }
    finally { setSaving(false); }
  };
  const catCfg = CATEGORY_CFG[ticket.category] ?? { icon:"💬", label:ticket.category };
  return (
    <Modal title="Support Ticket" onClose={onClose} width={560}>
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20,
        padding:"14px 16px", background:C.bg, borderRadius:10, border:`1px solid ${C.border}` }}>
        <Avatar name={ticket.user?.name ?? "?"} />
        <div>
          <p style={{ margin:0, fontSize:14, fontWeight:700, color:C.text }}>{ticket.user?.name ?? "—"}</p>
          <p style={{ margin:"2px 0 0", fontSize:12, color:C.muted }}>
            {ticket.user?.email ?? "—"} ·{" "}
            <span style={{ padding:"1px 7px", borderRadius:8, fontSize:11, fontWeight:700,
              background:ROLE_CFG[ticket.user?.role]?.bg ?? C.bg,
              color:ROLE_CFG[ticket.user?.role]?.color ?? C.muted }}>
              {ticket.user?.role ?? "unknown"}
            </span>
          </p>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
          <StatusChip status={ticket.status} />
          <PriorityChip priority={ticket.priority} />
        </div>
      </div>
      <div style={{ marginBottom:16 }}>
        <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:700, color:C.muted,
          textTransform:"uppercase", letterSpacing:".08em" }}>Subject</p>
        <p style={{ margin:0, fontSize:16, fontWeight:700, color:C.text }}>{catCfg.icon} {ticket.subject}</p>
        <p style={{ margin:"3px 0 0", fontSize:12, color:C.muted }}>
          {catCfg.label} · Submitted{" "}
          {ticket.created_at ? new Date(ticket.created_at).toLocaleString("en-PH",{month:"long",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}
        </p>
      </div>
      <div style={{ marginBottom:20 }}>
        <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".08em" }}>Message</p>
        <div style={{ background:"#FAFAFE", border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px",
          fontSize:14, color:C.text, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{ticket.message}</div>
      </div>
      <div style={{ marginBottom:18 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.muted,
          textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Admin Response</label>
        <textarea className="a-input" value={reply} onChange={e => setReply(e.target.value)}
          placeholder="Write a response to the user…" rows={4}
          style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${C.border}`,
            borderRadius:8, fontSize:14, fontFamily:"'Epilogue',sans-serif",
            color:C.text, resize:"vertical", background:"#fff" }} />
      </div>
      <div style={{ marginBottom:22 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.muted,
          textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Update Status</label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {Object.entries(STATUS_CFG).map(([key, s]) => (
            <button key={key} className="a-btn" onClick={() => setStatus(key)} style={{
              border:`1.5px solid ${status === key ? s.dot : C.border}`,
              background: status === key ? s.bg : "transparent",
              borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:700,
              color: status === key ? s.color : C.muted, cursor:"pointer",
              fontFamily:"'Epilogue',sans-serif",
            }}>{s.label}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button className="a-btn" onClick={onClose} style={{
          border:`1.5px solid ${C.border}`, background:"transparent", borderRadius:8,
          padding:"8px 16px", fontSize:13, fontWeight:600, color:C.muted, fontFamily:"'Epilogue',sans-serif",
        }}>Cancel</button>
        <button className="a-btn" onClick={handleSave} disabled={saving} style={{
          border:"none", background:C.accent, borderRadius:8, padding:"8px 18px",
          fontSize:13, fontWeight:600, color:"#fff", fontFamily:"'Epilogue',sans-serif",
        }}>{saving ? "Saving…" : "Save Response"}</button>
      </div>
    </Modal>
  );
}

export default function SupportTickets() {
  const [tickets,        setTickets]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [roleFilter,     setRoleFilter]     = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search,         setSearch]         = useState("");
  const [selected,       setSelected]       = useState(null);
  const [toast,          setToast]          = useState(null);
  const [page,           setPage]           = useState(1);

  const notify = (msg, type="success") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter   !== "all") params.set("status",   statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (roleFilter     !== "all") params.set("role",     roleFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await api("GET", `/admin/support?${params}`);
      setTickets(res.data ?? (Array.isArray(res) ? res : []));
    } catch (err) { notify(err.message, "error"); }
    finally { setLoading(false); }
  }, [statusFilter, priorityFilter, roleFilter, categoryFilter]);

  useEffect(() => { load(); setPage(1); }, [load]);

  const handleUpdated = updated => setTickets(ts => ts.map(t => t.id === updated.id ? updated : t));

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    return !q
      || t.subject?.toLowerCase().includes(q)
      || t.user?.name?.toLowerCase().includes(q)
      || t.user?.email?.toLowerCase().includes(q)
      || t.message?.toLowerCase().includes(q);
  });

  const PER_PAGE   = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageData   = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const counts = {
    all:         tickets.length,
    open:        tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved:    tickets.filter(t => t.status === "resolved").length,
    high:        tickets.filter(t => t.priority === "high").length,
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'Epilogue',sans-serif" }}>
      <Sidebar />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Topbar title="Support Center" subtitle="Manage complaints and issues from students and instructors" />

        <div style={{ flex:1, padding:"28px", overflowY:"auto" }}>

          {/* Stat cards */}
          <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
            {[
              { key:"all",         label:"All Tickets",   color:C.accent, icon:"🎫", isPriority:false },
              { key:"open",        label:"Open",          color:C.accent, icon:"📬", isPriority:false },
              { key:"in_progress", label:"In Progress",   color:C.warn,   icon:"⏳", isPriority:false },
              { key:"resolved",    label:"Resolved",      color:C.green,  icon:"✅", isPriority:false },
              { key:"high",        label:"High Priority", color:C.danger, icon:"🚨", isPriority:true  },
            ].map(({ key, label, color, icon, isPriority }) => {
              const isActive = isPriority ? priorityFilter === "high" : statusFilter === key;
              return (
                <div key={key} className="a-btn" onClick={() => {
                  if (isPriority) setPriorityFilter(priorityFilter === "high" ? "all" : "high");
                  else setStatusFilter(statusFilter === key ? "all" : key);
                  setPage(1);
                }} style={{
                  flex:1, minWidth:120, borderRadius:12, padding:"16px 18px", cursor:"pointer",
                  background: isActive ? color : C.card,
                  border:`1.5px solid ${isActive ? color : C.border}`,
                  boxShadow:"0 2px 10px rgba(108,99,255,.05)",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <p style={{ margin:0, fontSize:28, fontWeight:800, fontFamily:"'Syne',sans-serif",
                      color: isActive ? "#fff" : color }}>{counts[key]}</p>
                    <span style={{ fontSize:20 }}>{icon}</span>
                  </div>
                  <p style={{ margin:"4px 0 0", fontSize:11, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:".08em", color: isActive ? "rgba(255,255,255,.8)" : C.muted }}>{label}</p>
                </div>
              );
            })}
          </div>

          {/* Table card */}
          <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`,
            boxShadow:"0 2px 12px rgba(108,99,255,.05)", overflow:"hidden" }}>

            {/* Toolbar */}
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}`,
              display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ position:"relative", flex:1, minWidth:200 }}>
                <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:13, color:C.muted }}>🔍</span>
                <input className="a-input" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search subject, name, message…" style={{
                    width:"100%", padding:"8px 12px 8px 34px", border:`1.5px solid ${C.border}`,
                    borderRadius:8, fontSize:13, fontFamily:"'Epilogue',sans-serif", color:C.text, background:"#fff",
                  }} />
              </div>
              {["all","open","in_progress","resolved","closed"].map(s => (
                <button key={s} className="a-btn" onClick={() => { setStatusFilter(s); setPage(1); }} style={{
                  border:"none", borderRadius:20, padding:"6px 13px", fontSize:11, fontWeight:700,
                  cursor:"pointer", fontFamily:"'Epilogue',sans-serif",
                  background: statusFilter === s ? C.accent : C.bg,
                  color: statusFilter === s ? "#fff" : C.muted, textTransform:"capitalize",
                }}>{s === "all" ? "All Status" : STATUS_CFG[s]?.label ?? s}</button>
              ))}
              <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{
                padding:"7px 12px", border:`1.5px solid ${C.border}`, borderRadius:8,
                fontSize:12, fontFamily:"'Epilogue',sans-serif", fontWeight:600,
                color:C.text, background:"#fff", cursor:"pointer", outline:"none",
              }}>
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="instructor">Instructors</option>
              </select>
              <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }} style={{
                padding:"7px 12px", border:`1.5px solid ${C.border}`, borderRadius:8,
                fontSize:12, fontFamily:"'Epilogue',sans-serif", fontWeight:600,
                color:C.text, background:"#fff", cursor:"pointer", outline:"none",
              }}>
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} style={{
                padding:"7px 12px", border:`1.5px solid ${C.border}`, borderRadius:8,
                fontSize:12, fontFamily:"'Epilogue',sans-serif", fontWeight:600,
                color:C.text, background:"#fff", cursor:"pointer", outline:"none",
              }}>
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_CFG).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button className="a-btn" onClick={load} style={{
                border:`1.5px solid ${C.border}`, background:"transparent",
                borderRadius:8, padding:"7px 13px", fontSize:12, fontWeight:600,
                color:C.muted, fontFamily:"'Epilogue',sans-serif",
              }}>↻</button>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ padding:60, textAlign:"center", color:C.muted, fontSize:14 }}>Loading tickets…</div>
            ) : pageData.length === 0 ? (
              <div style={{ padding:60, textAlign:"center" }}>
                <p style={{ fontSize:36, margin:"0 0 10px" }}>🎫</p>
                <p style={{ fontSize:14, color:C.muted, margin:0 }}>
                  {search || statusFilter !== "all" || priorityFilter !== "all"
                    ? "No tickets match your filters."
                    : "No support tickets yet. They'll appear here when users submit issues."}
                </p>
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#FAFAFE", borderBottom:`1px solid ${C.border}` }}>
                    {["Reporter","Subject","Category","Priority","Status","Submitted","Action"].map(h => (
                      <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11,
                        fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((ticket, i) => {
                    const catCfg  = CATEGORY_CFG[ticket.category] ?? { icon:"💬", label:ticket.category };
                    const roleCfg = ROLE_CFG[ticket.user?.role]   ?? { bg:C.bg, color:C.muted };
                    const isNew   = ticket.status === "open" && !ticket.admin_response;
                    return (
                      <tr key={ticket.id} className="a-tr a-row"
                        style={{ borderBottom:`1px solid ${C.border}`, animationDelay:`${i*20}ms` }}>
                        <td style={{ padding:"12px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <Avatar name={ticket.user?.name ?? "?"} />
                            <div>
                              <p style={{ margin:0, fontSize:13, fontWeight:600, color:C.text }}>
                                {ticket.user?.name ?? "—"}
                                {isNew && (
                                  <span style={{ marginLeft:6, background:C.accent, color:"#fff",
                                    fontSize:9, fontWeight:800, padding:"1px 5px", borderRadius:6 }}>NEW</span>
                                )}
                              </p>
                              <span style={{ fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:6,
                                background:roleCfg.bg, color:roleCfg.color, textTransform:"capitalize" }}>
                                {ticket.user?.role ?? "unknown"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"12px 16px", maxWidth:220 }}>
                          <p style={{ margin:0, fontSize:13, fontWeight:600, color:C.text,
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ticket.subject}</p>
                          <p style={{ margin:"2px 0 0", fontSize:11, color:C.muted,
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {ticket.message?.slice(0,60)}{ticket.message?.length > 60 ? "…" : ""}
                          </p>
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          <span style={{ fontSize:12, color:C.muted, display:"flex", alignItems:"center", gap:5 }}>
                            {catCfg.icon} {catCfg.label}
                          </span>
                        </td>
                        <td style={{ padding:"12px 16px" }}><PriorityChip priority={ticket.priority} /></td>
                        <td style={{ padding:"12px 16px" }}><StatusChip status={ticket.status} /></td>
                        <td style={{ padding:"12px 16px", fontSize:12, color:C.muted }}>
                          {ticket.created_at
                            ? new Date(ticket.created_at).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})
                            : "—"}
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          <button className="a-btn" onClick={() => setSelected(ticket)} style={{
                            border:"none", borderRadius:7, padding:"5px 14px", fontSize:12, fontWeight:600,
                            cursor:"pointer", fontFamily:"'Epilogue',sans-serif",
                            background: isNew ? C.accent : C.bg,
                            color:      isNew ? "#fff"   : C.muted,
                          }}>{ticket.admin_response ? "View / Edit" : "Respond"}</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {!loading && filtered.length > PER_PAGE && (
              <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.border}`,
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:C.muted }}>
                  Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
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
            {!loading && filtered.length > 0 && filtered.length <= PER_PAGE && (
              <div style={{ padding:"10px 20px", borderTop:`1px solid ${C.border}`,
                fontSize:12, color:C.muted, textAlign:"right" }}>
                {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <TicketModal ticket={selected} onClose={() => setSelected(null)}
          onUpdated={handleUpdated} notify={notify} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}