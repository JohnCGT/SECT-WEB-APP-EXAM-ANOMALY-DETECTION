// src/pages/instructor/Reports.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../lib/api";
import InstructorAlertBell from "../../components/InstructorAlertBell";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{--blue:#0056b3;--blue-lite:#e8f0fe;--slate:#64748b;--card-bg:#fff;--card-br:16px;--card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);}
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;transition:box-shadow .2s,transform .2s;}
  .dash-card:hover{box-shadow:0 2px 6px rgba(0,0,0,.06),0 8px 28px rgba(0,86,179,.10);}
  .glass-sidebar{background:rgba(255,255,255,0.60);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);}
  .nav-pill{display:flex;flex-direction:column;align-items:center;padding:10px 8px;border-radius:12px;gap:4px;font-size:11px;font-weight:600;text-decoration:none;color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;}
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .topbar{background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:100;height:56px;}
  .avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .stat-chip{flex:1;min-width:140px;background:#fff;border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);padding:16px 18px;}
  .tab-btn{padding:10px 18px;border:none;background:none;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;border-bottom:2px solid transparent;font-family:'DM Sans',sans-serif;transition:color .15s,border-color .15s;white-space:nowrap;}
  .tab-btn.active{color:#0056b3;border-bottom-color:#0056b3;}
  .btn-primary-dash{display:inline-flex;align-items:center;gap:8px;background:#0056b3;color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .15s;text-decoration:none;}
  .btn-primary-dash:hover{opacity:.87;color:#fff;}
  .btn-outline-dash{display:inline-flex;align-items:center;gap:6px;background:transparent;color:#0056b3;border:1.5px solid rgba(0,86,179,.25);border-radius:10px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s;}
  .btn-outline-dash:hover{background:var(--blue-lite);}
  .badge-pill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}
  .progress-bar-track{height:8px;border-radius:99px;background:#f1f5f9;overflow:hidden;}
  .progress-bar-fill{height:100%;border-radius:99px;transition:width .6s cubic-bezier(.4,0,.2,1);}
  .bar-chart-bar{border-radius:6px 6px 0 0;transition:opacity .15s;}
  .bar-chart-bar:hover{opacity:.8;}
  .metric-box{border:1px solid rgba(0,86,179,.1);border-radius:12px;padding:16px;text-align:center;}
  .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,.08);}
  .bottom-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bottom-nav-item i{font-size:19px;}
  @media(max-width:991px){.main-content{padding:16px 12px 88px!important;}.two-col{flex-direction:column!important;}}
  @media(max-width:767px){.stats-row{flex-wrap:wrap!important;}.tab-scroll{overflow-x:auto;}}
`;

const NAV_ITEMS = [
  { to: "/instructor",                  icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/instructor/courses",          icon: "bi-book",                 label: "Courses"   },
  { to: "/instructor/exams",            icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/instructor/students",         icon: "bi-people",               label: "Students"  },
  { to: "/instructor/alerts",           icon: "bi-exclamation-triangle", label: "Alerts"    },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

/* ── Static sample data ── */
const EXAM_REPORTS = [
  { id: 1, title: "Midterm Exam - Data Structures",  date: "2026-02-15", students: 45, avgScore: "82%", avgCPI: "8%",  passRate: "91%", anomalyCount: 2 },
  { id: 2, title: "Final Exam - Algorithms",         date: "2026-02-10", students: 38, avgScore: "75%", avgCPI: "15%", passRate: "84%", anomalyCount: 5 },
  { id: 3, title: "Prelim Exam - Database Systems",  date: "2026-02-05", students: 41, avgScore: "88%", avgCPI: "12%", passRate: "95%", anomalyCount: 3 },
];

const STUDENT_REPORTS = [
  { rank: 1, name: "Isabel Garcia",  avgScore: "95%", examsTaken: 6, avgCPI: "2%",  anomalies: 0, reliability: "Excellent" },
  { rank: 2, name: "Juan Dela Cruz", avgScore: "92%", examsTaken: 5, avgCPI: "3%",  anomalies: 1, reliability: "Excellent" },
  { rank: 3, name: "Ana Rodriguez",  avgScore: "88%", examsTaken: 6, avgCPI: "5%",  anomalies: 1, reliability: "Good"      },
  { rank: 4, name: "Sofia Martinez", avgScore: "85%", examsTaken: 6, avgCPI: "8%",  anomalies: 2, reliability: "Good"      },
  { rank: 5, name: "Maria Santos",   avgScore: "80%", examsTaken: 4, avgCPI: "10%", anomalies: 2, reliability: "Average"   },
];

const RELIABILITY_STYLES = {
  Excellent: { bg: "#f0fdf4", color: "#15803d" },
  Good:      { bg: "#eff6ff", color: "#1d4ed8" },
  Average:   { bg: "#fff7ed", color: "#c2410c" },
  Poor:      { bg: "#fef2f2", color: "#dc2626" },
};

const cpiColor = cpi => parseInt(cpi) < 10 ? "#22c55e" : parseInt(cpi) < 30 ? "#f59e0b" : "#ef4444";

const Reports = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [user,       setUser]       = useState(null);
  const [reportType, setReportType] = useState("overview");

  useEffect(() => {
    API.get("/me").then(r => setUser(r.data.user)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/instructor/login");
  };

  const isActive  = to => to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "I";
  const firstName = user?.name?.split(" ")[0] ?? "Instructor";

  const STAT_CHIPS = [
    { label: "Total Exams Analyzed", value: "12",    color: "#0056b3", bg: "#e8f0fe", icon: "bi-file-earmark-text", sub: "↑ 20% from last month" },
    { label: "Average CPI Score",    value: "11%",   color: "#15803d", bg: "#f0fdf4", icon: "bi-shield-check",       sub: "↓ 3% improvement"     },
    { label: "Detection Accuracy",   value: "96.5%", color: "#1d4ed8", bg: "#eff6ff", icon: "bi-cpu",                sub: "Combined algorithms"   },
    { label: "Students Flagged",     value: "7",     color: "#dc2626", bg: "#fef2f2", icon: "bi-exclamation-circle", sub: "8.2% of total"        },
  ];

  const REPORT_TABS = [
    { key: "overview",  label: "Overview"            },
    { key: "exams",     label: "Exam Reports"        },
    { key: "students",  label: "Student Performance" },
    { key: "anomalies", label: "Anomaly Analysis"    },
  ];

  const BAR_DATA = [
    { week: "Week 1", pct: 7,  height: 120 },
    { week: "Week 2", pct: 9,  height: 140 },
    { week: "Week 3", pct: 12, height: 180 },
    { week: "Week 4", pct: 11, height: 165 },
    { week: "Week 5", pct: 8,  height: 130 },
  ];

  const TABLE_HEAD_EXAMS = ["Exam","Date","Students","Avg Score","Avg CPI","Pass Rate","Anomalies"];
  const TABLE_HEAD_STUDENTS = ["Rank","Student","Avg Score","Exams","Avg CPI","Anomalies","Reliability",""];

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* Topbar */}
        <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>SECT Instructor</span>
          <div className="ms-auto d-flex align-items-center gap-2">
            <InstructorAlertBell />
            <div className="dropdown">
              <button className="d-flex align-items-center gap-2 dropdown-toggle" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }} data-bs-toggle="dropdown">
                <div className="avatar">{initial}</div>
                <span className="d-none d-sm-inline" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{firstName}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
                <li><Link className="dropdown-item" to="/instructor/account-settings"><i className="bi bi-gear me-2"></i>Account Settings</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile"><i className="bi bi-person me-2"></i>Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout} style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}><i className="bi bi-box-arrow-right me-2"></i>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-stretch">
          {/* Sidebar */}
          <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
            style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}>
            {NAV_ITEMS.map(({ to, icon, label }) => (
              <Link key={to} to={to} className={`nav-pill ${isActive(to) ? "active" : ""}`}>
                <i className={`bi ${icon}`}></i>{label}
              </Link>
            ))}
          </nav>

          {/* Main */}
          <main className="main-content" style={{ flex: 1, padding: "24px 20px", paddingBottom: 100, minWidth: 0 }}>

            {/* Header */}
            <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>📊 Analytics & Reports</h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Exam performance, detection metrics, and student analytics</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-primary-dash"><i className="bi bi-file-earmark-pdf"></i>Export PDF</button>
                <button className="btn-outline-dash"><i className="bi bi-file-earmark-excel"></i>Export Excel</button>
              </div>
            </div>

            {/* Stat chips */}
            <div className="stats-row fade-up" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {STAT_CHIPS.map(({ label, value, color, bg, icon, sub }) => (
                <div key={label} className="stat-chip">
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <i className={`bi ${icon}`} style={{ color, fontSize: 13 }}></i>
                  </div>
                  <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                  <p style={{ margin: "4px 0 2px", fontSize: 11, fontWeight: 600, color: "#0f172a" }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="dash-card fade-up" style={{ marginBottom: 16 }}>
              <div className="tab-scroll" style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "0 8px" }}>
                {REPORT_TABS.map(({ key, label }) => (
                  <button key={key} className={`tab-btn ${reportType === key ? "active" : ""}`} onClick={() => setReportType(key)}>{label}</button>
                ))}
              </div>
            </div>

            {/* ── Overview ── */}
            {reportType === "overview" && (
              <div className="two-col fade-up" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Left col */}
                <div style={{ flex: "0 0 60%", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Bar chart */}
                  <div className="dash-card" style={{ padding: 24 }}>
                    <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Cheating Probability Index Trends</h3>
                    <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: 200, padding: "0 8px" }}>
                      {BAR_DATA.map(({ week, pct, height }) => {
                        const barColor = pct >= 10 ? "#f59e0b" : "#0056b3";
                        return (
                          <div key={week} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>{pct}%</span>
                            <div className="bar-chart-bar" style={{ width: 44, height, background: barColor, opacity: .85 }}></div>
                            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{week}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Exam summary table */}
                  <div className="dash-card">
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Exam Performance Summary</h3>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "#f8faff", borderBottom: "1px solid #f1f5f9" }}>
                            {TABLE_HEAD_EXAMS.map(h => (
                              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {EXAM_REPORTS.map(exam => (
                            <tr key={exam.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "11px 14px", fontWeight: 700, color: "#1e293b" }}>{exam.title}</td>
                              <td style={{ padding: "11px 14px", fontSize: 12, color: "#94a3b8" }}>{exam.date}</td>
                              <td style={{ padding: "11px 14px", color: "#64748b" }}>{exam.students}</td>
                              <td style={{ padding: "11px 14px", fontWeight: 700, color: "#0056b3" }}>{exam.avgScore}</td>
                              <td style={{ padding: "11px 14px", fontWeight: 700, color: cpiColor(exam.avgCPI) }}>{exam.avgCPI}</td>
                              <td style={{ padding: "11px 14px", color: "#64748b" }}>{exam.passRate}</td>
                              <td style={{ padding: "11px 14px" }}>
                                {exam.anomalyCount > 0
                                  ? <span className="badge-pill" style={{ background: "#fff7ed", color: "#c2410c" }}>{exam.anomalyCount}</span>
                                  : <span style={{ color: "#22c55e", fontWeight: 700 }}>0</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right col */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Algorithm performance */}
                  <div className="dash-card" style={{ padding: 20 }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Algorithm Performance</h3>
                    {[
                      { name: "Isolation Forest (IF)", accuracy: 96.8, count: 245, color: "#15803d", bg: "#f0fdf4" },
                      { name: "One-Class SVM",          accuracy: 94.2, count: 231, color: "#0056b3", bg: "#e8f0fe" },
                    ].map(({ name, accuracy, count, color, bg }) => (
                      <div key={name} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{name}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color }}>{accuracy}%</span>
                        </div>
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${accuracy}%`, background: color }}></div>
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>{count} anomalies detected</p>
                      </div>
                    ))}
                  </div>

                  {/* Anomaly types */}
                  <div className="dash-card" style={{ padding: 20 }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Anomaly Types</h3>
                    {[
                      { label: "Tab Switching",         count: 35, color: "#c2410c", bg: "#fff7ed" },
                      { label: "Keyboard Patterns",     count: 18, color: "#0056b3", bg: "#e8f0fe" },
                      { label: "Unusual Response Time", count: 28, color: "#1d4ed8", bg: "#eff6ff" },
                      { label: "Other",                 count: 12, color: "#64748b", bg: "#f1f5f9" },
                    ].map(({ label, count, color, bg }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
                        <span className="badge-pill" style={{ background: bg, color }}>{count}</span>
                      </div>
                    ))}
                  </div>

                  {/* System health */}
                  <div className="dash-card" style={{ padding: 20 }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>System Health</h3>
                    <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
                      {["Detection","Database","API"].map(name => (
                        <div key={name}>
                          <i className="bi bi-circle-fill" style={{ color: "#22c55e", fontSize: 18, display: "block", marginBottom: 4 }}></i>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{name}</p>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#22c55e" }}>Online</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Exam Reports ── */}
            {reportType === "exams" && (
              <div className="dash-card fade-up">
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>All Exam Reports</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8faff", borderBottom: "1px solid #f1f5f9" }}>
                        {TABLE_HEAD_EXAMS.map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {EXAM_REPORTS.map(exam => (
                        <tr key={exam.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>{exam.title}</td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>{exam.date}</td>
                          <td style={{ padding: "12px 16px", color: "#64748b" }}>{exam.students}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0056b3" }}>{exam.avgScore}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: cpiColor(exam.avgCPI) }}>{exam.avgCPI}</td>
                          <td style={{ padding: "12px 16px", color: "#64748b" }}>{exam.passRate}</td>
                          <td style={{ padding: "12px 16px" }}>
                            {exam.anomalyCount > 0
                              ? <span className="badge-pill" style={{ background: "#fff7ed", color: "#c2410c" }}>{exam.anomalyCount}</span>
                              : <span style={{ color: "#22c55e", fontWeight: 700 }}>0</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Student Performance ── */}
            {reportType === "students" && (
              <div className="dash-card fade-up">
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Top Performing Students</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8faff", borderBottom: "1px solid #f1f5f9" }}>
                        {TABLE_HEAD_STUDENTS.map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {STUDENT_REPORTS.map(s => {
                        const rs = RELIABILITY_STYLES[s.reliability] ?? { bg: "#f1f5f9", color: "#64748b" };
                        return (
                          <tr key={s.rank} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 16px", fontWeight: 700, color: "#94a3b8" }}>#{s.rank}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e8f0fe", color: "#0056b3", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                                  {s.name.charAt(0)}
                                </div>
                                <span style={{ fontWeight: 600, color: "#1e293b" }}>{s.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0056b3" }}>{s.avgScore}</td>
                            <td style={{ padding: "12px 16px", color: "#64748b" }}>{s.examsTaken}</td>
                            <td style={{ padding: "12px 16px", fontWeight: 700, color: cpiColor(s.avgCPI) }}>{s.avgCPI}</td>
                            <td style={{ padding: "12px 16px" }}>
                              {s.anomalies > 0
                                ? <span className="badge-pill" style={{ background: "#fff7ed", color: "#c2410c" }}>{s.anomalies}</span>
                                : <span style={{ color: "#22c55e", fontWeight: 700 }}>0</span>}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span className="badge-pill" style={{ background: rs.bg, color: rs.color }}>{s.reliability}</span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <button className="btn-outline-dash" style={{ padding: "4px 12px", fontSize: 11 }}>
                                <i className="bi bi-eye"></i>Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Anomaly Analysis ── */}
            {reportType === "anomalies" && (
              <div className="two-col fade-up" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Detection Metrics */}
                <div className="dash-card" style={{ flex: 1, padding: 24 }}>
                  <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Detection Metrics</h3>
                  {[
                    { label: "True Positives",  value: "142",   pct: 85, color: "#15803d", bg: "#f0fdf4" },
                    { label: "False Positives", value: "18",    pct: 10, color: "#c2410c", bg: "#fff7ed" },
                    { label: "True Negatives",  value: "1,235", pct: 95, color: "#15803d", bg: "#f0fdf4" },
                    { label: "False Negatives", value: "5",     pct: 3,  color: "#dc2626", bg: "#fef2f2" },
                  ].map(({ label, value, pct, color, bg }) => (
                    <div key={label} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Performance Indicators */}
                <div className="dash-card" style={{ flex: 1, padding: 24 }}>
                  <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Performance Indicators</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Precision",   value: "96.5%", color: "#15803d" },
                      { label: "Recall",      value: "96.6%", color: "#15803d" },
                      { label: "F1-Score",    value: "96.5%", color: "#0056b3" },
                      { label: "Specificity", value: "98.4%", color: "#1d4ed8" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="metric-box">
                        <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Bottom Nav */}
        <nav className="bottom-nav d-lg-none">
          {NAV_ITEMS.slice(0, 5).map(({ to, icon, label }) => (
            <Link key={to} to={to} className="bottom-nav-item"
              style={{ color: isActive(to) ? "#0056b3" : "#94a3b8", borderTop: isActive(to) ? "2px solid #0056b3" : "2px solid transparent" }}>
              <i className={`bi ${icon}`}></i>{label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Reports;