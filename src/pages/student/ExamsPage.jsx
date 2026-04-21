import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";

/* ─── Shared design-system styles (mirrors Dashboard) ─── */
const GLOBAL_CSS = `
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
  }
  .topbar {
    background: rgba(255,255,255,0.80);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(0,86,179,.08);
    position: sticky; top: 0; z-index: 100; height: 56px;
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
    color: var(--slate); transition: background .15s, color .15s, transform .15s; width: 100%;
  }
  .nav-pill:hover  { background: var(--blue-lite); color: var(--blue); transform: translateY(-1px); }
  .nav-pill.active { background: var(--blue); color: #fff; box-shadow: 0 4px 14px rgba(0,86,179,.35); }
  .nav-pill i { font-size: 18px; }
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
    font-family: 'DM Sans', sans-serif; width: 100%;
    transition: border-color .2s, box-shadow .2s;
  }
  .search-input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(0,86,179,.10);
    background: #fff;
  }
  .tab-pill {
    padding: 6px 16px; border-radius: 99px; border: none;
    font-size: 13px; font-weight: 600; cursor: pointer;
    background: transparent; color: var(--slate-lt);
    transition: background .15s, color .15s;
    font-family: 'DM Sans', sans-serif; white-space: nowrap;
  }
  .tab-pill.active { background: var(--blue-lite); color: var(--blue); }
  .tab-pill:hover:not(.active) { color: var(--slate); background: #f1f5f9; }
  .exam-card {
    background: var(--card-bg); border-radius: var(--card-br);
    box-shadow: var(--card-sh); border: 1px solid rgba(0,86,179,.06);
    transition: box-shadow .22s, transform .22s, border-color .22s;
    overflow: hidden; display: flex; flex-direction: column;
  }
  .exam-card:hover {
    box-shadow: 0 4px 24px rgba(0,86,179,.13);
    transform: translateY(-3px); border-color: rgba(0,86,179,.18);
  }
  .stat-pip {
    flex: 1; background: #f8faff; border-radius: 10px; padding: 10px 8px;
    text-align: center; border: 1px solid rgba(0,86,179,.06);
  }
  .prog-track { height: 5px; border-radius: 99px; background: #eef2ff; overflow: hidden; }
  .prog-fill  { height: 100%; border-radius: 99px; transition: width 1s cubic-bezier(.4,0,.2,1); }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .35s ease both; }
  .bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0; height: 64px;
    background: rgba(255,255,255,0.92); backdrop-filter: blur(16px);
    border-top: 1px solid rgba(0,86,179,0.10);
    display: flex; align-items: stretch; z-index: 1030;
    box-shadow: 0 -4px 24px rgba(0,86,179,0.08);
  }
  .bottom-nav a {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; font-size: 10px; font-weight: 600; gap: 3px;
    text-decoration: none; color: #94a3b8; transition: color .2s;
    border-top: 2px solid transparent;
  }
  .bottom-nav a.active { color: #0056b3; border-top-color: #0056b3; }
  .bottom-nav a i { font-size: 19px; }
`;


const NAV_ITEMS = [
  { to: "/student",                  icon: "bi-speedometer2",     label: "Home"     },
  { to: "/student/subjects",         icon: "bi-journal-bookmark", label: "Subjects" },
  { to: "/student/exams",            icon: "bi-pencil-square",    label: "Exams"    }, 
  { to: "/student/grades",           icon: "bi-graph-up-arrow",   label: "Grades"   },
  { to: "/student/account-settings", icon: "bi-gear",             label: "Settings" },
];

const STATUS = {
  submitted: { color: "#22c55e", bg: "#f0fdf4", label: "Submitted"  },
  open:      { color: "#0056b3", bg: "#e8f0fe", label: "Open"       },
  upcoming:  { color: "#f59e0b", bg: "#fff7ed", label: "Upcoming"   },
  ended:     { color: "#94a3b8", bg: "#f1f5f9", label: "Ended"      },
};

const getStatus = (exam) => {
  if (exam.submission?.status === "submitted") return "submitted";
  const now = new Date();
  if (new Date(exam.end_time)   < now) return "ended";
  if (new Date(exam.start_time) > now) return "upcoming";
  return "open";
};

const TABS = ["all", "open", "upcoming", "submitted", "ended"];
const TAB_LABELS = {
  all:       "All Exams",
  open:      "Open",
  upcoming:  "Upcoming",
  submitted: "Submitted",
  ended:     "Ended",
};

/* ─── Sub-components ─── */
const BottomNav = ({ active }) => (
  <nav className="bottom-nav d-lg-none">
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={active === label ? "active" : ""}>
        <i className={`bi ${icon}`}></i>{label}
      </Link>
    ))}
  </nav>
);

