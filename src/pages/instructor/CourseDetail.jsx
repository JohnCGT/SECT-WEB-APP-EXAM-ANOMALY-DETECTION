import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse]     = useState(null);
  const [exams, setExams]       = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("exams");

  const [showAddModal, setShowAddModal] = useState(false);

  /* ── Initial load ── */
  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      const [courseRes, studentsRes] = await Promise.all([
        API.get(`/courses/${id}`),
        API.get(`/courses/${id}/students`),
      ]);
      setCourse(courseRes.data.course);
      setExams(courseRes.data.course.exams || []);
      setStudents(studentsRes.data.students || []);
    } catch (err) {
      console.error("Failed to fetch course:", err);
      Swal.fire("Error!", "Failed to load course details.", "error");
      navigate("/instructor/exams");
    } finally {
      setLoading(false);
    }
  };

  /* ── Exam handlers ── */
  const handleDeleteExam = async (examId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;

    try {
      await API.delete(`/exams/${examId}`);
      setExams((prev) => prev.filter((e) => e.id !== examId));
      Swal.fire("Deleted!", "Exam has been deleted.", "success");
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
      text: "This will unenroll them from the course. Their account will not be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove!",
    });
    if (!result.isConfirmed) return;

    try {
      await API.delete(`/courses/${id}/students/${studentId}`);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      Swal.fire("Removed!", `${studentName} has been unenrolled.`, "success");
    } catch {
      Swal.fire("Error!", "Failed to remove student.", "error");
    }
  };

  /* ── Helpers ── */
  const getStatusBadge = (status) => {
    const map = {
      active:    "bg-success",
      scheduled: "bg-warning text-dark",
      completed: "bg-info",
      draft:     "bg-secondary",
    };
    return map[status] || "bg-secondary";
  };

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

  return (
    <div className="container-fluid p-4">

      {/* ── Back + Header ── */}
      <div className="mb-4">
        <Link to="/instructor/exams" className="btn btn-outline-secondary mb-3">
          <i className="bi bi-arrow-left me-2"></i>Back to Exams
        </Link>

        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <h3 className="mb-1">{course.code} – {course.name}</h3>
            {course.description && (
              <p className="text-muted mb-0">{course.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Course Info Card ── */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 text-center text-md-start">
            <div className="col-md-3">
              <small className="text-muted d-block">Course Code</small>
              <strong>{course.code}</strong>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Credits</small>
              <strong>{course.credits}</strong>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Semester</small>
              <strong>{course.semester || "N/A"}</strong>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Enrolled Students</small>
              <strong>{students.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <ul className="nav nav-tabs mb-0">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "exams" ? "active" : ""}`}
            onClick={() => setActiveTab("exams")}
          >
            <i className="bi bi-file-earmark-text me-2"></i>
            Exams
            <span className="badge bg-primary ms-2">{exams.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            <i className="bi bi-people me-2"></i>
            Students
            <span className="badge bg-primary ms-2">{students.length}</span>
          </button>
        </li>
      </ul>

      {/* ════ EXAMS TAB ════ */}
      {activeTab === "exams" && (
        <div className="card border-0 shadow-sm rounded-0 rounded-bottom">
          <div className="card-header d-flex justify-content-between align-items-center bg-white border-bottom">
            <h6 className="mb-0 fw-semibold">Exams in this Course</h6>
          </div>
          <div className="card-body p-0">
            {exams.length === 0 ? (
              <div className="text-center text-muted py-5">
                <i className="bi bi-file-earmark-x fs-1 d-block mb-2"></i>
                No exams in this course yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>EXAM NAME</th>
                      <th>TYPE</th>
                      <th>START TIME</th>
                      <th>DURATION</th>
                      <th>QUESTIONS</th>
                      <th>POINTS</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((exam) => (
                      <tr key={exam.id}>
                        <td className="fw-semibold">{exam.title}</td>
                        <td>
                          <span className="badge bg-secondary text-capitalize">
                            {exam.type}
                          </span>
                        </td>
                        <td>{new Date(exam.start_time).toLocaleString()}</td>
                        <td>{exam.duration_minutes} min</td>
                        <td>{exam.questions_count || 0}</td>
                        <td>{exam.total_points}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(exam.status)}`}>
                            {exam.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/instructor/exams/${exam.id}`}
                            className="btn btn-sm btn-outline-primary me-1"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          <Link
                            to={`/instructor/exams/${exam.id}/edit`}
                            className="btn btn-sm btn-outline-secondary me-1"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteExam(exam.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
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
        <div className="card border-0 shadow-sm rounded-0 rounded-bottom">
          <div className="card-header d-flex justify-content-between align-items-center bg-white border-bottom">
            <h6 className="mb-0 fw-semibold">Enrolled Students</h6>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddModal(true)}
            >
              <i className="bi bi-person-plus me-2"></i>Add Student
            </button>
          </div>

          <div className="card-body p-0">
            {students.length === 0 ? (
              <div className="text-center text-muted py-5">
                <i className="bi bi-people fs-1 d-block mb-2"></i>
                No students enrolled yet. Click <strong>Add Student</strong> to get started.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>NAME</th>
                      <th>EMAIL</th>
                      <th>ENROLLED</th>
                      <th>EXAM ACCESS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id}>
                        <td className="text-muted">{index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                              style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0 }}
                            >
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="fw-semibold">{student.name}</span>
                          </div>
                        </td>
                        <td className="text-muted">{student.email}</td>
                        <td className="text-muted">
                          {student.enrolled_at
                            ? new Date(student.enrolled_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          <span className="badge bg-success">
                            <i className="bi bi-check-circle me-1"></i>
                            {exams.length} exam{exams.length !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveStudent(student.id, student.name)}
                            title="Remove from course"
                          >
                            <i className="bi bi-person-dash"></i>
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
              Removing a student only unenrolls them — it does not delete their account.
            </div>
          )}
        </div>
      )}

      {/* ── Add Student Modal ── */}
      <AddStudentModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        courseId={id}
        onSuccess={handleStudentAdded}
      />
    </div>
  );
};


/* ════════════════════════════════════════════
   ADD STUDENT MODAL
   Two modes: enroll an existing account  |  create a brand-new student
════════════════════════════════════════════ */
const AddStudentModal = ({ show, onHide, courseId, onSuccess }) => {
  const [mode, setMode] = useState("existing"); // "existing" | "new"
  const [submitting, setSubmitting] = useState(false);

  // Existing-student mode
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // New-student mode
  const [newForm, setNewForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  /* Reset everything when modal opens/closes */
  useEffect(() => {
    if (!show) {
      setMode("existing");
      setSearchQuery("");
      setSearchResults([]);
      setSelectedStudent(null);
      setNewForm({ name: "", email: "", password: "" });
      setShowPassword(false);
    }
  }, [show]);

  /* Live search for existing students */
  useEffect(() => {
    if (mode !== "existing") return;
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await API.get(`/students/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data.students || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, mode]);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchQuery(student.name);
    setSearchResults([]);
  };

  /* Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let payload;

      if (mode === "existing") {
        if (!selectedStudent) {
          Swal.fire("Oops!", "Please search and select a student from the list.", "warning");
          return;
        }
        payload = { mode: "existing", email: selectedStudent.email };
      } else {
        payload = {
          mode:      "new",
          name:      newForm.name,
          new_email: newForm.email,
          password:  newForm.password,
        };
      }

      const res = await API.post(`/courses/${courseId}/students`, payload);
      Swal.fire("Enrolled!", res.data.message, "success");
      onSuccess(res.data.student);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add student.";
      Swal.fire("Error!", msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onHide(); }}
    >
      <div className="modal-dialog modal-md">
        <div className="modal-content">

          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-person-plus me-2"></i>Add Student to Course
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onHide}
              disabled={submitting}
            ></button>
          </div>

          {/* Mode Toggle */}
          <div className="p-3 border-bottom bg-light">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn btn-sm ${mode === "existing" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setMode("existing")}
                disabled={submitting}
              >
                <i className="bi bi-search me-2"></i>Enroll Existing Student
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === "new" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setMode("new")}
                disabled={submitting}
              >
                <i className="bi bi-person-add me-2"></i>Create New Student
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">

              {/* ── Enroll Existing ── */}
              {mode === "existing" && (
                <div>
                  <p className="text-muted small mb-3">
                    Search for an existing student account by name or email address.
                  </p>
                  <label className="form-label fw-semibold">
                    Search Student <span className="text-danger">*</span>
                  </label>
                  <div className="position-relative">
                    <div className="input-group">
                      <span className="input-group-text">
                        {searching
                          ? <span className="spinner-border spinner-border-sm"></span>
                          : <i className="bi bi-search"></i>
                        }
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type name or email (min. 2 characters)…"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedStudent(null);
                        }}
                        disabled={submitting}
                        autoComplete="off"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedStudent(null);
                            setSearchResults([]);
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>

                    {/* Dropdown results */}
                    {searchResults.length > 0 && (
                      <div
                        className="position-absolute w-100 bg-white border rounded shadow-sm"
                        style={{ top: "100%", zIndex: 1050, maxHeight: 220, overflowY: "auto" }}
                      >
                        {searchResults.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="d-flex align-items-center gap-3 w-100 px-3 py-2 border-0 bg-transparent text-start"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={(e) => e.currentTarget.classList.add("bg-light")}
                            onMouseLeave={(e) => e.currentTarget.classList.remove("bg-light")}
                            onClick={() => handleSelectStudent(s)}
                          >
                            <div
                              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                              style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0 }}
                            >
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-semibold">{s.name}</div>
                              <div className="text-muted small">{s.email}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && !selectedStudent && (
                      <div className="text-muted small mt-2">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        No student accounts found. Try <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setMode("new")}>creating a new student</button> instead.
                      </div>
                    )}
                  </div>

                  {/* Selected student confirmation */}
                  {selectedStudent && (
                    <div className="alert alert-success mt-3 d-flex align-items-center gap-3 py-2">
                      <i className="bi bi-check-circle-fill fs-5"></i>
                      <div>
                        <div className="fw-semibold">{selectedStudent.name}</div>
                        <div className="small">{selectedStudent.email}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Create New Student ── */}
              {mode === "new" && (
                <div>
                  <div className="alert alert-info py-2 small mb-3">
                    <i className="bi bi-info-circle me-1"></i>
                    A new student account will be created and automatically enrolled in this course.
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Juan dela Cruz"
                      value={newForm.name}
                      onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g., student@university.edu"
                      value={newForm.email}
                      onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Temporary Password <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        placeholder="Min. 8 characters"
                        value={newForm.password}
                        onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                        required
                        minLength={8}
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        <i className={`bi bi-eye${showPassword ? "-slash" : ""}`}></i>
                      </button>
                    </div>
                    <div className="form-text">Share this temporary password with the student.</div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onHide}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Enrolling…
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-check me-2"></i>
                    {mode === "new" ? "Create & Enroll" : "Enroll Student"}
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default CourseDetail;