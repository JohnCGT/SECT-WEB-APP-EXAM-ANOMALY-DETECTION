import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";

/* ─── Constants ─────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/instructor",                  icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/instructor/courses",          icon: "bi-book",                 label: "Courses"   },
  { to: "/instructor/exams",            icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/instructor/students",         icon: "bi-people",               label: "Students"  },
  { to: "/instructor/alerts",           icon: "bi-exclamation-triangle", label: "Alerts"    },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

const TYPE_LABELS = {
  tab_switch:         "Tab Switch",
  keyboard_shortcut:  "Keyboard",
  response_time:      "Response",
  keystroke_dynamics: "Keystroke",
};
const SEVERITY_MAP = {
  high:   { bg: "#fef2f2", color: "#dc2626", label: "High"   },
  medium: { bg: "#fff7ed", color: "#d97706", label: "Med"    },
  low:    { bg: "#f1f5f9", color: "#64748b", label: "Low"    },
};
const QTYPE_ICON = {
  multiple_choice: "bi-ui-radios",
  true_false:      "bi-toggle-on",
  essay:           "bi-textarea",
};

const riskColor   = (s) => s >= 50 ? "#ef4444"  : s >= 20 ? "#d97706"  : "#22c55e";
const riskBgColor = (s) => s >= 50 ? "#fef2f2"  : s >= 20 ? "#fff7ed"  : "#f0fdf4";
const cpiLabel    = (s) => s >= 75 ? "Highly Likely" : s >= 50 ? "Likely" : s >= 25 ? "Possible" : "Unlikely";
const isEssayGraded = (e) => e.points_earned !== null && e.points_earned !== undefined;

/* ─── Pagination ─────────────────────────────────────────────────────────── */
const Pagination = ({ total, page, perPage, onChange }) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#94a3b8" }}>
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(0,86,179,.15)", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? .4 : 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#64748b" }}>
          <i className="bi bi-chevron-left"></i>
        </button>
        {pages.map(p => (
          <button key={p} onClick={() => onChange(p)}
            style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${p === page ? "#0056b3" : "rgba(0,86,179,.15)"}`, background: p === page ? "#0056b3" : "#fff", color: p === page ? "#fff" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {p}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(0,86,179,.15)", background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? .4 : 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#64748b" }}>
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};

/* ─── jsPDF (CDN, on-demand) ────────────────────────────────────────────── */
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
  const fmt = (d) => d ? new Date(d).toLocaleString("en-PH") : "-";
  doc.autoTable({
    startY: y, margin:{left:ML,right:MR}, tableWidth:CW, head:[],
    body:[["Status",(submission.status||"-").toUpperCase()],["Started",fmt(submission.started_at)],["Submitted",fmt(submission.submitted_at)]],
    columnStyles:{0:{cellWidth:28,fontStyle:"bold",textColor:MUTED,fontSize:7},1:{textColor:DARK,fontSize:8}},
    styles:{cellPadding:{top:1.5,bottom:1.5,left:3,right:3},lineColor:[240,240,248],lineWidth:0.1},
    theme:"grid",
  });
  y = doc.lastAutoTable.finalY + 6;
  sectionHeader("ACADEMIC INTEGRITY");
  if (integrity) {
    const cpi = integrity.cpi_score ?? 0;
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
    doc.text("CPI = (0.40 x SVM) + (0.30 x IsoForest-Tab) + (0.15 x IsoForest-RT) + (0.15 x HMM)", ML, y);
    y += 5;
    doc.autoTable({
      startY:y, margin:{left:ML,right:MR}, tableWidth:CW,
      head:[["Algorithm","Raw Score","Flag","Event Count","Weight"]],
      body:[
        ["One-Class SVM",          integrity.svm_score     != null ? integrity.svm_score.toFixed(4)     : "-", integrity.svm_flagged     ? "Flagged":"OK", `Shortcuts: ${integrity.keyboard_shortcut_count}`,            "0.40"],
        ["Isolation Forest (Tab)", integrity.iso_tab_score != null ? integrity.iso_tab_score.toFixed(4) : "-", integrity.iso_tab_flagged ? "Flagged":"OK", `Tab switches: ${integrity.tab_switch_count}`,                 "0.30"],
        ["Isolation Forest (RT)",  integrity.rt_score      != null ? integrity.rt_score.toFixed(4)      : "-", integrity.rt_flagged      ? "Flagged":"OK", `Response anomalies: ${integrity.response_time_anomaly_count}`,"0.15"],
        ["Hidden Markov Model",    integrity.hmm_score     != null ? integrity.hmm_score.toFixed(4)     : "-", integrity.hmm_flagged     ? "Flagged":"OK", `Keystroke anomalies: ${integrity.keystroke_anomaly_count}`,    "0.15"],
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
    const blockH = HEADER_H + wrappedQ.length * LINE_H_LG + (wrappedRub.length ? wrappedRub.length * LINE_H_SM + 2 : 0) + wrappedAns.length * LINE_H_LG + (!isEssay && ans.correct_answer ? LINE_H_SM + 1 : 0) + (wrappedFb.length ? wrappedFb.length * LINE_H_SM + 2 : 0) + BOTTOM_PAD;
    ensureSpace(blockH);
    doc.setFillColor(...stripeColor); doc.rect(ML, y, 1.5, blockH, "F");
    doc.setFillColor(250,250,254);    doc.rect(ML + 1.5, y, CW - 1.5, blockH, "F");
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
      if (earned === null || earned === undefined) { doc.setTextColor(...ORANGE); doc.text("Pending grade", ML + 42, y + 5.2); }
      else { doc.setTextColor(earned>0?GREEN[0]:RED[0], earned>0?GREEN[1]:RED[1], earned>0?GREEN[2]:RED[2]); doc.text(`Graded: ${earned} pts`, ML + 42, y + 5.2); }
    }
    const ptStr = earned != null ? `${earned} / ${ans.points} pts` : `- / ${ans.points} pts`;
    doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(...stripeColor);
    doc.text(ptStr, ML + CW - 2, y + 5.5, { align:"right" });
    let iy = y + HEADER_H;
    doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(...DARK);
    doc.text(wrappedQ, ML + 4, iy); iy += wrappedQ.length * LINE_H_LG;
    if (wrappedRub.length) { iy += 2; doc.setFont("helvetica","italic"); doc.setFontSize(6.5); doc.setTextColor(...MUTED); doc.text(wrappedRub, ML + 4, iy); iy += wrappedRub.length * LINE_H_SM; }
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(...DARK);
    doc.text(wrappedAns, ML + 4, iy); iy += wrappedAns.length * LINE_H_LG;
    if (!isEssay && ans.correct_answer) { iy += 1; doc.setFont("helvetica","italic"); doc.setFontSize(6.5); doc.setTextColor(...MUTED); doc.text(`Correct: ${ans.correct_answer}`, ML + 4, iy); iy += LINE_H_SM; }
    if (wrappedFb.length) { iy += 2; doc.setFont("helvetica","italic"); doc.setFontSize(6.5); doc.setTextColor(...GREEN); doc.text(wrappedFb, ML + 4, iy); }
    y += blockH + 3;
  }
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

/* ─── Shared CSS ─────────────────────────────────────────────────────────── */
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{
    --blue:#0056b3;--blue-mid:#1a6ed8;--blue-lite:#e8f0fe;
    --slate:#64748b;--slate-lt:#94a3b8;
    --card-bg:#ffffff;--card-br:16px;
    --card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);
  }
  .dash-card{
    background:var(--card-bg);border-radius:var(--card-br);
    box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);
    overflow:hidden;transition:box-shadow .2s;
  }
  .glass-sidebar{
    background:rgba(255,255,255,0.60);
    backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
    border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);
  }
  .nav-pill{
    display:flex;flex-direction:column;align-items:center;
    padding:10px 8px;border-radius:12px;gap:4px;
    font-size:11px;font-weight:600;text-decoration:none;
    color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;
  }
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .topbar{
    background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:200;height:56px;
    display:flex;align-items:center;padding:0 20px;gap:12px;
  }
  .dash-avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  .skeleton{
    background:linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);
    background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;
  }
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}

  /* Tabs */
  .dash-tabs{display:flex;gap:4px;border-bottom:2px solid #f1f5f9;margin-bottom:20px;overflow-x:auto;scrollbar-width:none;padding-bottom:0;}
  .dash-tabs::-webkit-scrollbar{display:none;}
  .dash-tab{
    padding:10px 14px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;
    color:#64748b;border-bottom:2px solid transparent;margin-bottom:-2px;white-space:nowrap;
    transition:color .15s,border-color .15s;border-radius:8px 8px 0 0;font-family:'DM Sans',sans-serif;
    display:flex;align-items:center;gap:6px;flex-shrink:0;
  }
  .dash-tab:hover{color:#0056b3;background:#f8faff;}
  .dash-tab.active{color:#0056b3;border-bottom-color:#0056b3;background:#e8f0fe;}
  /* On mobile: show icon + short label */
  .tab-label-full{display:inline;}
  .tab-label-short{display:none;}

  /* Table */
  .dash-table{width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif;}
  .dash-table th{padding:10px 16px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.06em;white-space:nowrap;border-bottom:1px solid #f1f5f9;background:#f8faff;}
  .dash-table td{padding:12px 16px;border-bottom:1px solid #f1f5f9;vertical-align:middle;font-size:13px;}
  .dash-table tbody tr{transition:background .15s;}
  .dash-table tbody tr:hover{background:#f8faff;}
  .dash-table tbody tr:last-child td{border-bottom:none;}

  /* Mobile card list (hidden on desktop) */
  .mobile-card-list{display:none;}
  .desktop-table{display:block;}

  /* Buttons */
  .dash-btn-primary{
    background:var(--blue);color:#fff;border:none;border-radius:10px;
    padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;
    font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;
    transition:opacity .15s,transform .15s;text-decoration:none;
  }
  .dash-btn-primary:hover{opacity:.87;transform:translateY(-1px);color:#fff;}
  .dash-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .dash-btn-ghost{
    background:#fff;border:1px solid rgba(0,86,179,.15);color:#64748b;
    border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;
    transition:all .15s;text-decoration:none;
  }
  .dash-btn-ghost:hover{background:#f1f5f9;}
  .dash-btn-danger{
    background:#fef2f2;border:1px solid #fecaca;color:#ef4444;
    border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;
    transition:all .15s;
  }
  .dash-btn-danger:hover{background:#ef4444;color:#fff;}
  .dash-btn-success{
    background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;
    border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;
    transition:all .15s;
  }
  .dash-btn-success:hover{background:#15803d;color:#fff;}
  .action-btn{
    width:30px;height:30px;border-radius:8px;border:1px solid rgba(0,86,179,.12);
    background:#fff;display:inline-flex;align-items:center;justify-content:center;
    cursor:pointer;transition:all .15s;font-size:13px;text-decoration:none;color:#64748b;
  }
  .action-btn:hover{background:var(--blue-lite);border-color:var(--blue);color:var(--blue);}
  .action-btn.del:hover{background:#fef2f2;border-color:#ef4444;color:#ef4444;}

  /* Pills / badges */
  .badge-pill{
    display:inline-flex;align-items:center;padding:2px 9px;border-radius:99px;
    font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  }

  /* Modals */
  .dash-modal-overlay{
    position:fixed;inset:0;background:rgba(15,23,42,.5);
    backdrop-filter:blur(4px);z-index:1060;
    display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;
  }
  .dash-modal{
    background:#fff;border-radius:20px;width:100%;max-width:580px;
    box-shadow:0 24px 64px rgba(0,0,0,.18);overflow:hidden;
    display:flex;flex-direction:column;max-height:calc(100vh - 32px);
    animation:fadeUp .25s ease;
  }
  .dash-modal.lg{max-width:760px;}
  .dash-modal.xl{max-width:1000px;}
  .dash-modal-hdr{padding:20px 24px 16px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0;}
  .dash-modal-body{overflow-y:auto;padding:20px 24px;flex:1;}
  .dash-modal-ftr{padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;}

  /* Form */
  .form-lbl{font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;display:block;}
  .form-ctrl{
    width:100%;border:1px solid rgba(0,86,179,.15);border-radius:10px;
    padding:9px 13px;font-size:13px;color:#1e293b;outline:none;
    font-family:'DM Sans',sans-serif;background:#f8faff;
    transition:border-color .2s,box-shadow .2s;
  }
  .form-ctrl:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .form-ctrl:disabled{opacity:.6;cursor:not-allowed;}

  /* Info strip */
  .info-strip{display:flex;flex-wrap:wrap;gap:0;border-bottom:1px solid #f1f5f9;}
  .info-item{padding:12px 16px;border-right:1px solid #f1f5f9;flex:0 0 auto;}
  .info-item:last-child{border-right:none;}
  .info-item-label{font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.05em;text-transform:uppercase;margin-bottom:3px;}
  .info-item-value{font-size:13px;font-weight:700;color:#1e293b;}

  /* Essay card */
  .essay-card-hdr{
    padding:14px 18px;display:flex;align-items:center;gap:12px;cursor:pointer;
    border-bottom:1px solid #f1f5f9;transition:background .15s;
  }
  .essay-card-hdr:hover{background:#f8faff;}

  /* Shuffle toggle */
  .shuffle-toggle{
    display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:99px;
    cursor:pointer;user-select:none;transition:all .15s;border:1px solid rgba(0,86,179,.15);
    background:#f8faff;
  }
  .shuffle-toggle.on{background:#f0fdf4;border-color:#bbf7d0;}

  /* Stats grid for anomaly / essay */
  .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;}
  .stat-card{
    background:#fff;border-radius:14px;border:1px solid rgba(0,86,179,.06);
    box-shadow:0 1px 3px rgba(0,0,0,.04);padding:12px 14px;
    display:flex;align-items:center;gap:10px;cursor:pointer;transition:box-shadow .15s,transform .15s;
  }
  .stat-card:hover{box-shadow:0 4px 16px rgba(0,86,179,.10);transform:translateY(-1px);}
  .stat-card.selected{box-shadow:0 4px 16px rgba(0,86,179,.15);outline:2px solid currentColor;}
  .stat-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .stat-icon i{font-size:16px;}

  /* Bottom nav */
  .instructor-bottom-nav{
    position:fixed;bottom:0;left:0;right:0;height:64px;
    background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);
    border-top:1px solid rgba(0,86,179,0.10);
    display:flex;align-items:stretch;z-index:1030;
    box-shadow:0 -4px 24px rgba(0,86,179,0.08);
  }
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bnav-item i{font-size:19px;}

  /* Q card */
  .q-card{padding:16px 20px;border-bottom:1px solid #f1f5f9;transition:background .15s;}
  .q-card:hover{background:#f8faff;}
  .q-card:last-child{border-bottom:none;}

  /* Mobile student/anomaly cards */
  .mobile-item-card{
    background:#fff;border-radius:14px;border:1px solid rgba(0,86,179,.07);
    box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;margin-bottom:8px;
  }
  .mobile-item-card-body{padding:14px 16px;}
  .mobile-item-card-footer{
    padding:9px 16px;border-top:1px solid rgba(0,86,179,.06);
    background:#fafbff;display:flex;align-items:center;justify-content:space-between;gap:8px;
  }

  @media(max-width:767px){
    .dash-tab{padding:8px 10px;font-size:12px;gap:4px;}
    .tab-label-full{display:none;}
    .tab-label-short{display:inline;}
    .info-strip{flex-wrap:wrap;}
    .info-item{flex:1 0 calc(50% - 1px);border-right:none;border-bottom:1px solid #f1f5f9;}
    .info-item:nth-child(odd){border-right:1px solid #f1f5f9;}
    .info-item:last-child{border-bottom:none;}
    .mobile-card-list{display:flex;flex-direction:column;}
    .desktop-table{display:none;}
    .stats-grid{grid-template-columns:1fr 1fr;}
    .modal-grid-2{grid-template-columns:1fr!important;}
    .page-header-actions{flex-direction:column;align-items:stretch!important;}
    .page-header-actions .dash-btn-ghost,
    .page-header-actions .dash-btn-primary{justify-content:center;}
  }
  @media(max-width:480px){
    .dash-tab{padding:8px 8px;font-size:11px;}
    .stats-grid{grid-template-columns:1fr 1fr;}
  }
`;

/* ─── Bottom Nav ─────────────────────────────────────────────────────────── */
const InstructorBottomNav = ({ active }) => {
  const items = [
    { to: "/instructor",                  icon: "bi-speedometer2",      label: "Home"     },
    { to: "/instructor/exams",            icon: "bi-file-earmark-text", label: "Exams"    },
    { to: "/instructor/students",         icon: "bi-people",            label: "Students" },
    { to: "/instructor/account-settings", icon: "bi-gear",              label: "Settings" },
  ];
  return (
    <nav className="instructor-bottom-nav d-lg-none">
      {items.map(({ to, icon, label }) => (
        <Link key={to} to={to} className="bnav-item"
          style={{ color: active === label ? "#0056b3" : "#94a3b8", borderTop: active === label ? "2px solid #0056b3" : "2px solid transparent" }}>
          <i className={`bi ${icon}`}></i>{label}
        </Link>
      ))}
    </nav>
  );
};

/* ─── MetadataSummary ──────────────────────────────────────────────────────*/
const MetadataSummary = ({ type, meta }) => {
  if (!meta) return <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>;
  switch (type) {
    case "tab_switch":         return <span style={{ fontSize: 12 }}>Hidden {((meta.hidden_duration_ms??0)/1000).toFixed(1)}s · #{meta.count_in_session}</span>;
    case "keyboard_shortcut":  return <span style={{ fontSize: 12 }}><kbd style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 4, padding: "1px 5px", fontSize: 11 }}>{meta.keys}</kbd></span>;
    case "response_time":      return <span style={{ fontSize: 12 }}>{meta.direction==="too_fast"?"⚡ Fast":"🐢 Slow"} · {((meta.response_time_ms??0)/1000).toFixed(1)}s</span>;
    case "keystroke_dynamics": return <span style={{ fontSize: 12 }}>{meta.wpm?.toFixed(0)} WPM</span>;
    default:                   return <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>;
  }
};

/* ════════════════════════════════════════════════════════════════════════════
   STUDENT RESULTS TAB
════════════════════════════════════════════════════════════════════════════ */
const PER_PAGE_RESULTS = 10;

const StudentResultsTab = ({ examId, anomalySummaries }) => {
  const [submissions, setSubmissions]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [downloadingId, setDownloadingId] = useState(null);
  const [page, setPage]                   = useState(1);

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

  const filtered = useMemo(() => {
    setPage(1);
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return r.student?.name?.toLowerCase().includes(q) || r.student?.email?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [rows, statusFilter, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE_RESULTS;
    return filtered.slice(start, start + PER_PAGE_RESULTS);
  }, [filtered, page]);

  const handleDownloadPDF = async (submissionId) => {
    setDownloadingId(submissionId);
    try {
      const res = await API.get(`/exams/${examId}/submissions/${submissionId}/student-pdf`);
      await generateStudentPDF(res.data);
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to generate PDF.", "error");
    } finally { setDownloadingId(null); }
  };

  const PILL_FILTERS = [
    { key:"all",         label:"All",         bg:"#e8f0fe", color:"#0056b3"  },
    { key:"submitted",   label:"Submitted",   bg:"#f0fdf4", color:"#15803d"  },
    { key:"in_progress", label:"In Progress", bg:"#fff7ed", color:"#c2410c"  },
    { key:"not_started", label:"Not Started", bg:"#f1f5f9", color:"#64748b"  },
  ];

  const dtFmt = (d) => d ? new Date(d).toLocaleString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";

  if (loading) return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div className="spinner-border" style={{ color: "#0056b3" }} />
      <p style={{ marginTop: 12, fontSize: 13, color: "#94a3b8" }}>Loading student results…</p>
    </div>
  );

  const statusStyle = {
    submitted:   { bg: "#f0fdf4", color: "#15803d", label: "Submitted"   },
    in_progress: { bg: "#fff7ed", color: "#c2410c", label: "In Progress" },
    not_started: { bg: "#f1f5f9", color: "#64748b", label: "Not Started" },
  };

  return (
    <>
      {/* Filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        {PILL_FILTERS.map(({ key, label, bg, color }) => {
          const active = statusFilter === key;
          return (
            <button key={key}
              style={{ padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "'DM Sans',sans-serif", background: active ? bg : "#f1f5f9", color: active ? color : "#64748b", display: "flex", alignItems: "center", gap: 5, transition: "all .15s" }}
              onClick={() => setStatusFilter(key)}>
              {label}
              <span style={{ background: active ? "rgba(0,0,0,.1)" : "rgba(0,0,0,.06)", borderRadius: 99, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{counts[key]}</span>
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 12 }}></i>
            <input className="form-ctrl" style={{ paddingLeft: 30, maxWidth: 180, fontSize: 12 }} placeholder="Search…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="action-btn" onClick={load} title="Refresh"><i className="bi bi-arrow-clockwise"></i></button>
        </div>
      </div>

      {/* ── Desktop Table ── */}
      <div className="dash-card desktop-table">
        <div style={{ overflowX: "auto" }}>
          <table className="dash-table">
            <thead>
              <tr>
                {["STUDENT","STATUS","SCORE","%","CPI","SUBMITTED","ESSAYS","PDF"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <i className="bi bi-inbox" style={{ fontSize: 28, display: "block", marginBottom: 8 }}></i>No students match.
                </td></tr>
              ) : paginated.map((row) => {
                const status      = row.status ?? "not_started";
                const pct         = row.total_points > 0 && row.score != null ? ((row.score / row.total_points) * 100).toFixed(1) : null;
                const isNotStarted = status === "not_started";
                const downloading  = downloadingId === row.id;
                const ss = statusStyle[status] || statusStyle.not_started;
                return (
                  <tr key={row.student_id ?? row.id} style={{ opacity: isNotStarted ? .7 : 1 }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: isNotStarted ? "#e2e8f0" : "#0056b3", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {row.student?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{row.student?.name || "—"}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{row.student?.email || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-pill" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                    </td>
                    <td>
                      {row.score != null
                        ? <span style={{ fontWeight: 600, fontSize: 13 }}>{row.score} <span style={{ color: "#94a3b8", fontWeight: 400 }}>/ {row.total_points}</span></span>
                        : <span style={{ color: "#94a3b8" }}>—</span>}
                    </td>
                    <td>
                      {pct != null ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ height: 5, borderRadius: 99, background: "#f1f5f9", flex: 1, minWidth: 40, overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 99, width: `${pct}%`, background: pct>=75?"#22c55e":pct>=50?"#f59e0b":"#ef4444" }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{pct}%</span>
                        </div>
                      ) : <span style={{ color: "#94a3b8" }}>—</span>}
                    </td>
                    <td>
                      {row.cpi_score != null
                        ? <span className="badge-pill" style={{ background: riskBgColor(row.cpi_score), color: riskColor(row.cpi_score) }}>{row.cpi_score.toFixed(1)}%</span>
                        : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>{dtFmt(row.submitted_at)}</td>
                    <td>
                      {row.essay_count > 0
                        ? row.ungraded_count > 0
                          ? <span className="badge-pill" style={{ background: "#fff7ed", color: "#c2410c" }}>{row.ungraded_count} pending</span>
                          : <span className="badge-pill" style={{ background: "#f0fdf4", color: "#15803d" }}>Graded</span>
                        : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      {status==="submitted" && row.id
                        ? <button className="dash-btn-danger" style={{ fontSize: 11, padding: "4px 10px" }} disabled={downloading} onClick={() => handleDownloadPDF(row.id)}>
                            {downloading ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-file-earmark-pdf"></i>PDF</>}
                          </button>
                        : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination total={filtered.length} page={page} perPage={PER_PAGE_RESULTS} onChange={setPage} />
      </div>

      {/* ── Mobile Card List ── */}
      <div className="mobile-card-list">
        {paginated.length === 0 ? (
          <div className="dash-card" style={{ textAlign: "center", padding: "36px 20px", color: "#94a3b8" }}>
            <i className="bi bi-inbox" style={{ fontSize: 28, display: "block", marginBottom: 8 }}></i>No students match.
          </div>
        ) : paginated.map((row) => {
          const status = row.status ?? "not_started";
          const pct    = row.total_points > 0 && row.score != null ? ((row.score / row.total_points) * 100).toFixed(1) : null;
          const ss     = statusStyle[status] || statusStyle.not_started;
          const downloading = downloadingId === row.id;
          return (
            <div key={row.student_id ?? row.id} className="mobile-item-card">
              <div className="mobile-item-card-body">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0056b3", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {row.student?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.student?.name || "—"}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.student?.email || "—"}</div>
                  </div>
                  <span className="badge-pill" style={{ background: ss.bg, color: ss.color, flexShrink: 0 }}>{ss.label}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <div style={{ background: "#f8faff", borderRadius: 10, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 2 }}>SCORE</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                      {row.score != null ? `${row.score}/${row.total_points}` : "—"}
                    </div>
                  </div>
                  <div style={{ background: "#f8faff", borderRadius: 10, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 2 }}>PCT</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: pct != null ? (pct>=75?"#22c55e":pct>=50?"#f59e0b":"#ef4444") : "#94a3b8" }}>
                      {pct != null ? `${pct}%` : "—"}
                    </div>
                  </div>
                  <div style={{ background: "#f8faff", borderRadius: 10, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 2 }}>CPI</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: row.cpi_score != null ? riskColor(row.cpi_score) : "#94a3b8" }}>
                      {row.cpi_score != null ? `${row.cpi_score.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mobile-item-card-footer">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {row.essay_count > 0 && (
                    row.ungraded_count > 0
                      ? <span className="badge-pill" style={{ background: "#fff7ed", color: "#c2410c" }}>{row.ungraded_count} essay pending</span>
                      : <span className="badge-pill" style={{ background: "#f0fdf4", color: "#15803d" }}>Essays graded</span>
                  )}
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{dtFmt(row.submitted_at)}</span>
                </div>
                {status === "submitted" && row.id && (
                  <button className="dash-btn-danger" style={{ fontSize: 11, padding: "5px 10px", flexShrink: 0 }} disabled={downloading} onClick={() => handleDownloadPDF(row.id)}>
                    {downloading ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-file-earmark-pdf"></i>PDF</>}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <Pagination total={filtered.length} page={page} perPage={PER_PAGE_RESULTS} onChange={setPage} />
      </div>

      <p style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>
        <i className="bi bi-info-circle me-1"></i>PDF download only for submitted exams.
      </p>
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   ESSAY SUBMISSION CARD
════════════════════════════════════════════════════════════════════════════ */
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
    <div className="dash-card fade-up" style={{ marginBottom: 12, borderLeft: `3px solid ${allGraded ? "#22c55e" : "#f59e0b"}` }}>
      <div className="essay-card-hdr" onClick={() => setExpanded(v => !v)}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#0056b3", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
          {sub.student?.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.student?.name}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.student?.email}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0056b3" }}>{sub.score ?? "—"}/{sub.total_points}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>pts</div>
          </div>
          <span className="badge-pill" style={allGraded ? { background: "#f0fdf4", color: "#15803d" } : { background: "#fff7ed", color: "#c2410c" }}>
            {allGraded ? "Done" : `${pendingCount} left`}
          </span>
          <i className={`bi ${expanded ? "bi-chevron-up" : "bi-chevron-down"}`} style={{ color: "#94a3b8" }}></i>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "16px 20px" }}>
          {sub.essays.map((essay, idx) => (
            <div key={essay.question_id} style={{ marginBottom: idx < sub.essays.length-1 ? 24 : 0, paddingBottom: idx < sub.essays.length-1 ? 24 : 0, borderBottom: idx < sub.essays.length-1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                <span className="badge-pill" style={{ background: "#e8f0fe", color: "#0056b3", flexShrink: 0 }}>Q</span>
                <div>
                  <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{essay.question_text}</p>
                  <div style={{ display: "flex", gap: 14 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}><i className="bi bi-trophy me-1"></i>Max {essay.points} pts</span>
                    {essay.max_words && <span style={{ fontSize: 12, color: "#64748b" }}><i className="bi bi-type me-1"></i>Max {essay.max_words} words</span>}
                  </div>
                </div>
              </div>
              {essay.rubric && (
                <div style={{ padding: "10px 14px", background: "#f8faff", borderRadius: 10, border: "1px solid rgba(0,86,179,.08)", marginBottom: 12, fontSize: 13, color: "#64748b" }}>
                  <strong><i className="bi bi-journal-text me-1"></i>Rubric:</strong> {essay.rubric}
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label className="form-lbl">Student's Answer</label>
                <div style={{ padding: "12px 14px", background: "#f8faff", borderRadius: 10, border: "1px solid #f1f5f9", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6, color: "#1e293b" }}>
                  {essay.student_answer || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No answer provided.</span>}
                </div>
                {essay.student_answer && (
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    {essay.student_answer.trim().split(/\s+/).length} words{essay.max_words ? ` / ${essay.max_words} max` : ""}
                  </span>
                )}
              </div>
              <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12 }}>
                <div>
                  <label className="form-lbl">Points <span style={{ color: "#ef4444" }}>*</span> <span style={{ color: "#94a3b8", textTransform: "none" }}>/ {essay.points}</span></label>
                  <input type="number" className="form-ctrl" min="0" max={essay.points} step="1"
                    placeholder={`0 – ${essay.points}`}
                    value={grades[essay.question_id]?.points_earned ?? ""}
                    onKeyDown={e => ['.', ',', 'e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                    onChange={e => handleGradeChange(essay.question_id, "points_earned", e.target.value)}
                    disabled={submitting} />
                </div>
                <div>
                  <label className="form-lbl">Feedback <span style={{ color: "#94a3b8", textTransform: "none", fontWeight: 400 }}>(optional)</span></label>
                  <textarea className="form-ctrl" rows="2" placeholder="Write feedback…"
                    value={grades[essay.question_id]?.feedback || ""}
                    onChange={e => handleGradeChange(essay.question_id, "feedback", e.target.value)}
                    disabled={submitting} style={{ resize: "vertical" }} />
                </div>
              </div>
              {isEssayGraded(essay) && (
                <div style={{ marginTop: 8 }}>
                  <span className="badge-pill" style={{ background: "#f0fdf4", color: "#15803d" }}>
                    <i className="bi bi-check-circle me-1"></i>Previously graded: {essay.points_earned} / {essay.points} pts
                  </span>
                </div>
              )}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button className="dash-btn-success" onClick={handleSubmitGrades} disabled={submitting} style={{ padding: "10px 24px" }}>
              {submitting ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</> : <><i className="bi bi-check2-circle"></i>Save Grades</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   STUDENT DETAIL MODAL
════════════════════════════════════════════════════════════════════════════ */
const StudentDetailModal = ({ loading, data, onClose, onMarkReviewed }) => (
  <div className="dash-modal-overlay">
    <div className="dash-modal xl" style={{ maxWidth: 1000 }}>
      <div className="dash-modal-hdr">
        <div>
          <h5 style={{ margin: 0, fontWeight: 700, fontSize: 17, color: "#0f172a" }}>
            {loading ? "Loading…" : `${data?.student?.name} — Anomaly Timeline`}
          </h5>
          {!loading && data && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>{data?.student?.email}</p>}
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8", padding: 4 }}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
      <div className="dash-modal-body">
        {loading && <div style={{ textAlign: "center", padding: "40px" }}><div className="spinner-border" style={{ color: "#0056b3" }} /></div>}
        {!loading && data && (
          <>
            <div className="stats-grid" style={{ marginBottom: 16 }}>
              {[
                { label:"CPI Score",   value:`${(data.summary?.cpi_score??0).toFixed(1)}%`, color: riskColor(data.summary?.cpi_score??0), bg: riskBgColor(data.summary?.cpi_score??0) },
                { label:"Tab Switches",value:data.summary?.tab_switch_count??0,             color:"#0056b3", bg:"#e8f0fe" },
                { label:"Shortcuts",   value:data.summary?.keyboard_shortcut_count??0,      color:"#6d28d9", bg:"#ede9fe" },
                { label:"Response ⚠", value:data.summary?.response_time_anomaly_count??0,  color:"#c2410c", bg:"#fff7ed" },
                { label:"Keystroke ⚠",value:data.summary?.keystroke_anomaly_count??0,      color:"#0369a1", bg:"#f0f9ff" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} style={{ background: bg, borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color, opacity: .75, marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
              <strong>Started:</strong> {new Date(data.submission?.started_at).toLocaleString()} &nbsp;·&nbsp;
              <strong>Score:</strong> {data.submission?.score}/{data.submission?.total_points}
            </p>
            <h6 style={{ fontWeight: 700, marginBottom: 12, fontSize: 14, color: "#0f172a" }}>
              Full Event Timeline
              {data.logs?.length > 0 && <span className="badge-pill ms-2" style={{ background: "#f1f5f9", color: "#64748b" }}>{data.logs.length} event{data.logs.length!==1?"s":""}</span>}
            </h6>
            {!data.logs || data.logs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                <i className="bi bi-check-circle" style={{ fontSize: 28, display: "block", marginBottom: 8, color: "#22c55e" }}></i>
                No anomalous events recorded.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="dash-table">
                  <thead>
                    <tr>{["TIME","TYPE","SEV","Q","DETAIL","STATUS","ACTION"].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {data.logs.map(log => (
                      <tr key={`${log.type}-${log.id}`} style={{ opacity: log.reviewed ? .55 : 1 }}>
                        <td style={{ fontSize: 12 }}>{log.occurred_at ? new Date(log.occurred_at).toLocaleTimeString() : "—"}</td>
                        <td><span className="badge-pill" style={{ background: "#1e293b", color: "#fff", fontSize: 10 }}>{TYPE_LABELS[log.type]??log.type}</span></td>
                        <td><span className="badge-pill" style={{ background: SEVERITY_MAP[log.severity]?.bg || "#f1f5f9", color: SEVERITY_MAP[log.severity]?.color || "#64748b" }}>{SEVERITY_MAP[log.severity]?.label??log.severity}</span></td>
                        <td>{log.question ? <span style={{ fontSize: 12 }}>Q{log.question.order}</span> : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>}</td>
                        <td><MetadataSummary type={log.type} meta={log.metadata}/></td>
                        <td>
                          <span className="badge-pill" style={log.reviewed ? { background: "#f0fdf4", color: "#15803d" } : { background: "#f1f5f9", color: "#64748b" }}>
                            {log.reviewed ? "Done" : "Pending"}
                          </span>
                        </td>
                        <td>
                          <button className="action-btn" onClick={() => onMarkReviewed(log.id, log.type, !log.reviewed)}>
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
      <div className="dash-modal-ftr">
        <button className="dash-btn-ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════
   QUESTION FORM FIELDS
════════════════════════════════════════════════════════════════════════════ */
const QuestionFormFields = ({ formData, setFormData, submitting }) => {
  const updateOption = (i, v) => {
    const opts = [...formData.options]; opts[i] = v;
    setFormData({ ...formData, options: opts, correct_answer: formData.correct_answer === formData.options[i] ? "" : formData.correct_answer });
  };
  const TYPE_OPTS = [
    { value:"multiple_choice", label:"Multiple Choice", icon:"bi-ui-radios"  },
    { value:"true_false",      label:"True / False",    icon:"bi-toggle-on"  },
    { value:"essay",           label:"Essay",           icon:"bi-textarea"   },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
        <div>
          <label className="form-lbl">Type <span style={{ color: "#ef4444" }}>*</span></label>
          <div style={{ display: "flex", gap: 6 }}>
            {TYPE_OPTS.map(opt => (
              <button key={opt.value} type="button"
                style={{ flex: 1, padding: "8px 6px", borderRadius: 10, border: `1px solid ${formData.type===opt.value?"#0056b3":"rgba(0,86,179,.15)"}`, background: formData.type===opt.value?"#0056b3":"#f8faff", color: formData.type===opt.value?"#fff":"#64748b", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "all .15s" }}
                onClick={() => setFormData({...formData,type:opt.value,correct_answer:"",options:["","","",""]})}>
                <i className={`bi ${opt.icon}`}></i>
                <span className="d-none d-sm-inline">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ minWidth: 80 }}>
          <label className="form-lbl">Points <span style={{ color: "#ef4444" }}>*</span></label>
          <input type="number" className="form-ctrl" min="1" value={formData.points}
            onChange={e => setFormData({...formData,points:parseInt(e.target.value)})} required disabled={submitting}/>
        </div>
      </div>
      <div>
        <label className="form-lbl">Question Text <span style={{ color: "#ef4444" }}>*</span></label>
        <textarea className="form-ctrl" rows="3" placeholder="Enter your question here…"
          value={formData.question_text} onChange={e => setFormData({...formData,question_text:e.target.value})}
          required disabled={submitting} style={{ resize: "vertical" }}/>
      </div>
      {formData.type==="multiple_choice" && (
        <>
          <div>
            <label className="form-lbl">Answer Options <span style={{ color: "#ef4444" }}>*</span></label>
            {formData.options.map((opt,idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: opt&&opt===formData.correct_answer?"#0056b3":"#f1f5f9", color: opt&&opt===formData.correct_answer?"#fff":"#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  {String.fromCharCode(65+idx)}
                </span>
                <input type="text" className="form-ctrl" placeholder={`Option ${String.fromCharCode(65+idx)}`}
                  value={opt} onChange={e => updateOption(idx, e.target.value)} required disabled={submitting}/>
                {opt && opt===formData.correct_answer && <i className="bi bi-check-circle-fill" style={{ color: "#22c55e", flexShrink: 0 }}></i>}
              </div>
            ))}
          </div>
          <div>
            <label className="form-lbl">Correct Answer <span style={{ color: "#ef4444" }}>*</span></label>
            <select className="form-ctrl" value={formData.correct_answer}
              onChange={e => setFormData({...formData,correct_answer:e.target.value})} required disabled={submitting}>
              <option value="">Select correct answer…</option>
              {formData.options.map((opt,idx) => opt.trim() &&
                <option key={idx} value={opt}>{String.fromCharCode(65+idx)}. {opt}</option>)}
            </select>
          </div>
        </>
      )}
      {formData.type==="true_false" && (
        <div>
          <label className="form-lbl">Correct Answer <span style={{ color: "#ef4444" }}>*</span></label>
          <div style={{ display: "flex", gap: 10 }}>
            {["True","False"].map(val => (
              <button key={val} type="button"
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${formData.correct_answer===val?"#0056b3":"rgba(0,86,179,.15)"}`, background: formData.correct_answer===val?"#0056b3":"#f8faff", color: formData.correct_answer===val?"#fff":"#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .15s" }}
                onClick={() => setFormData({...formData,correct_answer:val})}>
                {val==="True"?"✅":"❌"} {val}
              </button>
            ))}
          </div>
        </div>
      )}
      {formData.type==="essay" && (
        <>
          <div>
            <label className="form-lbl">Max Words</label>
            <input type="number" className="form-ctrl" min="1" placeholder="e.g., 500"
              value={formData.max_words||""}
              onChange={e => setFormData({...formData,max_words:parseInt(e.target.value)||null})} disabled={submitting}/>
          </div>
          <div>
            <label className="form-lbl">Grading Rubric</label>
            <textarea className="form-ctrl" rows="3" placeholder="Describe how this question should be graded…"
              value={formData.rubric} onChange={e => setFormData({...formData,rubric:e.target.value})}
              disabled={submitting} style={{ resize: "vertical" }}/>
          </div>
        </>
      )}
    </div>
  );
};

const BLANK_QUESTION = { type:"multiple_choice", question_text:"", points:1, options:["","","",""], correct_answer:"", max_words:null, rubric:"" };

/* ─── Add Question Modal ── */
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
    <div className="dash-modal-overlay">
      <div className="dash-modal lg">
        <div className="dash-modal-hdr">
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, fontSize: 17, color: "#0f172a" }}>
              <i className="bi bi-patch-plus me-2" style={{ color: "#0056b3" }}></i>Add Question
            </h5>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>Add a new question to this exam</p>
          </div>
          <button onClick={onHide} disabled={submitting} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8", padding: 4 }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form id="add-q-form" onSubmit={handleSubmit}>
          <div className="dash-modal-body">
            <QuestionFormFields formData={formData} setFormData={setFormData} submitting={submitting}/>
          </div>
        </form>
        <div className="dash-modal-ftr">
          <button type="button" className="dash-btn-ghost" onClick={onHide} disabled={submitting}>Cancel</button>
          <button type="submit" form="add-q-form" className="dash-btn-primary" disabled={submitting}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-2"/>Adding…</> : <><i className="bi bi-plus-circle"></i>Add</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Edit Question Modal ── */
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
    <div className="dash-modal-overlay">
      <div className="dash-modal lg">
        <div className="dash-modal-hdr">
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, fontSize: 17, color: "#0f172a" }}>
              <i className="bi bi-pencil-square me-2" style={{ color: "#f59e0b" }}></i>Edit Question
            </h5>
          </div>
          <button onClick={onHide} disabled={submitting} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8", padding: 4 }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form id="edit-q-form" onSubmit={handleSubmit}>
          <div className="dash-modal-body">
            <QuestionFormFields formData={formData} setFormData={setFormData} submitting={submitting}/>
          </div>
        </form>
        <div className="dash-modal-ftr">
          <button type="button" className="dash-btn-ghost" onClick={onHide} disabled={submitting}>Cancel</button>
          <button type="submit" form="edit-q-form" className="dash-btn-primary" style={{ background: "#f59e0b" }} disabled={submitting}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</> : <><i className="bi bi-check2"></i>Save</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════════ */
