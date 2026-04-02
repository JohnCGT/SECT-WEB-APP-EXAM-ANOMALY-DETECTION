import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";

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
  .avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  .avatar-lg{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#0056b3,#1a6ed8);color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;flex-shrink:0;box-shadow:0 4px 16px rgba(0,86,179,.30);}
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;}
  .settings-tab{padding:8px 16px;border-radius:99px;border:none;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:var(--slate-lt);transition:background .15s,color .15s;font-family:'DM Sans',sans-serif;white-space:nowrap;display:flex;align-items:center;gap:6px;}
  .settings-tab.active{background:var(--blue);color:#fff;box-shadow:0 4px 12px rgba(0,86,179,.25);}
  .settings-tab:hover:not(.active){background:#f1f5f9;color:var(--slate);}
  .field-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px;}
  .field-input{border:1px solid #e2e8f0;border-radius:10px;padding:9px 14px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;width:100%;background:#fafbff;transition:border-color .2s,box-shadow .2s;}
  .field-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .field-select{border:1px solid #e2e8f0;border-radius:10px;padding:9px 14px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;width:100%;background:#fafbff;cursor:pointer;transition:border-color .2s,box-shadow .2s;}
  .field-select:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .save-btn{background:var(--blue);color:#fff;border:none;border-radius:10px;padding:10px 24px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .15s;}
  .save-btn:hover{opacity:.85;}
  .toggle-row{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid #f8faff;}
  .toggle-row:last-child{border-bottom:none;}
  .section-title{font-size:13px;font-weight:700;color:#0f172a;margin:0 0 16px;}
  .section-sub{font-size:12px;color:#94a3b8;margin:2px 0 0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .35s ease both;}
  .fade-up:nth-child(1){animation-delay:.05s}.fade-up:nth-child(2){animation-delay:.10s}.fade-up:nth-child(3){animation-delay:.15s}
  .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bottom-nav a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;color:#94a3b8;transition:color .2s;border-top:2px solid transparent;}
  .bottom-nav a.active{color:#0056b3;border-top-color:#0056b3;}
  .bottom-nav a i{font-size:19px;}
  /* Custom toggle switch */
  .switch{position:relative;display:inline-block;width:40px;height:22px;flex-shrink:0;}
  .switch input{opacity:0;width:0;height:0;}
  .switch-slider{position:absolute;cursor:pointer;inset:0;background:#e2e8f0;border-radius:99px;transition:.3s;}
  .switch-slider::before{content:"";position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.3s;box-shadow:0 1px 4px rgba(0,0,0,.15);}
  input:checked+.switch-slider{background:var(--blue);}
  input:checked+.switch-slider::before{transform:translateX(18px);}
`;

const NAV_ITEMS = [
  { to:"/student",                  icon:"bi-speedometer2",    label:"Home"    },
  { to:"/student/subjects",         icon:"bi-journal-bookmark",label:"Subjects"},
  { to:"/student/tasks",            icon:"bi-pencil-square",   label:"Tasks"   },
  { to:"/student/grades",           icon:"bi-graph-up-arrow",  label:"Grades"  },
  { to:"/student/account-settings", icon:"bi-gear",            label:"Settings"},
];

const SETTINGS_TABS = [
  { key:"general",      label:"General",       icon:"bi-person"          },
  { key:"security",     label:"Security",      icon:"bi-shield-lock"     },
  { key:"notifications",label:"Notifications", icon:"bi-bell"            },
  { key:"preferences",  label:"Learning",      icon:"bi-book"            },
];

const BottomNav=({active})=>(
  <nav className="bottom-nav d-lg-none">
    {NAV_ITEMS.map(({to,icon,label})=>(
      <Link key={to} to={to} className={active===label?"active":""}><i className={`bi ${icon}`}></i>{label}</Link>
    ))}
  </nav>
);

const Topbar=({user,onLogout})=>{
  const initial=user?.name?.charAt(0)?.toUpperCase()??"S";
  const firstName=user?.name?.split(" ")[0]??"Student";
  return(
    <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
      <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,color:"#0056b3",letterSpacing:"-.3px",flexShrink:0}}>SECT Portal</span>
      <div className="ms-auto d-flex align-items-center gap-2">
        <button style={{background:"transparent",border:"none",position:"relative",padding:"4px 8px",cursor:"pointer"}}>
          <i className="bi bi-bell" style={{fontSize:18,color:"#64748b"}}></i>
          <span style={{position:"absolute",top:2,right:6,width:7,height:7,background:"#ef4444",borderRadius:"50%",border:"1.5px solid #f0f4fb"}}></span>
        </button>
        <div className="dropdown">
          <button className="d-flex align-items-center gap-2 dropdown-toggle"
            style={{background:"transparent",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:10}} data-bs-toggle="dropdown">
            <div className="avatar">{initial}</div>
            <span className="d-none d-sm-inline" style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{firstName}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{borderRadius:12,fontSize:13}}>
            <li><Link className="dropdown-item" to="/student/profile">My Profile</Link></li>
            <li><hr className="dropdown-divider"/></li>
            <li><button className="dropdown-item text-danger" onClick={onLogout} style={{border:"none",background:"none",width:"100%",textAlign:"left"}}>Logout</button></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const Sidebar=({active})=>(
  <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
    style={{width:80,minHeight:"calc(100vh - 56px)",position:"sticky",top:56,alignSelf:"flex-start",flexShrink:0}}>
    {NAV_ITEMS.map(({to,icon,label})=>(
      <Link key={to} to={to} className={`nav-pill${active===label?" active":""}`}><i className={`bi ${icon}`}></i>{label}</Link>
    ))}
  </nav>
);

/* Toggle Switch */
const Toggle = ({ defaultChecked = false }) => {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label className="switch">
      <input type="checkbox" checked={on} onChange={()=>setOn(v=>!v)}/>
      <span className="switch-slider"/>
    </label>
  );
};

/* Field group */
const Field = ({ label, children }) => (
  <div style={{marginBottom:16}}>
    <p className="field-label">{label}</p>
    {children}
  </div>
);

const StudentAccountSettings = () => {
  const navigate=useNavigate();
  const [user,setUser]=useState(null);
  const [activeTab,setActiveTab]=useState("general");
  const [form,setForm]=useState({ firstName:"Juan", lastName:"Dela Cruz", email:"juan.delacruz@student.edu.ph", phone:"+63 912 345 6789", course:"BS Computer Science", year:"3rd Year" });

  useEffect(()=>{
    API.get("/me").then(r=>{
      const u=r.data.user;
      setUser(u);
      if(u?.name){
        const parts=u.name.split(" ");
        setForm(f=>({...f, firstName:parts[0]||"", lastName:parts.slice(1).join(" ")||""}));
      }
      if(u?.email) setForm(f=>({...f,email:u.email}));
    }).catch(()=>{});
  },[]);

  const handleLogout=async()=>{
    try{await API.post("/logout");}catch{}
    localStorage.removeItem("user"); navigate("/");
  };

  const initial=user?.name?.charAt(0)?.toUpperCase()??"S";

  return(
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{background:"#f0f4fb",minHeight:"100vh"}}>

        <Topbar user={user} onLogout={handleLogout}/>

        <div className="d-flex align-items-stretch">
          <Sidebar active="Settings"/>

          <main style={{flex:1,padding:"24px 20px",paddingBottom:100,minWidth:0}}>

            {/* Page header */}
            <div style={{marginBottom:24}}>
              <p style={{margin:0,fontSize:12,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em"}}>Account</p>
              <h1 style={{margin:"4px 0 4px",fontSize:24,fontWeight:700,color:"#0f172a",letterSpacing:"-.4px"}}>Settings</h1>
              <p style={{margin:0,fontSize:13,color:"#64748b"}}>Manage your profile, security and preferences</p>
            </div>

            {/* Profile identity card */}
            <div className="dash-card fade-up" style={{padding:20,marginBottom:20,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
              <div className="avatar-lg">{initial}</div>
              <div style={{flex:1,minWidth:0}}>
                <h2 style={{margin:0,fontSize:17,fontWeight:700,color:"#0f172a"}}>{user?.name ?? "—"}</h2>
                <p style={{margin:"2px 0 0",fontSize:13,color:"#64748b"}}>{user?.email ?? "—"}</p>
                <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                  {["BS Computer Science","3rd Year","BSCS-3A"].map(b=>(
                    <span key={b} style={{background:"#e8f0fe",color:"#0056b3",borderRadius:99,padding:"2px 10px",fontSize:11,fontWeight:600}}>{b}</span>
                  ))}
                </div>
              </div>
              <button style={{background:"transparent",border:"1px solid #e2e8f0",borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:600,color:"#64748b",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>
                <i className="bi bi-camera me-2"></i>Change Photo
              </button>
            </div>

            {/* Settings tab bar */}
            <div style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto",paddingBottom:2}}>
              {SETTINGS_TABS.map(({key,label,icon})=>(
                <button key={key} className={`settings-tab${activeTab===key?" active":""}`}
                  onClick={()=>setActiveTab(key)}>
                  <i className={`bi ${icon}`}></i>{label}
                </button>
              ))}
            </div>

            {/* ── GENERAL ── */}
            {activeTab==="general" && (
              <div className="dash-card fade-up" style={{padding:24}}>
                <h3 className="section-title">Personal Information</h3>
                <div style={{display:"grid",gap:0,gridTemplateColumns:"1fr 1fr"}} className="gap-col">
                  <style>{`.gap-col{gap:0 16px;}@media(max-width:600px){.gap-col{grid-template-columns:1fr;}}`}</style>
                  <Field label="First Name">
                    <input className="field-input" value={form.firstName} onChange={e=>setForm(f=>({...f,firstName:e.target.value}))}/>
                  </Field>
                  <Field label="Last Name">
                    <input className="field-input" value={form.lastName} onChange={e=>setForm(f=>({...f,lastName:e.target.value}))}/>
                  </Field>
                  <Field label="Email Address">
                    <input className="field-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
                  </Field>
                  <Field label="Phone Number">
                    <input className="field-input" type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
                  </Field>
                  <Field label="Course / Program">
                    <select className="field-select" value={form.course} onChange={e=>setForm(f=>({...f,course:e.target.value}))}>
                      {["BS Computer Science","BS Information Technology","BS Engineering","BS Mathematics"].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Year Level">
                    <select className="field-select" value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))}>
                      {["1st Year","2nd Year","3rd Year","4th Year"].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
                <button className="save-btn" style={{marginTop:4}}>Save Changes</button>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab==="security" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {/* Change password */}
                <div className="dash-card fade-up" style={{padding:24}}>
                  <h3 className="section-title">Change Password</h3>
                  <div style={{display:"flex",flexDirection:"column",gap:0}}>
                    <Field label="Current Password"><input className="field-input" type="password" placeholder="Enter current password"/></Field>
                    <Field label="New Password"><input className="field-input" type="password" placeholder="Min. 8 characters"/></Field>
                    <Field label="Confirm New Password"><input className="field-input" type="password" placeholder="Repeat new password"/></Field>
                  </div>
                  <button className="save-btn">Update Password</button>
                </div>

                {/* 2FA */}
                <div className="dash-card fade-up" style={{padding:24}}>
                  <h3 className="section-title">Two-Factor Authentication</h3>
                  <div className="toggle-row">
                    <div>
                      <p style={{margin:0,fontSize:13,fontWeight:600,color:"#1e293b"}}>Enable 2FA</p>
                      <p className="section-sub">Add an extra layer of security to your account</p>
                    </div>
                    <Toggle defaultChecked={false}/>
                  </div>
                </div>

                {/* Login history */}
                <div className="dash-card fade-up" style={{padding:24}}>
                  <h3 className="section-title">Login History</h3>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead>
                        <tr style={{borderBottom:"1px solid #f1f5f9"}}>
                          {["Date & Time","IP Address","Device","Location"].map(h=>(
                            <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".04em",whiteSpace:"nowrap"}}
                              className={h==="IP Address"?"d-none d-sm-table-cell":h==="Location"?"d-none d-md-table-cell":""}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {date:"Feb 05, 2026 · 7:45 PM",ip:"192.168.1.120",device:"Windows · Chrome",loc:"Manila, PH"},
                          {date:"Feb 04, 2026 · 3:20 PM",ip:"192.168.1.120",device:"Android · Chrome",loc:"Quezon City, PH"},
                        ].map((r,i)=>(
                          <tr key={i} style={{borderBottom:"1px solid #f8faff"}}>
                            <td style={{padding:"10px 12px",color:"#1e293b",fontWeight:500}}>{r.date}</td>
                            <td style={{padding:"10px 12px",color:"#64748b",fontFamily:"'DM Mono',monospace",fontSize:12}} className="d-none d-sm-table-cell">{r.ip}</td>
                            <td style={{padding:"10px 12px",color:"#64748b"}}>{r.device}</td>
                            <td style={{padding:"10px 12px",color:"#64748b"}} className="d-none d-md-table-cell">{r.loc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab==="notifications" && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="dash-card fade-up" style={{padding:24}}>
                  <h3 className="section-title">Email Notifications</h3>
                  {[
                    {label:"Assignment Deadlines",sub:"Get notified when assignments are due",on:true},
                    {label:"Exam Schedules",sub:"Receive reminders before exams start",on:true},
                    {label:"Grades Posted",sub:"Get notified when new grades are released",on:true},
                    {label:"System Announcements",sub:"Receive important academic updates",on:false},
                  ].map(n=>(
                    <div key={n.label} className="toggle-row">
                      <div>
                        <p style={{margin:0,fontSize:13,fontWeight:600,color:"#1e293b"}}>{n.label}</p>
                        <p className="section-sub">{n.sub}</p>
                      </div>
                      <Toggle defaultChecked={n.on}/>
                    </div>
                  ))}
                </div>

                <div className="dash-card fade-up" style={{padding:24}}>
                  <h3 className="section-title">Alert Frequency</h3>
                  <Field label="How often to receive digests">
                    <select className="field-select" style={{maxWidth:280}}>
                      <option>Real-time</option><option>Hourly Digest</option><option>Daily Summary</option>
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {/* ── LEARNING PREFERENCES ── */}
            {activeTab==="preferences" && (
              <div className="dash-card fade-up" style={{padding:24}}>
                <h3 className="section-title">Learning Preferences</h3>
                <p style={{margin:"0 0 20px",fontSize:13,color:"#64748b"}}>Customize how you receive materials and study reminders.</p>

                {[
                  {label:"Enable Study Reminders",sub:"Get periodic reminders to review lessons",on:true},
                  {label:"Auto-Download Course Files",sub:"Automatically save materials when uploaded",on:false},
                ].map(n=>(
                  <div key={n.label} className="toggle-row">
                    <div>
                      <p style={{margin:0,fontSize:13,fontWeight:600,color:"#1e293b"}}>{n.label}</p>
                      <p className="section-sub">{n.sub}</p>
                    </div>
                    <Toggle defaultChecked={n.on}/>
                  </div>
                ))}

                <div style={{marginTop:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}} className="gap-col">
                  <Field label="Preferred Study Mode">
                    <select className="field-select">
                      <option>Visual</option><option>Reading/Writing</option><option>Hands-on</option><option>Mixed</option>
                    </select>
                  </Field>
                  <Field label="Weekly Study Goal (hours)">
                    <input className="field-input" type="number" defaultValue={10} min={1} max={80}/>
                  </Field>
                </div>

                <button className="save-btn" style={{marginTop:8}}>Save Preferences</button>
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