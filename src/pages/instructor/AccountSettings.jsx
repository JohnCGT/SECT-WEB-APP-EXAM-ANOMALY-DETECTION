// src/pages/instructor/AccountSettings.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../lib/api";
import Swal from "sweetalert2";
import InstructorAlertBell from "../../components/InstructorAlertBell";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{--blue:#0056b3;--blue-lite:#e8f0fe;--slate:#64748b;--slate-lt:#94a3b8;--card-bg:#ffffff;--card-br:16px;--card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);}
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;}
  .glass-sidebar{background:rgba(255,255,255,0.60);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);}
  .nav-pill{display:flex;flex-direction:column;align-items:center;padding:10px 8px;border-radius:12px;gap:4px;font-size:11px;font-weight:600;text-decoration:none;color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;}
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .topbar{background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:100;height:56px;}
  .avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  .form-field{width:100%;border:1.5px solid rgba(0,86,179,.15);border-radius:10px;padding:9px 14px;font-size:13px;font-family:'DM Sans',sans-serif;color:#1e293b;outline:none;background:#f8faff;transition:border-color .2s,box-shadow .2s;}
  .form-field:focus{border-color:#0056b3;box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .form-field.is-invalid{border-color:#ef4444;}
  .form-label{font-size:12px;font-weight:600;color:#374151;margin-bottom:6px;display:block;}
  .btn-primary-dash{display:inline-flex;align-items:center;gap:8px;background:#0056b3;color:#fff;border:none;border-radius:10px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .15s;}
  .btn-primary-dash:hover{opacity:.87;}
  .btn-primary-dash:disabled{opacity:.6;cursor:not-allowed;}
  .tab-btn{padding:10px 18px;border:none;background:none;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;border-bottom:2px solid transparent;font-family:'DM Sans',sans-serif;transition:color .15s,border-color .15s;}
  .tab-btn.active{color:#0056b3;border-bottom-color:#0056b3;}
  .input-wrap{position:relative;display:flex;align-items:center;}
  .input-wrap .form-field{padding-right:40px;}
  .eye-btn{position:absolute;right:12px;background:none;border:none;cursor:pointer;color:#94a3b8;font-size:15px;padding:0;display:flex;align-items:center;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,.08);}
  .bottom-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bottom-nav-item i{font-size:19px;}
  @media(max-width:991px){.main-content{padding:16px 12px 88px!important;}}
  @media(max-width:767px){.form-row{flex-direction:column!important;}}
`;

const NAV_ITEMS = [
  { to: "/instructor",                  icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/instructor/courses",          icon: "bi-book",                 label: "Courses"   },
  { to: "/instructor/exams",            icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/instructor/students",         icon: "bi-people",               label: "Students"  },
  { to: "/instructor/alerts",           icon: "bi-exclamation-triangle", label: "Alerts"    },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

const checkPasswordStrength = password => {
  const checks = {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { checks, passed, total: 5 };
};

const PasswordStrengthBar = ({ password }) => {
  if (!password) return null;
  const { checks, passed } = checkPasswordStrength(password);
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
          {[{key:"length",label:"8+ chars"},{key:"upper",label:"Uppercase"},{key:"lower",label:"Lowercase"},{key:"number",label:"Number"},{key:"special",label:"Special"}].map(({key,label}) => (
            <span key={key} style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 6, background: checks[key] ? "#dcfce7" : "#f1f5f9", color: checks[key] ? "#15803d" : "#94a3b8" }}>
              {checks[key] ? "✓" : "✗"} {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const AccountSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user,       setUser]       = useState(null);
  const [activeTab,  setActiveTab]  = useState("general");
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPw,   setSavingPw]   = useState(false);

  const [infoForm, setInfoForm] = useState({ name: "", email: "" });
  const [pwForm,        setPwForm]        = useState({ current_password: "", password: "", password_confirmation: "" });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw,     setShowNewPw]     = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    API.get("/me").then(r => {
      const u = r.data.user;
      setUser(u);
      setInfoForm({ name: u.name || "", email: u.email || "" });
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/instructor/login");
  };

  const handleSaveInfo = async e => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await API.put("/profile", {
        name:  infoForm.name.trim(),
        email: infoForm.email,
      });
      const updated = res.data.user;
      setUser(updated);
      setInfoForm({ name: updated.name, email: updated.email });
      Swal.fire({ icon: "success", title: "Saved!", timer: 1400, showConfirmButton: false });
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) Swal.fire("Validation Error", Object.values(errors).flat().join("\n"), "warning");
      else Swal.fire("Error", err.response?.data?.message || "Failed to save changes.", "error");
    } finally { setSavingInfo(false); }
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    if (pwForm.password !== pwForm.password_confirmation) {
      Swal.fire("Mismatch", "New passwords do not match.", "warning"); return;
    }
    const { passed } = checkPasswordStrength(pwForm.password);
    if (passed < 5) {
      Swal.fire("Weak Password", "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.", "warning"); return;
    }
    setSavingPw(true);
    try {
      await API.put("/profile/password", {
        current_password: pwForm.current_password,
        password: pwForm.password,
        password_confirmation: pwForm.password_confirmation,
      });
      Swal.fire({ icon: "success", title: "Password updated!", timer: 1400, showConfirmButton: false });
      setPwForm({ current_password: "", password: "", password_confirmation: "" });
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.current_password) Swal.fire("Error", errors.current_password[0], "error");
      else Swal.fire("Error", err.response?.data?.message || "Failed to update password.", "error");
    } finally { setSavingPw(false); }
  };

  const isActive = to => to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);
  const initial  = user?.name?.charAt(0)?.toUpperCase() ?? "I";
  const firstName = user?.name?.split(" ")[0] ?? "Instructor";

  const TABS = [
    { key: "general",  label: "General",  icon: "bi-person"     },
    { key: "security", label: "Security", icon: "bi-shield-lock" },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* Topbar */}
        <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>SECT Instructor</span>
          <div className="ms-auto d-flex align-items-center gap-2">
            <InstructorAlertBell />
            <div className="dropdown">
              <button className="d-flex align-items-center gap-2 dropdown-toggle" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }} data-bs-toggle="dropdown">
                <div className="avatar">{initial}</div>
                <span className="d-none d-sm-inline" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{firstName}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
                <li><Link className="dropdown-item" to="/instructor/account-settings"><i className="bi bi-gear me-2"></i>Account Settings</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile"><i className="bi bi-person me-2"></i>Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout} style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}><i className="bi bi-box-arrow-right me-2"></i>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-stretch">
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
          <main className="main-content" style={{ flex: 1, padding: "24px 20px", paddingBottom: 100, minWidth: 0 }}>

            <div className="fade-up mb-4">
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>⚙️ Account Settings</h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Manage your profile and security</p>
            </div>

            <div className="dash-card fade-up" style={{ maxWidth: 720 }}>
              {/* Tab bar */}
              <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "0 8px" }}>
                {TABS.map(({ key, label, icon }) => (
                  <button key={key} className={`tab-btn ${activeTab === key ? "active" : ""}`} onClick={() => setActiveTab(key)}>
                    <i className={`bi ${icon} me-2`}></i>{label}
                  </button>
                ))}
              </div>

              <div style={{ padding: "24px" }}>

                {/* ── General ── */}
                {activeTab === "general" && (
                  <form onSubmit={handleSaveInfo}>
                    <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Personal Information</h3>
                    <div className="form-row" style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Full Name</label>
                        <input className="form-field" type="text" placeholder="Enter your full name" value={infoForm.name}
                          onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Email Address</label>
                        <input className="form-field" type="email" placeholder="your@email.com" value={infoForm.email}
                          onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))} required />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary-dash" disabled={savingInfo}>
                      {savingInfo ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }}></span> Saving…</> : <><i className="bi bi-check-lg"></i> Save Changes</>}
                    </button>
                  </form>
                )}

                {/* ── Security ── */}
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

                    <form onSubmit={handleChangePassword}>
                      <div style={{ marginBottom: 16 }}>
                        <label className="form-label">Current Password</label>
                        <div className="input-wrap">
                          <input className="form-field" type={showCurrentPw ? "text" : "password"} placeholder="Enter your current password"
                            value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} required />
                          <button type="button" className="eye-btn" onClick={() => setShowCurrentPw(v => !v)}>
                            <i className={`bi bi-eye${showCurrentPw ? "-slash" : ""}`}></i>
                          </button>
                        </div>
                      </div>

                      <div className="form-row" style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">New Password</label>
                          <div className="input-wrap">
                            <input className="form-field" type={showNewPw ? "text" : "password"} placeholder="Min 8 chars · upper · lower · number · special"
                              value={pwForm.password} onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))} required />
                            <button type="button" className="eye-btn" onClick={() => setShowNewPw(v => !v)}>
                              <i className={`bi bi-eye${showNewPw ? "-slash" : ""}`}></i>
                            </button>
                          </div>
                          <PasswordStrengthBar password={pwForm.password} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">Confirm New Password</label>
                          <div className="input-wrap">
                            <input className="form-field" type={showConfirmPw ? "text" : "password"} placeholder="Repeat new password"
                              value={pwForm.password_confirmation} onChange={e => setPwForm(f => ({ ...f, password_confirmation: e.target.value }))} required />
                            <button type="button" className="eye-btn" onClick={() => setShowConfirmPw(v => !v)}>
                              <i className={`bi bi-eye${showConfirmPw ? "-slash" : ""}`}></i>
                            </button>
                          </div>
                          {pwForm.password_confirmation && (
                            <p style={{ margin: "6px 0 0", fontSize: 11, fontWeight: 600, color: pwForm.password === pwForm.password_confirmation ? "#22c55e" : "#ef4444" }}>
                              <i className={`bi bi-${pwForm.password === pwForm.password_confirmation ? "check" : "x"}-circle me-1`}></i>
                              {pwForm.password === pwForm.password_confirmation ? "Passwords match" : "Passwords do not match"}
                            </p>
                          )}
                        </div>
                      </div>

                      <button type="submit" className="btn-primary-dash" disabled={savingPw}>
                        {savingPw ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }}></span> Updating…</> : <><i className="bi bi-lock"></i> Update Password</>}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Bottom Nav */}
        <nav className="bottom-nav d-lg-none">
          {NAV_ITEMS.slice(0,5).map(({ to, icon, label }) => (
            <Link key={to} to={to} className="bottom-nav-item"
              style={{ color: isActive(to) ? "#0056b3" : "#94a3b8", borderTop: isActive(to) ? "2px solid #0056b3" : "2px solid transparent" }}>
              <i className={`bi ${icon}`}></i>{label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default AccountSettings;