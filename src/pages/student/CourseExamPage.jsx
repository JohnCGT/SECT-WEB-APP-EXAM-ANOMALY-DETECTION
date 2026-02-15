import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../../api";

const CourseExamsPage = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();

  const [user, setUser]     = useState(null);
  const [course, setCourse] = useState(null);
  const [exams, setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [userRes, courseRes, examsRes] = await Promise.all([
          API.get("/me"),
          API.get(`/student/courses/${courseId}`),
          API.get(`/student/courses/${courseId}/exams`),
        ]);
        setUser(userRes.data.user);
        setCourse(courseRes.data.course);
        setExams(examsRes.data.exams || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load exams.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [courseId]);

  const getStatusBadge = (exam) => {
    if (exam.submission?.status === "submitted") return { cls: "bg-success", label: "Submitted" };
    const now = new Date();
    if (new Date(exam.end_time) < now)   return { cls: "bg-secondary", label: "Ended" };
    if (new Date(exam.start_time) > now) return { cls: "bg-warning text-dark", label: "Upcoming" };
    return { cls: "bg-primary", label: "Open" };
  };

  const canTake = (exam) => {
    if (exam.submission?.status === "submitted") return false;
    const now = new Date();
    return new Date(exam.start_time) <= now && new Date(exam.end_time) >= now;
  };

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  const initial = user?.name?.charAt(0)?.toUpperCase() || "S";

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold text-primary">🎓 SECT Student Portal</span>
          <div className="dropdown ms-auto">
            <button className="btn btn-light rounded-pill px-3 d-flex align-items-center gap-2 shadow-sm" data-bs-toggle="dropdown">
              <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                {initial}
              </span>
              <span className="fw-semibold">{user?.name?.split(" ")[0] || "Student"}</span>
              <i className="bi bi-chevron-down small"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
              <li><Link className="dropdown-item" to="/student/profile">My Profile</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger" onClick={handleLogout}
                  style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>
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
                <i className="bi bi-speedometer2 fs-4 mb-1"></i><span>Home</span>
              </Link>
            </li>
            <li className="nav-item w-100">
              <Link to="/student/subjects" className="nav-link active bg-primary text-white rounded-4 fw-semibold d-flex flex-column align-items-center py-3 shadow-sm">
                <i className="bi bi-journal-bookmark fs-4 mb-1"></i><span>Subjects</span>
              </Link>
            </li>
            <li className="nav-item w-100">
              <Link to="/student/tasks" className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4">
                <i className="bi bi-pencil-square fs-4 mb-1"></i><span>Tasks</span>
              </Link>
            </li>
            <li className="nav-item w-100">
              <Link to="/student/grades" className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4">
                <i className="bi bi-graph-up-arrow fs-4 mb-1"></i><span>Grades</span>
              </Link>
            </li>
            <li className="nav-item w-100">
              <Link to="/student/account-settings" className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4">
                <i className="bi bi-gear fs-4 mb-1"></i><span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main */}
        <div className="flex-grow-1 p-4">
          <div className="mb-4">
            <Link to="/student/subjects" className="btn btn-outline-secondary btn-sm mb-3">
              <i className="bi bi-arrow-left me-2"></i>Back to Subjects
            </Link>
            {course && (
              <>
                <h4 className="fw-bold mb-1">{course.code} – {course.name}</h4>
                <small className="text-muted">
                  {course.instructor?.name && `Instructor: ${course.instructor.name} · `}
                  {exams.length} exam{exams.length !== 1 ? "s" : ""}
                </small>
              </>
            )}
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {exams.length === 0 && !error ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-file-earmark-x fs-1 d-block mb-3"></i>
              <h6 className="fw-bold">No exams available yet</h6>
              <p className="small">Your instructor hasn't published any exams for this course.</p>
            </div>
          ) : (
            <div className="row g-4">
              {exams.map((exam) => {
                const badge   = getStatusBadge(exam);
                const takable = canTake(exam);
                const done    = exam.submission?.status === "submitted";
                const pct     = done && exam.submission.total_points > 0
                  ? Math.round((exam.submission.score / exam.submission.total_points) * 100)
                  : null;

                return (
                  <div key={exam.id} className="col-md-6 col-lg-4">
                    <div className={`card border-0 shadow-sm rounded-4 h-100 ${done ? "border-start border-success border-3" : ""}`}>
                      <div className="card-body d-flex flex-column p-4">

                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <span className={`badge ${badge.cls} rounded-pill`}>{badge.label}</span>
                          <span className="badge bg-secondary-subtle text-secondary text-capitalize">
                            {exam.type}
                          </span>
                        </div>

                        <h6 className="fw-bold mb-1">{exam.title}</h6>
                        {exam.description && (
                          <p className="small text-muted mb-3">{exam.description}</p>
                        )}

                        <div className="mt-auto">
                          <div className="row g-2 text-center mb-3">
                            <div className="col-4">
                              <div className="bg-light rounded-3 p-2">
                                <div className="fw-bold small">{exam.questions_count}</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>Questions</div>
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="bg-light rounded-3 p-2">
                                <div className="fw-bold small">{exam.duration_minutes}m</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>Duration</div>
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="bg-light rounded-3 p-2">
                                <div className="fw-bold small">{exam.total_points}</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>Points</div>
                              </div>
                            </div>
                          </div>

                          <div className="small text-muted mb-3">
                            <i className="bi bi-calendar3 me-1"></i>
                            {new Date(exam.start_time).toLocaleString()} –{" "}
                            {new Date(exam.end_time).toLocaleString()}
                          </div>

                          {/* Score bar if submitted */}
                          {done && (
                            <div className="mb-3">
                              <div className="d-flex justify-content-between small mb-1">
                                <span className="text-muted">Your Score</span>
                                <span className="fw-bold text-success">
                                  {exam.submission.score}/{exam.submission.total_points} ({pct}%)
                                </span>
                              </div>
                              <div className="progress" style={{ height: 6 }}>
                                <div
                                  className={`progress-bar ${pct >= 75 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-danger"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="d-grid gap-2">
                            {takable && (
                              <Link
                                to={`/student/exams/${exam.id}/take`}
                                className="btn btn-primary rounded-pill"
                              >
                                <i className="bi bi-pencil-square me-2"></i>Take Exam
                              </Link>
                            )}
                            {done && (
                              <Link
                                to={`/student/exams/${exam.id}/results`}
                                className="btn btn-outline-success rounded-pill"
                              >
                                <i className="bi bi-bar-chart me-2"></i>View Results
                              </Link>
                            )}
                            {!takable && !done && (
                              <button className="btn btn-outline-secondary rounded-pill" disabled>
                                {new Date(exam.start_time) > new Date()
                                  ? <><i className="bi bi-clock me-2"></i>Not Started Yet</>
                                  : <><i className="bi bi-lock me-2"></i>Exam Ended</>}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseExamsPage;