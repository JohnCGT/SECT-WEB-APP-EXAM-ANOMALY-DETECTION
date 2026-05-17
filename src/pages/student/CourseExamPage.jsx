import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../../lib/api";

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
  .topbar{
    background:rgba(255,255,255,0.82);backdrop-filter:blur(16px);
    -webkit-backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(0,86,179,.08);
    position:sticky;top:0;z-index:100;height:56px;
  }
  .glass-sidebar{
    background:rgba(255,255,255,0.60);
    backdrop-filter:blur(20px) saturate(180%);
    -webkit-backdrop-filter:blur(20px) saturate(180%);
    border-right:1px solid rgba(255,255,255,0.80);
    box-shadow:4px 0 24px rgba(0,86,179,.07);
  }
  .nav-pill{
    display:flex;flex-direction:column;align-items:center;
    padding:10px 8px;border-radius:12px;gap:4px;
    font-size:11px;font-weight:600;text-decoration:none;
    color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;
  }
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .avatar{
    width:34px;height:34px;border-radius:50%;
    background:var(--blue);color:#fff;
    display:flex;align-items:center;justify-content:center;
    font-size:14px;font-weight:700;flex-shrink:0;
  }
  .dash-card{
    background:var(--card-bg);border-radius:var(--card-br);
    box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);
    transition:box-shadow .2s,transform .2s;overflow:hidden;
  }
  .exam-card{
    background:var(--card-bg);border-radius:var(--card-br);
    box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);
    transition:box-shadow .22s,transform .22s,border-color .22s;
    overflow:hidden;display:flex;flex-direction:column;
  }
  .exam-card:hover{
    box-shadow:0 4px 24px rgba(0,86,179,.13);
    transform:translateY(-3px);border-color:rgba(0,86,179,.18);
  }
  .stat-pip{
    flex:1;background:#f8faff;border-radius:10px;padding:10px 8px;
    text-align:center;border:1px solid rgba(0,86,179,.06);
  }
  .prog-track{height:5px;border-radius:99px;background:#eef2ff;overflow:hidden;}
  .prog-fill{height:100%;border-radius:99px;transition:width 1s cubic-bezier(.4,0,.2,1);}
  .tag{display:inline-flex;align-items:center;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;}
  .back-btn{
    display:inline-flex;align-items:center;gap:6px;
    background:transparent;border:1px solid #e2e8f0;border-radius:10px;
    padding:6px 14px;font-size:12px;font-weight:600;color:var(--slate);
    cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:none;
    transition:border-color .15s,color .15s;
  }
  .back-btn:hover{border-color:var(--blue);color:var(--blue);}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .35s ease both;}
  .fade-up:nth-child(1){animation-delay:.04s}.fade-up:nth-child(2){animation-delay:.08s}
  .fade-up:nth-child(3){animation-delay:.12s}.fade-up:nth-child(4){animation-delay:.16s}
  .fade-up:nth-child(5){animation-delay:.20s}.fade-up:nth-child(6){animation-delay:.24s}
  .bottom-nav{
    position:fixed;bottom:0;left:0;right:0;height:64px;
    background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);
    border-top:1px solid rgba(0,86,179,0.10);
    display:flex;align-items:stretch;z-index:1030;
    box-shadow:0 -4px 24px rgba(0,86,179,0.08);
  }
  .bottom-nav a{
    flex:1;display:flex;flex-direction:column;align-items:center;
    justify-content:center;font-size:10px;font-weight:600;gap:3px;
    text-decoration:none;color:#94a3b8;transition:color .2s;
    border-top:2px solid transparent;
  }
  .bottom-nav a.active{color:#0056b3;border-top-color:#0056b3;}
  .bottom-nav a i{font-size:19px;}
`;

const NAV_ITEMS = [
  { to:"/student",                  icon:"bi-speedometer2",     label:"Home"     },
  { to:"/student/subjects",         icon:"bi-journal-bookmark", label:"Subjects" },
  { to:"/student/exams",            icon:"bi-pencil-square",    label:"Exams"    }, // ← consistent with all other pages
  { to:"/student/grades",           icon:"bi-graph-up-arrow",   label:"Grades"   },
  { to:"/student/account-settings", icon:"bi-gear",             label:"Settings" },
];

const STATUS = {
  submitted:{ color:"#22c55e", bg:"#f0fdf4", label:"Submitted" },
  open:     { color:"#0056b3", bg:"#e8f0fe", label:"Open"      },
  upcoming: { color:"#f59e0b", bg:"#fff7ed", label:"Upcoming"  },
  ended:    { color:"#94a3b8", bg:"#f1f5f9", label:"Ended"     },
};

const getStatus = (exam) => {
  if (exam.submission?.status === "submitted") return "submitted";
  const now = new Date();
  if (new Date(exam.end_time)   < now) return "ended";
  if (new Date(exam.start_time) > now) return "upcoming";
  return "open";
};

/* ─── Bottom Nav ─── */
const BottomNav = ({ active }) => (
  <nav className="bottom-nav d-lg-none">
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={active === label ? "active" : ""}>
        <i className={`bi ${icon}`}></i>{label}
      </Link>
    ))}
  </nav>
);

/* ─── Topbar ─── */
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

/* ─── Sidebar ─── */
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

/* ══════════════════════════════════════
   COURSE EXAM PAGE
══════════════════════════════════════ */
const CourseExamPage = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const [user, setUser]       = useState(null);
  const [course, setCourse]   = useState(null);
  const [exams, setExams]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [uRes, cRes, eRes] = await Promise.all([
          API.get("/me"),
          API.get(`/student/courses/${courseId}`),
          API.get(`/student/courses/${courseId}/exams`),
        ]);
        setUser(uRes.data.user);
        setCourse(cRes.data.course);
        setExams(eRes.data.exams || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load exams.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/");
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f0f4fb" }}>
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  const submitted = exams.filter(e => e.submission?.status === "submitted").length;
  const open      = exams.filter(e => getStatus(e) === "open").length;
  const upcoming  = exams.filter(e => getStatus(e) === "upcoming").length;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ background:"#f0f4fb", minHeight:"100vh" }}>

        <Topbar user={user} onLogout={handleLogout} />

        <div className="d-flex align-items-stretch">

          {/* ↓ FIXED: was "Subjects", now "Exams" so the pill highlights correctly */}
          <Sidebar active="Exams" />

          <main style={{ flex:1, padding:"24px 20px", paddingBottom:100, minWidth:0 }}>

            {/* Back + page header */}
            <div style={{ marginBottom:24 }}>
              {/* ↓ Back button now goes to /student/exams (the Exams hub) */}
              <Link to="/student/exams" className="back-btn" style={{ marginBottom:14, display:"inline-flex" }}>
                <i className="bi bi-arrow-left"></i>Back to Exams
              </Link>
              {course && (
                <>
                  <p style={{ margin:0, fontSize:12, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>
                    {course.code}
                  </p>
                  <h1 style={{ margin:"4px 0 4px", fontSize:24, fontWeight:700, color:"#0f172a", letterSpacing:"-.4px" }}>
                    {course.name}
                  </h1>
                  <p style={{ margin:0, fontSize:13, color:"#64748b" }}>
                    {course.instructor?.name && <><i className="bi bi-person me-1"></i>{course.instructor.name} · </>}
                    {exams.length} exam{exams.length !== 1 ? "s" : ""} in this course
                  </p>
                </>
              )}
            </div>

            {/* Stats strip */}
            {exams.length > 0 && (
              <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
                {[
                  { label:"Total Exams", val:exams.length, color:"#0056b3", bg:"#e8f0fe" },
                  { label:"Open Now",    val:open,         color:"#0056b3", bg:"#e8f0fe" },
                  { label:"Upcoming",    val:upcoming,     color:"#f59e0b", bg:"#fff7ed" },
                  { label:"Submitted",   val:submitted,    color:"#22c55e", bg:"#f0fdf4" },
                ].map(s => (
                  <div key={s.label} className="fade-up" style={{
                    background:s.bg, borderRadius:12, padding:"10px 16px",
                    display:"flex", alignItems:"center", gap:10, minWidth:110
                  }}>
                    <span style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.val}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:s.color, opacity:.8 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"12px 16px", marginBottom:20, display:"flex", gap:10, alignItems:"flex-start" }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ color:"#ef4444", marginTop:2 }}></i>
                <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#dc2626" }}>{error}</p>
              </div>
            )}

            {/* Empty state */}
            {!error && exams.length === 0 && (
              <div style={{ textAlign:"center", padding:"80px 24px", color:"#94a3b8" }}>
                <i className="bi bi-file-earmark-x" style={{ fontSize:52, display:"block", marginBottom:16, opacity:.4 }}></i>
                <p style={{ margin:0, fontSize:15, fontWeight:700, color:"#64748b" }}>No exams published yet</p>
                <p style={{ margin:"6px 0 0", fontSize:13 }}>Your instructor hasn't published any exams for this course.</p>
              </div>
            )}

            {/* Exam cards grid */}
            {!error && exams.length > 0 && (
              <div style={{ display:"grid", gap:16, gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))" }}>
                {exams.map((exam, idx) => {
                  const status  = getStatus(exam);
                  const st      = STATUS[status];
                  const done    = status === "submitted";
                  const takable = status === "open";
                  const pct     = done && exam.submission?.total_points > 0
                    ? Math.round((exam.submission.score / exam.submission.total_points) * 100) : null;
                  const scoreColor = pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";

                  return (
                    <div key={exam.id} className="exam-card fade-up"
                      style={{ animationDelay:`${idx * 0.05}s`, borderTop:`3px solid ${st.color}` }}>

                      <div style={{ padding:"18px 20px 0" }}>
                        {/* Status + type row */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                          <span style={{ background:st.bg, color:st.color, borderRadius:99, padding:"2px 10px", fontSize:11, fontWeight:700 }}>
                            {st.label}
                          </span>
                          <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"capitalize" }}>
                            {exam.type}
                          </span>
                        </div>
                        {/* Title */}
                        <h3 style={{ margin:"0 0 6px", fontSize:15, fontWeight:700, color:"#0f172a", lineHeight:1.3 }}>{exam.title}</h3>
                        {exam.description && (
                          <p style={{ margin:"0 0 14px", fontSize:12, color:"#64748b", lineHeight:1.5 }}>{exam.description}</p>
                        )}
                      </div>

                      {/* Stat pips */}
                      <div style={{ display:"flex", gap:8, padding:"0 20px", marginBottom:14 }}>
                        {[
                          { val:exam.questions_count,        label:"Questions" },
                          { val:`${exam.duration_minutes}m`, label:"Duration"  },
                          { val:exam.total_points,           label:"Points"    },
                        ].map(s => (
                          <div key={s.label} className="stat-pip">
                            <div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{s.val}</div>
                            <div style={{ fontSize:10, fontWeight:600, color:"#94a3b8", marginTop:1 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Date range */}
                      <div style={{ padding:"0 20px", marginBottom:14 }}>
                        <p style={{ margin:0, fontSize:11, color:"#94a3b8" }}>
                          <i className="bi bi-calendar3 me-1"></i>
                          {new Date(exam.start_time).toLocaleString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                          {" – "}
                          {new Date(exam.end_time).toLocaleString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </p>
                      </div>

                      {/* Score bar if submitted */}
                      {done && pct !== null && (
                        <div style={{ padding:"0 20px", marginBottom:14 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>Your Score</span>
                            <span style={{ fontSize:11, fontWeight:700, color:scoreColor }}>
                              {exam.submission.score}/{exam.submission.total_points} ({pct}%)
                            </span>
                          </div>
                          <div className="prog-track">
                            <div className="prog-fill" style={{ width:`${pct}%`, background:scoreColor }}/>
                          </div>
                        </div>
                      )}

                      {/* CTA */}
                      <div style={{ padding:"0 20px 20px", marginTop:"auto" }}>
                        {takable && (
                          <Link to={`/student/exams/${exam.id}/take`} style={{
                            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                            background:"#0056b3", color:"#fff", borderRadius:10, padding:"10px",
                            fontSize:13, fontWeight:700, textDecoration:"none", transition:"opacity .15s"
                          }} onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
                             onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                            <i className="bi bi-pencil-square"></i>Take Exam
                          </Link>
                        )}
                        {done && (
                          <Link to={`/student/exams/${exam.id}/results`} style={{
                            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                            background:"#f0fdf4", color:"#22c55e", border:"1px solid #bbf7d0",
                            borderRadius:10, padding:"10px", fontSize:13, fontWeight:700,
                            textDecoration:"none", transition:"background .15s"
                          }} onMouseEnter={e=>e.currentTarget.style.background="#dcfce7"}
                             onMouseLeave={e=>e.currentTarget.style.background="#f0fdf4"}>
                            <i className="bi bi-bar-chart"></i>View Results
                          </Link>
                        )}
                        {!takable && !done && (
                          <div style={{
                            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                            background:"#f8faff", color:"#94a3b8", border:"1px solid #e2e8f0",
                            borderRadius:10, padding:"10px", fontSize:13, fontWeight:600
                          }}>
                            {status === "upcoming"
                              ? <><i className="bi bi-clock"></i>Not Started Yet</>
                              : <><i className="bi bi-lock"></i>Exam Ended</>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* ↓ FIXED: was "Subjects", now "Exams" */}
        <BottomNav active="Exams" />
      </div>
    </>
  );
};

export default CourseExamPage;