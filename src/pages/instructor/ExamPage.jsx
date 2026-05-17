import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../lib/api";
import Swal from "sweetalert2";
import InstructorAlertBell from "../../components/InstructorAlertBell";

const NAV_ITEMS = [
  { to: "/instructor",                  icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/instructor/courses",          icon: "bi-book",                 label: "Courses"   },
  { to: "/instructor/exams",            icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/instructor/students",         icon: "bi-people",               label: "Students"  },
  { to: "/instructor/alerts",           icon: "bi-exclamation-triangle", label: "Alerts"    },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

/* Bottom nav: Dashboard, Courses, Exams, Students, Alerts — NO Settings */
const BOTTOM_NAV = [
  { to: "/instructor",         icon: "bi-speedometer2",         label: "Home"     },
  { to: "/instructor/courses", icon: "bi-book",                 label: "Courses"  },
  { to: "/instructor/exams",   icon: "bi-file-earmark-text",    label: "Exams"    },
  { to: "/instructor/students",icon: "bi-people",               label: "Students" },
  { to: "/instructor/alerts",  icon: "bi-exclamation-triangle", label: "Alerts"   },
];

const STATUS_STYLE = {
  active:    { bg: "#f0fdf4", color: "#15803d", label: "Active"    },
  scheduled: { bg: "#fff7ed", color: "#c2410c", label: "Scheduled" },
  completed: { bg: "#f0f9ff", color: "#0369a1", label: "Completed" },
  draft:     { bg: "#f1f5f9", color: "#64748b", label: "Draft"     },
};

const STAT_TABS = (stats) => [
  { key: "all",       label: "Total",     value: stats.total,     color: "#0056b3", bg: "#e8f0fe", icon: "bi-file-earmark-text" },
  { key: "active",    label: "Active",    value: stats.active,    color: "#15803d", bg: "#f0fdf4", icon: "bi-play-circle"       },
  { key: "scheduled", label: "Scheduled", value: stats.scheduled, color: "#c2410c", bg: "#fff7ed", icon: "bi-calendar-event"    },
  { key: "completed", label: "Completed", value: stats.completed, color: "#0369a1", bg: "#f0f9ff", icon: "bi-check-circle"      },
  { key: "draft",     label: "Draft",     value: stats.draft,     color: "#64748b", bg: "#f1f5f9", icon: "bi-pencil-square"     },
];

const localInputToUTC = (localString) => {
  if (!localString) return "";
  return new Date(localString).toISOString();
};

const PAGE_SIZE = 15;

const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{
    --blue:#0056b3;--blue-mid:#1a6ed8;--blue-lite:#e8f0fe;
    --slate:#64748b;--slate-lt:#94a3b8;
    --card-bg:#ffffff;--card-br:16px;
    --card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);
  }
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);transition:box-shadow .2s,transform .2s;overflow:hidden;}
  .dash-card-hover:hover{box-shadow:0 2px 6px rgba(0,0,0,.06),0 8px 28px rgba(0,86,179,.10);transform:translateY(-1px);}
  .glass-sidebar{background:rgba(255,255,255,0.60);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);}
  .nav-pill{display:flex;flex-direction:column;align-items:center;padding:10px 8px;border-radius:12px;gap:4px;font-size:11px;font-weight:600;text-decoration:none;color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;}
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .topbar{background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:200;height:56px;display:flex;align-items:center;padding:0 20px;gap:12px;}
  .dash-avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  .dash-search{border:1px solid rgba(0,86,179,.15);border-radius:10px;background:#f8faff;padding:7px 14px 7px 36px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;width:100%;transition:border-color .2s,box-shadow .2s;}
  .dash-search:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .skeleton{background:linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}

  /* ── Stat chips ── */
  .stat-chips-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}
  .stat-chip{border-radius:12px;padding:10px;display:flex;align-items:center;gap:8px;cursor:pointer;border:2px solid transparent;transition:border-color .15s,box-shadow .15s,transform .15s;background:#f8faff;overflow:hidden;min-width:0;}
  .stat-chip:hover{transform:translateY(-1px);}
  .stat-chip.selected{border-color:currentColor;box-shadow:0 4px 16px rgba(0,86,179,.12);}
  .stat-chip-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .stat-chip-text{min-width:0;overflow:hidden;}
  .stat-chip-value{margin:0;font-size:17px;font-weight:700;line-height:1;}
  .stat-chip-label{margin:2px 0 0;font-size:10px;font-weight:600;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;}

  /* ── Table ── */
  .dash-table{width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif;}
  .dash-table th{padding:10px 14px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.06em;white-space:nowrap;border-bottom:1px solid #f1f5f9;text-align:left;background:#f8faff;}
  .dash-table td{padding:12px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle;}
  .dash-table tbody tr{transition:background .15s;}
  .dash-table tbody tr:hover{background:#f8faff;}
  .dash-table tbody tr:last-child td{border-bottom:none;}

  /* ── Exam card (mobile) ── */
  .exam-card{background:#fff;border-radius:14px;border:1px solid rgba(0,86,179,.06);box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden;}
  .exam-card-body{padding:14px 16px;display:flex;flex-direction:column;gap:6px;}
  .exam-card-title{font-size:14px;font-weight:700;color:#0f172a;text-decoration:none;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .exam-card-course{font-size:11px;color:#64748b;text-decoration:none;display:flex;align-items:center;gap:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .exam-card-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
  .exam-card-meta-item{font-size:11px;color:#94a3b8;display:flex;align-items:center;gap:3px;white-space:nowrap;}
  .exam-card-action-bar{padding:9px 16px;border-top:1px solid rgba(0,86,179,.06);background:#fafbff;display:flex;align-items:center;justify-content:space-between;}

  /* ── Shared badge/button styles ── */
  .action-btn{width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,86,179,.15);background:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;font-size:13px;text-decoration:none;color:#64748b;flex-shrink:0;}
  .action-btn:hover{background:var(--blue-lite);border-color:var(--blue);color:var(--blue);}
  .action-btn.del:hover{background:#fef2f2;border-color:#ef4444;color:#ef4444;}
  .type-badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:#f1f5f9;color:#64748b;white-space:nowrap;}
  .status-pill{display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;}
  .dash-btn-primary{background:var(--blue);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:opacity .15s,transform .15s;text-decoration:none;}
  .dash-btn-primary:hover{opacity:.87;transform:translateY(-1px);color:#fff;}
  .dash-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .dash-btn-ghost{background:#fff;border:1px solid rgba(0,86,179,.15);color:#0056b3;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:all .15s;text-decoration:none;}
  .dash-btn-ghost:hover{background:var(--blue-lite);color:var(--blue);}

  /* ── Modal ── */
  .dash-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);backdrop-filter:blur(4px);z-index:1055;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;}
  .dash-modal{background:#fff;border-radius:20px;width:100%;max-width:680px;box-shadow:0 24px 64px rgba(0,0,0,.18);overflow:hidden;display:flex;flex-direction:column;max-height:calc(100vh - 32px);animation:fadeUp .25s ease;}
  .dash-modal-hdr{padding:20px 24px 16px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0;}
  .dash-modal-body{overflow-y:auto;padding:20px 24px;flex:1;}
  .dash-modal-ftr{padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;}
  .form-lbl{font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;display:block;}
  .form-ctrl{width:100%;border:1px solid rgba(0,86,179,.15);border-radius:10px;padding:9px 13px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;background:#f8faff;transition:border-color .2s,box-shadow .2s;}
  .form-ctrl:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .form-ctrl:disabled{opacity:.6;cursor:not-allowed;}
  .form-ctrl option{background:#fff;}

  /* ── Bottom nav ── */
  .instructor-bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;font-weight:600;gap:2px;text-decoration:none;transition:color .2s;}
  .bnav-item i{font-size:18px;}

  /* ── Pagination ── */
  .pagination-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,86,179,.15);background:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;color:#64748b;}
  .pagination-btn:hover{background:var(--blue-lite);border-color:var(--blue);color:var(--blue);}
  .pagination-btn.active{background:var(--blue);border-color:var(--blue);color:#fff;}
  .pagination-btn:disabled{opacity:.4;cursor:not-allowed;}

  /* Desktop: show table, hide cards */
  .mobile-exam-list{display:none;}
  .desktop-exam-table{display:block;}

  @media(max-width:991px){
    .stat-chips-grid{grid-template-columns:repeat(3,1fr);}
    .hide-mobile{display:none!important;}
  }
  @media(max-width:767px){
    .mobile-exam-list{display:flex;flex-direction:column;gap:10px;padding:14px;}
    .desktop-exam-table{display:none;}
    .stat-chips-grid{grid-template-columns:repeat(2,1fr);}
    .modal-time-grid{grid-template-columns:1fr!important;}
    .modal-title-type-grid{grid-template-columns:1fr!important;}
  }
  @media(max-width:400px){
    .stat-chip-value{font-size:15px;}
  }
`;

/* ─── Bottom Nav ─────────────────────────────────────────────────────────── */
const InstructorBottomNav = ({ active }) => (
  <nav className="instructor-bottom-nav d-lg-none">
    {BOTTOM_NAV.map(({ to, icon, label }) => (
      <Link key={to} to={to} className="bnav-item"
        style={{
          color: active === label ? "#0056b3" : "#94a3b8",
          borderTop: active === label ? "2px solid #0056b3" : "2px solid transparent",
        }}>
        <i className={`bi ${icon}`}></i>
        {label}
      </Link>
    ))}
  </nav>
);

/* ─── Pagination ─────────────────────────────────────────────────────────── */
const Pagination = ({ total, page, perPage, onChange }) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);
  const visible = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
      <button className="pagination-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <i className="bi bi-chevron-left" style={{ fontSize: 11 }}></i>
      </button>
      {visible.map((p, idx) => {
        const prev = visible[idx - 1];
        return (
          <React.Fragment key={p}>
            {prev && p - prev > 1 && <span style={{ color: "#94a3b8", fontSize: 13 }}>…</span>}
            <button className={`pagination-btn ${p === page ? "active" : ""}`} onClick={() => onChange(p)}>{p}</button>
          </React.Fragment>
        );
      })}
      <button className="pagination-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        <i className="bi bi-chevron-right" style={{ fontSize: 11 }}></i>
      </button>
      <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
      </span>
    </div>
  );
};

/* ─── Exam Card (mobile view) ────────────────────────────────────────────── */
const ExamCard = ({ exam, onDelete }) => {
  const ss = STATUS_STYLE[exam.status] || STATUS_STYLE.draft;
  return (
    <div className="exam-card">
      <div className="exam-card-body">
        <Link to={`/instructor/exams/${exam.id}`} className="exam-card-title">{exam.title}</Link>
        <Link to={`/instructor/courses/${exam.course?.id}`} className="exam-card-course">
          <i className="bi bi-folder2"></i>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {exam.course?.code} — {exam.course?.name}
          </span>
        </Link>
        <div className="exam-card-meta">
          <span className="type-badge">{exam.type}</span>
          <span className="exam-card-meta-item"><i className="bi bi-clock"></i>{exam.duration_minutes}m</span>
          <span className="exam-card-meta-item"><i className="bi bi-question-circle"></i>{exam.questions_count || 0} Qs</span>
        </div>
        {exam.start_time && (
          <span className="exam-card-meta-item" style={{ fontSize: 11 }}>
            <i className="bi bi-calendar3"></i>{new Date(exam.start_time).toLocaleString()}
          </span>
        )}
      </div>
      <div className="exam-card-action-bar">
        <span className="status-pill" style={{ background: ss.bg, color: ss.color, fontSize: 11 }}>{ss.label}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <Link to={`/instructor/exams/${exam.id}`} className="action-btn" title="View"><i className="bi bi-eye"></i></Link>
          <Link to={`/instructor/exams/${exam.id}/edit`} className="action-btn" title="Edit"><i className="bi bi-pencil"></i></Link>
          <button className="action-btn del" onClick={() => onDelete(exam.id)} title="Delete"><i className="bi bi-trash"></i></button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════════ */
const ExamPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user,          setUser]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [dataLoading,   setDataLoading]   = useState(true);
  const [courses,       setCourses]       = useState([]);
  const [exams,         setExams]         = useState([]);
  const [showExamModal, setShowExamModal] = useState(false);
  const [page,          setPage]          = useState(1);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    window.location.href = "/instructor/login";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, coursesRes, examsRes] = await Promise.all([
          API.get("/me"),
          API.get("/courses"),
          API.get("/exams"),
        ]);
        setUser(userRes.data.user);
        setCourses(coursesRes.data.courses || []);
        setExams(examsRes.data.exams       || []);
      } catch {
        Swal.fire({ icon: "error", title: "Failed to load data", text: "Please refresh and try again." });
      } finally {
        setLoading(false);
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => { setPage(1); }, [searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total:     exams.length,
    active:    exams.filter(e => e.status === "active").length,
    scheduled: exams.filter(e => e.status === "scheduled").length,
    completed: exams.filter(e => e.status === "completed").length,
    draft:     exams.filter(e => e.status === "draft").length,
  }), [exams]);

  const filteredExams = useMemo(() => {
    let list = exams;
    if (statusFilter !== "all") list = list.filter(e => e.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.course?.name?.toLowerCase().includes(q) ||
        e.course?.code?.toLowerCase().includes(q) ||
        e.type?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [exams, searchQuery, statusFilter]);

  const paginatedExams = filteredExams.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteExam = async (examId) => {
    const result = await Swal.fire({
      title: "Delete this exam?", text: "This cannot be undone.", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/exams/${examId}`);
      setExams(prev => prev.filter(e => e.id !== examId));
      Swal.fire("Deleted!", "Exam has been deleted.", "success");
    } catch {
      Swal.fire("Error!", "Failed to delete exam.", "error");
    }
  };

  const isActive  = (to) => to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "I";
  const firstName = user?.name?.split(" ")[0] ?? "Instructor";

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f0f4fb" }}>
      <style>{SHARED_CSS}</style>
      <div className="spinner-border" style={{ color: "#0056b3" }} />
    </div>
  );

  return (
    <>
      <style>{SHARED_CSS}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* ── Topbar ── */}
        <div className="topbar">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
            SECT Instructor
          </span>
          <div className="hide-mobile" style={{ flex: 1, maxWidth: 380, position: "relative" }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13 }}></i>
            <input className="dash-search" placeholder="Search exams…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <InstructorAlertBell />
            <div className="dropdown">
              <button className="d-flex align-items-center gap-2 dropdown-toggle"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }}
                data-bs-toggle="dropdown">
                <div className="dash-avatar">{initial}</div>
                <span className="d-none d-sm-inline" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{firstName}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
                <li><Link className="dropdown-item" to="/instructor/account-settings">Account Settings</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile">Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout}
                  style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="d-flex">
          {/* ── Sidebar ── */}
          <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
            style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}>
            {NAV_ITEMS.map(({ to, icon, label }) => (
              <Link key={to} to={to} className={`nav-pill ${isActive(to) ? "active" : ""}`}>
                <i className={`bi ${icon}`}></i>{label}
              </Link>
            ))}
          </nav>

          {/* ── Main ── */}
          <main style={{ flex: 1, padding: "20px 16px", paddingBottom: 90, minWidth: 0 }}>

            {/* Mobile search */}
            <div className="d-lg-none mb-3" style={{ position: "relative" }}>
              <i className="bi bi-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, zIndex: 1 }}></i>
              <input className="dash-search" style={{ paddingLeft: 36 }} placeholder="Search exams…"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            {/* ── Page header ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Management</p>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-.4px" }}>Exams</h1>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Create and manage your exams</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Link to="/instructor/courses" className="dash-btn-ghost" style={{ fontSize: 12, padding: "7px 12px" }}>
                  <i className="bi bi-book"></i>
                  <span className="d-none d-sm-inline"> Courses</span>
                </Link>
                <button className="dash-btn-primary" style={{ fontSize: 12, padding: "7px 12px" }} onClick={() => setShowExamModal(true)}>
                  <i className="bi bi-plus-circle"></i>
                  <span className="d-none d-sm-inline"> New Exam</span>
                  <span className="d-sm-none">New</span>
                </button>
              </div>
            </div>

            {dataLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 14 }} />)}
              </div>
            ) : (
              <>
                {/* ── Stat Chips ── */}
                <div className="dash-card fade-up" style={{ padding: "12px", marginBottom: 14 }}>
                  <div className="stat-chips-grid">
                    {STAT_TABS(stats).map(({ key, label, value, color, bg, icon }) => {
                      const sel = statusFilter === key;
                      return (
                        <div key={key}
                          className={`stat-chip ${sel ? "selected" : ""}`}
                          style={{ color, background: sel ? bg : "#f8faff" }}
                          onClick={() => setStatusFilter(sel && key !== "all" ? "all" : key)}>
                          <div className="stat-chip-icon" style={{ background: bg }}>
                            <i className={`bi ${icon}`} style={{ color, fontSize: 13 }}></i>
                          </div>
                          <div className="stat-chip-text">
                            <p className="stat-chip-value" style={{ color }}>{value}</p>
                            <p className="stat-chip-label" style={{ color }}>{label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(searchQuery || statusFilter !== "all") && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {filteredExams.length} of {exams.length} shown
                      </span>
                      <button className="dash-btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }}
                        onClick={() => { setStatusFilter("all"); setSearchQuery(""); }}>
                        <i className="bi bi-x-circle"></i> Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Exam List Card ── */}
                <div className="dash-card fade-up">
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                      <i className="bi bi-file-earmark-text me-2" style={{ color: "#0056b3" }}></i>All Exams
                    </h2>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{filteredExams.length} exam{filteredExams.length !== 1 ? "s" : ""}</span>
                  </div>

                  {filteredExams.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                      <i className="bi bi-file-earmark-x" style={{ fontSize: 28, display: "block", marginBottom: 10 }}></i>
                      <span style={{ fontSize: 13 }}>
                        {searchQuery || statusFilter !== "all" ? "No exams match your search or filter." : "No exams yet."}
                      </span>
                      {!searchQuery && statusFilter === "all" && (
                        <div style={{ marginTop: 12 }}>
                          <button className="dash-btn-primary" onClick={() => setShowExamModal(true)}>
                            <i className="bi bi-plus-circle"></i> Create your first exam
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* ── Desktop: table ── */}
                      <div className="desktop-exam-table" style={{ overflowX: "auto" }}>
                        <table className="dash-table">
                          <thead>
                            <tr>
                              {["EXAM NAME", "COURSE", "TYPE", "START TIME", "DURATION", "QS", "STATUS", "ACTIONS"].map(h => (
                                <th key={h} style={{ textAlign: h === "ACTIONS" || h === "QS" ? "center" : "left" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedExams.map(exam => {
                              const ss = STATUS_STYLE[exam.status] || STATUS_STYLE.draft;
                              return (
                                <tr key={exam.id}>
                                  <td>
                                    <Link to={`/instructor/exams/${exam.id}`}
                                      style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", textDecoration: "none" }}>
                                      {exam.title}
                                    </Link>
                                  </td>
                                  <td>
                                    <Link to={`/instructor/courses/${exam.course?.id}`}
                                      style={{ fontSize: 11, color: "#64748b", textDecoration: "none" }}>
                                      <i className="bi bi-folder2 me-1"></i>
                                      {exam.course?.code} — {exam.course?.name}
                                    </Link>
                                  </td>
                                  <td><span className="type-badge">{exam.type}</span></td>
                                  <td style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                                    {new Date(exam.start_time).toLocaleString()}
                                  </td>
                                  <td style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                                    {exam.duration_minutes}m
                                  </td>
                                  <td style={{ textAlign: "center", fontWeight: 700, color: "#0056b3", fontSize: 13 }}>
                                    {exam.questions_count || 0}
                                  </td>
                                  <td>
                                    <span className="status-pill" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                                  </td>
                                  <td>
                                    <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                                      <Link to={`/instructor/exams/${exam.id}`} className="action-btn" title="View">
                                        <i className="bi bi-eye"></i>
                                      </Link>
                                      <Link to={`/instructor/exams/${exam.id}/edit`} className="action-btn" title="Edit">
                                        <i className="bi bi-pencil"></i>
                                      </Link>
                                      <button className="action-btn del" onClick={() => handleDeleteExam(exam.id)} title="Delete">
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* ── Mobile: card list ── */}
                      <div className="mobile-exam-list">
                        {paginatedExams.map(exam => (
                          <ExamCard key={exam.id} exam={exam} onDelete={handleDeleteExam} />
                        ))}
                      </div>

                      <Pagination total={filteredExams.length} page={page} perPage={PAGE_SIZE} onChange={setPage} />
                    </>
                  )}
                </div>
              </>
            )}
          </main>
        </div>

        <InstructorBottomNav active="Exams" />
      </div>

      <CreateExamModal
        show={showExamModal}
        onHide={() => setShowExamModal(false)}
        courses={courses}
        onSuccess={newExam => {
          setExams(prev => [newExam, ...prev]);
          setShowExamModal(false);
          navigate(`/instructor/exams/${newExam.id}`, { state: { openAddQuestion: true } });
        }}
      />
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   CREATE EXAM MODAL
════════════════════════════════════════════════════════════════════════════ */
const CreateExamModal = ({ show, onHide, courses, onSuccess }) => {
  const [formData, setFormData] = useState({
    course_id: "", title: "", description: "", type: "quiz",
    start_time: "", end_time: "", duration_minutes: 60,
  });
  const [submitting,   setSubmitting]   = useState(false);
  const [freshCourses, setFreshCourses] = useState([]);

  useEffect(() => {
    if (!show) return;
    API.get("/courses")
      .then(res => setFreshCourses(res.data.courses || []))
      .catch(() => setFreshCourses(courses));
  }, [show]);

  const displayCourses = freshCourses.length > 0 ? freshCourses : courses;

  const handleStartOrDuration = (field, value) => {
    const updated = { ...formData, [field]: value };
    if (updated.start_time && updated.duration_minutes) {
      try {
        const end = new Date(new Date(updated.start_time).getTime() + updated.duration_minutes * 60000);
        const p = n => String(n).padStart(2, "0");
        updated.end_time = `${end.getFullYear()}-${p(end.getMonth() + 1)}-${p(end.getDate())}T${p(end.getHours())}:${p(end.getMinutes())}`;
      } catch {}
    }
    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        start_time:       localInputToUTC(formData.start_time),
        end_time:         localInputToUTC(formData.end_time),
        duration_minutes: parseInt(formData.duration_minutes, 10),
      };
      const res = await API.post("/exams", payload);
      Swal.fire({ icon: "success", title: "Exam Created!", timer: 2000, showConfirmButton: false });
      onSuccess(res.data.exam);
      setFormData({ course_id: "", title: "", description: "", type: "quiz", start_time: "", end_time: "", duration_minutes: 60 });
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.message || "Failed to create exam", "error");
    } finally { setSubmitting(false); }
  };

  if (!show) return null;
  const hasCourses  = displayCourses.length > 0;
  const typeOptions = ["quiz", "prelim", "midterm", "final"];

  return (
    <div className="dash-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onHide(); }}>
      <div className="dash-modal">
        <div className="dash-modal-hdr">
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, fontSize: 17, color: "#0f172a" }}>
              <i className="bi bi-file-earmark-plus me-2" style={{ color: "#0056b3" }}></i>Create New Exam
            </h5>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "#94a3b8" }}>
              <i className="bi bi-globe me-1"></i>
              Times in {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
          </div>
          <button onClick={onHide} disabled={submitting}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8", lineHeight: 1, padding: 4 }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {!hasCourses && (
          <div style={{ margin: "14px 24px 0", padding: "12px 14px", background: "#fff7ed", borderRadius: 10, border: "1px solid #fed7aa", fontSize: 13, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="bi bi-exclamation-triangle"></i>
            No courses yet. <Link to="/instructor/courses" style={{ fontWeight: 700, color: "#c2410c" }}>Create a course first</Link>.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="dash-modal-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div>
                <label className="form-lbl">Course <span style={{ color: "#ef4444" }}>*</span></label>
                <select className="form-ctrl" value={formData.course_id}
                  onChange={e => setFormData({ ...formData, course_id: e.target.value })}
                  required disabled={submitting || !hasCourses}>
                  <option value="">{hasCourses ? "Select a course…" : "No courses available"}</option>
                  {displayCourses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>

              <div className="modal-title-type-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                <div>
                  <label className="form-lbl">Exam Title <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" className="form-ctrl" placeholder="e.g., Midterm Examination"
                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required disabled={submitting} />
                </div>
                <div style={{ minWidth: 110 }}>
                  <label className="form-lbl">Type <span style={{ color: "#ef4444" }}>*</span></label>
                  <select className="form-ctrl" value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })} required disabled={submitting}>
                    {typeOptions.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-lbl">Duration (minutes) <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="number" className="form-ctrl" min="1" step="1"
                  value={formData.duration_minutes}
                  onChange={e => handleStartOrDuration("duration_minutes", parseInt(e.target.value, 10) || 1)}
                  required disabled={submitting} />
              </div>

              <div className="modal-time-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-lbl">Start Time <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="datetime-local" className="form-ctrl" value={formData.start_time}
                    onChange={e => handleStartOrDuration("start_time", e.target.value)} required disabled={submitting} />
                </div>
                <div>
                  <label className="form-lbl">End Time <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="datetime-local" className="form-ctrl" value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })} required disabled={submitting} />
                  <p style={{ margin: "3px 0 0", fontSize: 10, color: "#94a3b8" }}>
                    <i className="bi bi-magic me-1"></i>Auto-set from start + duration
                  </p>
                </div>
              </div>

              <div>
                <label className="form-lbl">Description</label>
                <textarea className="form-ctrl" rows="2" placeholder="Optional instructions for students"
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  disabled={submitting} style={{ resize: "vertical" }} />
              </div>
            </div>
          </div>

          <div className="dash-modal-ftr">
            <button type="button" className="dash-btn-ghost" onClick={onHide} disabled={submitting}>Cancel</button>
            <button type="submit" className="dash-btn-primary" disabled={submitting || !hasCourses}>
              {submitting
                ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</>
                : <><i className="bi bi-check2"></i> Create Exam</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamPage;