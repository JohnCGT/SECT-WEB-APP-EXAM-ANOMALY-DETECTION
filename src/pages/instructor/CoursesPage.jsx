import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";
import InstructorAlertBell from "../../components/InstructorAlertBell";

/* ─── Shared sidebar ─────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/instructor",                  icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/instructor/courses",          icon: "bi-book",                 label: "Courses"   },
  { to: "/instructor/exams",            icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/instructor/students",         icon: "bi-people",               label: "Students"  },
  { to: "/instructor/alerts",           icon: "bi-exclamation-triangle", label: "Alerts"    },
  // { to: "/instructor/reports",          icon: "bi-bar-chart",            label: "Reports"   },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

// ── Added semester and credits to blank form ──
const BLANK_FORM = { name: "", code: "", description: "", semester: "", credits: 3 };

export default function CoursesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user,    setUser]    = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState("");

  // Course modal
  const [showModal,  setShowModal]  = useState(false);
  const [modalMode,  setModalMode]  = useState("create"); // "create" | "edit"
  const [selected,   setSelected]   = useState(null);
  const [form,       setForm]       = useState(BLANK_FORM);
  const [errors,     setErrors]     = useState({});

  // Student panel
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [studentSearch,  setStudentSearch]  = useState("");
  const [searchResults,  setSearchResults]  = useState([]);
  const [enrolledMap,    setEnrolledMap]    = useState({}); // courseId → student[]
  const [enrollLoading,  setEnrollLoading]  = useState(false);

  /* ── Boot ── */
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [meRes, coursesRes] = await Promise.all([API.get("/me"), API.get("/courses")]);
      setUser(meRes.data.user);
      setCourses(coursesRes.data.courses || []);
    } catch {
      Swal.fire("Error", "Failed to load courses.", "error");
    } finally { setLoading(false); }
  };

  /* ── Logout ── */
  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    localStorage.removeItem("examPageData");
    window.location.href = "/instructor/login";
  };

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name    = "Course name is required.";
    if (!form.code.trim())   e.code    = "Course code is required.";
    const cr = Number(form.credits);
    if (!form.credits || isNaN(cr) || cr < 1 || cr > 6)
      e.credits = "Credits must be between 1 and 6.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  /* ── Open modals ── */
  const openCreate = () => {
    setModalMode("create");
    setSelected(null);
    setForm(BLANK_FORM);
    setErrors({});
    setShowModal(true);
  };

  // ── Include semester and credits when opening edit ──
  const openEdit = (course) => {
    setModalMode("edit");
    setSelected(course);
    setForm({
      name:        course.name,
      code:        course.code,
      description: course.description || "",
      semester:    course.semester    || "",
      credits:     course.credits     ?? 3,
    });
    setErrors({});
    setShowModal(true);
  };

  /* ── Save course (create or edit) ── */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (modalMode === "create") {
        const res = await API.post("/courses", form);
        const newCourse = res.data.course || res.data;
        setCourses(prev => [newCourse, ...prev]);
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

  /* ── Delete course ── */
  const handleDelete = async (course) => {
    const result = await Swal.fire({
      title:`Delete "${course.code}"?`,
      text:"This will permanently delete the course and all associated data.",
      icon:"warning", showCancelButton:true,
      confirmButtonColor:"#d33", confirmButtonText:"Yes, delete",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/courses/${course.id}`);
      setCourses(prev => prev.filter(c => c.id !== course.id));
      if (expandedCourse === course.id) setExpandedCourse(null);
      Swal.fire({ icon:"success", title:"Deleted!", timer:1200, showConfirmButton:false });
    } catch { Swal.fire("Error", "Failed to delete course.", "error"); }
  };

  /* ── Student panel toggle ── */
  const toggleExpand = async (courseId) => {
    if (expandedCourse === courseId) { setExpandedCourse(null); return; }
    setExpandedCourse(courseId);
    setStudentSearch("");
    setSearchResults([]);
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

  /* ── Student search ── */
  const handleStudentSearch = async (e) => {
    const q = e.target.value;
    setStudentSearch(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    try {
      const res = await API.get(`/students/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data.students || []);
    } catch { setSearchResults([]); }
  };

  /* ── Enroll student ── */
  const handleEnroll = async (student) => {
    if (!expandedCourse) return;
    const already = (enrolledMap[expandedCourse] || []).find(s => s.id === student.id);
    if (already) {
      Swal.fire("Already enrolled", `${student.name} is already in this course.`, "info");
      return;
    }
    setEnrollLoading(true);
    try {
      await API.post(`/courses/${expandedCourse}/students`, {
        mode:  "existing",
        email: student.email,
      });
      await fetchEnrolled(expandedCourse);
      setStudentSearch("");
      setSearchResults([]);
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to enroll student.", "error");
    } finally { setEnrollLoading(false); }
  };

  /* ── Unenroll student ── */
  const handleUnenroll = async (student) => {
    const res = await Swal.fire({
      title:`Remove ${student.name}?`,
      text:"This unenrolls them from this course only.",
      icon:"warning", showCancelButton:true,
      confirmButtonColor:"#d33", confirmButtonText:"Remove",
    });
    if (!res.isConfirmed) return;
    try {
      await API.delete(`/courses/${expandedCourse}/students/${student.id}`);
      setEnrolledMap(prev => ({
        ...prev,
        [expandedCourse]: prev[expandedCourse].filter(s => s.id !== student.id),
      }));
    } catch { Swal.fire("Error", "Failed to remove student.", "error"); }
  };

  /* ── Derived ── */
  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.description||"").toLowerCase().includes(q);
  });

  const isActive = (to) =>
    to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="d-flex flex-column min-vh-100">

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold text-primary" href="#">SECT Instructor</a>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <InstructorAlertBell />
            <div className="dropdown">
              <button className="btn btn-light dropdown-toggle fw-bold" type="button" data-bs-toggle="dropdown">
                <i className="bi bi-person-circle me-2"></i>{user?.name || "Instructor"}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><Link className="dropdown-item" to="/instructor/account-settings"><i className="bi bi-gear me-2"></i>Account Settings</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile"><i className="bi bi-person me-2"></i>Profile</Link></li>
                <li><hr className="dropdown-divider"/></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="d-flex flex-grow-1">

        {/* Sidebar */}
        <nav className="bg-white border-end d-flex flex-column align-items-center py-3" style={{ width:72, minHeight:"100%" }}>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <Link key={to} to={to}
              className={`nav-link d-flex flex-column align-items-center py-2 px-1 mb-2 rounded ${
                isActive(to) ? "text-primary bg-primary bg-opacity-10 fw-bold" : "text-secondary"
              }`}
              style={{ fontSize:10, width:56, textAlign:"center" }} title={label}>
              <i className={`bi ${icon} fs-5 mb-1`}></i>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Main */}
        <div className="flex-grow-1 p-4 bg-light">

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-0 fw-bold">Course Management</h4>
              <p className="text-muted mb-0 small">Create and manage your courses, enroll students</p>
            </div>
            <button className="btn btn-primary" onClick={openCreate}>
              <i className="bi bi-plus-lg me-2"></i>New Course
            </button>
          </div>

          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            {[
              { label:"Total Courses",      value:courses.length,                                                                       color:"primary", icon:"bi-book"   },
              { label:"Total Enrollments",  value:Object.values(enrolledMap).reduce((s,arr) => s+arr.length, 0) || "—",                color:"success", icon:"bi-people" },
              { label:"Filtered Results",   value:filtered.length,                                                                      color:"info",    icon:"bi-funnel" },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="col-md-4">
                <div className={`card shadow-sm border-0 border-start border-${color} border-4 h-100`}>
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className={`bi ${icon} text-${color}`}></i>
                      <h6 className="card-title text-muted mb-0 small">{label}</h6>
                    </div>
                    <p className={`card-text display-6 fw-bold text-${color} mb-0`}>{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="card shadow-sm border-0 mb-3">
            <div className="card-body py-3">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                <input className="form-control border-start-0" placeholder="Search by name or code…"
                  value={search} onChange={e => setSearch(e.target.value)}/>
                {search && <button className="btn btn-outline-secondary" onClick={() => setSearch("")}><i className="bi bi-x"></i></button>}
              </div>
            </div>
          </div>

          {/* Course List */}
          {loading ? (
            <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"/></div>
          ) : filtered.length === 0 ? (
            <div className="card shadow-sm border-0">
              <div className="card-body text-center text-muted py-5">
                <i className="bi bi-book fs-1 d-block mb-3 opacity-25"></i>
                <p className="mb-2 fw-semibold">{courses.length===0?"No courses yet":"No courses match your search"}</p>
                {courses.length === 0 && (
                  <button className="btn btn-primary btn-sm" onClick={openCreate}>
                    <i className="bi bi-plus-lg me-1"></i>Create your first course
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filtered.map(course => {
                const enrolled   = enrolledMap[course.id] || [];
                const isExpanded = expandedCourse === course.id;
                return (
                  <div key={course.id} className="card shadow-sm border-0">

                    {/* Course Row */}
                    <div className="card-body">
                      <div className="d-flex align-items-start gap-3">
                        <div className="rounded-3 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
                          style={{ width:52, height:52, fontSize:12 }}>
                          {course.code}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                            <h6 className="mb-0 fw-semibold">{course.name}</h6>
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
                              {course.code}
                            </span>
                            {/* ── New: semester badge ── */}
                            {course.semester && (
                              <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">
                                <i className="bi bi-calendar3 me-1"></i>{course.semester}
                              </span>
                            )}
                            {/* ── New: credits badge ── */}
                            {course.credits != null && (
                              <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                                {course.credits} cr
                              </span>
                            )}
                          </div>
                          {course.description && <p className="text-muted small mb-1">{course.description}</p>}
                          <div className="d-flex gap-3">
                            <small className="text-muted">
                              <i className="bi bi-people me-1"></i>
                              {isExpanded && enrolled.length > 0
                                ? `${enrolled.length} student${enrolled.length!==1?"s":""}`
                                : "Students"}
                            </small>
                            {course.created_at && (
                              <small className="text-muted">
                                <i className="bi bi-calendar3 me-1"></i>
                                {new Date(course.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                              </small>
                            )}
                          </div>
                        </div>
                        <div className="d-flex gap-2 flex-shrink-0">
                          <button
                            className={`btn btn-sm ${isExpanded?"btn-primary":"btn-outline-primary"}`}
                            onClick={() => toggleExpand(course.id)}
                            title="Manage students"
                          >
                            <i className={`bi bi-people${isExpanded?"-fill":""} me-1`}></i>
                            {isExpanded?"Close":"Students"}
                          </button>
                          <Link to={`/instructor/courses/${course.id}`} className="btn btn-sm btn-outline-secondary" title="View course detail">
                            <i className="bi bi-eye me-1"></i>Detail
                          </Link>
                          <button className="btn btn-sm btn-outline-warning" onClick={() => openEdit(course)} title="Edit course">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(course)} title="Delete course">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Student Enrollment Panel */}
                    {isExpanded && (
                      <div className="card-footer bg-light border-top p-3">
                        <div className="border rounded-3 bg-white p-3">
                          <h6 className="fw-semibold mb-3">
                            <i className="bi bi-person-plus text-primary me-2"></i>Enroll Students
                          </h6>

                          {/* Search to add */}
                          <div className="mb-3 position-relative">
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">
                                {enrollLoading
                                  ? <span className="spinner-border spinner-border-sm"/>
                                  : <i className="bi bi-search"></i>}
                              </span>
                              <input className="form-control"
                                placeholder="Search students by name or email (min. 2 chars)…"
                                value={studentSearch}
                                onChange={handleStudentSearch}/>
                              {studentSearch && (
                                <button className="btn btn-outline-secondary" onClick={() => { setStudentSearch(""); setSearchResults([]); }}>
                                  <i className="bi bi-x"></i>
                                </button>
                              )}
                            </div>

                            {searchResults.length > 0 && (
                              <div className="position-absolute w-100 bg-white border rounded-3 shadow-sm mt-1" style={{zIndex:50}}>
                                {searchResults.map(s => {
                                  const alreadyIn = enrolled.some(e => e.id === s.id);
                                  return (
                                    <div key={s.id}
                                      className={`d-flex align-items-center justify-content-between px-3 py-2 border-bottom ${!alreadyIn?"hover-bg":""}`}
                                      style={{ cursor:alreadyIn?"default":"pointer" }}
                                      onClick={() => !alreadyIn && handleEnroll(s)}
                                    >
                                      <div className="d-flex align-items-center gap-2">
                                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                          style={{width:30,height:30,fontSize:12}}>
                                          {s.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <div className="fw-semibold small">{s.name}</div>
                                          <div className="text-muted" style={{fontSize:11}}>{s.email}</div>
                                        </div>
                                      </div>
                                      {alreadyIn
                                        ? <span className="badge bg-success">Enrolled</span>
                                        : <span className="badge bg-primary">+ Add</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Enrolled list */}
                          {enrolled.length === 0 ? (
                            <p className="text-muted small mb-0 text-center py-2">
                              No students enrolled yet. Search above to add students.
                            </p>
                          ) : (
                            <>
                              <p className="text-muted small mb-2">{enrolled.length} enrolled student{enrolled.length!==1?"s":""}</p>
                              <div className="d-flex flex-wrap gap-2">
                                {enrolled.map(s => (
                                  <div key={s.id} className="d-flex align-items-center gap-2 border rounded-pill px-3 py-1 bg-light">
                                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0"
                                      style={{width:22,height:22,fontSize:10}}>
                                      {s.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="small fw-semibold">{s.name}</span>
                                    <button
                                      className="btn btn-link text-danger p-0 ms-1"
                                      style={{fontSize:12,lineHeight:1}}
                                      title="Remove"
                                      onClick={() => handleUnenroll(s)}
                                    >
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
        </div>
      </div>

      {/* ── Course Modal ── */}
      {showModal && (
        <div className="modal show d-block" style={{backgroundColor:"rgba(0,0,0,0.5)"}}
          onClick={e => { if (e.target === e.currentTarget && !saving) setShowModal(false); }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold">
                  <i className={`bi ${modalMode==="create"?"bi-plus-circle":"bi-pencil"} text-primary me-2`}></i>
                  {modalMode==="create"?"New Course":"Edit Course"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} disabled={saving}/>
              </div>
              <div className="modal-body">

                {/* Course Name */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Course Name <span className="text-danger">*</span></label>
                  <input type="text"
                    className={`form-control ${errors.name?"is-invalid":""}`}
                    placeholder="e.g. Introduction to Programming"
                    value={form.name}
                    onChange={e => setForm(f => ({...f,name:e.target.value}))}
                    maxLength={150}
                    disabled={saving}/>
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                {/* Course Code */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Course Code <span className="text-danger">*</span></label>
                  <input type="text"
                    className={`form-control ${errors.code?"is-invalid":""}`}
                    placeholder="e.g. CS101"
                    value={form.code}
                    onChange={e => setForm(f => ({...f,code:e.target.value.toUpperCase()}))}
                    maxLength={20}
                    disabled={saving}/>
                  {errors.code && <div className="invalid-feedback">{errors.code}</div>}
                </div>

                {/* ── New: Semester + Credits side-by-side ── */}
                <div className="row g-3 mb-3">
                  <div className="col-8">
                    <label className="form-label fw-semibold">
                      Semester <span className="text-muted fw-normal">(optional)</span>
                    </label>
                    <input type="text"
                      className="form-control"
                      placeholder="e.g. Fall 2026"
                      value={form.semester}
                      onChange={e => setForm(f => ({...f, semester: e.target.value}))}
                      maxLength={50}
                      disabled={saving}/>
                  </div>
                  <div className="col-4">
                    <label className="form-label fw-semibold">
                      Credits <span className="text-danger">*</span>
                    </label>
                    <input type="number"
                      className={`form-control ${errors.credits?"is-invalid":""}`}
                      placeholder="3"
                      value={form.credits}
                      onChange={e => setForm(f => ({...f, credits: e.target.value}))}
                      min={1}
                      max={6}
                      disabled={saving}/>
                    {errors.credits && <div className="invalid-feedback">{errors.credits}</div>}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-1">
                  <label className="form-label fw-semibold">Description <span className="text-muted fw-normal">(optional)</span></label>
                  <textarea className="form-control" rows={3}
                    placeholder="Brief description of the course…"
                    value={form.description}
                    onChange={e => setForm(f => ({...f,description:e.target.value}))}
                    maxLength={500}
                    disabled={saving}/>
                  <div className="form-text text-end">{form.description.length}/500</div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                <button type="button" className="btn btn-primary px-4" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</>
                    : <><i className="bi bi-check-lg me-2"/>{modalMode==="create"?"Create Course":"Save Changes"}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
