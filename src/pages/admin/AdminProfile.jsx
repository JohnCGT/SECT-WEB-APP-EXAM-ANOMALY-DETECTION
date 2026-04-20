// src/pages/admin/AdminProfile.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell";

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
    @keyframes popIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
    .a-btn{transition:filter .15s,transform .12s,opacity .15s;cursor:pointer}
    .a-btn:hover:not(:disabled){filter:brightness(1.07);transform:translateY(-1px)}
    .a-btn:active:not(:disabled){transform:translateY(0)}
    .a-btn:disabled{opacity:.5;cursor:not-allowed}
    .a-nav-link{transition:all .15s;text-decoration:none}
    .a-nav-link:hover{background:rgba(108,99,255,.08)!important}
    .a-input{transition:border-color .15s,box-shadow .15s}
    .a-input:focus{outline:none;border-color:#6C63FF!important;box-shadow:0 0 0 3px rgba(108,99,255,.18)!important}
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
  if (res.status === 419) throw new Error("Session expired. Please refresh.");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.errors
      ? Object.values(json.errors).flat().join(" ")
      : json?.message ?? "Something went wrong.";
    throw new Error(msg);
  }
  return json;
}

/* ─── Sidebar nav ────────────────────────────────────────────────────── */
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
      padding:"24px 0", flexShrink:0, minHeight:"100vh",
      position:"sticky", top:0, height:"100vh" }}>
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
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <NotificationBell />
        <div style={{ width:36, height:36, borderRadius:"50%", background:C.accent,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, fontWeight:800, fontFamily:"'Syne',sans-serif", color:"#fff",
          cursor:"pointer", border:`2px solid ${C.border}` }}>A</div>
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

/* ─── Field component ────────────────────────────────────────────────── */
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.muted,
        textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ margin:"4px 0 0", fontSize:12, color:C.danger }}>{error}</p>}
    </div>
  );
}

function Input({ value, onChange, type="text", placeholder, disabled }) {
  return (
    <input
      className="a-input"
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} disabled={disabled}
      style={{
        width:"100%", padding:"10px 14px", border:`1.5px solid ${C.border}`,
        borderRadius:8, fontSize:14, fontFamily:"'Epilogue',sans-serif",
        color:C.text, background: disabled ? C.bg : "#fff",
        cursor: disabled ? "default" : "text",
      }}
    />
  );
}

/* ─── Avatar large ───────────────────────────────────────────────────── */
function AvatarLarge({ name = "" }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width:80, height:80, borderRadius:"50%",
      background: `hsl(${hue},55%,88%)`, color: `hsl(${hue},45%,30%)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:28, fontWeight:800, fontFamily:"'Syne',sans-serif",
      border:`3px solid ${C.border}`, flexShrink:0,
    }}>
      {initials}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function AdminProfile() {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  // Editable info form
  const [infoForm, setInfoForm] = useState({ name:"", email:"" });
  const [infoErrs, setInfoErrs] = useState({});

  // Password form
  const [pwForm, setPwForm] = useState({ current_password:"", new_password:"", confirm:"" });
  const [pwErrs, setPwErrs] = useState({});

  const notify = (msg, type="success") => setToast({ msg, type });

  /* ── Load profile ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      /**
       * GET /api/admin/profile
       * Response: { profile: { id, name, email, role, status, created_at } }
       */
      const res = await api("GET", "/admin/profile");
      setProfile(res.profile);
      setInfoForm({ name: res.profile.name, email: res.profile.email });
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Save info ── */
  const handleInfoSave = async e => {
    e.preventDefault();
    const errs = {};
    if (!infoForm.name.trim())  errs.name  = "Name is required.";
    if (!infoForm.email.trim()) errs.email = "Email is required.";
    setInfoErrs(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      /**
       * PATCH /api/admin/profile
       * Body: { name, email }
       */
      const res = await api("PATCH", "/admin/profile", {
        name:  infoForm.name,
        email: infoForm.email,
      });
      setProfile(p => ({ ...p, ...res.profile }));
      notify("Profile updated.");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Change password ── */
  const handlePasswordSave = async e => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.current_password) errs.current_password = "Current password is required.";
    if (!pwForm.new_password)     errs.new_password     = "New password is required.";
    else if (pwForm.new_password.length < 8) errs.new_password = "Minimum 8 characters.";
    if (pwForm.new_password !== pwForm.confirm) errs.confirm = "Passwords do not match.";
    setPwErrs(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      /**
       * PATCH /api/admin/profile
       * Body: { name, email, current_password, new_password }
       */
      await api("PATCH", "/admin/profile", {
        name:             profile.name,
        email:            profile.email,
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      notify("Password changed successfully.");
      setPwForm({ current_password:"", new_password:"", confirm:"" });
      setPwErrs({});
    } catch (err) {
      // Backend returns field-level errors for wrong current password
      if (err.message.toLowerCase().includes("current password")) {
        setPwErrs({ current_password: err.message });
      } else {
        notify(err.message, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const setInfo = key => e => setInfoForm(f => ({ ...f, [key]: e.target.value }));
  const setPw   = key => e => setPwForm(f => ({ ...f, [key]: e.target.value }));

  /* ── Render ── */
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'Epilogue',sans-serif" }}>
      <Sidebar />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Topbar title="My Profile" subtitle="Manage your admin account details and password" />

        <div style={{ flex:1, padding:"28px", overflowY:"auto" }}>
          {loading ? (
            <div style={{ padding:60, textAlign:"center", color:C.muted, fontSize:14 }}>
              Loading profile…
            </div>
          ) : (
            <div style={{ maxWidth:680, margin:"0 auto" }}>

              {/* ── Profile header card ── */}
              <div style={{
                background:C.card, borderRadius:14, border:`1px solid ${C.border}`,
                padding:"28px 30px", marginBottom:20,
                boxShadow:"0 2px 12px rgba(108,99,255,.06)",
                display:"flex", alignItems:"center", gap:22,
              }}>
                <AvatarLarge name={profile?.name ?? ""} />
                <div>
                  <h2 style={{ margin:0, fontSize:22, fontWeight:800,
                    fontFamily:"'Syne',sans-serif", color:C.text }}>
                    {profile?.name}
                  </h2>
                  <p style={{ margin:"4px 0 0", fontSize:13, color:C.muted }}>
                    {profile?.email}
                  </p>
                  <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                    <span style={{
                      padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                      background:"#FCE4EC", color:"#B71C1C",
                      textTransform:"uppercase", letterSpacing:".05em",
                    }}>Admin</span>
                    <span style={{
                      padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                      background:"#E8F5E9", color:C.green,
                      textTransform:"uppercase", letterSpacing:".05em",
                    }}>{profile?.status ?? "active"}</span>
                    <span style={{ fontSize:12, color:C.muted, display:"flex", alignItems:"center" }}>
                      Member since{" "}
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString("en-PH", { month:"long", year:"numeric" })
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Edit info card ── */}
              <div style={{
                background:C.card, borderRadius:14, border:`1px solid ${C.border}`,
                padding:"24px 28px", marginBottom:20,
                boxShadow:"0 2px 12px rgba(108,99,255,.06)",
              }}>
                <h3 style={{ margin:"0 0 20px", fontSize:16, fontWeight:800,
                  fontFamily:"'Syne',sans-serif", color:C.text }}>
                  Account Information
                </h3>
                <form onSubmit={handleInfoSave} noValidate>
                  <Field label="Full Name" error={infoErrs.name}>
                    <Input value={infoForm.name} onChange={setInfo("name")} placeholder="Your full name" />
                  </Field>
                  <Field label="Email Address" error={infoErrs.email}>
                    <Input type="email" value={infoForm.email} onChange={setInfo("email")} placeholder="admin@school.edu" />
                  </Field>
                  <Field label="Role">
                    <Input value="Administrator" disabled />
                  </Field>
                  <div style={{ display:"flex", justifyContent:"flex-end", marginTop:6 }}>
                    <button type="submit" className="a-btn" disabled={saving} style={{
                      border:"none", background:C.accent, borderRadius:8,
                      padding:"9px 22px", fontSize:13, fontWeight:600,
                      color:"#fff", fontFamily:"'Epilogue',sans-serif",
                    }}>
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>

              {/* ── Change password card ── */}
              <div style={{
                background:C.card, borderRadius:14, border:`1px solid ${C.border}`,
                padding:"24px 28px",
                boxShadow:"0 2px 12px rgba(108,99,255,.06)",
              }}>
                <h3 style={{ margin:"0 0 6px", fontSize:16, fontWeight:800,
                  fontFamily:"'Syne',sans-serif", color:C.text }}>
                  Change Password
                </h3>
                <p style={{ margin:"0 0 20px", fontSize:13, color:C.muted }}>
                  Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
                </p>
                <form onSubmit={handlePasswordSave} noValidate>
                  <Field label="Current Password" error={pwErrs.current_password}>
                    <Input type="password" value={pwForm.current_password}
                      onChange={setPw("current_password")} placeholder="Enter your current password" />
                  </Field>
                  <Field label="New Password" error={pwErrs.new_password}>
                    <Input type="password" value={pwForm.new_password}
                      onChange={setPw("new_password")} placeholder="Min 8 chars · Aa1@" />
                  </Field>
                  <Field label="Confirm New Password" error={pwErrs.confirm}>
                    <Input type="password" value={pwForm.confirm}
                      onChange={setPw("confirm")} placeholder="Repeat new password" />
                  </Field>
                  <div style={{ display:"flex", justifyContent:"flex-end", marginTop:6 }}>
                    <button type="submit" className="a-btn" disabled={saving} style={{
                      border:"none", background:C.accent, borderRadius:8,
                      padding:"9px 22px", fontSize:13, fontWeight:600,
                      color:"#fff", fontFamily:"'Epilogue',sans-serif",
                    }}>
                      {saving ? "Updating…" : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}