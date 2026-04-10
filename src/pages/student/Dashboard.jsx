import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";

/* ─────────────────────────────────────────────
   BOTTOM NAV  (mobile only)
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
      { to: "/student/tasks",            icon: "bi-pencil-square",   label: "Tasks"    },
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
   ACTIVITY HEATMAP
───────────────────────────────────────────── */
const ActivityHeatmap = () => {
  const weeks = 26;
  const days  = 7;
  const levels = ["#e8f0fe", "#93bbfd", "#4d90fe", "#1a65e0", "#0056b3"];

  const cells = Array.from({ length: weeks * days }, () => {
    const rand = Math.random();
    if (rand < 0.35) return 0;
    if (rand < 0.55) return 1;
    if (rand < 0.72) return 2;
    if (rand < 0.88) return 3;
    return 4;
  });

  const dayLabels = ["","M","","W","","F",""];

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-start", minWidth: "fit-content" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 0 }}>
          {dayLabels.map((d, i) => (
            <div key={i} style={{
              height: 11, width: 14, fontSize: 9, color: "#94a3b8",
              display: "flex", alignItems: "center", fontFamily: "'DM Sans', sans-serif"
            }}>{d}</div>
          ))}
        </div>
        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {Array.from({ length: days }, (_, d) => {
              const idx   = w * days + d;
              const level = cells[idx];
              return (
                <div key={d} style={{
                  width: 11, height: 11, borderRadius: 3,
                  background: levels[level],
                  transition: "transform .1s",
                  cursor: "default",
                }} title={`${level} contributions`}
                  onMouseEnter={e => e.target.style.transform = "scale(1.4)"}
                  onMouseLeave={e => e.target.style.transform = "scale(1)"}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 10 }}>
        <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>Less</span>
        {levels.map((c, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: c }} />
        ))}
        <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>More</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MICRO SPARKLINE
───────────────────────────────────────────── */
const Sparkline = ({ data, color = "#0056b3", height = 36 }) => {
  const w = 80, h = height;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(" ").pop().split(",")[0]}
              cy={pts.split(" ").pop().split(",")[1]}
              r="3" fill={color} />
    </svg>
  );
};

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [baselineInfo, setBaselineInfo] = useState(null); // { has_baseline, recorded_at }

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    API.get("/me")
      .then(res => setUser(res.data.user))
      .catch(() => {});
  }, []);

  // Fetch typing baseline status for the Security & Biometrics widget
  useEffect(() => {
    API.get("/student/typing-baseline/status")
      .then(res => setBaselineInfo(res.data))
      .catch(() => setBaselineInfo({ has_baseline: false, recorded_at: null }));
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
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  const courses = [
    { name: "Data Structures", pct: 45, color: "#0056b3", badge: "Ongoing"     },
    { name: "Database Mgmt",   pct: 82, color: "#22c55e", badge: "On Track"    },
    { name: "UI/UX Principles",pct: 12, color: "#f59e0b", badge: "Just Started"},
  ];

  const deadlines = [
    { title: "Database Normalization Quiz", due: "Oct 25 · 11:59 PM", urgency: "high"   },
    { title: "Final Project Submission",    due: "Oct 28 · 5:00 PM",  urgency: "medium" },
    { title: "Algorithm Assignment #3",     due: "Nov 02 · Midnight",  urgency: "low"    },
  ];

  const urgencyColor = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        body, html {
          margin: 0; padding: 0;
          background: #f0f4fb;
          font-family: 'DM Sans', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        :root {
          --blue:      #0056b3;
          --blue-mid:  #1a6ed8;
          --blue-lite: #e8f0fe;
          --slate:     #64748b;
          --slate-lt:  #94a3b8;
          --card-bg:   #ffffff;
          --card-br:   16px;
          --card-sh:   0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,86,179,.06);
          --glass-bg:  rgba(255,255,255,0.55);
          --glass-bd:  1px solid rgba(255,255,255,0.70);
        }

        .dash-card {
          background: var(--card-bg);
          border-radius: var(--card-br);
          box-shadow: var(--card-sh);
          border: 1px solid rgba(0,86,179,.06);
          transition: box-shadow .2s, transform .2s;
          overflow: hidden;
        }
        .dash-card:hover {
          box-shadow: 0 2px 6px rgba(0,0,0,.06), 0 8px 28px rgba(0,86,179,.10);
          transform: translateY(-1px);
        }

        .glass-sidebar {
          background: rgba(255,255,255,0.60);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-right: 1px solid rgba(255,255,255,0.80);
          box-shadow: 4px 0 24px rgba(0,86,179,.07);
        }

        .nav-pill {
          display: flex; flex-direction: column; align-items: center;
          padding: 10px 8px; border-radius: 12px; gap: 4px;
          font-size: 11px; font-weight: 600; text-decoration: none;
          color: var(--slate); transition: background .15s, color .15s, transform .15s;
          width: 100%;
        }
        .nav-pill:hover  { background: var(--blue-lite); color: var(--blue); transform: translateY(-1px); }
        .nav-pill.active { background: var(--blue); color: #fff; box-shadow: 0 4px 14px rgba(0,86,179,.35); }
        .nav-pill i { font-size: 18px; }

        .stat-chip {
          background: var(--card-bg);
          border-radius: 14px;
          padding: 16px;
          border: 1px solid rgba(0,86,179,.07);
          box-shadow: var(--card-sh);
          transition: box-shadow .2s, transform .2s;
        }
        .stat-chip:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,86,179,.12); }

        .prog-track {
          height: 6px; border-radius: 99px;
          background: #eef2ff; overflow: hidden;
        }
        .prog-fill {
          height: 100%; border-radius: 99px;
          transition: width 1s cubic-bezier(.4,0,.2,1);
        }

        .course-row {
          padding: 14px 0;
          border-bottom: 1px solid #f1f5f9;
          transition: background .15s;
        }
        .course-row:last-child { border-bottom: none; }

        .dl-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 12px;
          transition: background .15s;
          cursor: default;
        }
        .dl-row:hover { background: #f8faff; }

        .live-clock {
          font-family: 'DM Mono', monospace;
          font-size: 28px; font-weight: 500;
          color: var(--blue); letter-spacing: -1px;
          line-height: 1;
        }

        .bento {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: auto;
        }
        .bento-span2 { grid-column: span 2; }
        .bento-span3 { grid-column: span 3; }

        @media (max-width: 991px) {
          .bento { grid-template-columns: 1fr 1fr; }
          .bento-span2 { grid-column: span 2; }
          .bento-span3 { grid-column: span 2; }
        }
        @media (max-width: 600px) {
          .bento { grid-template-columns: 1fr; }
          .bento-span2, .bento-span3 { grid-column: span 1; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp .4s ease both; }
        .fade-up:nth-child(1) { animation-delay: .05s; }
        .fade-up:nth-child(2) { animation-delay: .10s; }
        .fade-up:nth-child(3) { animation-delay: .15s; }
        .fade-up:nth-child(4) { animation-delay: .20s; }
        .fade-up:nth-child(5) { animation-delay: .25s; }
        .fade-up:nth-child(6) { animation-delay: .30s; }
        .fade-up:nth-child(7) { animation-delay: .35s; }

        .topbar {
          background: rgba(255,255,255,0.80);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0,86,179,.08);
          position: sticky; top: 0; z-index: 100;
          height: 56px;
        }

        .avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--blue); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; flex-shrink: 0;
        }

        .search-input {
          border: 1px solid rgba(0,86,179,.15); border-radius: 10px;
          background: #f8faff; padding: 7px 14px 7px 36px;
          font-size: 13px; color: #1e293b; outline: none;
          font-family: 'DM Sans', sans-serif; width: 220px;
          transition: border-color .2s, box-shadow .2s;
        }
        .search-input:focus {
          border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0,86,179,.10);
          background: #fff;
        }

        .tag {
          display: inline-flex; align-items: center;
          padding: 2px 9px; border-radius: 99px;
          font-size: 11px; font-weight: 600; letter-spacing: .02em;
        }

        /* Biometrics widget button */
        .bio-btn {
          display: flex; align-items: center; gap: 8px;
          background: #0056b3; color: #fff; border: none;
          border-radius: 10px; padding: 9px 16px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: opacity .15s;
          width: 100%; justify-content: center;
          margin-top: 14px;
        }
        .bio-btn:hover { opacity: .85; }
      `}</style>

      <div className="bg-light" style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* ── Topbar ── */}
        <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
            SECT Portal
          </span>

          <div className="d-none d-md-flex align-items-center ms-4 position-relative">
            <i className="bi bi-search" style={{ position: "absolute", left: 12, color: "#94a3b8", fontSize: 13 }}></i>
            <input className="search-input" placeholder="Search subjects, exams…" />
          </div>

          <div className="ms-auto d-flex align-items-center gap-2">
            <button style={{ background: "transparent", border: "none", position: "relative", padding: "4px 8px", cursor: "pointer" }}>
              <i className="bi bi-bell" style={{ fontSize: 18, color: "#64748b" }}></i>
              <span style={{
                position: "absolute", top: 2, right: 6, width: 7, height: 7,
                background: "#ef4444", borderRadius: "50%", border: "1.5px solid #f0f4fb"
              }}></span>
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
                    style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>
                    Logout
                  </button>
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
              { to: "/student/tasks",            icon: "bi-pencil-square",   label: "Tasks",   active: false },
              { to: "/student/grades",           icon: "bi-graph-up-arrow",  label: "Grades",  active: false },
              { to: "/student/account-settings", icon: "bi-gear",            label: "Settings",active: false },
            ].map(({ to, icon, label, active }) => (
              <Link key={to} to={to} className={`nav-pill ${active ? "active" : ""}`}>
                <i className={`bi ${icon}`}></i>
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Main content ── */}
          <main style={{ flex: 1, padding: "24px 20px", paddingBottom: 100, minWidth: 0 }}>

            <div className="d-md-none mb-3 position-relative">
              <i className="bi bi-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, zIndex: 1 }}></i>
              <input className="search-input" style={{ width: "100%" }} placeholder="Search subjects, exams…" />
            </div>

            {/* ── Greeting row ── */}
            <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-3">
              <div>
                <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{greeting},</p>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px", lineHeight: 1.2 }}>
                  {fullName} 👋
                </h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                  {user ? `${user.year_level ?? "3rd Year"} · ${user.course ?? "BS Computer Science"} · Section ${user.section ?? "BSCS-3A"}` : "Loading your profile…"}
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

            {/* ── Bento Grid ── */}
            <div className="bento">

              {/* 1 ── Semester Progress */}
              <div className="dash-card bento-span2 fade-up" style={{
                padding: 24, position: "relative", overflow: "hidden",
                background: "linear-gradient(135deg, #0056b3 0%, #1a6ed8 60%, #4d90fe 100%)",
                borderRadius: 16, border: "none"
              }}>
                <div style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
                <div style={{ position: "absolute", right: 40, bottom: -60, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.65)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Semester Progress
                </p>
                <div className="d-flex align-items-end gap-3 mt-2 mb-3">
                  <span style={{ fontSize: 52, fontWeight: 700, color: "#fff", lineHeight: 1, letterSpacing: "-2px" }}>68%</span>
                  <div style={{ paddingBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,.75)", display: "block" }}>↑ 4% vs last month</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}>On track for Dean's List</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,.22)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "68%", borderRadius: 99, background: "#fff", transition: "width 1.2s cubic-bezier(.4,0,.2,1)" }} />
                </div>
              </div>

              {/* 2 ── GPA */}
              <div className="stat-chip fade-up d-flex flex-column justify-content-between" style={{ minHeight: 140 }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>GPA</p>
                    <p style={{ margin: "6px 0 0", fontSize: 36, fontWeight: 700, color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1 }}>3.84</p>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="bi bi-mortarboard" style={{ color: "#0056b3", fontSize: 16 }}></i>
                  </div>
                </div>
                <div>
                  <Sparkline data={[3.5, 3.6, 3.7, 3.65, 3.75, 3.84]} />
                  <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>▲ +0.19 this semester</span>
                </div>
              </div>

              {/* 3 ── Upcoming Exams */}
              <div className="stat-chip fade-up d-flex flex-column justify-content-between" style={{ minHeight: 140 }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>Exams</p>
                    <p style={{ margin: "6px 0 0", fontSize: 36, fontWeight: 700, color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1 }}>3</p>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="bi bi-alarm" style={{ color: "#f59e0b", fontSize: 16 }}></i>
                  </div>
                </div>
                <div>
                  <Sparkline data={[1, 2, 1, 3, 2, 3]} color="#f59e0b" />
                  <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>This week · stay focused</span>
                </div>
              </div>

              {/* 4 ── Tasks */}
              <div className="stat-chip fade-up d-flex flex-column justify-content-between" style={{ minHeight: 140 }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>Tasks</p>
                    <p style={{ margin: "6px 0 0", fontSize: 36, fontWeight: 700, color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1 }}>12</p>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="bi bi-list-check" style={{ color: "#22c55e", fontSize: 16 }}></i>
                  </div>
                </div>
                <div>
                  <Sparkline data={[18, 16, 15, 14, 13, 12]} color="#22c55e" />
                  <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>↓ 6 done this week</span>
                </div>
              </div>

              {/* 5 ── Class Rank */}
              <div className="stat-chip fade-up d-flex flex-column justify-content-between" style={{ minHeight: 140 }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>Class Rank</p>
                    <p style={{ margin: "6px 0 0", fontSize: 36, fontWeight: 700, color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1 }}>#14</p>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fdf2f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="bi bi-trophy" style={{ color: "#a855f7", fontSize: 16 }}></i>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 6, borderRadius: 99, background: "#eef2ff", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "95%", background: "linear-gradient(90deg,#a855f7,#0056b3)", borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#a855f7", fontWeight: 600, marginTop: 4, display: "block" }}>Top 5% of batch</span>
                </div>
              </div>

              {/* 6 ── My Courses */}
              <div className="dash-card bento-span2 fade-up" style={{ padding: 24 }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>📚 My Courses</h2>
                  <Link to="/student/subjects" style={{ fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none" }}>
                    View all →
                  </Link>
                </div>
                {courses.map((c, i) => (
                  <div key={i} className="course-row">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{c.name}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="tag" style={{ background: c.color + "18", color: c.color, fontSize: 10 }}>{c.badge}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.color, minWidth: 32, textAlign: "right" }}>{c.pct}%</span>
                      </div>
                    </div>
                    <div className="prog-track">
                      <div className="prog-fill" style={{ width: `${c.pct}%`, background: c.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* 7 ── Activity Heatmap */}
              <div className="dash-card bento-span3 fade-up" style={{ padding: 24 }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Activity Heatmap</h2>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>Study sessions over the last 6 months</p>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", background: "#f8faff", borderRadius: 8, padding: "4px 10px", fontWeight: 500 }}>
                    126 active days
                  </div>
                </div>
                <ActivityHeatmap />
              </div>

              {/* 8 ── Upcoming Deadlines */}
              <div className="dash-card bento-span2 fade-up" style={{ padding: "20px 8px 8px 20px" }}>
                <div className="d-flex justify-content-between align-items-center mb-2 pe-3">
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>⏰ Deadlines</h2>
                  <Link to="/student/tasks" style={{ fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none" }}>All tasks →</Link>
                </div>
                {deadlines.map((d, i) => (
                  <div key={i} className="dl-row">
                    <div style={{ width: 4, height: 36, borderRadius: 4, flexShrink: 0, background: urgencyColor[d.urgency] }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Due {d.due}</p>
                    </div>
                    <button style={{
                      flexShrink: 0, background: "#f8faff", border: "1px solid #e2e8f0",
                      borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600,
                      color: "#0056b3", cursor: "pointer", transition: "all .15s"
                    }}
                      onMouseEnter={e => { e.target.style.background = "#0056b3"; e.target.style.color = "#fff"; }}
                      onMouseLeave={e => { e.target.style.background = "#f8faff"; e.target.style.color = "#0056b3"; }}>
                      Start
                    </button>
                  </div>
                ))}
              </div>

              {/* 9 ── Announcements */}
              <div className="dash-card fade-up" style={{ padding: 20 }}>
                <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>📢 Announcements</h2>
                <div style={{
                  borderRadius: 12, padding: 14,
                  background: "linear-gradient(135deg, #f0f4fb, #e8f0fe)",
                  border: "1px solid rgba(0,86,179,.10)"
                }}>
                  <span className="tag" style={{ background: "#0056b3", color: "#fff", marginBottom: 8, display: "inline-flex" }}>Admin</span>
                  <p style={{ margin: "0 0 6px", fontSize: 13, color: "#1e293b", lineHeight: 1.5 }}>
                    System maintenance scheduled tonight at 2:00 AM. Please save your work.
                  </p>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>2 hours ago</span>
                </div>

                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { icon: "bi-file-earmark-text", label: "Submit Assignment",  color: "#0056b3" },
                    { icon: "bi-bar-chart-line",    label: "View Grade Report", color: "#22c55e" },
                  ].map(q => (
                    <button key={q.label} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: "#f8faff", border: "1px solid #e2e8f0",
                      borderRadius: 10, padding: "9px 14px", cursor: "pointer",
                      fontSize: 12, fontWeight: 600, color: "#1e293b",
                      textAlign: "left", transition: "border-color .15s, background .15s"
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = q.color; e.currentTarget.style.background = "#fff"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8faff"; }}>
                      <i className={`bi ${q.icon}`} style={{ color: q.color, fontSize: 15 }}></i>
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 10 ── Security & Biometrics ── NEW */}
              <div className="dash-card bento-span2 fade-up" style={{ padding: 24 }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className="bi bi-shield-lock" style={{ color: "#0056b3", fontSize: 16 }}></i>
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Security &amp; Biometrics</h2>
                      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Typing signature for essay exam verification</p>
                    </div>
                  </div>
                </div>

                {/* Baseline status indicator */}
                {baselineInfo === null ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 10, background: "#f8faff", border: "1px solid #e2e8f0" }}>
                    <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>Loading baseline status…</span>
                  </div>
                ) : baselineInfo.has_baseline ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <i className="bi bi-check-circle-fill" style={{ color: "#22c55e", fontSize: 16, flexShrink: 0 }}></i>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#15803d" }}>Baseline Active</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#4ade80" }}>
                        Recorded on {new Date(baselineInfo.recorded_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, background: "#fff7ed", border: "1px solid #fed7aa" }}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ color: "#f59e0b", fontSize: 16, flexShrink: 0 }}></i>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#92400e" }}>No Baseline Found</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#b45309" }}>You'll be prompted to record one before your first exam.</p>
                    </div>
                  </div>
                )}

                <button className="bio-btn" onClick={() => navigate('/student/typing-test')}>
                  <i className="bi bi-keyboard"></i>
                  {baselineInfo?.has_baseline ? "Update Typing Baseline" : "Record Typing Baseline"}
                </button>
              </div>

            </div>{/* /bento */}
          </main>
        </div>

        <BottomNav active="Home" />
      </div>
    </>
  );
};

export default Dashboard;