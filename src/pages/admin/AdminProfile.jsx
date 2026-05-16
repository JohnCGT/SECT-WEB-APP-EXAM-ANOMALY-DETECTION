// src/pages/admin/AdminProfile.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

/* ─── Password strength ──────────────────────────────────────────────── */
function checkStrength(pw) {
  const checks = {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  return { checks, passed: Object.values(checks).filter(Boolean).length };
}

function StrengthBar({ password }) {
  if (!password) return null;
  const { checks, passed } = checkStrength(password);
  const pct   = (passed / 5) * 100;
  const color = passed <= 2 ? "#ef4444" : passed <= 3 ? "#f59e0b" : passed <= 4 ? "#3b82f6" : "#22c55e";
  const label = passed <= 2 ? "Weak" : passed <= 3 ? "Fair" : passed <= 4 ? "Good" : "Strong";
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 5, borderRadius: 99, background: "#f1f5f9", overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .3s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {[
            { key: "length",  label: "8+ chars"  },
            { key: "upper",   label: "Uppercase"  },
            { key: "lower",   label: "Lowercase"  },
            { key: "number",  label: "Number"     },
            { key: "special", label: "Special"    },
          ].map(({ key, label }) => (
            <span key={key} style={{
              fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 6,
              background: checks[key] ? "#dcfce7" : "#f1f5f9",
              color:      checks[key] ? "#15803d" : "#94a3b8",
            }}>
              {checks[key] ? "✓" : "✗"} {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── CSS ────────────────────────────────────────────────────────────── */
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{--blue:#0056b3;--blue-mid:#1a6ed8;--blue-lite:#e8f0fe;--slate:#64748b;--slate-lt:#94a3b8;--card-bg:#ffffff;--card-br:16px;--card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);--danger:#dc3545;}
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;}
  .glass-sidebar{background:rgba(255,255,255,0.60);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);}
  .nav-pill{display:flex;flex-direction:column;align-items:center;padding:10px 8px;border-radius:12px;gap:4px;font-size:11px;font-weight:600;text-decoration:none;color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;}
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .topbar{background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:200;height:56px;display:flex;align-items:center;padding:0 20px;gap:12px;}
  .dash-avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  .skeleton{background:linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .dash-btn-primary{background:var(--blue);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:opacity .15s,transform .15s;}
  .dash-btn-primary:hover{opacity:.87;transform:translateY(-1px);}
  .dash-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .badge-pill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;}
  .form-lbl{font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;display:block;}
  .form-ctrl{width:100%;border:1px solid rgba(0,86,179,.15);border-radius:10px;padding:9px 13px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;background:#f8faff;transition:border-color .2s,box-shadow .2s;}
  .form-ctrl:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .form-ctrl:disabled{opacity:.6;cursor:not-allowed;}
  .form-err{font-size:11px;color:#dc3545;margin-top:4px;}
  .pw-wrap{position:relative;}
  .pw-wrap .form-ctrl{padding-right:42px;}
  .eye-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94a3b8;font-size:15px;padding:0;display:flex;align-items:center;transition:color .2s;}
  .eye-btn:hover{color:var(--blue);}
  .tab-bar{display:flex;border-bottom:1px solid #f1f5f9;padding:0 8px;}
  .tab-btn{padding:12px 18px;border:none;background:none;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;border-bottom:2px solid transparent;font-family:'DM Sans',sans-serif;transition:color .15s,border-color .15s;}
  .tab-btn.active{color:#0056b3;border-bottom-color:#0056b3;}
  .admin-bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bnav-item i{font-size:19px;}
  @media(max-width:767px){
    .hide-mobile{display:none!important;}
    .form-row{flex-direction:column!important;}
  }
`;

const NAV_ITEMS = [
  { to: "/admin",               icon: "bi-speedometer2",      label: "Dashboard" },
  { to: "/admin/users",         icon: "bi-people",            label: "Users"     },
  { to: "/admin/courses",       icon: "bi-book",              label: "Courses"   },
  { to: "/admin/exams",         icon: "bi-file-earmark-text", label: "Exams"     },
  { to: "/admin/activity-logs", icon: "bi-journal-text",      label: "Logs"      },
  { to: "/admin/support",       icon: "bi-headset",           label: "Support"   },
];
const BOTTOM_NAV = [
  { to: "/admin",               icon: "bi-speedometer2",      label: "Home"    },
  { to: "/admin/users",         icon: "bi-people",            label: "Users"   },
  { to: "/admin/courses",       icon: "bi-book",              label: "Courses" },
  { to: "/admin/exams",         icon: "bi-file-earmark-text", label: "Exams"   },
  { to: "/admin/activity-logs", icon: "bi-journal-text",      label: "Logs"    },
];

const BASE = import.meta?.env?.VITE_API_URL ?? "/api";
async function api(method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json", "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" }, credentials: "include" };
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

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3800); return () => clearTimeout(t); }, [onDone]);
  const isErr = type === "error";
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: isErr ? "#fff0f0" : "#f0fdf4", color: isErr ? "#dc3545" : "#16a34a", padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,.14)", border: `1px solid ${isErr ? "#fecaca" : "#bbf7d0"}`, fontFamily: "'DM Sans',sans-serif", animation: "fadeUp .25s ease" }}>
      <i className={`bi ${isErr ? "bi-x-circle-fill" : "bi-check-circle-fill"}`}></i>{msg}
    </div>
  );
}

function AvatarLarge({ name = "" }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{ width: 72, height: 72, borderRadius: "50%", background: `hsl(${hue},55%,88%)`, color: `hsl(${hue},45%,30%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, border: "3px solid rgba(0,86,179,.12)", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function AdminProfile() {
  const location = useLocation();
  const navigate = useNavigate();

  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const [activeTab, setActiveTab] = useState("general");

  const [infoForm, setInfoForm] = useState({ name: "", email: "" });
  const [infoErrs, setInfoErrs] = useState({});

  const [pwForm,        setPwForm]        = useState({ current_password: "", new_password: "", confirm: "" });
  const [pwErrs,        setPwErrs]        = useState({});
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw,     setShowNewPw]     = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const notify   = (msg, type = "success") => setToast({ msg, type });
  const isActive = (to) => to === "/admin" ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = async () => { try { await api("POST", "/logout"); } catch {} navigate("/"); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("GET", "/admin/profile");
      setProfile(res.profile);
      setInfoForm({ name: res.profile.name, email: res.profile.email });
    } catch (err) { notify(err.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInfoSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!infoForm.name.trim())  errs.name  = "Name is required.";
    if (!infoForm.email.trim()) errs.email = "Email is required.";
    setInfoErrs(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const res = await api("PATCH", "/admin/profile", { name: infoForm.name, email: infoForm.email });
      setProfile(p => ({ ...p, ...res.profile }));
      notify("Profile updated successfully.");
    } catch (err) { notify(err.message, "error"); }
    finally { setSaving(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.current_password)                      errs.current_password = "Current password is required.";
    if (!pwForm.new_password)                          errs.new_password     = "New password is required.";
    else if (checkStrength(pwForm.new_password).passed < 5)
                                                       errs.new_password     = "Must include uppercase, lowercase, number, and special character.";
    if (pwForm.new_password !== pwForm.confirm)        errs.confirm          = "Passwords do not match.";
    setPwErrs(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await api("PATCH", "/admin/profile", {
        name:             profile.name,
        email:            profile.email,
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      notify("Password changed successfully.");
      setPwForm({ current_password: "", new_password: "", confirm: "" });
      setPwErrs({});
    } catch (err) {
      if (err.message.toLowerCase().includes("current password")) {
        setPwErrs({ current_password: err.message });
      } else { notify(err.message, "error"); }
    } finally { setSaving(false); }
  };

  const initial   = profile?.name?.charAt(0)?.toUpperCase() ?? "A";
  const firstName = profile?.name?.split(" ")[0] ?? "Admin";

  return (
    <>
      <style>{SHARED_CSS}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* Topbar */}
        <div className="topbar">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>SECT Admin</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <NotificationBell />
            <div className="dropdown">
              <button className="d-flex align-items-center gap-2 dropdown-toggle" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }} data-bs-toggle="dropdown">
                <div className="dash-avatar">{initial}</div>
                <span className="d-none d-sm-inline" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{firstName}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
                <li><Link className="dropdown-item" to="/admin/profile">My Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout} style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>Logout</button></li>
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

            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Admin</p>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px" }}>My Profile</h1>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Manage your account details and password</p>
            </div>

            {loading ? (
              <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 14 }}>
                {[110, 380].map((h, i) => <div key={i} className="skeleton" style={{ height: h, borderRadius: 16 }} />)}
              </div>
            ) : (
              <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 14 }}>

                {/* ── Profile header ── */}
                <div className="dash-card fade-up">
                  <div style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                    <AvatarLarge name={profile?.name ?? ""} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{profile?.name}</h2>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{profile?.email}</p>
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span className="badge-pill" style={{ background: "#fff0f0", color: "#dc3545" }}>Admin</span>
                        <span className="badge-pill" style={{ background: "#f0fdf4", color: "#16a34a" }}>{profile?.status ?? "active"}</span>
                        {profile?.created_at && (
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            Member since {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Tabbed card ── */}
                <div className="dash-card fade-up">
                  <div className="tab-bar">
                    {[
                      { key: "general",  label: "General",  icon: "bi-person-gear"  },
                      { key: "security", label: "Security", icon: "bi-shield-lock"  },
                    ].map(({ key, label, icon }) => (
                      <button key={key} className={`tab-btn ${activeTab === key ? "active" : ""}`} onClick={() => setActiveTab(key)}>
                        <i className={`bi ${icon} me-2`}></i>{label}
                      </button>
                    ))}
                  </div>

                  <div style={{ padding: "24px" }}>

                    {/* General */}
                    {activeTab === "general" && (
                      <form onSubmit={handleInfoSave} noValidate>
                        <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Account Information</h3>
                        <div className="form-row" style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                          <div style={{ flex: 1 }}>
                            <label className="form-lbl">Full Name <span style={{ color: "#dc3545" }}>*</span></label>
                            <input type="text" className="form-ctrl" value={infoForm.name}
                              onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
                            {infoErrs.name && <p className="form-err">{infoErrs.name}</p>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <label className="form-lbl">Email Address <span style={{ color: "#dc3545" }}>*</span></label>
                            <input type="email" className="form-ctrl" value={infoForm.email}
                              onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@school.edu" />
                            {infoErrs.email && <p className="form-err">{infoErrs.email}</p>}
                          </div>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                          <label className="form-lbl">Role</label>
                          <input type="text" className="form-ctrl" value="Administrator" disabled />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button type="submit" className="dash-btn-primary" disabled={saving}>
                            {saving ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: "0.75rem", height: "0.75rem" }} />Saving…</> : <><i className="bi bi-check-lg"></i>Save Changes</>}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Security */}
                    {activeTab === "security" && (
                      <>
                        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Change Password</h3>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 10, background: "#e8f0fe", border: "1px solid rgba(0,86,179,.15)", marginBottom: 20, fontSize: 12, color: "#0056b3" }}>
                          <i className="bi bi-info-circle" style={{ marginTop: 1, flexShrink: 0 }}></i>
                          <div>
                            <strong>Requirements:</strong> Min 8 chars · uppercase · lowercase · number · special character
                            <br /><span style={{ opacity: .8 }}>Example: MyPass@123</span>
                          </div>
                        </div>
                        <form onSubmit={handlePasswordSave} noValidate>
                          {/* Current password */}
                          <div style={{ marginBottom: 16 }}>
                            <label className="form-lbl">Current Password <span style={{ color: "#dc3545" }}>*</span></label>
                            <div className="pw-wrap">
                              <input type={showCurrentPw ? "text" : "password"} className="form-ctrl"
                                value={pwForm.current_password}
                                onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                                placeholder="Enter your current password" />
                              <button type="button" className="eye-btn" onClick={() => setShowCurrentPw(v => !v)} tabIndex={-1}>
                                <i className={`bi bi-eye${showCurrentPw ? "-slash" : ""}`}></i>
                              </button>
                            </div>
                            {pwErrs.current_password && <p className="form-err">{pwErrs.current_password}</p>}
                          </div>

                          {/* New + confirm */}
                          <div className="form-row" style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                            <div style={{ flex: 1 }}>
                              <label className="form-lbl">New Password <span style={{ color: "#dc3545" }}>*</span></label>
                              <div className="pw-wrap">
                                <input type={showNewPw ? "text" : "password"} className="form-ctrl"
                                  value={pwForm.new_password}
                                  onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                                  placeholder="Min 8 chars · Aa1@" />
                                <button type="button" className="eye-btn" onClick={() => setShowNewPw(v => !v)} tabIndex={-1}>
                                  <i className={`bi bi-eye${showNewPw ? "-slash" : ""}`}></i>
                                </button>
                              </div>
                              {pwErrs.new_password && <p className="form-err">{pwErrs.new_password}</p>}
                              <StrengthBar password={pwForm.new_password} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label className="form-lbl">Confirm New Password <span style={{ color: "#dc3545" }}>*</span></label>
                              <div className="pw-wrap">
                                <input type={showConfirmPw ? "text" : "password"} className="form-ctrl"
                                  value={pwForm.confirm}
                                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                                  placeholder="Repeat new password" />
                                <button type="button" className="eye-btn" onClick={() => setShowConfirmPw(v => !v)} tabIndex={-1}>
                                  <i className={`bi bi-eye${showConfirmPw ? "-slash" : ""}`}></i>
                                </button>
                              </div>
                              {pwErrs.confirm && <p className="form-err">{pwErrs.confirm}</p>}
                              {pwForm.confirm && (
                                <p style={{ margin: "6px 0 0", fontSize: 11, fontWeight: 600, color: pwForm.new_password === pwForm.confirm ? "#22c55e" : "#ef4444" }}>
                                  <i className={`bi bi-${pwForm.new_password === pwForm.confirm ? "check" : "x"}-circle me-1`}></i>
                                  {pwForm.new_password === pwForm.confirm ? "Passwords match" : "Passwords do not match"}
                                </p>
                              )}
                            </div>
                          </div>

                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button type="submit" className="dash-btn-primary" disabled={saving}>
                              {saving ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: "0.75rem", height: "0.75rem" }} />Updating…</> : <><i className="bi bi-lock"></i>Update Password</>}
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
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
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}