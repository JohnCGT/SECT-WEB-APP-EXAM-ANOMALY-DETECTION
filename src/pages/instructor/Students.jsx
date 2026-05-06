// src/pages/instructor/Students.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";
import InstructorAlertBell from "../../components/InstructorAlertBell";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{--blue:#0056b3;--blue-lite:#e8f0fe;--slate:#64748b;--card-bg:#fff;--card-br:16px;--card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);}
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;transition:box-shadow .2s,transform .2s;}
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

  /* Stat chips */
  .stat-chip{flex:1;min-width:130px;background:#fff;border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);padding:14px 16px;}

  /* Inputs / selects */
  .search-input{border:1.5px solid rgba(0,86,179,.15);border-radius:10px;background:#f8faff;padding:7px 14px 7px 36px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s,box-shadow .2s;}
  .search-input:focus{border-color:#0056b3;box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .form-select-dash{border:1.5px solid rgba(0,86,179,.15);border-radius:10px;padding:8px 14px;font-size:13px;color:#1e293b;background:#f8faff;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s;}
  .form-select-dash:focus{border-color:#0056b3;box-shadow:0 0 0 3px rgba(0,86,179,.10);}

  /* Buttons */
  .btn-primary-dash{display:inline-flex;align-items:center;gap:8px;background:#0056b3;color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .15s;text-decoration:none;}
  .btn-primary-dash:hover{opacity:.87;color:#fff;}
  .btn-outline-dash{display:inline-flex;align-items:center;gap:6px;background:transparent;color:#0056b3;border:1.5px solid rgba(0,86,179,.25);border-radius:10px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s;text-decoration:none;}
  .btn-outline-dash:hover{background:var(--blue-lite);}
  .btn-danger-dash{display:inline-flex;align-items:center;gap:6px;background:transparent;color:#dc2626;border:1.5px solid rgba(220,38,38,.25);border-radius:10px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s;}
  .btn-danger-dash:hover{background:#fef2f2;}

  /* Sort button */
  .sort-btn{background:none;border:none;cursor:pointer;color:#94a3b8;font-size:11px;padding:0 4px;vertical-align:middle;}
  .sort-btn.active{color:#0056b3;}

  /* ── Mobile student card ── */
  .student-mobile-card{
    background:#fff;border-radius:14px;border:1px solid rgba(0,86,179,.07);
    box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;
  }
  .student-mobile-card-body{padding:14px 16px;display:flex;align-items:center;gap:12px;}
  .student-mobile-card-info{flex:1;min-width:0;}
  .student-mobile-card-action{padding:9px 16px;border-top:1px solid rgba(0,86,179,.06);background:#fafbff;display:flex;align-items:center;justify-content:space-between;gap:8px;}

  /* Desktop table / mobile card toggle */
  .student-desktop-table{display:block;}
  .student-mobile-list{display:none;}

  /* Bottom nav */
  .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,.08);}
  .bottom-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bottom-nav-item i{font-size:19px;}

  @media(max-width:991px){.main-content{padding:16px 12px 88px!important;}}
  @media(max-width:767px){
    .stats-row{flex-wrap:wrap!important;}
    .filter-row{flex-direction:column!important;align-items:stretch!important;}
    .search-input{width:100%!important;}

    /* Switch to card view */
    .student-desktop-table{display:none;}
    .student-mobile-list{display:flex;flex-direction:column;gap:10px;padding:14px;}

    /* Stat chips: 2 per row */
    .stats-row .stat-chip{min-width:calc(50% - 6px)!important;flex:1 1 calc(50% - 6px)!important;}
  }
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

const BOTTOM_NAV = [
  { to: "/instructor",         icon: "bi-speedometer2",         label: "Home"     },
  { to: "/instructor/courses", icon: "bi-book",                 label: "Courses"  },
  { to: "/instructor/exams",   icon: "bi-file-earmark-text",    label: "Exams"    },
  { to: "/instructor/students",icon: "bi-people",               label: "Students" },
  { to: "/instructor/alerts",  icon: "bi-exclamation-triangle", label: "Alerts"   },
];

const Students = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user,     setUser]     = useState(null);
  const [courses,  setCourses]  = useState([]);
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [selectedCourse, setSelectedCourse] = useState("all");
  const [searchTerm,     setSearchTerm]     = useState("");
  const [sortField,      setSortField]      = useState("name");
  const [sortDir,        setSortDir]        = useState("asc");

  const isActive  = to => to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "I";
  const firstName = user?.name?.split(" ")[0] ?? "Instructor";

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [userRes, coursesRes] = await Promise.all([API.get("/me"), API.get("/courses")]);
        setUser(userRes.data.user);
        const courseList = coursesRes.data.courses || [];
        setCourses(courseList);
        const studentResults = await Promise.all(
          courseList.map(course =>
            API.get(`/courses/${course.id}/students`)
              .then(res => (res.data.students || []).map(s => ({ ...s, courseId: course.id, courseName: course.name, courseCode: course.code })))
              .catch(() => [])
          )
        );
        setStudents(studentResults.flat());
      } catch (err) {
        console.error("Failed to load students:", err);
        Swal.fire("Error!", "Failed to load student data.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleRemove = async student => {
    const result = await Swal.fire({
      title: `Remove ${student.name}?`,
      text: `This will unenroll them from ${student.courseCode}. Their account won't be deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#0056b3",
      confirmButtonText: "Yes, remove",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/courses/${student.courseId}/students/${student.id}`);
      setStudents(prev => prev.filter(s => !(s.id === student.id && s.courseId === student.courseId)));
      Swal.fire({ icon: "success", title: "Removed!", text: `${student.name} unenrolled from ${student.courseCode}.`, timer: 1600, showConfirmButton: false });
    } catch {
      Swal.fire("Error!", "Failed to remove student.", "error");
    }
  };

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/instructor/login");
  };

  const filtered = useMemo(() => {
    let list = [...students];
    if (selectedCourse !== "all") list = list.filter(s => String(s.courseId) === String(selectedCourse));
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) ||
        s.courseCode.toLowerCase().includes(q) || s.courseName.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av = a[sortField] ?? "", bv = b[sortField] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [students, selectedCourse, searchTerm, sortField, sortDir]);

  const stats = useMemo(() => {
    const base = selectedCourse === "all" ? students : students.filter(s => String(s.courseId) === String(selectedCourse));
    return { total: base.length, unique: new Set(base.map(s => s.id)).size };
  }, [students, selectedCourse]);

  const handleSort = field => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) => (
    <i className={`bi ${sortField !== field ? "bi-chevron-expand" : sortDir === "asc" ? "bi-chevron-up" : "bi-chevron-down"} sort-btn${sortField === field ? " active" : ""}`}
      style={{ fontSize: 10, marginLeft: 4 }}></i>
  );

  const STAT_CHIPS = [
    { label: "Total Enrollments", value: stats.total,    color: "#0056b3", bg: "#e8f0fe", icon: "bi-person-check", sub: selectedCourse === "all" ? "Across all courses" : "In selected course" },
    { label: "Unique Students",   value: stats.unique,   color: "#15803d", bg: "#f0fdf4", icon: "bi-people",        sub: "Individual accounts" },
    { label: "Your Courses",      value: courses.length, color: "#1d4ed8", bg: "#eff6ff", icon: "bi-book",          sub: "Active courses"      },
    { label: "Showing Now",       value: filtered.length,color: "#64748b", bg: "#f1f5f9", icon: "bi-funnel",        sub: "After filters"       },
  ];

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div className="spinner-border" style={{ color: "#0056b3" }} role="status"></div>
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* ── Topbar ── */}
        <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>SECT Instructor</span>

          <div className="d-none d-md-flex align-items-center ms-3" style={{ position: "relative" }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 12, color: "#94a3b8", fontSize: 12 }}></i>
            <input className="search-input" style={{ width: 240 }} placeholder="Search students…"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 13 }}>✕</button>
            )}
          </div>

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
          <main className="main-content" style={{ flex: 1, padding: "24px 20px", paddingBottom: 100, minWidth: 0 }}>

            {/* Header */}
            <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Management</p>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Students</h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                  Enrolled students across your {courses.length} course{courses.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Link to="/instructor/courses" className="btn-primary-dash" style={{ flexShrink: 0 }}>
                <i className="bi bi-person-plus"></i>
                <span className="d-none d-sm-inline">Enroll via Courses</span>
                <span className="d-sm-none">Enroll</span>
              </Link>
            </div>

            {/* Mobile search */}
            <div className="d-md-none fade-up mb-3" style={{ position: "relative" }}>
              <i className="bi bi-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 12, zIndex: 1 }}></i>
              <input className="search-input" style={{ width: "100%" }} placeholder="Search students…"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* Stat chips */}
            <div className="stats-row fade-up" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {STAT_CHIPS.map(({ label, value, color, bg, icon, sub }) => (
                <div key={label} className="stat-chip">
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <i className={`bi ${icon}`} style={{ color, fontSize: 13 }}></i>
                  </div>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                  <p style={{ margin: "4px 0 2px", fontSize: 11, fontWeight: 600, color: "#0f172a" }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="dash-card fade-up mb-4" style={{ padding: "16px 20px" }}>
              <div className="filter-row" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: "0 0 auto", minWidth: 220 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>
                    <i className="bi bi-book me-1"></i>Filter by Course
                  </label>
                  <select className="form-select-dash" style={{ width: "100%" }} value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                    <option value="all">All Courses ({students.length} enrollments)</option>
                    {courses.map(c => {
                      const count = students.filter(s => s.courseId === c.id).length;
                      return <option key={c.id} value={c.id}>{c.code} – {c.name} ({count})</option>;
                    })}
                  </select>
                </div>
                <div style={{ flex: "0 0 auto" }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>
                    <i className="bi bi-sort-alpha-down me-1"></i>Sort by
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select className="form-select-dash" value={sortField} onChange={e => { setSortField(e.target.value); setSortDir("asc"); }}>
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="courseCode">Course</option>
                      <option value="enrolled_at">Enrolled Date</option>
                    </select>
                    <button className="btn-outline-dash" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")} title={sortDir === "asc" ? "Ascending" : "Descending"}>
                      <i className={`bi bi-sort-${sortDir === "asc" ? "up" : "down"}`}></i>
                    </button>
                  </div>
                </div>
                {(selectedCourse !== "all" || searchTerm) && (
                  <button className="btn-outline-dash" style={{ alignSelf: "flex-end" }} onClick={() => { setSelectedCourse("all"); setSearchTerm(""); }}>
                    <i className="bi bi-x-circle"></i>Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* ── Students List ── */}
            <div className="dash-card fade-up">
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  <i className="bi bi-people me-2" style={{ color: "#0056b3" }}></i>Student List
                  {selectedCourse !== "all" && (
                    <span style={{ marginLeft: 8, padding: "2px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "#e8f0fe", color: "#0056b3" }}>
                      {courses.find(c => String(c.id) === String(selectedCourse))?.code}
                    </span>
                  )}
                </h2>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
              </div>

              {filtered.length === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
                  <i className="bi bi-people" style={{ fontSize: 36, display: "block", marginBottom: 10, opacity: .25 }}></i>
                  <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#64748b" }}>
                    {students.length === 0 ? "No students enrolled in any of your courses yet." : "No students match your current filters."}
                  </p>
                  {students.length === 0 && (
                    <Link to="/instructor/courses" className="btn-primary-dash"><i className="bi bi-person-plus"></i>Enroll Students via Courses</Link>
                  )}
                </div>
              ) : (
                <>
                  {/* ── Desktop Table ── */}
                  <div className="student-desktop-table" style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f8faff", borderBottom: "1px solid #f1f5f9" }}>
                          <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", textTransform: "uppercase", width: 40 }}>#</th>
                          <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer" }} onClick={() => handleSort("name")}>
                            Name <SortIcon field="name" />
                          </th>
                          <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer" }} onClick={() => handleSort("email")}>
                            Email <SortIcon field="email" />
                          </th>
                          <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer" }} onClick={() => handleSort("courseCode")}>
                            Course <SortIcon field="courseCode" />
                          </th>
                          <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer" }} onClick={() => handleSort("enrolled_at")}>
                            Enrolled <SortIcon field="enrolled_at" />
                          </th>
                          <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", textTransform: "uppercase" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((student, index) => (
                          <tr key={`${student.id}-${student.courseId}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>{index + 1}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e8f0fe", color: "#0056b3", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 600, color: "#1e293b" }}>{student.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>{student.email}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <Link to={`/instructor/courses/${student.courseId}`} style={{ textDecoration: "none" }}>
                                <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "#e8f0fe", color: "#0056b3" }}>
                                  {student.courseCode}
                                </span>
                                <span className="d-none d-xl-inline" style={{ marginLeft: 8, fontSize: 12, color: "#94a3b8" }}>{student.courseName}</span>
                              </Link>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>
                              {student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", gap: 6 }}>
                                <Link to={`/instructor/courses/${student.courseId}`} className="btn-outline-dash" title="View in Course">
                                  <i className="bi bi-eye"></i>
                                </Link>
                                <button className="btn-danger-dash" title="Remove from course" onClick={() => handleRemove(student)}>
                                  <i className="bi bi-person-dash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Mobile Card List ── */}
                  <div className="student-mobile-list">
                    {filtered.map((student, index) => (
                      <div key={`${student.id}-${student.courseId}`} className="student-mobile-card">
                        <div className="student-mobile-card-body">
                          {/* Avatar */}
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e8f0fe", color: "#0056b3", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          {/* Info */}
                          <div className="student-mobile-card-info">
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{student.name}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{student.email}</div>
                            {student.enrolled_at && (
                              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                                <i className="bi bi-calendar3 me-1"></i>
                                {new Date(student.enrolled_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Action bar */}
                        <div className="student-mobile-card-action">
                          <Link to={`/instructor/courses/${student.courseId}`} style={{ textDecoration: "none" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "#e8f0fe", color: "#0056b3" }}>
                              <i className="bi bi-book"></i>{student.courseCode}
                            </span>
                          </Link>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Link to={`/instructor/courses/${student.courseId}`} className="btn-outline-dash" style={{ padding: "5px 10px" }}>
                              <i className="bi bi-eye"></i>
                            </Link>
                            <button className="btn-danger-dash" style={{ padding: "5px 10px" }} onClick={() => handleRemove(student)}>
                              <i className="bi bi-person-dash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {filtered.length > 0 && (
                <div style={{ padding: "10px 20px", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#94a3b8" }}>
                  <i className="bi bi-info-circle me-1"></i>
                  Showing {filtered.length} enrollment{filtered.length !== 1 ? "s" : ""}. Removing a student unenrolls them from the course — it does not delete their account.
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ── Bottom Nav ── */}
        <nav className="bottom-nav d-lg-none">
          {BOTTOM_NAV.map(({ to, icon, label }) => (
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

export default Students;