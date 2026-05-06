// src/pages/admin/UserManagement.jsx
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

  /* Buttons */
  .dash-btn-primary{background:var(--blue);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:opacity .15s,transform .15s;text-decoration:none;}
  .dash-btn-primary:hover{opacity:.87;transform:translateY(-1px);color:#fff;}
  .dash-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .dash-btn-ghost{background:#fff;border:1px solid rgba(0,86,179,.15);color:#64748b;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:all .15s;text-decoration:none;}
  .dash-btn-ghost:hover{background:#f1f5f9;color:#1e293b;}

  /* Badge */
  .badge-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;flex-shrink:0;}

  /* Table */
  .dash-table{width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif;}
  .dash-table th{padding:10px 14px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.06em;white-space:nowrap;border-bottom:1px solid #f1f5f9;text-align:left;background:#f8faff;}
  .dash-table td{padding:12px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle;}
  .dash-table tbody tr{transition:background .15s;}
  .dash-table tbody tr:hover{background:#f8faff;}
  .dash-table tbody tr:last-child td{border-bottom:none;}

  /* Action buttons inside table */
  .action-btn-sm{border:none;border-radius:8px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:4px;transition:all .15s;white-space:nowrap;}
  .action-btn-sm:hover{opacity:.85;transform:translateY(-1px);}
  .action-btn-sm:disabled{opacity:.5;cursor:not-allowed;transform:none;}

  /* Stat chips */
  .stat-chip{flex:1;min-width:110px;border-radius:14px;padding:12px;display:flex;align-items:center;gap:8px;border:2px solid transparent;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.04);cursor:pointer;transition:all .15s;}
  .stat-chip:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,86,179,.10);}
  .stat-chip.selected{border-color:currentColor;}

  /* Filter pills */
  .filter-btn{border:none;border-radius:20px;padding:5px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;white-space:nowrap;}
  .filter-btn:hover{opacity:.85;}

  /* Form */
  .form-lbl{font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;display:block;}
  .form-ctrl{width:100%;border:1px solid rgba(0,86,179,.15);border-radius:10px;padding:9px 13px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;background:#f8faff;transition:border-color .2s,box-shadow .2s;}
  .form-ctrl:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .form-ctrl:disabled{opacity:.6;cursor:not-allowed;}
  .form-ctrl.err{border-color:#dc3545;}
  .form-err{font-size:11px;color:#dc3545;margin-top:4px;}

  /* Modal */
  .modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);backdrop-filter:blur(4px);z-index:1055;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;}
  .modal-box{background:#fff;border-radius:20px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,.18);overflow:hidden;display:flex;flex-direction:column;max-height:calc(100vh - 32px);animation:fadeUp .25s ease;}
  .modal-hdr{padding:20px 22px 14px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0;}
  .modal-body{overflow-y:auto;padding:18px 22px;flex:1;}
  .modal-ftr{padding:12px 22px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;}

  /* User card (mobile) */
  .user-card{background:#fff;border-radius:14px;border:1px solid rgba(0,86,179,.06);box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden;margin-bottom:8px;}

  /* Bottom nav */
  .admin-bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bnav-item i{font-size:19px;}

  /* Pagination */
  .page-btn{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,86,179,.15);background:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;color:#64748b;padding:0 6px;}
  .page-btn:hover{background:var(--blue-lite);border-color:var(--blue);color:var(--blue);}
  .page-btn.active{background:var(--blue);border-color:var(--blue);color:#fff;}
  .page-btn:disabled{opacity:.4;cursor:not-allowed;}

  @media(max-width:991px){.hide-md{display:none!important;}}
  @media(max-width:767px){
    .hide-mobile{display:none!important;}
    .dash-table td,.dash-table th{padding:8px 10px;font-size:12px;}
    .stat-chip{min-width:calc(50% - 5px);}
  }
  @media(max-width:480px){.stat-chip{min-width:calc(50% - 5px);}}
`;

/* ─── Nav config ─────────────────────────────────────────────────────── */
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
  { to: "/admin/courses", icon: "bi-book",              label: "Courses" },
  { to: "/admin/exams",   icon: "bi-file-earmark-text", label: "Exams"   },
  { to: "/admin/support", icon: "bi-headset",           label: "Support" },
];

/* ─── Design tokens ──────────────────────────────────────────────────── */
const ROLE_CFG = {
  student:    { bg: "#e8f0fe", color: "#0056b3", dot: "#0056b3" },
  instructor: { bg: "#eff6ff", color: "#1a6ed8", dot: "#3b82f6" },
  admin:      { bg: "#fff0f0", color: "#dc3545", dot: "#dc3545" },
};
const STATUS_CFG = {
  active:    { bg: "#f0fdf4", color: "#16a34a" },
  suspended: { bg: "#fff8f0", color: "#fd7e14" },
};

const BLANK_FORM = { name: "", email: "", password: "", role: "student" };

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
  if (res.status === 419) throw new Error("CSRF Token mismatch. Please refresh the page.");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.errors ? Object.values(json.errors).flat().join(" ") : json?.message ?? "Something went wrong.";
    throw new Error(msg);
  }
  return json;
}

const PER_PAGE = 20;

/* ─── Small reusable atoms ───────────────────────────────────────────── */
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

function RolePill({ role = "" }) {
  const s = ROLE_CFG[role.toLowerCase()] ?? { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" };
  return (
    <span className="badge-pill" style={{ background: s.bg, color: s.color }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }}></span>
      {role}
    </span>
  );
}

function StatusPill({ status = "" }) {
  const s = STATUS_CFG[status.toLowerCase()] ?? { bg: "#f1f5f9", color: "#64748b" };
  return <span className="badge-pill" style={{ background: s.bg, color: s.color }}>{status}</span>;
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

/* ─── User Form (add / edit) ─────────────────────────────────────────── */
function UserForm({ initial = {}, isEdit, onSubmit, onCancel, saving }) {
  const [form,   setForm]   = useState({ ...BLANK_FORM, ...initial });
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())                        e.name     = "Name is required.";
    if (!form.email.trim())                       e.email    = "Email is required.";
    if (!isEdit && !form.password.trim())         e.password = "Password is required.";
    if (form.password && form.password.length < 8 && (!isEdit || form.password)) {
      e.password = "Password must be at least 8 characters.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => { if (validate()) onSubmit(form); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label className="form-lbl">Full Name <span style={{ color: "#dc3545" }}>*</span></label>
        <input type="text" className={`form-ctrl ${errors.name ? "err" : ""}`}
          value={form.name} onChange={set("name")} placeholder="e.g. Juan Dela Cruz" disabled={saving} />
        {errors.name && <p className="form-err">{errors.name}</p>}
      </div>
      <div>
        <label className="form-lbl">Email Address <span style={{ color: "#dc3545" }}>*</span></label>
        <input type="email" className={`form-ctrl ${errors.email ? "err" : ""}`}
          value={form.email} onChange={set("email")} placeholder="user@school.edu" disabled={saving} />
        {errors.email && <p className="form-err">{errors.email}</p>}
      </div>
      <div>
        <label className="form-lbl">
          {isEdit ? "New Password" : "Password"} <span style={{ color: "#dc3545" }}>{!isEdit ? "*" : ""}</span>
          {isEdit && <span style={{ fontWeight: 400, textTransform: "none", color: "#94a3b8", marginLeft: 4 }}>(blank = keep current)</span>}
        </label>
        <input type="password" className={`form-ctrl ${errors.password ? "err" : ""}`}
          value={form.password} onChange={set("password")} placeholder="Min 8 chars · Aa1@" disabled={saving} />
        {errors.password && <p className="form-err">{errors.password}</p>}
      </div>
      <div>
        <label className="form-lbl">Role <span style={{ color: "#dc3545" }}>*</span></label>
        <select className="form-ctrl" value={form.role} onChange={set("role")} disabled={saving}>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
        <button className="dash-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="dash-btn-primary" onClick={submit} disabled={saving}>
          {saving
            ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: "0.75rem", height: "0.75rem" }} />Saving…</>
            : <><i className={`bi ${isEdit ? "bi-check-lg" : "bi-person-plus"}`}></i>{isEdit ? "Save Changes" : "Register User"}</>}
        </button>
      </div>
    </div>
  );
}

/* ─── Confirm Delete Modal ───────────────────────────────────────────── */
function DeleteModal({ user, onConfirm, onClose, saving }) {
  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 400 }} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div>
            <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              <i className="bi bi-person-x me-2" style={{ color: "#dc3545" }}></i>Delete User
            </h5>
          </div>
          <button onClick={onClose} disabled={saving}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8", padding: 4, lineHeight: 1 }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#fff0f0", borderRadius: 12, border: "1px solid #fecaca", marginBottom: 14 }}>
            <MiniAvatar name={user.name} size={40} />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{user.name}</p>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: "#64748b" }}>{user.email}</p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>
            Are you sure you want to permanently delete this user? This action <strong style={{ color: "#dc3545" }}>cannot be undone</strong> and will remove all associated data.
          </p>
        </div>
        <div className="modal-ftr">
          <button className="dash-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="dash-btn-primary" style={{ background: "#dc3545" }} onClick={onConfirm} disabled={saving}>
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: "0.75rem", height: "0.75rem" }} />Deleting…</>
              : <><i className="bi bi-trash"></i> Yes, Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════ */
export default function UserManagement() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user,       setUser]       = useState(null);
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [toast,      setToast]      = useState(null);
  const [modal,      setModal]      = useState(null); // { type: 'add'|'edit'|'delete', user? }
  const [saving,     setSaving]     = useState(false);
  const [page,       setPage]       = useState(1);

  const notify    = (msg, type = "success") => setToast({ msg, type });
  const closeModal = () => setModal(null);
  const isActive  = (to) => to === "/admin" ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = async () => {
    try { await api("POST", "/logout"); } catch {}
    navigate("/");
  };

  /* ── Load ── */
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [res, meRes] = await Promise.all([
        api("GET", "/admin/users"),
        api("GET", "/me").catch(() => ({ user: null })),
      ]);
      setUsers(res.data ?? res.users ?? (Array.isArray(res) ? res : []));
      setUser(meRes.user);
    } catch (err) { notify(err.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  /* ── Add ── */
  const handleAdd = async (form) => {
    setSaving(true);
    try {
      const res = await api("POST", "/admin/users", {
        name: form.name, email: form.email, password: form.password, role: form.role,
      });
      setUsers(u => [res.user ?? res, ...u]);
      notify("User registered successfully.");
      closeModal();
    } catch (err) { notify(err.message, "error"); }
    finally { setSaving(false); }
  };

  /* ── Edit ── */
  const handleEdit = async (form) => {
    const { id } = modal.user;
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (form.password.trim()) payload.password = form.password;
      const res = await api("PUT", `/admin/users/${id}`, payload);
      setUsers(u => u.map(x => x.id === id ? (res.user ?? res) : x));
      notify("User updated successfully.");
      closeModal();
    } catch (err) { notify(err.message, "error"); }
    finally { setSaving(false); }
  };

  /* ── Suspend / Activate ── */
  const handleToggleSuspend = async (target) => {
    const newStatus = target.status?.toLowerCase() === "suspended" ? "active" : "suspended";
    // Optimistic update
    setUsers(u => u.map(x => x.id === target.id ? { ...x, status: newStatus } : x));
    try {
      await api("PATCH", `/admin/users/${target.id}/status`, { status: newStatus });
      notify(`User ${newStatus === "suspended" ? "suspended" : "reactivated"} successfully.`);
    } catch (err) {
      // Revert
      setUsers(u => u.map(x => x.id === target.id ? { ...x, status: target.status } : x));
      notify(err.message, "error");
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    const { id } = modal.user;
    setSaving(true);
    try {
      await api("DELETE", `/admin/users/${id}`);
      setUsers(u => u.filter(x => x.id !== id));
      notify("User deleted successfully.");
      closeModal();
    } catch (err) { notify(err.message, "error"); }
    finally { setSaving(false); }
  };

  /* ── Filtering ── */
  const filtered = users.filter(u => {
    const q  = search.toLowerCase();
    const ok = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    return ok && (roleFilter === "all" || u.role?.toLowerCase() === roleFilter);
  });

  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    all:        users.length,
    student:    users.filter(u => u.role?.toLowerCase() === "student").length,
    instructor: users.filter(u => u.role?.toLowerCase() === "instructor").length,
    admin:      users.filter(u => u.role?.toLowerCase() === "admin").length,
  };

  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "A";
  const firstName = user?.name?.split(" ")[0] ?? "Admin";

  const STAT_CHIPS = [
    { key: "all",        label: "All Users",   value: counts.all,        color: "#0056b3", bg: "#e8f0fe", icon: "bi-people"      },
    { key: "student",    label: "Students",    value: counts.student,    color: "#0056b3", bg: "#e8f0fe", icon: "bi-person"       },
    { key: "instructor", label: "Instructors", value: counts.instructor, color: "#1a6ed8", bg: "#eff6ff", icon: "bi-person-badge" },
    { key: "admin",      label: "Admins",      value: counts.admin,      color: "#dc3545", bg: "#fff0f0", icon: "bi-shield-check" },
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
            <input className="dash-search" placeholder="Search by name or email…"
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
              <input className="dash-search" style={{ paddingLeft: 36 }} placeholder="Search by name or email…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Page header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Admin</p>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px" }}>User Management</h1>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  {users.length} total account{users.length !== 1 ? "s" : ""} in the system
                </p>
              </div>
              <button className="dash-btn-primary" onClick={() => setModal({ type: "add" })} style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                <i className="bi bi-person-plus"></i>
                <span className="d-none d-sm-inline"> Register User</span>
                <span className="d-sm-none">Add</span>
              </button>
            </div>

            {/* Stat chips — clickable role filter */}
            <div className="fade-up" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              {STAT_CHIPS.map(({ key, label, value, color, bg, icon }) => {
                const sel = roleFilter === key;
                return (
                  <div key={key}
                    className={`stat-chip ${sel ? "selected" : ""}`}
                    style={{ color, borderColor: sel ? color : "transparent" }}
                    onClick={() => setRoleFilter(roleFilter === key ? "all" : key)}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className={`bi ${icon}`} style={{ color, fontSize: 15 }}></i>
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
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {/* Role filter pills */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { key: "all",        label: "All Roles"   },
                    { key: "student",    label: "Students"    },
                    { key: "instructor", label: "Instructors" },
                    { key: "admin",      label: "Admins"      },
                  ].map(({ key, label }) => {
                    const active = roleFilter === key;
                    const cfg = ROLE_CFG[key];
                    return (
                      <button key={key} className="filter-btn"
                        onClick={() => setRoleFilter(roleFilter === key ? "all" : key)}
                        style={{
                          background: active ? (cfg?.color ?? "#0056b3") : "#f1f5f9",
                          color: active ? "#fff" : "#64748b",
                        }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
                  {filtered.length} user{filtered.length !== 1 ? "s" : ""}
                </span>
                <button className="dash-btn-ghost" onClick={loadUsers} style={{ fontSize: 12, padding: "6px 12px" }}>
                  {loading
                    ? <span className="spinner-border spinner-border-sm" style={{ width: "0.75rem", height: "0.75rem" }} />
                    : <><i className="bi bi-arrow-clockwise"></i><span className="d-none d-sm-inline"> Refresh</span></>}
                </button>
              </div>

              {/* Content */}
              {loading ? (
                <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8" }}>
                  <i className="bi bi-people" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: .3 }}></i>
                  <p style={{ margin: "0 0 12px", fontSize: 13 }}>
                    {search || roleFilter !== "all" ? "No users match your filters." : "No users found."}
                  </p>
                  {!search && roleFilter === "all" && (
                    <button className="dash-btn-primary" onClick={() => setModal({ type: "add" })}>
                      <i className="bi bi-person-plus"></i> Register first user
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hide-mobile" style={{ overflowX: "auto" }}>
                    <table className="dash-table">
                      <thead>
                        <tr>
                          {["User", "Email", "Role", "Status", "Joined", "Actions"].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.map((u) => {
                          const isSuspended = u.status?.toLowerCase() === "suspended";
                          const isAdminRole = u.role?.toLowerCase() === "admin";
                          return (
                            <tr key={u.id}>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <MiniAvatar name={u.name} size={30} />
                                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{u.name}</span>
                                </div>
                              </td>
                              <td style={{ fontSize: 12, color: "#64748b" }}>{u.email}</td>
                              <td><RolePill role={u.role} /></td>
                              <td><StatusPill status={u.status ?? "active"} /></td>
                              <td style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                                {u.created_at
                                  ? new Date(u.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                                  : "—"}
                              </td>
                              <td>
                                {isAdminRole ? (
                                  <span style={{ fontSize: 11, color: "#94a3b8" }}>System</span>
                                ) : (
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    <button className="action-btn-sm"
                                      onClick={() => setModal({ type: "edit", user: u })}
                                      style={{ background: "#e8f0fe", color: "#0056b3" }}>
                                      <i className="bi bi-pencil"></i> Edit
                                    </button>
                                    <button className="action-btn-sm"
                                      onClick={() => handleToggleSuspend(u)}
                                      style={{
                                        background: isSuspended ? "#f0fdf4" : "#fff8f0",
                                        color: isSuspended ? "#16a34a" : "#fd7e14",
                                      }}>
                                      <i className={`bi ${isSuspended ? "bi-person-check" : "bi-person-dash"}`}></i>
                                      {isSuspended ? "Activate" : "Suspend"}
                                    </button>
                                    <button className="action-btn-sm"
                                      onClick={() => setModal({ type: "delete", user: u })}
                                      style={{ background: "#fff0f0", color: "#dc3545" }}>
                                      <i className="bi bi-trash"></i> Delete
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile user cards */}
                  <div className="d-lg-none" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {pageData.map((u) => {
                      const isSuspended = u.status?.toLowerCase() === "suspended";
                      const isAdminRole = u.role?.toLowerCase() === "admin";
                      return (
                        <div key={u.id} className="user-card">
                          <div style={{ padding: "13px 15px" }}>
                            {/* Top row */}
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                              <MiniAvatar name={u.name} size={38} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{u.name}</span>
                                  <StatusPill status={u.status ?? "active"} />
                                </div>
                                <p style={{ margin: "1px 0 4px", fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {u.email}
                                </p>
                                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                  <RolePill role={u.role} />
                                  {u.created_at && (
                                    <span style={{ fontSize: 10, color: "#94a3b8", alignSelf: "center" }}>
                                      <i className="bi bi-calendar3 me-1"></i>
                                      {new Date(u.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Actions */}
                            {!isAdminRole && (
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <button className="action-btn-sm"
                                  onClick={() => setModal({ type: "edit", user: u })}
                                  style={{ background: "#e8f0fe", color: "#0056b3" }}>
                                  <i className="bi bi-pencil"></i> Edit
                                </button>
                                <button className="action-btn-sm"
                                  onClick={() => handleToggleSuspend(u)}
                                  style={{ background: isSuspended ? "#f0fdf4" : "#fff8f0", color: isSuspended ? "#16a34a" : "#fd7e14" }}>
                                  <i className={`bi ${isSuspended ? "bi-person-check" : "bi-person-dash"}`}></i>
                                  {isSuspended ? "Activate" : "Suspend"}
                                </button>
                                <button className="action-btn-sm"
                                  onClick={() => setModal({ type: "delete", user: u })}
                                  style={{ background: "#fff0f0", color: "#dc3545" }}>
                                  <i className="bi bi-trash"></i> Delete
                                </button>
                              </div>
                            )}
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

      {/* ── Add User Modal ── */}
      {modal?.type === "add" && (
        <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget && !saving) closeModal(); }}>
          <div className="modal-box" style={{ maxWidth: 480 }} onMouseDown={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div>
                <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  <i className="bi bi-person-plus me-2" style={{ color: "#0056b3" }}></i>Register New User
                </h5>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>Fill in the details to create an account</p>
              </div>
              <button onClick={closeModal} disabled={saving}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8", padding: 4, lineHeight: 1 }}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <UserForm isEdit={false} onSubmit={handleAdd} onCancel={closeModal} saving={saving} />
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {modal?.type === "edit" && (
        <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget && !saving) closeModal(); }}>
          <div className="modal-box" style={{ maxWidth: 480 }} onMouseDown={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div>
                <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  <i className="bi bi-pencil me-2" style={{ color: "#0056b3" }}></i>Edit User
                </h5>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>Update account information</p>
              </div>
              <button onClick={closeModal} disabled={saving}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8", padding: 4, lineHeight: 1 }}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <UserForm
                isEdit
                initial={{ name: modal.user.name, email: modal.user.email, role: modal.user.role, password: "" }}
                onSubmit={handleEdit}
                onCancel={closeModal}
                saving={saving}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Delete User Modal ── */}
      {modal?.type === "delete" && (
        <DeleteModal user={modal.user} onConfirm={handleDelete} onClose={closeModal} saving={saving} />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}