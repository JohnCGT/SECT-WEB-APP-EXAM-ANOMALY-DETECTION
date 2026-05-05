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
    --card-bg:#ffffff;--card-br:14px;
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
  .avatar-lg{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#0056b3,#1a6ed8);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;flex-shrink:0;box-shadow:0 4px 14px rgba(0,86,179,.28);overflow:hidden;position:relative;cursor:pointer;}
  .avatar-lg img{width:100%;height:100%;object-fit:cover;}
  .photo-overlay{position:absolute;inset:0;background:rgba(0,0,0,.42);border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;}
  .avatar-lg:hover .photo-overlay{opacity:1;}
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;}
  .tab-bar{display:flex;border-bottom:1px solid #e8edf5;margin-bottom:20px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
  .tab-bar::-webkit-scrollbar{display:none;}
  .settings-tab{padding:10px 18px;border:none;border-bottom:2px solid transparent;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:#94a3b8;transition:color .15s,border-color .15s;font-family:'DM Sans',sans-serif;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;margin-bottom:-1px;}
  .settings-tab.active{color:var(--blue);border-bottom-color:var(--blue);}
  .settings-tab:hover:not(.active){color:#64748b;}
  .field-label{font-size:12px;font-weight:600;color:#374151;margin:0 0 5px;display:block;}
  .field-input{border:1px solid #dde3ed;border-radius:8px;padding:8px 12px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;width:100%;background:#fff;transition:border-color .2s,box-shadow .2s;}
  .field-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.09);}
  .field-input.error{border-color:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.09);}
  .field-input.success{border-color:#22c55e;}
  .pw-wrap{position:relative;display:flex;align-items:center;}
  .pw-wrap .field-input{padding-right:40px;}
  .pw-eye{position:absolute;right:10px;background:none;border:none;cursor:pointer;color:#94a3b8;padding:4px;display:flex;align-items:center;transition:color .15s;line-height:1;}
  .pw-eye:hover{color:#64748b;}
  .field-select{border:1px solid #dde3ed;border-radius:8px;padding:8px 12px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;width:100%;background:#fff;cursor:pointer;transition:border-color .2s,box-shadow .2s;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;}
  .field-select:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.09);}
  .course-wrap{position:relative;}
  .course-list{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid #dde3ed;border-radius:8px;box-shadow:0 8px 24px rgba(0,86,179,.10);z-index:200;max-height:180px;overflow-y:auto;}
  .course-item{padding:8px 12px;font-size:13px;color:#1e293b;cursor:pointer;transition:background .1s;}
  .course-item:hover,.course-item.hi{background:#e8f0fe;color:#0056b3;}
  .save-btn{background:var(--blue);color:#fff;border:none;border-radius:8px;padding:9px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .15s;display:inline-flex;align-items:center;gap:6px;}
  .save-btn:hover:not(:disabled){opacity:.85;}
  .save-btn:disabled{opacity:.5;cursor:not-allowed;}
  .err-msg{font-size:11px;color:#ef4444;margin-top:4px;display:flex;align-items:center;gap:4px;}
  .req-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#1d4ed8;line-height:1.65;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .28s ease both;}
  .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bottom-nav a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;color:#94a3b8;transition:color .2s;border-top:2px solid transparent;}
  .bottom-nav a.active{color:#0056b3;border-top-color:#0056b3;}
  .bottom-nav a i{font-size:19px;}
  .toast-wrap{position:fixed;top:68px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;}
  .toast{background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.12);padding:12px 16px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;min-width:230px;pointer-events:all;animation:slideIn .22s ease;}
  .toast.success{border-left:4px solid #22c55e;color:#166534;}
  .toast.error{border-left:4px solid #ef4444;color:#991b1b;}
  @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
  .empty-hist{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 20px;gap:8px;text-align:center;}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  @media(max-width:540px){.two-col{grid-template-columns:1fr;}}
  .page-wrap{max-width:660px;margin:0 auto;}
  .identity-strip{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
  @media(max-width:420px){.change-photo-btn span{display:none;}}
`;

const NAV_ITEMS = [
  { to:"/student",                  icon:"bi-speedometer2",    label:"Home"    },
  { to:"/student/subjects",         icon:"bi-journal-bookmark",label:"Subjects"},
  { to:"/student/exams",            icon:"bi-pencil-square",   label:"Exams"   },
  { to:"/student/grades",           icon:"bi-graph-up-arrow",  label:"Grades"  },
  { to:"/student/account-settings", icon:"bi-gear",            label:"Settings"},
];

const COURSE_LIST = [
  "BS Computer Science","BS Information Technology","BS Information Systems",
  "BS Computer Engineering","BS Electronics Engineering","BS Electrical Engineering",
  "BS Civil Engineering","BS Mechanical Engineering","BS Mathematics",
  "BS Applied Mathematics","BS Statistics","BS Accountancy",
  "BS Business Administration","BS Nursing","BS Psychology",
];

function pwStrength(pw) {
  if (!pw) return { score:0, label:"", color:"" };
  let s = 0;
  if (pw.length >= 8)        s++;
  if (/[A-Z]/.test(pw))      s++;
  if (/[a-z]/.test(pw))      s++;
  if (/[0-9]/.test(pw))      s++;
  if (/[@$!%*#?&]/.test(pw)) s++;
  const m=[{label:"",color:"#e2e8f0"},{label:"Very weak",color:"#ef4444"},{label:"Weak",color:"#f97316"},{label:"Fair",color:"#eab308"},{label:"Strong",color:"#22c55e"},{label:"Very strong",color:"#0056b3"}];
  return { score:s, ...m[s] };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const BottomNav = ({ active }) => (
  <nav className="bottom-nav d-lg-none">
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={active === label ? "active" : ""}><i className={`bi ${icon}`}></i>{label}</Link>
    ))}
  </nav>
);

const Topbar = ({ user, onLogout }) => {
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "S";
  const firstName = user?.name?.split(" ")[0] ?? "Student";
  return (
    <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:15, color:"#0056b3", letterSpacing:"-.3px", flexShrink:0 }}>SECT Portal</span>
      <div className="ms-auto d-flex align-items-center gap-2">
        <button style={{ background:"transparent", border:"none", position:"relative", padding:"4px 8px", cursor:"pointer" }}>
          <i className="bi bi-bell" style={{ fontSize:18, color:"#64748b" }}></i>
          <span style={{ position:"absolute", top:2, right:6, width:7, height:7, background:"#ef4444", borderRadius:"50%", border:"1.5px solid #f0f4fb" }}></span>
        </button>
        <div className="dropdown">
          <button className="d-flex align-items-center gap-2 dropdown-toggle"
            style={{ background:"transparent", border:"none", cursor:"pointer", padding:"4px 6px", borderRadius:10 }}
            data-bs-toggle="dropdown">
            <div className="avatar">{user?.profile_photo_url ? <img src={user.profile_photo_url} alt="avatar"/> : initial}</div>
            <span className="d-none d-sm-inline" style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{firstName}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius:12, fontSize:13 }}>
            <li><Link className="dropdown-item" to="/student/profile">My Profile</Link></li>
            <li><hr className="dropdown-divider"/></li>
            <li><button className="dropdown-item text-danger" onClick={onLogout} style={{ border:"none", background:"none", width:"100%", textAlign:"left" }}>Logout</button></li>
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
      <Link key={to} to={to} className={`nav-pill${active === label ? " active" : ""}`}><i className={`bi ${icon}`}></i>{label}</Link>
    ))}
  </nav>
);

const Field = ({ label, error, hint, children }) => (
  <div style={{ marginBottom:14 }}>
    <label className="field-label">{label}</label>
    {children}
    {error && <p className="err-msg"><i className="bi bi-exclamation-circle-fill" style={{ fontSize:10 }}></i>{error}</p>}
    {hint && !error && <p style={{ margin:"4px 0 0", fontSize:11, color:"#94a3b8" }}>{hint}</p>}
  </div>
);

const ToastList = ({ toasts }) => (
  <div className="toast-wrap">
    {toasts.map(t => (
      <div key={t.id} className={`toast ${t.type}`}>
        <i className={`bi ${t.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`}></i>{t.message}
      </div>
    ))}
  </div>
);

const PwInput = ({ value, onChange, placeholder, className }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-wrap">
      <input className={`field-input ${className ?? ""}`} type={show ? "text" : "password"}
        placeholder={placeholder} value={value} onChange={onChange}/>
      <button type="button" className="pw-eye" onClick={() => setShow(s => !s)} tabIndex={-1}>
        <i className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`} style={{ fontSize:14 }}></i>
      </button>
    </div>
  );
};

const CourseInput = ({ value, onChange }) => {
  const [query, setQuery]           = useState(value ?? "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]             = useState(false);
  const [hi, setHi]                 = useState(-1);
  const ref = useRef(null);

  useEffect(() => { setQuery(value ?? ""); }, [value]);
  const filter = q => !q.trim() ? [] : COURSE_LIST.filter(c => c.toLowerCase().includes(q.toLowerCase()));

  const handleChange = e => {
    const q = e.target.value; setQuery(q); onChange(q);
    setSuggestions(filter(q)); setOpen(true); setHi(-1);
  };
  const select = c => { setQuery(c); onChange(c); setSuggestions([]); setOpen(false); };
  const handleKey = e => {
    if (!open || !suggestions.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => Math.min(h+1, suggestions.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHi(h => Math.max(h-1, 0)); }
    if (e.key === "Enter" && hi >= 0) { e.preventDefault(); select(suggestions[hi]); }
    if (e.key === "Escape") setOpen(false);
  };
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="course-wrap" ref={ref}>
      <input className="field-input" type="text" placeholder="Search or type your course…"
        value={query} onChange={handleChange} autoComplete="off"
        onFocus={() => { if (query) { setSuggestions(filter(query)); setOpen(true); } }}
        onKeyDown={handleKey}/>
      {open && suggestions.length > 0 && (
        <div className="course-list">
          {suggestions.map((c, i) => (
            <div key={c} className={`course-item${i === hi ? " hi" : ""}`} onMouseDown={() => select(c)}>{c}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const StudentAccountSettings = () => {
  const navigate   = useNavigate();
  const photoInput = useRef(null);

  const [user,      setUser]      = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [toasts,    setToasts]    = useState([]);
  const [form,       setForm]       = useState({ fullName:"", email:"", phone:"", course:"", year_level:"" });
  const [formErrors, setFormErrors] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);
  const [photoPreview,   setPhotoPreview]   = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pw,       setPw]       = useState({ current:"", next:"", confirm:"" });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);
  const strength = pwStrength(pw.next);

  const addToast = (msg, type="success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message:msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  useEffect(() => {
    API.get("/me").then(r => {
      const u = r.data.user;
      setUser(u);
      setForm({ fullName:u?.name??"", email:u?.email??"", phone:u?.phone??"", course:u?.course??"", year_level:u?.year_level??"" });
      if (u?.profile_photo_url) setPhotoPreview(u.profile_photo_url);
    }).catch(() => {});
  }, []);

  const handleLogout = async () => { try { await API.post("/logout"); } catch {} navigate("/"); };
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "S";

  const validateInfo = () => {
    const e = {};
    if (!form.fullName.trim())                                   e.fullName = "Full name is required.";
    if (!form.email.trim())                                      e.email    = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))   e.email    = "Enter a valid email address.";
    if (form.phone && !/^[+\d\s\-()]{7,20}$/.test(form.phone)) e.phone    = "Enter a valid phone number.";
    return e;
  };

  const handleSaveInfo = async () => {
    const e = validateInfo(); if (Object.keys(e).length) { setFormErrors(e); return; }
    setFormErrors({}); setSavingInfo(true);
    try {
      await fetchCsrfToken();
      const parts = form.fullName.trim().split(" ");
      const res = await API.put("/profile", { first_name:parts[0], last_name:parts.slice(1).join(" "), email:form.email, phone:form.phone, course:form.course, year_level:form.year_level });
      setUser(res.data.user); addToast("Profile updated successfully!");
    } catch (err) {
      const se = err.response?.data?.errors ?? {};
      const mapped = {};
      if (se.first_name || se.last_name) mapped.fullName = (se.first_name ?? se.last_name)?.[0];
      if (se.email) mapped.email = se.email[0]; if (se.phone) mapped.phone = se.phone[0];
      setFormErrors(mapped); addToast(err.response?.data?.message ?? "Failed to save.", "error");
    } finally { setSavingInfo(false); }
  };

  const handlePhotoChange = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 2*1024*1024) { addToast("Photo must be under 2 MB.", "error"); return; }
    const reader = new FileReader(); reader.onload = ev => setPhotoPreview(ev.target.result); reader.readAsDataURL(file);
    setUploadingPhoto(true);
    try {
      await fetchCsrfToken(); const fd = new FormData(); fd.append("photo", file);
      const res = await API.post("/profile/photo", fd, { headers:{ "Content-Type":"multipart/form-data" } });
      setPhotoPreview(res.data.profile_photo_url); setUser(u => ({ ...u, profile_photo_url:res.data.profile_photo_url })); addToast("Photo updated!");
    } catch { addToast("Photo upload failed.", "error"); setPhotoPreview(user?.profile_photo_url ?? null); }
    finally { setUploadingPhoto(false); e.target.value=""; }
  };

  const validatePassword = () => {
    const e = {};
    if (!pw.current)                      e.current = "Current password is required.";
    if (!pw.next)                         e.next    = "New password is required.";
    else if (pw.next.length < 8)          e.next    = "Must be at least 8 characters.";
    else if (!/[A-Z]/.test(pw.next))      e.next    = "Must include an uppercase letter.";
    else if (!/[a-z]/.test(pw.next))      e.next    = "Must include a lowercase letter.";
    else if (!/[0-9]/.test(pw.next))      e.next    = "Must include a number.";
    else if (!/[@$!%*#?&]/.test(pw.next)) e.next    = "Must include a special character (@$!%*#?&).";
    if (!pw.confirm)                      e.confirm = "Please confirm your new password.";
    else if (pw.next !== pw.confirm)      e.confirm = "Passwords do not match.";
    return e;
  };

  const handleChangePassword = async () => {
    const e = validatePassword(); if (Object.keys(e).length) { setPwErrors(e); return; }
    setPwErrors({}); setSavingPw(true);
    try {
      await fetchCsrfToken();
      await API.put("/profile/password", { current_password:pw.current, password:pw.next, password_confirmation:pw.confirm });
      setPw({ current:"", next:"", confirm:"" }); addToast("Password changed successfully!");
    } catch (err) {
      const se = err.response?.data?.errors ?? {};
      const mapped = {};
      if (se.current_password) mapped.current = se.current_password[0];
      if (se.password)         mapped.next    = se.password[0];
      setPwErrors(mapped); addToast(err.response?.data?.message ?? "Failed to change password.", "error");
    } finally { setSavingPw(false); }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <ToastList toasts={toasts}/>
      <div style={{ background:"#f0f4fb", minHeight:"100vh" }}>
        <Topbar user={user} onLogout={handleLogout}/>
        <div className="d-flex align-items-stretch">
          <Sidebar active="Settings"/>
          <main style={{ flex:1, padding:"28px 20px", paddingBottom:100, minWidth:0 }}>
            <div className="page-wrap">

              {/* Header */}
              <div style={{ marginBottom:20 }}>
                <p style={{ margin:0, fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".07em" }}>Account</p>
                <h1 style={{ margin:"3px 0 2px", fontSize:21, fontWeight:700, color:"#0f172a", letterSpacing:"-.3px", display:"flex", alignItems:"center", gap:8 }}>
                  <i className="bi bi-gear" style={{ fontSize:18, color:"#64748b" }}></i> Account Settings
                </h1>
                <p style={{ margin:0, fontSize:13, color:"#64748b" }}>Manage your profile and security</p>
              </div>

              {/* Identity strip */}
              <div className="dash-card fade-up" style={{ padding:"14px 18px", marginBottom:18 }}>
                <div className="identity-strip">
                  <div className="avatar-lg" onClick={() => photoInput.current?.click()} title="Change photo">
                    {photoPreview ? <img src={photoPreview} alt="Profile"/> : initial}
                    <div className="photo-overlay">
                      {uploadingPhoto
                        ? <span className="spinner-border spinner-border-sm text-white" role="status"/>
                        : <i className="bi bi-camera-fill" style={{ color:"#fff", fontSize:13 }}></i>}
                    </div>
                  </div>
                  <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" style={{ display:"none" }} onChange={handlePhotoChange}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.name ?? "—"}</p>
                    <p style={{ margin:"1px 0 0", fontSize:12, color:"#64748b", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.email ?? "—"}</p>
                    <div style={{ display:"flex", gap:5, marginTop:5, flexWrap:"wrap" }}>
                      {[user?.course, user?.year_level, user?.student_id].filter(Boolean).map(b => (
                        <span key={b} style={{ background:"#e8f0fe", color:"#0056b3", borderRadius:99, padding:"2px 8px", fontSize:11, fontWeight:600 }}>{b}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Underline tabs */}
              <div className="tab-bar">
                {[{ key:"general", label:"General", icon:"bi-person" },{ key:"security", label:"Security", icon:"bi-shield-lock" }].map(({ key, label, icon }) => (
                  <button key={key} className={`settings-tab${activeTab === key ? " active" : ""}`} onClick={() => setActiveTab(key)}>
                    <i className={`bi ${icon}`}></i>{label}
                  </button>
                ))}
              </div>

              {/* ── GENERAL ── */}
              {activeTab === "general" && (
                <div className="dash-card fade-up" style={{ padding:22 }}>
                  <p style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:"#0f172a" }}>Personal Information</p>

                  <div className="two-col">
                    <Field label="Full Name" error={formErrors.fullName}>
                      <input className={`field-input${formErrors.fullName?" error":form.fullName?" success":""}`}
                        placeholder="e.g. Juan dela Cruz" value={form.fullName}
                        onChange={e => { setForm(f => ({ ...f, fullName:e.target.value })); setFormErrors(x => ({ ...x, fullName:null })); }}/>
                    </Field>
                    <Field label="Email Address" error={formErrors.email}>
                      <input className={`field-input${formErrors.email?" error":form.email?" success":""}`}
                        type="email" value={form.email}
                        onChange={e => { setForm(f => ({ ...f, email:e.target.value })); setFormErrors(x => ({ ...x, email:null })); }}/>
                    </Field>
                    <Field label="Phone Number" error={formErrors.phone}>
                      <input className={`field-input${formErrors.phone?" error":""}`}
                        type="tel" placeholder="+63 912 345 6789" value={form.phone}
                        onChange={e => { setForm(f => ({ ...f, phone:e.target.value })); setFormErrors(x => ({ ...x, phone:null })); }}/>
                    </Field>
                    <Field label="Year Level">
                      <select className="field-select" value={form.year_level}
                        onChange={e => setForm(f => ({ ...f, year_level:e.target.value }))}>
                        <option value="">— Select —</option>
                        {["1st Year","2nd Year","3rd Year","4th Year","5th Year"].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </Field>
                  </div>

                  <Field label="Course / Program" hint="Start typing to search, or enter your course manually.">
                    <CourseInput value={form.course} onChange={val => setForm(f => ({ ...f, course:val }))}/>
                  </Field>

                  <button className="save-btn" onClick={handleSaveInfo} disabled={savingInfo}>
                    {savingInfo ? <><span className="spinner-border spinner-border-sm me-1" role="status"/>Saving…</> : <><i className="bi bi-check2"></i>Save Changes</>}
                  </button>
                </div>
              )}

              {/* ── SECURITY ── */}
              {activeTab === "security" && (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div className="dash-card fade-up" style={{ padding:22 }}>
                    <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:"#0f172a" }}>Change Password</p>
                    <p style={{ margin:"0 0 16px", fontSize:12, color:"#94a3b8" }}>Keep your account secure with a strong password</p>

                    <div className="req-box">
                      <strong><i className="bi bi-info-circle me-1"></i>Requirements:</strong>{" "}
                      Min 8 chars · uppercase · lowercase · number · special character
                      <br/><span style={{ color:"#3b82f6" }}>Example: MyPass@123</span>
                    </div>

                    <Field label="Current Password" error={pwErrors.current}>
                      <PwInput value={pw.current} placeholder="Enter your current password"
                        className={pwErrors.current ? "error" : ""}
                        onChange={e => { setPw(p => ({ ...p, current:e.target.value })); setPwErrors(x => ({ ...x, current:null })); }}/>
                    </Field>

                    <div className="two-col">
                      <Field label="New Password" error={pwErrors.next}>
                        <PwInput value={pw.next} placeholder="Min 8 chars · upper · lower · number · special"
                          className={pwErrors.next ? "error" : pw.next && strength.score >= 4 ? "success" : ""}
                          onChange={e => { setPw(p => ({ ...p, next:e.target.value })); setPwErrors(x => ({ ...x, next:null })); }}/>
                        {pw.next && (
                          <>
                            <div style={{ display:"flex", gap:3, marginTop:6 }}>
                              {[1,2,3,4,5].map(i => (
                                <div key={i} style={{ flex:1, height:3, borderRadius:99, background:i<=strength.score?strength.color:"#e2e8f0", transition:"background .3s" }}/>
                              ))}
                            </div>
                            <p style={{ fontSize:11, margin:"3px 0 0", color:strength.color }}>{strength.label}</p>
                          </>
                        )}
                      </Field>
                      <Field label="Confirm New Password" error={pwErrors.confirm}>
                        <PwInput value={pw.confirm} placeholder="Repeat new password"
                          className={pwErrors.confirm ? "error" : pw.confirm && pw.confirm === pw.next ? "success" : ""}
                          onChange={e => { setPw(p => ({ ...p, confirm:e.target.value })); setPwErrors(x => ({ ...x, confirm:null })); }}/>
                      </Field>
                    </div>

                    <button className="save-btn" onClick={handleChangePassword} disabled={savingPw}>
                      {savingPw ? <><span className="spinner-border spinner-border-sm me-1" role="status"/>Updating…</> : <><i className="bi bi-shield-lock"></i>Update Password</>}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
        <BottomNav active="Settings"/>
      </div>
    </>
  );
};

export default StudentAccountSettings;