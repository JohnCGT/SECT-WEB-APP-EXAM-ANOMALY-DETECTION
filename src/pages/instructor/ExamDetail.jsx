import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  tab_switch:         "Tab Switching",
  keyboard_shortcut:  "Keyboard Shortcut",
  response_time:      "Response Time",
  keystroke_dynamics: "Keystroke Dynamics",
};

const SEVERITY_MAP = {
  high:   { badge: "bg-danger",            label: "High"   },
  medium: { badge: "bg-warning text-dark", label: "Medium" },
  low:    { badge: "bg-secondary",         label: "Low"    },
};

const FLAG_MAP = {
  flagged: { badge: "bg-danger",            label: "Flagged" },
  warning: { badge: "bg-warning text-dark", label: "Warning" },
  none:    { badge: "bg-success",           label: "Clear"   },
};

const getRiskColor = (score) => {
  if (score >= 50) return "text-danger";
  if (score >= 20) return "text-warning";
  return "text-success";
};

const MetadataSummary = ({ type, meta }) => {
  if (!meta) return <small className="text-muted">—</small>;
  switch (type) {
    case "tab_switch":
      return <small>Hidden {((meta.hidden_duration_ms ?? 0) / 1000).toFixed(1)}s · Switch #{meta.count_in_session}</small>;
    case "keyboard_shortcut":
      return <small><kbd>{meta.keys}</kbd></small>;
    case "response_time":
      return <small>{meta.direction === "too_fast" ? "⚡ Too fast" : "🐢 Too slow"} · z={meta.z_score} · {((meta.response_time_ms ?? 0) / 1000).toFixed(1)}s</small>;
    case "keystroke_dynamics":
      return <small>{meta.reason === "impossible_speed" ? "🚀 Impossible speed" : "📊 Deviation"} · {meta.wpm?.toFixed(0)} WPM</small>;
    default:
      return <small className="text-muted">—</small>;
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ExamDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  // Core exam data
  const [exam, setExam]           = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);

  // Tab state: "questions" | "anomalies"
  const [activeTab, setActiveTab] = useState("questions");

  // Anomaly data
  const [summaries, setSummaries]           = useState([]);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyLoaded, setAnomalyLoaded]   = useState(false);

  // Student detail drill-down
  const [detailData, setDetailData]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Question modal
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // ── Fetch exam ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchExamDetails();
  }, [id]);

  const fetchExamDetails = async () => {
    try {
      const res = await API.get(`/exams/${id}`);
      setExam(res.data.exam);
      setQuestions(res.data.exam.questions || []);
    } catch (err) {
      console.error("Failed to fetch exam:", err);
      Swal.fire("Error!", "Failed to load exam details", "error");
      navigate("/instructor/exams");
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch anomaly summaries (lazy — only when tab is clicked) ───────────
  useEffect(() => {
    if (activeTab === "anomalies" && !anomalyLoaded) {
      fetchAnomalySummaries();
    }
  }, [activeTab]);

  const fetchAnomalySummaries = async () => {
    setAnomalyLoading(true);
    try {
      const res = await API.get(`/exams/${id}/anomalies/summary`);
      setSummaries(res.data.summaries || []);
      setAnomalyLoaded(true);
    } catch (err) {
      console.error("Failed to fetch anomaly summaries:", err);
      Swal.fire("Error!", "Failed to load anomaly data.", "error");
    } finally {
      setAnomalyLoading(false);
    }
  };

  // ── Open student drill-down ─────────────────────────────────────────────
  const openStudentDetail = async (submissionId) => {
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await API.get(`/exams/${id}/submissions/${submissionId}/anomalies`);
      setDetailData(res.data);
    } catch (err) {
      Swal.fire("Error", "Could not load student detail.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Mark log reviewed ───────────────────────────────────────────────────
  const markReviewed = async (logId, reviewed) => {
    const { value: notes } = await Swal.fire({
      title:            reviewed ? "Mark as Reviewed" : "Reopen Log",
      input:            "textarea",
      inputLabel:       "Reviewer notes (optional)",
      inputPlaceholder: "Add your observations…",
      showCancelButton: true,
      confirmButtonText: reviewed ? "Mark Reviewed" : "Reopen",
    });
    if (notes === undefined) return;

    try {
      await API.patch(`/exams/${id}/anomalies/${logId}/review`, {
        reviewed,
        reviewer_notes: notes || null,
      });
      Swal.fire({ toast: true, position: "top-end", icon: "success",
        title: "Saved", showConfirmButton: false, timer: 2000 });

      // Refresh detail view
      if (detailData) openStudentDetail(detailData.submission.id);
    } catch {
      Swal.fire("Error", "Failed to save review.", "error");
    }
  };

  // ── Delete question ─────────────────────────────────────────────────────
  const handleDeleteQuestion = async (questionId) => {
    const result = await Swal.fire({
      title: "Delete this question?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;

    try {
      await API.delete(`/exams/${id}/questions/${questionId}`);
      setQuestions(questions.filter((q) => q.id !== questionId));
      Swal.fire("Deleted!", "Question has been deleted.", "success");
      fetchExamDetails();
    } catch {
      Swal.fire("Error!", "Failed to delete question.", "error");
    }
  };

  // ── Derived anomaly stats ───────────────────────────────────────────────
  const anomalyStats = {
    flagged: summaries.filter((s) => s.flag_status === "flagged").length,
    warning: summaries.filter((s) => s.flag_status === "warning").length,
    clear:   summaries.filter((s) => s.flag_status === "none").length,
  };

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid p-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <Link to="/instructor/exams" className="btn btn-outline-secondary mb-2">
            <i className="bi bi-arrow-left me-2"></i>Back to Exams
          </Link>
          <h3 className="mb-0">{exam.title}</h3>
          <p className="text-muted">{exam.course?.code} — {exam.course?.name}</p>
        </div>
        {activeTab === "questions" && (
          <button className="btn btn-primary" onClick={() => setShowQuestionModal(true)}>
            <i className="bi bi-plus-circle me-2"></i>Add Question
          </button>
        )}
        {activeTab === "anomalies" && (
          <button className="btn btn-outline-secondary" onClick={fetchAnomalySummaries}>
            <i className="bi bi-arrow-clockwise me-2"></i>Refresh
          </button>
        )}
      </div>

      {/* Exam Info Card */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3"><strong>Type:</strong> {exam.type}</div>
            <div className="col-md-3"><strong>Duration:</strong> {exam.duration_minutes} min</div>
            <div className="col-md-3"><strong>Total Points:</strong> {exam.total_points}</div>
            <div className="col-md-3"><strong>Questions:</strong> {questions.length}</div>
          </div>
          <div className="row mt-2">
            <div className="col-md-6">
              <strong>Start:</strong> {new Date(exam.start_time).toLocaleString()}
            </div>
            <div className="col-md-6">
              <strong>End:</strong> {new Date(exam.end_time).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "questions" ? "active fw-semibold" : ""}`}
            onClick={() => setActiveTab("questions")}
          >
            <i className="bi bi-list-ol me-2"></i>
            Questions ({questions.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "anomalies" ? "active fw-semibold" : ""}`}
            onClick={() => setActiveTab("anomalies")}
          >
            <i className="bi bi-shield-exclamation me-2"></i>
            Anomaly Monitor
            {anomalyLoaded && anomalyStats.flagged > 0 && (
              <span className="badge bg-danger ms-2">{anomalyStats.flagged}</span>
            )}
          </button>
        </li>
      </ul>

      {/* ══ QUESTIONS TAB ════════════════════════════════════════════════════ */}
      {activeTab === "questions" && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white">
            <h5 className="mb-0">Questions ({questions.length})</h5>
          </div>
          <div className="card-body">
            {questions.length === 0 ? (
              <p className="text-center text-muted py-4">
                No questions yet. Add your first question!
              </p>
            ) : (
              <div className="list-group">
                {questions.map((question, index) => (
                  <div key={question.id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h6>
                          Question {index + 1}
                          <span className="badge bg-secondary ms-2">{question.points} pts</span>
                          <span className="badge bg-info ms-1">{question.type.replace("_", " ")}</span>
                        </h6>
                        <p className="mt-2 mb-1">{question.question_text}</p>

                        {question.type === "multiple_choice" && question.options && (
                          <ul className="list-unstyled ms-3 small">
                            {question.options.map((opt, idx) => (
                              <li key={idx} className={opt === question.correct_answer ? "text-success fw-bold" : ""}>
                                {String.fromCharCode(65 + idx)}. {opt}
                                {opt === question.correct_answer && " ✓"}
                              </li>
                            ))}
                          </ul>
                        )}

                        {question.type === "true_false" && (
                          <p className="ms-3 small">
                            <strong>Answer:</strong>{" "}
                            <span className="text-success">{question.correct_answer}</span>
                          </p>
                        )}

                        {question.type === "essay" && question.max_words && (
                          <p className="ms-3 small text-muted">Max words: {question.max_words}</p>
                        )}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger ms-3"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ ANOMALIES TAB ════════════════════════════════════════════════════ */}
      {activeTab === "anomalies" && (
        <>
          {anomalyLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
              <p className="text-muted mt-3">Loading anomaly data…</p>
            </div>
          ) : (
            <>
              {/* Mini stat cards */}
              <div className="row g-3 mb-4">
                {[
                  { label: "Flagged",  value: anomalyStats.flagged, color: "danger"  },
                  { label: "Warning",  value: anomalyStats.warning,  color: "warning" },
                  { label: "Clear",    value: anomalyStats.clear,    color: "success" },
                  { label: "Total",    value: summaries.length,      color: "primary" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="col-md-3">
                    <div className={`card border-0 border-start border-${color} border-4 shadow-sm`}>
                      <div className="card-body py-3">
                        <h6 className="text-muted mb-1">{label}</h6>
                        <p className={`display-6 fw-bold text-${color} mb-0`}>{value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary table */}
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title mb-3">Student Risk Overview</h6>
                  {summaries.length === 0 ? (
                    <p className="text-center text-muted py-4">
                      No anomaly data yet. Data will appear once students start taking this exam.
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>STUDENT</th>
                            <th>RISK SCORE</th>
                            <th>FLAG</th>
                            <th title="Tab Switches"><i className="bi bi-box-arrow-up-right"></i> Tabs</th>
                            <th title="Shortcuts"><i className="bi bi-keyboard"></i> Shortcuts</th>
                            <th title="Response Time"><i className="bi bi-clock"></i> Response</th>
                            <th title="Keystroke"><i className="bi bi-activity"></i> Keystroke</th>
                            <th>LAST EVENT</th>
                            <th>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summaries.map((s) => (
                            <tr key={s.submission_id}>
                              <td>
                                <div className="fw-semibold">{s.student?.name}</div>
                                <small className="text-muted">{s.student?.email}</small>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="progress flex-grow-1" style={{ height: 8, minWidth: 80 }}>
                                    <div
                                      className={`progress-bar ${
                                        s.risk_score >= 50 ? "bg-danger"
                                        : s.risk_score >= 20 ? "bg-warning"
                                        : "bg-success"
                                      }`}
                                      style={{ width: `${s.risk_score}%` }}
                                    />
                                  </div>
                                  <span className={`fw-bold ${getRiskColor(s.risk_score)}`}>
                                    {s.risk_score}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${FLAG_MAP[s.flag_status]?.badge}`}>
                                  {FLAG_MAP[s.flag_status]?.label}
                                </span>
                              </td>
                              <td className="text-center">{s.tab_switch_count}</td>
                              <td className="text-center">{s.keyboard_shortcut_count}</td>
                              <td className="text-center">{s.response_time_anomaly_count}</td>
                              <td className="text-center">{s.keystroke_anomaly_count}</td>
                              <td>
                                <small className="text-muted">
                                  {s.last_anomaly_at
                                    ? new Date(s.last_anomaly_at).toLocaleString()
                                    : "—"}
                                </small>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => openStudentDetail(s.submission_id)}
                                  title="View full event timeline"
                                >
                                  <i className="bi bi-eye"></i>
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
            </>
          )}
        </>
      )}

      {/* ── Add Question Modal ── */}
      <AddQuestionModal
        show={showQuestionModal}
        onHide={() => setShowQuestionModal(false)}
        examId={id}
        onSuccess={(newQuestion) => {
          setQuestions([...questions, newQuestion]);
          setShowQuestionModal(false);
          fetchExamDetails();
        }}
      />

      {/* ── Student Detail Modal ── */}
      {(detailLoading || detailData) && (
        <StudentDetailModal
          loading={detailLoading}
          data={detailData}
          onClose={() => setDetailData(null)}
          onMarkReviewed={markReviewed}
        />
      )}
    </div>
  );
};

// ─── Student Detail Modal ─────────────────────────────────────────────────────
const StudentDetailModal = ({ loading, data, onClose, onMarkReviewed }) => (
  <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
    <div className="modal-dialog modal-xl modal-dialog-scrollable">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">
            {loading ? "Loading…" : `${data?.student?.name} — Anomaly Timeline`}
          </h5>
          <button className="btn-close" onClick={onClose} />
        </div>

        <div className="modal-body">
          {loading && (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          )}

          {!loading && data && (
            <>
              {/* Risk summary badges */}
              <div className="row g-3 mb-4">
                {[
                  { label: "Risk Score",    value: data.summary?.risk_score ?? 0,                 color: getRiskColor(data.summary?.risk_score ?? 0) },
                  { label: "Tab Switches",  value: data.summary?.tab_switch_count ?? 0,           color: "text-dark" },
                  { label: "Shortcuts",     value: data.summary?.keyboard_shortcut_count ?? 0,    color: "text-dark" },
                  { label: "Response ⚠",   value: data.summary?.response_time_anomaly_count ?? 0, color: "text-dark" },
                  { label: "Keystroke ⚠",  value: data.summary?.keystroke_anomaly_count ?? 0,    color: "text-dark" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="col">
                    <div className="card border-0 bg-light text-center p-2">
                      <div className={`display-6 fw-bold ${color}`}>{value}</div>
                      <small className="text-muted">{label}</small>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submission meta */}
              <p className="small text-muted mb-3">
                <strong>Started:</strong> {new Date(data.submission?.started_at).toLocaleString()} &nbsp;·&nbsp;
                <strong>Submitted:</strong> {data.submission?.submitted_at
                  ? new Date(data.submission.submitted_at).toLocaleString()
                  : "In progress"} &nbsp;·&nbsp;
                <strong>Score:</strong> {data.submission?.score}/{data.submission?.total_points}
              </p>

              {/* Event log */}
              <h6 className="fw-bold mb-3">Full Event Timeline</h6>
              {data.logs?.length === 0 ? (
                <p className="text-muted">No events recorded.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>TIME</th>
                        <th>TYPE</th>
                        <th>SEVERITY</th>
                        <th>QUESTION</th>
                        <th>DETAIL</th>
                        <th>NOTES</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((log) => (
                        <tr key={log.id} className={log.reviewed ? "opacity-50" : ""}>
                          <td><small>{new Date(log.occurred_at).toLocaleTimeString()}</small></td>
                          <td>
                            <span className="badge bg-dark">
                              {TYPE_LABELS[log.type] ?? log.type}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${SEVERITY_MAP[log.severity]?.badge}`}>
                              {SEVERITY_MAP[log.severity]?.label}
                            </span>
                          </td>
                          <td>
                            {log.question
                              ? <small>Q{log.question.order}</small>
                              : <small className="text-muted">—</small>}
                          </td>
                          <td><MetadataSummary type={log.type} meta={log.metadata} /></td>
                          <td>
                            <small className="fst-italic text-muted">
                              {log.reviewer_notes || "—"}
                            </small>
                          </td>
                          <td>
                            {log.reviewed
                              ? <span className="badge bg-success">Reviewed</span>
                              : <span className="badge bg-secondary">Pending</span>}
                          </td>
                          <td>
                            <button
                              className={`btn btn-sm ${log.reviewed ? "btn-outline-secondary" : "btn-outline-success"}`}
                              onClick={() => onMarkReviewed(log.id, !log.reviewed)}
                              title={log.reviewed ? "Reopen" : "Mark reviewed"}
                            >
                              <i className={`bi ${log.reviewed ? "bi-arrow-counterclockwise" : "bi-check-circle"}`}></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Add Question Modal (unchanged from original) ─────────────────────────────
const AddQuestionModal = ({ show, onHide, examId, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: "multiple_choice",
    question_text: "",
    points: 1,
    options: ["", "", "", ""],
    correct_answer: "",
    max_words: null,
    rubric: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        type:          formData.type,
        question_text: formData.question_text,
        points:        formData.points,
      };
      if (formData.type === "multiple_choice") {
        payload.options        = formData.options.filter((o) => o.trim() !== "");
        payload.correct_answer = formData.correct_answer;
      } else if (formData.type === "true_false") {
        payload.correct_answer = formData.correct_answer;
      } else if (formData.type === "essay") {
        payload.max_words = formData.max_words;
        payload.rubric    = formData.rubric;
      }
      const res = await API.post(`/exams/${examId}/questions`, payload);
      Swal.fire("Success!", "Question added successfully", "success");
      onSuccess(res.data.question);
      setFormData({ type: "multiple_choice", question_text: "", points: 1,
        options: ["", "", "", ""], correct_answer: "", max_words: null, rubric: "" });
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.message || "Failed to add question", "error");
    }
  };

  const updateOption = (index, value) => {
    const opts = [...formData.options];
    opts[index] = value;
    setFormData({ ...formData, options: opts });
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Question</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Question Type *</label>
                <select className="form-select" value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })} required>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="essay">Essay</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Question Text *</label>
                <textarea className="form-control" rows="3" value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Points *</label>
                <input type="number" className="form-control" min="1" value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })} required />
              </div>
              {formData.type === "multiple_choice" && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Options *</label>
                    {formData.options.map((opt, idx) => (
                      <input key={idx} type="text" className="form-control mb-2"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={opt} onChange={(e) => updateOption(idx, e.target.value)} required />
                    ))}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Correct Answer *</label>
                    <select className="form-select" value={formData.correct_answer}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })} required>
                      <option value="">Select correct answer</option>
                      {formData.options.map((opt, idx) => opt && (
                        <option key={idx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {formData.type === "true_false" && (
                <div className="mb-3">
                  <label className="form-label">Correct Answer *</label>
                  <select className="form-select" value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })} required>
                    <option value="">Select answer</option>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </div>
              )}
              {formData.type === "essay" && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Maximum Words</label>
                    <input type="number" className="form-control" min="1"
                      value={formData.max_words || ""}
                      onChange={(e) => setFormData({ ...formData, max_words: parseInt(e.target.value) || null })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Grading Rubric</label>
                    <textarea className="form-control" rows="3" value={formData.rubric}
                      onChange={(e) => setFormData({ ...formData, rubric: e.target.value })}
                      placeholder="Describe how this question should be graded…" />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Question</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExamDetail;