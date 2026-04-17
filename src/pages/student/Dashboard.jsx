import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";

/* ─────────────────────────────────────────────
   BOTTOM NAV
───────────────────────────────────────────── */
const BottomNav = ({ active }) => (
  <nav style={{
    position: "fixed", bottom: 0, left: 0, right: 0, height: 64,
    background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)",
    borderTop: "1px solid rgba(0,86,179,0.10)",
    display: "flex", alignItems: "stretch", zIndex: 1030,
    boxShadow: "0 -4px 24px rgba(0,86,179,0.08)"
  }} className="d-lg-none">
    {[
      { to: "/student",                  icon: "bi-speedometer2",    label: "Home"     },
      { to: "/student/subjects",         icon: "bi-journal-bookmark",label: "Subjects" },
      { to: "/student/grades",           icon: "bi-graph-up-arrow",  label: "Grades"   },
      { to: "/student/account-settings", icon: "bi-gear",            label: "Settings" },
    ].map(({ to, icon, label }) => (
      <Link key={to} to={to} style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", fontSize: 10, fontWeight: 600, gap: 3,
        textDecoration: "none",
        color: active === label ? "#0056b3" : "#94a3b8",
        transition: "color .2s",
        borderTop: active === label ? "2px solid #0056b3" : "2px solid transparent",
      }}>
        <i className={`bi ${icon}`} style={{ fontSize: 19 }}></i>
        {label}
      </Link>
    ))}
  </nav>
);

/* ─────────────────────────────────────────────
   EXAM TYPE BADGE
───────────────────────────────────────────── */
const ExamTypeBadge = ({ type }) => {
  const map = {
    midterm: { bg: "#ede9fe", color: "#6d28d9", label: "Midterm" },
    final:   { bg: "#fef2f2", color: "#dc2626", label: "Final"   },
    quiz:    { bg: "#f0fdf4", color: "#15803d", label: "Quiz"    },
    prelim:  { bg: "#fff7ed", color: "#c2410c", label: "Prelim"  },
  };
  const s = map[type] ?? { bg: "#f1f5f9", color: "#64748b", label: type ?? "Exam" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: ".04em",
      background: s.bg, color: s.color, textTransform: "uppercase",
    }}>{s.label}</span>
  );
};

/* ─────────────────────────────────────────────
   COUNTDOWN
───────────────────────────────────────────── */
const Countdown = ({ startTime }) => {
  const [diff, setDiff] = useState(null);
  useEffect(() => {
    const calc = () => {
      const ms = new Date(startTime) - new Date();
      if (ms <= 0) { setDiff(null); return; }
      setDiff({ h: Math.floor(ms / 3600000), m: Math.floor((ms % 3600000) / 60000) });
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [startTime]);
  if (!diff) return null;
  const urgent = diff.h === 0 && diff.m <= 30;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: urgent ? "#ef4444" : "#64748b" }}>
      {diff.h > 0 ? `in ${diff.h}h ${diff.m}m` : `in ${diff.m}m`}
    </span>
  );
};

/* ─────────────────────────────────────────────
   CPI LABEL COLOR
───────────────────────────────────────────── */
const cpiColor = (label) => {
  if (!label) return { color: "#94a3b8", bg: "#f1f5f9" };
  const l = label.toLowerCase();
  if (l.includes("unlikely"))  return { color: "#15803d", bg: "#f0fdf4" };
  if (l.includes("possible"))  return { color: "#b45309", bg: "#fff7ed" };
  if (l.includes("likely") || l.includes("high")) return { color: "#dc2626", bg: "#fef2f2" };
  return { color: "#64748b", bg: "#f1f5f9" };
};

