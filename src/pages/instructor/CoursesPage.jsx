import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";
import InstructorAlertBell from "../../components/InstructorAlertBell";

/* ─── Shared sidebar config ──────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/instructor",                  icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/instructor/courses",          icon: "bi-book",                 label: "Courses"   },
  { to: "/instructor/exams",            icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/instructor/students",         icon: "bi-people",               label: "Students"  },
  { to: "/instructor/alerts",           icon: "bi-exclamation-triangle", label: "Alerts"    },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

const BLANK_FORM = { name: "", code: "", description: "", semester: "", credits: 3 };

/* ─── Shared CSS ─────────────────────────────────────────────────────────── */
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
  .dash-card{
    background:var(--card-bg);border-radius:var(--card-br);
    box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);
    transition:box-shadow .2s,transform .2s;overflow:hidden;
  }
  .dash-card-hover:hover{box-shadow:0 2px 6px rgba(0,0,0,.07),0 8px 28px rgba(0,86,179,.10);transform:translateY(-1px);}
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
  .topbar{
    background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:200;height:56px;
    display:flex;align-items:center;padding:0 20px;gap:12px;
  }
  .dash-avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  .dash-search{
    border:1px solid rgba(0,86,179,.15);border-radius:10px;
    background:#f8faff;padding:7px 14px 7px 36px;
    font-size:13px;color:#1e293b;outline:none;
    font-family:'DM Sans',sans-serif;width:100%;
    transition:border-color .2s,box-shadow .2s;
  }
  .dash-search:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .skeleton{
    background:linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);
    background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;
  }
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  /* Stat chips */
  .stat-chip{
    flex:1;min-width:150px;border-radius:14px;padding:14px 16px;
    display:flex;align-items:center;gap:10px;
    border:1px solid rgba(0,86,179,.06);background:#fff;
    box-shadow:0 1px 3px rgba(0,0,0,.04);
  }
  .stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .stat-icon i{font-size:17px;}
  /* Buttons */
  .dash-btn-primary{
    background:var(--blue);color:#fff;border:none;border-radius:10px;
    padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;
    font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;
    transition:opacity .15s,transform .15s;text-decoration:none;
  }
  .dash-btn-primary:hover{opacity:.87;transform:translateY(-1px);color:#fff;}
  .dash-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .dash-btn-ghost{
    background:#fff;border:1px solid rgba(0,86,179,.15);color:#64748b;
    border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;
    transition:all .15s;text-decoration:none;
  }
  .dash-btn-ghost:hover{background:#f1f5f9;color:#1e293b;}
  .action-btn{
    width:30px;height:30px;border-radius:8px;border:1px solid rgba(0,86,179,.12);
    background:#fff;display:inline-flex;align-items:center;justify-content:center;
    cursor:pointer;transition:all .15s;font-size:13px;text-decoration:none;color:#64748b;
  }
  .action-btn:hover{background:var(--blue-lite);border-color:var(--blue);color:var(--blue);}
  .action-btn.warn:hover{background:#fff7ed;border-color:#f59e0b;color:#f59e0b;}
  .action-btn.del:hover{background:#fef2f2;border-color:#ef4444;color:#ef4444;}
  .action-btn.suc:hover{background:#f0fdf4;border-color:#22c55e;color:#22c55e;}
  /* Badge pill */
  .badge-pill{
    display:inline-flex;align-items:center;padding:2px 9px;border-radius:99px;
    font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  }
  /* Course card */
  .course-card{
    background:#fff;border-radius:16px;border:1px solid rgba(0,86,179,.06);
    box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.05);
    transition:box-shadow .2s,transform .2s;overflow:hidden;
  }
  .course-card:hover{box-shadow:0 2px 6px rgba(0,0,0,.07),0 8px 28px rgba(0,86,179,.10);}
  .course-code-badge{
    width:52px;height:52px;border-radius:12px;background:var(--blue-lite);
    color:var(--blue);display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:11px;flex-shrink:0;letter-spacing:.03em;text-align:center;line-height:1.2;
  }
  /* Enroll panel */
  .enroll-panel{
    padding:16px 20px;background:#f8faff;border-top:1px solid rgba(0,86,179,.08);
    animation:fadeUp .2s ease;
  }
  /* Student chip */
  .student-chip{
    display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;
    border-radius:99px;border:1px solid rgba(0,86,179,.12);background:#fff;
    font-size:12px;font-weight:600;color:#1e293b;
  }
  .student-chip button{
    background:none;border:none;cursor:pointer;padding:0;line-height:1;
    color:#94a3b8;font-size:12px;transition:color .15s;
  }
  .student-chip button:hover{color:#ef4444;}
  /* Modal */
  .dash-modal-overlay{
    position:fixed;inset:0;background:rgba(15,23,42,.45);
    backdrop-filter:blur(4px);z-index:1055;
    display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;
  }
  .dash-modal{
    background:#fff;border-radius:20px;width:100%;max-width:520px;
    box-shadow:0 24px 64px rgba(0,0,0,.18);overflow:hidden;
    display:flex;flex-direction:column;max-height:calc(100vh - 32px);
    animation:fadeUp .25s ease;
  }
  .dash-modal-hdr{padding:22px 24px 16px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0;}
  .dash-modal-body{overflow-y:auto;padding:20px 24px;flex:1;}
  .dash-modal-ftr{padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;}
  .form-lbl{font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;display:block;}
  .form-ctrl{
    width:100%;border:1px solid rgba(0,86,179,.15);border-radius:10px;
    padding:9px 13px;font-size:13px;color:#1e293b;outline:none;
    font-family:'DM Sans',sans-serif;background:#f8faff;
    transition:border-color .2s,box-shadow .2s;
  }
  .form-ctrl:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .form-ctrl:disabled{opacity:.6;cursor:not-allowed;}
  .form-ctrl.err{border-color:#ef4444;}
  .form-err{font-size:11px;color:#ef4444;margin-top:4px;}
  .search-dropdown{
    position:absolute;top:calc(100% + 4px);left:0;right:0;
    background:#fff;border-radius:12px;border:1px solid rgba(0,86,179,.12);
    box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:100;max-height:220px;overflow-y:auto;
  }
  .search-dropdown-item{
    display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;
    transition:background .12s;border-bottom:1px solid #f8faff;
  }
  .search-dropdown-item:last-child{border-bottom:none;}
  .search-dropdown-item:hover{background:#f8faff;}
  /* Bottom nav */
  .instructor-bottom-nav{
    position:fixed;bottom:0;left:0;right:0;height:64px;
    background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);
    border-top:1px solid rgba(0,86,179,0.10);
    display:flex;align-items:stretch;z-index:1030;
    box-shadow:0 -4px 24px rgba(0,86,179,0.08);
  }
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bnav-item i{font-size:19px;}
  /* Two col form grid */
  .form-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .form-grid-34{display:grid;grid-template-columns:3fr 1fr;gap:12px;}
  @media(max-width:576px){
    .form-grid-2{grid-template-columns:1fr;}
    .form-grid-34{grid-template-columns:1fr 1fr;}
    .stat-chip{min-width:calc(50% - 8px);}
    .course-actions{flex-wrap:wrap;}
  }
`;

/* ─── Bottom Nav ─────────────────────────────────────────────────────────── */
const InstructorBottomNav = ({ active }) => {
  const items = [
    { to: "/instructor",                  icon: "bi-speedometer2", label: "Home"     },
    { to: "/instructor/courses",          icon: "bi-book",         label: "Courses"  },
    { to: "/instructor/students",         icon: "bi-people",       label: "Students" },
    { to: "/instructor/account-settings", icon: "bi-gear",         label: "Settings" },
  ];
  return (
    <nav className="instructor-bottom-nav d-lg-none">
      {items.map(({ to, icon, label }) => (
        <Link key={to} to={to} className="bnav-item"
          style={{ color: active === label ? "#0056b3" : "#94a3b8", borderTop: active === label ? "2px solid #0056b3" : "2px solid transparent" }}>
          <i className={`bi ${icon}`}></i>
          {label}
        </Link>
      ))}
    </nav>
  );
};

/* ─── Mini Avatar ──────────────────────────────────────────────────────────── */
const MiniAvatar = ({ name, size = 28, bg = "#0056b3" }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.4, flexShrink: 0 }}>
    {name?.charAt(0)?.toUpperCase() || "?"}
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════════ */
export default function CoursesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user,    setUser]    = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selected,  setSelected]  = useState(null);
  const [form,      setForm]      = useState(BLANK_FORM);
  const [errors,    setErrors]    = useState({});

  const [expandedCourse, setExpandedCourse] = useState(null);
  const [studentSearch,  setStudentSearch]  = useState("");
  const [searchResults,  setSearchResults]  = useState([]);
  const [enrolledMap,    setEnrolledMap]    = useState({});
  const [enrollLoading,  setEnrollLoading]  = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [meRes, coursesRes] = await Promise.all([API.get("/me"), API.get("/courses")]);
      setUser(meRes.data.user);
      const fetchedCourses = coursesRes.data.courses || [];
      setCourses(fetchedCourses);

      // Fetch enrolled students for all courses in parallel so Total Enrollments shows on load
      const enrolledResults = await Promise.all(
        fetchedCourses.map(course =>
          API.get(`/courses/${course.id}/students`)
            .then(res => ({ id: course.id, students: res.data.students || [] }))
            .catch(() => ({ id: course.id, students: [] }))
        )
      );
      const map = {};
      enrolledResults.forEach(({ id, students }) => { map[id] = students; });
      setEnrolledMap(map);
    } catch {
      Swal.fire("Error", "Failed to load courses.", "error");
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    window.location.href = "/instructor/login";
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name  = "Course name is required.";
    if (!form.code.trim()) e.code  = "Course code is required.";
    const cr = Number(form.credits);
    if (!form.credits || isNaN(cr) || cr < 1 || cr > 6) e.credits = "Credits must be between 1 and 6.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const openCreate = () => {
    setModalMode("create"); setSelected(null); setForm(BLANK_FORM); setErrors({}); setShowModal(true);
  };

  const openEdit = (course) => {
    setModalMode("edit"); setSelected(course);
    setForm({ name: course.name, code: course.code, description: course.description || "", semester: course.semester || "", credits: course.credits ?? 3 });
    setErrors({}); setShowModal(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (modalMode === "create") {
        const res = await API.post("/courses", form);
        const newCourse = res.data.course || res.data;
        setCourses(prev => [newCourse, ...prev]);
        setEnrolledMap(prev => ({ ...prev, [newCourse.id]: [] }));
        Swal.fire({ icon:"success", title:"Course created!", timer:1400, showConfirmButton:false });
      } else {
        const res = await API.put(`/courses/${selected.id}`, form);
        const updated = res.data.course || res.data;
        setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
        Swal.fire({ icon:"success", title:"Course updated!", timer:1400, showConfirmButton:false });
      }
      setShowModal(false);
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save course.", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (course) => {
    const result = await Swal.fire({
      title:`Delete "${course.code}"?`, text:"This will permanently delete the course and all associated data.",
      icon:"warning", showCancelButton:true, confirmButtonColor:"#d33", confirmButtonText:"Yes, delete",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/courses/${course.id}`);
      setCourses(prev => prev.filter(c => c.id !== course.id));
      if (expandedCourse === course.id) setExpandedCourse(null);
      Swal.fire({ icon:"success", title:"Deleted!", timer:1200, showConfirmButton:false });
    } catch { Swal.fire("Error", "Failed to delete course.", "error"); }
  };

  const toggleExpand = async (courseId) => {
    if (expandedCourse === courseId) { setExpandedCourse(null); return; }
    setExpandedCourse(courseId); setStudentSearch(""); setSearchResults([]);
    if (!enrolledMap[courseId]) await fetchEnrolled(courseId);
  };

  const fetchEnrolled = async (courseId) => {
    try {
      const res = await API.get(`/courses/${courseId}/students`);
      setEnrolledMap(prev => ({ ...prev, [courseId]: res.data.students || [] }));
    } catch {
      setEnrolledMap(prev => ({ ...prev, [courseId]: [] }));
    }
  };

  const handleStudentSearch = async (e) => {
    const q = e.target.value;
    setStudentSearch(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    try {
      const res = await API.get(`/students/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data.students || []);
    } catch { setSearchResults([]); }
  };

  const handleEnroll = async (student) => {
    if (!expandedCourse) return;
    const already = (enrolledMap[expandedCourse] || []).find(s => s.id === student.id);
    if (already) { Swal.fire("Already enrolled", `${student.name} is already in this course.`, "info"); return; }
    setEnrollLoading(true);
    try {
      await API.post(`/courses/${expandedCourse}/students`, { mode:"existing", email:student.email });
      await fetchEnrolled(expandedCourse);
      setStudentSearch(""); setSearchResults([]);
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to enroll student.", "error");
    } finally { setEnrollLoading(false); }
  };

  const handleUnenroll = async (student) => {
    const res = await Swal.fire({
      title:`Remove ${student.name}?`, text:"This unenrolls them from this course only.",
      icon:"warning", showCancelButton:true, confirmButtonColor:"#d33", confirmButtonText:"Remove",
    });
    if (!res.isConfirmed) return;
    try {
      await API.delete(`/courses/${expandedCourse}/students/${student.id}`);
      setEnrolledMap(prev => ({ ...prev, [expandedCourse]: prev[expandedCourse].filter(s => s.id !== student.id) }));
    } catch { Swal.fire("Error", "Failed to remove student.", "error"); }
  };

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.description||"").toLowerCase().includes(q);
  });

  const isActive = (to) => to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "I";
  const firstName = user?.name?.split(" ")[0] ?? "Instructor";

  const totalEnrollments = new Set(
  Object.values(enrolledMap).flatMap(arr => arr.map(s => s.id))
  ).size;

  return (
    <>
      <style>{SHARED_CSS}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* ── Topbar ── */}
        <div className="topbar">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
            SECT Instructor
          </span>
          <div className="d-none d-md-flex" style={{ flex: 1, maxWidth: 380, position: "relative" }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13 }}></i>
            <input className="dash-search" placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} />
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
          <main style={{ flex: 1, padding: "24px 20px", paddingBottom: 100, minWidth: 0 }}>

            {/* Mobile search */}
            <div className="d-md-none mb-3" style={{ position: "relative" }}>
              <i className="bi bi-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, zIndex: 1 }}></i>
              <input className="dash-search" style={{ paddingLeft: 36 }} placeholder="Search courses…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Page header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Management</p>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px" }}>Course Management</h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Create and manage your courses, enroll students</p>
              </div>
              <button className="dash-btn-primary" onClick={openCreate}>
                <i className="bi bi-plus-lg"></i> New Course
              </button>
            </div>

            {/* Stat Chips */}
            <div className="fade-up" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              {[
                { label:"Total Courses",     value:courses.length,      color:"#0056b3", bg:"#e8f0fe", icon:"bi-book"   },
                { label:"Total Enrollments", value:totalEnrollments,    color:"#15803d", bg:"#f0fdf4", icon:"bi-people" },
                { label:"Filtered Results",  value:filtered.length,     color:"#6d28d9", bg:"#ede9fe", icon:"bi-funnel" },
              ].map(({ label, value, color, bg, icon }) => (
                <div key={label} className="stat-chip">
                  <div className="stat-icon" style={{ background: bg }}>
                    <i className={`bi ${icon}`} style={{ color, fontSize: 17 }}></i>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, fontWeight: 600, color, opacity: .75 }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Course List */}
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 16 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="dash-card" style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                <i className="bi bi-book" style={{ fontSize: 36, display: "block", marginBottom: 12, opacity: .3 }}></i>
                <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: 14, color: "#64748b" }}>
                  {courses.length === 0 ? "No courses yet" : "No courses match your search"}
                </p>
                {courses.length === 0 && (
                  <button className="dash-btn-primary" onClick={openCreate}>
                    <i className="bi bi-plus-lg"></i> Create your first course
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filtered.map(course => {
                  const enrolled   = enrolledMap[course.id] || [];
                  const isExpanded = expandedCourse === course.id;
                  return (
                    <div key={course.id} className="course-card fade-up">

                      {/* Course Row */}
                      <div style={{ padding: "18px 20px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                          <div className="course-code-badge">{course.code}</div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{course.name}</span>
                              <span className="badge-pill" style={{ background: "#e8f0fe", color: "#0056b3" }}>{course.code}</span>
                              {course.semester && (
                                <span className="badge-pill" style={{ background: "#f1f5f9", color: "#64748b" }}>
                                  <i className="bi bi-calendar3 me-1"></i>{course.semester}
                                </span>
                              )}
                              {course.credits != null && (
                                <span className="badge-pill" style={{ background: "#f0f9ff", color: "#0369a1" }}>
                                  {course.credits} cr
                                </span>
                              )}
                            </div>
                            {course.description && (
                              <p style={{ margin: "0 0 6px", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{course.description}</p>
                            )}
                            <div style={{ display: "flex", gap: 14 }}>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                <i className="bi bi-people me-1"></i>
                                {enrolled.length > 0 ? `${enrolled.length} student${enrolled.length!==1?"s":""}` : "Students"}
                              </span>
                              {course.created_at && (
                                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                  <i className="bi bi-calendar3 me-1"></i>
                                  {new Date(course.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="course-actions d-flex gap-2 flex-shrink-0" style={{ alignItems: "center" }}>
                            <button
                              style={{ padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "inline-flex", alignItems: "center", gap: 6, transition: "all .15s", border: "none", background: isExpanded ? "#0056b3" : "#e8f0fe", color: isExpanded ? "#fff" : "#0056b3" }}
                              onClick={() => toggleExpand(course.id)}>
                              <i className={`bi bi-people${isExpanded?"-fill":""}`}></i>
                              {isExpanded ? "Close" : "Students"}
                            </button>
                            <Link to={`/instructor/courses/${course.id}`} className="action-btn" title="View detail">
                              <i className="bi bi-eye"></i>
                            </Link>
                            <button className="action-btn warn" onClick={() => openEdit(course)} title="Edit">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="action-btn del" onClick={() => handleDelete(course)} title="Delete">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Student Enrollment Panel */}
                      {isExpanded && (
                        <div className="enroll-panel">
                          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(0,86,179,.08)", padding: "16px 18px" }}>
                            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                              <i className="bi bi-person-plus me-2" style={{ color: "#0056b3" }}></i>Enroll Students
                            </h3>

                            {/* Search */}
                            <div style={{ position: "relative", marginBottom: 14 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                                <span style={{ padding: "9px 12px", background: "#f8faff", border: "1px solid rgba(0,86,179,.15)", borderRight: "none", borderRadius: "10px 0 0 10px", color: "#94a3b8", fontSize: 13 }}>
                                  {enrollLoading
                                    ? <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />
                                    : <i className="bi bi-search"></i>}
                                </span>
                                <input
                                  style={{ flex: 1, border: "1px solid rgba(0,86,179,.15)", borderLeft: "none", borderRight: studentSearch ? "none" : "1px solid rgba(0,86,179,.15)", borderRadius: studentSearch ? "0" : "0 10px 10px 0", padding: "9px 13px", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif", background: "#f8faff", color: "#1e293b" }}
                                  placeholder="Search students by name or email (min. 2 chars)…"
                                  value={studentSearch}
                                  onChange={handleStudentSearch} />
                                {studentSearch && (
                                  <button onClick={() => { setStudentSearch(""); setSearchResults([]); }}
                                    style={{ padding: "9px 12px", background: "#f8faff", border: "1px solid rgba(0,86,179,.15)", borderLeft: "none", borderRadius: "0 10px 10px 0", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>
                                    <i className="bi bi-x"></i>
                                  </button>
                                )}
                              </div>

                              {searchResults.length > 0 && (
                                <div className="search-dropdown">
                                  {searchResults.map(s => {
                                    const alreadyIn = enrolled.some(e => e.id === s.id);
                                    return (
                                      <div key={s.id} className="search-dropdown-item"
                                        style={{ cursor: alreadyIn ? "default" : "pointer", opacity: alreadyIn ? .7 : 1 }}
                                        onClick={() => !alreadyIn && handleEnroll(s)}>
                                        <MiniAvatar name={s.name} size={30} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{s.name}</div>
                                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.email}</div>
                                        </div>
                                        {alreadyIn
                                          ? <span className="badge-pill" style={{ background: "#f0fdf4", color: "#15803d" }}>Enrolled</span>
                                          : <span className="badge-pill" style={{ background: "#e8f0fe", color: "#0056b3" }}>+ Add</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Enrolled list */}
                            {enrolled.length === 0 ? (
                              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "10px 0" }}>
                                No students enrolled yet. Search above to add students.
                              </p>
                            ) : (
                              <>
                                <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748b" }}>
                                  {enrolled.length} enrolled student{enrolled.length!==1?"s":""}
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                  {enrolled.map(s => (
                                    <div key={s.id} className="student-chip">
                                      <MiniAvatar name={s.name} size={20} />
                                      <span>{s.name}</span>
                                      <button onClick={() => handleUnenroll(s)} title="Remove">
                                        <i className="bi bi-x-lg"></i>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        <InstructorBottomNav active="Courses" />
      </div>

      {/* ── Course Modal ── */}
      {showModal && (
        <div className="dash-modal-overlay" onClick={e => { if (e.target === e.currentTarget && !saving) setShowModal(false); }}>
          <div className="dash-modal">
            <div className="dash-modal-hdr">
              <div>
                <h5 style={{ margin: 0, fontWeight: 700, fontSize: 17, color: "#0f172a" }}>
                  <i className={`bi ${modalMode==="create"?"bi-plus-circle":"bi-pencil"} me-2`} style={{ color: "#0056b3" }}></i>
                  {modalMode==="create" ? "New Course" : "Edit Course"}
                </h5>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>
                  {modalMode==="create" ? "Fill in the details to create a course" : "Update course information"}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} disabled={saving}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8", padding: 4 }}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="dash-modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                <div>
                  <label className="form-lbl">Course Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" className={`form-ctrl ${errors.name?"err":""}`}
                    placeholder="e.g. Introduction to Programming"
                    value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))}
                    maxLength={150} disabled={saving} />
                  {errors.name && <p className="form-err">{errors.name}</p>}
                </div>

                <div>
                  <label className="form-lbl">Course Code <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" className={`form-ctrl ${errors.code?"err":""}`}
                    placeholder="e.g. CS101"
                    value={form.code} onChange={e => setForm(f => ({...f,code:e.target.value.toUpperCase()}))}
                    maxLength={20} disabled={saving} />
                  {errors.code && <p className="form-err">{errors.code}</p>}
                </div>

                <div className="form-grid-34">
                  <div>
                    <label className="form-lbl">Semester <span style={{ color: "#94a3b8", fontWeight: 400, textTransform: "none" }}></span></label>
                    <input type="text" className="form-ctrl"
                      placeholder="e.g. Fall 2026"
                      value={form.semester} onChange={e => setForm(f => ({...f,semester:e.target.value}))}
                      maxLength={50} disabled={saving} />
                  </div>
                  <div>
                    <label className="form-lbl">Credits <span style={{ color: "#ef4444" }}>*</span></label>
                    <input type="number" className={`form-ctrl ${errors.credits?"err":""}`}
                      placeholder="3" value={form.credits}
                      onChange={e => setForm(f => ({...f,credits:e.target.value}))}
                      min={1} max={6} disabled={saving} />
                    {errors.credits && <p className="form-err">{errors.credits}</p>}
                  </div>
                </div>

                <div>
                  <label className="form-lbl">Description <span style={{ color: "#94a3b8", fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                  <textarea className="form-ctrl" rows={3}
                    placeholder="Brief description of the course…"
                    value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))}
                    maxLength={500} disabled={saving} style={{ resize: "vertical" }} />
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8", textAlign: "right" }}>{form.description.length}/500</p>
                </div>
              </div>
            </div>

            <div className="dash-modal-ftr">
              <button className="dash-btn-ghost" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="dash-btn-primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</>
                  : <><i className="bi bi-check-lg"></i>{modalMode==="create"?"Create Course":"Save Changes"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}