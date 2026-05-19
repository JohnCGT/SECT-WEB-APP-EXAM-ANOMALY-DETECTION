import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../../lib/api";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{
    --blue:#0056b3;--blue-lite:#e8f0fe;
    --slate:#64748b;--slate-lt:#94a3b8;
    --card-bg:#ffffff;--card-br:16px;
    --card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);
    --green:#22c55e;--red:#ef4444;--amber:#f59e0b;
  }
  .result-topbar{
    background:rgba(255,255,255,0.85);backdrop-filter:blur(16px);
    -webkit-backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(0,86,179,.08);
    position:sticky;top:0;z-index:100;height:56px;
  }
  .dash-card{
    background:var(--card-bg);border-radius:var(--card-br);
    box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);
    overflow:hidden;
  }
  .score-chip{
    background:#fff;border-radius:14px;
    box-shadow:0 2px 12px rgba(0,0,0,.08);
    padding:12px 16px;text-align:center;flex:1;min-width:80px;
  }
  .prog-track{height:8px;border-radius:99px;background:#f1f5f9;overflow:hidden;}
  .prog-fill{height:100%;border-radius:99px;transition:width 1.2s cubic-bezier(.4,0,.2,1);}
  .filter-btn{
    padding:5px 14px;border-radius:99px;border:1px solid #e2e8f0;
    font-size:12px;font-weight:600;cursor:pointer;
    background:#fff;color:var(--slate);
    transition:all .15s;font-family:'DM Sans',sans-serif;white-space:nowrap;
  }
  .filter-btn.active{background:var(--blue);color:#fff;border-color:var(--blue);}
  .filter-btn:hover:not(.active){border-color:var(--blue);color:var(--blue);}
  .q-card{
    background:var(--card-bg);border-radius:var(--card-br);
    box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);
    overflow:hidden;
  }
  .essay-box{
    background:#f8faff;border:1px solid #e2e8f0;
    border-radius:10px;padding:14px;
    font-size:13px;color:#1e293b;line-height:1.7;
    white-space:pre-wrap;min-height:60px;
  }
  .rubric-box{
    background:#eff6ff;border:1px solid #bfdbfe;
    border-radius:10px;padding:12px;font-size:12px;color:#1e40af;line-height:1.6;
  }
  .correct-callout{
    background:#f0fdf4;border:1px solid #86efac;
    border-radius:10px;padding:10px 14px;
    font-size:13px;color:#166534;display:flex;align-items:center;gap:8px;
  }
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .35s ease both;}
  .fade-up:nth-child(1){animation-delay:.04s}.fade-up:nth-child(2){animation-delay:.08s}
  .fade-up:nth-child(3){animation-delay:.12s}.fade-up:nth-child(4){animation-delay:.16s}

  /* ── Mobile overrides ── */
  @media(max-width:480px){
    .score-chip{padding:10px 8px;min-width:0;}
    .score-chip .score-val{font-size:22px!important;}
    .hero-chips{gap:8px!important;}
    .stats-footer-row > div{padding:10px 4px!important;}
    .stats-footer-row .stat-val{font-size:16px!important;}
    .q-card-inner{padding:14px 14px 16px!important;}
    .q-header{flex-direction:column;align-items:flex-start!important;gap:6px!important;}
    .q-pts{align-self:flex-end;}
    .filter-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px;}
    .filter-scroll::-webkit-scrollbar{display:none;}
    .review-header{flex-direction:column;align-items:flex-start!important;}
    .hero-banner{padding:24px 16px 20px!important;}
    .topbar-inner{padding:0 12px!important;}
    .page-wrap{padding:16px 12px 60px!important;}
    .tf-grid{gap:8px!important;}
    .badge-row{flex-wrap:wrap;gap:6px!important;}
  }
