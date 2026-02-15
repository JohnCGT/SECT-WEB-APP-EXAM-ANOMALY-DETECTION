import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../../api";

const ExamResultsPage = () => {
  const { examId } = useParams();
  const navigate   = useNavigate();

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [results, setResults]   = useState(null);
  const [filter, setFilter]     = useState("all"); // all | correct | wrong | essay

  useEffect(() => {
    API.get(`/student/exams/${examId}/results`)
      .then((res) => setResults(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load results."))
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  if (error) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="text-center">
        <i className="bi bi-exclamation-circle text-danger fs-1 d-block mb-3"></i>
        <h5>{error}</h5>
        <button className="btn btn-outline-primary mt-2" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  );

  const { submission, exam, questions } = results;
  const pct       = submission.percentage;
  const passed    = pct >= 75;

  const correctCount = questions.filter((q) => q.is_correct === true).length;
  const wrongCount   = questions.filter((q) => q.is_correct === false).length;
  const essayCount   = questions.filter((q) => q.type === "essay").length;

  const filtered = questions.filter((q) => {
    if (filter === "correct") return q.is_correct === true;
    if (filter === "wrong")   return q.is_correct === false;
    if (filter === "essay")   return q.type === "essay";
    return true;
  });

  const gradeLabel = () => {
    if (pct >= 97) return { label: "A+", color: "text-success" };
    if (pct >= 93) return { label: "A",  color: "text-success" };
    if (pct >= 90) return { label: "A-", color: "text-success" };
    if (pct >= 87) return { label: "B+", color: "text-primary" };
    if (pct >= 83) return { label: "B",  color: "text-primary" };
    if (pct >= 80) return { label: "B-", color: "text-primary" };
    if (pct >= 77) return { label: "C+", color: "text-warning" };
    if (pct >= 73) return { label: "C",  color: "text-warning" };
    if (pct >= 70) return { label: "C-", color: "text-warning" };
    return { label: "F", color: "text-danger" };
  };

  const grade = gradeLabel();

  return (
    <div className="min-vh-100 bg-light">

      {/* Header bar */}
      <div className="bg-white border-bottom shadow-sm">
        <div className="container py-3 d-flex align-items-center justify-content-between">
          <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2"></i>Back to Course
          </button>
          <h6 className="fw-bold mb-0 text-primary">🎓 SECT Student Portal</h6>
          <Link to="/student/subjects" className="btn btn-outline-primary btn-sm rounded-pill">
            <i className="bi bi-journal-bookmark me-2"></i>My Subjects
          </Link>
        </div>
      </div>

      <div className="container py-5">

        {/* ── Score card ── */}
        <div className="card border-0 shadow rounded-4 mb-5 overflow-hidden">
          <div className={`p-5 text-center ${passed ? "bg-success" : "bg-danger"} bg-opacity-10`}>
            <div className="mb-3">
              {passed
                ? <i className="bi bi-trophy-fill text-success" style={{ fontSize: 56 }}></i>
                : <i className="bi bi-emoji-frown text-danger" style={{ fontSize: 56 }}></i>}
            </div>
            <h3 className="fw-bold mb-1">{exam.title}</h3>
            <span className="badge bg-secondary-subtle text-secondary text-capitalize mb-4">
              {exam.type}
            </span>

            <div className="row g-4 justify-content-center mt-2">
              {/* Score */}
              <div className="col-auto">
                <div className="bg-white rounded-4 shadow-sm px-5 py-4 text-center">
                  <div className={`display-4 fw-bold ${passed ? "text-success" : "text-danger"}`}>
                    {submission.score}
                    <span className="fs-4 text-muted">/{submission.total_points}</span>
                  </div>
                  <div className="text-muted small">Total Score</div>
                </div>
              </div>

              {/* Percentage */}
              <div className="col-auto">
                <div className="bg-white rounded-4 shadow-sm px-5 py-4 text-center">
                  <div className={`display-4 fw-bold ${passed ? "text-success" : "text-danger"}`}>
                    {pct}%
                  </div>
                  <div className="text-muted small">Percentage</div>
                </div>
              </div>

              {/* Grade */}
              <div className="col-auto">
                <div className="bg-white rounded-4 shadow-sm px-5 py-4 text-center">
                  <div className={`display-4 fw-bold ${grade.color}`}>{grade.label}</div>
                  <div className="text-muted small">Grade</div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 mx-auto" style={{ maxWidth: 400 }}>
              <div className="progress rounded-pill" style={{ height: 12 }}>
                <div
                  className={`progress-bar rounded-pill ${passed ? "bg-success" : "bg-danger"}`}
                  style={{ width: `${pct}%`, transition: "width 1s" }}
                />
              </div>
              <div className="d-flex justify-content-between small text-muted mt-1">
                <span>0%</span>
                <span className="fw-semibold text-dark">
                  {passed ? "✓ Passed" : "✗ Failed"} (passing: 75%)
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="row g-0 text-center border-top">
            <div className="col-3 border-end py-3">
              <div className="fw-bold text-success fs-5">{correctCount}</div>
              <div className="small text-muted">Correct</div>
            </div>
            <div className="col-3 border-end py-3">
              <div className="fw-bold text-danger fs-5">{wrongCount}</div>
              <div className="small text-muted">Wrong</div>
            </div>
            <div className="col-3 border-end py-3">
              <div className="fw-bold text-info fs-5">{essayCount}</div>
              <div className="small text-muted">Essay</div>
            </div>
            <div className="col-3 py-3">
              <div className="fw-bold text-secondary fs-5">
                {submission.submitted_at
                  ? new Date(submission.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "—"}
              </div>
              <div className="small text-muted">Submitted At</div>
            </div>
          </div>
        </div>

        {/* ── Per-question review ── */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0">Question Review</h5>
          <div className="btn-group btn-group-sm" role="group">
            {[
              { key: "all",     label: `All (${questions.length})` },
              { key: "correct", label: `✓ Correct (${correctCount})` },
              { key: "wrong",   label: `✗ Wrong (${wrongCount})` },
              { key: "essay",   label: `Essay (${essayCount})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`btn ${filter === key ? "btn-primary" : "btn-outline-secondary"} rounded-pill me-1`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="d-flex flex-column gap-4">
          {filtered.map((q, i) => {
            const isEssay   = q.type === "essay";
            const isCorrect = q.is_correct;
            const isPending = isEssay && q.is_correct === null;

            let borderColor = "border-secondary";
            if (isCorrect === true)  borderColor = "border-success";
            if (isCorrect === false) borderColor = "border-danger";
            if (isPending)           borderColor = "border-info";

            return (
              <div key={q.id} className={`card border-0 shadow-sm rounded-4 border-start border-4 ${borderColor}`}>
                <div className="card-body p-4">

                  {/* Question header */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-secondary-subtle text-secondary rounded-pill">
                        Q{q.order}
                      </span>
                      <span className="badge bg-secondary-subtle text-secondary text-capitalize rounded-pill">
                        {q.type.replace("_", " ")}
                      </span>
                      {!isEssay && isCorrect === true  && <span className="badge bg-success rounded-pill"><i className="bi bi-check-lg me-1"></i>Correct</span>}
                      {!isEssay && isCorrect === false && <span className="badge bg-danger  rounded-pill"><i className="bi bi-x-lg me-1"></i>Wrong</span>}
                      {isEssay  && <span className="badge bg-info rounded-pill"><i className="bi bi-hourglass-split me-1"></i>Pending Review</span>}
                    </div>
                    <span className="fw-bold text-muted small">
                      {q.points_earned}/{q.points} pts
                    </span>
                  </div>

                  <p className="fw-semibold mb-4" style={{ lineHeight: 1.6 }}>{q.question_text}</p>

                  {/* MC options */}
                  {q.type === "multiple_choice" && q.options && (
                    <div className="d-flex flex-column gap-2 mb-4">
                      {q.options.map((opt, oi) => {
                        const isStudentAnswer  = q.student_answer === opt;
                        const isCorrectAnswer  = q.correct_answer === opt;
                        let cls = "bg-light text-dark border border-secondary-subtle";
                        if (isCorrectAnswer) cls = "bg-success bg-opacity-15 text-success border border-success fw-semibold";
                        if (isStudentAnswer && !isCorrectAnswer) cls = "bg-danger bg-opacity-15 text-danger border border-danger";

                        return (
                          <div key={oi} className={`rounded-3 px-3 py-2 d-flex align-items-center gap-3 ${cls}`}>
                            <span className="badge rounded-circle bg-secondary-subtle text-secondary" style={{ width: 28, height: 28, lineHeight: "20px" }}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="flex-grow-1">{opt}</span>
                            {isCorrectAnswer && <i className="bi bi-check-circle-fill text-success"></i>}
                            {isStudentAnswer && !isCorrectAnswer && <i className="bi bi-x-circle-fill text-danger"></i>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* True/False answer display */}
                  {q.type === "true_false" && (
                    <div className="d-flex gap-3 mb-4">
                      {["True", "False"].map((val) => {
                        const isStudentAnswer = q.student_answer === val;
                        const isCorrectAnswer = q.correct_answer === val;
                        let cls = "btn-outline-secondary";
                        if (isCorrectAnswer) cls = "btn-success";
                        if (isStudentAnswer && !isCorrectAnswer) cls = "btn-danger";

                        return (
                          <div key={val} className={`btn flex-grow-1 rounded-3 fw-bold ${cls}`} style={{ pointerEvents: "none" }}>
                            {isCorrectAnswer && <i className="bi bi-check-circle me-2"></i>}
                            {isStudentAnswer && !isCorrectAnswer && <i className="bi bi-x-circle me-2"></i>}
                            {val}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay answer */}
                  {q.type === "essay" && (
                    <div className="mb-4">
                      <label className="small fw-semibold text-muted mb-1">Your Answer</label>
                      <div className="bg-light rounded-3 p-3 border" style={{ whiteSpace: "pre-wrap", minHeight: 80 }}>
                        {q.student_answer || <span className="text-muted fst-italic">No answer provided</span>}
                      </div>
                      {q.rubric && (
                        <div className="mt-3">
                          <label className="small fw-semibold text-muted mb-1">
                            <i className="bi bi-clipboard-check me-1"></i>Grading Rubric
                          </label>
                          <div className="bg-info bg-opacity-10 border border-info-subtle rounded-3 p-3 small">
                            {q.rubric}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Correct answer callout for wrong MC/TF */}
                  {!isEssay && isCorrect === false && (
                    <div className="alert alert-success py-2 mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-lightbulb-fill text-success"></i>
                      <span className="small">
                        <strong>Correct answer:</strong> {q.correct_answer}
                      </span>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="text-center mt-5">
          <Link to="/student/subjects" className="btn btn-primary rounded-pill px-5">
            <i className="bi bi-journal-bookmark me-2"></i>Back to My Subjects
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ExamResultsPage;