/* ─────────────────────────────────────────────
   STAT CHIP (reusable)
───────────────────────────────────────────── */
const StatChip = ({ label, value, sub, color = "#0056b3", bg = "#e8f0fe" }) => (
  <div style={{
    flex: 1, minWidth: 0, background: bg, borderRadius: 12,
    padding: "12px 14px", textAlign: "center",
  }}>
    <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value ?? "—"}</p>
    <p style={{ margin: "4px 0 0", fontSize: 11, fontWeight: 600, color, opacity: .75 }}>{label}</p>
    {sub && <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>{sub}</p>}
  </div>
);

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const [time, setTime]                   = useState(new Date());
  const [user, setUser]                   = useState(null);
  const [baselineInfo, setBaselineInfo]   = useState(null);
  const [upcomingExams, setUpcomingExams] = useState(null);
  const [activeExam, setActiveExam]       = useState(undefined);
  const [recentResults, setRecentResults] = useState(null);
  const [announcements, setAnnouncements] = useState(null);
  const [courses, setCourses]             = useState(null);
  const [scoreStats, setScoreStats]       = useState(null);
  const [integrity, setIntegrity]         = useState(null);
  const [typingStats, setTypingStats]     = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    API.get("/me").then(res => setUser(res.data.user)).catch(() => {});
  }, []);

  useEffect(() => {
    API.get("/student/typing-baseline/status")
      .then(res => setBaselineInfo(res.data))
      .catch(() => setBaselineInfo({ has_baseline: false, recorded_at: null }));
  }, []);

  useEffect(() => {
    API.get("/student/courses")
      .then(res => setCourses(res.data.courses ?? []))
      .catch(() => setCourses([]));

    API.get("/student/dashboard/exams/upcoming")
      .then(res => setUpcomingExams(res.data))
      .catch(() => setUpcomingExams([]));

    API.get("/student/dashboard/exams/active")
      .then(res => setActiveExam(res.data))
      .catch(() => setActiveExam(null));

    API.get("/student/dashboard/exams/results")
      .then(res => setRecentResults(res.data))
      .catch(() => setRecentResults([]));

    API.get("/student/dashboard/announcements")
      .then(res => setAnnouncements(res.data))
      .catch(() => setAnnouncements([]));

    API.get("/student/dashboard/score-stats")
      .then(res => setScoreStats(res.data))
      .catch(() => setScoreStats(null));

    API.get("/student/dashboard/integrity")
      .then(res => setIntegrity(res.data))
      .catch(() => setIntegrity(null));

    API.get("/student/dashboard/typing-stats")
      .then(res => setTypingStats(res.data))
      .catch(() => setTypingStats(null));
  }, []);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/");
  };

  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "S";
  const firstName = user?.name?.split(" ")[0] ?? "Student";
  const fullName  = user?.name ?? "Student";

  const greetingHour = time.getHours();
  const greeting = greetingHour < 12 ? "Good morning"
                 : greetingHour < 17 ? "Good afternoon"
                 : "Good evening";

  const fmtDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  };
  const fmtTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  };
  const timeAgo = (iso) => {
    if (!iso) return "";
    const ms = Date.now() - new Date(iso);
    const m  = Math.floor(ms / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const cpi = cpiColor(integrity?.cpi_label);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;}
        body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
        :root{
          --blue:#0056b3;--blue-mid:#1a6ed8;--blue-lite:#e8f0fe;
          --slate:#64748b;--slate-lt:#94a3b8;
          --card-bg:#ffffff;--card-br:16px;
          --card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);
        }
        .dash-card{
          background:var(--card-bg);border-radius:var(--card-br);
          box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);
          transition:box-shadow .2s,transform .2s;overflow:hidden;
        }
        .dash-card:hover{box-shadow:0 2px 6px rgba(0,0,0,.06),0 8px 28px rgba(0,86,179,.10);transform:translateY(-1px);}
        .glass-sidebar{
          background:rgba(255,255,255,0.60);
          backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
          border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);
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
        .live-clock{font-family:'DM Mono',monospace;font-size:28px;font-weight:500;color:var(--blue);letter-spacing:-1px;line-height:1;}
        .topbar{
          background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
          border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:100;height:56px;
        }
        .avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
        .search-input{
          border:1px solid rgba(0,86,179,.15);border-radius:10px;
          background:#f8faff;padding:7px 14px 7px 36px;
          font-size:13px;color:#1e293b;outline:none;
          font-family:'DM Sans',sans-serif;width:220px;
          transition:border-color .2s,box-shadow .2s;
        }
        .search-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}

        /* Two-column layout */
        .dash-layout{display:grid;grid-template-columns:2fr 1fr;gap:16px;}
        .col-left{display:flex;flex-direction:column;gap:16px;}
        .col-right{display:flex;flex-direction:column;gap:16px;}
        @media(max-width:768px){
          .dash-layout{grid-template-columns:1fr;}
        }

        .exam-row{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid #f1f5f9;}
        .exam-row:last-child{border-bottom:none;}
        .result-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #f1f5f9;}
        .result-row:last-child{border-bottom:none;}

        .bio-btn{
          display:flex;align-items:center;gap:8px;
          background:#0056b3;color:#fff;border:none;border-radius:10px;padding:9px 16px;
          font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;
          transition:opacity .15s;width:100%;justify-content:center;margin-top:14px;
        }
        .bio-btn:hover{opacity:.85;}

        .skeleton{
          background:linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);
          background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;
        }
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

        .active-exam-pulse{
          width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0;
          animation:pulse 1.8s infinite;
        }
        @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}70%{box-shadow:0 0 0 8px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}

        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .4s ease both;}

        /* Course strip */
        .course-strip{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;}
        .course-strip::-webkit-scrollbar{display:none;}
        .course-chip{
          flex-shrink:0;background:#fff;border:1px solid rgba(0,86,179,.10);
          border-radius:12px;padding:12px 16px;min-width:160px;max-width:200px;
          text-decoration:none;transition:border-color .15s,box-shadow .15s,transform .15s;
          display:flex;flex-direction:column;gap:4px;
        }
        .course-chip:hover{border-color:#0056b3;box-shadow:0 4px 16px rgba(0,86,179,.12);transform:translateY(-2px);}

        /* Flag dots */
        .flag-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f8faff;}
        .flag-row:last-child{border-bottom:none;}
      `}</style>

      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* ── Topbar ── */}
        <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
            SECT Portal
          </span>
          <div className="d-none d-md-flex align-items-center ms-4 position-relative">
            <i className="bi bi-search" style={{ position: "absolute", left: 12, color: "#94a3b8", fontSize: 13 }}></i>
            <input className="search-input" placeholder="Search subjects, exams…" />
          </div>
          <div className="ms-auto d-flex align-items-center gap-2">
            <button style={{ background: "transparent", border: "none", position: "relative", padding: "4px 8px", cursor: "pointer" }}>
              <i className="bi bi-bell" style={{ fontSize: 18, color: "#64748b" }}></i>
              {announcements?.length > 0 && (
                <span style={{ position: "absolute", top: 2, right: 6, width: 7, height: 7, background: "#ef4444", borderRadius: "50%", border: "1.5px solid #f0f4fb" }} />
              )}
            </button>
            <div className="dropdown">
              <button className="d-flex align-items-center gap-2 dropdown-toggle"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }}
                data-bs-toggle="dropdown">
                <div className="avatar">{initial}</div>
                <span className="d-none d-sm-inline" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{firstName}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
                <li><Link className="dropdown-item" to="/student/profile">My Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}
                    style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>Logout</button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="d-flex align-items-stretch">

          {/* ── Sidebar ── */}
          <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
            style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}>
            {[
              { to: "/student",                  icon: "bi-speedometer2",    label: "Home",    active: true  },
              { to: "/student/subjects",         icon: "bi-journal-bookmark",label: "Subjects",active: false },
              { to: "/student/tasks",            icon: "bi-pencil-square",    label: "Tasks", active: false  },
              { to: "/student/grades",           icon: "bi-graph-up-arrow",  label: "Grades",  active: false },
              { to: "/student/account-settings", icon: "bi-gear",            label: "Settings",active: false },
            ].map(({ to, icon, label, active }) => (
              <Link key={to} to={to} className={`nav-pill ${active ? "active" : ""}`}>
                <i className={`bi ${icon}`}></i>{label}
              </Link>
            ))}
          </nav>

          {/* ── Main ── */}
          <main style={{ flex: 1, padding: "24px 20px", paddingBottom: 100, minWidth: 0 }}>

            {/* mobile search */}
            <div className="d-md-none mb-3 position-relative">
              <i className="bi bi-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, zIndex: 1 }}></i>
              <input className="search-input" style={{ width: "100%" }} placeholder="Search subjects, exams…" />
            </div>

            {/* ── Greeting ── */}
            <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-3">
              <div>
                <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{greeting},</p>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px", lineHeight: 1.2 }}>
                  {fullName} 👋
                </h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                  {user
                    ? [user.year_level, user.course, user.section ? `Section ${user.section}` : null].filter(Boolean).join(" · ")
                    : "Loading your profile…"}
                </p>
              </div>
              <div className="dash-card d-none d-md-flex flex-column align-items-end p-3" style={{ gap: 2 }}>
                <div className="live-clock">
                  {time.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                  {time.toLocaleDateString("en-PH", { weekday: "long", month: "short", day: "numeric" })}
                </span>
              </div>
            </div>

            {/* ── Enrolled Courses Strip ── */}
            <div className="dash-card fade-up" style={{ padding: "16px 20px", marginBottom: 16 }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>📚 My Courses</h2>
                <Link to="/student/subjects" style={{ fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none" }}>
                  View all →
                </Link>
              </div>

              {courses === null ? (
                <div style={{ display: "flex", gap: 10 }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ width: 160, height: 72, borderRadius: 12, flexShrink: 0 }} />)}
                </div>
              ) : courses.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>You are not enrolled in any courses yet.</p>
              ) : (
                <div className="course-strip">
                  {courses.map(c => (
                    <Link key={c.id} to={`/student/courses/${c.id}/exams`} className="course-chip">
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#0056b3", letterSpacing: ".04em", textTransform: "uppercase" }}>
                        {c.code}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", lineHeight: 1.3,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.name}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {c.exams_count} exam{c.exams_count !== 1 ? "s" : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ── Two-column layout ── */}
            <div className="dash-layout">

              {/* ══ LEFT ══ */}
              <div className="col-left">

                {/* 1 ── Upcoming Exams */}
                <div className="dash-card fade-up" style={{ padding: 24 }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>📅 Upcoming Exams</h2>
                    <Link to="/student/subjects" style={{ fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
                  </div>

                  {upcomingExams === null ? (
                    [1,2,3].map(i => (
                      <div key={i} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
                        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div className="skeleton" style={{ height: 12, width: "60%", marginBottom: 8 }} />
                          <div className="skeleton" style={{ height: 10, width: "40%" }} />
                        </div>
                      </div>
                    ))
                  ) : upcomingExams.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "28px 0", color: "#94a3b8" }}>
                      <i className="bi bi-calendar-check" style={{ fontSize: 28, display: "block", marginBottom: 8 }}></i>
                      <span style={{ fontSize: 13 }}>No upcoming exams. You're all caught up!</span>
                    </div>
                  ) : (
                    upcomingExams.map(exam => (
                      <div key={exam.id} className="exam-row">
                        <div style={{
                          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                          background: "#e8f0fe", display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#0056b3", lineHeight: 1 }}>
                            {new Date(exam.start_time).getDate()}
                          </span>
                          <span style={{ fontSize: 9, fontWeight: 600, color: "#4d90fe", textTransform: "uppercase" }}>
                            {new Date(exam.start_time).toLocaleDateString("en-PH", { month: "short" })}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{exam.title}</span>
                            <ExamTypeBadge type={exam.type} />
                          </div>
                          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#94a3b8" }}>
                            {exam.course} · {fmtTime(exam.start_time)} · {exam.duration_minutes} min
                          </p>
                        </div>
                        <Countdown startTime={exam.start_time} />
                      </div>
                    ))
                  )}
                </div>

                {/* 2 ── Recent Results */}
                <div className="dash-card fade-up" style={{ padding: 24 }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>📊 Recent Results</h2>
                    <Link to="/student/subjects" style={{ fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
                  </div>

                  {recentResults === null ? (
                    [1,2,3].map(i => (
                      <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: "1px solid #f1f5f9" }}>
                        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div className="skeleton" style={{ height: 12, width: "55%", marginBottom: 8 }} />
                          <div className="skeleton" style={{ height: 10, width: "35%" }} />
                        </div>
                        <div className="skeleton" style={{ width: 36, height: 20, borderRadius: 6, flexShrink: 0 }} />
                      </div>
                    ))
                  ) : recentResults.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "28px 0", color: "#94a3b8" }}>
                      <i className="bi bi-bar-chart" style={{ fontSize: 28, display: "block", marginBottom: 8 }}></i>
                      <span style={{ fontSize: 13 }}>No exam results yet.</span>
                    </div>
                  ) : (
                    recentResults.map((r, i) => {
                      const pct    = r.total > 0 ? Math.round((r.score / r.total) * 100) : null;
                      const passed = r.passed;
                      return (
                        <div key={i} className="result-row">
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: passed === true ? "#f0fdf4" : passed === false ? "#fef2f2" : "#f8faff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <i className={`bi ${passed === true ? "bi-check-lg" : passed === false ? "bi-x-lg" : "bi-dash"}`}
                              style={{ fontSize: 14, color: passed === true ? "#22c55e" : passed === false ? "#ef4444" : "#94a3b8" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {r.exam}
                            </p>
                            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                              {r.course}{r.type ? ` · ` : ""}{r.type && <ExamTypeBadge type={r.type} />} · {fmtDate(r.date)}
                            </p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: passed === true ? "#22c55e" : passed === false ? "#ef4444" : "#0f172a" }}>
                              {pct !== null ? `${pct}%` : `${r.score}`}
                            </p>
                            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>{r.score}/{r.total}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 3 ── Score Statistics */}
                <div className="dash-card fade-up" style={{ padding: 24 }}>
                  <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                    📈 Score Statistics
                  </h2>

                  {scoreStats === null ? (
                    <div style={{ display: "flex", gap: 10 }}>
                      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ flex: 1, height: 64, borderRadius: 12 }} />)}
                    </div>
                  ) : scoreStats.total_taken === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>
                      No exams taken yet.
                    </p>
                  ) : (
                    <>
                      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                        <StatChip label="Avg Score"    value={`${scoreStats.avg_pct}%`}     color="#0056b3" bg="#e8f0fe" />
                        <StatChip label="Highest"      value={`${scoreStats.highest_pct}%`} color="#15803d" bg="#f0fdf4" />
                        <StatChip label="Lowest"       value={`${scoreStats.lowest_pct}%`}  color="#c2410c" bg="#fff7ed" />
                        <StatChip label="Total Taken"  value={scoreStats.total_taken}        color="#6d28d9" bg="#ede9fe" />
                      </div>
                      <div style={{ height: 6, borderRadius: 99, background: "#f1f5f9", overflow: "hidden", marginBottom: 8 }}>
                        <div style={{
                          height: "100%", borderRadius: 99,
                          width: `${scoreStats.total_taken > 0 ? (scoreStats.pass_count / scoreStats.total_taken) * 100 : 0}%`,
                          background: "linear-gradient(90deg, #22c55e, #16a34a)",
                          transition: "width 1s cubic-bezier(.4,0,.2,1)",
                        }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                        <span style={{ color: "#22c55e" }}>✓ {scoreStats.pass_count} passed</span>
                        <span style={{ color: "#ef4444" }}>✗ {scoreStats.fail_count} failed</span>
                      </div>
                    </>
                  )}
                </div>

              </div>{/* /col-left */}

              {/* ══ RIGHT ══ */}
              <div className="col-right">

                {/* 4 ── Announcements */}
                <div className="dash-card fade-up" style={{ padding: 20 }}>
                  <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>📢 Announcements</h2>

                  {announcements === null ? (
                    [1,2].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10, marginBottom: 10 }} />)
                  ) : announcements.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "28px 0", color: "#94a3b8" }}>
                      <i className="bi bi-megaphone" style={{ fontSize: 24, display: "block", marginBottom: 8 }}></i>
                      <span style={{ fontSize: 13 }}>No announcements.</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {announcements.map(a => (
                        <div key={a.id} style={{ borderRadius: 12, padding: "12px 14px", background: "#f8faff", border: "1px solid rgba(0,86,179,.08)" }}>
                          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#1e293b", lineHeight: 1.4 }}>{a.title}</p>
                          <p style={{ margin: "0 0 6px", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{a.body}</p>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(a.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5 ── Typing Speed */}
                <div className="dash-card fade-up" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className="bi bi-keyboard" style={{ color: "#0056b3", fontSize: 15 }}></i>
                    </div>
                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Typing Speed</h2>
                  </div>

                  {typingStats === null ? (
                    <div className="skeleton" style={{ height: 60, borderRadius: 10 }} />
                  ) : typingStats.samples === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>No typing data yet. Take an essay exam to generate data.</p>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <StatChip label="Avg WPM" value={typingStats.avg_wpm} color="#0056b3" bg="#e8f0fe" />
                      <StatChip label="Peak WPM" value={typingStats.max_wpm} color="#15803d" bg="#f0fdf4"
                        sub={`${typingStats.samples} samples`} />
                    </div>
                  )}
                </div>

                {/* 6 ── Exam Integrity */}
                <div className="dash-card fade-up" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className="bi bi-shield-lock" style={{ color: "#0056b3", fontSize: 15 }}></i>
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Exam Integrity</h2>
                      <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Based on your exam behavior</p>
                    </div>
                  </div>

                  {integrity === null ? (
                    <div className="skeleton" style={{ height: 80, borderRadius: 10 }} />
                  ) : integrity.total_exams === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>No exam data processed yet.</p>
                  ) : (
                    <>
                      {/* CPI label pill */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 14px", borderRadius: 10,
                        background: cpi.bg, border: `1px solid ${cpi.color}30`,
                        marginBottom: 14,
                      }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: cpi.color }}>
                            Cheating Probability
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 700, color: cpi.color }}>
                            {integrity.cpi_label ?? "N/A"}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>CPI Score</p>
                          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: cpi.color }}>
                            {integrity.avg_cpi?.toFixed(2) ?? "—"}
                          </p>
                        </div>
                      </div>

                      {/* Flag breakdown */}
                      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>
                        Flag Breakdown
                      </p>
                      {[
                        { label: "Tab Switching",    val: integrity.flags.tab_switch,    icon: "bi-window-stack"   },
                        { label: "Keyboard Shortcuts", val: integrity.flags.keyboard,    icon: "bi-keyboard"       },
                        { label: "Response Time",    val: integrity.flags.response_time, icon: "bi-clock-history"  },
                        { label: "Keystroke Pattern",val: integrity.flags.keystroke,     icon: "bi-activity"       },
                      ].map(f => (
                        <div key={f.label} className="flag-row">
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <i className={`bi ${f.icon}`} style={{ fontSize: 13, color: "#94a3b8" }}></i>
                            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{f.label}</span>
                          </div>
                          <span style={{
                            fontSize: 12, fontWeight: 700,
                            color: f.val > 0 ? "#ef4444" : "#22c55e",
                          }}>
                            {f.val > 0 ? `${f.val} flag${f.val > 1 ? "s" : ""}` : "Clean"}
                          </span>
                        </div>
                      ))}

                      <p style={{ margin: "12px 0 0", fontSize: 11, color: "#94a3b8", textAlign: "right" }}>
                        Across {integrity.total_exams} exam{integrity.total_exams !== 1 ? "s" : ""}
                      </p>
                    </>
                  )}
                </div>

                {/* 7 ── Security / Baseline */}
                <div className="dash-card fade-up" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className="bi bi-person-badge" style={{ color: "#0056b3", fontSize: 15 }}></i>
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Security</h2>
                      <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Typing baseline status</p>
                    </div>
                  </div>

                  {baselineInfo === null ? (
                    <div className="skeleton" style={{ height: 52, borderRadius: 10 }} />
                  ) : baselineInfo.has_baseline ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                      <i className="bi bi-check-circle-fill" style={{ color: "#22c55e", fontSize: 16, flexShrink: 0 }}></i>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#15803d" }}>Baseline Active</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#4ade80" }}>Recorded {fmtDate(baselineInfo.recorded_at)}</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, background: "#fff7ed", border: "1px solid #fed7aa" }}>
                      <i className="bi bi-exclamation-triangle-fill" style={{ color: "#f59e0b", fontSize: 16, flexShrink: 0 }}></i>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#92400e" }}>No Baseline Found</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#b45309" }}>Required before your first exam.</p>
                      </div>
                    </div>
                  )}

                  <button className="bio-btn" onClick={() => navigate("/student/typing-test")}>
                    <i className="bi bi-keyboard"></i>
                    {baselineInfo?.has_baseline ? "Update Typing Baseline" : "Record Typing Baseline"}
                  </button>
                </div>

              </div>{/* /col-right */}

            </div>{/* /dash-layout */}
          </main>
        </div>

        <BottomNav active="Home" />
      </div>
    </>
  );
};

export default Dashboard;