`;

const gradeLabel = (pct) => {
  if (pct >= 97) return { label:"A+", color:"#22c55e" };
  if (pct >= 93) return { label:"A",  color:"#22c55e" };
  if (pct >= 90) return { label:"A-", color:"#22c55e" };
  if (pct >= 87) return { label:"B+", color:"#0056b3" };
  if (pct >= 83) return { label:"B",  color:"#0056b3" };
  if (pct >= 80) return { label:"B-", color:"#0056b3" };
  if (pct >= 77) return { label:"C+", color:"#f59e0b" };
  if (pct >= 73) return { label:"C",  color:"#f59e0b" };
  if (pct >= 70) return { label:"C-", color:"#f59e0b" };
  return { label:"F", color:"#ef4444" };
};

const ExamResultsPage = () => {
  const { examId } = useParams();
  const navigate   = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [results, setResults] = useState(null);
  const [filter, setFilter]   = useState("all");

  useEffect(() => {
    API.get(`/student/exams/${examId}/results`)
      .then(r => setResults(r.data))
      .catch(e => setError(e.response?.data?.message || "Failed to load results."))
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f0f4fb", flexDirection:"column", gap:12 }}>
      <div className="spinner-border text-primary" role="status"/>
      <p style={{ margin:0, fontSize:13, color:"#94a3b8" }}>Loading your results…</p>
    </div>
  );

  if (error) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f0f4fb", padding:"0 16px" }}>
      <div style={{ textAlign:"center" }}>
        <i className="bi bi-exclamation-circle" style={{ fontSize:48, color:"#ef4444", display:"block", marginBottom:12 }}></i>
        <h2 style={{ fontSize:18, fontWeight:700, color:"#0f172a", margin:"0 0 8px" }}>{error}</h2>
        <button onClick={() => navigate(-1)} style={{
          background:"#0056b3", color:"#fff", border:"none", borderRadius:10,
          padding:"8px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif"
        }}>Go Back</button>
      </div>
    </div>
  );

  const { submission, exam, questions } = results;
  const pct     = submission.percentage;
  const passed  = pct >= 75;
  const grade   = gradeLabel(pct);

  const norm = (v) => String(v ?? "").trim().toLowerCase();

  const deriveIsCorrect = (q) => {
    if (q.type === "essay") {
      if (q.is_correct === true  || q.is_correct === 1 || q.is_correct === "1") return true;
      if (q.is_correct === false || q.is_correct === 0 || q.is_correct === "0") return false;
      if (q.points_earned != null) return q.points_earned > 0 ? true : false;
      return null; 
    }

    if (q.student_answer != null && q.correct_answer != null) {
      return norm(q.student_answer) === norm(q.correct_answer);
    }
    if (q.student_answer == null || norm(q.student_answer) === "") return false;

    if (q.is_correct === true  || q.is_correct === 1 || q.is_correct === "1") return true;
    if (q.is_correct === false || q.is_correct === 0 || q.is_correct === "0") return false;
    return null;
  };

  const isEssayGraded = (q) => {
    if (q.type !== "essay") return false;
    if (q.points_earned != null) return true;
    if (q.is_correct === true || q.is_correct === 1 || q.is_correct === "1") return true;
    if (q.is_correct === false || q.is_correct === 0 || q.is_correct === "0") return true;
    return false;
  };

  const normalizedQuestions = questions.map(q => ({
    ...q,
    is_correct: deriveIsCorrect(q),
    _essay_graded: isEssayGraded(q),
  }));

  const correctCount = normalizedQuestions.filter(q => q.is_correct === true).length;
  const wrongCount   = normalizedQuestions.filter(q => q.is_correct === false).length;
  const essayCount   = normalizedQuestions.filter(q => q.type === "essay").length;

  const filtered = normalizedQuestions.filter(q => {
    if (filter === "correct") return q.is_correct === true;
    if (filter === "wrong")   return q.is_correct === false;
    if (filter === "essay")   return q.type === "essay";
    return true;
  });

  const heroGrad = passed
    ? "linear-gradient(135deg, #0056b3 0%, #1a6ed8 60%, #4d90fe 100%)"
    : "linear-gradient(135deg, #dc2626 0%, #ef4444 60%, #f87171 100%)";

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ background:"#f0f4fb", minHeight:"100vh" }}>

        {/* Topbar */}
        <div className="result-topbar d-flex align-items-center gap-3 topbar-inner" style={{ padding:"0 16px" }}>
          <button onClick={() => navigate(-1)} style={{
            display:"flex", alignItems:"center", gap:6,
            background:"transparent", border:"1px solid #e2e8f0", borderRadius:10,
            padding:"5px 12px", fontSize:12, fontWeight:600, color:"#64748b",
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"border-color .15s,color .15s",
            flexShrink:0
          }} onMouseEnter={e=>{e.currentTarget.style.borderColor="#0056b3";e.currentTarget.style.color="#0056b3"}}
             onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#64748b"}}>
            <i className="bi bi-arrow-left"></i><span className="d-none d-sm-inline">Back</span>
          </button>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:15, color:"#0056b3", letterSpacing:"-.3px", flexShrink:0 }}>
            SECT Portal
          </span>
          <Link to="/student/subjects" style={{
            marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
            background:"#e8f0fe", color:"#0056b3", borderRadius:10, padding:"5px 12px",
            fontSize:12, fontWeight:700, textDecoration:"none", flexShrink:0
          }}>
            <i className="bi bi-journal-bookmark"></i>
            <span className="d-none d-sm-inline">My Subjects</span>
          </Link>
        </div>

        <div className="page-wrap" style={{ maxWidth:860, margin:"0 auto", padding:"28px 16px", paddingBottom:60 }}>

          {/* ── Hero score card ── */}
          <div className="dash-card fade-up" style={{ marginBottom:20, overflow:"visible" }}>
            <div className="hero-banner" style={{
              background:heroGrad, padding:"32px 28px 28px",
              position:"relative", overflow:"hidden"
            }}>
              <div style={{ position:"absolute", right:-40, top:-40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,.07)" }}/>
              <div style={{ position:"absolute", right:40, bottom:-60, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,.04)" }}/>

              <div style={{ textAlign:"center", marginBottom:12 }}>
                <i className={`bi ${passed ? "bi-trophy-fill" : "bi-emoji-frown"}`}
                  style={{ fontSize:44, color:"rgba(255,255,255,.9)" }}></i>
              </div>
              <h2 style={{ margin:"0 0 4px", fontSize:18, fontWeight:700, color:"#fff", textAlign:"center", lineHeight:1.3 }}>{exam.title}</h2>
              <p style={{ margin:"0 0 20px", fontSize:12, color:"rgba(255,255,255,.65)", textAlign:"center", textTransform:"capitalize" }}>{exam.type}</p>

              {/* Score chips */}
              <div className="hero-chips" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
                {[
                  { label:"Score", val:<><span className="score-val" style={{fontSize:28,fontWeight:700,color:"#0f172a",lineHeight:1,letterSpacing:"-1px"}}>{submission.score}</span><span style={{fontSize:14,fontWeight:400,color:"#94a3b8"}}>/{submission.total_points}</span></>, color:"#0f172a" },
                  { label:"Percentage", val:pct+"%", color:passed?"#22c55e":"#ef4444" },
                  { label:"Grade", val:grade.label, color:grade.color },
                ].map((s,i) => (
                  <div key={i} className="score-chip">
                    {i === 0
                      ? <div style={{ lineHeight:1, letterSpacing:"-1px" }}>{s.val}</div>
                      : <div className="score-val" style={{ fontSize:28, fontWeight:700, color:s.color, lineHeight:1, letterSpacing:"-1px" }}>{s.val}</div>
                    }
                    <div style={{ fontSize:11, fontWeight:600, color:"#94a3b8", marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div style={{ marginTop:20 }}>
                <div className="prog-track" style={{ background:"rgba(255,255,255,.2)" }}>
                  <div className="prog-fill" style={{ width:`${pct}%`, background:"#fff" }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:5, fontSize:11, color:"rgba(255,255,255,.6)" }}>
                  <span>0%</span>
                  <span style={{ fontWeight:700, color:"#fff" }}>{passed ? "✓ Passed" : "✗ Failed"} (passing: 75%)</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Stats footer row */}
            <div className="stats-footer-row" style={{ display:"flex", borderTop:"1px solid #f1f5f9" }}>
              {[
                { val:correctCount, label:"Correct",   color:"#22c55e" },
                { val:wrongCount,   label:"Wrong",     color:"#ef4444" },
                { val:essayCount,   label:"Essay",     color:"#0ea5e9" },
                { val:submission.submitted_at
                    ? new Date(submission.submitted_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})
                    : "—",
                  label:"Submitted", color:"#64748b" },
              ].map((s,i) => (
                <div key={i} style={{
                  flex:1, textAlign:"center", padding:"14px 8px",
                  borderRight: i < 3 ? "1px solid #f1f5f9" : "none"
                }}>
                  <div className="stat-val" style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:"#94a3b8", marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Question Review header + filters ── */}
          <div className="review-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
            <div>
              <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Question Review</h2>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#94a3b8" }}>{filtered.length} of {questions.length} questions shown</p>
            </div>
            <div className="filter-scroll" style={{ display:"flex", gap:6, flexWrap:"nowrap" }}>
              {[
                { key:"all",     label:`All (${questions.length})` },
                { key:"correct", label:`✓ Correct (${correctCount})` },
                { key:"wrong",   label:`✗ Wrong (${wrongCount})` },
                { key:"essay",   label:`Essay (${essayCount})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={`filter-btn${filter === key ? " active" : ""}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {filtered.map((q, idx) => {
              const isEssay    = q.type === "essay";
              const isCorrect  = q.is_correct;
              const isGraded   = q._essay_graded;   
              const isPending  = isEssay && !isGraded; 

              const accentColor = isEssay               ? "#388bf0"   
                                : isCorrect === true  ? "#22c55e"
                                : isCorrect === false ? "#ef4444"
                                : "#e2e8f0";

              return (
                <div key={q.id} className="q-card fade-up"
                  style={{ animationDelay:`${idx * 0.04}s`, borderLeft:`4px solid ${accentColor}` }}>
                  <div className="q-card-inner" style={{ padding:"18px 20px 20px" }}>

                    {/* Q header */}
                    <div className="q-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12, flexWrap:"wrap", gap:8 }}>
                      <div className="badge-row" style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ background:"#f1f5f9", color:"#64748b", borderRadius:99, padding:"2px 9px", fontSize:11, fontWeight:700 }}>
                          Q{q.order}
                        </span>
                        <span style={{ background:"#f1f5f9", color:"#64748b", borderRadius:99, padding:"2px 9px", fontSize:11, fontWeight:600, textTransform:"capitalize" }}>
                          {q.type.replace("_"," ")}
                        </span>

                        {/* ── Status badge ── */}
                        {!isEssay && isCorrect === true && (
                          <span style={{ background:"#f0fdf4", color:"#22c55e", borderRadius:99, padding:"2px 9px", fontSize:11, fontWeight:700 }}>
                            <i className="bi bi-check-lg me-1"></i>Correct
                          </span>
                        )}
                        {!isEssay && isCorrect === false && (
                          <span style={{ background:"#fef2f2", color:"#ef4444", borderRadius:99, padding:"2px 9px", fontSize:11, fontWeight:700 }}>
                            <i className="bi bi-x-lg me-1"></i>Wrong
                          </span>
                        )}

                        {isEssay && isGraded && (
                          <span style={{ background:"#dbe8f5", color:"#0068fa", borderRadius:99, padding:"2px 9px", fontSize:11, fontWeight:700 }}>
                            <i className="bi bi-patch-check-fill me-1"></i>Graded
                          </span>
                        )}
                        {isEssay && isPending && (
                          <span style={{ background:"#dbe8f5", color:"#0068fa", borderRadius:99, padding:"2px 9px", fontSize:11, fontWeight:700 }}>
                            <i className="bi bi-hourglass-split me-1"></i>Pending Review
                          </span>
                        )}
                      </div>

                      {/* Points */}
                      <span className="q-pts" style={{
                        fontSize:12, fontWeight:700, flexShrink:0,
                        color: isEssay ? "#64748b" : isCorrect === true ? "#22c55e" : isCorrect === false ? "#ef4444" : "#94a3b8"
                      }}>
                        {(() => {
                          if (isPending) return <>—/{q.points} pts</>;
                          const earned =
                            q.points_earned != null
                              ? q.points_earned
                              : isCorrect === true
                                ? q.points
                                : 0;
                          return <>{earned}/{q.points} pts</>;
                        })()}
                      </span>
                    </div>

                    {/* Question text */}
                    <p style={{ margin:"0 0 16px", fontSize:14, fontWeight:600, color:"#0f172a", lineHeight:1.65 }}>{q.question_text}</p>

                    {/* Multiple Choice */}
                    {q.type === "multiple_choice" && q.options && (
                      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                        {q.options.map((opt, oi) => {
                          const isSA = norm(q.student_answer) === norm(opt);
                          const isCA = norm(q.correct_answer) === norm(opt);

                          let rowBg="#f8faff", rowBorder="#e2e8f0", textColor="#64748b", badgeBg="#f1f5f9", badgeColor="#94a3b8";
                          if (isCA)          { rowBg="#f0fdf4"; rowBorder="#86efac"; textColor="#166534"; badgeBg="#dcfce7"; badgeColor="#22c55e"; }
                          if (isSA && !isCA) { rowBg="#fef2f2"; rowBorder="#fca5a5"; textColor="#991b1b"; badgeBg="#fee2e2"; badgeColor="#ef4444"; }

                          return (
                            <div key={oi} style={{
                              display:"flex", alignItems:"center", gap:10,
                              padding:"10px 12px", borderRadius:10,
                              border:`1px solid ${rowBorder}`, background:rowBg,
                              transition:"all .15s", flexWrap:"nowrap"
                            }}>
                              <div style={{
                                width:26, height:26, borderRadius:"50%",
                                display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize:11, fontWeight:700, flexShrink:0,
                                background:badgeBg, color:badgeColor
                              }}>
                                {String.fromCharCode(65 + oi)}
                              </div>
                              <span style={{ flex:1, fontSize:13, fontWeight: isCA ? 600 : 400, color:textColor, minWidth:0 }}>
                                {opt}
                              </span>
                              <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end" }}>
                                {isCA && (
                                  <span style={{ display:"flex", alignItems:"center", gap:4, background:"#dcfce7", color:"#22c55e", borderRadius:99, padding:"2px 7px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
                                    <i className="bi bi-check-circle-fill"></i>
                                    <span className="d-none d-sm-inline">Correct</span>
                                  </span>
                                )}
                                {isSA && isCA && (
                                  <span style={{ display:"flex", alignItems:"center", gap:4, background:"#e8f0fe", color:"#0056b3", borderRadius:99, padding:"2px 7px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
                                    <span className="d-none d-sm-inline">Your answer</span>
                                    <span className="d-inline d-sm-none">Yours</span>
                                  </span>
                                )}
                                {isSA && !isCA && (
                                  <span style={{ display:"flex", alignItems:"center", gap:4, background:"#fee2e2", color:"#ef4444", borderRadius:99, padding:"2px 7px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
                                    <i className="bi bi-x-circle-fill"></i>
                                    <span className="d-none d-sm-inline">Your answer</span>
                                    <span className="d-inline d-sm-none">Yours</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* True / False */}
                    {q.type === "true_false" && (
                      <div style={{ marginBottom:16 }}>
                        <div className="tf-grid" style={{ display:"flex", gap:10 }}>
                          {["True","False"].map(val => {
                            const isSA = norm(q.student_answer) === norm(val);
                            const isCA = norm(q.correct_answer) === norm(val);

                            let bg="#f8faff", border="#e2e8f0", color="#94a3b8", fontW=500;
                            if (isCA)          { bg="#f0fdf4"; border="#86efac"; color="#22c55e"; fontW=700; }
                            if (isSA && !isCA) { bg="#fef2f2"; border="#fca5a5"; color="#ef4444"; fontW=700; }

                            return (
                              <div key={val} style={{
                                flex:1, padding:"12px 10px", borderRadius:10,
                                border:`1px solid ${border}`, background:bg,
                                display:"flex", flexDirection:"column", alignItems:"center", gap:4
                              }}>
                                <div style={{ display:"flex", alignItems:"center", gap:6, color, fontSize:14, fontWeight:fontW }}>
                                  <i className={`bi ${val==="True" ? "bi-check-circle" : "bi-x-circle"}`}></i>
                                  {val}
                                </div>
                                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, marginTop:2 }}>
                                  {isCA && (
                                    <span style={{ fontSize:10, fontWeight:700, color:"#22c55e", background:"#dcfce7", borderRadius:99, padding:"1px 7px", whiteSpace:"nowrap" }}>
                                      ✓ Correct
                                    </span>
                                  )}
                                  {isSA && isCA && (
                                    <span style={{ fontSize:10, fontWeight:600, color:"#0056b3", background:"#e8f0fe", borderRadius:99, padding:"1px 7px", whiteSpace:"nowrap" }}>
                                      Your answer
                                    </span>
                                  )}
                                  {isSA && !isCA && (
                                    <span style={{ fontSize:10, fontWeight:700, color:"#ef4444", background:"#fee2e2", borderRadius:99, padding:"1px 7px", whiteSpace:"nowrap" }}>
                                      ✗ Yours
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {isCorrect === false && (
                          <div style={{
                            marginTop:10, display:"flex", alignItems:"center", gap:8,
                            background:"#f0fdf4", border:"1px solid #86efac",
                            borderRadius:10, padding:"9px 14px", fontSize:13, color:"#166534"
                          }}>
                            <i className="bi bi-lightbulb-fill" style={{ color:"#22c55e", flexShrink:0 }}></i>
                            <span>The correct answer is <strong>{q.correct_answer}</strong>.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Essay */}
                    {q.type === "essay" && (
                      <div style={{ marginBottom:16 }}>
                        <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, color:"#8093ac", textTransform:"uppercase", letterSpacing:".04em" }}>Your Answer</p>
                        <div className="essay-box">
                          {q.student_answer || <span style={{ color:"#94a3b8", fontStyle:"italic" }}>No answer provided</span>}
                        </div>

                        {q.rubric && (
                          <div style={{ marginTop:10 }}>
                            <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".04em" }}>
                              <i className="bi bi-clipboard-check me-1"></i>Grading Rubric
                            </p>
                            <div className="rubric-box">{q.rubric}</div>
                          </div>
                        )}

                        {q.feedback && (
                          <div style={{ marginTop:10 }}>
                            <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, color:"#8093ac", textTransform:"uppercase", letterSpacing:".04em" }}>
                              <i className="bi bi-chat-left-text me-1"></i>Instructor Feedback
                            </p>
                            <div style={{
                              background:"#f8faff", border:"1px solid #bfdbfe",
                              borderRadius:10, padding:"12px 14px",
                              fontSize:13, color:"#1e40af", lineHeight:1.7
                            }}>{q.feedback}</div>
                          </div>
                        )}

                        {isEssay && isGraded && (
                          <div style={{
                            marginTop:12, display:"flex", alignItems:"center", gap:8,
                            background:"#f8fafc", border:"1px solid #e2e8f0",
                            borderRadius:10, padding:"9px 14px", fontSize:13, color:"#475569"
                          }}>
                            <i className="bi bi-patch-check-fill" style={{ color:"#94a3b8", flexShrink:0 }}></i>
                            <span>Points: <strong>{q.points_earned != null ? q.points_earned : "—"}/{q.points}</strong></span>
                          </div>
                        )}
                      </div>
                    )}

                    {!isEssay && q.type === "multiple_choice" && isCorrect === false && (
                      <div className="correct-callout">
                        <i className="bi bi-lightbulb-fill" style={{ color:"#22c55e", flexShrink:0 }}></i>
                        <span>The correct answer is <strong>{q.correct_answer}</strong>.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign:"center", marginTop:40 }}>
            <Link to="/student/subjects" style={{
              display:"inline-flex", alignItems:"center", gap:8,
              background:"#0056b3", color:"#fff", borderRadius:10,
              padding:"11px 32px", fontSize:13, fontWeight:700, textDecoration:"none",
              transition:"opacity .15s"
            }} onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
               onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              <i className="bi bi-journal-bookmark"></i>Back to My Subjects
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExamResultsPage;