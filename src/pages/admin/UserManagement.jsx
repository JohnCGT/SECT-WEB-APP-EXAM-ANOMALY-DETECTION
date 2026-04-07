// src/pages/admin/UserManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

/* ─── Inject fonts & keyframes once ──────────────────────────────────── */
(function bootstrap() {
  if (document.getElementById("um-styles")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Epilogue:wght@400;500;600&display=swap";
  document.head.appendChild(link);

  const style = document.createElement("style");
  style.id = "um-styles";
  style.textContent = `
    *{box-sizing:border-box}
    @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
    @keyframes slideUp {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes popIn   {from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
    @keyframes rowIn   {from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
    .um-row{animation:rowIn .2s ease both}
    .um-btn{transition:filter .15s,transform .12s,opacity .15s;cursor:pointer}
    .um-btn:hover:not(:disabled){filter:brightness(1.07);transform:translateY(-1px)}
    .um-btn:active:not(:disabled){transform:translateY(0)}
    .um-btn:disabled{opacity:.5;cursor:not-allowed}
    .um-input{transition:border-color .15s,box-shadow .15s}
    .um-input:focus{outline:none;border-color:#6C63FF!important;box-shadow:0 0 0 3px rgba(108,99,255,.18)!important}
    .um-tr td{transition:background .12s}
    .um-tr:hover td{background:#F5F4FF}
    .um-tab{transition:all .15s}
    .um-tab:hover{color:#6C63FF!important}
  `;
  document.head.appendChild(style);
})();

/* ─── API helper ─────────────────────────────────────────────────────── */
const BASE = (import.meta?.env?.VITE_API_URL ?? "/api");

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 
      "Content-Type": "application/json", 
      "Accept": "application/json",
      // MANDATORY for Laravel 11 stateful API
      "X-Requested-With": "XMLHttpRequest" 
    },
    credentials: "include",
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  
  // Handle 419 specifically to provide a clear error
  if (res.status === 419) {
    throw new Error("CSRF Token mismatch. Please refresh the page.");
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.errors
        ? Object.values(json.errors).flat().join(" ")
        : json?.message ?? "Something went wrong.";
    throw new Error(msg);
  }
  return json;
}

/* ─── Design tokens ──────────────────────────────────────────────────── */
const C = {
  bg:      "#F4F3FF",
  card:    "#FFFFFF",
  border:  "#E6E4FF",
  accent:  "#6C63FF",
  text:    "#0D0C1D",
  muted:   "#7A788F",
  danger:  "#E53935",
  warn:    "#FB8C00",
  green:   "#2E7D32",
};

const ROLE_STYLE = {
  student:    { bg:"#EDE9FF", color:"#3D34B0", dot:"#6C63FF" },
  instructor: { bg:"#E3F2FD", color:"#1565C0", dot:"#1E88E5" },
  admin:      { bg:"#FCE4EC", color:"#B71C1C", dot:"#E53935" },
};
const STATUS_STYLE = {
  active:    { bg:"#E8F5E9", color:"#2E7D32" },
  suspended: { bg:"#FFF3E0", color:"#E65100" },
};

/* ─── Tiny atoms ─────────────────────────────────────────────────────── */
function Avatar({ name = "" }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue},55%,88%)`, color: `hsl(${hue},45%,30%)`,
      fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif",
    }}>
      {initials}
    </span>
  );
}

function RoleChip({ role = "" }) {
  const s = ROLE_STYLE[role.toLowerCase()] ?? { bg: "#F1F1F1", color: "#555" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, letterSpacing: ".04em", textTransform: "uppercase",
    }}>
      {s.dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />}
      {role}
    </span>
  );
}

function StatusChip({ status = "" }) {
  const s = STATUS_STYLE[status.toLowerCase()] ?? { bg: "#F1F1F1", color: "#555" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, letterSpacing: ".04em", textTransform: "uppercase",
    }}>
      {status}
    </span>
  );
}

function Btn({ onClick, variant = "primary", size = "md", disabled, children, style: extra = {} }) {
  const PAD = size === "sm" ? "5px 12px" : size === "lg" ? "11px 24px" : "8px 16px";
  const FS  = size === "sm" ? 12 : 14;
  const VARS = {
    primary: { background: C.accent,   color: "#fff", border: "none" },
    danger:  { background: C.danger,   color: "#fff", border: "none" },
    warn:    { background: C.warn,     color: "#fff", border: "none" },
    ghost:   { background: "transparent", color: C.accent, border: `1.5px solid ${C.border}` },
    outline: { background: "transparent", color: C.muted,  border: `1.5px solid ${C.border}` },
  };
  return (
    <button className="um-btn" onClick={onClick} disabled={disabled} style={{
      border: "none", borderRadius: 8, padding: PAD, fontSize: FS,
      fontFamily: "'Epilogue',sans-serif", fontWeight: 600,
      ...VARS[variant], ...extra,
    }}>
      {children}
    </button>
  );
}

function FormInput({ label, error, type = "text", value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
        textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>
        {label}
      </label>
      <input
        className="um-input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`,
          borderRadius: 8, fontSize: 14, fontFamily: "'Epilogue',sans-serif",
          color: C.text, background: "#fff",
        }}
      />
      {error && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{error}</p>}
    </div>
  );
}

