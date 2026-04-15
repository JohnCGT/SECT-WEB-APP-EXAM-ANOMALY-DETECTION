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
  .topbar{background:rgba(255,255,255,0.82);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:100;height:56px;}
  .glass-sidebar{background:rgba(255,255,255,0.60);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);}
  .nav-pill{display:flex;flex-direction:column;align-items:center;padding:10px 8px;border-radius:12px;gap:4px;font-size:11px;font-weight:600;text-decoration:none;color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;}
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;overflow:hidden;}
  .avatar img{width:100%;height:100%;object-fit:cover;}
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);transition:box-shadow .2s,transform .2s;overflow:hidden;}
  .dash-card:hover{box-shadow:0 2px 6px rgba(0,0,0,.06),0 8px 28px rgba(0,86,179,.10);transform:translateY(-1px);}
  .stat-chip{background:var(--card-bg);border-radius:14px;padding:18px;border:1px solid rgba(0,86,179,.07);box-shadow:var(--card-sh);transition:box-shadow .2s,transform .2s;}
  .stat-chip:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,86,179,.12);}
  .prog-track{height:5px;border-radius:99px;background:#eef2ff;overflow:hidden;}
  .prog-fill{height:100%;border-radius:99px;transition:width 1s cubic-bezier(.4,0,.2,1);}
  .tab-pill{padding:7px 18px;border-radius:99px;border:none;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:var(--slate-lt);transition:background .15s,color .15s;font-family:'DM Sans',sans-serif;white-space:nowrap;}
  .tab-pill.active{background:var(--blue-lite);color:var(--blue);}
  .tab-pill:hover:not(.active){color:var(--slate);background:#f1f5f9;}
  .interest-tag{display:inline-flex;align-items:center;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600;background:var(--blue-lite);color:var(--blue);margin:3px;}
  .info-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f8faff;font-size:13px;}
  .info-row:last-child{border-bottom:none;}
  .activity-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid #f8faff;flex-wrap:wrap;gap:4px;}
  .activity-row:last-child{border-bottom:none;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .35s ease both;}
  .fade-up:nth-child(1){animation-delay:.05s}.fade-up:nth-child(2){animation-delay:.10s}
  .fade-up:nth-child(3){animation-delay:.15s}.fade-up:nth-child(4){animation-delay:.20s}
  .fade-up:nth-child(5){animation-delay:.25s}.fade-up:nth-child(6){animation-delay:.30s}
  .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bottom-nav a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;color:#94a3b8;transition:color .2s;border-top:2px solid transparent;}
  .bottom-nav a.active{color:#0056b3;border-top-color:#0056b3;}
  .bottom-nav a i{font-size:19px;}
  .bento{display:grid;gap:16px;grid-template-columns:1fr 1fr 1fr;}
  .bento-span2{grid-column:span 2;}
  .bento-span3{grid-column:span 3;}
  @media(max-width:991px){.bento{grid-template-columns:1fr 1fr;}.bento-span2{grid-column:span 2;}.bento-span3{grid-column:span 2;}}
  @media(max-width:600px){.bento{grid-template-columns:1fr;}.bento-span2,.bento-span3{grid-column:span 1;}}
  .skeleton{background:linear-gradient(90deg,#f0f4fb 25%,#e8eef7 50%,#f0f4fb 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
`;

const NAV_ITEMS = [
  { to:"/student",                  icon:"bi-speedometer2",    label:"Home"    },
  { to:"/student/subjects",         icon:"bi-journal-bookmark",label:"Subjects"},
  { to:"/student/tasks",            icon:"bi-pencil-square",   label:"Tasks"   },
  { to:"/student/grades",           icon:"bi-graph-up-arrow",  label:"Grades"  },
  { to:"/student/account-settings", icon:"bi-gear",            label:"Settings"},
];

const COURSES = [
  { code:"CS 101", name:"Data Structures",    sched:"MWF 9:00–10:30",  inst:"Dr. Santos",  status:"Active" },
  { code:"CS 102", name:"Algorithm Analysis", sched:"TTH 1:00–2:30",   inst:"Prof. Reyes", status:"Active" },
  { code:"CS 201", name:"Database Systems",   sched:"MWF 2:00–3:30",   inst:"Dr. Gomez",   status:"Active" },
  { code:"CS 202", name:"Network Security",   sched:"TTH 10:00–11:30", inst:"Engr. Cruz",  status:"Active" },
  { code:"CS 301", name:"Advanced Web Dev",   sched:"MWF 11:00–12:30", inst:"Ms. Lim",     status:"Active" },
];

const ACTIVITY = [
  { icon:"bi-file-earmark-text", color:"#0056b3", text:"Submitted: Data Structures Assignment 3",   time:"2 hours ago"     },
  { icon:"bi-check-circle",      color:"#22c55e", text:"Completed exam: Algorithm Analysis Quiz 2", time:"1 day ago"       },
  { icon:"bi-bar-chart",         color:"#0ea5e9", text:"Viewed grades: Database Systems Midterm",   time:"2 days ago"      },
  { icon:"bi-clock",             color:"#f59e0b", text:"Upcoming exam: Network Security Final",     time:"3 days from now" },
];

const INTERESTS = ["Web Development","Cybersecurity","Data Science","AI & ML","Software Engineering"];

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
            <div className="avatar">
              {user?.profile_photo_url
                ? <img src={user.profile_photo_url} alt="avatar"/>
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

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const StudentProfile = () => {
  const navigate              = useNavigate();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    API.get("/me")
      .then(r => setUser(r.data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f0f4fb" }}>
      <div className="spinner-border text-primary" role="status"/>
    </div>
  );

  const initial  = user?.name?.charAt(0)?.toUpperCase() ?? "S";
  const fullName = user?.name  ?? "Student";

  // Build display tags from real data, filter out empty values
  const profileTags = [user?.course, user?.year_level, user?.student_id].filter(Boolean);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ background:"#f0f4fb", minHeight:"100vh" }}>

        <Topbar user={user} onLogout={handleLogout}/>

        <div className="d-flex align-items-stretch">
          <Sidebar active=""/>

          <main style={{ flex:1, padding:"24px 20px", paddingBottom:100, minWidth:0 }}>

            {/* Page header */}
            <div style={{ marginBottom:24 }}>
              <p style={{ margin:0, fontSize:12, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>Account</p>
              <h1 style={{ margin:"4px 0 4px", fontSize:24, fontWeight:700, color:"#0f172a", letterSpacing:"-.4px" }}>My Profile</h1>
              <p style={{ margin:0, fontSize:13, color:"#64748b" }}>Personal info, enrolled courses and recent activity</p>
            </div>

            <div className="bento">

              {/* 1 ── Identity hero — spans 2 */}
              <div className="dash-card bento-span2 fade-up" style={{
                padding:0,
                background:"linear-gradient(135deg, #0056b3 0%, #1a6ed8 60%, #4d90fe 100%)",
                border:"none", position:"relative", overflow:"hidden"
              }}>
                <div style={{ position:"absolute", right:-50, top:-50, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,.06)" }}/>
                <div style={{ position:"absolute", left:-30, bottom:-60, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,.04)" }}/>

                <div style={{ padding:"28px 28px 24px", position:"relative" }}>
                  {/* Avatar — shows real photo if uploaded */}
                  <div style={{
                    width:72, height:72, borderRadius:"50%",
                    background:"rgba(255,255,255,.2)", border:"3px solid rgba(255,255,255,.4)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:28, fontWeight:700, color:"#fff",
                    marginBottom:14, backdropFilter:"blur(8px)", overflow:"hidden", flexShrink:0
                  }}>
                    {user?.profile_photo_url
                      ? <img src={user.profile_photo_url} alt="Profile" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                      : initial}
                  </div>

                  <h2 style={{ margin:"0 0 3px", fontSize:20, fontWeight:700, color:"#fff", letterSpacing:"-.3px" }}>{fullName}</h2>
                  <p style={{ margin:"0 0 14px", fontSize:13, color:"rgba(255,255,255,.7)" }}>
                    {user?.student_id ? `${user.student_id} · ` : ""}
                    {user?.year_level ?? ""}
                  </p>

                  {/* Real profile tags */}
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {profileTags.length > 0
                      ? profileTags.map(t => (
                          <span key={t} style={{ background:"rgba(255,255,255,.18)", color:"#fff", borderRadius:99, padding:"3px 11px", fontSize:11, fontWeight:600, backdropFilter:"blur(4px)" }}>
                            {t}
                          </span>
                        ))
                      : (
                          <span style={{ background:"rgba(255,255,255,.18)", color:"rgba(255,255,255,.7)", borderRadius:99, padding:"3px 11px", fontSize:11, fontWeight:600 }}>
                            No profile info yet — <Link to="/student/account-settings" style={{ color:"#fff" }}>add it in Settings</Link>
                          </span>
                        )
                    }
                  </div>

                  <Link to="/student/account-settings" style={{
                    marginTop:16, background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.3)",
                    borderRadius:10, padding:"6px 14px", fontSize:12, fontWeight:600, color:"#fff",
                    display:"inline-flex", alignItems:"center", gap:6,
                    backdropFilter:"blur(4px)", textDecoration:"none"
                  }}>
                    <i className="bi bi-pencil-square"></i>Edit Profile
                  </Link>
                </div>
              </div>

              {/* 2 ── GPA chip */}
              <div className="stat-chip fade-up d-flex flex-column justify-content-between" style={{ minHeight:130 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <p style={{ margin:0, fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>GPA</p>
                    <p style={{ margin:"6px 0 0", fontSize:36, fontWeight:700, color:"#0f172a", letterSpacing:"-1.5px", lineHeight:1 }}>3.84</p>
                  </div>
                  <div style={{ width:36, height:36, borderRadius:10, background:"#e8f0fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <i className="bi bi-mortarboard" style={{ color:"#0056b3", fontSize:16 }}></i>
                  </div>
                </div>
                <div>
                  <div className="prog-track" style={{ marginBottom:4 }}>
                    <div className="prog-fill" style={{ width:"96%", background:"#0056b3" }}/>
                  </div>
                  <span style={{ fontSize:11, color:"#22c55e", fontWeight:600 }}>▲ +0.19 this semester</span>
                </div>
              </div>

              {/* 3 ── Credits chip */}
              <div className="stat-chip fade-up d-flex flex-column justify-content-between" style={{ minHeight:130 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <p style={{ margin:0, fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>Credits</p>
                    <p style={{ margin:"6px 0 0", fontSize:32, fontWeight:700, color:"#0f172a", letterSpacing:"-1px", lineHeight:1 }}>
                      92<span style={{ fontSize:16, color:"#94a3b8", fontWeight:400 }}>/120</span>
                    </p>
                  </div>
                  <div style={{ width:36, height:36, borderRadius:10, background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <i className="bi bi-book" style={{ color:"#22c55e", fontSize:16 }}></i>
                  </div>
                </div>
                <div>
                  <div className="prog-track" style={{ marginBottom:4 }}>
                    <div className="prog-fill" style={{ width:"76.6%", background:"#22c55e" }}/>
                  </div>
                  <span style={{ fontSize:11, color:"#22c55e", fontWeight:600 }}>76.6% complete</span>
                </div>
              </div>

              {/* 4 ── Class Rank chip */}
              <div className="stat-chip fade-up d-flex flex-column justify-content-between" style={{ minHeight:130 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <p style={{ margin:0, fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>Class Rank</p>
                    <p style={{ margin:"6px 0 0", fontSize:36, fontWeight:700, color:"#0f172a", letterSpacing:"-1.5px", lineHeight:1 }}>#14</p>
                  </div>
                  <div style={{ width:36, height:36, borderRadius:10, background:"#fdf2f8", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <i className="bi bi-trophy" style={{ color:"#a855f7", fontSize:16 }}></i>
                  </div>
                </div>
                <span style={{ fontSize:11, color:"#a855f7", fontWeight:600 }}>Top 5% of batch</span>
              </div>

              {/* 5 ── Active Subjects chip */}
              <div className="stat-chip fade-up d-flex flex-column justify-content-between" style={{ minHeight:130 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <p style={{ margin:0, fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>Subjects</p>
                    <p style={{ margin:"6px 0 0", fontSize:36, fontWeight:700, color:"#0f172a", letterSpacing:"-1.5px", lineHeight:1 }}>6</p>
                  </div>
                  <div style={{ width:36, height:36, borderRadius:10, background:"#fff7ed", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <i className="bi bi-journal-text" style={{ color:"#f59e0b", fontSize:16 }}></i>
                  </div>
                </div>
                <span style={{ fontSize:11, color:"#f59e0b", fontWeight:600 }}>Current semester</span>
              </div>

              {/* 6 ── Contact info — always shows real data */}
              <div className="dash-card fade-up" style={{ padding:20 }}>
                <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, color:"#0f172a" }}>Contact Info</h3>
                {[
                  { icon:"bi-envelope",     color:"#0056b3", label:"Email",      val: user?.email      ?? "—" },
                  { icon:"bi-telephone",    color:"#22c55e", label:"Phone",      val: user?.phone      ?? "Not set" },
                  { icon:"bi-person-badge", color:"#a855f7", label:"Student ID", val: user?.student_id ?? "Not set" },
                  { icon:"bi-building",     color:"#f59e0b", label:"Course",     val: user?.course     ?? "Not set" },
                ].map(row => (
                  <div key={row.label} className="info-row">
                    <div style={{ width:28, height:28, borderRadius:8, background:row.color+"18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <i className={`bi ${row.icon}`} style={{ color:row.color, fontSize:12 }}></i>
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:10, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".04em" }}>{row.label}</p>
                      <p style={{ margin:0, fontSize:12, fontWeight:500, color: row.val === "Not set" ? "#94a3b8" : "#1e293b", wordBreak:"break-word", fontStyle: row.val === "Not set" ? "italic" : "normal" }}>
                        {row.val}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 7 ── Detail tabs — spans 3 */}
              <div className="dash-card bento-span3 fade-up" style={{ padding:0 }}>
                <div style={{ padding:"14px 20px 0", borderBottom:"1px solid #f1f5f9", display:"flex", gap:6 }}>
                  {[
                    { key:"about",    label:"About"    },
                    { key:"courses",  label:"Courses"  },
                    { key:"activity", label:"Activity" },
                  ].map(t => (
                    <button key={t.key} className={`tab-pill${activeTab === t.key ? " active" : ""}`}
                      onClick={() => setActiveTab(t.key)}>
                      {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ padding:"20px" }}>
                  {/* About */}
                  {activeTab === "about" && (
                    <div>
                      <h3 style={{ margin:"0 0 10px", fontSize:14, fontWeight:700, color:"#0f172a" }}>Student Bio</h3>
                      <p style={{ margin:"0 0 20px", fontSize:13, color:"#64748b", lineHeight:1.7 }}>
                        {fullName} is a {user?.year_level ? user.year_level.toLowerCase() : "current"} Computer Science student
                        with strong interests in software engineering, cybersecurity, and data analytics.
                        Consistently maintaining academic excellence while actively participating in tech-related student organizations.
                      </p>
                      <h3 style={{ margin:"0 0 10px", fontSize:14, fontWeight:700, color:"#0f172a" }}>Academic Interests</h3>
                      <div>
                        {INTERESTS.map(t => <span key={t} className="interest-tag">{t}</span>)}
                      </div>
                    </div>
                  )}

                  {/* Courses */}
                  {activeTab === "courses" && (
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                        <thead>
                          <tr style={{ borderBottom:"1px solid #f1f5f9" }}>
                            {["Code","Course Name","Schedule","Instructor","Status"].map((h,i) => (
                              <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".04em", whiteSpace:"nowrap" }}
                                className={i===2?"d-none d-md-table-cell":i===3?"d-none d-sm-table-cell":""}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {COURSES.map(c => (
                            <tr key={c.code} style={{ borderBottom:"1px solid #f8faff" }}
                              onMouseEnter={e=>e.currentTarget.style.background="#f8faff"}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <td style={{ padding:"10px 12px", fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:500, color:"#0056b3" }}>{c.code}</td>
                              <td style={{ padding:"10px 12px", fontWeight:600, color:"#1e293b" }}>{c.name}</td>
                              <td style={{ padding:"10px 12px", color:"#64748b", fontSize:12 }} className="d-none d-md-table-cell">{c.sched}</td>
                              <td style={{ padding:"10px 12px", color:"#64748b" }} className="d-none d-sm-table-cell">{c.inst}</td>
                              <td style={{ padding:"10px 12px" }}>
                                <span style={{ background:"#f0fdf4", color:"#22c55e", borderRadius:99, padding:"2px 9px", fontSize:11, fontWeight:700 }}>Active</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Activity */}
                  {activeTab === "activity" && (
                    <div>
                      {ACTIVITY.map((a, i) => (
                        <div key={i} className="activity-row">
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:32, height:32, borderRadius:8, background:a.color+"18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              <i className={`bi ${a.icon}`} style={{ color:a.color, fontSize:13 }}></i>
                            </div>
                            <span style={{ fontSize:13, color:"#1e293b" }}>{a.text}</span>
                          </div>
                          <span style={{ fontSize:11, color:"#94a3b8", fontWeight:500, flexShrink:0 }}>{a.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>{/* /bento */}
          </main>
        </div>

        <BottomNav active=""/>
      </div>
    </>
  );
};

export default StudentProfile;