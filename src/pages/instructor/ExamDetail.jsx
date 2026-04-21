import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";

// ─── Constants ────────────────────────────────────────────────────────────────
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
const QTYPE_ICON = {
  multiple_choice: "bi-ui-radios",
  true_false:      "bi-toggle-on",
  essay:           "bi-textarea",
};

const riskColor   = (s) => s >= 50 ? "text-danger"  : s >= 20 ? "text-warning"  : "text-success";
const riskBgClass = (s) => s >= 50 ? "bg-danger"    : s >= 20 ? "bg-warning"    : "bg-success";
const cpiLabel    = (s) => s >= 75 ? "Highly Likely" : s >= 50 ? "Likely" : s >= 25 ? "Possible" : "Unlikely";

// An essay is graded ONLY when the instructor has explicitly set points_earned.
// null = not yet graded. 0 = graded zero (valid).
const isEssayGraded = (e) => e.points_earned !== null && e.points_earned !== undefined;

// ─── jsPDF (CDN, on-demand) ───────────────────────────────────────────────────
let jsPDFPromise = null;
function loadJsPDF() {
  if (jsPDFPromise) return jsPDFPromise;
  jsPDFPromise = new Promise((resolve, reject) => {
    if (window.jspdf?.jsPDF) { resolve(window.jspdf.jsPDF); return; }
    const core = document.createElement("script");
    core.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    core.onload = () => {
      const auto = document.createElement("script");
      auto.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
      auto.onload  = () => resolve(window.jspdf.jsPDF);
      auto.onerror = reject;
      document.head.appendChild(auto);
    };
    core.onerror = reject;
    document.head.appendChild(core);
  });
  return jsPDFPromise;
}

