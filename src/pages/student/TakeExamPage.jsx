import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";
import { AnomalyCollector } from "../../anomalyCollector";

const TakeExamPage = () => {
  const { examId } = useParams();
  const navigate   = useNavigate();

  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [exam, setExam]                 = useState(null);
  const [questions, setQuestions]       = useState([]);
  const [answers, setAnswers]           = useState({});
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [timeLeft, setTimeLeft]         = useState(null);
  const [submissionId, setSubmissionId] = useState(null);

  const timerRef     = useRef(null);
  const collectorRef = useRef(null);
  const essayRefs    = useRef({});

  /* ── Start exam on mount ── */
  useEffect(() => {
    const startExam = async () => {
      try {
        const res = await API.post(`/student/exams/${examId}/start`);
        const { exam: examData, questions: qs, submission } = res.data;

        setExam(examData);
        setQuestions(qs);
        setSubmissionId(submission.id);

        const startedAt  = new Date(submission.started_at).getTime();
        const durationMs = examData.duration_minutes * 60 * 1000;
        const endByTimer = startedAt + durationMs;
        const endByExam  = new Date(examData.end_time).getTime();
        const hardEnd    = Math.min(endByTimer, endByExam);
        const remaining  = Math.max(0, Math.floor((hardEnd - Date.now()) / 1000));

        setTimeLeft(remaining);

        // ── Boot collector ──────────────────────────────────────────────────
        collectorRef.current = new AnomalyCollector({
          examId:     parseInt(examId),
          apiBaseUrl: "/api",
          onWarning:  handleAnomalyWarning,
        });
        collectorRef.current.start();

        if (qs.length > 0) {
          collectorRef.current.setCurrentQuestion(qs[0].id);
        }

        // ── BUG FIX: attach to any essay fields that already mounted ───────
        // React may have mounted essay textareas before the collector was
        // ready (if the API resolved slowly). Flush essayRefs now so those
        // fields get keystroke monitoring attached.
        for (const [questionId, el] of Object.entries(essayRefs.current)) {
          if (el) {
            collectorRef.current.attachToAnswerField(el, parseInt(questionId));
          }
        }

      } catch (err) {
        const msg = err.response?.data?.message || "Failed to start exam.";
        await Swal.fire("Cannot Start Exam", msg, "error");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    startExam();

    return () => {
      clearInterval(timerRef.current);
      collectorRef.current?.stop();
    };
  }, [examId]);

  /* ── Warning toast ── */
  const handleAnomalyWarning = useCallback((type, severity) => {
    const labels = {
      tab_switch:         "Tab switching detected",
      keyboard_shortcut:  "Restricted shortcut detected",
      response_time:      "Unusual response time detected",
      keystroke_dynamics: "Unusual typing pattern detected",
    };
    Swal.mixin({
      toast: true, position: "top-end",
      showConfirmButton: false, timer: 4000, timerProgressBar: true,
    }).fire({
      icon:  severity === "high" ? "error" : "warning",
      title: labels[type] ?? "Suspicious activity detected",
      text:  "This activity has been logged and will be reviewed.",
    });
  }, []);

  /* ── Question change — records response time on leave, starts clock on enter ── */
  const handleQuestionChange = useCallback((newIdx) => {
    const leaving  = questions[currentIdx];
    const entering = questions[newIdx];

    if (collectorRef.current && leaving) {
      collectorRef.current.recordResponseTime(leaving.id);
    }
    setCurrentIdx(newIdx);
    if (collectorRef.current && entering) {
      collectorRef.current.setCurrentQuestion(entering.id);
    }
  }, [currentIdx, questions]);

  /* ── Attach keystroke monitoring to essay textarea ── */
  const essayCallbackRef = useCallback((el, questionId) => {
    if (!el) return;

    // Always store the DOM element so the post-start flush in startExam()
    // can attach the collector if it wasn't ready yet when this fired.
    essayRefs.current[questionId] = el;

    // If the collector is already running, attach immediately.
    if (collectorRef.current) {
      collectorRef.current.attachToAnswerField(el, questionId);
    }
  }, []);

  /* ── Countdown ── */
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft !== null]);

  useEffect(() => {
    if (timeLeft === 0) handleSubmit(true);
  }, [timeLeft]);

  const formatTime = (secs) => {
    if (secs === null) return "--:--";
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const timerColor = () => {
    if (timeLeft === null) return "text-muted";
    if (timeLeft <= 60)   return "text-danger";
    if (timeLeft <= 300)  return "text-warning";
    return "text-success";
  };

  const setAnswer = (questionId, value) =>
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== ""
  ).length;

  /* ── Submit ── */
  const handleSubmit = useCallback(async (isAuto = false) => {
    if (submitting) return;

    if (!isAuto) {
      const unanswered = questions.length - answeredCount;
      const confirmMsg = unanswered > 0
        ? `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Submit anyway?`
        : "Are you sure you want to submit?";

      const result = await Swal.fire({
        title: "Submit Exam?", text: confirmMsg, icon: "question",
        showCancelButton: true, confirmButtonText: "Yes, submit!",
        confirmButtonColor: "#0d6efd",
      });
      if (!result.isConfirmed) return;
    }

    setSubmitting(true);
    clearInterval(timerRef.current);

    // Record the final active question's response time before stopping
    if (collectorRef.current && questions[currentIdx]) {
      collectorRef.current.recordResponseTime(questions[currentIdx].id);
    }
    // Stop collector — no more events after this point
    collectorRef.current?.stop();

    try {
      await API.post(`/student/exams/${examId}/submit`, { answers });
      Swal.fire({
        title: "Submitted!", text: "Your exam has been submitted successfully.",
        icon: "success", confirmButtonText: "View Results",
        confirmButtonColor: "#198754",
      }).then(() => navigate(`/student/exams/${examId}/results`));
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit.";
      Swal.fire("Error", msg, "error");
      setSubmitting(false);
    }
  }, [answers, questions, submitting, examId, navigate, currentIdx]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 flex-column gap-3">
      <div className="spinner-border text-primary" role="status" />
      <p className="text-muted">Preparing your exam…</p>
    </div>
  );

  const currentQ = questions[currentIdx];

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">

      {/* ── Fixed header ── */}
      <div className="bg-white border-bottom shadow-sm sticky-top">
        <div className="container-fluid px-4 py-2 d-flex align-items-center justify-content-between">
          <div>
            <div className="fw-bold text-primary">{exam?.title}</div>
            <small className="text-muted">{answeredCount}/{questions.length} answered</small>
          </div>

          <div className={`d-flex align-items-center gap-2 fw-bold fs-5 ${timerColor()}`}>
            <i className="bi bi-clock"></i>
            {formatTime(timeLeft)}
            {timeLeft !== null && timeLeft <= 60 && (
              <span className="badge bg-danger ms-1">Hurry!</span>
            )}
          </div>

          <button
            className="btn btn-primary rounded-pill px-4"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            {submitting
              ? <><span className="spinner-border spinner-border-sm me-2" />Submitting…</>
              : <><i className="bi bi-check2-circle me-2"></i>Submit Exam</>}
          </button>
        </div>

        <div className="progress rounded-0" style={{ height: 4 }}>
          <div className="progress-bar bg-primary"
            style={{ width: `${(answeredCount / questions.length) * 100}%`, transition: "width 0.3s" }} />
        </div>
      </div>

      <div className="container-fluid px-4 py-4 flex-grow-1">
        <div className="row g-4">

          {/* ── Navigator sidebar ── */}
          <div className="col-lg-3 order-lg-2">
            <div className="card border-0 shadow-sm rounded-4 sticky-top" style={{ top: 80 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3 small text-uppercase text-muted">Questions</h6>
                <div className="d-flex flex-wrap gap-2">
                  {questions.map((q, i) => {
                    const answered  = answers[q.id] !== undefined && answers[q.id] !== "";
                    const isCurrent = i === currentIdx;
                    return (
                      <button key={q.id}
                        onClick={() => handleQuestionChange(i)}
                        className={`btn btn-sm rounded-3 fw-bold ${
                          isCurrent ? "btn-primary" : answered ? "btn-success" : "btn-outline-secondary"
                        }`}
                        style={{ width: 38, height: 38 }}
                        title={`Question ${i + 1}${answered ? " (answered)" : ""}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
                <hr />
                <div className="d-flex flex-column gap-1 small text-muted">
                  <span><span className="badge bg-success me-1">■</span>Answered</span>
                  <span><span className="badge bg-secondary me-1" style={{ opacity: 0.4 }}>■</span>Unanswered</span>
                  <span><span className="badge bg-primary me-1">■</span>Current</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Question card ── */}
          <div className="col-lg-9 order-lg-1">
            {currentQ && (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-4 p-lg-5">

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold">
                      Question {currentIdx + 1} of {questions.length}
                    </span>
                    <span className="badge bg-secondary-subtle text-secondary px-3 py-2 rounded-pill">
                      {currentQ.points} pt{currentQ.points !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <h5 className="fw-bold mb-4" style={{ lineHeight: 1.6 }}>
                    {currentQ.question_text}
                  </h5>

                  {/* Multiple Choice */}
                  {currentQ.type === "multiple_choice" && (
                    <div className="d-flex flex-column gap-3">
                      {(currentQ.options || []).map((opt, oi) => {
                        const selected = answers[currentQ.id] === opt;
                        return (
                          <button key={oi} onClick={() => setAnswer(currentQ.id, opt)}
                            className={`btn text-start p-3 rounded-3 border-2 fw-semibold ${
                              selected ? "btn-primary border-primary" : "btn-outline-secondary"
                            }`} style={{ transition: "all 0.15s" }}>
                            <span className={`me-3 badge rounded-circle ${
                              selected ? "bg-white text-primary" : "bg-secondary-subtle text-secondary"
                            }`} style={{ width: 28, height: 28, lineHeight: "20px" }}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* True / False */}
                  {currentQ.type === "true_false" && (
                    <div className="d-flex gap-3">
                      {["True", "False"].map((val) => {
                        const selected = answers[currentQ.id] === val;
                        return (
                          <button key={val} onClick={() => setAnswer(currentQ.id, val)}
                            className={`btn flex-grow-1 p-3 rounded-3 border-2 fw-bold fs-5 ${
                              selected
                                ? val === "True" ? "btn-success border-success" : "btn-danger border-danger"
                                : "btn-outline-secondary"
                            }`}>
                            {val === "True"
                              ? <><i className="bi bi-check-circle me-2"></i>True</>
                              : <><i className="bi bi-x-circle me-2"></i>False</>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay */}
                  {currentQ.type === "essay" && (
                    <div>
                      <textarea
                        ref={(el) => essayCallbackRef(el, currentQ.id)}
                        className="form-control rounded-3 border-2"
                        rows={8}
                        placeholder="Write your answer here…"
                        value={answers[currentQ.id] || ""}
                        onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                        style={{ resize: "vertical", fontSize: 15 }}
                      />
                      {currentQ.max_words && (
                        <div className="d-flex justify-content-between mt-2 small text-muted">
                          <span>Max: {currentQ.max_words} words</span>
                          <span>
                            {(answers[currentQ.id] || "").trim().split(/\s+/).filter(Boolean).length} words
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top">
                    <button className="btn btn-outline-secondary rounded-pill px-4"
                      onClick={() => handleQuestionChange(Math.max(0, currentIdx - 1))}
                      disabled={currentIdx === 0}>
                      <i className="bi bi-arrow-left me-2"></i>Previous
                    </button>

                    {currentIdx < questions.length - 1 ? (
                      <button className="btn btn-primary rounded-pill px-4"
                        onClick={() => handleQuestionChange(currentIdx + 1)}>
                        Next<i className="bi bi-arrow-right ms-2"></i>
                      </button>
                    ) : (
                      <button className="btn btn-success rounded-pill px-4"
                        onClick={() => handleSubmit(false)} disabled={submitting}>
                        <i className="bi bi-check2-circle me-2"></i>Submit Exam
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TakeExamPage;