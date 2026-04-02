import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";
import { AnomalyCollector } from "../../anomalyCollector";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{
    --blue:#0056b3;--blue-lite:#e8f0fe;
    --slate:#64748b;--slate-lt:#94a3b8;
    --card-bg:#ffffff;--card-br:16px;
    --card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);
  }

  /* Exam topbar — glass */
  .exam-topbar{
    background:rgba(255,255,255,0.88);
    backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(0,86,179,.08);
    position:sticky;top:0;z-index:100;
  }
  .exam-topbar-inner{
    display:flex;align-items:center;justify-content:space-between;
    padding:10px 20px;gap:12px;
  }

  /* Progress bar */
  .progress-rail{height:3px;background:#e2e8f0;overflow:hidden;}
  .progress-fill{height:100%;background:#0056b3;transition:width .4s cubic-bezier(.4,0,.2,1);}

  /* Timer */
  .timer{
    font-family:'DM Mono',monospace;font-size:22px;font-weight:500;
    letter-spacing:-0.5px;line-height:1;
  }
  .timer.green {color:#22c55e;}
  .timer.amber {color:#f59e0b;}
  .timer.red   {color:#ef4444;}

  /* Question nav dot */
  .q-dot{
    width:36px;height:36px;border-radius:9px;border:none;
    font-size:12px;font-weight:700;cursor:pointer;
    transition:background .15s,transform .15s,box-shadow .15s;
    font-family:'DM Sans',sans-serif;
  }
  .q-dot:hover{transform:scale(1.08);}
  .q-dot.unanswered{background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;}
  .q-dot.answered{background:#e8f0fe;color:#0056b3;border:1px solid #bfdbfe;}
  .q-dot.current{background:#0056b3;color:#fff;box-shadow:0 3px 10px rgba(0,86,179,.35);}

  /* Question card */
  .q-card{
    background:var(--card-bg);border-radius:var(--card-br);
    box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);
    overflow:hidden;
  }

  /* MC option button */
  .mc-opt{
    display:flex;align-items:center;gap:14px;
    padding:13px 16px;border-radius:11px;
    border:1.5px solid #e2e8f0;background:#fafbff;
    cursor:pointer;font-family:'DM Sans',sans-serif;
    font-size:13px;font-weight:500;color:#1e293b;
    text-align:left;width:100%;
    transition:border-color .15s,background .15s,transform .1s;
  }
  .mc-opt:hover:not(.selected){border-color:#93c5fd;background:#f0f7ff;transform:translateX(2px);}
  .mc-opt.selected{border-color:#0056b3;background:#e8f0fe;color:#0056b3;font-weight:600;}
  .mc-letter{
    width:28px;height:28px;border-radius:8px;
    display:flex;align-items:center;justify-content:center;
    font-size:12px;font-weight:700;flex-shrink:0;
    background:#f1f5f9;color:#64748b;transition:background .15s,color .15s;
  }
  .mc-opt.selected .mc-letter{background:#0056b3;color:#fff;}

  /* TF button */
  .tf-btn{
    flex:1;display:flex;align-items:center;justify-content:center;gap:8px;
    padding:14px;border-radius:11px;border:1.5px solid #e2e8f0;
    background:#fafbff;cursor:pointer;font-size:15px;font-weight:700;
    font-family:'DM Sans',sans-serif;color:#64748b;
    transition:all .15s;
  }
  .tf-btn.true-sel{border-color:#22c55e;background:#f0fdf4;color:#22c55e;}
  .tf-btn.false-sel{border-color:#ef4444;background:#fef2f2;color:#ef4444;}
  .tf-btn:hover:not(.true-sel):not(.false-sel){border-color:#93c5fd;background:#f0f7ff;color:#0056b3;}

  /* Essay textarea */
  .essay-ta{
    width:100%;border:1.5px solid #e2e8f0;border-radius:11px;
    padding:14px;font-size:14px;color:#1e293b;outline:none;
    font-family:'DM Sans',sans-serif;resize:vertical;background:#fafbff;
    transition:border-color .2s,box-shadow .2s;line-height:1.65;
  }
  .essay-ta:focus{border-color:#0056b3;box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}

  /* Submit button */
  .submit-btn{
    display:flex;align-items:center;gap:7px;
    background:#0056b3;color:#fff;border:none;
    border-radius:10px;padding:8px 18px;
    font-size:13px;font-weight:700;cursor:pointer;
    font-family:'DM Sans',sans-serif;transition:opacity .15s;
    white-space:nowrap;
  }
  .submit-btn:hover{opacity:.85;}
  .submit-btn:disabled{opacity:.5;cursor:not-allowed;}

  /* Nav button */
  .nav-btn{
    display:flex;align-items:center;gap:6px;
    border:1.5px solid #e2e8f0;background:#fff;color:#64748b;
    border-radius:10px;padding:9px 18px;
    font-size:13px;font-weight:600;cursor:pointer;
    font-family:'DM Sans',sans-serif;transition:all .15s;
  }
  .nav-btn:hover:not(:disabled){border-color:#0056b3;color:#0056b3;}
  .nav-btn:disabled{opacity:.4;cursor:not-allowed;}
  .nav-btn.primary{background:#0056b3;color:#fff;border-color:#0056b3;}
  .nav-btn.primary:hover{background:#1a6ed8;border-color:#1a6ed8;}
  .nav-btn.success{background:#22c55e;color:#fff;border-color:#22c55e;}
  .nav-btn.success:hover{background:#16a34a;border-color:#16a34a;}

  /* Sidebar navigator card */
  .nav-card{
    background:#fff;border-radius:var(--card-br);
    box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);
    padding:18px;position:sticky;top:80px;
  }

  /* Mobile nav drawer */
  .mobile-drawer{
    background:#fff;border-bottom:1px solid #e2e8f0;
    padding:14px 16px;
  }

  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .25s ease both;}
`;

const TakeExamPage = () => {
  const { examId } = useParams();
  const navigate   = useNavigate();

  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exam, setExam]             = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [answers, setAnswers]       = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft]     = useState(null);
  const [showNav, setShowNav]       = useState(false);

  const timerRef     = useRef(null);
  const collectorRef = useRef(null);
  const essayRefs    = useRef({});

  useEffect(() => {
    (async () => {
      try {
        const res = await API.post(`/student/exams/${examId}/start`);
        const { exam: examData, questions: qs, submission } = res.data;
        setExam(examData);
        setQuestions(qs);

        const startedAt  = new Date(submission.started_at).getTime();
        const durationMs = examData.duration_minutes * 60 * 1000;
        const hardEnd    = Math.min(startedAt + durationMs, new Date(examData.end_time).getTime());
        setTimeLeft(Math.max(0, Math.floor((hardEnd - Date.now()) / 1000)));

        collectorRef.current = new AnomalyCollector({ examId:parseInt(examId), apiBaseUrl:"/api", onWarning:handleAnomalyWarning });
        collectorRef.current.start();
        if (qs.length > 0) collectorRef.current.setCurrentQuestion(qs[0].id);
        for (const [qId, el] of Object.entries(essayRefs.current)) {
          if (el) collectorRef.current.attachToAnswerField(el, parseInt(qId));
        }
      } catch (err) {
        await Swal.fire("Cannot Start Exam", err.response?.data?.message || "Failed to start exam.", "error");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
    return () => { clearInterval(timerRef.current); collectorRef.current?.stop(); };
  }, [examId]);

  const handleAnomalyWarning = useCallback((type, severity) => {
    // keyboard_shortcut (copy/paste/cut) is recorded silently — no toast shown to student
    if (type === "keyboard_shortcut") return;

    const labels = {
      tab_switch:         "Tab switching detected",
      response_time:      "Unusual response time",
      keystroke_dynamics: "Unusual typing pattern",
    };
    Swal.mixin({ toast:true, position:"top-end", showConfirmButton:false, timer:4000, timerProgressBar:true })
      .fire({ icon:severity==="high"?"error":"warning", title:labels[type]??"Suspicious activity detected", text:"This has been logged and will be reviewed." });
  }, []);

  const handleQuestionChange = useCallback((newIdx) => {
    const leaving  = questions[currentIdx];
    const entering = questions[newIdx];
    if (collectorRef.current && leaving)  collectorRef.current.recordResponseTime(leaving.id);
    setCurrentIdx(newIdx);
    if (collectorRef.current && entering) collectorRef.current.setCurrentQuestion(entering.id);
    setShowNav(false);
  }, [currentIdx, questions]);

  const essayCallbackRef = useCallback((el, questionId) => {
    if (!el) return;
    essayRefs.current[questionId] = el;
    if (collectorRef.current) collectorRef.current.attachToAnswerField(el, questionId);
  }, []);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft !== null]);

  useEffect(() => { if (timeLeft === 0) handleSubmit(true); }, [timeLeft]);

  const formatTime = (s) => s === null ? "--:--"
    : `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  const timerClass = () => timeLeft === null ? "green" : timeLeft <= 60 ? "red" : timeLeft <= 300 ? "amber" : "green";

  const setAnswer = (qId, val) => setAnswers(p => ({ ...p, [qId]:val }));

  const answeredCount = questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== "").length;

  const handleSubmit = useCallback(async (isAuto = false) => {
    if (submitting) return;
    if (!isAuto) {
      const unanswered = questions.length - answeredCount;
      const result = await Swal.fire({
        title:"Submit Exam?",
        text: unanswered > 0 ? `You have ${unanswered} unanswered question${unanswered>1?"s":""}. Submit anyway?` : "Are you sure you want to submit?",
        icon:"question", showCancelButton:true,
        confirmButtonText:"Yes, submit!", confirmButtonColor:"#0056b3",
        cancelButtonColor:"#e2e8f0",
        customClass:{ popup:"rounded-4" }
      });
      if (!result.isConfirmed) return;
    }
    setSubmitting(true);
    clearInterval(timerRef.current);
    if (collectorRef.current && questions[currentIdx]) collectorRef.current.recordResponseTime(questions[currentIdx].id);
    collectorRef.current?.stop();
    try {
      await API.post(`/student/exams/${examId}/submit`, { answers });
      Swal.fire({ title:"Submitted!", text:"Your exam has been submitted successfully.", icon:"success",
        confirmButtonText:"View Results", confirmButtonColor:"#22c55e" })
        .then(() => navigate(`/student/exams/${examId}/results`));
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to submit.", "error");
      setSubmitting(false);
    }
  }, [answers, questions, submitting, examId, navigate, currentIdx, answeredCount]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f0f4fb", flexDirection:"column", gap:14 }}>
      <div className="spinner-border text-primary" role="status" />
      <p style={{ margin:0, fontSize:13, color:"#94a3b8", fontFamily:"'DM Sans',sans-serif" }}>Preparing your exam…</p>
    </div>
  );

  const currentQ = questions[currentIdx];
  const pctDone  = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ background:"#f0f4fb", minHeight:"100vh" }}>

        {/* ── Fixed exam topbar ── */}
        <div className="exam-topbar">
          <div className="exam-topbar-inner">
            {/* Left: exam title + progress */}
            <div style={{ minWidth:0 }}>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {exam?.title}
              </p>
              <p style={{ margin:0, fontSize:11, color:"#94a3b8" }}>
                {answeredCount}/{questions.length} answered
              </p>
            </div>

            {/* Center: timer */}
            <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
              <i className="bi bi-clock" style={{ fontSize:14, color:timeLeft !== null && timeLeft <= 60 ? "#ef4444" : "#64748b" }}></i>
              <span className={`timer ${timerClass()}`}>{formatTime(timeLeft)}</span>
              {timeLeft !== null && timeLeft <= 60 && (
                <span style={{ background:"#fef2f2", color:"#ef4444", borderRadius:99, padding:"1px 7px", fontSize:10, fontWeight:700 }}>HURRY</span>
              )}
            </div>

            {/* Right: controls */}
            <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
              {/* Mobile nav toggle */}
              <button onClick={() => setShowNav(v => !v)} style={{
                background: showNav ? "#e8f0fe" : "#f1f5f9",
                border:"none", borderRadius:9, padding:"7px 10px",
                color: showNav ? "#0056b3" : "#64748b",
                cursor:"pointer", transition:"all .15s"
              }} className="d-lg-none">
                <i className="bi bi-grid-3x3" style={{ fontSize:15 }}></i>
              </button>
              <button className="submit-btn" onClick={() => handleSubmit(false)} disabled={submitting}>
                {submitting
                  ? <span className="spinner-border spinner-border-sm" />
                  : <><i className="bi bi-check2-circle"></i><span className="d-none d-sm-inline">Submit Exam</span></>}
              </button>
            </div>
          </div>

          {/* Progress rail */}
          <div className="progress-rail">
            <div className="progress-fill" style={{ width:`${pctDone}%` }} />
          </div>
        </div>

        {/* Mobile question navigator drawer */}
        {showNav && (
          <div className="mobile-drawer d-lg-none">
            <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>
              Jump to Question
            </p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {questions.map((q, i) => {
                const answered  = answers[q.id] !== undefined && answers[q.id] !== "";
                const isCurrent = i === currentIdx;
                return (
                  <button key={q.id} onClick={() => handleQuestionChange(i)}
                    className={`q-dot ${isCurrent ? "current" : answered ? "answered" : "unanswered"}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
            {/* Legend */}
            <div style={{ display:"flex", gap:14, marginTop:10, flexWrap:"wrap" }}>
              {[
                { cls:"current",    label:"Current"    },
                { cls:"answered",   label:"Answered"   },
                { cls:"unanswered", label:"Unanswered" },
              ].map(l => (
                <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div className={`q-dot ${l.cls}`} style={{ width:12, height:12, borderRadius:4, cursor:"default" }}></div>
                  <span style={{ fontSize:11, color:"#94a3b8", fontWeight:500 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 16px", paddingBottom:48 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:20 }} className="exam-layout">
            <style>{`
              @media(min-width:992px){
                .exam-layout{grid-template-columns:1fr 260px !important;}
              }
            `}</style>

            {/* ── Question card ── */}
            <div className="q-card fade-up" style={{ order:1 }}>
              {currentQ && (
                <div style={{ padding:"24px 24px 28px" }}>
                  {/* Q header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                    <span style={{ background:"#e8f0fe", color:"#0056b3", borderRadius:99, padding:"4px 14px", fontSize:12, fontWeight:700 }}>
                      Question {currentIdx + 1} of {questions.length}
                    </span>
                    <span style={{ background:"#f8faff", color:"#64748b", border:"1px solid #e2e8f0", borderRadius:99, padding:"4px 12px", fontSize:12, fontWeight:600 }}>
                      {currentQ.points} pt{currentQ.points !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Question text */}
                  <h2 style={{ margin:"0 0 24px", fontSize:16, fontWeight:700, color:"#0f172a", lineHeight:1.65 }}>
                    {currentQ.question_text}
                  </h2>

                  {/* Multiple Choice */}
                  {currentQ.type === "multiple_choice" && (
                    <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:8 }}>
                      {(currentQ.options || []).map((opt, oi) => {
                        const selected = answers[currentQ.id] === opt;
                        return (
                          <button key={oi} onClick={() => setAnswer(currentQ.id, opt)}
                            className={`mc-opt${selected ? " selected" : ""}`}>
                            <div className="mc-letter">{String.fromCharCode(65 + oi)}</div>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* True / False */}
                  {currentQ.type === "true_false" && (
                    <div style={{ display:"flex", gap:12, marginBottom:8 }}>
                      {["True","False"].map(val => {
                        const selected = answers[currentQ.id] === val;
                        return (
                          <button key={val} onClick={() => setAnswer(currentQ.id, val)}
                            className={`tf-btn ${selected ? (val==="True"?"true-sel":"false-sel") : ""}`}>
                            <i className={`bi ${val==="True"?"bi-check-circle":"bi-x-circle"}`}></i>
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay */}
                  {currentQ.type === "essay" && (
                    <div style={{ marginBottom:8 }}>
                      <textarea
                        ref={el => essayCallbackRef(el, currentQ.id)}
                        className="essay-ta"
                        rows={8}
                        placeholder="Write your answer here…"
                        value={answers[currentQ.id] || ""}
                        onChange={e => setAnswer(currentQ.id, e.target.value)}
                      />
                      {currentQ.max_words && (
                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:"#94a3b8" }}>
                          <span>Max: {currentQ.max_words} words</span>
                          <span>{(answers[currentQ.id]||"").trim().split(/\s+/).filter(Boolean).length} words typed</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:28, paddingTop:20, borderTop:"1px solid #f1f5f9" }}>
                    <button className="nav-btn" onClick={() => handleQuestionChange(Math.max(0, currentIdx-1))}
                      disabled={currentIdx === 0}>
                      <i className="bi bi-arrow-left"></i>Previous
                    </button>

                    {currentIdx < questions.length - 1 ? (
                      <button className="nav-btn primary" onClick={() => handleQuestionChange(currentIdx+1)}>
                        Next<i className="bi bi-arrow-right"></i>
                      </button>
                    ) : (
                      <button className="nav-btn success" onClick={() => handleSubmit(false)} disabled={submitting}>
                        <i className="bi bi-check2-circle"></i>Submit Exam
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Desktop sidebar: question navigator ── */}
            <div className="nav-card d-none d-lg-block" style={{ order:2 }}>
              <p style={{ margin:"0 0 12px", fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>
                Questions
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {questions.map((q, i) => {
                  const answered  = answers[q.id] !== undefined && answers[q.id] !== "";
                  const isCurrent = i === currentIdx;
                  return (
                    <button key={q.id} onClick={() => handleQuestionChange(i)}
                      className={`q-dot ${isCurrent ? "current" : answered ? "answered" : "unanswered"}`}
                      title={`Question ${i+1}${answered ? " (answered)" : ""}`}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #f1f5f9", display:"flex", flexDirection:"column", gap:7 }}>
                {[
                  { cls:"current",    label:"Current",    color:"#0056b3" },
                  { cls:"answered",   label:"Answered",   color:"#0056b3" },
                  { cls:"unanswered", label:"Unanswered", color:"#94a3b8" },
                ].map(l => (
                  <div key={l.label} style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <div className={`q-dot ${l.cls}`} style={{ width:14, height:14, borderRadius:4, cursor:"default", flexShrink:0 }}></div>
                    <span style={{ fontSize:12, color:"#64748b", fontWeight:500 }}>{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Progress summary */}
              <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8" }}>Progress</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#0056b3" }}>{answeredCount}/{questions.length}</span>
                </div>
                <div style={{ height:5, borderRadius:99, background:"#eef2ff", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pctDone}%`, background:"#0056b3", borderRadius:99, transition:"width .4s" }}/>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default TakeExamPage;