// src/pages/admin/SupportTickets.jsx
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
  .badge-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;flex-shrink:0;}
  .dash-table{width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif;}
  .dash-table th{padding:10px 14px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.06em;white-space:nowrap;border-bottom:1px solid #f1f5f9;text-align:left;background:#f8faff;}
  .dash-table td{padding:12px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle;}
  .dash-table tbody tr{transition:background .15s;}
  .dash-table tbody tr:hover{background:#f8faff;}
  .dash-table tbody tr:last-child td{border-bottom:none;}
  .stat-chip{flex:1;min-width:110px;border-radius:14px;padding:12px;display:flex;align-items:center;gap:8px;border:2px solid transparent;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.04);cursor:pointer;transition:all .15s;}
  .stat-chip:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,86,179,.10);}
  .stat-chip.selected{border-color:currentColor;}
  .filter-btn{border:none;border-radius:20px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;white-space:nowrap;}
  .filter-btn:hover{opacity:.85;}
  .form-ctrl{width:100%;border:1px solid rgba(0,86,179,.15);border-radius:10px;padding:9px 13px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;background:#f8faff;transition:border-color .2s,box-shadow .2s;}
  .form-ctrl:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .form-lbl{font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;display:block;}
  .ticket-card{background:#fff;border-radius:14px;border:1px solid rgba(0,86,179,.06);box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden;margin-bottom:8px;}
  /* Modal */
  .modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);backdrop-filter:blur(4px);z-index:1055;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;}
  .modal-box{background:#fff;border-radius:20px;width:100%;max-width:560px;box-shadow:0 24px 64px rgba(0,0,0,.18);overflow:hidden;display:flex;flex-direction:column;max-height:calc(100vh - 32px);animation:fadeUp .25s ease;}
  .modal-hdr{padding:20px 22px 14px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0;}
  .modal-body{overflow-y:auto;padding:18px 22px;flex:1;}
  .modal-ftr{padding:12px 22px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;}
  .status-toggle-btn{border:2px solid transparent;border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;}
  .admin-bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bnav-item i{font-size:19px;}
  .page-btn{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,86,179,.15);background:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;color:#64748b;padding:0 6px;}
  .page-btn:hover{background:var(--blue-lite);border-color:var(--blue);color:var(--blue);}
  .page-btn.active{background:var(--blue);border-color:var(--blue);color:#fff;}
  .page-btn:disabled{opacity:.4;cursor:not-allowed;}
  .filters-wrap{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
  @media(max-width:991px){.hide-md{display:none!important;}}
  @media(max-width:767px){
    .hide-mobile{display:none!important;}
    .dash-table td,.dash-table th{padding:8px 10px;font-size:12px;}
    .stat-chip{min-width:calc(50% - 5px);}
  }
  @media(max-width:480px){.stat-chip{min-width:calc(50% - 5px);}}
`;

const NAV_ITEMS = [
  { to: "/admin",           icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/admin/users",     icon: "bi-people",               label: "Users"     },
  { to: "/admin/courses",   icon: "bi-book",                 label: "Courses"   },
  { to: "/admin/exams",     icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/admin/anomalies", icon: "bi-exclamation-triangle", label: "Anomalies" },
  { to: "/admin/support",   icon: "bi-headset",              label: "Support"   },
];
const BOTTOM_NAV = [
  { to: "/admin",         icon: "bi-speedometer2",      label: "Home"    },
  { to: "/admin/users",   icon: "bi-people",            label: "Users"   },
  { to: "/admin/exams",   icon: "bi-file-earmark-text", label: "Exams"   },
  { to: "/admin/support", icon: "bi-headset",           label: "Support" },
  { to: "/admin/anomalies", icon: "bi-exclamation-triangle", label: "Flags" },
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
  if (res.status === 419) throw new Error("Session expired. Please refresh.");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.errors ? Object.values(json.errors).flat().join(" ") : json?.message ?? "Something went wrong.";
    throw new Error(msg);
  }
  return json;
}

const PER_PAGE = 15;

const STATUS_CFG = {
  open:        { bg: "#e8f0fe", color: "#0056b3", dot: "#0056b3", label: "Open"        },
  in_progress: { bg: "#fff8f0", color: "#fd7e14", dot: "#fd7e14", label: "In Progress" },
  resolved:    { bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e", label: "Resolved"    },
  closed:      { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8", label: "Closed"      },
};

const PRIORITY_CFG = {
  low:    { bg: "#f0fdf4", color: "#16a34a" },
  medium: { bg: "#fff8f0", color: "#fd7e14" },
  high:   { bg: "#fff0f0", color: "#dc3545" },
};

const CATEGORY_CFG = {
  technical:  { icon: "bi-tools",              label: "Technical Issue" },
  exam_issue: { icon: "bi-file-earmark-text",  label: "Exam Issue"      },
  account:    { icon: "bi-person",             label: "Account"         },
  grading:    { icon: "bi-pencil-square",      label: "Grading"         },
  other:      { icon: "bi-chat-dots",          label: "Other"           },
};

const ROLE_CFG = {
  student:    { bg: "#e8f0fe", color: "#0056b3" },
  instructor: { bg: "#eff6ff", color: "#1a6ed8" },
};

function StatusPill({ status }) {
  const s = STATUS_CFG[status] ?? STATUS_CFG.open;
  return (
    <span className="badge-pill" style={{ background: s.bg, color: s.color }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }}></span>
      {s.label}
    </span>
  );
}

function PriorityPill({ priority }) {
  const s = PRIORITY_CFG[priority] ?? PRIORITY_CFG.low;
  return <span className="badge-pill" style={{ background: s.bg, color: s.color }}>{priority}</span>;
}

function MiniAvatar({ name = "", size = 32 }) {
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

/* ─── Ticket Modal ───────────────────────────────────────────────────── */
function TicketModal({ ticket, onClose, onUpdated, notify }) {
  const [reply,   setReply]   = useState(ticket.admin_response ?? "");
  const [status,  setStatus]  = useState(ticket.status);
  const [saving,  setSaving]  = useState(false);
  const catCfg = CATEGORY_CFG[ticket.category] ?? { icon: "bi-chat-dots", label: ticket.category };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api("PATCH", `/admin/support/${ticket.id}`, { status, admin_response: reply });
      notify("Response saved successfully.");
      onUpdated(res.ticket ?? { ...ticket, status, admin_response: reply });
      onClose();
    } catch (err) { notify(err.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div>
            <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              <i className="bi bi-headset me-2" style={{ color: "#0056b3" }}></i>Support Ticket
            </h5>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>#{ticket.id}</p>
          </div>
          <button onClick={onClose} disabled={saving}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8", padding: 4, lineHeight: 1 }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="modal-body">
          {/* Reporter info */}
          <div style={{ background: "#f8faff", borderRadius: 12, padding: "12px 14px", marginBottom: 16, border: "1px solid rgba(0,86,179,.06)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <MiniAvatar name={ticket.user?.name ?? "?"} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{ticket.user?.name ?? "—"}</p>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: "#64748b" }}>{ticket.user?.email ?? "—"}</p>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ticket.user?.role && (
                <span className="badge-pill" style={{ background: ROLE_CFG[ticket.user.role]?.bg ?? "#f1f5f9", color: ROLE_CFG[ticket.user.role]?.color ?? "#64748b" }}>
                  {ticket.user.role}
                </span>
              )}
              <StatusPill status={ticket.status} />
              <PriorityPill priority={ticket.priority} />
            </div>
          </div>

          {/* Subject */}
          <div style={{ marginBottom: 14 }}>
            <label className="form-lbl">Subject</label>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
              <i className={`bi ${catCfg.icon} me-2`} style={{ color: "#0056b3" }}></i>{ticket.subject}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
              {catCfg.label}
              {ticket.created_at && ` · Submitted ${new Date(ticket.created_at).toLocaleString(undefined, { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
            </p>
          </div>

          {/* Message */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-lbl">Message</label>
            <div style={{ background: "#f8faff", border: "1px solid rgba(0,86,179,.08)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#1e293b", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {ticket.message}
            </div>
          </div>

          {/* Admin response */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-lbl">Admin Response</label>
            <textarea className="form-ctrl" rows={4}
              value={reply} onChange={e => setReply(e.target.value)}
              placeholder="Write a response to the user…"
              style={{ resize: "vertical" }} />
          </div>

          {/* Status update */}
          <div>
            <label className="form-lbl">Update Status</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(STATUS_CFG).map(([key, s]) => (
                <button key={key} className="status-toggle-btn"
                  onClick={() => setStatus(key)}
                  style={{
                    background: status === key ? s.bg : "transparent",
                    borderColor: status === key ? s.dot : "rgba(0,86,179,.15)",
                    color: status === key ? s.color : "#64748b",
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-ftr">
          <button className="dash-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="dash-btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: "0.75rem", height: "0.75rem" }} />Saving…</>
              : <><i className="bi bi-check-lg"></i> Save Response</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════ */
export default function SupportTickets() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user,           setUser]           = useState(null);
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

  const notify   = (msg, type = "success") => setToast({ msg, type });
  const isActive = (to) => to === "/admin" ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = async () => {
    try { await api("POST", "/logout"); } catch {}
    navigate("/");
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter   !== "all") params.set("status",   statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (roleFilter     !== "all") params.set("role",     roleFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const [res, meRes] = await Promise.all([
        api("GET", `/admin/support?${params}`),
        api("GET", "/me").catch(() => ({ user: null })),
      ]);
      setTickets(res.data ?? (Array.isArray(res) ? res : []));
      setUser(meRes.user);
    } catch (err) { notify(err.message, "error"); }
    finally { setLoading(false); }
  }, [statusFilter, priorityFilter, roleFilter, categoryFilter]);

  useEffect(() => { load(); setPage(1); }, [load]);

  const handleUpdated = (updated) => setTickets(ts => ts.map(t => t.id === updated.id ? updated : t));

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    return !q
      || t.subject?.toLowerCase().includes(q)
      || t.user?.name?.toLowerCase().includes(q)
      || t.user?.email?.toLowerCase().includes(q)
      || t.message?.toLowerCase().includes(q);
  });

  useEffect(() => { setPage(1); }, [search]);

  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    all:         tickets.length,
    open:        tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved:    tickets.filter(t => t.status === "resolved").length,
    high:        tickets.filter(t => t.priority === "high").length,
  };

  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "A";
  const firstName = user?.name?.split(" ")[0] ?? "Admin";

  const STAT_CHIPS = [
    { key: "all",         label: "All Tickets",   value: counts.all,         color: "#0056b3", bg: "#e8f0fe", icon: "bi-ticket-perforated", isPriority: false },
    { key: "open",        label: "Open",          value: counts.open,        color: "#0056b3", bg: "#e8f0fe", icon: "bi-envelope-open",      isPriority: false },
    { key: "in_progress", label: "In Progress",   value: counts.in_progress, color: "#fd7e14", bg: "#fff8f0", icon: "bi-hourglass-split",    isPriority: false },
    { key: "resolved",    label: "Resolved",      value: counts.resolved,    color: "#16a34a", bg: "#f0fdf4", icon: "bi-check-circle",       isPriority: false },
    { key: "high",        label: "High Priority", value: counts.high,        color: "#dc3545", bg: "#fff0f0", icon: "bi-exclamation-circle", isPriority: true  },
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
            <input className="dash-search" placeholder="Search tickets…" value={search} onChange={e => setSearch(e.target.value)} />
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
              <input className="dash-search" style={{ paddingLeft: 36 }} placeholder="Search tickets…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Page header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Admin</p>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px" }}>Support Center</h1>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Manage complaints and issues from students and instructors</p>
              </div>
              <button className="dash-btn-ghost" onClick={load} style={{ flexShrink: 0, fontSize: 12, padding: "7px 13px" }}>
                {loading
                  ? <span className="spinner-border spinner-border-sm" style={{ width: "0.75rem", height: "0.75rem" }} />
                  : <><i className="bi bi-arrow-clockwise"></i><span className="d-none d-sm-inline"> Refresh</span></>}
              </button>
            </div>

            {/* Stat chips */}
            <div className="fade-up" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              {STAT_CHIPS.map(({ key, label, value, color, bg, icon, isPriority }) => {
                const isSelected = isPriority ? priorityFilter === "high" : statusFilter === key;
                return (
                  <div key={key}
                    className={`stat-chip ${isSelected ? "selected" : ""}`}
                    style={{ color, borderColor: isSelected ? color : "transparent" }}
                    onClick={() => {
                      if (isPriority) setPriorityFilter(priorityFilter === "high" ? "all" : "high");
                      else setStatusFilter(statusFilter === key ? "all" : key);
                      setPage(1);
                    }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className={`bi ${icon}`} style={{ color, fontSize: 14 }}></i>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 600, color, opacity: .75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table card */}
            <div className="dash-card fade-up">
              {/* Toolbar */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                {/* Status filter row */}
                <div className="filters-wrap" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", flexShrink: 0 }}>Status:</span>
                  {[
                    { key: "all", label: "All" },
                    { key: "open", label: "Open" },
                    { key: "in_progress", label: "In Progress" },
                    { key: "resolved", label: "Resolved" },
                    { key: "closed", label: "Closed" },
                  ].map(({ key, label }) => {
                    const cfg = STATUS_CFG[key];
                    const active = statusFilter === key;
                    return (
                      <button key={key} className="filter-btn" onClick={() => { setStatusFilter(key); setPage(1); }}
                        style={{ background: active ? (cfg?.color ?? "#0056b3") : "#f1f5f9", color: active ? "#fff" : "#64748b" }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                {/* Extra filters row */}
                <div className="filters-wrap">
                  {/* Role */}
                  <select className="form-ctrl" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                    style={{ width: "auto", padding: "5px 10px", fontSize: 12, flex: "none", minWidth: 110 }}>
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="instructor">Instructors</option>
                  </select>
                  {/* Priority */}
                  <select className="form-ctrl" value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
                    style={{ width: "auto", padding: "5px 10px", fontSize: 12, flex: "none", minWidth: 120 }}>
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  {/* Category */}
                  <select className="form-ctrl" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                    style={{ width: "auto", padding: "5px 10px", fontSize: 12, flex: "none", minWidth: 140 }}>
                    <option value="all">All Categories</option>
                    {Object.entries(CATEGORY_CFG).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
                    {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10 }} />)}
                </div>
              ) : pageData.length === 0 ? (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8" }}>
                  <i className="bi bi-headset" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: .3 }}></i>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    {search || statusFilter !== "all" || priorityFilter !== "all"
                      ? "No tickets match your filters."
                      : "No support tickets yet."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hide-mobile" style={{ overflowX: "auto" }}>
                    <table className="dash-table">
                      <thead>
                        <tr>
                          {["Reporter", "Subject", "Category", "Priority", "Status", "Submitted", "Action"].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.map((ticket) => {
                          const catCfg  = CATEGORY_CFG[ticket.category] ?? { icon: "bi-chat-dots", label: ticket.category };
                          const roleCfg = ROLE_CFG[ticket.user?.role]   ?? { bg: "#f1f5f9", color: "#64748b" };
                          const isNew   = ticket.status === "open" && !ticket.admin_response;
                          return (
                            <tr key={ticket.id}>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <MiniAvatar name={ticket.user?.name ?? "?"} size={30} />
                                  <div>
                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#1e293b" }}>
                                      {ticket.user?.name ?? "—"}
                                      {isNew && (
                                        <span className="badge-pill" style={{ background: "#0056b3", color: "#fff", marginLeft: 5, fontSize: 9 }}>NEW</span>
                                      )}
                                    </p>
                                    <span className="badge-pill" style={{ background: roleCfg.bg, color: roleCfg.color, fontSize: 9 }}>
                                      {ticket.user?.role ?? "unknown"}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ maxWidth: 200 }}>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.subject}</p>
                                <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {ticket.message?.slice(0, 55)}{ticket.message?.length > 55 ? "…" : ""}
                                </p>
                              </td>
                              <td>
                                <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}>
                                  <i className={`bi ${catCfg.icon}`}></i> {catCfg.label}
                                </span>
                              </td>
                              <td><PriorityPill priority={ticket.priority} /></td>
                              <td><StatusPill status={ticket.status} /></td>
                              <td style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                                {ticket.created_at
                                  ? new Date(ticket.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                                  : "—"}
                              </td>
                              <td>
                                <button
                                  onClick={() => setSelected(ticket)}
                                  className="filter-btn"
                                  style={{
                                    background: isNew ? "#0056b3" : "#f1f5f9",
                                    color: isNew ? "#fff" : "#64748b",
                                    borderRadius: 8, padding: "5px 13px", fontSize: 12,
                                  }}>
                                  {ticket.admin_response ? "View / Edit" : "Respond"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="d-lg-none" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {pageData.map(ticket => {
                      const catCfg  = CATEGORY_CFG[ticket.category] ?? { icon: "bi-chat-dots", label: ticket.category };
                      const roleCfg = ROLE_CFG[ticket.user?.role]   ?? { bg: "#f1f5f9", color: "#64748b" };
                      const isNew   = ticket.status === "open" && !ticket.admin_response;
                      return (
                        <div key={ticket.id} className="ticket-card">
                          <div style={{ padding: "13px 15px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                              <MiniAvatar name={ticket.user?.name ?? "?"} size={34} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                    {ticket.user?.name ?? "—"}
                                    {isNew && <span className="badge-pill" style={{ background: "#0056b3", color: "#fff", marginLeft: 5, fontSize: 9 }}>NEW</span>}
                                  </span>
                                  <StatusPill status={ticket.status} />
                                </div>
                                <p style={{ margin: "1px 0 3px", fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.user?.email ?? "—"}</p>
                                <span className="badge-pill" style={{ background: roleCfg.bg, color: roleCfg.color, fontSize: 9 }}>{ticket.user?.role ?? "unknown"}</span>
                              </div>
                            </div>
                            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <i className={`bi ${catCfg.icon} me-1`} style={{ color: "#0056b3" }}></i>{ticket.subject}
                            </p>
                            <p style={{ margin: "0 0 8px", fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ticket.message?.slice(0, 65)}{ticket.message?.length > 65 ? "…" : ""}
                            </p>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                              <PriorityPill priority={ticket.priority} />
                              <button onClick={() => setSelected(ticket)} className="filter-btn"
                                style={{ background: isNew ? "#0056b3" : "#f1f5f9", color: isNew ? "#fff" : "#64748b", borderRadius: 8, padding: "4px 12px", marginLeft: "auto" }}>
                                {ticket.admin_response ? "View / Edit" : "Respond"}
                              </button>
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

      {selected && (
        <TicketModal ticket={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} notify={notify} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}