// ─── Per-student PDF generator ────────────────────────────────────────────────
async function generateStudentPDF(data) {
  const JsPDF = await loadJsPDF();
  const doc   = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = 210, ML = 14, MR = 14, CW = PW - ML - MR;
  const PURPLE = [108,99,255], DARK = [26,26,46], MUTED = [120,120,150];
  const GREEN  = [25,135,84],  RED  = [220,53,69], ORANGE = [253,126,20];
  const LBKG   = [244,243,255];

  const { exam, student, submission, integrity, answers } = data;
  let y = 14;

  const ensureSpace = (n) => { if (y + n > 278) { doc.addPage(); y = 14; } };

  const sectionHeader = (label) => {
    ensureSpace(10);
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...PURPLE);
    doc.text(label, ML, y);
    doc.setDrawColor(...PURPLE); doc.setLineWidth(0.4);
    doc.line(ML, y + 1.5, ML + CW, y + 1.5);
    y += 7;
  };

  // Cover
  doc.setFillColor(...PURPLE); doc.rect(0, 0, PW, 2, "F");
  doc.setFillColor(...LBKG);   doc.rect(ML, y, CW, 28, "F");
  doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(...PURPLE);
  doc.text("SECT  -  STUDENT EXAM REPORT", ML + 4, y + 6);
  doc.setFontSize(14); doc.setTextColor(...DARK);
  doc.text(exam.title || "Exam Report", ML + 4, y + 13);
  doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text(`${exam.course?.code || ""} - ${exam.course?.name || ""}  |  ${(exam.type||"").toUpperCase()}  |  ${exam.duration_minutes} min`, ML + 4, y + 19);
  doc.text(`Generated: ${new Date().toLocaleString("en-PH")}`, ML + 4, y + 24);
  doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(...PURPLE);
  doc.text("CONFIDENTIAL", PW - MR - 2, y + 6, { align:"right" });
  doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text("For Instructor Use Only", PW - MR - 2, y + 11, { align:"right" });
  y += 34;

  // Student row
  ensureSpace(22);
  doc.setFillColor(255,255,255); doc.setDrawColor(220,220,240);
  doc.roundedRect(ML, y, CW, 18, 2, 2, "FD");
  doc.setFillColor(...PURPLE); doc.circle(ML + 10, y + 9, 6, "F");
  doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(255,255,255);
  doc.text((student?.name||"?").charAt(0).toUpperCase(), ML + 10, y + 12, { align:"center" });
  doc.setTextColor(...DARK); doc.setFontSize(10);
  doc.text(student?.name || "Unknown", ML + 20, y + 8);
  doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text(student?.email || "", ML + 20, y + 13);
  const pct = submission.percentage ?? 0;
  const scoreCol = pct >= 75 ? GREEN : pct >= 50 ? ORANGE : RED;
  doc.setFillColor(...scoreCol);
  doc.roundedRect(PW - MR - 40, y + 3, 38, 12, 2, 2, "F");
  doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(255,255,255);
  doc.text(`${submission.score ?? 0} / ${submission.total_points}  (${pct}%)`, PW - MR - 21, y + 11, { align:"center" });
  y += 24;

  // Timing
  const fmt = (d) => d ? new Date(d).toLocaleString("en-PH") : "-";
  doc.autoTable({
    startY: y, margin:{left:ML,right:MR}, tableWidth:CW, head:[],
    body:[["Status",(submission.status||"-").toUpperCase()],["Started",fmt(submission.started_at)],["Submitted",fmt(submission.submitted_at)]],
    columnStyles:{0:{cellWidth:28,fontStyle:"bold",textColor:MUTED,fontSize:7},1:{textColor:DARK,fontSize:8}},
    styles:{cellPadding:{top:1.5,bottom:1.5,left:3,right:3},lineColor:[240,240,248],lineWidth:0.1},
    theme:"grid",
  });
  y = doc.lastAutoTable.finalY + 6;

  // Integrity
  sectionHeader("ACADEMIC INTEGRITY");
  if (integrity) {
    const cpi    = integrity.cpi_score ?? 0;
    const cpiCol = cpi >= 50 ? RED : cpi >= 25 ? ORANGE : GREEN;
    ensureSpace(28);
    doc.setFillColor(...cpiCol); doc.roundedRect(ML, y, 44, 18, 2, 2, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(16); doc.setTextColor(255,255,255);
    doc.text(`${cpi.toFixed(1)}%`, ML + 22, y + 10, { align:"center" });
    doc.setFontSize(7); doc.text("CPI SCORE", ML + 22, y + 15.5, { align:"center" });
    doc.setFillColor(...LBKG); doc.roundedRect(ML + 47, y, 40, 18, 2, 2, "F");
    doc.setFontSize(11); doc.setTextColor(...cpiCol);
    doc.text(cpiLabel(cpi), ML + 67, y + 10, { align:"center" });
    doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text("RISK LABEL", ML + 67, y + 15.5, { align:"center" });
    if (integrity.is_flagged) {
      doc.setFillColor(...RED); doc.roundedRect(ML + 91, y, 28, 10, 2, 2, "F");
      doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(255,255,255);
      doc.text("FLAGGED", ML + 105, y + 6.5, { align:"center" });
    }
    y += 22;
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text("CPI = (0.35 x SVM) + (0.25 x IsoForest-Tab) + (0.25 x IsoForest-RT) + (0.15 x HMM)", ML, y);
    y += 5;
    doc.autoTable({
      startY:y, margin:{left:ML,right:MR}, tableWidth:CW,
      head:[["Algorithm","Raw Score","Flag","Event Count","Weight"]],
      body:[
        ["One-Class SVM",          integrity.svm_score     != null ? integrity.svm_score.toFixed(4)     : "-", integrity.svm_flagged     ? "Flagged":"OK", `Shortcuts: ${integrity.keyboard_shortcut_count}`,       "0.35"],
        ["Isolation Forest (Tab)", integrity.iso_tab_score != null ? integrity.iso_tab_score.toFixed(4) : "-", integrity.iso_tab_flagged ? "Flagged":"OK", `Tab switches: ${integrity.tab_switch_count}`,            "0.25"],
        ["Isolation Forest (RT)",  integrity.rt_score      != null ? integrity.rt_score.toFixed(4)      : "-", integrity.rt_flagged      ? "Flagged":"OK", `Response anomalies: ${integrity.response_time_anomaly_count}`, "0.25"],
        ["Hidden Markov Model",    integrity.hmm_score     != null ? integrity.hmm_score.toFixed(4)     : "-", integrity.hmm_flagged     ? "Flagged":"OK", `Keystroke anomalies: ${integrity.keystroke_anomaly_count}`,     "0.15"],
      ],
      headStyles:{fillColor:PURPLE,textColor:255,fontSize:7,fontStyle:"bold"},
      bodyStyles:{fontSize:7,textColor:DARK},
      columnStyles:{0:{cellWidth:44},1:{cellWidth:24,halign:"right"},2:{cellWidth:18},3:{cellWidth:58},4:{cellWidth:14,halign:"center"}},
      alternateRowStyles:{fillColor:LBKG},
      styles:{cellPadding:{top:2,bottom:2,left:3,right:3},lineColor:[220,220,240],lineWidth:0.1},
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.setFont("helvetica","italic"); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text("Integrity analysis not yet available (ML processing pending).", ML, y);
    y += 8;
  }

  // Answers
  sectionHeader("ANSWERS");
  const HEADER_H = 8, LINE_H_LG = 4, LINE_H_SM = 3.5, BOTTOM_PAD = 3;

  for (const ans of answers) {
    const isEssay = ans.type === "essay";
    const earned  = ans.points_earned;
    const correct = ans.is_correct;
    const stripeColor = isEssay
      ? (earned === null || earned === undefined ? ORANGE : earned > 0 ? GREEN : RED)
      : (correct ? GREEN : RED);

    const wrappedQ   = doc.splitTextToSize(ans.question_text || "", CW - 8);
    const wrappedAns = doc.splitTextToSize(String(ans.student_answer ?? "No answer provided"), CW - 8);
    const wrappedRub = (isEssay && ans.rubric) ? doc.splitTextToSize(`Rubric: ${ans.rubric}`, CW - 8) : [];
    const wrappedFb  = ans.feedback ? doc.splitTextToSize(`Feedback: ${ans.feedback}`, CW - 8) : [];

    const blockH = HEADER_H
      + wrappedQ.length * LINE_H_LG
      + (wrappedRub.length ? wrappedRub.length * LINE_H_SM + 2 : 0)
      + wrappedAns.length * LINE_H_LG
      + (!isEssay && ans.correct_answer ? LINE_H_SM + 1 : 0)
      + (wrappedFb.length ? wrappedFb.length * LINE_H_SM + 2 : 0)
      + BOTTOM_PAD;

    ensureSpace(blockH);

    doc.setFillColor(...stripeColor); doc.rect(ML, y, 1.5, blockH, "F");
    doc.setFillColor(250,250,254);    doc.rect(ML + 1.5, y, CW - 1.5, blockH, "F");

    // Header row: Q-badge | type tag | status label | points
    doc.setFillColor(...PURPLE); doc.roundedRect(ML + 3, y + 1.5, 10, 5, 1, 1, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(6.5); doc.setTextColor(255,255,255);
    doc.text(`Q${ans.order}`, ML + 8, y + 5.2, { align:"center" });
    doc.setFillColor(...LBKG); doc.roundedRect(ML + 15, y + 1.5, 24, 5, 1, 1, "F");
    doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(...PURPLE);
    doc.text(ans.type.replace(/_/g," "), ML + 27, y + 5.2, { align:"center" });
    if (!isEssay) {
      doc.setFont("helvetica","bold"); doc.setFontSize(6.5);
      doc.setTextColor(correct ? GREEN[0]:RED[0], correct ? GREEN[1]:RED[1], correct ? GREEN[2]:RED[2]);
      doc.text(correct ? "Correct" : "Incorrect", ML + 42, y + 5.2);
    } else {
      doc.setFont("helvetica","normal"); doc.setFontSize(6.5);
      if (earned === null || earned === undefined) {
        doc.setTextColor(...ORANGE); doc.text("Pending grade", ML + 42, y + 5.2);
      } else {
        doc.setTextColor(earned>0?GREEN[0]:RED[0], earned>0?GREEN[1]:RED[1], earned>0?GREEN[2]:RED[2]);
        doc.text(`Graded: ${earned} pts`, ML + 42, y + 5.2);
      }
    }
    const ptStr = earned != null ? `${earned} / ${ans.points} pts` : `- / ${ans.points} pts`;
    doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(...stripeColor);
    doc.text(ptStr, ML + CW - 2, y + 5.5, { align:"right" });

    // Content
    let iy = y + HEADER_H;
    doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(...DARK);
    doc.text(wrappedQ, ML + 4, iy); iy += wrappedQ.length * LINE_H_LG;
    if (wrappedRub.length) {
      iy += 2;
      doc.setFont("helvetica","italic"); doc.setFontSize(6.5); doc.setTextColor(...MUTED);
      doc.text(wrappedRub, ML + 4, iy); iy += wrappedRub.length * LINE_H_SM;
    }
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(...DARK);
    doc.text(wrappedAns, ML + 4, iy); iy += wrappedAns.length * LINE_H_LG;
    if (!isEssay && ans.correct_answer) {
      iy += 1;
      doc.setFont("helvetica","italic"); doc.setFontSize(6.5); doc.setTextColor(...MUTED);
      doc.text(`Correct: ${ans.correct_answer}`, ML + 4, iy); iy += LINE_H_SM;
    }
    if (wrappedFb.length) {
      iy += 2;
      doc.setFont("helvetica","italic"); doc.setFontSize(6.5); doc.setTextColor(...GREEN);
      doc.text(wrappedFb, ML + 4, iy);
    }
    y += blockH + 3;
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...PURPLE); doc.rect(0, 292, PW, 5, "F");
    doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(255,255,255);
    doc.text("SECT - Smart Exam Cheating Tracker  |  Confidential", ML, 295.5);
    doc.text(`Page ${i} of ${pages}`, PW - MR, 295.5, { align:"right" });
  }

  const safeName = (student?.name  || "student").replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeExam = (exam?.title    || "exam"   ).replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`${safeExam}_${safeName}.pdf`);
}

// ─── MetadataSummary ──────────────────────────────────────────────────────────
const MetadataSummary = ({ type, meta }) => {
  if (!meta) return <small className="text-muted">—</small>;
  switch (type) {
    case "tab_switch":         return <small>Hidden {((meta.hidden_duration_ms??0)/1000).toFixed(1)}s · Switch #{meta.count_in_session}</small>;
    case "keyboard_shortcut":  return <small><kbd>{meta.keys}</kbd></small>;
    case "response_time":      return <small>{meta.direction==="too_fast"?"⚡ Too fast":"🐢 Too slow"} · z={meta.z_score} · {((meta.response_time_ms??0)/1000).toFixed(1)}s</small>;
    case "keystroke_dynamics": return <small>{meta.reason==="impossible_speed"?"🚀 Impossible speed":"📊 Deviation"} · {meta.wpm?.toFixed(0)} WPM</small>;
    default:                   return <small className="text-muted">—</small>;
  }
};

// ════════════════════════════════════════════════════════════════════════════
// STUDENT RESULTS TAB
// ════════════════════════════════════════════════════════════════════════════
const StudentResultsTab = ({ examId, anomalySummaries }) => {
  const [submissions, setSubmissions]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [downloadingId, setDownloadingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/exams/${examId}/submissions`);
      setSubmissions(res.data.submissions || []);
    } catch { setSubmissions([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [examId]);

  const rows = useMemo(() => {
    if (submissions.length > 0) return submissions;
    return anomalySummaries.map((s) => ({
      id: s.submission_id, student_id: s.student?.id, student: s.student,
      status: "submitted", score: null, total_points: null,
      started_at: null, submitted_at: null,
      cpi_score: s.cpi_score, cpi_label: s.cpi_label, is_flagged: s.is_flagged,
      essay_count: 0, graded_count: 0, ungraded_count: 0,
    }));
  }, [submissions, anomalySummaries]);

  const counts = useMemo(() => ({
    all:         rows.length,
    submitted:   rows.filter(r => r.status === "submitted").length,
    in_progress: rows.filter(r => r.status === "in_progress").length,
    not_started: rows.filter(r => r.status === "not_started").length,
  }), [rows]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return r.student?.name?.toLowerCase().includes(q) || r.student?.email?.toLowerCase().includes(q);
    }
    return true;
  }), [rows, statusFilter, search]);

  const handleDownloadPDF = async (submissionId) => {
    setDownloadingId(submissionId);
    try {
      const res = await API.get(`/exams/${examId}/submissions/${submissionId}/student-pdf`);
      await generateStudentPDF(res.data);
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to generate PDF.", "error");
    } finally { setDownloadingId(null); }
  };

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" />
      <p className="text-muted mt-3 small">Loading student results…</p>
    </div>
  );

  const PILL_FILTERS = [
    { key:"all",         label:"All",         color:"primary"   },
    { key:"submitted",   label:"Submitted",   color:"success"   },
    { key:"in_progress", label:"In Progress", color:"warning"   },
    { key:"not_started", label:"Not Started", color:"secondary" },
  ];

  return (
    <>
      <div className="d-flex gap-2 flex-wrap align-items-center mb-3">
        {PILL_FILTERS.map(({ key, label, color }) => (
          <button key={key}
            className={`btn btn-sm rounded-pill ${statusFilter === key ? `btn-${color}` : "btn-outline-secondary"}`}
            onClick={() => setStatusFilter(key)}>
            {label}
            <span className={`badge ms-2 ${statusFilter===key?"bg-white text-dark":`bg-${color} text-white`}`}>
              {counts[key]}
            </span>
          </button>
        ))}
        <div className="ms-auto d-flex gap-2 align-items-center">
          <div className="input-group input-group-sm" style={{ maxWidth: 220 }}>
            <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
            <input className="form-control border-start-0" placeholder="Search student…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={load} title="Refresh">
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth:200 }}>STUDENT</th>
                <th>STATUS</th><th>SCORE</th><th>%</th><th>CPI</th>
                <th>STARTED</th><th>SUBMITTED</th><th>ESSAYS</th><th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-5">
                    <i className="bi bi-inbox fs-2 d-block mb-2"></i>No students match.
                  </td>
                </tr>
              ) : filtered.map((row) => {
                const status      = row.status ?? "not_started";
                const pct         = row.total_points > 0 && row.score != null ? ((row.score / row.total_points) * 100).toFixed(1) : null;
                const isNotStarted = status === "not_started";
                const downloading  = downloadingId === row.id;
                const dtFmt = (d) => d ? new Date(d).toLocaleString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";

                return (
                  <tr key={row.student_id ?? row.id} className={isNotStarted ? "table-light" : ""}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className={`rounded-circle text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0 ${isNotStarted?"bg-secondary":"bg-primary"}`}
                          style={{ width:32, height:32, fontSize:12 }}>
                          {row.student?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className={`fw-semibold small ${isNotStarted?"text-muted":""}`}>{row.student?.name||"—"}</div>
                          <div className="text-muted" style={{fontSize:11}}>{row.student?.email||"—"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${status==="submitted"?"bg-success":status==="in_progress"?"bg-warning text-dark":"bg-secondary"}`}>
                        {status==="in_progress"?"In Progress":status==="submitted"?"Submitted":"Not Started"}
                      </span>
                      {status==="in_progress" && (
                        <span className="ms-1 spinner-grow spinner-grow-sm text-warning" style={{width:"0.4rem",height:"0.4rem"}}></span>
                      )}
                    </td>
                    <td>{row.score != null ? <span className="fw-semibold">{row.score} <span className="text-muted fw-normal">/ {row.total_points}</span></span> : <span className="text-muted">—</span>}</td>
                    <td>
                      {pct != null ? (
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{height:6,minWidth:50}}>
                            <div className={`progress-bar ${pct>=75?"bg-success":pct>=50?"bg-warning":"bg-danger"}`} style={{width:`${pct}%`}} />
                          </div>
                          <small className="fw-semibold">{pct}%</small>
                        </div>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      {row.cpi_score != null
                        ? <span className={`badge ${riskBgClass(row.cpi_score)} ${row.cpi_score>=20?"text-white":""}`} title={`CPI: ${row.cpi_score} — ${cpiLabel(row.cpi_score)}`}>{row.cpi_score.toFixed(1)}%</span>
                        : <span className="text-muted small">—</span>}
                    </td>
                    <td><small className="text-muted">{dtFmt(row.started_at)}</small></td>
                    <td><small className="text-muted">{dtFmt(row.submitted_at)}</small></td>
                    <td>
                      {row.essay_count > 0
                        ? row.ungraded_count > 0
                          ? <span className="badge bg-warning text-dark"><i className="bi bi-hourglass-split me-1"></i>{row.ungraded_count} pending</span>
                          : <span className="badge bg-success"><i className="bi bi-check-all me-1"></i>Graded</span>
                        : <span className="text-muted small">—</span>}
                    </td>
                    <td>
                      {status==="submitted" && row.id
                        ? <button className="btn btn-sm btn-danger" disabled={downloading} onClick={() => handleDownloadPDF(row.id)}>
                            {downloading ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-file-earmark-pdf me-1"></i>PDF</>}
                          </button>
                        : <span className="text-muted small">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-muted small mt-2">
        <i className="bi bi-info-circle me-1"></i>
        PDF download only for submitted exams. Downloads directly with no print dialog.
      </p>
    </>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// ESSAY SUBMISSION CARD
// ════════════════════════════════════════════════════════════════════════════
const EssaySubmissionCard = ({ sub, examId, onGraded }) => {
  const [grades, setGrades] = useState(() =>
    Object.fromEntries((sub.essays||[]).map(e => [
      e.question_id,
      { points_earned: isEssayGraded(e) ? String(e.points_earned) : "", feedback: e.feedback ?? "" },
    ]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded]     = useState(sub.essays.some(e => !isEssayGraded(e)));

  const allGraded    = sub.essays.every(e => isEssayGraded(e));
  const pendingCount = sub.essays.filter(e => !isEssayGraded(e)).length;

  const handleGradeChange = (qId, field, value) =>
    setGrades(prev => ({ ...prev, [qId]: { ...prev[qId], [field]: value } }));

  const handleSubmitGrades = async () => {
    for (const e of sub.essays) {
      const pts = parseFloat(grades[e.question_id]?.points_earned);
      if (isNaN(pts) || pts < 0) { Swal.fire("Validation Error", `Enter a valid score for: "${e.question_text.slice(0,60)}..."`, "warning"); return; }
      if (pts > e.points)         { Swal.fire("Validation Error", `Score cannot exceed ${e.points} pts for: "${e.question_text.slice(0,60)}..."`, "warning"); return; }
    }
    setSubmitting(true);
    try {
      await API.patch(`/exams/${examId}/essays/${sub.submission_id}`, {
        grades: sub.essays.map(e => ({
          question_id:   e.question_id,
          points_earned: parseFloat(grades[e.question_id]?.points_earned ?? 0),
          feedback:      grades[e.question_id]?.feedback || null,
        })),
      });
      Swal.fire({ toast:true, position:"top-end", icon:"success", title:"Grades saved!", showConfirmButton:false, timer:2000 });
      onGraded();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save grades.", "error");
    } finally { setSubmitting(false); }
  };

  return (
    <div className={`card shadow-sm border-0 mb-3 border-start border-3 ${!allGraded?"border-warning":"border-success"}`}>
      <div className="card-header bg-white d-flex align-items-center gap-3 py-3" style={{cursor:"pointer"}} onClick={() => setExpanded(v => !v)}>
        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{width:38,height:38,fontSize:14}}>
          {sub.student?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-grow-1">
          <div className="fw-semibold">{sub.student?.name}</div>
          <small className="text-muted">{sub.student?.email}</small>
        </div>
        <div className="d-flex align-items-center gap-3 flex-shrink-0">
          <div className="text-end">
            <div className="fw-semibold text-primary">{sub.score ?? "—"} / {sub.total_points}</div>
            <small className="text-muted">current score</small>
          </div>
          {allGraded
            ? <span className="badge bg-success"><i className="bi bi-check-all me-1"></i>All graded</span>
            : <span className="badge bg-warning text-dark"><i className="bi bi-hourglass-split me-1"></i>{pendingCount} pending</span>}
          <i className={`bi ${expanded?"bi-chevron-up":"bi-chevron-down"} text-muted`}></i>
        </div>
      </div>

      {expanded && (
        <div className="card-body pt-2 pb-3">
          {sub.essays.map((essay, idx) => (
            <div key={essay.question_id} className={`mb-4 pb-4 ${idx < sub.essays.length-1 ? "border-bottom" : ""}`}>
              <div className="d-flex align-items-start gap-2 mb-2">
                <span className="badge bg-light text-dark border fw-bold flex-shrink-0">Q</span>
                <div>
                  <p className="mb-1 fw-semibold">{essay.question_text}</p>
                  <div className="d-flex gap-3">
                    <small className="text-muted"><i className="bi bi-trophy me-1"></i>Max {essay.points} pts</small>
                    {essay.max_words && <small className="text-muted"><i className="bi bi-type me-1"></i>Max {essay.max_words} words</small>}
                  </div>
                </div>
              </div>
              {essay.rubric && (
                <div className="alert alert-light border py-2 px-3 mb-3" style={{fontSize:12}}>
                  <strong><i className="bi bi-journal-text me-1"></i>Rubric:</strong> {essay.rubric}
                </div>
              )}
              <div className="mb-3">
                <label className="form-label fw-semibold small text-muted text-uppercase" style={{letterSpacing:"0.06em"}}>Student's Answer</label>
                <div className="p-3 bg-light border rounded" style={{whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.6}}>
                  {essay.student_answer || <span className="text-muted fst-italic">No answer provided.</span>}
                </div>
                {essay.student_answer && (
                  <small className="text-muted">
                    {essay.student_answer.trim().split(/\s+/).length} words{essay.max_words ? ` / ${essay.max_words} max` : ""}
                  </small>
                )}
              </div>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label fw-semibold small">Points Earned <span className="text-danger">*</span> <span className="text-muted fw-normal">/ {essay.points}</span></label>
                  <input type="number" className="form-control" min="0" max={essay.points} step="0.5"
                    placeholder={`0 – ${essay.points}`}
                    value={grades[essay.question_id]?.points_earned ?? ""}
                    onChange={e => handleGradeChange(essay.question_id, "points_earned", e.target.value)}
                    disabled={submitting} />
                </div>
                <div className="col-md-9">
                  <label className="form-label fw-semibold small">Feedback <span className="text-muted fw-normal">(optional, shared with student)</span></label>
                  <textarea className="form-control" rows="2" placeholder="Write feedback for the student…"
                    value={grades[essay.question_id]?.feedback || ""}
                    onChange={e => handleGradeChange(essay.question_id, "feedback", e.target.value)}
                    disabled={submitting} />
                </div>
              </div>
              {isEssayGraded(essay) && (
                <div className="mt-2">
                  <span className="badge bg-success bg-opacity-10 text-success border border-success">
                    <i className="bi bi-check-circle me-1"></i>Previously graded: {essay.points_earned} / {essay.points} pts
                  </span>
                </div>
              )}
            </div>
          ))}
          <div className="d-flex justify-content-end mt-2">
            <button className="btn btn-success px-4" onClick={handleSubmitGrades} disabled={submitting}>
              {submitting ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</> : <><i className="bi bi-check2-circle me-2"></i>Save Grades</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// STUDENT DETAIL MODAL (Anomaly)
// ════════════════════════════════════════════════════════════════════════════
const StudentDetailModal = ({ loading, data, onClose, onMarkReviewed }) => (
  <div className="modal show d-block" style={{backgroundColor:"rgba(0,0,0,0.6)"}}>
    <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h5 className="modal-title fw-bold">{loading?"Loading…":`${data?.student?.name} — Anomaly Timeline`}</h5>
            {!loading && data && <small className="text-muted">{data?.student?.email}</small>}
          </div>
          <button className="btn-close" onClick={onClose} />
        </div>
        <div className="modal-body">
          {loading && <div className="text-center py-5"><div className="spinner-border text-primary"/></div>}
          {!loading && data && (
            <>
              <div className="row g-3 mb-4">
                {[
                  { label:"CPI Score",   value:`${(data.summary?.cpi_score??0).toFixed(1)}%`, color:riskColor(data.summary?.cpi_score??0) },
                  { label:"Tab Switches",value:data.summary?.tab_switch_count??0,             color:"text-dark" },
                  { label:"Shortcuts",   value:data.summary?.keyboard_shortcut_count??0,      color:"text-dark" },
                  { label:"Response ⚠", value:data.summary?.response_time_anomaly_count??0,  color:"text-dark" },
                  { label:"Keystroke ⚠",value:data.summary?.keystroke_anomaly_count??0,      color:"text-dark" },
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
              <h6 className="fw-bold mb-3">
                Full Event Timeline
                {data.logs?.length > 0 && <span className="badge bg-secondary ms-2 fw-normal" style={{fontSize:12}}>{data.logs.length} event{data.logs.length!==1?"s":""}</span>}
              </h6>
              {!data.logs || data.logs.length === 0 ? (
                <div className="text-muted text-center py-4">
                  <i className="bi bi-check-circle fs-3 text-success d-block mb-2"></i>No anomalous events recorded.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle">
                    <thead className="table-light">
                      <tr><th>TIME</th><th>TYPE</th><th>SEVERITY</th><th>QUESTION</th><th>DETAIL</th><th>NOTES</th><th>STATUS</th><th>ACTION</th></tr>
                    </thead>
                    <tbody>
                      {data.logs.map(log => (
                        <tr key={`${log.type}-${log.id}`} className={log.reviewed?"opacity-50":""}>
                          <td><small>{log.occurred_at ? new Date(log.occurred_at).toLocaleTimeString() : "—"}</small></td>
                          <td><span className="badge bg-dark" style={{fontSize:10}}>{TYPE_LABELS[log.type]??log.type}</span></td>
                          <td><span className={`badge ${SEVERITY_MAP[log.severity]?.badge??"bg-secondary"}`}>{SEVERITY_MAP[log.severity]?.label??log.severity}</span></td>
                          <td>{log.question ? <small>Q{log.question.order}</small> : <small className="text-muted">—</small>}</td>
                          <td><MetadataSummary type={log.type} meta={log.metadata}/></td>
                          <td><small className="fst-italic text-muted">{log.reviewer_notes||"—"}</small></td>
                          <td>{log.reviewed ? <span className="badge bg-success">Reviewed</span> : <span className="badge bg-secondary">Pending</span>}</td>
                          <td>
                            <button className={`btn btn-sm ${log.reviewed?"btn-outline-secondary":"btn-outline-success"}`}
                              onClick={() => onMarkReviewed(log.id, log.type, !log.reviewed)}>
                              <i className={`bi ${log.reviewed?"bi-arrow-counterclockwise":"bi-check-circle"}`}></i>
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

// ════════════════════════════════════════════════════════════════════════════
// QUESTION MODALS (shared form fields used by both Add and Edit)
// ════════════════════════════════════════════════════════════════════════════
const QuestionFormFields = ({ formData, setFormData, submitting }) => {
  const updateOption = (i, v) => {
    const opts = [...formData.options]; opts[i] = v;
    setFormData({ ...formData, options: opts,
      correct_answer: formData.correct_answer === formData.options[i] ? "" : formData.correct_answer });
  };

  return (
    <div className="row g-3">
      <div className="col-md-8">
        <label className="form-label fw-semibold">Type <span className="text-danger">*</span></label>
        <div className="d-flex gap-2">
          {[{value:"multiple_choice",label:"Multiple Choice",icon:"bi-ui-radios"},
            {value:"true_false",label:"True / False",icon:"bi-toggle-on"},
            {value:"essay",label:"Essay",icon:"bi-textarea"}].map(opt => (
            <button key={opt.value} type="button"
              className={`btn btn-sm flex-grow-1 ${formData.type===opt.value?"btn-primary":"btn-outline-secondary"}`}
              onClick={() => setFormData({...formData,type:opt.value,correct_answer:"",options:["","","",""]})}>
              <i className={`bi ${opt.icon} me-1`}></i>{opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="col-md-4">
        <label className="form-label fw-semibold">Points <span className="text-danger">*</span></label>
        <input type="number" className="form-control" min="1" value={formData.points}
          onChange={e => setFormData({...formData,points:parseInt(e.target.value)})} required disabled={submitting}/>
      </div>
      <div className="col-12">
        <label className="form-label fw-semibold">Question Text <span className="text-danger">*</span></label>
        <textarea className="form-control" rows="3" placeholder="Enter your question here…"
          value={formData.question_text} onChange={e => setFormData({...formData,question_text:e.target.value})}
          required disabled={submitting}/>
      </div>
      {formData.type==="multiple_choice" && (
        <>
          <div className="col-12">
            <label className="form-label fw-semibold">Answer Options <span className="text-danger">*</span></label>
            {formData.options.map((opt,idx) => (
              <div key={idx} className="input-group mb-2">
                <span className="input-group-text fw-semibold">{String.fromCharCode(65+idx)}</span>
                <input type="text" className="form-control" placeholder={`Option ${String.fromCharCode(65+idx)}`}
                  value={opt} onChange={e => updateOption(idx, e.target.value)} required disabled={submitting}/>
                {opt && opt===formData.correct_answer &&
                  <span className="input-group-text bg-success text-white"><i className="bi bi-check-lg"></i></span>}
              </div>
            ))}
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold">Correct Answer <span className="text-danger">*</span></label>
            <select className="form-select" value={formData.correct_answer}
              onChange={e => setFormData({...formData,correct_answer:e.target.value})} required disabled={submitting}>
              <option value="">Select…</option>
              {formData.options.map((opt,idx) => opt.trim() &&
                <option key={idx} value={opt}>{String.fromCharCode(65+idx)}. {opt}</option>)}
            </select>
          </div>
        </>
      )}
      {formData.type==="true_false" && (
        <div className="col-12">
          <label className="form-label fw-semibold">Correct Answer <span className="text-danger">*</span></label>
          <div className="d-flex gap-3">
            {["True","False"].map(val => (
              <button key={val} type="button"
                className={`btn flex-grow-1 ${formData.correct_answer===val?"btn-primary":"btn-outline-secondary"}`}
                onClick={() => setFormData({...formData,correct_answer:val})}>
                {val==="True"?"✅":"❌"} {val}
              </button>
            ))}
          </div>
          <input type="hidden" value={formData.correct_answer} required onChange={()=>{}}/>
        </div>
      )}
      {formData.type==="essay" && (
        <>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Max Words</label>
            <input type="number" className="form-control" min="1" placeholder="e.g., 500"
              value={formData.max_words||""}
              onChange={e => setFormData({...formData,max_words:parseInt(e.target.value)||null})} disabled={submitting}/>
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold">Grading Rubric</label>
            <textarea className="form-control" rows="3" placeholder="Describe how this question should be graded…"
              value={formData.rubric} onChange={e => setFormData({...formData,rubric:e.target.value})} disabled={submitting}/>
          </div>
        </>
      )}
    </div>
  );
};

const BLANK_QUESTION = { type:"multiple_choice", question_text:"", points:1, options:["","","",""], correct_answer:"", max_words:null, rubric:"" };

const AddQuestionModal = ({ show, onHide, examId, onSuccess }) => {
  const [formData, setFormData] = useState(BLANK_QUESTION);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const p = { type:formData.type, question_text:formData.question_text, points:formData.points };
      if (formData.type==="multiple_choice") { p.options=formData.options.filter(o=>o.trim()!==""); p.correct_answer=formData.correct_answer; }
      else if (formData.type==="true_false") { p.correct_answer=formData.correct_answer; }
      else if (formData.type==="essay")      { p.max_words=formData.max_words; p.rubric=formData.rubric; }
      const res = await API.post(`/exams/${examId}/questions`, p);
      Swal.fire({ icon:"success", title:"Question Added!", timer:1500, showConfirmButton:false });
      onSuccess(res.data.question);
      setFormData(BLANK_QUESTION);
    } catch (err) { Swal.fire("Error!", err.response?.data?.message||"Failed to add question", "error"); }
    finally { setSubmitting(false); }
  };

  if (!show) return null;
  return (
    <div className="modal show d-block" style={{backgroundColor:"rgba(0,0,0,0.5)",position:"fixed",inset:0,overflowY:"hidden",zIndex:1055}}>
      <div className="modal-dialog modal-lg" style={{margin:"1.75rem auto"}}>
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <div>
              <h5 className="modal-title fw-bold"><i className="bi bi-patch-plus me-2 text-primary"></i>Add Question</h5>
              <p className="text-muted small mb-0">Add a new question to this exam</p>
            </div>
            <button type="button" className="btn-close" onClick={onHide} disabled={submitting}/>
          </div>
          <form id="add-q-form" onSubmit={handleSubmit}>
            <div className="modal-body pt-3" style={{overflowY:"auto",maxHeight:"calc(100vh - 220px)"}}>
              <QuestionFormFields formData={formData} setFormData={setFormData} submitting={submitting}/>
            </div>
          </form>
          <div className="modal-footer border-top">
            <button type="button" className="btn btn-light" onClick={onHide} disabled={submitting}>Cancel</button>
            <button type="submit" form="add-q-form" className="btn btn-primary px-4" disabled={submitting}>
              {submitting ? <><span className="spinner-border spinner-border-sm me-2"/>Adding…</> : <><i className="bi bi-plus-circle me-2"></i>Add Question</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditQuestionModal = ({ question, onHide, onSave }) => {
  const [formData, setFormData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!question) { setFormData(null); return; }
    setFormData({
      type: question.type, question_text: question.question_text, points: question.points,
      options: question.options?.length ? [...question.options] : ["","","",""],
      correct_answer: question.correct_answer||"", max_words: question.max_words||null, rubric: question.rubric||"",
    });
  }, [question]);

  const handleSubmit = async (e) => {
    e.preventDefault(); if (!formData) return; setSubmitting(true);
    const p = { type:formData.type, question_text:formData.question_text, points:formData.points };
    if (formData.type==="multiple_choice") { p.options=formData.options.filter(o=>o.trim()!==""); p.correct_answer=formData.correct_answer; }
    else if (formData.type==="true_false") { p.correct_answer=formData.correct_answer; }
    else if (formData.type==="essay")      { p.max_words=formData.max_words; p.rubric=formData.rubric; }
    await onSave(question.id, p);
    setSubmitting(false);
  };

  if (!question || !formData) return null;
  return (
    <div className="modal show d-block" style={{backgroundColor:"rgba(0,0,0,0.5)",position:"fixed",inset:0,overflowY:"hidden",zIndex:1055}}>
      <div className="modal-dialog modal-lg" style={{margin:"1.75rem auto"}}>
        <div className="modal-content">
          <div className="modal-header pb-2">
            <div>
              <h5 className="modal-title fw-bold"><i className="bi bi-pencil-square me-2 text-warning"></i>Edit Question</h5>
              <p className="text-muted small mb-0">Changes save on click</p>
            </div>
            <button type="button" className="btn-close" onClick={onHide} disabled={submitting}/>
          </div>
          <form id="edit-q-form" onSubmit={handleSubmit}>
            <div className="modal-body" style={{overflowY:"auto",maxHeight:"calc(100vh - 220px)"}}>
              <QuestionFormFields formData={formData} setFormData={setFormData} submitting={submitting}/>
            </div>
          </form>
          <div className="modal-footer border-top">
            <small className="text-muted me-auto"><i className="bi bi-lock me-1"></i>Edits won't be lost until you cancel</small>
            <button type="button" className="btn btn-light" onClick={onHide} disabled={submitting}>Cancel</button>
            <button type="submit" form="edit-q-form" className="btn btn-warning px-4" disabled={submitting}>
              {submitting ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</> : <><i className="bi bi-check2 me-2"></i>Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
const ExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [exam, setExam]           = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("questions");

  const [summaries, setSummaries]         = useState([]);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyLoaded, setAnomalyLoaded]   = useState(false);
  const [detailData, setDetailData]         = useState(null);
  const [detailLoading, setDetailLoading]   = useState(false);
  const [anomalySearch, setAnomalySearch]   = useState("");
  const [anomalyFilter, setAnomalyFilter]   = useState("all");

  const [essayData, setEssayData]     = useState(null);
  const [essayLoading, setEssayLoading] = useState(false);
  const [essayLoaded, setEssayLoaded]   = useState(false);
  const [essayStats, setEssayStats]     = useState(null);

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion]     = useState(null);

  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [shuffleSaving, setShuffleSaving]   = useState(false);
  const shuffleKey = `exam_shuffle_${id}`;

  const isNewExam = !!location.state?.openAddQuestion;

  useEffect(() => {
    if (isNewExam && !loading) {
      setShowQuestionModal(true);
      navigate(location.pathname, { replace:true, state:{} });
    }
  }, [loading, isNewExam]);

  useEffect(() => { fetchExamDetails(); }, [id]);

  useEffect(() => {
    if (!loading && exam) fetchEssayStats();
  }, [loading, exam]);

  useEffect(() => {
    if (activeTab==="anomalies" && !anomalyLoaded) fetchAnomalySummaries();
    if (activeTab==="essays"    && !essayLoaded)   fetchEssayData();
    if (activeTab==="results"   && !anomalyLoaded) fetchAnomalySummaries();
  }, [activeTab]);

  const fetchExamDetails = async () => {
    try {
      const res = await API.get(`/exams/${id}`);
      setExam(res.data.exam);
      setQuestions(res.data.exam.questions || []);
      const stored = localStorage.getItem(shuffleKey);
      if (stored !== null) setShuffleEnabled(JSON.parse(stored));
      else if (res.data.exam.shuffle_questions != null) {
        const v = !!res.data.exam.shuffle_questions;
        setShuffleEnabled(v);
        localStorage.setItem(shuffleKey, JSON.stringify(v));
      }
    } catch {
      Swal.fire("Error!", "Failed to load exam details", "error");
      navigate("/instructor/exams");
    } finally { setLoading(false); }
  };

  const fetchEssayStats = async () => {
    try { const res = await API.get(`/exams/${id}/essays/stats`); setEssayStats(res.data); } catch {}
  };

  const fetchEssayData = async () => {
    setEssayLoading(true);
    try {
      const res = await API.get(`/exams/${id}/essays/pending`);
      setEssayData(res.data);
      setEssayStats({ has_essays:true, pending_count:res.data.pending_count });
      setEssayLoaded(true);
    } catch { Swal.fire("Error!", "Failed to load essay data.", "error"); }
    finally { setEssayLoading(false); }
  };

  const fetchAnomalySummaries = async () => {
    setAnomalyLoading(true);
    try {
      const res = await API.get(`/exams/${id}/anomalies/summary`);
      setSummaries(res.data.summaries || []);
      setAnomalyLoaded(true);
    } catch { Swal.fire("Error!", "Failed to load anomaly data.", "error"); }
    finally { setAnomalyLoading(false); }
  };

  const openStudentDetail = async (submissionId) => {
    setDetailLoading(true); setDetailData(null);
    try {
      const res = await API.get(`/exams/${id}/submissions/${submissionId}/anomalies`);
      const flat = [];
      for (const k of ["tab_switch","keyboard_shortcut","response_time","keystroke_dynamics"]) {
        (Array.isArray(res.data.logs?.[k]) ? res.data.logs[k] : []).forEach(log => flat.push({ ...log, type:k }));
      }
      flat.sort((a,b) => new Date(a.occurred_at) - new Date(b.occurred_at));
      setDetailData({ ...res.data, logs:flat });
    } catch { Swal.fire("Error", "Could not load student detail.", "error"); }
    finally { setDetailLoading(false); }
  };

  const markReviewed = async (logId, logType, reviewed) => {
    const { value:notes } = await Swal.fire({
      title: reviewed ? "Mark as Reviewed" : "Reopen Log",
      input:"textarea", inputLabel:"Reviewer notes (optional)",
      inputPlaceholder:"Add your observations…", showCancelButton:true,
      confirmButtonText: reviewed ? "Mark Reviewed" : "Reopen",
    });
    if (notes === undefined) return;
    try {
      await API.patch(`/exams/${id}/anomalies/${logId}/review?type=${logType}`, { reviewed, reviewer_notes:notes||null });
      Swal.fire({ toast:true, position:"top-end", icon:"success", title:"Saved", showConfirmButton:false, timer:2000 });
      if (detailData) openStudentDetail(detailData.submission.id);
    } catch { Swal.fire("Error", "Failed to save review.", "error"); }
  };

  const handleDeleteQuestion = async (questionId) => {
    const result = await Swal.fire({
      title:"Delete this question?", text:"This cannot be undone.", icon:"warning",
      showCancelButton:true, confirmButtonColor:"#d33", confirmButtonText:"Yes, delete it!",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/exams/${id}/questions/${questionId}`);
      setQuestions(questions.filter(q => q.id !== questionId));
      Swal.fire("Deleted!", "Question removed.", "success");
      fetchExamDetails();
    } catch { Swal.fire("Error!", "Failed to delete question.", "error"); }
  };

  const handleSaveEdit = async (questionId, payload) => {
    try {
      const res = await API.put(`/exams/${id}/questions/${questionId}`, payload);
      setQuestions(prev => prev.map(q => q.id===questionId ? res.data.question : q));
      setEditingQuestion(null);
      Swal.fire({ icon:"success", title:"Question updated!", timer:1500, showConfirmButton:false });
    } catch (err) { Swal.fire("Error!", err.response?.data?.message||"Failed to update question.", "error"); }
  };

  const handleShuffleToggle = async () => {
    const next = !shuffleEnabled;
    setShuffleSaving(true); setShuffleEnabled(next);
    localStorage.setItem(shuffleKey, JSON.stringify(next));
    try {
      await API.put(`/exams/${id}`, {
        course_id:exam.course_id, title:exam.title, description:exam.description||"",
        type:exam.type, start_time:exam.start_time, end_time:exam.end_time,
        duration_minutes:exam.duration_minutes, status:exam.status, shuffle_questions:next,
      });
      setExam(prev => ({ ...prev, shuffle_questions:next }));
      Swal.fire({ toast:true, position:"top-end", icon:"success", title:next?"Shuffle ON":"Shuffle OFF", showConfirmButton:false, timer:2000 });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "";
      const dbMissing = [422,500].includes(err?.response?.status) || msg.toLowerCase().includes("column") || msg.toLowerCase().includes("shuffle");
      if (dbMissing) {
        Swal.fire({ toast:true, position:"top-end", icon:"warning", title:`Shuffle ${next?"ON":"OFF"} (saved locally)`, text:"Add the shuffle_questions migration to persist permanently.", showConfirmButton:false, timer:5000 });
      } else {
        setShuffleEnabled(!next); localStorage.setItem(shuffleKey, JSON.stringify(!next));
        Swal.fire({ icon:"error", title:"Could not save shuffle setting", text:msg });
      }
    } finally { setShuffleSaving(false); }
  };

  const anomalyStats = {
    flagged: summaries.filter(s => s.flag_status==="flagged").length,
    warning: summaries.filter(s => s.flag_status==="warning").length,
    clear:   summaries.filter(s => s.flag_status==="none").length,
  };
  const filteredSummaries = summaries.filter(s => {
    if (anomalyFilter!=="all" && s.flag_status!==anomalyFilter) return false;
    if (anomalySearch.trim()) {
      const q = anomalySearch.toLowerCase();
      return s.student?.name?.toLowerCase().includes(q) || s.student?.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPoints = questions.reduce((sum, q) => sum + (q.points||0), 0);
  const hasEssays   = questions.some(q => q.type==="essay");

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status"/>
    </div>
  );

  return (
    <div className="container-fluid p-4" style={{ maxWidth:1200 }}>

      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/instructor/exams" className="text-decoration-none">Exams</Link></li>
          <li className="breadcrumb-item active">{exam.title}</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h3 className="mb-1 fw-bold">{exam.title}</h3>
          <p className="text-muted mb-0">
            <Link to={`/instructor/courses/${exam.course?.id}`} className="text-decoration-none text-muted">
              <i className="bi bi-folder2 me-1"></i>{exam.course?.code} — {exam.course?.name}
            </Link>
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to={`/instructor/exams/${id}/edit`} className="btn btn-outline-secondary">
            <i className="bi bi-pencil me-2"></i>Edit Exam
          </Link>
          {activeTab==="questions" && (
            <button className="btn btn-primary" onClick={() => setShowQuestionModal(true)}>
              <i className="bi bi-plus-circle me-2"></i>Add Question
            </button>
          )}
          {activeTab==="anomalies" && (
            <button className="btn btn-outline-secondary" onClick={() => { setAnomalyLoaded(false); fetchAnomalySummaries(); }}>
              <i className="bi bi-arrow-clockwise me-2"></i>Refresh
            </button>
          )}
          {activeTab==="essays" && (
            <button className="btn btn-outline-secondary" onClick={() => { setEssayLoaded(false); fetchEssayData(); }}>
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
              { icon:"bi-tag",           label:"Type",         value:<span className="badge bg-secondary text-capitalize">{exam.type}</span> },
              { icon:"bi-clock",         label:"Duration",     value:`${exam.duration_minutes} min` },
              { icon:"bi-trophy",        label:"Total Points", value:`${totalPoints} pts` },
              { icon:"bi-list-ol",       label:"Questions",    value:questions.length },
              { icon:"bi-calendar-event",label:"Start",        value:new Date(exam.start_time).toLocaleString() },
              { icon:"bi-calendar-x",    label:"End",          value:new Date(exam.end_time).toLocaleString() },
            ].map(({ icon, label, value }) => (
              <div key={label} className="col-auto">
                <div className="text-muted small"><i className={`bi ${icon} me-1`}></i>{label}</div>
                <div className="fw-semibold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isNewExam && questions.length===0 && (
        <div className="alert alert-primary border-primary d-flex align-items-start gap-3 mb-3">
          <i className="bi bi-lightbulb-fill fs-5 text-primary mt-1 flex-shrink-0"></i>
          <div>
            <strong>Exam created! Next step: add your questions.</strong>
            <p className="mb-2 mt-1 small text-muted">Your exam has no questions yet.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowQuestionModal(true)}>
              <i className="bi bi-plus-circle me-2"></i>Add First Question
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {[
          { key:"questions", icon:"bi-list-ol",         label:"Questions",      badge:questions.length, badgeColor:"primary" },
          { key:"results",   icon:"bi-people",           label:"Student Results" },
          ...(hasEssays ? [{ key:"essays", icon:"bi-textarea", label:"Essay Grading",
            badge:essayStats?.pending_count>0 ? essayStats.pending_count : null, badgeColor:"warning" }] : []),
          { key:"anomalies", icon:"bi-shield-exclamation",label:"Anomaly Monitor",
            badge:anomalyLoaded&&anomalyStats.flagged>0 ? anomalyStats.flagged : null, badgeColor:"danger" },
        ].map(({ key, icon, label, badge, badgeColor }) => (
          <li key={key} className="nav-item">
            <button className={`nav-link ${activeTab===key?"active fw-semibold":""}`} onClick={() => setActiveTab(key)}>
              <i className={`bi ${icon} me-2`}></i>{label}
              {badge != null && <span className={`badge bg-${badgeColor} ${badgeColor==="warning"?"text-dark":""} ms-2`}>{badge}</span>}
            </button>
          </li>
        ))}
      </ul>

      {/* ══ QUESTIONS TAB ══ */}
      {activeTab==="questions" && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h6 className="mb-0 fw-semibold">
              <i className="bi bi-list-ol me-2 text-primary"></i>
              {questions.length} Question{questions.length!==1?"s":""} · {totalPoints} total pts
            </h6>
            <div className="d-flex align-items-center gap-2">
              <div
                className={`d-flex align-items-center gap-2 px-3 py-1 rounded-pill border ${shuffleEnabled?"border-success bg-success bg-opacity-10":"border-secondary bg-light"}`}
                style={{ cursor:shuffleSaving?"wait":"pointer", userSelect:"none" }}
                onClick={!shuffleSaving ? handleShuffleToggle : undefined}
              >
                {shuffleSaving
                  ? <span className="spinner-border spinner-border-sm text-secondary"/>
                  : <i className={`bi ${shuffleEnabled?"bi-shuffle text-success":"bi-list-ol text-secondary"}`}></i>}
                <span className={`small fw-semibold ${shuffleEnabled?"text-success":"text-muted"}`}>
                  {shuffleEnabled?"Shuffle ON":"Shuffle OFF"}
                </span>
                <div className={`rounded-pill ${shuffleEnabled?"bg-success":"bg-secondary"}`} style={{width:28,height:16,position:"relative",flexShrink:0}}>
                  <div style={{position:"absolute",top:2,left:shuffleEnabled?14:2,width:12,height:12,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowQuestionModal(true)}>
                <i className="bi bi-plus me-1"></i>Add Question
              </button>
            </div>
          </div>
          {shuffleEnabled && questions.length>1 && (
            <div className="alert alert-success border-0 rounded-0 mb-0 py-2 px-4" style={{fontSize:13}}>
              <i className="bi bi-shuffle me-2"></i>
              <strong>Shuffle is ON</strong> — each student receives questions in a randomised order.
            </div>
          )}
          <div className="card-body p-0">
            {questions.length===0 ? (
              <div className="text-center py-5">
                <i className="bi bi-patch-question fs-1 text-muted d-block mb-2"></i>
                <p className="text-muted mb-3">No questions yet.</p>
                <button className="btn btn-primary" onClick={() => setShowQuestionModal(true)}>
                  <i className="bi bi-plus-circle me-2"></i>Add First Question
                </button>
              </div>
            ) : questions.map((question, index) => (
              <div key={question.id} className="border-bottom p-4">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-light text-dark border fw-bold">Q{index+1}</span>
                      <span className="badge bg-primary bg-opacity-10 text-primary">
                        <i className={`bi ${QTYPE_ICON[question.type]||"bi-question"} me-1`}></i>
                        {question.type.replace("_"," ")}
                      </span>
                      <span className="badge bg-success bg-opacity-10 text-success">
                        <i className="bi bi-trophy me-1"></i>{question.points} pts
                      </span>
                    </div>
                    <p className="mb-2 fw-semibold">{question.question_text}</p>
                    {question.type==="multiple_choice" && question.options && (
                      <div className="ms-2">
                        {question.options.map((opt, idx) => (
                          <div key={idx} className={`d-flex align-items-center gap-2 mb-1 ${opt===question.correct_answer?"text-success fw-semibold":"text-muted"}`}>
                            <span className={`badge ${opt===question.correct_answer?"bg-success":"bg-light text-dark border"}`} style={{minWidth:24}}>
                              {String.fromCharCode(65+idx)}
                            </span>
                            <small>{opt}</small>
                            {opt===question.correct_answer && <i className="bi bi-check-circle-fill text-success"></i>}
                          </div>
                        ))}
                      </div>
                    )}
                    {question.type==="true_false" && (
                      <div className="ms-2"><small className="text-muted">Correct: </small><span className="badge bg-success">{question.correct_answer}</span></div>
                    )}
                    {question.type==="essay" && (
                      <div className="ms-2 d-flex gap-3">
                        {question.max_words && <small className="text-muted"><i className="bi bi-type me-1"></i>Max {question.max_words} words</small>}
                        {question.rubric    && <small className="text-muted fst-italic"><i className="bi bi-journal-text me-1"></i>{question.rubric.slice(0,80)}{question.rubric.length>80?"…":""}</small>}
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-1 flex-shrink-0">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingQuestion(question)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteQuestion(question.id)}><i className="bi bi-trash"></i></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ STUDENT RESULTS TAB ══ */}
      {activeTab==="results" && <StudentResultsTab examId={id} anomalySummaries={summaries}/>}

      {/* ══ ESSAY GRADING TAB ══ */}
      {activeTab==="essays" && (
        essayLoading ? (
          <div className="text-center py-5"><div className="spinner-border text-warning"/><p className="text-muted mt-3">Loading essay responses…</p></div>
        ) : (
          <>
            <div className="row g-3 mb-4">
              {[
                { label:"Ungraded",          value:essayData?.pending_count??0,                                                                                     color:"warning", icon:"bi-hourglass-split" },
                { label:"Total Submissions", value:essayData?.submissions?.length??0,                                                                              color:"primary", icon:"bi-people"          },
                { label:"Fully Graded",      value:(essayData?.submissions??[]).filter(s => s.essays.every(e => isEssayGraded(e))).length, color:"success", icon:"bi-check2-all"    },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="col-md-4">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body d-flex align-items-center gap-3 py-3">
                      <div className={`rounded-circle bg-${color} bg-opacity-10 d-flex align-items-center justify-content-center`} style={{width:44,height:44}}>
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
            {essayData?.pending_count > 0 && (
              <div className="alert alert-warning d-flex align-items-center gap-3 mb-3">
                <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0"></i>
                <div>
                  <strong>{essayData.pending_count} essay answer{essayData.pending_count!==1?"s":""} need grading.</strong>
                  <span className="ms-2 text-muted small">Ungraded essays are excluded from the student's final score.</span>
                </div>
              </div>
            )}
            {!essayData || essayData.submissions.length===0 ? (
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="bi bi-textarea fs-1 text-muted d-block mb-2"></i>
                  <p className="text-muted">No essay responses yet.</p>
                </div>
              </div>
            ) : essayData.submissions.map(sub => (
              <EssaySubmissionCard key={sub.submission_id} sub={sub} examId={id}
                onGraded={() => { setEssayLoaded(false); fetchEssayData(); }}/>
            ))}
          </>
        )
      )}

      {/* ══ ANOMALY MONITOR TAB ══ */}
      {activeTab==="anomalies" && (
        anomalyLoading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"/><p className="text-muted mt-3">Loading anomaly data…</p></div>
        ) : (
          <>
            <div className="row g-3 mb-4">
              {[
                { label:"Flagged", value:anomalyStats.flagged, color:"danger",  icon:"bi-shield-x",            key:"flagged" },
                { label:"Warning", value:anomalyStats.warning, color:"warning", icon:"bi-exclamation-triangle", key:"warning" },
                { label:"Clear",   value:anomalyStats.clear,   color:"success", icon:"bi-shield-check",         key:"none"    },
                { label:"Total",   value:summaries.length,     color:"primary", icon:"bi-people",               key:"all"     },
              ].map(({ label, value, color, icon, key }) => (
                <div key={label} className="col-md-3">
                  <div className={`card border-0 shadow-sm h-100 ${anomalyFilter===key?`border-${color} border-2`:""}`}
                    style={{ cursor:"pointer", outline:anomalyFilter===key?`2px solid var(--bs-${color})`:"none" }}
                    onClick={() => setAnomalyFilter(anomalyFilter===key?"all":key)}>
                    <div className="card-body d-flex align-items-center gap-3 py-3">
                      <div className={`rounded-circle bg-${color} bg-opacity-10 d-flex align-items-center justify-content-center`} style={{width:44,height:44}}>
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
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white d-flex gap-3 align-items-center flex-wrap">
                <h6 className="mb-0 fw-semibold me-auto">Student Risk Overview</h6>
                <div className="input-group" style={{maxWidth:250}}>
                  <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                  <input type="text" className="form-control border-start-0" placeholder="Search student…"
                    value={anomalySearch} onChange={e => setAnomalySearch(e.target.value)}/>
                </div>
              </div>
              <div className="card-body p-0">
                {summaries.length===0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-shield-check fs-1 d-block mb-2"></i>No anomaly data yet.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>STUDENT</th><th>CPI SCORE</th><th>FLAG</th>
                          <th className="text-center"><i className="bi bi-box-arrow-up-right"></i> Tabs</th>
                          <th className="text-center"><i className="bi bi-keyboard"></i> Keys</th>
                          <th className="text-center"><i className="bi bi-clock"></i> Response</th>
                          <th className="text-center"><i className="bi bi-activity"></i> Keystroke</th>
                          {/* <th>ACTIONS</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSummaries.length===0 ? (
                          <tr><td colSpan="8" className="text-center text-muted py-4">No students match your filter.</td></tr>
                        ) : filteredSummaries.map(s => (
                          <tr key={s.submission_id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{width:34,height:34,fontSize:13,flexShrink:0}}>
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
                                <div className="progress flex-grow-1" style={{height:8,minWidth:80}}>
                                  <div className={`progress-bar ${riskBgClass(s.cpi_score??0)}`} style={{width:`${Math.min(s.cpi_score??0,100)}%`}}/>
                                </div>
                                <span className={`fw-bold ${riskColor(s.cpi_score??0)}`}>{(s.cpi_score??0).toFixed(1)}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${s.is_flagged?"bg-danger":(s.cpi_score??0)>=25?"bg-warning text-dark":"bg-success"}`}>
                                {s.is_flagged?"Flagged":(s.cpi_score??0)>=25?"Possible":"Unlikely"}
                              </span>
                            </td>
                            <td className="text-center">{s.tab_switch_count}</td>
                            <td className="text-center">{s.keyboard_shortcut_count}</td>
                            <td className="text-center">{s.response_time_anomaly_count}</td>
                            <td className="text-center">{s.keystroke_anomaly_count}</td>
                            {/* <td>
                              <button className="btn btn-sm btn-outline-primary" onClick={() => openStudentDetail(s.submission_id)}>
                                <i className="bi bi-eye me-1"></i>Details
                              </button>
                            </td> */}
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
        onSuccess={q => { setQuestions([...questions, q]); setShowQuestionModal(false); fetchExamDetails(); }}/>
      <EditQuestionModal question={editingQuestion} onHide={() => setEditingQuestion(null)} onSave={handleSaveEdit}/>
      {(detailLoading || detailData) && (
        <StudentDetailModal loading={detailLoading} data={detailData}
          onClose={() => setDetailData(null)} onMarkReviewed={markReviewed}/>
      )}
    </div>
  );
};

export default ExamDetail;