function FormSelect({ label, error, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
        textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>
        {label}
      </label>
      <select
        className="um-input"
        value={value}
        onChange={onChange}
        style={{
          width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`,
          borderRadius: 8, fontSize: 14, fontFamily: "'Epilogue',sans-serif",
          color: C.text, background: "#fff", appearance: "none", cursor: "pointer",
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{error}</p>}
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────── */
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3800); return () => clearTimeout(t); }, [onDone]);
  const isErr = type === "error";
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: isErr ? "#FFEBEE" : "#E8F5E9",
      color: isErr ? C.danger : C.green,
      padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500,
      fontFamily: "'Epilogue',sans-serif",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 6px 30px rgba(0,0,0,.14)",
      animation: "slideUp .25s ease",
    }}>
      <span style={{ fontWeight: 700 }}>{isErr ? "✕" : "✓"}</span>
      {msg}
    </div>
  );
}

/* ─── Modal shell ────────────────────────────────────────────────────── */
/* ─── Modal shell ────────────────────────────────────────────────────── */
function Modal({ title, onClose, children, width = 460 }) {
  return (
    <div
      // FIX: Use onMouseDown + target check
      // This prevents the modal from closing if the user starts 
      // selecting text inside but releases the mouse outside.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(10,9,25,.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn .15s ease",
      }}
    >
      <div
        // Stop the mouse event from bubbling up to the backdrop
        onMouseDown={e => e.stopPropagation()}
        style={{
          background: C.card, borderRadius: 16, padding: "28px 30px",
          width, maxWidth: "94vw",
          boxShadow: "0 24px 70px rgba(0,0,0,.22)",
          animation: "popIn .2s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: C.text }}>
            {title}
          </h3>
          <button onClick={onClose} style={{
            border: "none", background: "none", fontSize: 22,
            cursor: "pointer", color: C.muted, lineHeight: 1,
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── UserForm (Add & Edit) ──────────────────────────────────────────── */
const BLANK = { name: "", email: "", password: "", role: "student" };
const ROLE_OPTIONS = [
  { value: "student",    label: "Student"    },
  { value: "instructor", label: "Instructor" },
  { value: "admin",      label: "Admin"      },
];

function UserForm({ initial, isEdit, onSubmit, onCancel, saving }) {
  const [form, setForm]     = useState({ ...BLANK, ...initial });
  const [errors, setErrors] = useState({});

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    if (!isEdit && !form.password.trim()) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => { if (validate()) onSubmit(form); };

  return (
    <div>
      <FormInput
        label="Full Name" error={errors.name}
        value={form.name} onChange={set("name")} placeholder="e.g. Juan Dela Cruz"
      />
      <FormInput
        label="Email" type="email" error={errors.email}
        value={form.email} onChange={set("email")} placeholder="user@school.edu"
      />
      <FormInput
        label={isEdit ? "New Password (blank = keep current)" : "Password"}
        type="password" error={errors.password}
        value={form.password} onChange={set("password")}
        placeholder="Min 8 chars · Aa1@"
      />
      <FormSelect
        label="Role" error={errors.role}
        value={form.role} onChange={set("role")} options={ROLE_OPTIONS}
      />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Register User"}
        </Btn>
      </div>
    </div>
  );
}

/* ─── StatCard ───────────────────────────────────────────────────────── */
function StatCard({ label, value, color, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className="um-btn"
      style={{
        background: active ? color : C.card,
        border: `1.5px solid ${active ? color : C.border}`,
        borderRadius: 12, padding: "14px 18px", cursor: "pointer",
        flex: 1, minWidth: 110,
      }}
    >
      <p style={{ margin: 0, fontSize: 26, fontWeight: 800,
        fontFamily: "'Syne',sans-serif", color: active ? "#fff" : color }}>
        {value}
      </p>
      <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600,
        color: active ? "rgba(255,255,255,.8)" : C.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>
        {label}
      </p>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function UserManagement() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [toast,   setToast]   = useState(null);
  const [modal,   setModal]   = useState(null); // { type: "add"|"edit"|"delete", user? }
  const [saving,  setSaving]  = useState(false);

  const notify    = (msg, type = "success") => setToast({ msg, type });
  const closeModal = () => setModal(null);

  /* ── Load users ───────────────────────────────────────────────────── */
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("GET", "/admin/users");
      // Laravel resource collection → { data: [...] }  OR plain array
      setUsers(res.data ?? res.users ?? (Array.isArray(res) ? res : []));
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  /* ── Add user ─────────────────────────────────────────────────────── */
  const handleAdd = async (form) => {
    setSaving(true);
    try {
      const res = await api("POST", "/admin/users", {
        name:     form.name,
        email:    form.email,
        password: form.password,
        role:     form.role,
      });
      setUsers(u => [...u, res.user ?? res]);
      notify("User registered successfully.");
      closeModal();
    } catch (err) {
      notify(err.message, "error");
    } finally { setSaving(false); }
  };

  /* ── Edit user ────────────────────────────────────────────────────── */
  const handleEdit = async (form) => {
    const { id } = modal.user;
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (form.password.trim()) payload.password = form.password;
      const res = await api("PUT", `/admin/users/${id}`, payload);
      setUsers(u => u.map(x => x.id === id ? (res.user ?? res) : x));
      notify("User updated.");
      closeModal();
    } catch (err) {
      notify(err.message, "error");
    } finally { setSaving(false); }
  };

  /* ── Toggle suspend ───────────────────────────────────────────────── */
  const handleToggleSuspend = async (user) => {
    const newStatus = user.status?.toLowerCase() === "suspended" ? "active" : "suspended";
    // optimistic update
    setUsers(u => u.map(x => x.id === user.id ? { ...x, status: newStatus } : x));
    try {
      await api("PATCH", `/admin/users/${user.id}/status`, { status: newStatus });
      notify(`User ${newStatus === "suspended" ? "suspended" : "reactivated"}.`);
    } catch (err) {
      // rollback
      setUsers(u => u.map(x => x.id === user.id ? { ...x, status: user.status } : x));
      notify(err.message, "error");
    }
  };

  /* ── Delete user ──────────────────────────────────────────────────── */
  const handleDelete = async () => {
    const { id } = modal.user;
    setSaving(true);
    try {
      await api("DELETE", `/admin/users/${id}`);
      setUsers(u => u.filter(x => x.id !== id));
      notify("User deleted.");
      closeModal();
    } catch (err) {
      notify(err.message, "error");
    } finally { setSaving(false); }
  };

  /* ── Filtered list ────────────────────────────────────────────────── */
  const filtered = users.filter(u => {
    const q  = search.toLowerCase();
    const ok = !q
      || u.name?.toLowerCase().includes(q)
      || u.email?.toLowerCase().includes(q);
    const roleOk = roleFilter === "all" || u.role?.toLowerCase() === roleFilter;
    return ok && roleOk;
  });

  /* ── Counts for stat cards ────────────────────────────────────────── */
  const counts = {
    all:        users.length,
    student:    users.filter(u => u.role?.toLowerCase() === "student").length,
    instructor: users.filter(u => u.role?.toLowerCase() === "instructor").length,
    admin:      users.filter(u => u.role?.toLowerCase() === "admin").length,
  };

  /* ─── Render ──────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 24px", fontFamily: "'Epilogue',sans-serif" }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.accent,
            textTransform: "uppercase", letterSpacing: ".12em" }}>
            Admin Panel
          </p>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800,
            fontFamily: "'Syne',sans-serif", color: C.text }}>
            User Management
          </h1>
          <p style={{ margin: "5px 0 0", fontSize: 14, color: C.muted }}>
            {users.length} total account{users.length !== 1 ? "s" : ""} in the system
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link to="/admin" style={{
            textDecoration: "none", fontSize: 13, color: C.muted, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            ← Dashboard
          </Link>
          <Btn variant="primary" size="lg" onClick={() => setModal({ type: "add" })}>
            + Register User
          </Btn>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { key: "all",        label: "All Users",   color: C.accent  },
          { key: "student",    label: "Students",    color: "#6C63FF" },
          { key: "instructor", label: "Instructors", color: "#1E88E5" },
          { key: "admin",      label: "Admins",      color: C.danger  },
        ].map(({ key, label, color }) => (
          <StatCard
            key={key} label={label} value={counts[key]} color={color}
            active={roleFilter === key}
            onClick={() => setRoleFilter(roleFilter === key ? "all" : key)}
          />
        ))}
      </div>

      {/* ── Table card ── */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`,
        boxShadow: "0 4px 20px rgba(108,99,255,.07)", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`,
          display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
              fontSize: 14, color: C.muted }}>🔍</span>
            <input
              className="um-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              style={{
                width: "100%", padding: "8px 12px 8px 34px",
                border: `1.5px solid ${C.border}`, borderRadius: 8,
                fontSize: 13, fontFamily: "'Epilogue',sans-serif", color: C.text, background: "#fff",
              }}
            />
          </div>
          {/* Role filter pills */}
          {["all","student","instructor","admin"].map(r => (
            <button
              key={r}
              className="um-tab"
              onClick={() => setRoleFilter(r)}
              style={{
                border: "none", borderRadius: 20, padding: "6px 14px",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Epilogue',sans-serif", textTransform: "capitalize",
                background: roleFilter === r ? C.accent : C.bg,
                color: roleFilter === r ? "#fff" : C.muted,
              }}
            >
              {r === "all" ? "All Roles" : r}
            </button>
          ))}
          <Btn variant="outline" size="sm" onClick={loadUsers}>↻ Refresh</Btn>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: C.muted, fontSize: 14 }}>
            Loading users…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: C.muted, fontSize: 14 }}>
            {search || roleFilter !== "all" ? "No users match your filters." : "No users found."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["User", "Email", "Role", "Status", "Joined", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700,
                    color: C.muted, textTransform: "uppercase", letterSpacing: ".07em",
                    background: "#FAFAFE",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => {
                const isSuspended = user.status?.toLowerCase() === "suspended";
                const isAdmin     = user.role?.toLowerCase() === "admin";
                return (
                  <tr
                    key={user.id}
                    className="um-tr um-row"
                    style={{ borderBottom: `1px solid ${C.border}`, animationDelay: `${i * 30}ms` }}
                  >
                    {/* Name + Avatar */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={user.name} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                          {user.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>
                      {user.email}
                    </td>

                    {/* Role chip */}
                    <td style={{ padding: "12px 16px" }}>
                      <RoleChip role={user.role} />
                    </td>

                    {/* Status chip */}
                    <td style={{ padding: "12px 16px" }}>
                      <StatusChip status={user.status ?? "active"} />
                    </td>

                    {/* Joined date */}
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString("en-PH", {
                            year: "numeric", month: "short", day: "numeric",
                          })
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      {isAdmin ? (
                        <span style={{ fontSize: 12, color: C.muted }}>System</span>
                      ) : (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {/* Edit */}
                          <Btn
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation(); // Stops event from bubbling
                              setModal({ type: "edit", user });
                            }}
                          >
                            Edit
                          </Btn>

                          {/* Suspend / Activate */}
                          <Btn
                            size="sm"
                            variant={isSuspended ? "primary" : "warn"}
                            onClick={() => handleToggleSuspend(user)}
                          >
                            {isSuspended ? "Activate" : "Suspend"}
                          </Btn>

                          {/* Delete */}
                          <Btn
                            size="sm" variant="danger"
                            onClick={() => setModal({ type: "delete", user })}
                          >
                            Delete
                          </Btn>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: "10px 20px", borderTop: `1px solid ${C.border}`,
            fontSize: 12, color: C.muted, textAlign: "right" }}>
            Showing {filtered.length} of {users.length} users
          </div>
        )}
      </div>

      {/* ── Add modal ── */}
      {modal?.type === "add" && (
        <Modal title="Register New User" onClose={closeModal}>
          <UserForm
            isEdit={false}
            onSubmit={handleAdd}
            onCancel={closeModal}
            saving={saving}
          />
        </Modal>
      )}

      {/* ── Edit modal ── */}
      {modal?.type === "edit" && (
        <Modal title="Edit User" onClose={closeModal}>
          <UserForm
            isEdit
            initial={{ name: modal.user.name, email: modal.user.email, role: modal.user.role, password: "" }}
            onSubmit={handleEdit}
            onCancel={closeModal}
            saving={saving}
          />
        </Modal>
      )}

      {/* ── Delete confirm modal ── */}
      {modal?.type === "delete" && (
        <Modal title="Delete User" onClose={closeModal} width={380}>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
            Are you sure you want to permanently delete{" "}
            <strong style={{ color: C.text }}>{modal.user.name}</strong>?
            This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={closeModal}>Cancel</Btn>
            <Btn variant="danger" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting…" : "Yes, Delete"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}