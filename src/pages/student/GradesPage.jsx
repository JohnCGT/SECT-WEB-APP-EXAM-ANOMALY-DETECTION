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
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);transition:box-shadow .2s,transform .2s;overflow:hidden;}
  .dash-card:hover{box-shadow:0 2px 6px rgba(0,0,0,.06),0 8px 28px rgba(0,86,179,.10);transform:translateY(-1px);}
  .stat-chip{background:var(--card-bg);border-radius:14px;padding:18px;border:1px solid rgba(0,86,179,.07);box-shadow:var(--card-sh);transition:box-shadow .2s,transform .2s;}
  .stat-chip:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,86,179,.12);}
  .prog-track{height:5px;border-radius:99px;background:#eef2ff;overflow:hidden;}
  .prog-fill{height:100%;border-radius:99px;transition:width 1s cubic-bezier(.4,0,.2,1);}
  .grade-row{padding:14px 0;border-bottom:1px solid #f1f5f9;transition:background .15s;}
  .grade-row:last-child{border-bottom:none;}
  .grade-row:hover{background:#f8faff;}
  .tab-pill{padding:6px 16px;border-radius:99px;border:none;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:var(--slate-lt);transition:background .15s,color .15s;font-family:'DM Sans',sans-serif;white-space:nowrap;}
  .tab-pill.active{background:var(--blue-lite);color:var(--blue);}
  .tab-pill:hover:not(.active){color:var(--slate);background:#f1f5f9;}
  .bento{display:grid;gap:16px;grid-template-columns:1fr 1fr 1fr;}
  .bento-span2{grid-column:span 2;}
  .bento-span3{grid-column:span 3;}
  @media(max-width:991px){.bento{grid-template-columns:1fr 1fr;}.bento-span2{grid-column:span 2;}.bento-span3{grid-column:span 2;}}
  @media(max-width:600px){.bento{grid-template-columns:1fr;}.bento-span2,.bento-span3{grid-column:span 1;}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .35s ease both;}
  .fade-up:nth-child(1){animation-delay:.05s}.fade-up:nth-child(2){animation-delay:.10s}.fade-up:nth-child(3){animation-delay:.15s}.fade-up:nth-child(4){animation-delay:.20s}.fade-up:nth-child(5){animation-delay:.25s}.fade-up:nth-child(6){animation-delay:.30s}
  .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bottom-nav a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;color:#94a3b8;transition:color .2s;border-top:2px solid transparent;}
  .bottom-nav a.active{color:#0056b3;border-top-color:#0056b3;}
  .bottom-nav a i{font-size:19px;}
`;

const NAV_ITEMS = [
  { to:"/student",                  icon:"bi-speedometer2",    label:"Home"    },
  { to:"/student/subjects",         icon:"bi-journal-bookmark",label:"Subjects"},
  { to:"/student/tasks",            icon:"bi-pencil-square",   label:"Tasks"   },
  { to:"/student/grades",           icon:"bi-graph-up-arrow",  label:"Grades"  },
  { to:"/student/account-settings", icon:"bi-gear",            label:"Settings"},
];

const GRADES = [
  { icon:"bi-code-slash",  accent:"#0056b3", iconBg:"#e8f0fe",  name:"Data Structures",      code:"CS-101", mid:88, assign:95, total:92.5, grade:"A",  gc:"#22c55e" },
  { icon:"bi-database",    accent:"#f59e0b", iconBg:"#fff7ed",  name:"Database Mgmt",         code:"DB-202", mid:76, assign:82, total:79.2, grade:"B+", gc:"#f59e0b" },
  { icon:"bi-palette",     accent:"#ec4899", iconBg:"#fdf2f8",  name:"UI / UX Principles",    code:"DS-301", mid:94, assign:98, total:96.4, grade:"A+", gc:"#22c55e" },
  { icon:"bi-hdd-network", accent:"#22c55e", iconBg:"#f0fdf4",  name:"System Architecture II",code:"SA-400", mid:81, assign:88, total:84.5, grade:"A-", gc:"#0056b3" },
];

const HISTORY = [
  { sem:"Spring Semester 2022", code:"S22", gpa:"3.92", credits:18, color:"#0056b3" },
  { sem:"Fall Semester 2021",   code:"F21", gpa:"3.75", credits:16, color:"#64748b" },
];

/* Micro sparkline */
const Sparkline = ({ data, color="#0056b3", h=32 }) => {
  const w=80, max=Math.max(...data), min=Math.min(...data), range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*(h-4)-2}`).join(" ");
  return (
    <svg width={w} height={h} style={{overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="3" fill={color}/>
    </svg>
  );
};

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

const GradesPage = () => {
  const navigate=useNavigate();
  const [user,setUser]=useState(null);
  const [activeTab,setActiveTab]=useState("current");

  useEffect(()=>{
    API.get("/me").then(r=>setUser(r.data.user)).catch(()=>{});
  },[]);

  const handleLogout=async()=>{
    try{await API.post("/logout");}catch{}
    localStorage.removeItem("user"); navigate("/");
  };

  const avgGrade=(GRADES.reduce((a,g)=>a+g.total,0)/GRADES.length).toFixed(1);

  return(
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{background:"#f0f4fb",minHeight:"100vh"}}>

        <Topbar user={user} onLogout={handleLogout}/>

        <div className="d-flex align-items-stretch">
          <Sidebar active="Grades"/>

          <main style={{flex:1,padding:"24px 20px",paddingBottom:100,minWidth:0}}>

            {/* Page header */}
            <div style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
              <div>
                <p style={{margin:0,fontSize:12,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em"}}>Academic</p>
                <h1 style={{margin:"4px 0 4px",fontSize:24,fontWeight:700,color:"#0f172a",letterSpacing:"-.4px"}}>Performance</h1>
                <p style={{margin:0,fontSize:13,color:"#64748b"}}>Grades & Analytics · Current Semester</p>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{background:"transparent",border:"1px solid #e2e8f0",borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:600,color:"#64748b",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6}}
                  className="d-none d-sm-flex">
                  <i className="bi bi-printer"></i>Print
                </button>
                <button style={{background:"#0056b3",border:"none",borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6}}>
                  <i className="bi bi-download"></i><span className="d-none d-sm-inline">Export Transcript</span><span className="d-sm-none">Export</span>
                </button>
              </div>
            </div>

            {/* Bento stats grid */}
            <div className="bento" style={{marginBottom:24}}>

              {/* Hero: GPA banner */}
              <div className="dash-card bento-span2 fade-up" style={{
                padding:24, background:"linear-gradient(135deg,#0056b3 0%,#1a6ed8 60%,#4d90fe 100%)",
                border:"none", position:"relative", overflow:"hidden"
              }}>
                <div style={{position:"absolute",right:-40,top:-40,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
                <div style={{position:"absolute",right:30,bottom:-50,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
                <p style={{margin:0,fontSize:11,fontWeight:600,color:"rgba(255,255,255,.6)",textTransform:"uppercase",letterSpacing:".06em"}}>Overall GPA</p>
                <div style={{display:"flex",alignItems:"flex-end",gap:16,marginTop:6,marginBottom:14}}>
                  <span style={{fontSize:52,fontWeight:700,color:"#fff",lineHeight:1,letterSpacing:"-2px"}}>3.84</span>
                  <div style={{paddingBottom:6}}>
                    <span style={{fontSize:13,color:"rgba(255,255,255,.75)",display:"block"}}>▲ +0.19 this semester</span>
                    <span style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>Dean's List · 3 consecutive semesters</span>
                  </div>
                </div>
                <div style={{height:5,borderRadius:99,background:"rgba(255,255,255,.2)",overflow:"hidden"}}>
                  <div style={{height:"100%",width:"96%",borderRadius:99,background:"#fff"}}/>
                </div>
              </div>

              {/* Class rank */}
              <div className="stat-chip fade-up d-flex flex-column justify-content-between" style={{minHeight:140}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <p style={{margin:0,fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em"}}>Class Rank</p>
                    <p style={{margin:"6px 0 0",fontSize:36,fontWeight:700,color:"#0f172a",letterSpacing:"-1.5px",lineHeight:1}}>#14</p>
                  </div>
                  <div style={{width:36,height:36,borderRadius:10,background:"#fdf2f8",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <i className="bi bi-trophy" style={{color:"#a855f7",fontSize:16}}></i>
                  </div>
                </div>
                <div>
                  <div style={{height:5,borderRadius:99,background:"#eef2ff",overflow:"hidden",marginBottom:4}}>
                    <div style={{height:"100%",width:"95%",background:"linear-gradient(90deg,#a855f7,#0056b3)",borderRadius:99}}/>
                  </div>
                  <span style={{fontSize:11,color:"#a855f7",fontWeight:600}}>Top 5% of batch</span>
                </div>
              </div>

              {/* Credits chip */}
              <div className="stat-chip fade-up d-flex flex-column justify-content-between" style={{minHeight:140}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <p style={{margin:0,fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em"}}>Credits</p>
                    <p style={{margin:"6px 0 0",fontSize:28,fontWeight:700,color:"#0f172a",letterSpacing:"-1px",lineHeight:1}}>92<span style={{fontSize:16,color:"#94a3b8",fontWeight:400}}> / 120</span></p>
                  </div>
                  <div style={{width:36,height:36,borderRadius:10,background:"#e8f0fe",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <i className="bi bi-mortarboard" style={{color:"#0056b3",fontSize:16}}></i>
                  </div>
                </div>
                <div>
                  <div style={{height:5,borderRadius:99,background:"#eef2ff",overflow:"hidden",marginBottom:4}}>
                    <div style={{height:"100%",width:"76.6%",background:"#0056b3",borderRadius:99}}/>
                  </div>
                  <span style={{fontSize:11,color:"#0056b3",fontWeight:600}}>76.6% complete</span>
                </div>
              </div>

              {/* Avg score chip */}
              <div className="stat-chip fade-up d-flex flex-column justify-content-between" style={{minHeight:140}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <p style={{margin:0,fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em"}}>Avg Score</p>
                    <p style={{margin:"6px 0 0",fontSize:36,fontWeight:700,color:"#0f172a",letterSpacing:"-1.5px",lineHeight:1}}>{avgGrade}<span style={{fontSize:14,color:"#94a3b8",fontWeight:400}}>%</span></p>
                  </div>
                  <div style={{width:36,height:36,borderRadius:10,background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <i className="bi bi-bar-chart" style={{color:"#22c55e",fontSize:16}}></i>
                  </div>
                </div>
                <div>
                  <Sparkline data={[85,87,88,90,91,88,avgGrade]} color="#22c55e"/>
                  <span style={{fontSize:11,color:"#22c55e",fontWeight:600}}>▲ Trending up</span>
                </div>
              </div>

              {/* Grades table — spans 2 */}
              <div className="dash-card bento-span2 fade-up" style={{padding:0}}>
                {/* Tabs */}
                <div style={{padding:"16px 20px 0",borderBottom:"1px solid #f1f5f9",display:"flex",gap:6}}>
                  {["current","history"].map(t=>(
                    <button key={t} className={`tab-pill${activeTab===t?" active":""}`}
                      onClick={()=>setActiveTab(t)}
                      style={{padding:"5px 14px",fontSize:12}}>
                      {t==="current"?"Current Semester":"History"}
                    </button>
                  ))}
                </div>

                {activeTab==="current" ? (
                  <div>
                    {GRADES.map((row,i)=>(
                      <div key={row.code} className="grade-row" style={{padding:"14px 20px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                          <div style={{width:36,height:36,borderRadius:10,background:row.iconBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <i className={`bi ${row.icon}`} style={{color:row.accent,fontSize:16}}></i>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                              <div>
                                <span style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{row.name}</span>
                                <span style={{fontSize:11,color:"#94a3b8",marginLeft:6}}>{row.code}</span>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <span style={{fontSize:13,fontWeight:700,color:row.gc}}>{row.grade}</span>
                                <span style={{fontSize:12,fontWeight:600,color:"#64748b"}}>{row.total}%</span>
                              </div>
                            </div>
                            <div className="prog-track">
                              <div className="prog-fill" style={{width:`${row.total}%`,background:row.accent}}/>
                            </div>
                          </div>
                        </div>
                        {/* Detail row */}
                        <div style={{display:"flex",gap:16,marginTop:10,paddingLeft:48}} className="d-none d-sm-flex">
                          {[
                            {label:"Midterm",val:`${row.mid}/100`},
                            {label:"Finals",val:"Pending"},
                            {label:"Assignments",val:`${row.assign}%`},
                          ].map(d=>(
                            <div key={d.label}>
                              <p style={{margin:0,fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em"}}>{d.label}</p>
                              <p style={{margin:0,fontSize:12,fontWeight:600,color:"#1e293b"}}>{d.val}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div style={{padding:"10px 20px",borderTop:"1px solid #f1f5f9",display:"flex",justifyContent:"flex-end"}}>
                      <button style={{background:"transparent",border:"none",fontSize:12,fontWeight:600,color:"#0056b3",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                        View Full Breakdown →
                      </button>
                    </div>
                  </div>
                ):(
                  <div style={{padding:"8px 0"}}>
                    {HISTORY.map(h=>(
                      <div key={h.code} style={{padding:"14px 20px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",transition:"background .15s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f8faff"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <div style={{width:36,height:36,borderRadius:10,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{fontSize:11,fontWeight:700,color:h.color}}>{h.code}</span>
                          </div>
                          <div>
                            <p style={{margin:0,fontSize:13,fontWeight:700,color:"#1e293b"}}>{h.sem}</p>
                            <p style={{margin:0,fontSize:12,color:"#94a3b8"}}>GPA: {h.gpa} · {h.credits} Credits</p>
                          </div>
                        </div>
                        <i className="bi bi-chevron-right" style={{color:"#94a3b8"}}></i>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* GPA Trend */}
              <div className="dash-card fade-up" style={{padding:20}}>
                <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700,color:"#0f172a"}}>GPA Trend</h3>
                <div style={{display:"flex",alignItems:"flex-end",gap:6,height:100}}>
                  {[{v:80,l:"Y1S1"},{v:85,l:"Y1S2"},{v:92,l:"Y2S1"},{v:90,l:"Y2S2"},{v:96,l:"Now"}].map((b,i)=>(
                    <div key={i} style={{flex:1,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%"}}>
                      <div style={{
                        width:"100%",borderRadius:"6px 6px 0 0",
                        background: i===4 ? "#0056b3" : "#e8f0fe",
                        height:`${b.v}%`, transition:"height .6s", minHeight:8
                      }}/>
                      <span style={{fontSize:9,marginTop:4,fontWeight:i===4?700:400,color:i===4?"#0056b3":"#94a3b8"}}>{b.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Assessments */}
              <div className="dash-card fade-up" style={{padding:20}}>
                <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:"#0f172a"}}>Upcoming Assessments</h3>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[
                    {dot:"#0056b3",label:"Algo Final Exam",date:"Dec 12"},
                    {dot:"#f59e0b",label:"DB Project Demo",date:"Dec 15"},
                    {dot:"#ef4444",label:"Portfolio Review",date:"Dec 18"},
                  ].map(a=>(
                    <div key={a.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f8faff"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:a.dot,flexShrink:0}}/>
                        <span style={{fontSize:13,fontWeight:500,color:"#1e293b"}}>{a.label}</span>
                      </div>
                      <span style={{fontSize:11,fontWeight:600,color:"#94a3b8"}}>{a.date}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>{/* /bento */}
          </main>
        </div>

        <BottomNav active="Grades"/>
      </div>
    </>
  );
};

export default GradesPage;