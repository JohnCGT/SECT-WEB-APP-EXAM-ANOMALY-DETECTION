// src/pages/instructor/CourseDetail.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
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
  // { to: "/instructor/reports",          icon: "bi-bar-chart",            label: "Reports"   },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

/* ════════════════════════════════════════════
   COURSE DETAIL PAGE  —  /instructor/courses/:id
════════════════════════════════════════════ */
const CourseDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [user,      setUser]      = useState(null);
  const [course,    setCourse]    = useState(null);
  const [exams,     setExams]     = useState([]);
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [showAddModal,   setShowAddModal]   = useState(false);
  const [studentSearch,  setStudentSearch]  = useState("");
  const [examSearch,     setExamSearch]     = useState("");
  const [examFilter,     setExamFilter]     = useState("all");

  /* ── Active sidebar helper ── */
  const isActive = (to) =>
    to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

  /* ── Boot ── */
  useEffect(() => {
    API.get("/me").then((r) => setUser(r.data.user)).catch(() => {});
    fetchAll();
  }, [id]);

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
    } finally {
      setLoading(false);
    }
  };

  /* ── Exam handlers ── */
  const handleDeleteExam = async (examId) => {
    const result = await Swal.fire({
      title: "Delete this exam?", text: "This cannot be undone.", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/exams/${examId}`);
      setExams((prev) => prev.filter((e) => e.id !== examId));
      Swal.fire({ icon: "success", title: "Deleted!", timer: 1400, showConfirmButton: false });
    } catch {
      Swal.fire("Error!", "Failed to delete exam.", "error");
    }
  };

  /* ── Student handlers ── */
  const handleStudentAdded = (newStudent) => {
    setStudents((prev) => [...prev, newStudent]);
    setShowAddModal(false);
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    const result = await Swal.fire({
      title: `Remove ${studentName}?`,
      text: "This unenrolls them from the course. Their account won't be deleted.",
      icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Yes, remove!",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/courses/${id}/students/${studentId}`);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      Swal.fire({ icon: "success", title: "Removed!", timer: 1400, showConfirmButton: false });
    } catch {
      Swal.fire("Error!", "Failed to remove student.", "error");
    }
  };

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/instructor/login");
  };

  /* ── Derived ── */
  const getStatusBadge = (status) => ({
    active:    "bg-success",
    scheduled: "bg-warning text-dark",
    completed: "bg-info",
    draft:     "bg-secondary",
  }[status] ?? "bg-secondary");

  const examStats = useMemo(() => ({
    total:       exams.length,
    active:      exams.filter((e) => e.status === "active").length,
    scheduled:   exams.filter((e) => e.status === "scheduled").length,
    completed:   exams.filter((e) => e.status === "completed").length,
    totalPoints: exams.reduce((sum, e) => sum + (e.total_points || 0), 0),
  }), [exams]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter((s) =>
      s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const filteredExams = useMemo(() => {
    let list = exams;
    if (examFilter !== "all") list = list.filter((e) => e.status === examFilter);
    if (examSearch.trim()) {
      const q = examSearch.toLowerCase();
      list = list.filter((e) => e.title?.toLowerCase().includes(q) || e.type?.toLowerCase().includes(q));
    }
    return list;
  }, [exams, examFilter, examSearch]);

  /* ── Loading ── */
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="d-flex flex-column min-vh-100">

      {/* ── Navbar ── */}
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
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="d-flex flex-grow-1">

        {/* ── Sidebar ── */}
        <nav className="bg-white border-end d-flex flex-column align-items-center py-3" style={{ width: 72, minHeight: "100%" }}>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <Link key={to} to={to}
              className={`nav-link d-flex flex-column align-items-center py-2 px-1 mb-2 rounded ${
                isActive(to) ? "text-primary bg-primary bg-opacity-10 fw-bold" : "text-secondary"
              }`}
              style={{ fontSize: 10, width: 56, textAlign: "center" }} title={label}>
              <i className={`bi ${icon} fs-5 mb-1`}></i>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* ── Main ── */}
        <div className="flex-grow-1 bg-light overflow-auto">

          {/* ── Course Header Band ── */}
          <div className="bg-white border-bottom shadow-sm px-4 pt-4 pb-0">

            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-2">
              <ol className="breadcrumb mb-0 small">
                <li className="breadcrumb-item">
                  <Link to="/instructor" className="text-decoration-none text-muted">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/instructor/courses" className="text-decoration-none text-muted">Courses</Link>
                </li>
                <li className="breadcrumb-item active fw-semibold">{course.code}</li>
              </ol>
            </nav>

            {/* Title + Actions */}
            <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-3">
              <div>
                <div className="d-flex align-items-center gap-3 mb-1">
                  <div className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 48, height: 48 }}>
                    <i className="bi bi-folder2-open text-primary fs-4"></i>
                  </div>
                  <div>
                    <h4 className="mb-0 fw-bold">{course.code} — {course.name}</h4>
                    {course.description && <p className="text-muted mb-0 small">{course.description}</p>}
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-2 mt-2 ms-1">
                  {course.semester && (
                    <span className="badge bg-light text-dark border">
                      <i className="bi bi-calendar3 me-1"></i>{course.semester}
                    </span>
                  )}
                  {course.credits && (
                    <span className="badge bg-light text-dark border">
                      <i className="bi bi-award me-1"></i>{course.credits} credits
                    </span>
                  )}
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                    <i className="bi bi-people me-1"></i>{students.length} students enrolled
                  </span>
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
                    <i className="bi bi-file-earmark-text me-1"></i>{exams.length} exams
                  </span>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-success btn-sm" onClick={() => setShowAddModal(true)}>
                  <i className="bi bi-person-plus me-2"></i>Add Student
                </button>
                <Link to="/instructor/exams" state={{ openCreateExam: true }} className="btn btn-primary btn-sm">
                  <i className="bi bi-plus-circle me-2"></i>New Exam
                </Link>
              </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs border-0 mb-0">
              {[
                { key: "overview",  icon: "bi-grid-1x2",          label: "Overview"                           },
                { key: "exams",     icon: "bi-file-earmark-text", label: `Exams (${exams.length})`            },
                { key: "students",  icon: "bi-people",            label: `Students (${students.length})`      },
              ].map(({ key, icon, label }) => (
                <li key={key} className="nav-item">
                  <button
                    className={`nav-link pb-3 ${activeTab === key ? "active fw-semibold" : "text-muted"}`}
                    style={{ border: "none", background: "none" }}
                    onClick={() => setActiveTab(key)}
                  >
                    <i className={`bi ${icon} me-2`}></i>{label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Tab Content ── */}
          <div className="p-4">

            {/* ════ OVERVIEW ════ */}
            {activeTab === "overview" && (
              <div className="row g-4">

                {/* Stat Cards */}
                <div className="col-12">
                  <div className="row g-3">
                    {[
                      { icon: "bi-file-earmark-text", color: "primary", label: "Total Exams",       value: examStats.total       },
                      { icon: "bi-play-circle",        color: "success", label: "Active Exams",      value: examStats.active      },
                      { icon: "bi-calendar-event",     color: "warning", label: "Scheduled",         value: examStats.scheduled   },
                      { icon: "bi-check-circle",       color: "info",    label: "Completed",         value: examStats.completed   },
                      { icon: "bi-people",             color: "success", label: "Students Enrolled", value: students.length       },
                      { icon: "bi-trophy",             color: "warning", label: "Total Points",      value: examStats.totalPoints },
                    ].map(({ icon, color, label, value }) => (
                      <div key={label} className="col-md-2 col-4">
                        <div className="card border-0 shadow-sm text-center h-100">
                          <div className="card-body py-3 px-2">
                            <div className={`rounded-circle bg-${color} bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-2`}
                              style={{ width: 40, height: 40 }}>
                              <i className={`bi ${icon} text-${color}`}></i>
                            </div>
                            <div className={`fw-bold fs-4 text-${color} lh-1`}>{value}</div>
                            <div className="text-muted mt-1" style={{ fontSize: 11 }}>{label}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Exams */}
                <div className="col-md-7">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-semibold">
                        <i className="bi bi-file-earmark-text me-2 text-primary"></i>Recent Exams
                      </h6>
                      <button className="btn btn-sm btn-link text-primary p-0" onClick={() => setActiveTab("exams")}>
                        View all →
                      </button>
                    </div>
                    <div className="card-body p-0">
                      {exams.length === 0 ? (
                        <div className="text-center py-5">
                          <i className="bi bi-file-earmark-x fs-2 text-muted d-block mb-2"></i>
                          <p className="text-muted small mb-0">No exams yet.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr><th>TITLE</th><th>TYPE</th><th>DATE</th><th>STATUS</th></tr>
                            </thead>
                            <tbody>
                              {exams.slice(0, 5).map((exam) => (
                                <tr key={exam.id}>
                                  <td>
                                    <Link to={`/instructor/exams/${exam.id}`} className="fw-semibold text-decoration-none text-dark small">
                                      {exam.title}
                                    </Link>
                                  </td>
                                  <td><span className="badge bg-secondary text-capitalize small">{exam.type}</span></td>
                                  <td className="text-muted small">{new Date(exam.start_time).toLocaleDateString()}</td>
                                  <td><span className={`badge ${getStatusBadge(exam.status)} text-capitalize`}>{exam.status}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enrolled Students */}
                <div className="col-md-5">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-semibold">
                        <i className="bi bi-people me-2 text-success"></i>Enrolled Students
                      </h6>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-success" onClick={() => setShowAddModal(true)}>
                          <i className="bi bi-person-plus me-1"></i>Add
                        </button>
                        <button className="btn btn-sm btn-link text-primary p-0" onClick={() => setActiveTab("students")}>
                          View all →
                        </button>
                      </div>
                    </div>
                    <div className="card-body p-0">
                      {students.length === 0 ? (
                        <div className="text-center py-5">
                          <i className="bi bi-people fs-2 text-muted d-block mb-2"></i>
                          <p className="text-muted small mb-2">No students enrolled yet.</p>
                          <button className="btn btn-sm btn-success" onClick={() => setShowAddModal(true)}>
                            <i className="bi bi-person-plus me-1"></i>Enroll First Student
                          </button>
                        </div>
                      ) : (
                        <div className="list-group list-group-flush">
                          {students.slice(0, 6).map((s) => (
                            <div key={s.id} className="list-group-item px-3 py-2 d-flex align-items-center gap-3">
                              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                style={{ width: 32, height: 32, fontSize: 12 }}>
                                {s.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-grow-1 overflow-hidden">
                                <div className="fw-semibold small text-truncate">{s.name}</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>{s.email}</div>
                              </div>
                            </div>
                          ))}
                          {students.length > 6 && (
                            <div className="list-group-item text-center py-2">
                              <button className="btn btn-link btn-sm p-0 text-muted" onClick={() => setActiveTab("students")}>
                                +{students.length - 6} more students
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ EXAMS TAB ════ */}
            {activeTab === "exams" && (
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h6 className="mb-0 fw-semibold">
                      <i className="bi bi-file-earmark-text me-2 text-primary"></i>Exams in this Course
                    </h6>
                    <Link to="/instructor/exams" className="btn btn-primary btn-sm">
                      <i className="bi bi-plus me-1"></i>New Exam
                    </Link>
                  </div>
                  {exams.length > 0 && (
                    <div className="d-flex gap-2 mt-3 flex-wrap align-items-center">
                      <div className="input-group input-group-sm" style={{ maxWidth: 280 }}>
                        <span className="input-group-text bg-white border-end-0">
                          <i className="bi bi-search text-muted"></i>
                        </span>
                        <input type="text" className="form-control border-start-0" placeholder="Search exams…"
                          value={examSearch} onChange={(e) => setExamSearch(e.target.value)} />
                        {examSearch && (
                          <button className="btn btn-outline-secondary" onClick={() => setExamSearch("")}>
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </div>
                      <div className="d-flex gap-1 flex-wrap">
                        {["all", "active", "scheduled", "completed", "draft"].map((s) => (
                          <button key={s}
                            className={`btn btn-sm ${examFilter === s ? "btn-primary" : "btn-outline-secondary"} text-capitalize`}
                            onClick={() => setExamFilter(s)}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="card-body p-0">
                  {exams.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-file-earmark-x fs-1 text-muted d-block mb-2 opacity-25"></i>
                      <p className="text-muted mb-3">No exams in this course yet.</p>
                      <Link to="/instructor/exams" className="btn btn-primary btn-sm">
                        <i className="bi bi-plus-circle me-2"></i>Create an Exam
                      </Link>
                    </div>
                  ) : filteredExams.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-search d-block fs-3 mb-2"></i>No exams match your filter.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>EXAM NAME</th><th>TYPE</th><th>START</th>
                            <th>DURATION</th><th>QUESTIONS</th><th>POINTS</th><th>STATUS</th><th>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredExams.map((exam) => (
                            <tr key={exam.id}>
                              <td>
                                <Link to={`/instructor/exams/${exam.id}`} className="fw-semibold text-decoration-none text-dark">
                                  {exam.title}
                                </Link>
                              </td>
                              <td><span className="badge bg-secondary text-capitalize">{exam.type}</span></td>
                              <td className="text-muted small">{new Date(exam.start_time).toLocaleString()}</td>
                              <td className="text-muted small">{exam.duration_minutes} min</td>
                              <td className="text-center">{exam.questions_count || 0}</td>
                              <td className="text-center">{exam.total_points || 0}</td>
                              <td><span className={`badge ${getStatusBadge(exam.status)} text-capitalize`}>{exam.status}</span></td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Link to={`/instructor/exams/${exam.id}`}      className="btn btn-sm btn-outline-primary"   title="View"><i className="bi bi-eye"></i></Link>
                                  <Link to={`/instructor/exams/${exam.id}/edit`} className="btn btn-sm btn-outline-secondary" title="Edit"><i className="bi bi-pencil"></i></Link>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteExam(exam.id)} title="Delete"><i className="bi bi-trash"></i></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════ STUDENTS TAB ════ */}
            {activeTab === "students" && (
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h6 className="mb-0 fw-semibold">
                      <i className="bi bi-people me-2 text-success"></i>
                      Enrolled Students <span className="badge bg-primary ms-1">{students.length}</span>
                    </h6>
                    <button className="btn btn-success btn-sm" onClick={() => setShowAddModal(true)}>
                      <i className="bi bi-person-plus me-2"></i>Add Student
                    </button>
                  </div>
                  {students.length > 0 && (
                    <div className="mt-2">
                      <div className="input-group input-group-sm" style={{ maxWidth: 320 }}>
                        <span className="input-group-text bg-white border-end-0">
                          <i className="bi bi-search text-muted"></i>
                        </span>
                        <input type="text" className="form-control border-start-0" placeholder="Search by name or email…"
                          value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                        {studentSearch && (
                          <button className="btn btn-outline-secondary" onClick={() => setStudentSearch("")}>
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="card-body p-0">
                  {students.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-people fs-1 text-muted d-block mb-2 opacity-25"></i>
                      <p className="text-muted mb-3">No students enrolled yet.</p>
                      <button className="btn btn-success" onClick={() => setShowAddModal(true)}>
                        <i className="bi bi-person-plus me-2"></i>Enroll First Student
                      </button>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-search d-block fs-3 mb-2"></i>
                      No students match "<strong>{studentSearch}</strong>"
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr><th>#</th><th>STUDENT</th><th>EMAIL</th><th>ENROLLED</th><th>EXAM ACCESS</th><th>ACTIONS</th></tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student, idx) => (
                            <tr key={student.id}>
                              <td className="text-muted align-middle">{idx + 1}</td>
                              <td className="align-middle">
                                <div className="d-flex align-items-center gap-2">
                                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                    style={{ width: 34, height: 34, fontSize: 13 }}>
                                    {student.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="fw-semibold">{student.name}</span>
                                </div>
                              </td>
                              <td className="text-muted small align-middle">{student.email}</td>
                              <td className="text-muted small align-middle">
                                {student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString() : "—"}
                              </td>
                              <td className="align-middle">
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                                  <i className="bi bi-check-circle me-1"></i>
                                  {exams.length} exam{exams.length !== 1 ? "s" : ""}
                                </span>
                              </td>
                              <td className="align-middle">
                                <button className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveStudent(student.id, student.name)}>
                                  <i className="bi bi-person-dash me-1"></i>
                                  <span className="d-none d-md-inline">Remove</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                {students.length > 0 && (
                  <div className="card-footer bg-white text-muted small">
                    <i className="bi bi-info-circle me-1"></i>
                    Enrolled students have access to all <strong>{exams.length}</strong> exam(s) in this course.
                    Removing a student only unenrolls them — their account is not deleted.
                  </div>
                )}
              </div>
            )}

          </div>{/* /tab content */}
        </div>{/* /main */}
      </div>{/* /layout */}

      {/* ── Add Student Modal ── */}
      <AddStudentModal
        show={showAddModal}
        course={course}
        onHide={() => setShowAddModal(false)}
        onSuccess={handleStudentAdded}
      />
    </div>
  );
};

/* ════════════════════════════════════════════
   ADD STUDENT MODAL
════════════════════════════════════════════ */
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
      Swal.fire("Oops!", "Please select a student from the list.", "warning");
      return;
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
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onHide(); }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 500 }}>
        <div className="modal-content">

          <div className="modal-header border-0 pb-0">
            <div>
              <h5 className="modal-title fw-bold">
                <i className="bi bi-person-plus me-2 text-success"></i>Add Student
              </h5>
              <small className="text-muted d-block mt-1">
                <i className="bi bi-folder2 text-primary me-1"></i>
                Enrolling into <strong className="text-primary">{course.code} — {course.name}</strong>
              </small>
            </div>
            <button type="button" className="btn-close" onClick={onHide} disabled={submitting} />
          </div>

          <div className="px-3 pt-3">
            <div className="btn-group w-100">
              <button type="button"
                className={`btn ${mode === "existing" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setMode("existing")} disabled={submitting}>
                <i className="bi bi-search me-2"></i>Enroll Existing
              </button>
              <button type="button"
                className={`btn ${mode === "new" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setMode("new")} disabled={submitting}>
                <i className="bi bi-person-add me-2"></i>Create New
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">

              {mode === "existing" && (
                <div>
                  <p className="text-muted small mb-3">Search by name or email to find an existing student account.</p>
                  <label className="form-label fw-semibold">Search Student <span className="text-danger">*</span></label>
                  <div className="position-relative">
                    <div className="input-group">
                      <span className="input-group-text">
                        {searching ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-search"></i>}
                      </span>
                      <input type="text" className="form-control" autoComplete="off"
                        placeholder="Type name or email (min. 2 chars)…"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setSelectedStudent(null); }}
                        disabled={submitting} />
                      {searchQuery && (
                        <button type="button" className="btn btn-outline-secondary"
                          onClick={() => { setSearchQuery(""); setSelectedStudent(null); setSearchResults([]); }}>
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>
                    {searchResults.length > 0 && (
                      <div className="position-absolute w-100 bg-white border rounded shadow-sm"
                        style={{ top: "100%", zIndex: 1050, maxHeight: 220, overflowY: "auto" }}>
                        {searchResults.map((s) => (
                          <button key={s.id} type="button"
                            className="d-flex align-items-center gap-3 w-100 px-3 py-2 border-0 bg-transparent text-start"
                            onMouseEnter={(e) => e.currentTarget.classList.add("bg-light")}
                            onMouseLeave={(e) => e.currentTarget.classList.remove("bg-light")}
                            onClick={() => handleSelect(s)}>
                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                              style={{ width: 34, height: 34, fontSize: 13 }}>
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-semibold small">{s.name}</div>
                              <div className="text-muted" style={{ fontSize: 11 }}>{s.email}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && !selectedStudent && (
                      <div className="text-muted small mt-2">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        No accounts found.{" "}
                        <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setMode("new")}>
                          Create a new student instead
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedStudent && (
                    <div className="alert alert-success d-flex align-items-center gap-3 mt-3 py-2 mb-0">
                      <i className="bi bi-check-circle-fill fs-5 text-success"></i>
                      <div>
                        <div className="fw-semibold small">{selectedStudent.name}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{selectedStudent.email}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mode === "new" && (
                <div>
                  <div className="alert alert-info py-2 small mb-3">
                    <i className="bi bi-info-circle me-1"></i>
                    A new account will be created and automatically enrolled in <strong>{course.code}</strong>.
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Full Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" placeholder="e.g., Juan dela Cruz"
                      value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                      required disabled={submitting} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email Address <span className="text-danger">*</span></label>
                    <input type="email" className="form-control" placeholder="e.g., student@university.edu"
                      value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                      required disabled={submitting} />
                  </div>
                  <div className="mb-0">
                    <label className="form-label fw-semibold">Temporary Password <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input type={showPassword ? "text" : "password"} className="form-control"
                        placeholder="Min. 8 characters"
                        value={newForm.password} onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                        required minLength={8} disabled={submitting} />
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword((v) => !v)}>
                        <i className={`bi bi-eye${showPassword ? "-slash" : ""}`}></i>
                      </button>
                    </div>
                    <div className="form-text">Share this password with the student.</div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-light" onClick={onHide} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-success px-4" disabled={submitting}>
                {submitting
                  ? <><span className="spinner-border spinner-border-sm me-2" />Enrolling…</>
                  : <><i className="bi bi-person-check me-2"></i>{mode === "new" ? "Create & Enroll" : "Enroll Student"}</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;