import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { fetchCsrfToken } from "../../lib/api";

/* ─────────────────────────────────────────────────────────────────────────────
   CSS
───────────────────────────────────────────────────────────────────────────── */
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

  /* topbar */
  .topbar{background:rgba(255,255,255,.82);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:100;height:56px;display:flex;align-items:center;padding:0 20px;gap:12px;}

  /* sidebar */
  .sidebar{width:80px;flex-shrink:0;background:rgba(255,255,255,.60);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,.80);box-shadow:4px 0 24px rgba(0,86,179,.07);display:flex;flex-direction:column;align-items:center;padding:16px 0;gap:2px;position:sticky;top:56px;height:calc(100vh - 56px);align-self:flex-start;}
  .nav-pill{display:flex;flex-direction:column;align-items:center;padding:10px 8px;border-radius:12px;gap:4px;font-size:11px;font-weight:600;text-decoration:none;color:var(--slate);transition:background .15s,color .15s;width:90%;}
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}

  /* avatar */
  .avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;overflow:hidden;}
  .avatar img{width:100%;height:100%;object-fit:cover;}

  /* card */
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;}

  /* bottom nav (mobile) */
  .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,.08);}
  .bottom-nav a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;color:#94a3b8;transition:color .2s;border-top:2px solid transparent;}
  .bottom-nav a.active{color:#0056b3;border-top-color:#0056b3;}
  .bottom-nav a i{font-size:19px;}

  /* animations */
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .32s ease both;}
  .fade-up:nth-child(1){animation-delay:.04s}
  .fade-up:nth-child(2){animation-delay:.10s}
  .fade-up:nth-child(3){animation-delay:.16s}
  .fade-up:nth-child(4){animation-delay:.22s}

  /* ── THE FIX: layout ──
     The page shell is a flex row.
     The sidebar is a fixed-width sticky column.
     The <main> fills the rest and has its own internal centering.
  */
  .page-shell{display:flex;min-height:calc(100vh - 56px);}
  .main-area{
    flex:1;
    min-width:0;
    /* Center content horizontally inside main */
    display:flex;
    justify-content:center;
    padding:28px 24px 100px;
  }
  .page-content{
    width:100%;
    max-width:980px;
  }

  /* profile grid */
  .profile-grid{
    display:grid;
    grid-template-columns:290px 1fr;
    gap:16px;
    align-items:start;
  }

  /* right column stacks vertically */
  .right-col{display:flex;flex-direction:column;gap:16px;}

  /* tab bar */
  .tab-bar{display:flex;border-bottom:1px solid #e8edf5;padding:0 20px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
  .tab-bar::-webkit-scrollbar{display:none;}
  .tab-pill{padding:10px 15px;border:none;border-bottom:2px solid transparent;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:#94a3b8;transition:color .15s,border-color .15s;font-family:'DM Sans',sans-serif;white-space:nowrap;margin-bottom:-1px;display:inline-flex;align-items:center;gap:5px;}
  .tab-pill.active{color:var(--blue);border-bottom-color:var(--blue);}
  .tab-pill:hover:not(.active){color:var(--slate);}

  /* info rows */
  .info-row{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9;}
  .info-row:last-child{border-bottom:none;}

  /* subject table */
  .subj-table{width:100%;border-collapse:collapse;font-size:13px;}
  .subj-table th{padding:9px 14px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;border-bottom:1px solid #f1f5f9;}
  .subj-table td{padding:11px 14px;border-bottom:1px solid #f8faff;color:#1e293b;vertical-align:middle;}
  .subj-table tr:last-child td{border-bottom:none;}
  .subj-table tbody tr:hover td{background:#f8faff;}

  /* social links */
  .social-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f1f5f9;}
  .social-row:last-child{border-bottom:none;}
  .social-input{border:1px solid #e2e8f0;border-radius:8px;padding:7px 11px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;flex:1;background:#fafbff;transition:border-color .2s,box-shadow .2s;min-width:0;}
  .social-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.09);background:#fff;}
  .social-input::placeholder{color:#c7d2de;}

  /* interests / tags */
  .tag{display:inline-flex;align-items:center;gap:5px;background:#e8f0fe;color:#0056b3;border-radius:99px;padding:4px 12px;font-size:12px;font-weight:600;}
  .tag-remove{background:none;border:none;cursor:pointer;color:#4d8fe0;padding:0;line-height:1;font-size:13px;display:flex;align-items:center;}
  .tag-remove:hover{color:#0056b3;}
  .tag-input{border:1px solid #e2e8f0;border-radius:8px;padding:7px 11px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;background:#fafbff;transition:border-color .2s,box-shadow .2s;flex:1;min-width:120px;}
  .tag-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.09);background:#fff;}
  .tag-input::placeholder{color:#c7d2de;}
  .save-sm-btn{background:var(--blue);color:#fff;border:none;border-radius:8px;padding:7px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .15s;display:inline-flex;align-items:center;gap:5px;flex-shrink:0;}
  .save-sm-btn:hover:not(:disabled){opacity:.85;}
  .save-sm-btn:disabled{opacity:.5;cursor:not-allowed;}

  /* empty state */
  .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px 20px;gap:8px;text-align:center;}

  /* toast */
  .toast-wrap{position:fixed;top:68px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;}
  .toast-item{background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.12);padding:12px 16px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;min-width:220px;pointer-events:all;animation:slideIn .22s ease;}
  .toast-item.success{border-left:4px solid #22c55e;color:#166534;}
  .toast-item.error{border-left:4px solid #ef4444;color:#991b1b;}
  @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}

  /* responsive */
  @media(max-width:820px){
    .profile-grid{grid-template-columns:1fr;}
    .sidebar{display:none;}
    .main-area{padding:20px 14px 90px;}
  }
  @media(min-width:821px){
    .bottom-nav{display:none;}
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to:"/student",                  icon:"bi-speedometer2",    label:"Home"    },
  { to:"/student/subjects",         icon:"bi-journal-bookmark",label:"Subjects"},
  { to:"/student/exams",            icon:"bi-pencil-square",   label:"Exams"   },
  { to:"/student/grades",           icon:"bi-graph-up-arrow",  label:"Grades"  },
  { to:"/student/account-settings", icon:"bi-gear",            label:"Settings"},
];

const SOCIAL_PLATFORMS = [
  { key:"facebook",  label:"Facebook",  icon:"bi-facebook",  color:"#1877f2", placeholder:"https://facebook.com/yourprofile"  },
  { key:"instagram", label:"Instagram", icon:"bi-instagram", color:"#e1306c", placeholder:"https://instagram.com/yourhandle"  },
  { key:"twitter",   label:"X / Twitter",icon:"bi-twitter-x",color:"#0f172a", placeholder:"https://x.com/yourhandle"          },
  { key:"linkedin",  label:"LinkedIn",  icon:"bi-linkedin",  color:"#0a66c2", placeholder:"https://linkedin.com/in/yourname"  },
  { key:"github",    label:"GitHub",    icon:"bi-github",    color:"#1e293b", placeholder:"https://github.com/yourusername"   },
];

const INTEREST_SUGGESTIONS = [
  "Web Development","Mobile Apps","Data Science","Machine Learning","Cybersecurity",
  "UI/UX Design","Game Development","Networking","Cloud Computing","Robotics",
  "Mathematics","Physics","Photography","Music","Art & Design","Writing",
  "Public Speaking","Entrepreneurship","Open Source","Research",
];

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────────── */
const ToastList = ({ toasts }) => (
  <div className="toast-wrap">
    {toasts.map(t => (
      <div key={t.id} className={`toast-item ${t.type}`}>
        <i className={`bi ${t.type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`}></i>
        {t.message}
      </div>
    ))}
  </div>
);

const BottomNav = () => (
  <nav className="bottom-nav">
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to}><i className={`bi ${icon}`}></i>{label}</Link>
    ))}
  </nav>
);

const Topbar = ({ user, onLogout }) => {
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "S";
  const firstName = user?.name?.split(" ")[0] ?? "Student";
  return (
    <div className="topbar">
      <span style={{ fontWeight:700, fontSize:15, color:"#0056b3", letterSpacing:"-.3px", flexShrink:0 }}>SECT Portal</span>
      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
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

const Sidebar = () => (
  <aside className="sidebar">
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className="nav-pill"><i className={`bi ${icon}`}></i>{label}</Link>
    ))}
  </aside>
);

const InfoRow = ({ icon, color, bg, label, value }) => (
  <div className="info-row">
    <div style={{ width:30, height:30, borderRadius:8, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
      <i className={`bi ${icon}`} style={{ color, fontSize:13 }}></i>
    </div>
    <div style={{ flex:1, minWidth:0 }}>
      <p style={{ margin:0, fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".05em" }}>{label}</p>
      {value
        ? <p style={{ margin:"2px 0 0", fontSize:13, fontWeight:500, color:"#1e293b", wordBreak:"break-word" }}>{value}</p>
        : <p style={{ margin:"2px 0 0", fontSize:13, color:"#c7d2de", fontStyle:"italic" }}>Not set</p>
      }
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Interests Section
───────────────────────────────────────────────────────────────────────────── */
const InterestsSection = ({ user, addToast }) => {
  const [tags,    setTags]    = useState([]);
  const [input,   setInput]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const [showSug, setShowSug] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTags(user?.interests ?? []);
  }, [user]);

  const addTag = (val) => {
    const trimmed = val.trim();
    if (!trimmed || tags.includes(trimmed) || tags.length >= 15) return;
    setTags(t => [...t, trimmed]);
    setInput("");
    setShowSug(false);
  };

  const removeTag = (tag) => setTags(t => t.filter(x => x !== tag));

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(input); }
    if (e.key === "Backspace" && !input && tags.length) setTags(t => t.slice(0, -1));
  };

  const filtered = INTEREST_SUGGESTIONS.filter(s =>
    !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase())
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchCsrfToken();
      await API.put("/profile/preferences", { interests: tags });
      addToast("Interests saved!");
    } catch {
      addToast("Failed to save interests.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dash-card" style={{ padding:20 }}>
      <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:"#0f172a" }}>Personal Interests</p>
      <p style={{ margin:"0 0 14px", fontSize:12, color:"#94a3b8" }}>Add topics you're passionate about (up to 15)</p>

      {/* Tags display */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:12, minHeight:tags.length ? "auto" : 0 }}>
        {tags.map(tag => (
          <span key={tag} className="tag">
            {tag}
            <button className="tag-remove" onClick={() => removeTag(tag)} title={`Remove ${tag}`}>
              <i className="bi bi-x-lg" style={{ fontSize:10 }}></i>
            </button>
          </span>
        ))}
      </div>

      {/* Input + suggestions */}
      {tags.length < 15 && (
        <div style={{ position:"relative" }}>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <input
              ref={inputRef}
              className="tag-input"
              placeholder='Type an interest and press Enter…'
              value={input}
              onChange={e => { setInput(e.target.value); setShowSug(true); }}
              onFocus={() => setShowSug(true)}
              onBlur={() => setTimeout(() => setShowSug(false), 150)}
              onKeyDown={handleKey}
            />
            {input.trim() && (
              <button className="save-sm-btn" style={{ background:"#f1f5f9", color:"#0056b3" }} onClick={() => addTag(input)}>
                <i className="bi bi-plus-lg"></i>Add
              </button>
            )}
          </div>

          {/* Autocomplete suggestions */}
          {showSug && filtered.length > 0 && (
            <div style={{
              position:"absolute", top:"calc(100% + 6px)", left:0, right:0,
              background:"#fff", border:"1px solid #e2e8f0", borderRadius:10,
              boxShadow:"0 8px 24px rgba(0,86,179,.10)", zIndex:50,
              maxHeight:180, overflowY:"auto",
            }}>
              {filtered.slice(0, 10).map(s => (
                <button key={s}
                  style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 14px", background:"none", border:"none", fontSize:13, color:"#1e293b", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
                  onMouseDown={() => addTag(s)}
                  onMouseEnter={e => e.currentTarget.style.background="#e8f0fe"}
                  onMouseLeave={e => e.currentTarget.style.background="none"}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick-add suggestions (shown when input is empty) */}
      {!input && tags.length < 15 && (
        <div style={{ marginTop:10 }}>
          <p style={{ margin:"0 0 7px", fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".05em" }}>Quick add</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {INTEREST_SUGGESTIONS.filter(s => !tags.includes(s)).slice(0, 8).map(s => (
              <button key={s} onClick={() => addTag(s)}
                style={{ background:"#f1f5f9", border:"none", borderRadius:99, padding:"4px 12px", fontSize:12, fontWeight:600, color:"#64748b", cursor:"pointer", transition:"background .12s", fontFamily:"'DM Sans',sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.background="#e8f0fe"}
                onMouseLeave={e => e.currentTarget.style.background="#f1f5f9"}>
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      {tags.length > 0 && (
        <div style={{ marginTop:16 }}>
          <button className="save-sm-btn" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1" role="status"/>Saving…</> : <><i className="bi bi-check2"></i>Save Interests</>}
          </button>
        </div>
      )}

      {tags.length === 0 && !input && (
        <p style={{ margin:"8px 0 0", fontSize:12, color:"#94a3b8", fontStyle:"italic" }}>
          No interests added yet. Click a suggestion above or type your own.
        </p>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────────────────── */
const StudentProfile = () => {
  const navigate    = useNavigate();
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("subjects");
  const [toasts,  setToasts]  = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  useEffect(() => {
    API.get("/me")
      .then(r => setUser(r.data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/");
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f0f4fb" }}>
      <div className="spinner-border text-primary" role="status"/>
    </div>
  );

  const initial     = user?.name?.charAt(0)?.toUpperCase() ?? "S";
  const fullName    = user?.name ?? "Student";
  const profileTags = [user?.course, user?.year_level, user?.student_id].filter(Boolean);
  const missingInfo = !user?.phone || !user?.course || !user?.year_level || !user?.student_id;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <ToastList toasts={toasts}/>

      <div style={{ background:"#f0f4fb", minHeight:"100vh" }}>
        <Topbar user={user} onLogout={handleLogout}/>

        {/* Shell: sidebar + main side by side */}
        <div className="page-shell">
          <Sidebar/>

          {/* main-area: flex:1, justify-content:center → page-content centers itself */}
          <div className="main-area">
            <div className="page-content">

              {/* Page header */}
              <div style={{ marginBottom:22 }}>
                <p style={{ margin:0, fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".07em" }}>Account</p>
                <h1 style={{ margin:"3px 0 2px", fontSize:21, fontWeight:700, color:"#0f172a", letterSpacing:"-.3px" }}>My Profile</h1>
                <p style={{ margin:0, fontSize:13, color:"#64748b" }}>Your personal information, subjects and more</p>
              </div>

              {/* Two-column grid */}
              <div className="profile-grid">

                {/* ── LEFT COLUMN ── */}
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                  {/* Hero card */}
                  <div className="dash-card fade-up" style={{
                    padding:0, border:"none", overflow:"hidden",
                    background:"linear-gradient(135deg,#0056b3 0%,#1a6ed8 55%,#4d90fe 100%)",
                    position:"relative",
                  }}>
                    <div style={{ position:"absolute", right:-30, top:-30, width:130, height:130, borderRadius:"50%", background:"rgba(255,255,255,.07)", pointerEvents:"none" }}/>
                    <div style={{ position:"absolute", left:-15, bottom:-35, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,.05)", pointerEvents:"none" }}/>

                    <div style={{ padding:"22px 20px 20px", position:"relative" }}>
                      <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,.22)", border:"3px solid rgba(255,255,255,.40)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:700, color:"#fff", marginBottom:12, overflow:"hidden" }}>
                        {user?.profile_photo_url
                          ? <img src={user.profile_photo_url} alt="Profile" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                          : initial}
                      </div>
                      <h2 style={{ margin:"0 0 2px", fontSize:17, fontWeight:700, color:"#fff", letterSpacing:"-.2px", lineHeight:1.25 }}>{fullName}</h2>
                      <p style={{ margin:"0 0 12px", fontSize:12, color:"rgba(255,255,255,.72)" }}>
                        {[user?.student_id, user?.year_level].filter(Boolean).join(" · ") || "Student"}
                      </p>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
                        {profileTags.length > 0
                          ? profileTags.map(t => <span key={t} style={{ background:"rgba(255,255,255,.18)", color:"#fff", borderRadius:99, padding:"3px 10px", fontSize:11, fontWeight:600 }}>{t}</span>)
                          : <span style={{ background:"rgba(255,255,255,.12)", color:"rgba(255,255,255,.7)", borderRadius:99, padding:"3px 10px", fontSize:11 }}>No profile info yet</span>
                        }
                      </div>
                      <Link to="/student/account-settings" style={{ background:"rgba(255,255,255,.16)", border:"1px solid rgba(255,255,255,.30)", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, color:"#fff", display:"inline-flex", alignItems:"center", gap:5, textDecoration:"none" }}>
                        <i className="bi bi-pencil-square"></i>Edit Profile
                      </Link>
                    </div>
                  </div>

                  {/* Personal info */}
                  <div className="dash-card fade-up" style={{ padding:18 }}>
                    <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:"#0f172a" }}>Personal Information</p>
                    <p style={{ margin:"0 0 12px", fontSize:12, color:"#94a3b8" }}>Academic and contact details</p>
                    <InfoRow icon="bi-building"     color="#f59e0b" bg="#fff7ed" label="Course"      value={user?.course}     />
                    <InfoRow icon="bi-mortarboard"  color="#a855f7" bg="#fdf2f8" label="Year Level"  value={user?.year_level} />
                    <InfoRow icon="bi-envelope"     color="#0056b3" bg="#e8f0fe" label="Email"       value={user?.email}      />
                    <InfoRow icon="bi-telephone"    color="#22c55e" bg="#f0fdf4" label="Phone"       value={user?.phone}      />
                  </div>

                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="right-col">

                  {/* Subjects / Activity card */}
                  <div className="dash-card fade-up" style={{ padding:0 }}>
                    <div className="tab-bar">
                      {[
                        { key:"subjects", label:"Enrolled Subjects", icon:"bi-journal-bookmark" },
                      ].map(t => (
                        <button key={t.key} className={`tab-pill${activeTab === t.key ? " active" : ""}`} onClick={() => setActiveTab(t.key)}>
                          <i className={`bi ${t.icon}`}></i>{t.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ padding:"18px 20px" }}>
                      {activeTab === "subjects" && (
                        user?.enrollments?.length > 0
                          ? (
                            <div style={{ overflowX:"auto" }}>
                              <table className="subj-table">
                                <thead>
                                  <tr>
                                    <th>Code</th>
                                    <th>Subject Name</th>
                                    <th className="d-none d-sm-table-cell">Instructor</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {user.enrollments.map(c => (
                                    <tr key={c.code ?? c.id}>
                                      <td>
                                        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:600, color:"#0056b3", background:"#e8f0fe", borderRadius:6, padding:"2px 8px" }}>
                                          {c.code ?? "—"}
                                        </span>
                                      </td>
                                      <td style={{ fontWeight:600, color:"#1e293b" }}>{c.name}</td>
                                      <td style={{ color:"#64748b" }} className="d-none d-sm-table-cell">{c.instructor ?? "—"}</td>
                                      <td>
                                        <span style={{ background:"#f0fdf4", color:"#22c55e", borderRadius:99, padding:"2px 9px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
                                          {c.status ?? "Active"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )
                          : (
                            <div className="empty-state">
                              <div style={{ width:46, height:46, borderRadius:12, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <i className="bi bi-journal-bookmark" style={{ color:"#94a3b8", fontSize:21 }}></i>
                              </div>
                              <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#64748b" }}>No enrolled subjects yet</p>
                              <p style={{ margin:0, fontSize:12, color:"#94a3b8" }}>Your subjects will appear here once you're enrolled</p>
                            </div>
                          )
                      )}

                      {activeTab === "activity" && (
                        user?.activity?.length > 0
                          ? user.activity.map((a, i) => (
                              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom: i < user.activity.length - 1 ? "1px solid #f8faff" : "none", flexWrap:"wrap", gap:6 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                  <div style={{ width:30, height:30, borderRadius:8, background:(a.color ?? "#0056b3")+"18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                    <i className={`bi ${a.icon ?? "bi-activity"}`} style={{ color:a.color ?? "#0056b3", fontSize:13 }}></i>
                                  </div>
                                  <span style={{ fontSize:13, color:"#1e293b" }}>{a.description}</span>
                                </div>
                                <span style={{ fontSize:11, color:"#94a3b8", fontWeight:500, flexShrink:0 }}>{a.time_ago}</span>
                              </div>
                            ))
                          : (
                            <div className="empty-state">
                              <div style={{ width:46, height:46, borderRadius:12, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <i className="bi bi-clock-history" style={{ color:"#94a3b8", fontSize:21 }}></i>
                              </div>
                              <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#64748b" }}>No recent activity</p>
                              <p style={{ margin:0, fontSize:12, color:"#94a3b8" }}>Submissions and exam results will appear here</p>
                            </div>
                          )
                      )}
                    </div>
                  </div>

                  {/* Personal Interests */}
                  <InterestsSection user={user} addToast={addToast}/>

                </div>{/* /right-col */}
              </div>{/* /profile-grid */}
            </div>{/* /page-content */}
          </div>{/* /main-area */}
        </div>{/* /page-shell */}

        <BottomNav/>
      </div>
    </>
  );
};

export default StudentProfile;