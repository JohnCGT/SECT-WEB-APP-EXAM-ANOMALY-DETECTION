import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { fetchCsrfToken } from "../../api";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{
    --blue:#0056b3;--blue-mid:#1a6ed8;--blue-lite:#e8f0fe;
    --slate:#64748b;--slate-lt:#94a3b8;
    --card-bg:#ffffff;--card-br:16px;
    --card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);
  }
  .topbar{background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:100;height:56px;}
  .glass-sidebar{background:rgba(255,255,255,0.60);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);}
  .nav-pill{display:flex;flex-direction:column;align-items:center;padding:10px 8px;border-radius:12px;gap:4px;font-size:11px;font-weight:600;text-decoration:none;color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;}
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;overflow:hidden;}
  .avatar img{width:100%;height:100%;object-fit:cover;}
  .avatar-lg{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#0056b3,#1a6ed8);color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;flex-shrink:0;box-shadow:0 4px 16px rgba(0,86,179,.30);overflow:hidden;position:relative;}
  .avatar-lg img{width:100%;height:100%;object-fit:cover;}
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;}
  .settings-tab{padding:8px 16px;border-radius:99px;border:none;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:var(--slate-lt);transition:background .15s,color .15s;font-family:'DM Sans',sans-serif;white-space:nowrap;display:flex;align-items:center;gap:6px;}
  .settings-tab.active{background:var(--blue);color:#fff;box-shadow:0 4px 12px rgba(0,86,179,.25);}
  .settings-tab:hover:not(.active){background:#f1f5f9;color:var(--slate);}
  .field-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px;}
  .field-input{border:1px solid #e2e8f0;border-radius:10px;padding:9px 14px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;width:100%;background:#fafbff;transition:border-color .2s,box-shadow .2s;}
  .field-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .field-input.error{border-color:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.10);}
  .field-input.success{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.10);}
  .field-select{border:1px solid #e2e8f0;border-radius:10px;padding:9px 14px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;width:100%;background:#fafbff;cursor:pointer;transition:border-color .2s,box-shadow .2s;}
  .field-select:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .save-btn{background:var(--blue);color:#fff;border:none;border-radius:10px;padding:10px 24px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .15s;display:inline-flex;align-items:center;gap:6px;}
  .save-btn:hover:not(:disabled){opacity:.85;}
  .save-btn:disabled{opacity:.55;cursor:not-allowed;}
  .toggle-row{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid #f8faff;}
  .toggle-row:last-child{border-bottom:none;}
  .section-title{font-size:13px;font-weight:700;color:#0f172a;margin:0 0 16px;}
  .section-sub{font-size:12px;color:#94a3b8;margin:2px 0 0;}
  .err-msg{font-size:11px;color:#ef4444;margin-top:4px;display:flex;align-items:center;gap:4px;}
  .pw-hint{font-size:11px;margin-top:4px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .35s ease both;}
  .fade-up:nth-child(1){animation-delay:.05s}.fade-up:nth-child(2){animation-delay:.10s}.fade-up:nth-child(3){animation-delay:.15s}
  .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bottom-nav a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;color:#94a3b8;transition:color .2s;border-top:2px solid transparent;}
  .bottom-nav a.active{color:#0056b3;border-top-color:#0056b3;}
  .bottom-nav a i{font-size:19px;}
  .switch{position:relative;display:inline-block;width:40px;height:22px;flex-shrink:0;}
  .switch input{opacity:0;width:0;height:0;}
  .switch-slider{position:absolute;cursor:pointer;inset:0;background:#e2e8f0;border-radius:99px;transition:.3s;}
  .switch-slider::before{content:"";position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.3s;box-shadow:0 1px 4px rgba(0,0,0,.15);}
  input:checked+.switch-slider{background:var(--blue);}
  input:checked+.switch-slider::before{transform:translateX(18px);}
  .toast-wrap{position:fixed;top:68px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;}
  .toast{background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.12);padding:12px 16px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;min-width:260px;pointer-events:all;animation:slideIn .25s ease;}
  .toast.success{border-left:4px solid #22c55e;color:#166534;}
  .toast.error{border-left:4px solid #ef4444;color:#991b1b;}
  @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
  .photo-overlay{position:absolute;inset:0;background:rgba(0,0,0,.45);border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;cursor:pointer;}
  .avatar-lg:hover .photo-overlay{opacity:1;}
  .coming-soon-badge{display:inline-flex;align-items:center;gap:4px;background:#f1f5f9;color:#94a3b8;border-radius:99px;padding:3px 10px;font-size:11px;font-weight:600;}
  .empty-history{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;gap:8px;text-align:center;}
`;

const NAV_ITEMS = [
  { to:"/student",                  icon:"bi-speedometer2",    label:"Home"    },
  { to:"/student/subjects",         icon:"bi-journal-bookmark",label:"Subjects"},
  { to:"/student/exams",            icon:"bi-pencil-square",   label:"Exams"   },
  { to:"/student/grades",           icon:"bi-graph-up-arrow",  label:"Grades"  },
  { to:"/student/account-settings", icon:"bi-gear",            label:"Settings"},
];

const SETTINGS_TABS = [
  { key:"general",       label:"General",       icon:"bi-person"      },
  { key:"security",      label:"Security",      icon:"bi-shield-lock" },
  { key:"notifications", label:"Notifications", icon:"bi-bell"        },
  { key:"preferences",   label:"Learning",      icon:"bi-book"        },
];

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))            score++;
  if (/[a-z]/.test(pw))            score++;
  if (/[0-9]/.test(pw))            score++;
  if (/[@$!%*#?&]/.test(pw))       score++;
  const map = [
    { label:"",           color:"#e2e8f0" },
    { label:"Very weak",  color:"#ef4444" },
    { label:"Weak",       color:"#f97316" },
    { label:"Fair",       color:"#eab308" },
    { label:"Strong",     color:"#22c55e" },
    { label:"Very strong",color:"#0056b3" },
  ];
  return { score, ...map[score] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
const BottomNav = ({ active }) => (
  <nav className="bottom-nav d-lg-none">
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={active === label ? "active" : ""}>
        <i className={`bi ${icon}`}></i>{label}
      </Link>
    ))}
  </nav>
);

const Topbar = ({ user, onLogout }) => {
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "S";
  const firstName = user?.name?.split(" ")[0] ?? "Student";
  return (
    <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:15, color:"#0056b3", letterSpacing:"-.3px", flexShrink:0 }}>
        SECT Portal
      </span>
      <div className="ms-auto d-flex align-items-center gap-2">
        <button style={{ background:"transparent", border:"none", position:"relative", padding:"4px 8px", cursor:"pointer" }}>
          <i className="bi bi-bell" style={{ fontSize:18, color:"#64748b" }}></i>
          <span style={{ position:"absolute", top:2, right:6, width:7, height:7, background:"#ef4444", borderRadius:"50%", border:"1.5px solid #f0f4fb" }}></span>
        </button>
        <div className="dropdown">
          <button className="d-flex align-items-center gap-2 dropdown-toggle"
            style={{ background:"transparent", border:"none", cursor:"pointer", padding:"4px 6px", borderRadius:10 }}
            data-bs-toggle="dropdown">
            <div className="avatar">
              {user?.profile_photo_url
                ? <img src={user.profile_photo_url} alt="avatar" />
                : initial}
            </div>
            <span className="d-none d-sm-inline" style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{firstName}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius:12, fontSize:13 }}>
            <li><Link className="dropdown-item" to="/student/profile">My Profile</Link></li>
            <li><hr className="dropdown-divider"/></li>
            <li>
              <button className="dropdown-item text-danger" onClick={onLogout}
                style={{ border:"none", background:"none", width:"100%", textAlign:"left" }}>Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ active }) => (
  <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
    style={{ width:80, minHeight:"calc(100vh - 56px)", position:"sticky", top:56, alignSelf:"flex-start", flexShrink:0 }}>
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={`nav-pill${active === label ? " active" : ""}`}>
        <i className={`bi ${icon}`}></i>{label}
      </Link>
    ))}
  </nav>
);

const Toggle = ({ checked, onChange, disabled }) => (
  <label className="switch">
    <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled}/>
    <span className="switch-slider" style={disabled ? { opacity:.45, cursor:"not-allowed" } : {}}/>
  </label>
);

const Field = ({ label, error, children }) => (
  <div style={{ marginBottom:16 }}>
    <p className="field-label">{label}</p>
    {children}
    {error && <p className="err-msg"><i className="bi bi-exclamation-circle-fill" style={{ fontSize:10 }}></i>{error}</p>}
  </div>
);

const ToastList = ({ toasts }) => (
  <div className="toast-wrap">
    {toasts.map(t => (
      <div key={t.id} className={`toast ${t.type}`}>
        <i className={`bi ${t.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`}></i>
        {t.message}
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const StudentAccountSettings = () => {
  const navigate   = useNavigate();
  const photoInput = useRef(null);

  const [user,      setUser]      = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [toasts,    setToasts]    = useState([]);

  // ── General form ──────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    firstName:"", lastName:"", email:"", phone:"", course:"", year_level:""
  });
  const [formErrors, setFormErrors] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);

  // ── Photo ─────────────────────────────────────────────────────────────────
  const [photoPreview,   setPhotoPreview]   = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ── Password form ─────────────────────────────────────────────────────────
  const [pw, setPw]         = useState({ current:"", next:"", confirm:"" });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);
  const strength = getPasswordStrength(pw.next);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    assignments:false, exams:false, grades:false, announcements:false, frequency:"Real-time"
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  // ── Learning preferences ──────────────────────────────────────────────────
  const [prefs, setPrefs] = useState({
    studyReminders:false, autoDownload:false, studyMode:"Visual", weeklyGoal:10
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Toast helper
  // ─────────────────────────────────────────────────────────────────────────
  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Load user on mount
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    API.get("/me").then(r => {
      const u = r.data.user;
      setUser(u);
      const parts = (u?.name ?? "").split(" ");
      setForm({
        firstName:  parts[0]                ?? "",
        lastName:   parts.slice(1).join(" ") ?? "",
        email:      u?.email                ?? "",
        phone:      u?.phone                ?? "",
        course:     u?.course               ?? "",
        year_level: u?.year_level           ?? "",
      });
      if (u?.profile_photo_url) setPhotoPreview(u.profile_photo_url);

      // Load saved preferences if they exist on the user object
      if (u?.notification_preferences) {
        setNotifs(prev => ({ ...prev, ...u.notification_preferences }));
      }
      if (u?.learning_preferences) {
        setPrefs(prev => ({ ...prev, ...u.learning_preferences }));
      }
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/");
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "S";

  // ─────────────────────────────────────────────────────────────────────────
  // Validate general form
  // ─────────────────────────────────────────────────────────────────────────
  const validateInfo = () => {
    const e = {};
    if (!form.firstName.trim())                                              e.firstName = "First name is required.";
    if (!form.lastName.trim())                                               e.lastName  = "Last name is required.";
    if (!form.email.trim())                                                  e.email     = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))               e.email     = "Enter a valid email address.";
    if (form.phone && !/^[+\d\s\-()]{7,20}$/.test(form.phone))             e.phone     = "Enter a valid phone number.";
    return e;
  };

  const handleSaveInfo = async () => {
    const e = validateInfo();
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setFormErrors({});
    setSavingInfo(true);
    try {
      await fetchCsrfToken();
      const res = await API.put("/profile", {
        first_name: form.firstName,
        last_name:  form.lastName,
        email:      form.email,
        phone:      form.phone,
        course:     form.course,
        year_level: form.year_level,
      });
      setUser(res.data.user);
      addToast("Profile updated successfully!");
    } catch (err) {
      const serverErrors = err.response?.data?.errors ?? {};
      const mapped = {};
      if (serverErrors.first_name) mapped.firstName = serverErrors.first_name[0];
      if (serverErrors.last_name)  mapped.lastName  = serverErrors.last_name[0];
      if (serverErrors.email)      mapped.email     = serverErrors.email[0];
      if (serverErrors.phone)      mapped.phone     = serverErrors.phone[0];
      setFormErrors(mapped);
      addToast(err.response?.data?.message ?? "Failed to save profile.", "error");
    } finally {
      setSavingInfo(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Photo upload
  // ─────────────────────────────────────────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { addToast("Photo must be under 2 MB.", "error"); return; }

    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploadingPhoto(true);
    try {
      await fetchCsrfToken();
      const fd = new FormData();
      fd.append("photo", file);
      const res = await API.post("/profile/photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotoPreview(res.data.profile_photo_url);
      setUser(u => ({ ...u, profile_photo_url: res.data.profile_photo_url }));
      addToast("Photo updated!");
    } catch {
      addToast("Photo upload failed.", "error");
      setPhotoPreview(user?.profile_photo_url ?? null);
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Password
  // ─────────────────────────────────────────────────────────────────────────
  const validatePassword = () => {
    const e = {};
    if (!pw.current)                      e.current = "Current password is required.";
    if (!pw.next)                         e.next    = "New password is required.";
    else if (pw.next.length < 8)          e.next    = "Password must be at least 8 characters.";
    else if (!/[A-Z]/.test(pw.next))      e.next    = "Must include at least one uppercase letter.";
    else if (!/[a-z]/.test(pw.next))      e.next    = "Must include at least one lowercase letter.";
    else if (!/[0-9]/.test(pw.next))      e.next    = "Must include at least one number.";
    else if (!/[@$!%*#?&]/.test(pw.next)) e.next    = "Must include at least one special character (@$!%*#?&).";
    if (!pw.confirm)                      e.confirm = "Please confirm your new password.";
    else if (pw.next !== pw.confirm)      e.confirm = "Passwords do not match.";
    return e;
  };

  const handleChangePassword = async () => {
    const e = validatePassword();
    if (Object.keys(e).length) { setPwErrors(e); return; }
    setPwErrors({});
    setSavingPw(true);
    try {
      await fetchCsrfToken();
      await API.put("/profile/password", {
        current_password:      pw.current,
        password:              pw.next,
        password_confirmation: pw.confirm,
      });
      setPw({ current:"", next:"", confirm:"" });
      addToast("Password changed successfully!");
    } catch (err) {
      const serverErrors = err.response?.data?.errors ?? {};
      const mapped = {};
      if (serverErrors.current_password) mapped.current = serverErrors.current_password[0];
      if (serverErrors.password)         mapped.next    = serverErrors.password[0];
      setPwErrors(mapped);
      addToast(err.response?.data?.message ?? "Failed to change password.", "error");
    } finally {
      setSavingPw(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Notifications save (ready for backend wire-up)
  // ─────────────────────────────────────────────────────────────────────────
  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    try {
      await fetchCsrfToken();
      await API.put("/profile/preferences", { notification_preferences: notifs });
      addToast("Notification settings saved!");
    } catch {
      addToast("Failed to save notification settings.", "error");
    } finally {
      setSavingNotifs(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Learning prefs save (ready for backend wire-up)
  // ─────────────────────────────────────────────────────────────────────────
  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      await fetchCsrfToken();
      await API.put("/profile/preferences", { learning_preferences: prefs });
      addToast("Preferences saved!");
    } catch {
      addToast("Failed to save preferences.", "error");
    } finally {
      setSavingPrefs(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <ToastList toasts={toasts}/>

      <div style={{ background:"#f0f4fb", minHeight:"100vh" }}>
        <Topbar user={user} onLogout={handleLogout}/>

        <div className="d-flex align-items-stretch">
          <Sidebar active="Settings"/>

          <main style={{ flex:1, padding:"24px 20px", paddingBottom:100, minWidth:0 }}>

            {/* Page header */}
            <div style={{ marginBottom:24 }}>
              <p style={{ margin:0, fontSize:12, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>Account</p>
              <h1 style={{ margin:"4px 0 4px", fontSize:24, fontWeight:700, color:"#0f172a", letterSpacing:"-.4px" }}>Settings</h1>
              <p style={{ margin:0, fontSize:13, color:"#64748b" }}>Manage your profile, security and preferences</p>
            </div>

            {/* Profile identity card */}
            <div className="dash-card fade-up" style={{ padding:20, marginBottom:20, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div className="avatar-lg" onClick={() => photoInput.current?.click()} title="Change profile photo">
                {photoPreview ? <img src={photoPreview} alt="Profile"/> : initial}
                <div className="photo-overlay">
                  {uploadingPhoto
                    ? <span className="spinner-border spinner-border-sm text-white" role="status"/>
                    : <i className="bi bi-camera-fill" style={{ color:"#fff", fontSize:16 }}></i>}
                </div>
              </div>

              <input
                ref={photoInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display:"none" }}
                onChange={handlePhotoChange}
              />

              <div style={{ flex:1, minWidth:0 }}>
                <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>{user?.name ?? "—"}</h2>
                <p style={{ margin:"2px 0 0", fontSize:13, color:"#64748b" }}>{user?.email ?? "—"}</p>
                <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                  {[user?.course, user?.year_level, user?.student_id].filter(Boolean).map(b => (
                    <span key={b} style={{ background:"#e8f0fe", color:"#0056b3", borderRadius:99, padding:"2px 10px", fontSize:11, fontWeight:600 }}>{b}</span>
                  ))}
                </div>
              </div>

              <button
                style={{ background:"transparent", border:"1px solid #e2e8f0", borderRadius:10, padding:"7px 14px", fontSize:12, fontWeight:600, color:"#64748b", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}
                onClick={() => photoInput.current?.click()}
                disabled={uploadingPhoto}
              >
                <i className="bi bi-camera me-2"></i>
                {uploadingPhoto ? "Uploading…" : "Change Photo"}
              </button>
            </div>

            {/* Tab bar */}
            <div style={{ display:"flex", gap:6, marginBottom:20, overflowX:"auto", paddingBottom:2 }}>
              {SETTINGS_TABS.map(({ key, label, icon }) => (
                <button key={key} className={`settings-tab${activeTab === key ? " active" : ""}`}
                  onClick={() => setActiveTab(key)}>
                  <i className={`bi ${icon}`}></i>{label}
                </button>
              ))}
            </div>

            {/* ── GENERAL ────────────────────────────────────────────────── */}
            {activeTab === "general" && (
              <div className="dash-card fade-up" style={{ padding:24 }}>
                <h3 className="section-title">Personal Information</h3>
                <div style={{ display:"grid", gap:0, gridTemplateColumns:"1fr 1fr" }} className="gap-col">
                  <style>{`.gap-col{gap:0 16px;}@media(max-width:600px){.gap-col{grid-template-columns:1fr;}}`}</style>

                  <Field label="First Name" error={formErrors.firstName}>
                    <input
                      className={`field-input${formErrors.firstName ? " error" : form.firstName ? " success" : ""}`}
                      value={form.firstName}
                      onChange={e => { setForm(f => ({ ...f, firstName:e.target.value })); setFormErrors(x => ({ ...x, firstName:null })); }}
                    />
                  </Field>

                  <Field label="Last Name" error={formErrors.lastName}>
                    <input
                      className={`field-input${formErrors.lastName ? " error" : form.lastName ? " success" : ""}`}
                      value={form.lastName}
                      onChange={e => { setForm(f => ({ ...f, lastName:e.target.value })); setFormErrors(x => ({ ...x, lastName:null })); }}
                    />
                  </Field>

                  <Field label="Email Address" error={formErrors.email}>
                    <input
                      className={`field-input${formErrors.email ? " error" : form.email ? " success" : ""}`}
                      type="email"
                      value={form.email}
                      onChange={e => { setForm(f => ({ ...f, email:e.target.value })); setFormErrors(x => ({ ...x, email:null })); }}
                    />
                  </Field>

                  <Field label="Phone Number" error={formErrors.phone}>
                    <input
                      className={`field-input${formErrors.phone ? " error" : ""}`}
                      type="tel"
                      placeholder="+63 912 345 6789"
                      value={form.phone}
                      onChange={e => { setForm(f => ({ ...f, phone:e.target.value })); setFormErrors(x => ({ ...x, phone:null })); }}
                    />
                  </Field>

                  <Field label="Course / Program">
                    <select
                      className="field-select"
                      value={form.course}
                      onChange={e => setForm(f => ({ ...f, course:e.target.value }))}
                    >
                      <option value="">— Select —</option>
                      {["BS Computer Science","BS Information Technology","BS Engineering","BS Mathematics"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>

                  <Field label="Year Level">
                    <select
                      className="field-select"
                      value={form.year_level}
                      onChange={e => setForm(f => ({ ...f, year_level:e.target.value }))}
                    >
                      <option value="">— Select —</option>
                      {["1st Year","2nd Year","3rd Year","4th Year"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>

                <button className="save-btn" onClick={handleSaveInfo} disabled={savingInfo} style={{ marginTop:4 }}>
                  {savingInfo
                    ? <><span className="spinner-border spinner-border-sm me-2" role="status"/>Saving…</>
                    : <><i className="bi bi-check2 me-1"></i>Save Changes</>}
                </button>
              </div>
            )}

            {/* ── SECURITY ───────────────────────────────────────────────── */}
            {activeTab === "security" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                {/* Change password */}
                <div className="dash-card fade-up" style={{ padding:24 }}>
                  <h3 className="section-title">Change Password</h3>

                  <Field label="Current Password" error={pwErrors.current}>
                    <input
                      className={`field-input${pwErrors.current ? " error" : ""}`}
                      type="password"
                      placeholder="Enter current password"
                      value={pw.current}
                      onChange={e => { setPw(p => ({ ...p, current:e.target.value })); setPwErrors(x => ({ ...x, current:null })); }}
                    />
                  </Field>

                  <Field label="New Password" error={pwErrors.next}>
                    <input
                      className={`field-input${pwErrors.next ? " error" : pw.next && strength.score >= 4 ? " success" : ""}`}
                      type="password"
                      placeholder="Min. 8 characters"
                      value={pw.next}
                      onChange={e => { setPw(p => ({ ...p, next:e.target.value })); setPwErrors(x => ({ ...x, next:null })); }}
                    />
                    {pw.next && (
                      <>
                        <div style={{ display:"flex", gap:4, marginTop:6 }}>
                          {[1,2,3,4,5].map(i => (
                            <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i <= strength.score ? strength.color : "#e2e8f0", transition:"background .3s" }}/>
                          ))}
                        </div>
                        <p className="pw-hint" style={{ color:strength.color }}>{strength.label}</p>
                      </>
                    )}
                  </Field>

                  <Field label="Confirm New Password" error={pwErrors.confirm}>
                    <input
                      className={`field-input${pwErrors.confirm ? " error" : pw.confirm && pw.confirm === pw.next ? " success" : ""}`}
                      type="password"
                      placeholder="Repeat new password"
                      value={pw.confirm}
                      onChange={e => { setPw(p => ({ ...p, confirm:e.target.value })); setPwErrors(x => ({ ...x, confirm:null })); }}
                    />
                  </Field>

                  <button className="save-btn" onClick={handleChangePassword} disabled={savingPw}>
                    {savingPw
                      ? <><span className="spinner-border spinner-border-sm me-2" role="status"/>Updating…</>
                      : <><i className="bi bi-shield-lock me-1"></i>Update Password</>}
                  </button>
                </div>

                {/* 2FA — clearly marked as coming soon, no fake toggle */}
                <div className="dash-card fade-up" style={{ padding:24 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                    <h3 className="section-title" style={{ margin:0 }}>Two-Factor Authentication</h3>
                    <span className="coming-soon-badge"><i className="bi bi-hourglass-split" style={{ fontSize:10 }}></i>Coming soon</span>
                  </div>
                  <div style={{ background:"#f8faff", borderRadius:12, padding:"16px 18px", display:"flex", alignItems:"flex-start", gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"#e8f0fe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                      <i className="bi bi-shield-lock" style={{ color:"#0056b3", fontSize:16 }}></i>
                    </div>
                    <div>
                      <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:600, color:"#1e293b" }}>Extra layer of protection</p>
                      <p style={{ margin:0, fontSize:12, color:"#64748b", lineHeight:1.6 }}>
                        Two-factor authentication adds a second verification step when you sign in.
                        This feature will be available in a future update.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Login history — empty state until backend provides data */}
                <div className="dash-card fade-up" style={{ padding:24 }}>
                  <h3 className="section-title">Login History</h3>
                  {user?.login_history?.length > 0
                    ? (
                      <div style={{ overflowX:"auto" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                          <thead>
                            <tr style={{ borderBottom:"1px solid #f1f5f9" }}>
                              {["Date & Time","IP Address","Device","Location"].map((h,i) => (
                                <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".04em", whiteSpace:"nowrap" }}
                                  className={h==="IP Address"?"d-none d-sm-table-cell":h==="Location"?"d-none d-md-table-cell":""}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {user.login_history.map((r, i) => (
                              <tr key={i} style={{ borderBottom:"1px solid #f8faff" }}>
                                <td style={{ padding:"10px 12px", color:"#1e293b", fontWeight:500 }}>{r.date}</td>
                                <td style={{ padding:"10px 12px", color:"#64748b", fontFamily:"'DM Mono',monospace", fontSize:12 }} className="d-none d-sm-table-cell">{r.ip_address}</td>
                                <td style={{ padding:"10px 12px", color:"#64748b" }}>{r.device}</td>
                                <td style={{ padding:"10px 12px", color:"#64748b" }} className="d-none d-md-table-cell">{r.location ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                    : (
                      <div className="empty-history">
                        <div style={{ width:44, height:44, borderRadius:12, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <i className="bi bi-clock-history" style={{ color:"#94a3b8", fontSize:20 }}></i>
                        </div>
                        <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#64748b" }}>No login records yet</p>
                        <p style={{ margin:0, fontSize:12, color:"#94a3b8" }}>Sign-in history will appear here once login tracking is enabled</p>
                      </div>
                    )
                  }
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS ──────────────────────────────────────────── */}
            {activeTab === "notifications" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div className="dash-card fade-up" style={{ padding:24 }}>
                  <h3 className="section-title">Email Notifications</h3>
                  <p style={{ margin:"-8px 0 16px", fontSize:12, color:"#94a3b8" }}>
                    Choose which events you'd like to be notified about.
                  </p>
                  {[
                    { key:"assignments",   label:"Assignment Deadlines",  sub:"Get notified when assignments are due"     },
                    { key:"exams",         label:"Exam Schedules",         sub:"Receive reminders before exams start"      },
                    { key:"grades",        label:"Grades Posted",          sub:"Get notified when new grades are released" },
                    { key:"announcements", label:"System Announcements",   sub:"Receive important academic updates"        },
                  ].map(n => (
                    <div key={n.key} className="toggle-row">
                      <div>
                        <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#1e293b" }}>{n.label}</p>
                        <p className="section-sub">{n.sub}</p>
                      </div>
                      <Toggle
                        checked={notifs[n.key]}
                        onChange={() => setNotifs(v => ({ ...v, [n.key]:!v[n.key] }))}
                      />
                    </div>
                  ))}

                  <div style={{ marginTop:20 }}>
                    <Field label="Alert Frequency">
                      <select
                        className="field-select"
                        style={{ maxWidth:280 }}
                        value={notifs.frequency}
                        onChange={e => setNotifs(v => ({ ...v, frequency:e.target.value }))}
                      >
                        <option>Real-time</option>
                        <option>Hourly Digest</option>
                        <option>Daily Summary</option>
                      </select>
                    </Field>
                  </div>

                  <button className="save-btn" onClick={handleSaveNotifs} disabled={savingNotifs} style={{ marginTop:4 }}>
                    {savingNotifs
                      ? <><span className="spinner-border spinner-border-sm me-2" role="status"/>Saving…</>
                      : <><i className="bi bi-check2 me-1"></i>Save Notification Settings</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── LEARNING PREFERENCES ───────────────────────────────────── */}
            {activeTab === "preferences" && (
              <div className="dash-card fade-up" style={{ padding:24 }}>
                <h3 className="section-title">Learning Preferences</h3>
                <p style={{ margin:"-8px 0 20px", fontSize:13, color:"#64748b" }}>
                  Customize how you receive materials and study reminders.
                </p>

                {[
                  { key:"studyReminders", label:"Enable Study Reminders",    sub:"Get periodic reminders to review lessons"   },
                  { key:"autoDownload",   label:"Auto-Download Course Files", sub:"Automatically save materials when uploaded" },
                ].map(n => (
                  <div key={n.key} className="toggle-row">
                    <div>
                      <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#1e293b" }}>{n.label}</p>
                      <p className="section-sub">{n.sub}</p>
                    </div>
                    <Toggle
                      checked={prefs[n.key]}
                      onChange={() => setPrefs(v => ({ ...v, [n.key]:!v[n.key] }))}
                    />
                  </div>
                ))}

                <div style={{ marginTop:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }} className="gap-col">
                  <Field label="Preferred Study Mode">
                    <select
                      className="field-select"
                      value={prefs.studyMode}
                      onChange={e => setPrefs(v => ({ ...v, studyMode:e.target.value }))}
                    >
                      <option>Visual</option>
                      <option>Reading/Writing</option>
                      <option>Hands-on</option>
                      <option>Mixed</option>
                    </select>
                  </Field>
                  <Field label="Weekly Study Goal (hours)">
                    <input
                      className="field-input"
                      type="number"
                      value={prefs.weeklyGoal}
                      min={1} max={80}
                      onChange={e => setPrefs(v => ({ ...v, weeklyGoal:Number(e.target.value) }))}
                    />
                  </Field>
                </div>

                <button className="save-btn" onClick={handleSavePrefs} disabled={savingPrefs} style={{ marginTop:8 }}>
                  {savingPrefs
                    ? <><span className="spinner-border spinner-border-sm me-2" role="status"/>Saving…</>
                    : <><i className="bi bi-check2 me-1"></i>Save Preferences</>}
                </button>
              </div>
            )}

          </main>
        </div>

        <BottomNav active="Settings"/>
      </div>
    </>
  );
};

export default StudentAccountSettings;