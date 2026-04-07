import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";

const TYPE_LABELS = {
  tab_switch: "Tab Switching", keyboard_shortcut: "Keyboard Shortcut",
  response_time: "Response Time", keystroke_dynamics: "Keystroke Dynamics",
};
const SEVERITY_MAP = {
  high: { badge: "bg-danger", label: "High" },
  medium: { badge: "bg-warning text-dark", label: "Medium" },
  low: { badge: "bg-secondary", label: "Low" },
};
const FLAG_MAP = {
  flagged: { badge: "bg-danger", label: "Flagged" },
  warning: { badge: "bg-warning text-dark", label: "Warning" },
  none: { badge: "bg-success", label: "Clear" },
};
const QUESTION_TYPE_ICON = {
  multiple_choice: 'bi-ui-radios', true_false: 'bi-toggle-on', essay: 'bi-textarea'
};
const getRiskColor = (score) => score >= 50 ? "text-danger" : score >= 20 ? "text-warning" : "text-success";

const MetadataSummary = ({ type, meta }) => {
  if (!meta) return <small className="text-muted">—</small>;
  switch (type) {
    case "tab_switch": return <small>Hidden {((meta.hidden_duration_ms ?? 0) / 1000).toFixed(1)}s · Switch #{meta.count_in_session}</small>;
    case "keyboard_shortcut": return <small><kbd>{meta.keys}</kbd></small>;
    case "response_time": return <small>{meta.direction === "too_fast" ? "⚡ Too fast" : "🐢 Too slow"} · z={meta.z_score} · {((meta.response_time_ms ?? 0) / 1000).toFixed(1)}s</small>;
    case "keystroke_dynamics": return <small>{meta.reason === "impossible_speed" ? "🚀 Impossible speed" : "📊 Deviation"} · {meta.wpm?.toFixed(0)} WPM</small>;
    default: return <small className="text-muted">—</small>;
  }
};

const ExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("questions");
  const [summaries, setSummaries] = useState([]);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyLoaded, setAnomalyLoaded] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion]     = useState(null); // question object being edited, or null
  const [shuffleEnabled, setShuffleEnabled]       = useState(false);
  const [shuffleSaving, setShuffleSaving]         = useState(false);
  const [anomalySearch, setAnomalySearch]         = useState('');
  const [anomalyFilter, setAnomalyFilter]         = useState('all');

  // Track whether this page was opened right after exam creation
  const isNewExam = !!location.state?.openAddQuestion;

  // ── Auto-open Add Question modal when arriving fresh from exam creation ──
  useEffect(() => {
    if (isNewExam && !loading) {
      setShowQuestionModal(true);
      // Clear the flag so a browser refresh doesn't re-trigger it
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [loading, isNewExam]);

  useEffect(() => { fetchExamDetails(); }, [id]);

  // localStorage key scoped per exam so different exams have independent shuffle state
  const shuffleStorageKey = `exam_shuffle_${id}`;

  const fetchExamDetails = async () => {
    try {
      const res = await API.get(`/exams/${id}`);
      setExam(res.data.exam);
      setQuestions(res.data.exam.questions || []);

      // localStorage always takes priority over the DB value.
      // This means the toggle survives page refreshes even if the backend
      // isn't persisting shuffle_questions yet.
      const stored = localStorage.getItem(shuffleStorageKey);
      if (stored !== null) {
        // User has explicitly set a preference — honour it
        setShuffleEnabled(JSON.parse(stored));
      } else if (res.data.exam.shuffle_questions !== undefined && res.data.exam.shuffle_questions !== null) {
        // No local preference yet — use whatever the DB says and cache it
        setShuffleEnabled(!!res.data.exam.shuffle_questions);
        localStorage.setItem(shuffleStorageKey, JSON.stringify(!!res.data.exam.shuffle_questions));
      } else {
        // Neither — default off
        setShuffleEnabled(false);
      }
    } catch {
      Swal.fire("Error!", "Failed to load exam details", "error");
      navigate("/instructor/exams");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "anomalies" && !anomalyLoaded) fetchAnomalySummaries();
  }, [activeTab]);

  const fetchAnomalySummaries = async () => {
    setAnomalyLoading(true);
    try {
      const res = await API.get(`/exams/${id}/anomalies/summary`);
      setSummaries(res.data.summaries || []);
      setAnomalyLoaded(true);
    } catch {
      Swal.fire("Error!", "Failed to load anomaly data.", "error");
    } finally { setAnomalyLoading(false); }
  };

  const openStudentDetail = async (submissionId) => {
    setDetailLoading(true); setDetailData(null);
    try {
      const res = await API.get(`/exams/${id}/submissions/${submissionId}/anomalies`);
      setDetailData(res.data);
    } catch { Swal.fire("Error", "Could not load student detail.", "error"); }
    finally { setDetailLoading(false); }
  };

  const markReviewed = async (logId, reviewed) => {
    const { value: notes } = await Swal.fire({
      title: reviewed ? "Mark as Reviewed" : "Reopen Log",
      input: "textarea", inputLabel: "Reviewer notes (optional)",
      inputPlaceholder: "Add your observations…", showCancelButton: true,
      confirmButtonText: reviewed ? "Mark Reviewed" : "Reopen",
    });
    if (notes === undefined) return;
    try {
      await API.patch(`/exams/${id}/anomalies/${logId}/review`, { reviewed, reviewer_notes: notes || null });
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Saved", showConfirmButton: false, timer: 2000 });
      if (detailData) openStudentDetail(detailData.submission.id);
    } catch { Swal.fire("Error", "Failed to save review.", "error"); }
  };

  const handleDeleteQuestion = async (questionId) => {
    const result = await Swal.fire({
      title: "Delete this question?", text: "This cannot be undone.", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/exams/${id}/questions/${questionId}`);
      setQuestions(questions.filter(q => q.id !== questionId));
      Swal.fire("Deleted!", "Question removed.", "success");
      fetchExamDetails();
    } catch { Swal.fire("Error!", "Failed to delete question.", "error"); }
  };

  // Save edits to an existing question
  const handleSaveEdit = async (questionId, payload) => {
    try {
      const res = await API.put(`/exams/${id}/questions/${questionId}`, payload);
      const updated = res.data.question;
      setQuestions(prev => prev.map(q => q.id === questionId ? updated : q));
      setEditingQuestion(null);
      Swal.fire({ icon: 'success', title: 'Question updated!', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.message || "Failed to update question.", "error");
    }
  };

  // Toggle shuffle / randomise question order for students
  const handleShuffleToggle = async () => {
    const next = !shuffleEnabled;
    setShuffleSaving(true);

    // Always update the UI and localStorage immediately so the toggle feels instant
    setShuffleEnabled(next);
    localStorage.setItem(shuffleStorageKey, JSON.stringify(next));

    try {
      // Try to persist to the database
      // PUT is the only write method the route supports (PATCH is not registered).
      // Send the full exam payload — same shape ExamEdit.jsx uses — plus shuffle_questions.
      await API.put(`/exams/${id}`, {
        course_id:         exam.course_id,
        title:             exam.title,
        description:       exam.description || '',
        type:              exam.type,
        start_time:        exam.start_time,
        end_time:          exam.end_time,
        duration_minutes:  exam.duration_minutes,
        status:            exam.status,
        shuffle_questions: next,
      });
      // Keep exam state in sync so subsequent toggles use the latest value
      setExam(prev => ({ ...prev, shuffle_questions: next }));
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: next ? 'Shuffle ON — questions will be randomised' : 'Shuffle OFF — questions in fixed order',
        showConfirmButton: false, timer: 2500,
      });
    } catch (err) {
      // Check whether the column simply doesn't exist on the backend yet
      const serverMsg = err?.response?.data?.message || err?.message || '';
      const isDbMissing =
        err?.response?.status === 422 ||   // validation / unknown field
        err?.response?.status === 500 ||   // server crash (missing column)
        serverMsg.toLowerCase().includes('column') ||
        serverMsg.toLowerCase().includes('shuffle') ||
        serverMsg.toLowerCase().includes('unknown');

      if (isDbMissing) {
        // Setting saved locally — show a helpful warning instead of an error
        Swal.fire({
          toast: true, position: 'top-end', icon: 'warning',
          title: `Shuffle ${next ? 'ON' : 'OFF'} (saved locally)`,
          text: 'The shuffle_questions column is not in the database yet. Add a migration to persist this permanently.',
          showConfirmButton: false, timer: 5000,
        });
      } else {
        // Unexpected error — roll back the toggle and show the real message
        setShuffleEnabled(!next);
        localStorage.setItem(shuffleStorageKey, JSON.stringify(!next));
        Swal.fire({
          icon: 'error',
          title: 'Could not save shuffle setting',
          text: serverMsg || 'An unexpected error occurred.',
          footer: `Status: ${err?.response?.status ?? 'network error'}`,
        });
      }
    } finally { setShuffleSaving(false); }
  };

  const anomalyStats = {
    flagged: summaries.filter(s => s.flag_status === "flagged").length,
    warning: summaries.filter(s => s.flag_status === "warning").length,
    clear: summaries.filter(s => s.flag_status === "none").length,
  };

  const filteredSummaries = summaries.filter(s => {
    if (anomalyFilter !== 'all' && s.flag_status !== anomalyFilter) return false;
    if (anomalySearch.trim()) {
      const q = anomalySearch.toLowerCase();
      return s.student?.name?.toLowerCase().includes(q) || s.student?.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  return (
    <div className="container-fluid p-4" style={{ maxWidth: 1200 }}>

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/instructor/exams" className="text-decoration-none">Exams</Link></li>
          <li className="breadcrumb-item active">{exam.title}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h3 className="mb-1 fw-bold">{exam.title}</h3>
          <p className="text-muted mb-0">
            <Link to={`/instructor/courses/${exam.course?.id}`} className="text-decoration-none text-muted">
              <i className="bi bi-folder2 me-1"></i>{exam.course?.code} — {exam.course?.name}
            </Link>
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/instructor/exams/${id}/edit`} className="btn btn-outline-secondary">
            <i className="bi bi-pencil me-2"></i>Edit Exam
          </Link>
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
      </div>

      {/* Exam Info Strip */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body py-3">
          <div className="row g-3 align-items-center">
            {[
              { icon: 'bi-tag', label: 'Type', value: <span className="badge bg-secondary text-capitalize">{exam.type}</span> },
              { icon: 'bi-clock', label: 'Duration', value: `${exam.duration_minutes} min` },
              { icon: 'bi-trophy', label: 'Total Points', value: `${totalPoints} pts` },
              { icon: 'bi-list-ol', label: 'Questions', value: questions.length },
              { icon: 'bi-calendar-event', label: 'Start', value: new Date(exam.start_time).toLocaleString() },
              { icon: 'bi-calendar-x', label: 'End', value: new Date(exam.end_time).toLocaleString() },
            ].map(({ icon, label, value }) => (
              <div key={label} className="col-auto">
                <div className="text-muted small"><i className={`bi ${icon} me-1`}></i>{label}</div>
                <div className="fw-semibold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── "Just created" onboarding banner ── */}
      {isNewExam && questions.length === 0 && (
        <div className="alert alert-primary border-primary d-flex align-items-start gap-3 mb-3" role="alert">
          <i className="bi bi-lightbulb-fill fs-5 text-primary mt-1 flex-shrink-0"></i>
          <div>
            <strong>Exam created! Next step: add your questions.</strong>
            <p className="mb-2 mt-1 small text-muted">
              Your exam has no questions yet. Click <strong>Add Question</strong> below to start building it.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowQuestionModal(true)}>
              <i className="bi bi-plus-circle me-2"></i>Add First Question
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "questions" ? "active fw-semibold" : ""}`}
            onClick={() => setActiveTab("questions")}>
            <i className="bi bi-list-ol me-2"></i>Questions
            <span className="badge bg-primary ms-2">{questions.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "anomalies" ? "active fw-semibold" : ""}`}
            onClick={() => setActiveTab("anomalies")}>
            <i className="bi bi-shield-exclamation me-2"></i>Anomaly Monitor
            {anomalyLoaded && anomalyStats.flagged > 0 && (
              <span className="badge bg-danger ms-2">{anomalyStats.flagged}</span>
            )}
          </button>
        </li>
      </ul>

      {/* ── Questions Tab ── */}
      {activeTab === "questions" && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h6 className="mb-0 fw-semibold">
              <i className="bi bi-list-ol me-2 text-primary"></i>
              {questions.length} Question{questions.length !== 1 ? 's' : ''} · {totalPoints} total pts
            </h6>

            <div className="d-flex align-items-center gap-2">
              {/* ── Shuffle toggle ── */}
              <div
                className={`d-flex align-items-center gap-2 px-3 py-1 rounded-pill border ${shuffleEnabled ? 'border-success bg-success bg-opacity-10' : 'border-secondary bg-light'}`}
                title={shuffleEnabled ? 'Questions are randomised for each student — click to turn off' : 'Questions appear in fixed order — click to randomise'}
                style={{ cursor: shuffleSaving ? 'wait' : 'pointer', userSelect: 'none' }}
                onClick={!shuffleSaving ? handleShuffleToggle : undefined}
              >
                {shuffleSaving
                  ? <span className="spinner-border spinner-border-sm text-secondary" />
                  : <i className={`bi ${shuffleEnabled ? 'bi-shuffle text-success' : 'bi-list-ol text-secondary'}`}></i>
                }
                <span className={`small fw-semibold ${shuffleEnabled ? 'text-success' : 'text-muted'}`}>
                  {shuffleEnabled ? 'Shuffle ON' : 'Shuffle OFF'}
                </span>
                {/* Visible switch indicator */}
                <div
                  className={`rounded-pill ${shuffleEnabled ? 'bg-success' : 'bg-secondary'}`}
                  style={{ width: 28, height: 16, position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}
                >
                  <div style={{
                    position: 'absolute', top: 2,
                    left: shuffleEnabled ? 14 : 2,
                    width: 12, height: 12,
                    borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => setShowQuestionModal(true)}>
                <i className="bi bi-plus me-1"></i>Add Question
              </button>
            </div>
          </div>

          {/* Shuffle info banner */}
          {shuffleEnabled && questions.length > 1 && (
            <div className="alert alert-success border-0 rounded-0 mb-0 py-2 px-4" style={{ fontSize: 13 }}>
              <i className="bi bi-shuffle me-2"></i>
              <strong>Shuffle is ON</strong> — each student will receive questions in a randomised order.
              {exam?.shuffle_questions === undefined || exam?.shuffle_questions === null ? (
                <span className="ms-2 text-warning fw-semibold">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Saved locally only — add a <code>shuffle_questions</code> database migration to make this permanent.
                </span>
              ) : null}
            </div>
          )}

          <div className="card-body p-0">
            {questions.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-patch-question fs-1 text-muted d-block mb-2"></i>
                <p className="text-muted mb-3">No questions yet. Add your first question to get started.</p>
                <button className="btn btn-primary" onClick={() => setShowQuestionModal(true)}>
                  <i className="bi bi-plus-circle me-2"></i>Add First Question
                </button>
              </div>
            ) : (
              <div>
                {questions.map((question, index) => (
                  <div key={question.id} className="border-bottom p-4">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="badge bg-light text-dark border fw-bold">Q{index + 1}</span>
                          <span className="badge bg-primary bg-opacity-10 text-primary">
                            <i className={`bi ${QUESTION_TYPE_ICON[question.type] || 'bi-question'} me-1`}></i>
                            {question.type.replace("_", " ")}
                          </span>
                          <span className="badge bg-success bg-opacity-10 text-success">
                            <i className="bi bi-trophy me-1"></i>{question.points} pts
                          </span>
                        </div>
                        <p className="mb-2 fw-semibold">{question.question_text}</p>

                        {question.type === "multiple_choice" && question.options && (
                          <div className="ms-2">
                            {question.options.map((opt, idx) => (
                              <div key={idx} className={`d-flex align-items-center gap-2 mb-1 ${opt === question.correct_answer ? 'text-success fw-semibold' : 'text-muted'}`}>
                                <span className={`badge ${opt === question.correct_answer ? 'bg-success' : 'bg-light text-dark border'}`} style={{ minWidth: 24 }}>
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <small>{opt}</small>
                                {opt === question.correct_answer && <i className="bi bi-check-circle-fill text-success"></i>}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === "true_false" && (
                          <div className="ms-2">
                            <small className="text-muted">Correct answer: </small>
                            <span className="badge bg-success">{question.correct_answer}</span>
                          </div>
                        )}

                        {question.type === "essay" && question.max_words && (
                          <div className="ms-2">
                            <small className="text-muted"><i className="bi bi-type me-1"></i>Max words: {question.max_words}</small>
                          </div>
                        )}
                      </div>

                      {/* Edit + Delete buttons */}
                      <div className="d-flex gap-1 flex-shrink-0">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setEditingQuestion(question)}
                          title="Edit this question"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteQuestion(question.id)}
                          title="Delete this question"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Anomalies Tab ── */}
      {activeTab === "anomalies" && (
        anomalyLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
            <p className="text-muted mt-3">Loading anomaly data…</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="row g-3 mb-4">
              {[
                { label: "Flagged", value: anomalyStats.flagged, color: "danger", icon: 'bi-shield-x', key: 'flagged' },
                { label: "Warning", value: anomalyStats.warning, color: "warning", icon: 'bi-exclamation-triangle', key: 'warning' },
                { label: "Clear", value: anomalyStats.clear, color: "success", icon: 'bi-shield-check', key: 'none' },
                { label: "Total", value: summaries.length, color: "primary", icon: 'bi-people', key: 'all' },
              ].map(({ label, value, color, icon, key }) => (
                <div key={label} className="col-md-3">
                  <div className={`card border-0 shadow-sm h-100 ${anomalyFilter === key ? `border-${color} border-2` : ''}`}
                    style={{ cursor: 'pointer', outline: anomalyFilter === key ? `2px solid var(--bs-${color})` : 'none' }}
                    onClick={() => setAnomalyFilter(anomalyFilter === key ? 'all' : key)}>
                    <div className="card-body d-flex align-items-center gap-3 py-3">
                      <div className={`rounded-circle bg-${color} bg-opacity-10 d-flex align-items-center justify-content-center`} style={{ width: 44, height: 44 }}>
                        <i className={`bi ${icon} text-${color} fs-5`}></i>
                      </div>
                      <div>
                        <div className="text-muted small">{label}</div>
                        <div className={`fw-bold fs-4 text-${color} lh-1`}>{value}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter + Search */}
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white d-flex gap-3 align-items-center flex-wrap">
                <h6 className="mb-0 fw-semibold me-auto">Student Risk Overview</h6>
                <div className="input-group" style={{ maxWidth: 250 }}>
                  <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                  <input type="text" className="form-control border-start-0" placeholder="Search student…"
                    value={anomalySearch} onChange={e => setAnomalySearch(e.target.value)} />
                </div>
              </div>
              <div className="card-body p-0">
                {summaries.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-shield-check fs-1 d-block mb-2"></i>
                    No anomaly data yet. Data appears once students begin the exam.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>STUDENT</th>
                          <th>RISK SCORE</th>
                          <th>FLAG</th>
                          <th title="Tab Switches" className="text-center"><i className="bi bi-box-arrow-up-right"></i> Tabs</th>
                          <th title="Shortcuts" className="text-center"><i className="bi bi-keyboard"></i> Keys</th>
                          <th title="Response Time" className="text-center"><i className="bi bi-clock"></i> Response</th>
                          <th title="Keystroke" className="text-center"><i className="bi bi-activity"></i> Keystroke</th>
                          <th>LAST EVENT</th>
                          <th>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSummaries.length === 0 ? (
                          <tr><td colSpan="9" className="text-center text-muted py-4">No students match your filter.</td></tr>
                        ) : filteredSummaries.map(s => (
                          <tr key={s.submission_id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                  style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0 }}>
                                  {s.student?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="fw-semibold">{s.student?.name}</div>
                                  <small className="text-muted">{s.student?.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="progress flex-grow-1" style={{ height: 8, minWidth: 80 }}>
                                  <div className={`progress-bar ${s.risk_score >= 50 ? "bg-danger" : s.risk_score >= 20 ? "bg-warning" : "bg-success"}`}
                                    style={{ width: `${s.risk_score}%` }} />
                                </div>
                                <span className={`fw-bold ${getRiskColor(s.risk_score)}`}>{s.risk_score}</span>
                              </div>
                            </td>
                            <td><span className={`badge ${FLAG_MAP[s.flag_status]?.badge}`}>{FLAG_MAP[s.flag_status]?.label}</span></td>
                            <td className="text-center">{s.tab_switch_count}</td>
                            <td className="text-center">{s.keyboard_shortcut_count}</td>
                            <td className="text-center">{s.response_time_anomaly_count}</td>
                            <td className="text-center">{s.keystroke_anomaly_count}</td>
                            <td><small className="text-muted">{s.last_anomaly_at ? new Date(s.last_anomaly_at).toLocaleString() : "—"}</small></td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary" onClick={() => openStudentDetail(s.submission_id)} title="View timeline">
                                <i className="bi bi-eye me-1"></i>Details
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
        )
      )}

      {/* Modals */}
      <AddQuestionModal show={showQuestionModal} onHide={() => setShowQuestionModal(false)} examId={id}
        onSuccess={(newQuestion) => { setQuestions([...questions, newQuestion]); setShowQuestionModal(false); fetchExamDetails(); }} />

      <EditQuestionModal
        question={editingQuestion}
        onHide={() => setEditingQuestion(null)}
        onSave={handleSaveEdit}
      />

      {(detailLoading || detailData) && (
        <StudentDetailModal loading={detailLoading} data={detailData}
          onClose={() => setDetailData(null)} onMarkReviewed={markReviewed} />
      )}
    </div>
  );
};

/* ─── Student Detail Modal ─────────────────────────────────────────── */
const StudentDetailModal = ({ loading, data, onClose, onMarkReviewed }) => (
  <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
    <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h5 className="modal-title fw-bold">
              {loading ? "Loading…" : `${data?.student?.name} — Anomaly Timeline`}
            </h5>
            {!loading && data && <small className="text-muted">{data?.student?.email}</small>}
          </div>
          <button className="btn-close" onClick={onClose} />
        </div>
        <div className="modal-body">
          {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
          {!loading && data && (
            <>
              <div className="row g-3 mb-4">
                {[
                  { label: "Risk Score", value: data.summary?.risk_score ?? 0, color: getRiskColor(data.summary?.risk_score ?? 0) },
                  { label: "Tab Switches", value: data.summary?.tab_switch_count ?? 0, color: "text-dark" },
                  { label: "Shortcuts", value: data.summary?.keyboard_shortcut_count ?? 0, color: "text-dark" },
                  { label: "Response ⚠", value: data.summary?.response_time_anomaly_count ?? 0, color: "text-dark" },
                  { label: "Keystroke ⚠", value: data.summary?.keystroke_anomaly_count ?? 0, color: "text-dark" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="col">
                    <div className="card border-0 bg-light text-center p-2">
                      <div className={`fs-3 fw-bold ${color}`}>{value}</div>
                      <small className="text-muted">{label}</small>
                    </div>
                  </div>
                ))}
              </div>

              <p className="small text-muted mb-3">
                <strong>Started:</strong> {new Date(data.submission?.started_at).toLocaleString()} &nbsp;·&nbsp;
                <strong>Submitted:</strong> {data.submission?.submitted_at ? new Date(data.submission.submitted_at).toLocaleString() : "In progress"} &nbsp;·&nbsp;
                <strong>Score:</strong> {data.submission?.score}/{data.submission?.total_points}
              </p>

              <h6 className="fw-bold mb-3">Full Event Timeline</h6>
              {data.logs?.length === 0 ? (
                <p className="text-muted text-center py-4"><i className="bi bi-check-circle fs-3 text-success d-block mb-2"></i>No anomalous events recorded.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle">
                    <thead className="table-light">
                      <tr><th>TIME</th><th>TYPE</th><th>SEVERITY</th><th>QUESTION</th><th>DETAIL</th><th>NOTES</th><th>STATUS</th><th>ACTION</th></tr>
                    </thead>
                    <tbody>
                      {data.logs.map(log => (
                        <tr key={log.id} className={log.reviewed ? "opacity-50" : ""}>
                          <td><small>{new Date(log.occurred_at).toLocaleTimeString()}</small></td>
                          <td><span className="badge bg-dark">{TYPE_LABELS[log.type] ?? log.type}</span></td>
                          <td><span className={`badge ${SEVERITY_MAP[log.severity]?.badge}`}>{SEVERITY_MAP[log.severity]?.label}</span></td>
                          <td>{log.question ? <small>Q{log.question.order}</small> : <small className="text-muted">—</small>}</td>
                          <td><MetadataSummary type={log.type} meta={log.metadata} /></td>
                          <td><small className="fst-italic text-muted">{log.reviewer_notes || "—"}</small></td>
                          <td>{log.reviewed ? <span className="badge bg-success">Reviewed</span> : <span className="badge bg-secondary">Pending</span>}</td>
                          <td>
                            <button
                              className={`btn btn-sm ${log.reviewed ? "btn-outline-secondary" : "btn-outline-success"}`}
                              onClick={() => onMarkReviewed(log.id, !log.reviewed)}
                              title={log.reviewed ? "Reopen" : "Mark reviewed"}>
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

/* ─── Add Question Modal ───────────────────────────────────────────── */
/* ─── Edit Question Modal ──────────────────────────────────────────── */
// Pre-populates all fields from the existing question and calls onSave(id, payload)
const EditQuestionModal = ({ question, onHide, onSave }) => {
  const [formData, setFormData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Populate form whenever a new question is passed in
  useEffect(() => {
    if (!question) { setFormData(null); return; }
    setFormData({
      type:           question.type,
      question_text:  question.question_text,
      points:         question.points,
      options:        question.options?.length ? [...question.options] : ['', '', '', ''],
      correct_answer: question.correct_answer || '',
      max_words:      question.max_words || null,
      rubric:         question.rubric || '',
    });
  }, [question]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;
    setSubmitting(true);
    const payload = {
      type:          formData.type,
      question_text: formData.question_text,
      points:        formData.points,
    };
    if (formData.type === 'multiple_choice') {
      payload.options        = formData.options.filter(o => o.trim() !== '');
      payload.correct_answer = formData.correct_answer;
    } else if (formData.type === 'true_false') {
      payload.correct_answer = formData.correct_answer;
    } else if (formData.type === 'essay') {
      payload.max_words = formData.max_words;
      payload.rubric    = formData.rubric;
    }
    await onSave(question.id, payload);
    setSubmitting(false);
  };

  const updateOption = (index, value) => {
    const opts = [...formData.options];
    opts[index] = value;
    setFormData({
      ...formData,
      options:        opts,
      correct_answer: formData.correct_answer === formData.options[index] ? '' : formData.correct_answer,
    });
  };

  if (!question || !formData) return null;

  return (
    <div
      className="modal show d-block"
      style={{
        backgroundColor: 'rgba(0,0,0,0.5)',
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        overflowY: 'hidden', zIndex: 1055,
      }}
      // No backdrop-click dismiss — protects edits in progress
    >
      <div className="modal-dialog modal-lg" style={{ margin: '1.75rem auto' }}>
        <div className="modal-content">

          <div className="modal-header pb-2">
            <div>
              <h5 className="modal-title fw-bold">
                <i className="bi bi-pencil-square me-2 text-warning"></i>Edit Question
              </h5>
              <p className="text-muted small mb-0">Changes are saved when you click Save Changes</p>
            </div>
            <button type="button" className="btn-close" onClick={onHide} disabled={submitting} />
          </div>

          <form id="edit-question-form" onSubmit={handleSubmit}>
            <div className="modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
              <div className="row g-3">

                {/* Type selector — changing type resets answer fields */}
                <div className="col-md-8">
                  <label className="form-label fw-semibold">
                    Question Type <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex gap-2">
                    {[
                      { value: 'multiple_choice', label: 'Multiple Choice', icon: 'bi-ui-radios' },
                      { value: 'true_false',      label: 'True / False',    icon: 'bi-toggle-on' },
                      { value: 'essay',           label: 'Essay',           icon: 'bi-textarea'  },
                    ].map(opt => (
                      <button key={opt.value} type="button"
                        className={`btn btn-sm flex-grow-1 ${formData.type === opt.value ? 'btn-warning' : 'btn-outline-secondary'}`}
                        onClick={() => setFormData({ ...formData, type: opt.value, correct_answer: '', options: ['', '', '', ''] })}>
                        <i className={`bi ${opt.icon} me-1`}></i>{opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Points <span className="text-danger">*</span></label>
                  <input type="number" className="form-control" min="1"
                    value={formData.points}
                    onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                    required disabled={submitting} />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Question Text <span className="text-danger">*</span></label>
                  <textarea className="form-control" rows="3"
                    value={formData.question_text}
                    onChange={e => setFormData({ ...formData, question_text: e.target.value })}
                    required disabled={submitting} />
                </div>

                {/* ── Multiple Choice ── */}
                {formData.type === 'multiple_choice' && (
                  <>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Answer Options <span className="text-danger">*</span></label>
                      {formData.options.map((opt, idx) => (
                        <div key={idx} className="input-group mb-2">
                          <span className="input-group-text fw-semibold">{String.fromCharCode(65 + idx)}</span>
                          <input type="text" className="form-control"
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            value={opt}
                            onChange={e => updateOption(idx, e.target.value)}
                            required disabled={submitting} />
                          {opt && opt === formData.correct_answer && (
                            <span className="input-group-text bg-success text-white"><i className="bi bi-check-lg"></i></span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Correct Answer <span className="text-danger">*</span></label>
                      <select className="form-select" value={formData.correct_answer}
                        onChange={e => setFormData({ ...formData, correct_answer: e.target.value })}
                        required disabled={submitting}>
                        <option value="">Select the correct answer…</option>
                        {formData.options.map((opt, idx) => opt.trim() && (
                          <option key={idx} value={opt}>{String.fromCharCode(65 + idx)}. {opt}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* ── True / False ── */}
                {formData.type === 'true_false' && (
                  <div className="col-12">
                    <label className="form-label fw-semibold">Correct Answer <span className="text-danger">*</span></label>
                    <div className="d-flex gap-3">
                      {['True', 'False'].map(val => (
                        <button key={val} type="button"
                          className={`btn flex-grow-1 ${formData.correct_answer === val ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setFormData({ ...formData, correct_answer: val })}>
                          {val === 'True' ? '✅' : '❌'} {val}
                        </button>
                      ))}
                    </div>
                    <input type="hidden" value={formData.correct_answer} required onChange={() => {}} />
                  </div>
                )}

                {/* ── Essay ── */}
                {formData.type === 'essay' && (
                  <>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Max Words</label>
                      <input type="number" className="form-control" min="1" placeholder="e.g., 500"
                        value={formData.max_words || ''}
                        onChange={e => setFormData({ ...formData, max_words: parseInt(e.target.value) || null })}
                        disabled={submitting} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Grading Rubric</label>
                      <textarea className="form-control" rows="3"
                        placeholder="Describe how this question should be graded…"
                        value={formData.rubric}
                        onChange={e => setFormData({ ...formData, rubric: e.target.value })}
                        disabled={submitting} />
                    </div>
                  </>
                )}

              </div>
            </div>
          </form>

          <div className="modal-footer border-top">
            <small className="text-muted me-auto">
              <i className="bi bi-lock me-1"></i>Your edits won't be lost until you cancel
            </small>
            <button type="button" className="btn btn-light" onClick={onHide} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" form="edit-question-form" className="btn btn-warning px-4" disabled={submitting}>
              {submitting
                ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                : <><i className="bi bi-check2 me-2"></i>Save Changes</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

/* ─── Add Question Modal ───────────────────────────────────────────── */
const AddQuestionModal = ({ show, onHide, examId, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: "multiple_choice", question_text: "", points: 1,
    options: ["", "", "", ""], correct_answer: "", max_words: null, rubric: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { type: formData.type, question_text: formData.question_text, points: formData.points };
      if (formData.type === "multiple_choice") {
        payload.options = formData.options.filter(o => o.trim() !== "");
        payload.correct_answer = formData.correct_answer;
      } else if (formData.type === "true_false") {
        payload.correct_answer = formData.correct_answer;
      } else if (formData.type === "essay") {
        payload.max_words = formData.max_words;
        payload.rubric = formData.rubric;
      }
      const res = await API.post(`/exams/${examId}/questions`, payload);
      Swal.fire({ icon: 'success', title: 'Question Added!', timer: 1500, showConfirmButton: false });
      onSuccess(res.data.question);
      setFormData({ type: "multiple_choice", question_text: "", points: 1, options: ["", "", "", ""], correct_answer: "", max_words: null, rubric: "" });
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.message || "Failed to add question", "error");
    } finally { setSubmitting(false); }
  };

  const updateOption = (index, value) => {
    const opts = [...formData.options];
    opts[index] = value;
    setFormData({ ...formData, options: opts, correct_answer: formData.correct_answer === formData.options[index] ? '' : formData.correct_answer });
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{
        backgroundColor: "rgba(0,0,0,0.5)",
        // Ensure the backdrop covers full screen without itself scrolling
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        overflowY: 'hidden', zIndex: 1055,
      }}
      // No onClick — backdrop click does NOT dismiss to protect in-progress work
    >
      <div className="modal-dialog modal-lg" style={{ margin: '1.75rem auto' }}>
        <div className="modal-content">

          {/* ── Header — always visible ── */}
          <div className="modal-header border-0 pb-0">
            <div>
              <h5 className="modal-title fw-bold">
                <i className="bi bi-patch-plus me-2 text-primary"></i>Add Question
              </h5>
              <p className="text-muted small mb-0">Add a new question to this exam</p>
            </div>
            <button type="button" className="btn-close" onClick={onHide} disabled={submitting}></button>
          </div>

          {/*
            The form wraps only the scrollable body.
            The footer is intentionally OUTSIDE the form so Bootstrap can keep
            it pinned at the bottom of the modal-content box.
            The submit button fires the form via form="add-question-form".
          */}
          <form id="add-question-form" onSubmit={handleSubmit}>
            {/* explicit maxHeight + overflowY — works even when Bootstrap's
                modal-dialog-scrollable CSS isn't fully applied */}
            <div className="modal-body pt-3" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
              <div className="row g-3">

                {/* Type selector + Points */}
                <div className="col-md-8">
                  <label className="form-label fw-semibold">
                    Question Type <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex gap-2">
                    {[
                      { value: 'multiple_choice', label: 'Multiple Choice', icon: 'bi-ui-radios' },
                      { value: 'true_false',      label: 'True / False',    icon: 'bi-toggle-on' },
                      { value: 'essay',           label: 'Essay',           icon: 'bi-textarea'  },
                    ].map(opt => (
                      <button key={opt.value} type="button"
                        className={`btn btn-sm flex-grow-1 ${formData.type === opt.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setFormData({ ...formData, type: opt.value, correct_answer: '', options: ['', '', '', ''] })}>
                        <i className={`bi ${opt.icon} me-1`}></i>{opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    Points <span className="text-danger">*</span>
                  </label>
                  <input type="number" className="form-control" min="1"
                    value={formData.points}
                    onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                    required disabled={submitting} />
                </div>

                {/* Question text */}
                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Question Text <span className="text-danger">*</span>
                  </label>
                  <textarea className="form-control" rows="3" placeholder="Enter your question here…"
                    value={formData.question_text}
                    onChange={e => setFormData({ ...formData, question_text: e.target.value })}
                    required disabled={submitting} />
                </div>

                {/* ── Multiple Choice ── */}
                {formData.type === "multiple_choice" && (
                  <>
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Answer Options <span className="text-danger">*</span>
                      </label>
                      {formData.options.map((opt, idx) => (
                        <div key={idx} className="input-group mb-2">
                          <span className="input-group-text fw-semibold">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <input type="text" className="form-control"
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            value={opt}
                            onChange={e => updateOption(idx, e.target.value)}
                            required disabled={submitting} />
                          {opt && opt === formData.correct_answer && (
                            <span className="input-group-text bg-success text-white">
                              <i className="bi bi-check-lg"></i>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Correct Answer <span className="text-danger">*</span>
                      </label>
                      <select className="form-select" value={formData.correct_answer}
                        onChange={e => setFormData({ ...formData, correct_answer: e.target.value })}
                        required disabled={submitting}>
                        <option value="">Select the correct answer…</option>
                        {formData.options.map((opt, idx) => opt.trim() && (
                          <option key={idx} value={opt}>
                            {String.fromCharCode(65 + idx)}. {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* ── True / False ── */}
                {formData.type === "true_false" && (
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Correct Answer <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex gap-3">
                      {['True', 'False'].map(val => (
                        <button key={val} type="button"
                          className={`btn flex-grow-1 ${formData.correct_answer === val ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setFormData({ ...formData, correct_answer: val })}>
                          {val === 'True' ? '✅' : '❌'} {val}
                        </button>
                      ))}
                    </div>
                    {/* Hidden field so form validation can catch an unset answer */}
                    <input type="hidden" name="correct_answer_tf"
                      value={formData.correct_answer}
                      required
                      onChange={() => {}} />
                  </div>
                )}

                {/* ── Essay ── */}
                {formData.type === "essay" && (
                  <>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Max Words</label>
                      <input type="number" className="form-control" min="1" placeholder="e.g., 500"
                        value={formData.max_words || ""}
                        onChange={e => setFormData({ ...formData, max_words: parseInt(e.target.value) || null })}
                        disabled={submitting} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Grading Rubric</label>
                      <textarea className="form-control" rows="3"
                        placeholder="Describe how this question should be graded…"
                        value={formData.rubric}
                        onChange={e => setFormData({ ...formData, rubric: e.target.value })}
                        disabled={submitting} />
                    </div>
                  </>
                )}

              </div>
            </div>
          </form>

          {/* ── Footer — always pinned at the bottom, outside the scrolling form ── */}
          <div className="modal-footer border-top">
            <button type="button" className="btn btn-light" onClick={onHide} disabled={submitting}>
              Cancel
            </button>
            {/* form= ties this button to the form above even though it's outside it */}
            <button type="submit" form="add-question-form" className="btn btn-primary px-4" disabled={submitting}>
              {submitting
                ? <><span className="spinner-border spinner-border-sm me-2" />Adding…</>
                : <><i className="bi bi-plus-circle me-2"></i>Add Question</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExamDetail;