import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
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

const STATUS_STYLE = {
  active:    { bg: "#f0fdf4", color: "#15803d", label: "Active"    },
  scheduled: { bg: "#fff7ed", color: "#c2410c", label: "Scheduled" },
  completed: { bg: "#f0f9ff", color: "#0369a1", label: "Completed" },
  draft:     { bg: "#f1f5f9", color: "#64748b", label: "Draft"     },
};

const PAGE_SIZE = 10;

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
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;}
  .glass-sidebar{background:rgba(255,255,255,0.60);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);}
  .nav-pill{display:flex;flex-direction:column;align-items:center;padding:10px 8px;border-radius:12px;gap:4px;font-size:11px;font-weight:600;text-decoration:none;color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;}
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .topbar{background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:200;height:56px;display:flex;align-items:center;padding:0 20px;gap:12px;}
  .dash-avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .dash-tabs{display:flex;gap:4px;border-bottom:2px solid #f1f5f9;margin-bottom:20px;overflow-x:auto;scrollbar-width:none;padding-bottom:0;}
  .dash-tabs::-webkit-scrollbar{display:none;}
  .dash-tab{padding:10px 14px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;color:#64748b;border-bottom:2px solid transparent;margin-bottom:-2px;white-space:nowrap;transition:color .15s,border-color .15s;border-radius:8px 8px 0 0;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:6px;}
  .dash-tab:hover{color:#0056b3;background:#f8faff;}
  .dash-tab.active{color:#0056b3;border-bottom-color:#0056b3;background:#e8f0fe;}
  .dash-table{width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif;}
  .dash-table th{padding:10px 14px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.06em;white-space:nowrap;border-bottom:1px solid #f1f5f9;background:#f8faff;text-align:left;}
  .dash-table td{padding:11px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle;font-size:13px;}
  .dash-table tbody tr{transition:background .15s;}
  .dash-table tbody tr:hover{background:#f8faff;}
  .dash-table tbody tr:last-child td{border-bottom:none;}
  .dash-btn-primary{background:var(--blue);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:opacity .15s,transform .15s;text-decoration:none;}
  .dash-btn-primary:hover{opacity:.87;transform:translateY(-1px);color:#fff;}
  .dash-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .dash-btn-success{background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:all .15s;text-decoration:none;}
  .dash-btn-success:hover{background:#15803d;color:#fff;}
  .dash-btn-ghost{background:#fff;border:1px solid rgba(0,86,179,.15);color:#64748b;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:all .15s;text-decoration:none;}
  .dash-btn-ghost:hover{background:#f1f5f9;color:#1e293b;}
  .action-btn{width:30px;height:30px;border-radius:8px;border:1px solid rgba(0,86,179,.12);background:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;font-size:13px;text-decoration:none;color:#64748b;}
  .action-btn:hover{background:var(--blue-lite);border-color:var(--blue);color:var(--blue);}
  .action-btn.del:hover{background:#fef2f2;border-color:#ef4444;color:#ef4444;}
  .badge-pill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}
  .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:18px;}
  .stat-mini{background:#fff;border-radius:14px;border:1px solid rgba(0,86,179,.06);box-shadow:0 1px 3px rgba(0,0,0,.04);padding:12px 12px;text-align:center;}
  .course-hdr-band{background:rgba(255,255,255,0.90);backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,86,179,.08);padding:16px 16px 0;}
  .dash-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);backdrop-filter:blur(4px);z-index:1055;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;}
  .dash-modal{background:#fff;border-radius:20px;width:100%;max-width:500px;box-shadow:0 24px 64px rgba(0,0,0,.18);overflow:hidden;display:flex;flex-direction:column;max-height:calc(100vh - 32px);animation:fadeUp .25s ease;}
  .dash-modal-hdr{padding:20px 24px 16px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0;}
  .dash-modal-body{overflow-y:auto;padding:20px 24px;flex:1;}
  .dash-modal-ftr{padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;}
  .form-lbl{font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;display:block;}
  .form-ctrl{width:100%;border:1px solid rgba(0,86,179,.15);border-radius:10px;padding:9px 13px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;background:#f8faff;transition:border-color .2s,box-shadow .2s;}
  .form-ctrl:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .form-ctrl:disabled{opacity:.6;cursor:not-allowed;}
  .search-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border-radius:12px;border:1px solid rgba(0,86,179,.12);box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:100;max-height:220px;overflow-y:auto;}
  .search-dropdown-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background .12s;border-bottom:1px solid #f8faff;}
  .search-dropdown-item:last-child{border-bottom:none;}
  .search-dropdown-item:hover{background:#f8faff;}
  .mode-toggle{display:flex;gap:0;border-radius:10px;overflow:hidden;border:1px solid rgba(0,86,179,.15);}
  .mode-btn{flex:1;padding:8px 14px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px;background:#f8faff;color:#64748b;}
  .mode-btn:first-child{border-right:1px solid rgba(0,86,179,.15);}
  .mode-btn.active{background:var(--blue);color:#fff;}
  .filter-pill{padding:5px 12px;border-radius:99px;font-size:11px;font-weight:700;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all .15s;}
  .instructor-bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;font-weight:600;gap:2px;text-decoration:none;transition:color .2s;}
  .bnav-item i{font-size:18px;}
  .pagination-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,86,179,.15);background:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;color:#64748b;}
  .pagination-btn:hover{background:var(--blue-lite);border-color:var(--blue);color:var(--blue);}
  .pagination-btn.active{background:var(--blue);border-color:var(--blue);color:#fff;}
  .pagination-btn:disabled{opacity:.4;cursor:not-allowed;}
  @media(max-width:767px){
    .course-hdr-band{position:static;}
    .stats-grid{grid-template-columns:repeat(3,1fr);}
    .overview-grid{grid-template-columns:1fr!important;}
    .hdr-actions{flex-wrap:wrap;}
    .hdr-title{font-size:17px!important;}
    .student-search-bar{max-width:100%!important;}
  }
  @media(max-width:480px){
    .stats-grid{grid-template-columns:repeat(2,1fr);}
    .dash-tab{padding:8px 10px;font-size:12px;}
  }
`;

/* ─── Bottom Nav ─────────────────────────────────────────────────────────── */
const InstructorBottomNav = ({ active }) => {
  const items = [
    { to: "/instructor",                  icon: "bi-speedometer2",      label: "Home"     },
    { to: "/instructor/courses",          icon: "bi-book",              label: "Courses"  },
    { to: "/instructor/exams",            icon: "bi-file-earmark-text", label: "Exams"    },
    { to: "/instructor/students",         icon: "bi-people",            label: "Students" },
    { to: "/instructor/account-settings", icon: "bi-gear",              label: "Settings" },
  ];
  return (
    <nav className="instructor-bottom-nav d-lg-none">
      {items.map(({ to, icon, label }) => (
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
};

const MiniAvatar = ({ name, size = 32, bg = "#0056b3" }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
    {name?.charAt(0)?.toUpperCase() || "?"}
  </div>
);

/* ─── Reusable Pagination ─── */
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

/* ════════════════════════════════════════════════════════════════════════════
   COURSE DETAIL PAGE
════════════════════════════════════════════════════════════════════════════ */
const CourseDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [user,      setUser]      = useState(null);
  const [course,    setCourse]    = useState(null);
  const [exams,     setExams]     = useState([]);
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [showAddModal,  setShowAddModal]  = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [examSearch,    setExamSearch]    = useState("");
  const [examFilter,    setExamFilter]    = useState("all");

  const [studentPage, setStudentPage] = useState(1);
  const [examPage,    setExamPage]    = useState(1);

  const isNavActive = (to) =>
    to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

  useEffect(() => {
    API.get("/me").then((r) => setUser(r.data.user)).catch(() => {});
    fetchAll();
  }, [id]);

  useEffect(() => { setStudentPage(1); }, [studentSearch]);
  useEffect(() => { setExamPage(1); }, [examSearch, examFilter]);

  const fetchAll = async () => {
    try {
      const [courseRes, studentsRes] = await Promise.all([
        API.get(`/courses/${id}`),
        API.get(`/courses/${id}/students`),
      ]);
      setCourse(courseRes.data.course);
      setExams(courseRes.data.course.exams || []);
      setStudents(studentsRes.data.students || []);
    } catch {
      Swal.fire("Error!", "Failed to load course details.", "error");
      navigate("/instructor/courses");
    } finally { setLoading(false); }
  };

  const handleDeleteExam = async (examId) => {
    const result = await Swal.fire({
      title: "Delete this exam?", text: "This cannot be undone.", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/exams/${examId}`);
      setExams(prev => prev.filter(e => e.id !== examId));
      Swal.fire({ icon: "success", title: "Deleted!", timer: 1400, showConfirmButton: false });
    } catch { Swal.fire("Error!", "Failed to delete exam.", "error"); }
  };

  const handleStudentAdded = (newStudent) => {
    setStudents(prev => [...prev, newStudent]);
    setShowAddModal(false);
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    const result = await Swal.fire({
      title: `Remove ${studentName}?`, text: "This unenrolls them from the course. Their account won't be deleted.",
      icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Yes, remove!",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/courses/${id}/students/${studentId}`);
      setStudents(prev => prev.filter(s => s.id !== studentId));
      Swal.fire({ icon: "success", title: "Removed!", timer: 1400, showConfirmButton: false });
    } catch { Swal.fire("Error!", "Failed to remove student.", "error"); }
  };

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/instructor/login");
  };

  const examStats = useMemo(() => ({
    total:       exams.length,
    active:      exams.filter(e => e.status === "active").length,
    scheduled:   exams.filter(e => e.status === "scheduled").length,
    completed:   exams.filter(e => e.status === "completed").length,
    totalPoints: exams.reduce((sum, e) => sum + (e.total_points || 0), 0),
  }), [exams]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q));
  }, [students, studentSearch]);

  const filteredExams = useMemo(() => {
    let list = exams;
    if (examFilter !== "all") list = list.filter(e => e.status === examFilter);
    if (examSearch.trim()) {
      const q = examSearch.toLowerCase();
      list = list.filter(e => e.title?.toLowerCase().includes(q) || e.type?.toLowerCase().includes(q));
    }
    return list;
  }, [exams, examFilter, examSearch]);

  const paginatedStudents = filteredStudents.slice((studentPage - 1) * PAGE_SIZE, studentPage * PAGE_SIZE);
  const paginatedExams    = filteredExams.slice((examPage - 1) * PAGE_SIZE, examPage * PAGE_SIZE);

  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "I";
  const firstName = user?.name?.split(" ")[0] ?? "Instructor";

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f0f4fb" }}>
      <style>{SHARED_CSS}</style>
      <div className="spinner-border" style={{ color: "#0056b3" }} />
    </div>
  );

  const TABS = [
    { key: "overview",  icon: "bi-grid-1x2",         label: "Overview"                      },
    { key: "exams",     icon: "bi-file-earmark-text", label: `Exams (${exams.length})`       },
    { key: "students",  icon: "bi-people",            label: `Students (${students.length})` },
  ];

  const EXAM_FILTERS = ["all", "active", "scheduled", "completed", "draft"];

  return (
    <>
      <style>{SHARED_CSS}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* ── Topbar ── */}
        <div className="topbar">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
            SECT Instructor
          </span>
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
              <Link key={to} to={to} className={`nav-pill ${isNavActive(to) ? "active" : ""}`}>
                <i className={`bi ${icon}`}></i>{label}
              </Link>
            ))}
          </nav>

          {/* ── Main ── */}
          <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

            {/* Course Header Band */}
            <div className="course-hdr-band">
              {/* Breadcrumb */}
              <nav style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", flexWrap: "wrap" }}>
                  <Link to="/instructor" style={{ color: "#94a3b8", textDecoration: "none" }}>Dashboard</Link>
                  <i className="bi bi-chevron-right" style={{ fontSize: 10 }}></i>
                  <Link to="/instructor/courses" style={{ color: "#94a3b8", textDecoration: "none" }}>Courses</Link>
                  <i className="bi bi-chevron-right" style={{ fontSize: 10 }}></i>
                  <span style={{ color: "#0f172a", fontWeight: 600 }}>{course.code}</span>
                </div>
              </nav>

              {/* Title + Actions */}
              <div className="hdr-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className="bi bi-folder2-open" style={{ color: "#0056b3", fontSize: 20 }}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 className="hdr-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-.3px", lineHeight: 1.2, wordBreak: "break-word" }}>
                      {course.code} — {course.name}
                    </h1>
                    {course.description && (
                      <p style={{ margin: "3px 0 6px", fontSize: 12, color: "#64748b" }}>{course.description}</p>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {course.semester && (
                        <span className="badge-pill" style={{ background: "#f1f5f9", color: "#64748b" }}>
                          <i className="bi bi-calendar3 me-1"></i>{course.semester}
                        </span>
                      )}
                      {course.academic_year && (
                        <span className="badge-pill" style={{ background: "#fefce8", color: "#92400e" }}>
                          <i className="bi bi-mortarboard me-1"></i>AY {course.academic_year}
                        </span>
                      )}
                      {course.credits && (
                        <span className="badge-pill" style={{ background: "#f0f9ff", color: "#0369a1" }}>
                          <i className="bi bi-award me-1"></i>{course.credits} cr
                        </span>
                      )}
                      <span className="badge-pill" style={{ background: "#f0fdf4", color: "#15803d" }}>
                        <i className="bi bi-people me-1"></i>{students.length} students
                      </span>
                      <span className="badge-pill" style={{ background: "#e8f0fe", color: "#0056b3" }}>
                        <i className="bi bi-file-earmark-text me-1"></i>{exams.length} exams
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
                  <button className="dash-btn-success" style={{ fontSize: 12, padding: "7px 12px" }} onClick={() => setShowAddModal(true)}>
                    <i className="bi bi-person-plus"></i>
                    <span className="d-none d-sm-inline"> Add Student</span>
                  </button>
                  <Link to="/instructor/exams" state={{ openCreateExam: true }} className="dash-btn-primary" style={{ fontSize: 12, padding: "7px 12px" }}>
                    <i className="bi bi-plus-circle"></i>
                    <span className="d-none d-sm-inline"> New Exam</span>
                  </Link>
                </div>
              </div>

              {/* Tabs */}
              <div className="dash-tabs">
                {TABS.map(({ key, icon, label }) => (
                  <button key={key} className={`dash-tab ${activeTab === key ? "active" : ""}`} onClick={() => setActiveTab(key)}>
                    <i className={`bi ${icon}`}></i>{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div style={{ padding: "20px 16px", paddingBottom: 90, flex: 1, minWidth: 0 }}>

              {/* ════ OVERVIEW ════ */}
              {activeTab === "overview" && (
                <div>
                  <div className="stats-grid">
                    {[
                      { icon: "bi-file-earmark-text", color: "#0056b3", bg: "#e8f0fe", label: "Total Exams",  value: examStats.total       },
                      { icon: "bi-play-circle",        color: "#15803d", bg: "#f0fdf4", label: "Active",       value: examStats.active       },
                      { icon: "bi-calendar-event",     color: "#c2410c", bg: "#fff7ed", label: "Scheduled",    value: examStats.scheduled    },
                      { icon: "bi-check-circle",       color: "#0369a1", bg: "#f0f9ff", label: "Completed",    value: examStats.completed    },
                      { icon: "bi-people",             color: "#15803d", bg: "#f0fdf4", label: "Students",     value: students.length        },
                      { icon: "bi-trophy",             color: "#6d28d9", bg: "#ede9fe", label: "Total Points", value: examStats.totalPoints  },
                    ].map(({ icon, color, bg, label, value }) => (
                      <div key={label} className="stat-mini">
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                          <i className={`bi ${icon}`} style={{ color, fontSize: 15 }}></i>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="overview-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>

                    {/* Recent Exams */}
                    <div className="dash-card fade-up">
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                          <i className="bi bi-file-earmark-text me-2" style={{ color: "#0056b3" }}></i>Recent Exams
                        </h2>
                        <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#0056b3", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}
                          onClick={() => setActiveTab("exams")}>View all →</button>
                      </div>
                      {exams.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "28px 16px", color: "#94a3b8" }}>
                          <i className="bi bi-file-earmark-x" style={{ fontSize: 24, display: "block", marginBottom: 8 }}></i>
                          No exams yet.
                        </div>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table className="dash-table">
                            <thead>
                              <tr>{["TITLE", "TYPE", "DATE", "STATUS"].map(h => <th key={h}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                              {exams.slice(0, 5).map(exam => {
                                const ss = STATUS_STYLE[exam.status] || STATUS_STYLE.draft;
                                return (
                                  <tr key={exam.id}>
                                    <td>
                                      <Link to={`/instructor/exams/${exam.id}`} style={{ fontWeight: 600, textDecoration: "none", color: "#1e293b", fontSize: 12 }}>
                                        {exam.title}
                                      </Link>
                                    </td>
                                    <td><span className="badge-pill" style={{ background: "#f1f5f9", color: "#64748b" }}>{exam.type}</span></td>
                                    <td style={{ fontSize: 11, color: "#64748b" }}>{new Date(exam.start_time).toLocaleDateString()}</td>
                                    <td><span className="badge-pill" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Enrolled Students */}
                    <div className="dash-card fade-up">
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                          <i className="bi bi-people me-2" style={{ color: "#15803d" }}></i>Students
                        </h2>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="dash-btn-success" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setShowAddModal(true)}>
                            <i className="bi bi-person-plus"></i>
                          </button>
                          <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#0056b3", fontWeight: 600, fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}
                            onClick={() => setActiveTab("students")}>View all →</button>
                        </div>
                      </div>
                      {students.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "28px 16px", color: "#94a3b8" }}>
                          <i className="bi bi-people" style={{ fontSize: 24, display: "block", marginBottom: 8 }}></i>
                          <p style={{ marginBottom: 10, fontSize: 12 }}>No students enrolled.</p>
                          <button className="dash-btn-success" style={{ fontSize: 11, padding: "6px 12px" }} onClick={() => setShowAddModal(true)}>
                            <i className="bi bi-person-plus"></i> Enroll
                          </button>
                        </div>
                      ) : (
                        <div>
                          {students.slice(0, 6).map(s => (
                            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: "1px solid #f8faff" }}>
                              <MiniAvatar name={s.name} size={28} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 12, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                                <div style={{ fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.email}</div>
                              </div>
                            </div>
                          ))}
                          {students.length > 6 && (
                            <div style={{ padding: "8px 16px", textAlign: "center" }}>
                              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#64748b", fontFamily: "'DM Sans',sans-serif" }}
                                onClick={() => setActiveTab("students")}>
                                +{students.length - 6} more
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ════ EXAMS TAB ════ */}
              {activeTab === "exams" && (
                <div className="dash-card fade-up">
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: exams.length > 0 ? 10 : 0 }}>
                      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                        <i className="bi bi-file-earmark-text me-2" style={{ color: "#0056b3" }}></i>Exams
                      </h2>
                      <Link to="/instructor/exams" className="dash-btn-primary" style={{ fontSize: 11, padding: "6px 12px" }}>
                        <i className="bi bi-plus"></i> New Exam
                      </Link>
                    </div>
                    {exams.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ position: "relative", flex: 1, maxWidth: 260 }}>
                          <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 12 }}></i>
                          <input className="form-ctrl" style={{ paddingLeft: 30, fontSize: 12 }} placeholder="Search exams…"
                            value={examSearch} onChange={e => setExamSearch(e.target.value)} />
                        </div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {EXAM_FILTERS.map(s => {
                            const active = examFilter === s;
                            return (
                              <button key={s} className="filter-pill"
                                style={{ background: active ? "#0056b3" : "#f1f5f9", color: active ? "#fff" : "#64748b" }}
                                onClick={() => setExamFilter(s)}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    {exams.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                        <i className="bi bi-file-earmark-x" style={{ fontSize: 32, display: "block", marginBottom: 10, opacity: .3 }}></i>
                        <p style={{ marginBottom: 12, fontSize: 13 }}>No exams in this course yet.</p>
                        <Link to="/instructor/exams" className="dash-btn-primary" style={{ fontSize: 12, padding: "7px 14px" }}>
                          <i className="bi bi-plus-circle"></i> Create an Exam
                        </Link>
                      </div>
                    ) : filteredExams.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "28px", color: "#94a3b8" }}>
                        <i className="bi bi-search" style={{ fontSize: 24, display: "block", marginBottom: 8 }}></i>
                        No exams match your filter.
                      </div>
                    ) : (
                      <>
                        <div style={{ overflowX: "auto" }}>
                          <table className="dash-table">
                            <thead>
                              <tr>{["EXAM NAME", "TYPE", "START", "DURATION", "QS", "PTS", "STATUS", "ACTIONS"].map(h => <th key={h}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                              {paginatedExams.map(exam => {
                                const ss = STATUS_STYLE[exam.status] || STATUS_STYLE.draft;
                                return (
                                  <tr key={exam.id}>
                                    <td>
                                      <Link to={`/instructor/exams/${exam.id}`} style={{ fontWeight: 700, textDecoration: "none", color: "#1e293b", fontSize: 13 }}>
                                        {exam.title}
                                      </Link>
                                    </td>
                                    <td><span className="badge-pill" style={{ background: "#f1f5f9", color: "#64748b" }}>{exam.type}</span></td>
                                    <td style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{new Date(exam.start_time).toLocaleString()}</td>
                                    <td style={{ fontSize: 11, color: "#64748b" }}>{exam.duration_minutes}m</td>
                                    <td style={{ textAlign: "center", fontWeight: 600, fontSize: 13 }}>{exam.questions_count || 0}</td>
                                    <td style={{ textAlign: "center", fontWeight: 600, fontSize: 13 }}>{exam.total_points || 0}</td>
                                    <td><span className="badge-pill" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span></td>
                                    <td>
                                      <div style={{ display: "flex", gap: 5 }}>
                                        <Link to={`/instructor/exams/${exam.id}`} className="action-btn" title="View"><i className="bi bi-eye"></i></Link>
                                        <Link to={`/instructor/exams/${exam.id}/edit`} className="action-btn" title="Edit"><i className="bi bi-pencil"></i></Link>
                                        <button className="action-btn del" onClick={() => handleDeleteExam(exam.id)} title="Delete"><i className="bi bi-trash"></i></button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <Pagination total={filteredExams.length} page={examPage} perPage={PAGE_SIZE} onChange={setExamPage} />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ════ STUDENTS TAB ════ */}
              {activeTab === "students" && (
                <div className="dash-card fade-up">
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: students.length > 0 ? 10 : 0 }}>
                      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                        <i className="bi bi-people me-2" style={{ color: "#15803d" }}></i>
                        Enrolled Students
                        <span className="badge-pill ms-2" style={{ background: "#e8f0fe", color: "#0056b3" }}>{students.length}</span>
                      </h2>
                      <button className="dash-btn-success" style={{ fontSize: 11, padding: "6px 12px" }} onClick={() => setShowAddModal(true)}>
                        <i className="bi bi-person-plus"></i> Add Student
                      </button>
                    </div>
                    {students.length > 0 && (
                      <div className="student-search-bar" style={{ position: "relative", maxWidth: 300 }}>
                        <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 12 }}></i>
                        <input className="form-ctrl" style={{ paddingLeft: 30, fontSize: 12 }} placeholder="Search by name or email…"
                          value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                      </div>
                    )}
                  </div>
                  <div>
                    {students.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                        <i className="bi bi-people" style={{ fontSize: 32, display: "block", marginBottom: 10, opacity: .3 }}></i>
                        <p style={{ marginBottom: 12, fontSize: 13 }}>No students enrolled yet.</p>
                        <button className="dash-btn-success" style={{ fontSize: 12, padding: "7px 14px" }} onClick={() => setShowAddModal(true)}>
                          <i className="bi bi-person-plus"></i> Enroll First Student
                        </button>
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "28px", color: "#94a3b8" }}>
                        <i className="bi bi-search" style={{ fontSize: 24, display: "block", marginBottom: 8 }}></i>
                        No students match "<strong>{studentSearch}</strong>"
                      </div>
                    ) : (
                      <>
                        <div style={{ overflowX: "auto" }}>
                          <table className="dash-table">
                            <thead>
                              <tr>{["#", "STUDENT", "EMAIL", "ENROLLED", "ACTIONS"].map(h => <th key={h}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                              {paginatedStudents.map((student, idx) => (
                                <tr key={student.id}>
                                  <td style={{ color: "#94a3b8", fontSize: 11 }}>{(studentPage - 1) * PAGE_SIZE + idx + 1}</td>
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <MiniAvatar name={student.name} size={28} />
                                      <span style={{ fontWeight: 600, fontSize: 12, color: "#1e293b" }}>{student.name}</span>
                                    </div>
                                  </td>
                                  <td style={{ fontSize: 11, color: "#64748b" }}>{student.email}</td>
                                  <td style={{ fontSize: 11, color: "#64748b" }}>
                                    {student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString() : "—"}
                                  </td>
                                  <td>
                                    <button className="action-btn del" style={{ width: "auto", padding: "0 10px", gap: 4, fontSize: 12 }}
                                      onClick={() => handleRemoveStudent(student.id, student.name)}>
                                      <i className="bi bi-person-dash"></i>
                                      <span className="d-none d-md-inline" style={{ fontSize: 11 }}>Remove</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <Pagination total={filteredStudents.length} page={studentPage} perPage={PAGE_SIZE} onChange={setStudentPage} />
                      </>
                    )}
                  </div>
                  {students.length > 0 && (
                    <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8" }}>
                      <i className="bi bi-info-circle me-1"></i>
                      Enrolled students have access to all <strong style={{ color: "#64748b" }}>{exams.length}</strong> exam(s).
                      Removing a student only unenrolls them — their account is not deleted.
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>

        <InstructorBottomNav active="Courses" />
      </div>

      {/* Add Student Modal */}
      <AddStudentModal
        show={showAddModal}
        course={course}
        onHide={() => setShowAddModal(false)}
        onSuccess={handleStudentAdded}
      />
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   ADD STUDENT MODAL
════════════════════════════════════════════════════════════════════════════ */
const AddStudentModal = ({ show, course, onHide, onSuccess }) => {
  const [mode,            setMode]            = useState("existing");
  const [submitting,      setSubmitting]      = useState(false);
  const [searchQuery,     setSearchQuery]     = useState("");
  const [searchResults,   setSearchResults]   = useState([]);
  const [searching,       setSearching]       = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newForm,         setNewForm]         = useState({ name: "", email: "", password: "" });
  const [showPassword,    setShowPassword]    = useState(false);

  useEffect(() => {
    if (!show) {
      setMode("existing"); setSearchQuery(""); setSearchResults([]);
      setSelectedStudent(null); setNewForm({ name: "", email: "", password: "" }); setShowPassword(false);
    }
  }, [show]);

  useEffect(() => {
    if (mode !== "existing" || searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await API.get(`/students/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data.students || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, mode]);

  const handleSelect = (s) => { setSelectedStudent(s); setSearchQuery(s.name); setSearchResults([]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "existing" && !selectedStudent) {
      Swal.fire("Oops!", "Please select a student from the list.", "warning"); return;
    }
    setSubmitting(true);
    try {
      const payload = mode === "existing"
        ? { mode: "existing", email: selectedStudent.email }
        : { mode: "new", name: newForm.name, new_email: newForm.email, password: newForm.password };
      const res = await API.post(`/courses/${course.id}/students`, payload);
      Swal.fire({ icon: "success", title: "Enrolled!", text: res.data.message, timer: 2000, showConfirmButton: false });
      onSuccess(res.data.student);
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.message || "Failed to enroll student.", "error");
    } finally { setSubmitting(false); }
  };

  if (!show || !course) return null;

  return (
    <div className="dash-modal-overlay" onClick={e => { if (e.target === e.currentTarget && !submitting) onHide(); }}>
      <div className="dash-modal">
        <div className="dash-modal-hdr">
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, fontSize: 17, color: "#0f172a" }}>
              <i className="bi bi-person-plus me-2" style={{ color: "#15803d" }}></i>Add Student
            </h5>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
              Enrolling into <strong style={{ color: "#0056b3" }}>{course.code} — {course.name}</strong>
            </p>
          </div>
          <button onClick={onHide} disabled={submitting}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8", padding: 4 }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div style={{ padding: "14px 24px 0" }}>
          <div className="mode-toggle">
            <button type="button" className={`mode-btn ${mode === "existing" ? "active" : ""}`}
              onClick={() => setMode("existing")} disabled={submitting}>
              <i className="bi bi-search"></i> Enroll Existing
            </button>
            <button type="button" className={`mode-btn ${mode === "new" ? "active" : ""}`}
              onClick={() => setMode("new")} disabled={submitting}>
              <i className="bi bi-person-add"></i> Create New
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dash-modal-body">
            {mode === "existing" && (
              <div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748b" }}>
                  Search by name or email to find an existing student account.
                </p>
                <label className="form-lbl">Search Student <span style={{ color: "#ef4444" }}>*</span></label>
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ padding: "9px 12px", background: "#f8faff", border: "1px solid rgba(0,86,179,.15)", borderRight: "none", borderRadius: "10px 0 0 10px", color: "#94a3b8", fontSize: 13, flexShrink: 0 }}>
                      {searching ? <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <i className="bi bi-search"></i>}
                    </span>
                    <input type="text" autoComplete="off"
                      style={{ flex: 1, border: "1px solid rgba(0,86,179,.15)", borderLeft: "none", borderRight: searchQuery ? "none" : "1px solid rgba(0,86,179,.15)", borderRadius: searchQuery ? "0" : "0 10px 10px 0", padding: "9px 13px", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif", background: "#f8faff", color: "#1e293b" }}
                      placeholder="Type name or email (min. 2 chars)…"
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setSelectedStudent(null); }}
                      disabled={submitting} />
                    {searchQuery && (
                      <button type="button"
                        style={{ padding: "9px 12px", background: "#f8faff", border: "1px solid rgba(0,86,179,.15)", borderLeft: "none", borderRadius: "0 10px 10px 0", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}
                        onClick={() => { setSearchQuery(""); setSelectedStudent(null); setSearchResults([]); }}>
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="search-dropdown">
                      {searchResults.map(s => (
                        <div key={s.id} className="search-dropdown-item" onClick={() => handleSelect(s)}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0056b3", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && !selectedStudent && (
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>
                      <i className="bi bi-exclamation-circle me-1"></i>No accounts found.{" "}
                      <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#0056b3", fontWeight: 600, fontSize: 12, fontFamily: "'DM Sans',sans-serif", padding: 0 }}
                        onClick={() => setMode("new")}>Create a new student instead</button>
                    </p>
                  )}
                </div>
                {selectedStudent && (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 10 }}>
                    <i className="bi bi-check-circle-fill" style={{ color: "#22c55e", fontSize: 14, flexShrink: 0 }}></i>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#15803d" }}>{selectedStudent.name}</div>
                      <div style={{ fontSize: 11, color: "#4ade80" }}>{selectedStudent.email}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === "new" && (
              <div>
                <div style={{ padding: "10px 12px", background: "#e8f0fe", borderRadius: 10, border: "1px solid rgba(0,86,179,.15)", marginBottom: 14, fontSize: 13, color: "#0056b3" }}>
                  <i className="bi bi-info-circle me-1"></i>
                  A new account will be created and automatically enrolled in <strong>{course.code}</strong>.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label className="form-lbl">Full Name <span style={{ color: "#ef4444" }}>*</span></label>
                    <input type="text" className="form-ctrl" placeholder="e.g., Juan dela Cruz"
                      value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })}
                      required disabled={submitting} />
                  </div>
                  <div>
                    <label className="form-lbl">Email Address <span style={{ color: "#ef4444" }}>*</span></label>
                    <input type="email" className="form-ctrl" placeholder="e.g., student@university.edu"
                      value={newForm.email} onChange={e => setNewForm({ ...newForm, email: e.target.value })}
                      required disabled={submitting} />
                  </div>
                  <div>
                    <label className="form-lbl">Temporary Password <span style={{ color: "#ef4444" }}>*</span></label>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input type={showPassword ? "text" : "password"} className="form-ctrl"
                        style={{ borderRadius: "10px 0 0 10px", borderRight: "none" }}
                        placeholder="Min. 8 characters"
                        value={newForm.password} onChange={e => setNewForm({ ...newForm, password: e.target.value })}
                        required minLength={8} disabled={submitting} />
                      <button type="button"
                        style={{ padding: "9px 13px", background: "#f8faff", border: "1px solid rgba(0,86,179,.15)", borderLeft: "none", borderRadius: "0 10px 10px 0", color: "#64748b", cursor: "pointer", fontSize: 14 }}
                        onClick={() => setShowPassword(v => !v)}>
                        <i className={`bi bi-eye${showPassword ? "-slash" : ""}`}></i>
                      </button>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>Share this password with the student.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="dash-modal-ftr">
            <button type="button" className="dash-btn-ghost" onClick={onHide} disabled={submitting}>Cancel</button>
            <button type="submit" className="dash-btn-success" style={{ padding: "9px 20px" }} disabled={submitting}>
              {submitting
                ? <><span className="spinner-border spinner-border-sm me-2" />Enrolling…</>
                : <><i className="bi bi-person-check"></i>{mode === "new" ? "Create & Enroll" : "Enroll Student"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseDetail;