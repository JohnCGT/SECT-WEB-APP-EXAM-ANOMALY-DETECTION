import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";

const TakeExamPage = () => {
  const { examId } = useParams();
  const navigate   = useNavigate();

  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exam, setExam]             = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [answers, setAnswers]       = useState({});     // { questionId: answerString }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft]     = useState(null);   // seconds
  const [submissionId, setSubmissionId] = useState(null);
  const timerRef = useRef(null);

  /* ── Start exam on mount ── */
  useEffect(() => {
    const startExam = async () => {
      try {
        const res = await API.post(`/student/exams/${examId}/start`);
        const { exam: examData, questions: qs, submission } = res.data;

        setExam(examData);
        setQuestions(qs);
        setSubmissionId(submission.id);

        // Calculate remaining time
        const startedAt  = new Date(submission.started_at).getTime();
        const durationMs = examData.duration_minutes * 60 * 1000;
        const endByTimer = startedAt + durationMs;
        const endByExam  = new Date(examData.end_time).getTime();
        const hardEnd    = Math.min(endByTimer, endByExam);
        const remaining  = Math.max(0, Math.floor((hardEnd - Date.now()) / 1000));

        setTimeLeft(remaining);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to start exam.";
        await Swal.fire("Cannot Start Exam", msg, "error");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    startExam();
    return () => clearInterval(timerRef.current);
  }, [examId]);

  /* ── Countdown timer ── */
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

  /* Auto-submit when timer hits 0 */
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
    if (timeLeft <= 60)  return "text-danger";
    if (timeLeft <= 300) return "text-warning";
    return "text-success";
  };

  /* ── Answer helpers ── */
  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const answeredCount = questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;

  /* ── Submit ── */
  const handleSubmit = useCallback(async (isAuto = false) => {
    if (submitting) return;

    if (!isAuto) {
      const unanswered = questions.length - answeredCount;
      const confirmMsg = unanswered > 0
        ? `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Submit anyway?`
        : "Are you sure you want to submit?";

      const result = await Swal.fire({
        title: "Submit Exam?",
        text: confirmMsg,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, submit!",
        confirmButtonColor: "#0d6efd",
      });
      if (!result.isConfirmed) return;
    }

    setSubmitting(true);
    clearInterval(timerRef.current);

    try {
      await API.post(`/student/exams/${examId}/submit`, { answers });
      Swal.fire({
        title: "Submitted!",
        text: "Your exam has been submitted successfully.",
        icon: "success",
        confirmButtonText: "View Results",
        confirmButtonColor: "#198754",
      }).then(() => navigate(`/student/exams/${examId}/results`));
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit.";
      Swal.fire("Error", msg, "error");
      setSubmitting(false);
    }
  }, [answers, questions, submitting, examId, navigate]);

  /* ── Loading ── */
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 flex-column gap-3">
      <div className="spinner-border text-primary" role="status" />
      <p className="text-muted">Preparing your exam…</p>
    </div>
  );

  const currentQ = questions[currentIdx];

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">

      {/* ── Fixed header bar ── */}
      <div className="bg-white border-bottom shadow-sm sticky-top">
        <div className="container-fluid px-4 py-2 d-flex align-items-center justify-content-between">
          <div>
            <div className="fw-bold text-primary">{exam?.title}</div>
            <small className="text-muted">
              {answeredCount}/{questions.length} answered
            </small>
          </div>

          {/* Timer */}
          <div className={`d-flex align-items-center gap-2 fw-bold fs-5 ${timerColor()}`}>
            <i className="bi bi-clock"></i>
            {formatTime(timeLeft)}
            {timeLeft <= 60 && (
              <span className="badge bg-danger ms-1 animate__animated animate__pulse">
                Hurry!
              </span>
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

        {/* Progress bar */}
        <div className="progress rounded-0" style={{ height: 4 }}>
          <div
            className="progress-bar bg-primary"
            style={{ width: `${(answeredCount / questions.length) * 100}%`, transition: "width 0.3s" }}
          />
        </div>
      </div>

      <div className="container-fluid px-4 py-4 flex-grow-1">
        <div className="row g-4">

          {/* ── Question navigator sidebar ── */}
          <div className="col-lg-3 order-lg-2">
            <div className="card border-0 shadow-sm rounded-4 sticky-top" style={{ top: 80 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3 small text-uppercase text-muted">Questions</h6>
                <div className="d-flex flex-wrap gap-2">
                  {questions.map((q, i) => {
                    const answered = answers[q.id] !== undefined && answers[q.id] !== "";
                    const isCurrent = i === currentIdx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(i)}
                        className={`btn btn-sm rounded-3 fw-bold ${
                          isCurrent
                            ? "btn-primary"
                            : answered
                            ? "btn-success"
                            : "btn-outline-secondary"
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

                  {/* Question header */}
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

                  {/* ── Multiple Choice ── */}
                  {currentQ.type === "multiple_choice" && (
                    <div className="d-flex flex-column gap-3">
                      {(currentQ.options || []).map((opt, oi) => {
                        const selected = answers[currentQ.id] === opt;
                        return (
                          <button
                            key={oi}
                            onClick={() => setAnswer(currentQ.id, opt)}
                            className={`btn text-start p-3 rounded-3 border-2 fw-semibold ${
                              selected
                                ? "btn-primary border-primary"
                                : "btn-outline-secondary"
                            }`}
                            style={{ transition: "all 0.15s" }}
                          >
                            <span
                              className={`me-3 badge rounded-circle ${selected ? "bg-white text-primary" : "bg-secondary-subtle text-secondary"}`}
                              style={{ width: 28, height: 28, lineHeight: "20px" }}
                            >
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* ── True / False ── */}
                  {currentQ.type === "true_false" && (
                    <div className="d-flex gap-3">
                      {["True", "False"].map((val) => {
                        const selected = answers[currentQ.id] === val;
                        return (
                          <button
                            key={val}
                            onClick={() => setAnswer(currentQ.id, val)}
                            className={`btn flex-grow-1 p-3 rounded-3 border-2 fw-bold fs-5 ${
                              selected
                                ? val === "True" ? "btn-success border-success" : "btn-danger border-danger"
                                : "btn-outline-secondary"
                            }`}
                          >
                            {val === "True"
                              ? <><i className="bi bi-check-circle me-2"></i>True</>
                              : <><i className="bi bi-x-circle me-2"></i>False</>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Essay ── */}
                  {currentQ.type === "essay" && (
                    <div>
                      <textarea
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

                  {/* ── Navigation ── */}
                  <div className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top">
                    <button
                      className="btn btn-outline-secondary rounded-pill px-4"
                      onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                      disabled={currentIdx === 0}
                    >
                      <i className="bi bi-arrow-left me-2"></i>Previous
                    </button>

                    {currentIdx < questions.length - 1 ? (
                      <button
                        className="btn btn-primary rounded-pill px-4"
                        onClick={() => setCurrentIdx((i) => i + 1)}
                      >
                        Next<i className="bi bi-arrow-right ms-2"></i>
                      </button>
                    ) : (
                      <button
                        className="btn btn-success rounded-pill px-4"
                        onClick={() => handleSubmit(false)}
                        disabled={submitting}
                      >
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