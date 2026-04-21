// src/pages/instructor/Students.jsx
import React, { useState, useEffect, useMemo } from "react";
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
  // { to: "/instructor/reports",          icon: "bi-bar-chart",            label: "Reports"   },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

const Students = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* ── Data state ── */
  const [user,     setUser]     = useState(null);
  const [courses,  setCourses]  = useState([]);
  const [students, setStudents] = useState([]); // flat: { ...student, courseId, courseName, courseCode }
  const [loading,  setLoading]  = useState(true);

  /* ── Filter / sort state ── */
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [searchTerm,     setSearchTerm]     = useState("");
  const [sortField,      setSortField]      = useState("name");
  const [sortDir,        setSortDir]        = useState("asc");

  /* ── Active sidebar helper ── */
  const isActive = (to) =>
    to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

  /* ════════════════════════════════════════
     Fetch
  ════════════════════════════════════════ */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [userRes, coursesRes] = await Promise.all([
          API.get("/me"),
          API.get("/courses"),
        ]);
        setUser(userRes.data.user);
        const courseList = coursesRes.data.courses || [];
        setCourses(courseList);

        const studentResults = await Promise.all(
          courseList.map((course) =>
            API.get(`/courses/${course.id}/students`)
              .then((res) =>
                (res.data.students || []).map((s) => ({
                  ...s,
                  courseId:   course.id,
                  courseName: course.name,
                  courseCode: course.code,
                }))
              )
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

  /* ── Remove student ── */
  const handleRemove = async (student) => {
    const result = await Swal.fire({
      title: `Remove ${student.name}?`,
      text: `This will unenroll them from ${student.courseCode}. Their account won't be deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/courses/${student.courseId}/students/${student.id}`);
      setStudents((prev) =>
        prev.filter((s) => !(s.id === student.id && s.courseId === student.courseId))
      );
      Swal.fire({ icon: "success", title: "Removed!", text: `${student.name} unenrolled from ${student.courseCode}.`, timer: 1600, showConfirmButton: false });
    } catch {
      Swal.fire("Error!", "Failed to remove student.", "error");
    }
  };

  /* ── Logout ── */
  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/");
  };

  /* ── Derived: filtered + sorted ── */
  const filtered = useMemo(() => {
    let list = [...students];
    if (selectedCourse !== "all") {
      list = list.filter((s) => String(s.courseId) === String(selectedCourse));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.courseCode.toLowerCase().includes(q) ||
          s.courseName.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let aVal = a[sortField] ?? "";
      let bVal = b[sortField] ?? "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [students, selectedCourse, searchTerm, sortField, sortDir]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const base = selectedCourse === "all"
      ? students
      : students.filter((s) => String(s.courseId) === String(selectedCourse));
    return {
      total:  base.length,
      unique: new Set(base.map((s) => s.id)).size,
    };
  }, [students, selectedCourse]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) =>
    sortField !== field
      ? <i className="bi bi-chevron-expand text-muted ms-1" style={{ fontSize: 11 }}></i>
      : sortDir === "asc"
        ? <i className="bi bi-chevron-up ms-1 text-primary" style={{ fontSize: 11 }}></i>
        : <i className="bi bi-chevron-down ms-1 text-primary" style={{ fontSize: 11 }}></i>;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div className="d-flex flex-column min-vh-100">

      {/* ── Navbar ── */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold text-primary" href="#">SECT Instructor</a>
          <div className="d-flex align-items-center gap-3 ms-auto">
            {/* Inline search in navbar */}
            <div className="input-group input-group-sm" style={{ width: 260 }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                className="form-control border-start-0"
                type="search"
                placeholder="Search students…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <InstructorAlertBell />
            <div className="dropdown">
              <button className="btn btn-light dropdown-toggle fw-bold" type="button" data-bs-toggle="dropdown">
                <i className="bi bi-person-circle me-2"></i>{user?.name || "Instructor"}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><Link className="dropdown-item" to="/instructor/account-settings"><i className="bi bi-gear me-2"></i>Account Settings</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile"><i className="bi bi-person me-2"></i>Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </button>
                </li>
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

        {/* ── Main Content ── */}
        <div className="flex-grow-1 p-4 bg-light">

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-0 fw-bold">Student Management</h4>
              <p className="text-muted mb-0 small">
                Enrolled students across your {courses.length} course{courses.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Link to="/instructor/courses" className="btn btn-outline-primary btn-sm">
              <i className="bi bi-person-plus me-2"></i>Enroll via Courses
            </Link>
          </div>

          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            {[
              { label: "Total Enrollments", value: stats.total,          color: "primary", icon: "bi-person-check", sub: selectedCourse === "all" ? "Across all courses" : "In selected course" },
              { label: "Unique Students",   value: stats.unique,         color: "success", icon: "bi-people",        sub: "Individual accounts" },
              { label: "Your Courses",      value: courses.length,       color: "info",    icon: "bi-book",          sub: "Active courses"      },
              { label: "Showing Now",       value: filtered.length,      color: "secondary",icon: "bi-funnel",       sub: "After filters"       },
            ].map(({ label, value, color, icon, sub }) => (
              <div key={label} className="col-md-3">
                <div className={`card shadow-sm border-0 border-start border-${color} border-4`}>
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className={`bi ${icon} text-${color}`}></i>
                      <h6 className="card-title text-muted mb-0 small">{label}</h6>
                    </div>
                    <p className={`card-text display-6 fw-bold text-${color} mb-0`}>{value}</p>
                    <small className={`text-${color}`}>{sub}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters Row */}
          <div className="card shadow-sm border-0 mb-3">
            <div className="card-body py-3">
              <div className="row g-3 align-items-end">
                <div className="col-md-5">
                  <label className="form-label small fw-semibold text-muted mb-1">
                    <i className="bi bi-book me-1"></i>Filter by Course
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <option value="all">All Courses ({students.length} enrollments)</option>
                    {courses.map((c) => {
                      const count = students.filter((s) => s.courseId === c.id).length;
                      return (
                        <option key={c.id} value={c.id}>
                          {c.code} – {c.name} ({count} student{count !== 1 ? "s" : ""})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-muted mb-1">
                    <i className="bi bi-sort-alpha-down me-1"></i>Sort by
                  </label>
                  <div className="input-group input-group-sm">
                    <select
                      className="form-select"
                      value={sortField}
                      onChange={(e) => { setSortField(e.target.value); setSortDir("asc"); }}
                    >
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="courseCode">Course</option>
                      <option value="enrolled_at">Enrolled Date</option>
                    </select>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                      title={sortDir === "asc" ? "Ascending" : "Descending"}
                    >
                      <i className={`bi bi-sort-${sortDir === "asc" ? "up" : "down"}`}></i>
                    </button>
                  </div>
                </div>
                <div className="col-md-3">
                  {(selectedCourse !== "all" || searchTerm) && (
                    <button
                      className="btn btn-sm btn-outline-secondary w-100"
                      onClick={() => { setSelectedCourse("all"); setSearchTerm(""); }}
                    >
                      <i className="bi bi-x-circle me-1"></i>Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-semibold">
                <i className="bi bi-people me-2 text-primary"></i>
                Student List
                {selectedCourse !== "all" && (
                  <span className="badge bg-primary ms-2">
                    {courses.find((c) => String(c.id) === String(selectedCourse))?.code}
                  </span>
                )}
              </h6>
              <small className="text-muted">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</small>
            </div>

            <div className="card-body p-0">
              {filtered.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-people fs-1 d-block mb-2 opacity-25"></i>
                  <p className="mb-0 fw-semibold">
                    {students.length === 0
                      ? "No students enrolled in any of your courses yet."
                      : "No students match your current filters."}
                  </p>
                  {students.length === 0 && (
                    <Link to="/instructor/courses" className="btn btn-primary btn-sm mt-3">
                      <i className="bi bi-person-plus me-1"></i>Enroll Students via Courses
                    </Link>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
                          NAME <SortIcon field="name" />
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("email")}>
                          EMAIL <SortIcon field="email" />
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("courseCode")}>
                          COURSE <SortIcon field="courseCode" />
                        </th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("enrolled_at")}>
                          ENROLLED <SortIcon field="enrolled_at" />
                        </th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((student, index) => (
                        <tr key={`${student.id}-${student.courseId}`}>
                          <td className="text-muted align-middle">{index + 1}</td>
                          <td className="align-middle">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0 fw-semibold"
                                style={{ width: 32, height: 32, fontSize: 13 }}
                              >
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="fw-semibold">{student.name}</span>
                            </div>
                          </td>
                          <td className="text-muted align-middle">{student.email}</td>
                          <td className="align-middle">
                            <Link to={`/instructor/courses/${student.courseId}`} className="text-decoration-none">
                              <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-semibold">
                                {student.courseCode}
                              </span>
                              <span className="text-muted small ms-2 d-none d-xl-inline">
                                {student.courseName}
                              </span>
                            </Link>
                          </td>
                          <td className="text-muted small align-middle">
                            {student.enrolled_at
                              ? new Date(student.enrolled_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                              : "—"}
                          </td>
                          <td className="align-middle">
                            <div className="btn-group btn-group-sm">
                              <Link
                                to={`/instructor/courses/${student.courseId}`}
                                className="btn btn-outline-primary"
                                title="View in Course"
                              >
                                <i className="bi bi-eye"></i>
                              </Link>
                              <button
                                className="btn btn-outline-danger"
                                title="Remove from course"
                                onClick={() => handleRemove(student)}
                              >
                                <i className="bi bi-person-dash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {filtered.length > 0 && (
              <div className="card-footer bg-white text-muted small">
                <i className="bi bi-info-circle me-1"></i>
                Showing {filtered.length} enrollment{filtered.length !== 1 ? "s" : ""}.
                Removing a student unenrolls them from the course — it does not delete their account.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Students;