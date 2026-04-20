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
  .exam-detail-row{padding:10px 12px;border-radius:10px;background:#f8faff;border:1px solid #f1f5f9;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;gap:12;}
  .exam-detail-row:last-child{margin-bottom:0;}
  .skeleton{background:linear-gradient(90deg,#f0f4fb 25%,#e8eef8 50%,#f0f4fb 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
`;

const NAV_ITEMS = [
  { to:"/student",                  icon:"bi-speedometer2",    label:"Home"    },
  { to:"/student/subjects",         icon:"bi-journal-bookmark",label:"Subjects"},
  { to:"/student/exams",            icon:"bi-pencil-square",   label:"Exams"   },
  { to:"/student/grades",           icon:"bi-graph-up-arrow",  label:"Grades"  },
  { to:"/student/account-settings", icon:"bi-gear",            label:"Settings"},
];

// Accent palette cycling per course card
const COURSE_ACCENTS = [
  { icon:"bi-code-slash",   accent:"#0056b3", iconBg:"#e8f0fe"  },
  { icon:"bi-database",     accent:"#f59e0b", iconBg:"#fff7ed"  },
  { icon:"bi-palette",      accent:"#ec4899", iconBg:"#fdf2f8"  },
  { icon:"bi-hdd-network",  accent:"#22c55e", iconBg:"#f0fdf4"  },
  { icon:"bi-lightning",    accent:"#a855f7", iconBg:"#faf5ff"  },
  { icon:"bi-globe",        accent:"#0ea5e9", iconBg:"#f0f9ff"  },
];
const getAccent = (i) => COURSE_ACCENTS[i % COURSE_ACCENTS.length];

// Derive grade color from letter
const gradeColor = (letter) => {
  if (!letter) return "#94a3b8";
  if (letter.startsWith("A")) return "#22c55e";
  if (letter.startsWith("B")) return "#0056b3";
  if (letter.startsWith("C")) return "#f59e0b";
  return "#ef4444";
};

// Exam type badge color
const typeColor = (type) => {
  const map = { midterm:"#0056b3", final:"#a855f7", quiz:"#22c55e", prelim:"#f59e0b" };
  return map[type] || "#64748b";
};
const typeBg = (type) => {
  const map = { midterm:"#e8f0fe", final:"#faf5ff", quiz:"#f0fdf4", prelim:"#fff7ed" };
  return map[type] || "#f1f5f9";
};

/* ─── Sparkline ─────────────────────────────────────────── */
const Sparkline = ({ data, color = "#0056b3", h = 32 }) => {
  if (!data || data.length < 2) return null;
  const w = 80, max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`
  ).join(" ");
  const lastPt = pts.split(" ").pop().split(",");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill={color} />
    </svg>
  );
};

/* ─── Sub-components ────────────────────────────────────── */
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
            <div className="avatar">{initial}</div>
            <span className="d-none d-sm-inline" style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{firstName}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius:12, fontSize:13 }}>
            <li><Link className="dropdown-item" to="/student/profile">My Profile</Link></li>
            <li><hr className="dropdown-divider" /></li>
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

/* ─── Loading skeleton ──────────────────────────────────── */
const SkeletonGrades = () => (
  <div className="bento">
    <div className="skeleton bento-span2" style={{ height:160 }} />
    <div className="skeleton" style={{ height:160 }} />
    <div className="skeleton" style={{ height:140 }} />
    <div className="skeleton" style={{ height:140 }} />
    <div className="skeleton dash-card bento-span2" style={{ height:320 }} />
    <div className="skeleton dash-card" style={{ height:160 }} />
    <div className="skeleton dash-card" style={{ height:160 }} />
  </div>
);

/* ══════════════════════════════════════
   GRADES PAGE
══════════════════════════════════════ */
const GradesPage = () => {
  const navigate  = useNavigate();
  const [user,    setUser]    = useState(null);
  const [data,    setData]    = useState(null);   // { gpa, enrolled_credits, graded_credits, courses }
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [activeTab, setActiveTab] = useState("current");
  // Which course row is expanded to show exam breakdown
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [uRes, gRes] = await Promise.all([
          API.get("/me"),
          API.get("/student/grades"),
        ]);
        setUser(uRes.data.user);
        setData(gRes.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load grades.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/");
  };

  // ── Derived stats ──────────────────────────────────────
  const courses       = data?.courses ?? [];
  const gpa           = data?.gpa ?? null;
  const gradedCourses = courses.filter(c => c.average !== null);

  // Avg score across all graded courses
  const avgScore = gradedCourses.length > 0
    ? (gradedCourses.reduce((s, c) => s + c.average, 0) / gradedCourses.length).toFixed(1)
    : null;

  // Sparkline data: percentages of submitted exams in order
  const sparkData = courses.flatMap(c =>
    c.exams.filter(e => e.submitted && e.percentage !== null).map(e => e.percentage)
  );

  // "History" tab: courses grouped by semester (anything not the latest semester)
  const semesters = [...new Set(courses.map(c => c.semester).filter(Boolean))];
  // Latest semester = first one with submitted exams, or just the first
  const currentSemester = semesters[0] ?? null;

  // Courses for current tab
  const currentCourses = activeTab === "current"
    ? courses.filter(c => !c.semester || c.semester === currentSemester)
    : courses.filter(c => c.semester && c.semester !== currentSemester);

  // Enrolled credits display
  const enrolledCredits = data?.enrolled_credits ?? 0;
  // Assume max credits for degree = 120 (same as before)
  const TOTAL_CREDITS = 120;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ background:"#f0f4fb", minHeight:"100vh" }}>

        <Topbar user={user} onLogout={handleLogout} />

        <div className="d-flex align-items-stretch">
          <Sidebar active="Grades" />

          <main style={{ flex:1, padding:"24px 20px", paddingBottom:100, minWidth:0 }}>

            {/* Page header — print/export buttons removed */}
            <div style={{ marginBottom:24 }}>
              <p style={{ margin:0, fontSize:12, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>Academic</p>
              <h1 style={{ margin:"4px 0 4px", fontSize:24, fontWeight:700, color:"#0f172a", letterSpacing:"-.4px" }}>Performance</h1>
              <p style={{ margin:0, fontSize:13, color:"#64748b" }}>
                Grades & Analytics{currentSemester ? ` · ${currentSemester}` : ""}
              </p>
            </div>

            {/* Error state */}
            {error && (
              <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"14px 18px", marginBottom:24, display:"flex", gap:10, alignItems:"flex-start" }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ color:"#ef4444", marginTop:2 }}></i>
                <div>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#dc2626" }}>Could not load grades</p>
                  <p style={{ margin:"2px 0 0", fontSize:12, color:"#64748b" }}>{error}</p>
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && <SkeletonGrades />}

            {/* ── Main content ── */}
            {!loading && !error && (
              /* Outer 2-col split: left = main content, right = sidebar column (stacks naturally) */
              <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:16, alignItems:"start" }}>

                {/* ── LEFT COLUMN ── */}
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                  {/* Row 1: GPA banner + stat chips */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

                    {/* Hero: GPA banner — spans both cols */}
                    <div className="dash-card fade-up" style={{
                      gridColumn:"span 2",
                      padding:24,
                      background: gpa !== null
                        ? "linear-gradient(135deg,#0056b3 0%,#1a6ed8 60%,#4d90fe 100%)"
                        : "linear-gradient(135deg,#64748b 0%,#94a3b8 100%)",
                      border:"none", position:"relative", overflow:"hidden"
                    }}>
                      <div style={{ position:"absolute", right:-40, top:-40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,.07)" }}/>
                      <div style={{ position:"absolute", right:30, bottom:-50, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,.04)" }}/>
                      <p style={{ margin:0, fontSize:11, fontWeight:600, color:"rgba(255,255,255,.6)", textTransform:"uppercase", letterSpacing:".06em" }}>Overall GPA</p>
                      {gpa !== null ? (
                        <div style={{ display:"flex", alignItems:"flex-end", gap:16, marginTop:6, marginBottom:14 }}>
                          <span style={{ fontSize:52, fontWeight:700, color:"#fff", lineHeight:1, letterSpacing:"-2px" }}>{gpa.toFixed(2)}</span>
                          <div style={{ paddingBottom:6 }}>
                            <span style={{ fontSize:13, color:"rgba(255,255,255,.75)", display:"block" }}>
                              {gradedCourses.length} course{gradedCourses.length !== 1 ? "s" : ""} graded
                            </span>
                            <span style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>
                              {gpa >= 3.5 ? "Dean's List eligible" : gpa >= 3.0 ? "Good standing" : "Keep it up!"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:8, marginBottom:14 }}>
                          <span style={{ fontSize:28, fontWeight:700, color:"rgba(255,255,255,.5)" }}>—</span>
                          <span style={{ fontSize:13, color:"rgba(255,255,255,.6)" }}>No exams submitted yet</span>
                        </div>
                      )}
                      <div style={{ height:5, borderRadius:99, background:"rgba(255,255,255,.2)", overflow:"hidden" }}>
                        <div style={{ height:"100%", width: gpa !== null ? `${Math.min(100,(gpa/4)*100)}%` : "0%", borderRadius:99, background:"#fff", transition:"width 1s" }}/>
                      </div>
                    </div>

                    {/* Credits chip */}
                    <div className="stat-chip fade-up d-flex flex-column justify-content-between" style={{ minHeight:140 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div>
                          <p style={{ margin:0, fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>Credits</p>
                          <p style={{ margin:"6px 0 0", fontSize:28, fontWeight:700, color:"#0f172a", letterSpacing:"-1px", lineHeight:1 }}>
                            {enrolledCredits}
                            <span style={{ fontSize:16, color:"#94a3b8", fontWeight:400 }}> / {TOTAL_CREDITS}</span>
                          </p>
                        </div>
                        <div style={{ width:36, height:36, borderRadius:10, background:"#e8f0fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <i className="bi bi-mortarboard" style={{ color:"#0056b3", fontSize:16 }}></i>
                        </div>
                      </div>
                      <div>
                        <div style={{ height:5, borderRadius:99, background:"#eef2ff", overflow:"hidden", marginBottom:4 }}>
                          <div style={{ height:"100%", width:`${Math.min(100,(enrolledCredits/TOTAL_CREDITS)*100)}%`, background:"#0056b3", borderRadius:99 }}/>
                        </div>
                        <span style={{ fontSize:11, color:"#0056b3", fontWeight:600 }}>
                          {((enrolledCredits/TOTAL_CREDITS)*100).toFixed(1)}% complete
                        </span>
                      </div>
                    </div>

                    {/* Avg score chip */}
                    <div className="stat-chip fade-up d-flex flex-column justify-content-between" style={{ minHeight:140 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div>
                          <p style={{ margin:0, fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>Avg Score</p>
                          <p style={{ margin:"6px 0 0", fontSize:36, fontWeight:700, color:"#0f172a", letterSpacing:"-1.5px", lineHeight:1 }}>
                            {avgScore ?? "—"}
                            {avgScore && <span style={{ fontSize:14, color:"#94a3b8", fontWeight:400 }}>%</span>}
                          </p>
                        </div>
                        <div style={{ width:36, height:36, borderRadius:10, background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <i className="bi bi-bar-chart" style={{ color:"#22c55e", fontSize:16 }}></i>
                        </div>
                      </div>
                      <div>
                        {sparkData.length >= 2
                          ? <><Sparkline data={sparkData} color="#22c55e" /><span style={{ fontSize:11, color:"#22c55e", fontWeight:600 }}>Exam trend</span></>
                          : <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>No exams yet</span>
                        }
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Grades table */}
                  <div className="dash-card fade-up" style={{ padding:0 }}>
                    {/* Tabs */}
                    <div style={{ padding:"16px 20px 0", borderBottom:"1px solid #f1f5f9", display:"flex", gap:6 }}>
                      {["current", "history"].map(t => (
                        <button key={t} className={`tab-pill${activeTab === t ? " active" : ""}`}
                          onClick={() => setActiveTab(t)}
                          style={{ padding:"5px 14px", fontSize:12 }}>
                          {t === "current" ? "Current Semester" : "All Courses"}
                        </button>
                      ))}
                    </div>

                    {/* Empty state */}
                    {currentCourses.length === 0 && (
                      <div style={{ padding:"48px 24px", textAlign:"center", color:"#94a3b8" }}>
                        <i className="bi bi-journal-x" style={{ fontSize:40, display:"block", marginBottom:12, opacity:.4 }}></i>
                        <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#64748b" }}>
                          {activeTab === "current" ? "No courses this semester" : "No course history yet"}
                        </p>
                      </div>
                    )}

                    {/* Course rows */}
                    {currentCourses.map((course, i) => {
                      const acc        = getAccent(i);
                      const gc         = gradeColor(course.letter_grade);
                      const isExpanded = expandedCourse === course.course_id;

                      return (
                        <div key={course.course_id}>
                          {/* Main row */}
                          <div
                            className="grade-row"
                            style={{ padding:"14px 20px", cursor:"pointer" }}
                            onClick={() => setExpandedCourse(isExpanded ? null : course.course_id)}
                          >
                            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                              <div style={{ width:36, height:36, borderRadius:10, background:acc.iconBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                <i className={`bi ${acc.icon}`} style={{ color:acc.accent, fontSize:16 }}></i>
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4, gap:8 }}>
                                  <div style={{ minWidth:0 }}>
                                    <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{course.course_name}</span>
                                    <span style={{ fontSize:11, color:"#94a3b8", marginLeft:6 }}>{course.course_code}</span>
                                  </div>
                                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                                    {course.letter_grade
                                      ? <span style={{ fontSize:13, fontWeight:700, color:gc }}>{course.letter_grade}</span>
                                      : <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>No grade yet</span>
                                    }
                                    {course.average !== null && (
                                      <span style={{ fontSize:12, fontWeight:600, color:"#64748b" }}>{course.average}%</span>
                                    )}
                                    <i className={`bi bi-chevron-${isExpanded ? "up" : "down"}`} style={{ fontSize:11, color:"#94a3b8" }}></i>
                                  </div>
                                </div>
                                <div className="prog-track">
                                  <div className="prog-fill" style={{ width:`${course.average ?? 0}%`, background:acc.accent }}/>
                                </div>
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:16, marginTop:10, paddingLeft:48 }} className="d-none d-sm-flex">
                              {[
                                { label:"Exams Total", val:course.total_exams },
                                { label:"Submitted",   val:`${course.submitted_exams} / ${course.total_exams}` },
                                { label:"GPA Points",  val:course.grade_points > 0 ? course.grade_points.toFixed(1) : "—" },
                                { label:"Credits",     val:course.credits },
                              ].map(d => (
                                <div key={d.label}>
                                  <p style={{ margin:0, fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:".04em" }}>{d.label}</p>
                                  <p style={{ margin:0, fontSize:12, fontWeight:600, color:"#1e293b" }}>{d.val}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Expanded exam breakdown */}
                          {isExpanded && (
                            <div style={{ background:"#f8faff", borderTop:"1px solid #f1f5f9", borderBottom:"1px solid #f1f5f9", padding:"12px 20px 16px 20px" }}>
                              <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>
                                Exam Breakdown
                              </p>
                              {course.exams.length === 0 ? (
                                <p style={{ margin:0, fontSize:12, color:"#94a3b8" }}>No exams published for this course yet.</p>
                              ) : (
                                course.exams.map(exam => {
                                  const scoreColor = exam.percentage === null ? "#94a3b8"
                                    : exam.percentage >= 75 ? "#22c55e"
                                    : exam.percentage >= 50 ? "#f59e0b"
                                    : "#ef4444";
                                  return (
                                    <div key={exam.id} className="exam-detail-row">
                                      <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                                        <span style={{
                                          background:typeBg(exam.type), color:typeColor(exam.type),
                                          borderRadius:99, padding:"2px 8px",
                                          fontSize:10, fontWeight:700, flexShrink:0, textTransform:"capitalize"
                                        }}>{exam.type}</span>
                                        <span style={{ fontSize:12, fontWeight:600, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                          {exam.title}
                                        </span>
                                      </div>
                                      <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
                                        {exam.submitted ? (
                                          <>
                                            <span style={{ fontSize:12, fontWeight:700, color:scoreColor }}>
                                              {exam.score}/{exam.total_points}
                                              {exam.percentage !== null && <span style={{ fontSize:11, color:scoreColor, marginLeft:4 }}>({exam.percentage}%)</span>}
                                            </span>
                                            <Link
                                              to={`/student/exams/${exam.id}/results`}
                                              onClick={e => e.stopPropagation()}
                                              style={{ fontSize:11, fontWeight:600, color:"#0056b3", textDecoration:"none", background:"#e8f0fe", borderRadius:99, padding:"2px 8px" }}>
                                              View Results
                                            </Link>
                                          </>
                                        ) : (
                                          <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>
                                            {new Date(exam.end_time) < new Date() ? "Missed" : "Pending"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                              {course.instructor && (
                                <p style={{ margin:"10px 0 0", fontSize:11, color:"#94a3b8" }}>
                                  <i className="bi bi-person me-1"></i>{course.instructor}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div style={{ padding:"10px 20px", borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"flex-end" }}>
                      <Link to="/student/subjects"
                        style={{ background:"transparent", border:"none", fontSize:12, fontWeight:600, color:"#0056b3", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", textDecoration:"none" }}>
                        View All Subjects →
                      </Link>
                    </div>
                  </div>

                  {/* Row 3: Upcoming exams */}
                  <div className="dash-card fade-up" style={{ padding:20 }}>
                    <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, color:"#0f172a" }}>Upcoming Exams</h3>
                    {(() => {
                      const now = new Date();
                      const upcoming = courses
                        .flatMap(c => c.exams.map(e => ({ ...e, course_code:c.course_code, course_id:c.course_id })))
                        .filter(e => !e.submitted && new Date(e.end_time) > now)
                        .sort((a, b) => new Date(a.end_time) - new Date(b.end_time))
                        .slice(0, 4);

                      if (upcoming.length === 0) return (
                        <p style={{ margin:0, fontSize:12, color:"#94a3b8" }}>No upcoming exams.</p>
                      );

                      const dotColors = ["#0056b3","#f59e0b","#ef4444","#22c55e"];
                      return upcoming.map((exam, i) => (
                        <div key={exam.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f8faff" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:dotColors[i % dotColors.length], flexShrink:0 }}/>
                            <div style={{ minWidth:0 }}>
                              <span style={{ fontSize:12, fontWeight:500, color:"#1e293b", display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {exam.title}
                              </span>
                              <span style={{ fontSize:10, color:"#94a3b8" }}>{exam.course_code}</span>
                            </div>
                          </div>
                          <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", flexShrink:0, marginLeft:8 }}>
                            {new Date(exam.end_time).toLocaleDateString("en-PH", { month:"short", day:"numeric" })}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>

                </div>{/* end LEFT COLUMN */}

                {/* ── RIGHT COLUMN — flex-column so cards stack to their natural height ── */}
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                  {/* Enrolled courses chip */}
                  <div className="stat-chip fade-up" style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <p style={{ margin:0, fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>Courses</p>
                        <p style={{ margin:"6px 0 0", fontSize:36, fontWeight:700, color:"#0f172a", letterSpacing:"-1.5px", lineHeight:1 }}>
                          {courses.length}
                          <span style={{ fontSize:16, color:"#94a3b8", fontWeight:400 }}> enrolled</span>
                        </p>
                      </div>
                      <div style={{ width:36, height:36, borderRadius:10, background:"#fdf2f8", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <i className="bi bi-journal-bookmark" style={{ color:"#ec4899", fontSize:16 }}></i>
                      </div>
                    </div>
                    <div>
                      <div style={{ height:5, borderRadius:99, background:"#eef2ff", overflow:"hidden", marginBottom:4 }}>
                        <div style={{ height:"100%", width:`${Math.min(100,(gradedCourses.length/Math.max(1,courses.length))*100)}%`, background:"linear-gradient(90deg,#ec4899,#0056b3)", borderRadius:99 }}/>
                      </div>
                      <span style={{ fontSize:11, color:"#ec4899", fontWeight:600 }}>
                        {gradedCourses.length} of {courses.length} with grades
                      </span>
                    </div>
                  </div>

                  {/* Course Averages bar chart */}
                  <div className="dash-card fade-up" style={{ padding:20 }}>
                    <h3 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:"#0f172a" }}>Course Averages</h3>
                    {courses.filter(c => c.average !== null).length === 0 ? (
                      <div style={{ textAlign:"center", padding:"20px 0", color:"#94a3b8", fontSize:12 }}>
                        No graded courses yet
                      </div>
                    ) : (
                      <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:100 }}>
                        {courses.filter(c => c.average !== null).map((c, i) => (
                          <div key={c.course_id} style={{ flex:1, textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}
                            title={`${c.course_name}: ${c.average}%`}>
                            <div style={{
                              width:"100%", borderRadius:"6px 6px 0 0",
                              background: i === courses.filter(x=>x.average!==null).length - 1 ? "#0056b3" : "#e8f0fe",
                              height:`${c.average}%`, minHeight:8
                            }}/>
                            <span style={{ fontSize:9, marginTop:4, fontWeight:600, color:"#94a3b8", overflow:"hidden", maxWidth:"100%", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {c.course_code}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>{/* end RIGHT COLUMN */}

              </div>
            )}
          </main>
        </div>

        <BottomNav active="Grades" />
      </div>
    </>
  );
};

export default GradesPage;