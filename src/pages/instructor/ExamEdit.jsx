// src/pages/instructor/ExamEdit.jsx
import React, { useState, useEffect } from "react";
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

const ExamEdit = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [courses, setCourses] = useState([]);
  const [exam,    setExam]    = useState(null);

  const [formData, setFormData] = useState({
    course_id:        "",
    title:            "",
    description:      "",
    type:             "quiz",
    start_time:       "",
    end_time:         "",
    duration_minutes: 60,
    status:           "draft",
  });

  /* ── Active sidebar helper ── */
  const isActive = (to) =>
    to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

  /* ── Boot ── */
  useEffect(() => {
    API.get("/me").then((r) => setUser(r.data.user)).catch(() => {});
    fetchData();
  }, [id]);

  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const y  = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, "0");
    const d  = String(date.getDate()).padStart(2, "0");
    const h  = String(date.getHours()).padStart(2, "0");
    const mi = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${mo}-${d}T${h}:${mi}`;
  };

  const fetchData = async () => {
    try {
      const [examRes, coursesRes] = await Promise.all([
        API.get(`/exams/${id}`),
        API.get("/courses"),
      ]);
      const e = examRes.data.exam;
      setExam(e);
      setCourses(coursesRes.data.courses || []);
      setFormData({
        course_id:        e.course_id,
        title:            e.title,
        description:      e.description || "",
        type:             e.type,
        start_time:       formatDateTimeLocal(e.start_time),
        end_time:         formatDateTimeLocal(e.end_time),
        duration_minutes: e.duration_minutes,
        status:           e.status,
      });
    } catch {
      Swal.fire("Error!", "Failed to load exam details.", "error");
      navigate("/instructor/exams");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put(`/exams/${id}`, formData);
      Swal.fire({ icon: "success", title: "Exam updated!", timer: 1400, showConfirmButton: false });
      navigate(`/instructor/exams/${id}`);
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.message || "Failed to update exam.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/instructor/login");
  };

  const setField = (key) => (e) =>
    setFormData((f) => ({ ...f, [key]: e.target.type === "number" ? Number(e.target.value) : e.target.value }));

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
        <div className="flex-grow-1 p-4 bg-light">

          {/* Breadcrumb + Header */}
          <nav aria-label="breadcrumb" className="mb-2">
            <ol className="breadcrumb mb-0 small">
              <li className="breadcrumb-item">
                <Link to="/instructor" className="text-decoration-none text-muted">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/instructor/exams" className="text-decoration-none text-muted">Exams</Link>
              </li>
              {exam && (
                <li className="breadcrumb-item">
                  <Link to={`/instructor/exams/${id}`} className="text-decoration-none text-muted">
                    {exam.title}
                  </Link>
                </li>
              )}
              <li className="breadcrumb-item active fw-semibold">Edit</li>
            </ol>
          </nav>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-0 fw-bold">Edit Exam</h4>
              <p className="text-muted mb-0 small">Update exam details and scheduling</p>
            </div>
            <Link to={`/instructor/exams/${id}`} className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-arrow-left me-2"></i>Back to Exam
            </Link>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-4">

              {/* Left column */}
              <div className="col-lg-8">

                {/* Basic Info */}
                <div className="card shadow-sm border-0 mb-4">
                  <div className="card-header bg-white">
                    <h6 className="mb-0 fw-semibold">
                      <i className="bi bi-info-circle me-2 text-primary"></i>Basic Information
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label fw-semibold small">Course <span className="text-danger">*</span></label>
                      <select className="form-select" value={formData.course_id} onChange={setField("course_id")} required>
                        <option value="">Select a course</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>{c.code} – {c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold small">Exam Title <span className="text-danger">*</span></label>
                      <input type="text" className="form-control"
                        value={formData.title} onChange={setField("title")}
                        placeholder="e.g., Midterm Examination" required />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold small">Description</label>
                      <textarea className="form-control" rows={3}
                        value={formData.description} onChange={setField("description")}
                        placeholder="Brief instructions or description for students…" />
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Exam Type <span className="text-danger">*</span></label>
                        <select className="form-select" value={formData.type} onChange={setField("type")} required>
                          <option value="quiz">Quiz</option>
                          <option value="prelim">Prelim</option>
                          <option value="midterm">Midterm</option>
                          <option value="final">Final</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Status <span className="text-danger">*</span></label>
                        <select className="form-select" value={formData.status} onChange={setField("status")} required>
                          <option value="draft">Draft</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scheduling */}
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white">
                    <h6 className="mb-0 fw-semibold">
                      <i className="bi bi-calendar-event me-2 text-primary"></i>Scheduling
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Start Time <span className="text-danger">*</span></label>
                        <input type="datetime-local" className="form-control"
                          value={formData.start_time} onChange={setField("start_time")} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">End Time <span className="text-danger">*</span></label>
                        <input type="datetime-local" className="form-control"
                          value={formData.end_time} onChange={setField("end_time")} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Duration (minutes) <span className="text-danger">*</span></label>
                        <div className="input-group">
                          <input type="number" className="form-control"
                            min={1} max={480}
                            value={formData.duration_minutes} onChange={setField("duration_minutes")} required />
                          <span className="input-group-text">min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column — summary + actions */}
              <div className="col-lg-4">
                <div className="card shadow-sm border-0 mb-3">
                  <div className="card-header bg-white">
                    <h6 className="mb-0 fw-semibold">
                      <i className="bi bi-eye me-2 text-primary"></i>Summary
                    </h6>
                  </div>
                  <div className="card-body">
                    <dl className="row mb-0 small">
                      <dt className="col-5 text-muted">Course</dt>
                      <dd className="col-7 fw-semibold">
                        {courses.find((c) => String(c.id) === String(formData.course_id))?.code || "—"}
                      </dd>

                      <dt className="col-5 text-muted">Type</dt>
                      <dd className="col-7 text-capitalize">{formData.type || "—"}</dd>

                      <dt className="col-5 text-muted">Status</dt>
                      <dd className="col-7">
                        {formData.status && (
                          <span className={`badge text-capitalize ${
                            formData.status === "active"    ? "bg-success" :
                            formData.status === "scheduled" ? "bg-warning text-dark" :
                            formData.status === "completed" ? "bg-info" : "bg-secondary"
                          }`}>{formData.status}</span>
                        )}
                      </dd>

                      <dt className="col-5 text-muted">Duration</dt>
                      <dd className="col-7">{formData.duration_minutes} min</dd>
                    </dl>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="card shadow-sm border-0">
                  <div className="card-body d-flex flex-column gap-2">
                    <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                      {saving
                        ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                        : <><i className="bi bi-check-lg me-2" />Save Changes</>}
                    </button>
                    <Link to={`/instructor/exams/${id}`} className="btn btn-outline-secondary w-100">
                      <i className="bi bi-x me-2"></i>Cancel
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExamEdit;