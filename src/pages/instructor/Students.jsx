import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";

const Students = () => {
  const navigate = useNavigate();

  // ── Data state ──
  const [user, setUser]       = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]); // flat list: { ...student, courseId, courseName, courseCode }
  const [loading, setLoading]   = useState(true);

  // ── Filter / sort state ──
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [searchTerm, setSearchTerm]         = useState("");
  const [sortField, setSortField]           = useState("name");
  const [sortDir, setSortDir]               = useState("asc");

  /* ════════════════════════════════════════
     Fetch user → courses → students per course
  ════════════════════════════════════════ */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1. current user
        const userRes = await API.get("/me");
        setUser(userRes.data.user);

        // 2. instructor's courses
        const coursesRes = await API.get("/courses");
        const courseList = coursesRes.data.courses || [];
        setCourses(courseList);

        // 3. enrolled students for every course (parallel)
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
              .catch(() => []) // skip if a course fetch fails
          )
        );

        // Flatten + deduplicate by student id + courseId pair
        const flat = studentResults.flat();
        setStudents(flat);
      } catch (err) {
        console.error("Failed to load students:", err);
        Swal.fire("Error!", "Failed to load student data.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  /* ════════════════════════════════════════
     Remove (unenroll) a student
  ════════════════════════════════════════ */
  const handleRemove = async (student) => {
    const result = await Swal.fire({
      title: `Remove ${student.name}?`,
      text: `This will unenroll them from ${student.courseCode}. Their account won't be deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove!",
    });
    if (!result.isConfirmed) return;

    try {
      await API.delete(`/courses/${student.courseId}/students/${student.id}`);
      setStudents((prev) =>
        prev.filter((s) => !(s.id === student.id && s.courseId === student.courseId))
      );
      Swal.fire("Removed!", `${student.name} has been unenrolled from ${student.courseCode}.`, "success");
    } catch {
      Swal.fire("Error!", "Failed to remove student.", "error");
    }
  };

  /* ════════════════════════════════════════
     Derived: filtered + sorted list
  ════════════════════════════════════════ */
  const filtered = useMemo(() => {
    let list = [...students];

    // Course filter
    if (selectedCourse !== "all") {
      list = list.filter((s) => String(s.courseId) === String(selectedCourse));
    }

    // Search
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

    // Sort
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

  /* ── Summary counts ── */
  const stats = useMemo(() => {
    const base = selectedCourse === "all"
      ? students
      : students.filter((s) => String(s.courseId) === String(selectedCourse));

    // unique students by id
    const uniqueIds = new Set(base.map((s) => s.id));
    return { total: base.length, unique: uniqueIds.size };
  }, [students, selectedCourse]);

  /* ── Sort toggle ── */
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <i className="bi bi-chevron-expand text-muted ms-1" style={{ fontSize: 11 }}></i>;
    return sortDir === "asc"
      ? <i className="bi bi-chevron-up ms-1 text-primary" style={{ fontSize: 11 }}></i>
      : <i className="bi bi-chevron-down ms-1 text-primary" style={{ fontSize: 11 }}></i>;
  };

  /* ════════════════════════════════════════
     Loading
  ════════════════════════════════════════ */
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
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold text-primary" href="#">SECT Instructor</a>

          <form className="d-flex mx-auto" style={{ width: "40%" }} onSubmit={(e) => e.preventDefault()}>
            <input
              className="form-control"
              type="search"
              placeholder="Search students, courses…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          <div className="dropdown">
            <button
              className="btn btn-light dropdown-toggle d-flex align-items-center"
              type="button"
              data-bs-toggle="dropdown"
            >
              <span className="me-2 fw-bold">Welcome, {user?.name || "Instructor"}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><Link className="dropdown-item" to="/instructor/account-settings">Account Settings</Link></li>
              <li><Link className="dropdown-item" to="/instructor/profile">Profile</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={async () => {
                    try { await API.post("/logout"); } catch {}
                    localStorage.removeItem("user");
                    navigate("/");
                  }}
                  style={{ cursor: "pointer", border: "none", background: "none", width: "100%", textAlign: "left" }}
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="d-flex flex-grow-1">

        {/* ── Sidebar ── */}
        <nav className="text-black d-flex justify-content-center" style={{ width: "110px", minHeight: "100%" }}>
          <ul className="nav flex-column p-3 align-items-center">
            <li className="nav-item mb-3">
              <Link className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3" to="/instructor">
                <i className="bi bi-speedometer2 fs-4 mb-1"></i>
                <span>Dashboard</span>
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3" to="/instructor/exams">
                <i className="bi bi-file-earmark-text fs-3 mb-1"></i>
                <span>Exams</span>
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link className="nav-link text-white active bg-primary rounded fs-6 fw-semibold d-flex flex-column align-items-center py-3" to="/instructor/students">
                <i className="bi bi-people fs-3 mb-1"></i>
                <span>Students</span>
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3" to="/instructor/alerts">
                <i className="bi bi-exclamation-triangle fs-3 mb-1"></i>
                <span>Alerts</span>
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3" to="/instructor/reports">
                <i className="bi bi-bar-chart fs-3 mb-1"></i>
                <span>Reports</span>
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3" to="/instructor/account-settings">
                <i className="bi bi-gear fs-3 mb-1"></i>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* ── Main Content ── */}
        <div className="flex-grow-1 p-4 bg-light">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-0">Student Management</h4>
              <small className="text-muted">
                Students enrolled across your {courses.length} course{courses.length !== 1 ? "s" : ""}
              </small>
            </div>
            <Link to="/instructor/exams" className="btn btn-outline-primary btn-sm">
              <i className="bi bi-person-plus me-2"></i>Enroll Student via Course
            </Link>
          </div>

          {/* ── Summary Cards ── */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Total Enrollments</h6>
                  <p className="card-text display-6 fw-bold text-primary">{stats.total}</p>
                  <small className="text-muted">
                    {selectedCourse === "all" ? "Across all courses" : "In selected course"}
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Unique Students</h6>
                  <p className="card-text display-6 fw-bold text-success">{stats.unique}</p>
                  <small className="text-muted">Individual accounts</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Your Courses</h6>
                  <p className="card-text display-6 fw-bold text-info">{courses.length}</p>
                  <small className="text-muted">Active courses</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Showing</h6>
                  <p className="card-text display-6 fw-bold text-secondary">{filtered.length}</p>
                  <small className="text-muted">After filters</small>
                </div>
              </div>
            </div>
          </div>

          {/* ── Filters Row ── */}
          <div className="card shadow-sm border-0 mb-3">
            <div className="card-body py-3">
              <div className="row g-3 align-items-center">

                {/* Course filter */}
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

                {/* Sort field */}
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

                {/* Clear filters */}
                <div className="col-md-3 d-flex align-items-end">
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

          {/* ── Students Table ── */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-semibold">
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
                  <i className="bi bi-people fs-1 d-block mb-2"></i>
                  {students.length === 0
                    ? "No students enrolled in any of your courses yet."
                    : "No students match your current filters."}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th
                          style={{ cursor: "pointer", userSelect: "none" }}
                          onClick={() => handleSort("name")}
                        >
                          NAME <SortIcon field="name" />
                        </th>
                        <th
                          style={{ cursor: "pointer", userSelect: "none" }}
                          onClick={() => handleSort("email")}
                        >
                          EMAIL <SortIcon field="email" />
                        </th>
                        <th
                          style={{ cursor: "pointer", userSelect: "none" }}
                          onClick={() => handleSort("courseCode")}
                        >
                          COURSE <SortIcon field="courseCode" />
                        </th>
                        <th
                          style={{ cursor: "pointer", userSelect: "none" }}
                          onClick={() => handleSort("enrolled_at")}
                        >
                          ENROLLED <SortIcon field="enrolled_at" />
                        </th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((student, index) => (
                        <tr key={`${student.id}-${student.courseId}`}>
                          <td className="text-muted">{index + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: 32, height: 32, fontSize: 13 }}
                              >
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="fw-semibold">{student.name}</span>
                            </div>
                          </td>
                          <td className="text-muted">{student.email}</td>
                          <td>
                            <Link
                              to={`/instructor/courses/${student.courseId}`}
                              className="text-decoration-none"
                            >
                              <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-semibold">
                                {student.courseCode}
                              </span>
                              <span className="text-muted small ms-2 d-none d-xl-inline">
                                {student.courseName}
                              </span>
                            </Link>
                          </td>
                          <td className="text-muted small">
                            {student.enrolled_at
                              ? new Date(student.enrolled_at).toLocaleDateString("en-US", {
                                  year: "numeric", month: "short", day: "numeric",
                                })
                              : "—"}
                          </td>
                          <td>
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