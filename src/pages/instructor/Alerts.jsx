// src/pages/instructor/Alerts.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import InstructorAlertBell from "../../components/InstructorAlertBell";

/* ─── Shared Design Tokens ──────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{--blue:#0056b3;--blue-lite:#e8f0fe;--slate:#64748b;--slate-lt:#94a3b8;--card-bg:#fff;--card-br:16px;--card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);}
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;}
  .glass-sidebar{background:rgba(255,255,255,0.60);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);}
  .nav-pill{display:flex;flex-direction:column;align-items:center;padding:10px 8px;border-radius:12px;gap:4px;font-size:11px;font-weight:600;text-decoration:none;color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;}
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .topbar{background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:100;height:56px;}
  .avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  .skeleton{background:linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .stat-chip{flex:1;min-width:140px;background:#fff;border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);padding:16px 18px;cursor:pointer;transition:box-shadow .2s,transform .2s,outline .1s;}
  .stat-chip:hover{box-shadow:0 2px 6px rgba(0,0,0,.06),0 8px 28px rgba(0,86,179,.10);transform:translateY(-1px);}
  .stat-chip.selected{outline:2px solid currentColor;outline-offset:-2px;}
  .search-input{border:1.5px solid rgba(0,86,179,.15);border-radius:10px;background:#f8faff;padding:7px 14px 7px 36px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s,box-shadow .2s;}
  .search-input:focus{border-color:#0056b3;box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .risk-bar-wrap{display:flex;align-items:center;gap:8px;}
  .risk-bar{height:6px;border-radius:99px;background:#f1f5f9;overflow:hidden;flex:1;min-width:60px;}
  .risk-bar-fill{height:100%;border-radius:99px;}
  .flag-badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .spin{animation:spin .8s linear infinite;display:inline-block;}
  .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,.08);}
  .bottom-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bottom-nav-item i{font-size:19px;}
  @media(max-width:991px){.main-content{padding:16px 12px 88px!important;}}
  @media(max-width:767px){.stats-row{flex-wrap:wrap!important;}.header-row{flex-direction:column!important;align-items:flex-start!important;gap:12px!important;}.controls-row{flex-direction:column!important;align-items:stretch!important;}.search-input{width:100%!important;}}
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

const FLAG_STYLES = {
  flagged: { bg: "#fef2f2", color: "#dc2626", label: "Flagged"  },
  warning: { bg: "#fff7ed", color: "#c2410c", label: "Warning"  },
  none:    { bg: "#f0fdf4", color: "#15803d", label: "Clear"    },
};

const riskColor = s => s >= 50 ? "#dc2626" : s >= 20 ? "#f59e0b" : "#22c55e";

const Alerts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user,           setUser]           = useState(null);
  const [exams,          setExams]          = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [summaries,      setSummaries]      = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [riskFilter,     setRiskFilter]     = useState("all");
  const [search,         setSearch]         = useState("");

  useEffect(() => {
    const boot = async () => {
      try {
        const [meRes, examsRes] = await Promise.all([API.get("/me"), API.get("/exams")]);
        setUser(meRes.data.user);
        const examList = examsRes.data.exams || [];
        setExams(examList);
        if (examList.length > 0) setSelectedExamId(String(examList[0].id));
      } catch (err) { console.error("Boot failed:", err); }
    };
    boot();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    fetchSummaries();
  }, [selectedExamId]);

  const fetchSummaries = async () => {
    setLoading(true);
    setSummaries([]);
    try {
      const res = await API.get(`/exams/${selectedExamId}/anomalies/summary`);
      setSummaries(res.data.summaries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total:   summaries.length,
    flagged: summaries.filter(s => s.flag_status === "flagged").length,
    warning: summaries.filter(s => s.flag_status === "warning").length,
    clear:   summaries.filter(s => s.flag_status !== "flagged" && s.flag_status !== "warning").length,
  };

  const filtered = summaries.filter(s => {
    if (riskFilter === "flagged" && s.flag_status !== "flagged") return false;
    if (riskFilter === "warning" && s.flag_status !== "warning") return false;
    if (riskFilter === "clear" && (s.flag_status === "flagged" || s.flag_status === "warning")) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.student?.name?.toLowerCase().includes(q) || s.student?.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/instructor/login");
  };

  const isActive  = to => to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "I";
  const firstName = user?.name?.split(" ")[0] ?? "Instructor";
  const selectedExam = exams.find(e => String(e.id) === String(selectedExamId));

  const STAT_CHIPS = [
    { key: "flagged", label: "Flagged",         value: stats.flagged, color: "#dc2626", bg: "#fef2f2", icon: "bi-shield-x"            },
    { key: "warning", label: "Warning",          value: stats.warning, color: "#c2410c", bg: "#fff7ed", icon: "bi-exclamation-triangle" },
    { key: "clear",   label: "Clear",            value: stats.clear,   color: "#15803d", bg: "#f0fdf4", icon: "bi-shield-check"         },
    { key: "all",     label: "Total Monitored",  value: stats.total,   color: "#0056b3", bg: "#e8f0fe", icon: "bi-people"               },
  ];

  const TABLE_HEADS = ["Student","Risk Score","Flag","Tabs","Keys","Response","Keystroke"];

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
            <div className="fade-up mb-4">
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>🚨 Cheating Alerts & Anomalies</h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Review flagged students and anomalous events per exam</p>
            </div>

            {/* Stat Chips */}
            <div className="fade-up stats-row" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {STAT_CHIPS.map(({ key, label, value, color, bg, icon }) => (
                <div key={key} className={`stat-chip${riskFilter === key ? " selected" : ""}`}
                  style={{ color }}
                  onClick={() => setRiskFilter(riskFilter === key ? "all" : key)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className={`bi ${icon}`} style={{ color, fontSize: 13 }}></i>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 700, lineHeight: 1, color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Student Risk Table */}
            <div className="dash-card fade-up">

              {/* Card header */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <div className="header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                      <i className="bi bi-people me-2" style={{ color: "#0056b3" }}></i>Student Risk Summary
                    </h2>
                    {riskFilter !== "all" && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: riskFilter === "flagged" ? "#fef2f2" : riskFilter === "warning" ? "#fff7ed" : "#f0fdf4",
                        color:      riskFilter === "flagged" ? "#dc2626" : riskFilter === "warning" ? "#c2410c" : "#15803d" }}>
                        {riskFilter.charAt(0).toUpperCase() + riskFilter.slice(1)} only
                        <button onClick={() => setRiskFilter("all")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 11, lineHeight: 1, color: "inherit" }}>✕</button>
                      </span>
                    )}
                  </div>

                  <div className="controls-row" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {/* Search */}
                    <div style={{ position: "relative" }}>
                      <i className="bi bi-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 12 }}></i>
                      <input className="search-input" style={{ width: 160 }} placeholder="Search student…" value={search} onChange={e => setSearch(e.target.value)} />
                      {search && (
                        <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 13 }}>✕</button>
                      )}
                    </div>
                    {/* Exam selector */}
                    <select value={selectedExamId} onChange={e => { setSelectedExamId(e.target.value); setRiskFilter("all"); setSearch(""); }}
                      style={{ border: "1.5px solid rgba(0,86,179,.15)", borderRadius: 10, padding: "7px 14px", fontSize: 13, color: "#1e293b", background: "#f8faff", outline: "none", fontFamily: "'DM Sans',sans-serif", minWidth: 200 }}>
                      {exams.length === 0 && <option value="">No exams found</option>}
                      {exams.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.title}{ex.course?.code ? ` — ${ex.course.code}` : ""}</option>
                      ))}
                    </select>
                    {/* Refresh */}
                    <button onClick={fetchSummaries} disabled={loading}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1.5px solid rgba(0,86,179,.15)", borderRadius: 10, background: "#f8faff", color: "#0056b3", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                      <i className={`bi bi-arrow-clockwise${loading ? " spin" : ""}`}></i>
                    </button>
                  </div>
                </div>

                {/* Exam context strip */}
                {selectedExam && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12, color: "#64748b", padding: "8px 12px", borderRadius: 10, background: "#f8faff" }}>
                    <i className="bi bi-file-earmark-text" style={{ color: "#0056b3" }}></i>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>{selectedExam.title}</span>
                    {selectedExam.course?.code && <span>— {selectedExam.course.code}</span>}
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                      background: selectedExam.status === "active" ? "#f0fdf4" : selectedExam.status === "scheduled" ? "#fff7ed" : "#eff6ff",
                      color:      selectedExam.status === "active" ? "#15803d" : selectedExam.status === "scheduled" ? "#c2410c" : "#1d4ed8" }}>
                      {selectedExam.status}
                    </span>
                    <span style={{ marginLeft: "auto" }}>{filtered.length} of {summaries.length} student{summaries.length !== 1 ? "s" : ""} shown</span>
                  </div>
                )}
              </div>

              {/* Table */}
              {loading ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <div className="spinner-border" style={{ color: "#0056b3", width: 32, height: 32 }} role="status"></div>
                  <p style={{ margin: "12px 0 0", fontSize: 13, color: "#94a3b8" }}>Loading anomaly data…</p>
                </div>
              ) : summaries.length === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
                  <i className="bi bi-shield-check" style={{ fontSize: 36, display: "block", marginBottom: 10, color: "#22c55e" }}></i>
                  <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#15803d" }}>No anomaly data for this exam yet.</p>
                  <span style={{ fontSize: 12 }}>Data appears once students submit.</span>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
                  <i className="bi bi-funnel" style={{ fontSize: 32, display: "block", marginBottom: 10 }}></i>
                  <p style={{ margin: "0 0 12px", fontSize: 13 }}>No students match the current filter.</p>
                  <button onClick={() => { setRiskFilter("all"); setSearch(""); }}
                    style={{ padding: "7px 18px", border: "1.5px solid rgba(0,86,179,.2)", borderRadius: 10, background: "#f8faff", color: "#0056b3", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Clear filters
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8faff", borderBottom: "1px solid #f1f5f9" }}>
                        {TABLE_HEADS.map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(s => {
                        const cpi       = s.cpi_score ?? 0;
                        const isFlagged = s.flag_status === "flagged";
                        const isWarning = s.flag_status === "warning";
                        const flagStyle = FLAG_STYLES[isFlagged ? "flagged" : isWarning ? "warning" : "none"];
                        const avatarBg  = isFlagged ? "#fef2f2" : isWarning ? "#fff7ed" : "#f0fdf4";
                        const avatarCol = isFlagged ? "#dc2626" : isWarning ? "#c2410c" : "#15803d";
                        return (
                          <tr key={s.submission_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: "50%", background: avatarBg, color: avatarCol, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                                  {s.student?.name?.charAt(0).toUpperCase() ?? "?"}
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontWeight: 600, color: "#1e293b" }}>{s.student?.name}</p>
                                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{s.student?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", minWidth: 140 }}>
                              <div className="risk-bar-wrap">
                                <div className="risk-bar">
                                  <div className="risk-bar-fill" style={{ width: `${Math.min(cpi, 100)}%`, background: riskColor(cpi) }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: riskColor(cpi), flexShrink: 0 }}>{cpi.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span className="flag-badge" style={{ background: flagStyle.bg, color: flagStyle.color }}>{flagStyle.label}</span>
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#1e293b" }}>{s.tab_switch_count ?? 0}</td>
                            <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#1e293b" }}>{s.keyboard_shortcut_count ?? 0}</td>
                            <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#1e293b" }}>{s.response_time_anomaly_count ?? 0}</td>
                            <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#1e293b" }}>{s.keystroke_anomaly_count ?? 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer */}
              {!loading && summaries.length > 0 && (
                <div style={{ padding: "10px 20px", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#94a3b8" }}>
                  <i className="bi bi-info-circle me-1"></i>
                  Showing {filtered.length} of {summaries.length} student{summaries.length !== 1 ? "s" : ""}. Click a stat card above to filter by risk level.
                </div>
              )}
            </div>
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

export default Alerts;