const PER_PAGE_QUESTIONS = 15;
const PER_PAGE_ANOMALY   = 10;

const ExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [exam, setExam]           = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("questions");

  const [summaries, setSummaries]             = useState([]);
  const [anomalyLoading, setAnomalyLoading]   = useState(false);
  const [anomalyLoaded, setAnomalyLoaded]     = useState(false);
  const [detailData, setDetailData]           = useState(null);
  const [detailLoading, setDetailLoading]     = useState(false);
  const [anomalySearch, setAnomalySearch]     = useState("");
  const [anomalyFilter, setAnomalyFilter]     = useState("all");
  const [anomalyPage, setAnomalyPage]         = useState(1);

  const [essayData, setEssayData]       = useState(null);
  const [essayLoading, setEssayLoading] = useState(false);
  const [essayLoaded, setEssayLoaded]   = useState(false);
  const [essayStats, setEssayStats]     = useState(null);

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion]     = useState(null);
  const [questionPage, setQuestionPage]           = useState(1);

  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [shuffleSaving, setShuffleSaving]   = useState(false);
  const shuffleKey = `exam_shuffle_${id}`;

  const isNewExam = !!location.state?.openAddQuestion;
  const isNavActive = (to) => to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

  useEffect(() => {
    if (isNewExam && !loading) {
      setShowQuestionModal(true);
      navigate(location.pathname, { replace:true, state:{} });
    }
  }, [loading, isNewExam]);

  useEffect(() => { fetchExamDetails(); }, [id]);
  useEffect(() => { if (!loading && exam) fetchEssayStats(); }, [loading, exam]);
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
        Swal.fire({ toast:true, position:"top-end", icon:"warning", title:`Shuffle ${next?"ON":"OFF"} (saved locally)`, showConfirmButton:false, timer:5000 });
      } else {
        setShuffleEnabled(!next); localStorage.setItem(shuffleKey, JSON.stringify(!next));
        Swal.fire({ icon:"error", title:"Could not save shuffle setting", text:msg });
      }
    } finally { setShuffleSaving(false); }
  };

  const anomalyStats = {
    flagged: summaries.filter(s => s.is_flagged).length,
    warning: summaries.filter(s => !s.is_flagged && (s.cpi_score ?? 0) >= 25).length,
    clear:   summaries.filter(s => !s.is_flagged && (s.cpi_score ?? 0) < 25).length,
  };

  const filteredSummaries = useMemo(() => {
    setAnomalyPage(1);
    return summaries.filter(s => {
      if (anomalyFilter === "flagged" && !s.is_flagged) return false;
      if (anomalyFilter === "warning" && (s.is_flagged || (s.cpi_score ?? 0) < 25)) return false;
      if (anomalyFilter === "none"    && (s.is_flagged || (s.cpi_score ?? 0) >= 25)) return false;
      if (anomalySearch.trim()) {
        const q = anomalySearch.toLowerCase();
        return s.student?.name?.toLowerCase().includes(q) || s.student?.email?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [summaries, anomalyFilter, anomalySearch]);

  const paginatedSummaries = useMemo(() => {
    const start = (anomalyPage - 1) * PER_PAGE_ANOMALY;
    return filteredSummaries.slice(start, start + PER_PAGE_ANOMALY);
  }, [filteredSummaries, anomalyPage]);

  const paginatedQuestions = useMemo(() => {
    const start = (questionPage - 1) * PER_PAGE_QUESTIONS;
    return questions.slice(start, start + PER_PAGE_QUESTIONS);
  }, [questions, questionPage]);

  const totalPoints = questions.reduce((sum, q) => sum + (q.points||0), 0);
  const hasEssays   = questions.some(q => q.type==="essay");

  const STATUS_STYLE = {
    active:    { bg: "#f0fdf4", color: "#15803d", label: "Active"    },
    scheduled: { bg: "#fff7ed", color: "#c2410c", label: "Scheduled" },
    completed: { bg: "#f0f9ff", color: "#0369a1", label: "Completed" },
    draft:     { bg: "#f1f5f9", color: "#64748b", label: "Draft"     },
  };
  const ss = STATUS_STYLE[exam?.status] || STATUS_STYLE.draft;

  const TABS = [
    { key:"questions", icon:"bi-list-ol",           label:"Questions",   short:"Qs",       badge:questions.length, badgeBg:"#e8f0fe", badgeColor:"#0056b3" },
    { key:"results",   icon:"bi-people",             label:"Results",     short:"Results"   },
    ...(hasEssays ? [{ key:"essays", icon:"bi-textarea", label:"Essays",   short:"Essays",
      badge:essayStats?.pending_count>0 ? essayStats.pending_count : null, badgeBg:"#fff7ed", badgeColor:"#c2410c" }] : []),
    { key:"anomalies", icon:"bi-shield-exclamation", label:"Anomalies",   short:"Anomaly",
      badge:anomalyLoaded&&anomalyStats.flagged>0 ? anomalyStats.flagged : null, badgeBg:"#fef2f2", badgeColor:"#ef4444" },
  ];

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f0f4fb" }}>
      <style>{SHARED_CSS}</style>
      <div className="spinner-border" style={{ color: "#0056b3" }} />
    </div>
  );

  return (
    <>
      <style>{SHARED_CSS}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* ── Topbar ── */}
        <div className="topbar">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
            SECT Instructor
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div className="dropdown">
              <button className="d-flex align-items-center gap-2 dropdown-toggle"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }}
                data-bs-toggle="dropdown">
                <div className="dash-avatar"><i className="bi bi-person" style={{ fontSize: 15 }}></i></div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
                <li><Link className="dropdown-item" to="/instructor/account-settings">Account Settings</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile">Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger"
                  onClick={async () => { try { await API.post("/logout"); } catch {} navigate("/instructor/login"); }}
                  style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="d-flex">
          {/* ── Sidebar ── */}
          <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
            style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}>
            {NAV_ITEMS.map(({ to, icon, label }) => (
              <Link key={to} to={to} className={`nav-pill ${isNavActive(to) ? "active" : ""}`}>
                <i className={`bi ${icon}`}></i>{label}
              </Link>
            ))}
          </nav>

          {/* ── Main ── */}
          <main style={{ flex: 1, padding: "20px 16px", paddingBottom: 100, minWidth: 0 }}>

            {/* Breadcrumb */}
            <nav style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", flexWrap: "wrap" }}>
                <Link to="/instructor/exams" style={{ color: "#94a3b8", textDecoration: "none" }}>Exams</Link>
                <i className="bi bi-chevron-right" style={{ fontSize: 10 }}></i>
                <span style={{ color: "#0f172a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{exam.title}</span>
              </div>
            </nav>

            {/* Page header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exam.title}</h1>
                <Link to={`/instructor/courses/${exam.course?.id}`} style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>
                  <i className="bi bi-folder2 me-1"></i>{exam.course?.code} — {exam.course?.name}
                </Link>
              </div>
              <div className="page-header-actions" style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
                <Link to={`/instructor/exams/${id}/edit`} className="dash-btn-ghost" style={{ fontSize: 12, padding: "7px 12px" }}>
                  <i className="bi bi-pencil"></i> Edit
                </Link>
                {activeTab==="questions" && (
                  <button className="dash-btn-primary" style={{ fontSize: 12, padding: "7px 12px" }} onClick={() => setShowQuestionModal(true)}>
                    <i className="bi bi-plus-circle"></i> Add Q
                  </button>
                )}
                {(activeTab==="anomalies" || activeTab==="essays") && (
                  <button className="dash-btn-ghost" style={{ fontSize: 12, padding: "7px 12px" }}
                    onClick={() => { if(activeTab==="anomalies"){ setAnomalyLoaded(false); fetchAnomalySummaries(); } else { setEssayLoaded(false); fetchEssayData(); } }}>
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Exam Info Strip */}
            <div className="dash-card fade-up" style={{ marginBottom: 16 }}>
              <div className="info-strip">
                {[
                  { icon:"bi-tag",           label:"Type",     value:<span className="badge-pill" style={{ background:"#f1f5f9", color:"#64748b" }}>{exam.type}</span> },
                  { icon:"bi-clock",         label:"Duration", value:`${exam.duration_minutes} min` },
                  { icon:"bi-trophy",        label:"Points",   value:`${totalPoints} pts` },
                  { icon:"bi-list-ol",       label:"Qs",       value:questions.length },
                  { icon:"bi-calendar-event",label:"Start",    value:new Date(exam.start_time).toLocaleString("en-PH", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }) },
                  { icon:"bi-circle-fill",   label:"Status",   value:<span className="badge-pill" style={{ background:ss.bg, color:ss.color }}>{ss.label}</span> },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="info-item">
                    <div className="info-item-label"><i className={`bi ${icon} me-1`}></i>{label}</div>
                    <div className="info-item-value">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* New exam alert */}
            {isNewExam && questions.length===0 && (
              <div style={{ padding: "14px 18px", background: "#e8f0fe", borderRadius: 12, border: "1px solid rgba(0,86,179,.15)", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <i className="bi bi-lightbulb-fill" style={{ color: "#0056b3", fontSize: 18, flexShrink: 0 }}></i>
                <div>
                  <strong style={{ color: "#0056b3" }}>Exam created! Add your questions next.</strong>
                  <p style={{ margin: "4px 0 8px", fontSize: 12, color: "#64748b" }}>No questions yet.</p>
                  <button className="dash-btn-primary" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => setShowQuestionModal(true)}>
                    <i className="bi bi-plus-circle"></i> Add First Question
                  </button>
                </div>
              </div>
            )}

            {/* ── Tabs ── */}
            <div className="dash-tabs">
              {TABS.map(({ key, icon, label, short, badge, badgeBg, badgeColor }) => (
                <button key={key} className={`dash-tab ${activeTab===key?"active":""}`} onClick={() => setActiveTab(key)}>
                  <i className={`bi ${icon}`}></i>
                  <span className="tab-label-full">{label}</span>
                  <span className="tab-label-short">{short || label}</span>
                  {badge != null && (
                    <span className="badge-pill" style={{ background: badgeBg, color: badgeColor, fontSize: 10 }}>{badge}</span>
                  )}
                </button>
              ))}
            </div>

            {/* ══ QUESTIONS TAB ══ */}
            {activeTab==="questions" && (
              <div className="dash-card fade-up">
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    <i className="bi bi-list-ol me-2" style={{ color: "#0056b3" }}></i>
                    {questions.length} Q{questions.length!==1?"s":""} · {totalPoints} pts
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className={`shuffle-toggle ${shuffleEnabled?"on":""}`} onClick={!shuffleSaving ? handleShuffleToggle : undefined}
                      style={{ cursor: shuffleSaving?"wait":"pointer" }}>
                      {shuffleSaving
                        ? <span className="spinner-border spinner-border-sm" style={{ color: "#64748b" }}/>
                        : <i className={`bi ${shuffleEnabled?"bi-shuffle":"bi-list-ol"}`} style={{ color: shuffleEnabled?"#15803d":"#64748b", fontSize: 13 }}></i>}
                      <span style={{ fontSize: 11, fontWeight: 700, color: shuffleEnabled?"#15803d":"#64748b" }}>
                        {shuffleEnabled?"Shuffle ON":"Shuffle"}
                      </span>
                      <div style={{ width: 26, height: 14, borderRadius: 99, background: shuffleEnabled?"#22c55e":"#e2e8f0", position: "relative", flexShrink: 0 }}>
                        <div style={{ position: "absolute", top: 2, left: shuffleEnabled?12:2, width: 10, height: 10, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                      </div>
                    </div>
                    <button className="dash-btn-primary" style={{ fontSize: 11, padding: "6px 12px" }} onClick={() => setShowQuestionModal(true)}>
                      <i className="bi bi-plus"></i> Add
                    </button>
                  </div>
                </div>
                {shuffleEnabled && questions.length>1 && (
                  <div style={{ padding: "8px 16px", background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", fontSize: 12, color: "#15803d" }}>
                    <i className="bi bi-shuffle me-2"></i><strong>Shuffle is ON</strong> — questions randomised per student.
                  </div>
                )}
                <div>
                  {questions.length===0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                      <i className="bi bi-patch-question" style={{ fontSize: 36, display: "block", marginBottom: 10 }}></i>
                      <p style={{ marginBottom: 14, fontSize: 14 }}>No questions yet.</p>
                      <button className="dash-btn-primary" onClick={() => setShowQuestionModal(true)}>
                        <i className="bi bi-plus-circle"></i> Add First Question
                      </button>
                    </div>
                  ) : paginatedQuestions.map((question, idx) => {
                    const realIndex = (questionPage - 1) * PER_PAGE_QUESTIONS + idx;
                    return (
                      <div key={question.id} className="q-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                              <span className="badge-pill" style={{ background: "#f1f5f9", color: "#64748b" }}>Q{realIndex+1}</span>
                              <span className="badge-pill" style={{ background: "#e8f0fe", color: "#0056b3" }}>
                                <i className={`bi ${QTYPE_ICON[question.type]||"bi-question"} me-1`}></i>
                                {question.type.replace("_"," ")}
                              </span>
                              <span className="badge-pill" style={{ background: "#f0fdf4", color: "#15803d" }}>
                                <i className="bi bi-trophy me-1"></i>{question.points} pts
                              </span>
                            </div>
                            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{question.question_text}</p>
                            {question.type==="multiple_choice" && question.options && (
                              <div style={{ paddingLeft: 6 }}>
                                {question.options.map((opt, oidx) => (
                                  <div key={oidx} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, color: opt===question.correct_answer?"#15803d":"#64748b", fontWeight: opt===question.correct_answer?700:400 }}>
                                    <span className="badge-pill" style={{ minWidth: 22, justifyContent: "center", background: opt===question.correct_answer?"#f0fdf4":"#f1f5f9", color: opt===question.correct_answer?"#15803d":"#64748b", fontSize: 10 }}>
                                      {String.fromCharCode(65+oidx)}
                                    </span>
                                    <span style={{ fontSize: 12 }}>{opt}</span>
                                    {opt===question.correct_answer && <i className="bi bi-check-circle-fill" style={{ color: "#22c55e", fontSize: 12 }}></i>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {question.type==="true_false" && (
                              <div style={{ paddingLeft: 6, fontSize: 12 }}>
                                <span style={{ color: "#64748b" }}>Correct: </span>
                                <span className="badge-pill" style={{ background: "#f0fdf4", color: "#15803d" }}>{question.correct_answer}</span>
                              </div>
                            )}
                            {question.type==="essay" && (
                              <div style={{ paddingLeft: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
                                {question.max_words && <span style={{ fontSize: 11, color: "#64748b" }}><i className="bi bi-type me-1"></i>Max {question.max_words} words</span>}
                                {question.rubric && <span style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}><i className="bi bi-journal-text me-1"></i>{question.rubric.slice(0,60)}{question.rubric.length>60?"…":""}</span>}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                            <button className="action-btn" onClick={() => setEditingQuestion(question)}><i className="bi bi-pencil"></i></button>
                            <button className="action-btn del" onClick={() => handleDeleteQuestion(question.id)}><i className="bi bi-trash"></i></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Pagination total={questions.length} page={questionPage} perPage={PER_PAGE_QUESTIONS} onChange={setQuestionPage} />
              </div>
            )}

            {/* ══ STUDENT RESULTS TAB ══ */}
            {activeTab==="results" && <StudentResultsTab examId={id} anomalySummaries={summaries}/>}

            {/* ══ ESSAY GRADING TAB ══ */}
            {activeTab==="essays" && (
              essayLoading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div className="spinner-border" style={{ color: "#f59e0b" }} />
                  <p style={{ marginTop: 12, fontSize: 13, color: "#94a3b8" }}>Loading essay responses…</p>
                </div>
              ) : (
                <>
                  <div className="stats-grid">
                    {[
                      { label:"Ungraded",    value:essayData?.pending_count??0,                                                                                      color:"#c2410c", bg:"#fff7ed", icon:"bi-hourglass-split" },
                      { label:"Submissions", value:essayData?.submissions?.length??0,                                                                               color:"#0056b3", bg:"#e8f0fe", icon:"bi-people"          },
                      { label:"Graded",      value:(essayData?.submissions??[]).filter(s => s.essays.every(e => isEssayGraded(e))).length, color:"#15803d", bg:"#f0fdf4", icon:"bi-check2-all" },
                    ].map(({ label, value, color, bg, icon }) => (
                      <div key={label} style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,86,179,.06)", boxShadow: "0 1px 3px rgba(0,0,0,.04)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <i className={`bi ${icon}`} style={{ color, fontSize: 17 }}></i>
                        </div>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {essayData?.pending_count > 0 && (
                    <div style={{ padding: "10px 14px", background: "#fff7ed", borderRadius: 12, border: "1px solid #fed7aa", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#92400e" }}>
                      <i className="bi bi-exclamation-triangle-fill" style={{ flexShrink: 0 }}></i>
                      <div>
                        <strong>{essayData.pending_count} essay{essayData.pending_count!==1?"s":""} need grading.</strong>
                        <span style={{ marginLeft: 6, color: "#b45309", fontSize: 12 }}>Ungraded essays excluded from final score.</span>
                      </div>
                    </div>
                  )}
                  {!essayData || essayData.submissions.length===0 ? (
                    <div className="dash-card" style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                      <i className="bi bi-textarea" style={{ fontSize: 36, display: "block", marginBottom: 10 }}></i>
                      No essay responses yet.
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
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div className="spinner-border" style={{ color: "#0056b3" }} />
                  <p style={{ marginTop: 12, fontSize: 13, color: "#94a3b8" }}>Loading anomaly data…</p>
                </div>
              ) : (
                <>
                  <div className="stats-grid">
                    {[
                      { label:"Flagged", value:anomalyStats.flagged, color:"#ef4444", bg:"#fef2f2", icon:"bi-shield-x",            key:"flagged" },
                      { label:"Warning", value:anomalyStats.warning, color:"#d97706", bg:"#fff7ed", icon:"bi-exclamation-triangle", key:"warning" },
                      { label:"Clear",   value:anomalyStats.clear,   color:"#15803d", bg:"#f0fdf4", icon:"bi-shield-check",         key:"none"    },
                      { label:"Total",   value:summaries.length,     color:"#0056b3", bg:"#e8f0fe", icon:"bi-people",               key:"all"     },
                    ].map(({ label, value, color, bg, icon, key }) => {
                      const sel = anomalyFilter === key;
                      return (
                        <div key={label} className={`stat-card ${sel?"selected":""}`}
                          style={{ color, outline: sel?`2px solid ${color}`:"none" }}
                          onClick={() => setAnomalyFilter(anomalyFilter===key?"all":key)}>
                          <div className="stat-icon" style={{ background: bg }}>
                            <i className={`bi ${icon}`} style={{ color, fontSize: 16 }}></i>
                          </div>
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color, opacity: .75, marginTop: 2 }}>{label}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="dash-card fade-up">
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a", marginRight: "auto" }}>Student Risk Overview</h2>
                      <div style={{ position: "relative" }}>
                        <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 12 }}></i>
                        <input className="form-ctrl" style={{ paddingLeft: 30, maxWidth: 180, fontSize: 12 }} placeholder="Search…"
                          value={anomalySearch} onChange={e => setAnomalySearch(e.target.value)}/>
                      </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="desktop-table" style={{ overflowX: "auto" }}>
                      {summaries.length===0 ? (
                        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                          <i className="bi bi-shield-check" style={{ fontSize: 36, display: "block", marginBottom: 10, color: "#22c55e" }}></i>No anomaly data yet.
                        </div>
                      ) : (
                        <table className="dash-table">
                          <thead>
                            <tr>
                              <th>STUDENT</th><th>CPI</th><th>FLAG</th>
                              <th style={{ textAlign: "center" }}>Tabs</th>
                              <th style={{ textAlign: "center" }}>Keys</th>
                              <th style={{ textAlign: "center" }}>RT</th>
                              <th style={{ textAlign: "center" }}>KS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedSummaries.length===0 ? (
                              <tr><td colSpan="7" style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>No students match.</td></tr>
                            ) : paginatedSummaries.map(s => {
                              const cpiClr = riskColor(s.cpi_score??0);
                              const cpiBg  = riskBgColor(s.cpi_score??0);
                              const flagStyle = s.is_flagged
                                ? { bg:"#fef2f2", color:"#ef4444", label:"Flagged"  }
                                : (s.cpi_score??0)>=25
                                  ? { bg:"#fff7ed", color:"#d97706", label:"Possible" }
                                  : { bg:"#f0fdf4", color:"#15803d", label:"Unlikely" };
                              return (
                                <tr key={s.submission_id}>
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0056b3", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                                        {s.student?.name?.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 600, fontSize: 12, color: "#1e293b" }}>{s.student?.name}</div>
                                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.student?.email}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <div style={{ height: 5, borderRadius: 99, background: "#f1f5f9", flex: 1, minWidth: 40, overflow: "hidden" }}>
                                        <div style={{ height: "100%", borderRadius: 99, width: `${Math.min(s.cpi_score??0,100)}%`, background: cpiClr }} />
                                      </div>
                                      <span style={{ fontWeight: 700, color: cpiClr, fontSize: 12, whiteSpace: "nowrap" }}>{(s.cpi_score??0).toFixed(1)}%</span>
                                    </div>
                                  </td>
                                  <td><span className="badge-pill" style={{ background: flagStyle.bg, color: flagStyle.color }}>{flagStyle.label}</span></td>
                                  <td style={{ textAlign: "center", fontWeight: 600, fontSize: 13 }}>{s.tab_switch_count}</td>
                                  <td style={{ textAlign: "center", fontWeight: 600, fontSize: 13 }}>{s.keyboard_shortcut_count}</td>
                                  <td style={{ textAlign: "center", fontWeight: 600, fontSize: 13 }}>{s.response_time_anomaly_count}</td>
                                  <td style={{ textAlign: "center", fontWeight: 600, fontSize: 13 }}>{s.keystroke_anomaly_count}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Mobile Card List */}
                    <div className="mobile-card-list" style={{ padding: "10px 12px" }}>
                      {paginatedSummaries.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                          <i className="bi bi-shield-check" style={{ fontSize: 28, display: "block", marginBottom: 8, color: "#22c55e" }}></i>No students match.
                        </div>
                      ) : paginatedSummaries.map(s => {
                        const cpiClr = riskColor(s.cpi_score??0);
                        const flagStyle = s.is_flagged
                          ? { bg:"#fef2f2", color:"#ef4444", label:"Flagged"  }
                          : (s.cpi_score??0)>=25
                            ? { bg:"#fff7ed", color:"#d97706", label:"Possible" }
                            : { bg:"#f0fdf4", color:"#15803d", label:"Unlikely" };
                        return (
                          <div key={s.submission_id} className="mobile-item-card">
                            <div className="mobile-item-card-body">
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0056b3", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                  {s.student?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.student?.name}</div>
                                  <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.student?.email}</div>
                                </div>
                                <span className="badge-pill" style={{ background: flagStyle.bg, color: flagStyle.color, flexShrink: 0 }}>{flagStyle.label}</span>
                              </div>
                              {/* CPI bar */}
                              <div style={{ marginBottom: 10 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>CPI SCORE</span>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: cpiClr }}>{(s.cpi_score??0).toFixed(1)}%</span>
                                </div>
                                <div style={{ height: 6, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
                                  <div style={{ height: "100%", borderRadius: 99, width: `${Math.min(s.cpi_score??0,100)}%`, background: cpiClr }} />
                                </div>
                              </div>
                              {/* Event counts */}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                                {[
                                  { label: "Tabs",     value: s.tab_switch_count,             color: "#0056b3", bg: "#e8f0fe" },
                                  { label: "Keys",     value: s.keyboard_shortcut_count,       color: "#6d28d9", bg: "#ede9fe" },
                                  { label: "RT",       value: s.response_time_anomaly_count,   color: "#c2410c", bg: "#fff7ed" },
                                  { label: "KS",       value: s.keystroke_anomaly_count,       color: "#0369a1", bg: "#f0f9ff" },
                                ].map(({ label, value, color, bg }) => (
                                  <div key={label} style={{ background: bg, borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color, opacity: .75, marginTop: 2 }}>{label}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Pagination total={filteredSummaries.length} page={anomalyPage} perPage={PER_PAGE_ANOMALY} onChange={setAnomalyPage} />
                  </div>
                </>
              )
            )}
          </main>
        </div>

        <InstructorBottomNav active="Exams" />
      </div>

      {/* Modals */}
      <AddQuestionModal show={showQuestionModal} onHide={() => setShowQuestionModal(false)} examId={id}
        onSuccess={q => { setQuestions([...questions, q]); setShowQuestionModal(false); fetchExamDetails(); }}/>
      <EditQuestionModal question={editingQuestion} onHide={() => setEditingQuestion(null)} onSave={handleSaveEdit}/>
      {(detailLoading || detailData) && (
        <StudentDetailModal loading={detailLoading} data={detailData}
          onClose={() => setDetailData(null)} onMarkReviewed={markReviewed}/>
      )}
    </>
  );
};

export default ExamDetail;