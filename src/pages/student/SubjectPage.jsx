import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";

const CARD_THEMES = [
  { bg: "linear-gradient(135deg, #eef2ff, #ffffff)", icon: "bi-code-slash",       color: "text-primary", badge: "bg-primary-subtle text-primary" },
  { bg: "linear-gradient(135deg, #fff7ed, #ffffff)", icon: "bi-database",          color: "text-warning", badge: "bg-warning-subtle text-warning" },
  { bg: "linear-gradient(135deg, #fdf2f8, #ffffff)", icon: "bi-palette",           color: "text-danger",  badge: "bg-danger-subtle text-danger"   },
  { bg: "linear-gradient(135deg, #f0fdf4, #ffffff)", icon: "bi-journal-text",      color: "text-success", badge: "bg-success-subtle text-success"  },
  { bg: "linear-gradient(135deg, #fef9c3, #ffffff)", icon: "bi-lightning-charge",  color: "text-warning", badge: "bg-warning-subtle text-warning"  },
  { bg: "linear-gradient(135deg, #f0f9ff, #ffffff)", icon: "bi-globe",             color: "text-info",    badge: "bg-info-subtle text-info"        },
];
const getTheme = (i) => CARD_THEMES[i % CARD_THEMES.length];

const SubjectPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]   = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser]             = useState(null);
  const [courses, setCourses]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Step 1: get current user
        const userRes = await API.get("/me");
        setUser(userRes.data.user);

        // Step 2: get enrolled courses
        const coursesRes = await API.get("/student/courses");
        setCourses(coursesRes.data.courses || []);
      } catch (err) {
        console.error("SubjectPage fetch error:", err);

        // Show the real server message so it's easy to debug
        const serverMsg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unknown error";

        setError(`Failed to load courses: ${serverMsg} (status ${err.response?.status ?? "network error"})`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let list = [...courses];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.instructor?.name || "").toLowerCase().includes(q)
      );
    }

    if (activeTab === "completed" || activeTab === "archived") return [];
    return list;
  }, [courses, searchTerm, activeTab]);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() || "S";

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">

      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold text-primary d-flex align-items-center gap-2">
            🎓 SECT Student Portal
          </span>

          <form className="d-flex mx-auto" style={{ width: "38%" }} onSubmit={(e) => e.preventDefault()}>
            <input
              className="form-control rounded-pill px-4"
              type="search"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          <div className="dropdown">
            <button
              className="btn btn-light rounded-pill px-3 d-flex align-items-center gap-2 shadow-sm"
              data-bs-toggle="dropdown"
            >
              <span
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32 }}
              >
                {initial}
              </span>
              <span className="fw-semibold">{user?.name?.split(" ")[0] || "Student"}</span>
              <i className="bi bi-chevron-down small"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
              <li><Link className="dropdown-item" to="/student/profile">My Profile</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button
                  className="dropdown-item text-danger"
                  onClick={handleLogout}
                  style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="d-flex flex-grow-1">

        {/* Sidebar */}
        <nav className="bg-white border-end shadow-sm" style={{ width: "110px", minHeight: "100%" }}>
          <ul className="nav flex-column p-3 align-items-center gap-2">
            <li className="nav-item w-100">
              <Link to="/student" className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4">
                <i className="bi bi-speedometer2 fs-4 mb-1"></i>
                <span>Home</span>
              </Link>
            </li>
            <li className="nav-item w-100">
              <Link to="/student/subjects" className="nav-link active bg-primary text-white rounded-4 fw-semibold d-flex flex-column align-items-center py-3 shadow-sm">
                <i className="bi bi-journal-bookmark fs-4 mb-1"></i>
                <span>Subjects</span>
              </Link>
            </li>
            <li className="nav-item mb-100">
              <Link className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3" to="/student/tasks">
                <i className="bi bi-pencil-square fs-3 mb-1"></i>
                <span>Tasks</span>
              </Link>
            </li>
            <li className="nav-item w-100">
              <Link className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4" to="/student/grades">
                <i className="bi bi-graph-up-arrow fs-4 mb-1"></i>
                <span>Grades</span>
              </Link>
            </li>
            <li className="nav-item w-100">
              <Link className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4" to="/student/account-settings">
                <i className="bi bi-gear fs-4 mb-1"></i>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main */}
        <div className="flex-grow-1 p-4">

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold mb-1">📚 My Subjects</h4>
              <small className="text-muted">
                {courses.length} course{courses.length !== 1 ? "s" : ""} enrolled
              </small>
            </div>
            <div className="d-flex gap-2">
              <input
                className="form-control form-control-sm rounded-pill px-3"
                style={{ width: 220 }}
                placeholder="Search curriculum..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Error with full details */}
          {error && (
            <div className="alert alert-danger d-flex align-items-start gap-2 mb-4">
              <i className="bi bi-exclamation-triangle-fill mt-1"></i>
              <div>
                <strong>Could not load courses</strong>
                <div className="small mt-1 font-monospace">{error}</div>
                <button
                  className="btn btn-sm btn-outline-danger mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="d-flex align-items-center gap-4 border-bottom mb-4">
            {["all", "progress", "completed", "archived"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`btn btn-sm btn-link fw-semibold text-decoration-none rounded-0 ${
                  activeTab === tab
                    ? "text-primary border-bottom border-2 border-primary"
                    : "text-muted"
                }`}
              >
                {tab === "all"       && "All Subjects"}
                {tab === "progress"  && "In Progress"}
                {tab === "completed" && "Completed"}
                {tab === "archived"  && "Archived"}
              </button>
            ))}
            <div className="ms-auto d-flex gap-2">
              <button className="btn btn-sm btn-light rounded-circle"><i className="bi bi-list"></i></button>
              <button className="btn btn-sm btn-light rounded-circle"><i className="bi bi-grid"></i></button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {(activeTab === "all" || activeTab === "progress") && !error && (
              <>
                {filtered.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-journal-x fs-1 d-block mb-3"></i>
                    <h6 className="fw-bold">
                      {searchTerm ? "No subjects match your search." : "You are not enrolled in any courses yet."}
                    </h6>
                    <p className="small mb-0">
                      {searchTerm ? "Try a different keyword." : "Contact your instructor to be added to a course."}
                    </p>
                  </div>
                ) : (
                  <div className="row g-4">
                    {filtered.map((course, index) => {
                      const theme     = getTheme(index);
                      const examCount = course.exams?.length || 0;

                      return (
                        <div key={course.id} className="col-md-6 col-lg-4 col-xl-3">
                          <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div
                              className="rounded-top-4 p-4 text-center position-relative"
                              style={{ background: theme.bg }}
                            >
                              <div
                                className="bg-white rounded-4 shadow-sm d-inline-flex align-items-center justify-content-center mb-2"
                                style={{ width: 52, height: 52 }}
                              >
                                <i className={`bi ${theme.icon} fs-3 ${theme.color}`}></i>
                              </div>
                              <span className={`badge ${theme.badge} position-absolute top-0 end-0 m-2`}>
                                {course.code}
                              </span>
                            </div>

                            <div className="card-body d-flex flex-column">
                              <span className="text-uppercase text-muted small fw-semibold">
                                {course.semester || "Current Semester"}
                              </span>
                              <h6 className="fw-bold mb-1 mt-1">{course.name}</h6>
                              <p className="small text-muted mb-3">
                                {course.description ||
                                  `${examCount} exam${examCount !== 1 ? "s" : ""} available in this course.`}
                              </p>

                              <div className="mt-auto">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                  <span className="badge bg-secondary-subtle text-secondary">
                                    <i className="bi bi-file-earmark-text me-1"></i>
                                    {examCount} exam{examCount !== 1 ? "s" : ""}
                                  </span>
                                  <span className="badge bg-secondary-subtle text-secondary">
                                    <i className="bi bi-star me-1"></i>
                                    {course.credits} cr
                                  </span>
                                </div>

                                <div className="d-flex justify-content-between align-items-center border-top pt-3">
                                  <div className="d-flex align-items-center gap-2">
                                    <div
                                      className="bg-secondary-subtle rounded-circle d-flex align-items-center justify-content-center"
                                      style={{ width: 26, height: 26 }}
                                    >
                                      <i className="bi bi-person-fill text-secondary"></i>
                                    </div>
                                    <small className="text-muted">
                                      {course.instructor?.name
                                        ? course.instructor.name.split(" ").slice(-1)[0]
                                        : "Instructor"}
                                    </small>
                                  </div>
                                  <Link
                                    to={`/student/courses/${course.id}/exams`}
                                    className="btn btn-sm btn-primary rounded-pill px-3"
                                  >
                                    <i className="bi bi-arrow-right me-1"></i>Exams
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === "completed" && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-patch-check fs-1 d-block mb-3"></i>
                <h6 className="fw-bold">No completed subjects yet</h6>
                <p className="small mb-0">Completed courses will appear here once grading is available.</p>
              </div>
            )}

            {activeTab === "archived" && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-archive fs-1 mb-3 d-block"></i>
                <h6 className="fw-bold">No archived subjects</h6>
                <p className="small mb-0">Archived subjects will appear here.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center border-top mt-4 pt-3">
            <small className="text-muted">
              Showing {filtered.length} subject{filtered.length !== 1 ? "s" : ""} based on selected filter
            </small>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-light rounded-pill" disabled>Previous</button>
              <button className="btn btn-sm btn-light rounded-pill">Next</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SubjectPage;