const Topbar = ({ user, onLogout, searchTerm, onSearch }) => {
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "S";
  const firstName = user?.name?.split(" ")[0] ?? "Student";
  return (
    <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
      <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
        SECT Portal
      </span>
      <div className="d-none d-md-flex align-items-center ms-4 position-relative" style={{ flex: 1, maxWidth: 320 }}>
        <i className="bi bi-search" style={{ position: "absolute", left: 12, color: "#94a3b8", fontSize: 13, zIndex: 1 }}></i>
        <input className="search-input" placeholder="Search exams…" value={searchTerm} onChange={e => onSearch(e.target.value)} />
      </div>
      <div className="ms-auto d-flex align-items-center gap-2">
        <button style={{ background: "transparent", border: "none", position: "relative", padding: "4px 8px", cursor: "pointer" }}>
          <i className="bi bi-bell" style={{ fontSize: 18, color: "#64748b" }}></i>
          <span style={{ position: "absolute", top: 2, right: 6, width: 7, height: 7, background: "#ef4444", borderRadius: "50%", border: "1.5px solid #f0f4fb" }}></span>
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
              <button className="dropdown-item text-danger" onClick={onLogout}
                style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ active }) => (
  <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
    style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}>
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={`nav-pill${active === label ? " active" : ""}`}>
        <i className={`bi ${icon}`}></i>{label}
      </Link>
    ))}
  </nav>
);

const EmptyState = ({ icon, title, subtitle }) => (
  <div style={{ textAlign: "center", padding: "64px 24px", color: "#94a3b8" }}>
    <i className={`bi ${icon}`} style={{ fontSize: 48, display: "block", marginBottom: 16, opacity: .5 }}></i>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#64748b" }}>{title}</p>
    {subtitle && <p style={{ margin: "6px 0 0", fontSize: 13 }}>{subtitle}</p>}
  </div>
);

/* ─── Exam Card ─── */
const ExamCard = ({ exam, idx }) => {
  const status     = getStatus(exam);
  const st         = STATUS[status];
  const done       = status === "submitted";
  const takable    = status === "open";
  const pct        = done && exam.submission?.total_points > 0
    ? Math.round((exam.submission.score / exam.submission.total_points) * 100) : null;
  const scoreColor = pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="exam-card fade-up"
      style={{ animationDelay: `${idx * 0.05}s`, borderTop: `3px solid ${st.color}` }}
    >
      <div style={{ padding: "18px 20px 0" }}>
        {/* Status + subject row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ background: st.bg, color: st.color, borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
            {st.label}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#0056b3", background: "#e8f0fe", borderRadius: 99, padding: "2px 9px" }}>
            {exam.course?.code ?? exam.course_code ?? ""}
          </span>
        </div>

        {/* Title */}
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
          {exam.title}
        </h3>

        {/* Subject name */}
        {(exam.course?.name || exam.course_name) && (
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748b" }}>
            <i className="bi bi-journal-bookmark me-1"></i>
            {exam.course?.name ?? exam.course_name}
          </p>
        )}

        {exam.description && (
          <p style={{ margin: "0 0 14px", fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{exam.description}</p>
        )}
      </div>

      {/* Stat pips */}
      <div style={{ display: "flex", gap: 8, padding: "0 20px", marginBottom: 14 }}>
        {[
          { val: exam.questions_count,       label: "Questions" },
          { val: `${exam.duration_minutes}m`, label: "Duration"  },
          { val: exam.total_points,          label: "Points"    },
        ].map(s => (
          <div key={s.label} className="stat-pip">
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{s.val}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Date range */}
      <div style={{ padding: "0 20px", marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
          <i className="bi bi-calendar3 me-1"></i>
          {new Date(exam.start_time).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          {" – "}
          {new Date(exam.end_time).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Score bar if submitted */}
      {done && pct !== null && (
        <div style={{ padding: "0 20px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Your Score</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor }}>
              {exam.submission.score}/{exam.submission.total_points} ({pct}%)
            </span>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{ width: `${pct}%`, background: scoreColor }} />
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: "0 20px 20px", marginTop: "auto" }}>
        {takable && (
          <Link to={`/student/exams/${exam.id}/take`} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "#0056b3", color: "#fff", borderRadius: 10, padding: "10px",
            fontSize: 13, fontWeight: 700, textDecoration: "none", transition: "opacity .15s"
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <i className="bi bi-pencil-square"></i>Take Exam
          </Link>
        )}
        {done && (
          <Link to={`/student/exams/${exam.id}/results`} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "#f0fdf4", color: "#22c55e", border: "1px solid #bbf7d0",
            borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700,
            textDecoration: "none", transition: "background .15s"
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#dcfce7"}
            onMouseLeave={e => e.currentTarget.style.background = "#f0fdf4"}
          >
            <i className="bi bi-bar-chart"></i>View Results
          </Link>
        )}
        {!takable && !done && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "#f8faff", color: "#94a3b8", border: "1px solid #e2e8f0",
            borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600
          }}>
            {status === "upcoming"
              ? <><i className="bi bi-clock"></i>Not Started Yet</>
              : <><i className="bi bi-lock"></i>Exam Ended</>}
          </div>
        )}
      </div>
    </div>
  );
};

const ExamsPage = () => {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [exams, setExams]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab]   = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [uRes, eRes] = await Promise.all([
          API.get("/me"),
          API.get("/student/exams"),   // ← new endpoint (see backend notes below)
        ]);
        setUser(uRes.data.user);
        setExams(eRes.data.exams || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Unknown error");
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

  const filtered = useMemo(() => {
    let list = [...exams];

    // Filter by tab (status)
    if (activeTab !== "all") {
      list = list.filter(e => getStatus(e) === activeTab);
    }

    // Filter by search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.course?.name  || e.course_name  || "").toLowerCase().includes(q) ||
        (e.course?.code  || e.course_code  || "").toLowerCase().includes(q) ||
        (e.description   || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [exams, activeTab, searchTerm]);

  // Stats derived from all exams (ignores search/tab filter)
  const counts = useMemo(() => ({
    all:       exams.length,
    open:      exams.filter(e => getStatus(e) === "open").length,
    upcoming:  exams.filter(e => getStatus(e) === "upcoming").length,
    submitted: exams.filter(e => getStatus(e) === "submitted").length,
    ended:     exams.filter(e => getStatus(e) === "ended").length,
  }), [exams]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f4fb" }}>
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        <Topbar user={user} onLogout={handleLogout} searchTerm={searchTerm} onSearch={setSearchTerm} />

        <div className="d-flex align-items-stretch">
          <Sidebar active="Exams" />

          <main style={{ flex: 1, padding: "24px 20px", paddingBottom: 100, minWidth: 0 }}>

            {/* Mobile search */}
            <div className="d-md-none mb-3 position-relative">
              <i className="bi bi-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, zIndex: 1 }}></i>
              <input className="search-input" placeholder="Search exams…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* Page header */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>Academic</p>
              <h1 style={{ margin: "4px 0 4px", fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-.4px" }}>My Exams</h1>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                {counts.all} exam{counts.all !== 1 ? "s" : ""} across all enrolled subjects
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ color: "#ef4444", marginTop: 2 }}></i>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#dc2626" }}>Could not load exams</p>
                  <p style={{ margin: "2px 0 8px", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{error}</p>
                  <button onClick={() => window.location.reload()}
                    style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Stats strip */}
            {!error && counts.all > 0 && (
              <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                  { label: "Total",     val: counts.all,       color: "#0056b3", bg: "#e8f0fe" },
                  { label: "Open",      val: counts.open,      color: "#0056b3", bg: "#e8f0fe" },
                  { label: "Upcoming",  val: counts.upcoming,  color: "#f59e0b", bg: "#fff7ed" },
                  { label: "Submitted", val: counts.submitted, color: "#22c55e", bg: "#f0fdf4" },
                  { label: "Ended",     val: counts.ended,     color: "#94a3b8", bg: "#f1f5f9" },
                ].map(s => (
                  <div key={s.label} className="fade-up" style={{
                    background: s.bg, borderRadius: 12, padding: "10px 16px",
                    display: "flex", alignItems: "center", gap: 10, minWidth: 100
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.color, opacity: .8 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24, overflowX: "auto", paddingBottom: 2 }}>
              {TABS.map(tab => (
                <button key={tab} className={`tab-pill${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}>
                  {TAB_LABELS[tab]}{tab !== "all" ? ` (${counts[tab]})` : ""}
                </button>
              ))}
            </div>

            {/* Exam grid */}
            {!error && (
              filtered.length === 0 ? (
                <EmptyState
                  icon="bi-file-earmark-x"
                  title={searchTerm ? "No exams match your search" : `No ${activeTab === "all" ? "" : activeTab + " "}exams`}
                  subtitle={searchTerm ? "Try a different keyword" : activeTab === "all" ? "Your instructor hasn't published any exams yet." : undefined}
                />
              ) : (
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                  {filtered.map((exam, i) => (
                    <ExamCard key={exam.id} exam={exam} idx={i} />
                  ))}
                </div>
              )
            )}
          </main>
        </div>

        <BottomNav active="Exams" />
      </div>
    </>
  );
};

export default ExamsPage;