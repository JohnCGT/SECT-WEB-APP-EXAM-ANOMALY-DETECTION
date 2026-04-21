// src/components/InstructorAlertBell.jsx
//
// Self-contained alert bell for instructor navbars.
// Queries /exams to get all exams, then fetches anomaly summaries for each
// in parallel to collect flagged students.
//
// ─── THRESHOLD CONFIGURATION ────────────────────────────────────────────────
//
//   FLAGGED_THRESHOLD  (default: 50)
//     Students with cpi_score >= this value AND is_flagged === true
//     are shown as "Flagged" (red — requires immediate review).
//
//   POSSIBLE_THRESHOLD (default: 25)
//     Students with cpi_score >= this value (but below FLAGGED_THRESHOLD)
//     are shown as "Possible" (orange — worth monitoring).
//
//   To change what the bell shows, edit these two constants:
//
//     const FLAGGED_THRESHOLD  = 50;   // ← change to e.g. 40 to catch more
//     const POSSIBLE_THRESHOLD = 25;   // ← set equal to FLAGGED_THRESHOLD
//                                      //   to hide "Possible" entirely
//
//   To show ONLY flagged (not "Possible"), set:
//     const POSSIBLE_THRESHOLD = FLAGGED_THRESHOLD;
//
// ─── POLL INTERVAL ──────────────────────────────────────────────────────────
//
//   POLL_MS (default: 60000 = 60 seconds)
//     How often the bell re-checks for new flagged students while the page
//     is open. Set to 0 to disable polling (load once on mount only).
//
//     const POLL_MS = 60_000;   // ← change to 30_000 for 30s, 0 to disable
//
// ─── USAGE ──────────────────────────────────────────────────────────────────
//
//   import InstructorAlertBell from "../../components/InstructorAlertBell";
//
//   // Drop inside any instructor navbar, next to the user dropdown:
//   <div className="d-flex align-items-center gap-2">
//     <InstructorAlertBell />
//     <div className="dropdown"> ... </div>
//   </div>
//
// ────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../api";

// ─── ↓ EDIT THESE TO CHANGE WHAT TRIGGERS AN ALERT ─────────────────────────
const FLAGGED_THRESHOLD  = 50;   // CPI >= this AND is_flagged=true  → red "Flagged"
const POSSIBLE_THRESHOLD = 25;   // CPI >= this (below flagged)      → orange "Possible"
// ─── ↑ ──────────────────────────────────────────────────────────────────────

// ─── ↓ EDIT THIS TO CHANGE HOW OFTEN THE BELL REFRESHES (milliseconds) ─────
const POLL_MS = 60_000;  // 60 seconds. Set to 0 to load once only.
// ─── ↑ ──────────────────────────────────────────────────────────────────────

// Inject CSS once
(function injectStyles() {
  if (document.getElementById("iab-styles")) return;
  const s = document.createElement("style");
  s.id = "iab-styles";
  s.textContent = `
    @keyframes iab-drop { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes iab-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
    .iab-bell-btn { transition:all .15s; border:none; cursor:pointer; background:none; padding:0; }
    .iab-bell-btn:hover .iab-bell-icon { filter:brightness(.9); }
    .iab-row { display:flex; text-decoration:none; transition:background .1s; cursor:pointer; }
    .iab-row:hover { background:#fff8f0 !important; }
  `;
  document.head.appendChild(s);
})();

// ─── getCpiClass ──────────────────────────────────────────────────────────────
function getCpiClass(cpi, isFlagged) {
  if (isFlagged && cpi >= FLAGGED_THRESHOLD)  return "flagged";
  if (cpi >= POSSIBLE_THRESHOLD)              return "possible";
  return "clear";
}

// ─── Alert entry shape ────────────────────────────────────────────────────────
// {
//   key:         string          unique per student+exam
//   studentName: string
//   studentEmail:string
//   examId:      number
//   examTitle:   string
//   cpi:         number
//   isFlagged:   boolean
//   cpiClass:    "flagged" | "possible"
// }

export default function InstructorAlertBell() {
  const [alerts, setAlerts]   = useState([]);   // all current alert entries
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);

  // Track which alerts the instructor has dismissed this session.
  // Stored in sessionStorage so it resets on new login but survives navigation.
  const [dismissedKeys, setDismissedKeys] = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem("iab_dismissed") || "[]")); }
    catch { return new Set(); }
  });

  const ref = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: get all the instructor's exams
      const examsRes = await API.get("/exams");
      const exams    = examsRes.data.exams || [];

      if (exams.length === 0) { setAlerts([]); return; }

      // Step 2: fetch anomaly summaries for each exam in parallel
      // Only bother with active / completed exams — drafts can't have submissions
      const relevant = exams.filter(e =>
        e.status === "active" || e.status === "completed"
      );

      const results = await Promise.allSettled(
        relevant.map(exam =>
          API.get(`/exams/${exam.id}/anomalies/summary`)
            .then(r => ({ exam, summaries: r.data.summaries || [] }))
        )
      );

      // Step 3: flatten into alert entries, keeping only flagged/possible students
      const newAlerts = [];
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const { exam, summaries } = r.value;
        for (const s of summaries) {
          const cpi       = s.cpi_score ?? 0;
          const isFlagged = !!s.is_flagged;
          const cls       = getCpiClass(cpi, isFlagged);
          if (cls === "clear") continue;  // below POSSIBLE_THRESHOLD, skip

          newAlerts.push({
            key:          `${exam.id}-${s.submission_id}`,
            studentName:  s.student?.name  || "Unknown",
            studentEmail: s.student?.email || "",
            examId:       exam.id,
            examTitle:    exam.title,
            cpi:          cpi,
            isFlagged:    isFlagged,
            cpiClass:     cls,
          });
        }
      }

      // Sort: flagged first, then by CPI descending
      newAlerts.sort((a, b) => {
        if (a.cpiClass !== b.cpiClass) return a.cpiClass === "flagged" ? -1 : 1;
        return b.cpi - a.cpi;
      });

      setAlerts(newAlerts);
    } catch {
      // Silent — bell shouldn't break the nav
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    fetchAlerts();
    if (POLL_MS > 0) {
      const t = setInterval(fetchAlerts, POLL_MS);
      return () => clearInterval(t);
    }
  }, [fetchAlerts]);

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Dismiss one alert ──────────────────────────────────────────────────────
  const dismiss = (key, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      try { sessionStorage.setItem("iab_dismissed", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  // ── Dismiss all ───────────────────────────────────────────────────────────
  const dismissAll = (e) => {
    e.stopPropagation();
    const allKeys = new Set(alerts.map(a => a.key));
    setDismissedKeys(allKeys);
    try { sessionStorage.setItem("iab_dismissed", JSON.stringify([...allKeys])); } catch {}
    setOpen(false);
  };

  // ── Derived: visible (not dismissed) alerts ────────────────────────────────
  const visible = alerts.filter(a => !dismissedKeys.has(a.key));

  const flaggedCount  = visible.filter(a => a.cpiClass === "flagged").length;
  const possibleCount = visible.filter(a => a.cpiClass === "possible").length;
  const totalCount    = visible.length;

  // Bell badge colour: red if any flagged, orange if only possible, nothing if clear
  const badgeColor = flaggedCount > 0 ? "#dc3545" : "#fd7e14";
  const hasBadge   = totalCount > 0;

  return (
    <div ref={ref} style={{ position: "relative" }}>

      {/* ── Bell button ── */}
      <button
        className="iab-bell-btn"
        onClick={() => setOpen(v => !v)}
        aria-label={`${totalCount} integrity alert${totalCount !== 1 ? "s" : ""}`}
        style={{ position: "relative" }}
      >
        <div
          className="iab-bell-icon d-flex align-items-center justify-content-center"
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: open ? (flaggedCount > 0 ? "#fff0f0" : "#fff8f0") : "#f8f9fa",
            border: `1.5px solid ${open ? (flaggedCount > 0 ? "#dc3545" : "#fd7e14") : "#dee2e6"}`,
            fontSize: 17,
            transition: "all .15s",
          }}
        >
          🛡️
        </div>

        {/* Badge */}
        {hasBadge && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: badgeColor, color: "#fff",
            minWidth: 18, height: 18, borderRadius: 9,
            fontSize: 10, fontWeight: 800, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff", padding: "0 4px",
            animation: flaggedCount > 0 ? "iab-pulse 2s ease infinite" : "none",
          }}>
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: "absolute", top: 46, right: 0, zIndex: 1200,
          width: 360, background: "#fff",
          border: "1px solid #e9ecef",
          borderRadius: 14,
          boxShadow: "0 16px 50px rgba(0,0,0,.15)",
          animation: "iab-drop .18s ease",
          overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            padding: "13px 16px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: flaggedCount > 0 ? "#fff5f5" : visible.length > 0 ? "#fff8f0" : "#f8f9fa",
          }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>
                Integrity Alerts
              </span>
              {flaggedCount > 0 && (
                <span style={{
                  marginLeft: 8, background: "#dc3545", color: "#fff",
                  padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                }}>
                  {flaggedCount} flagged
                </span>
              )}
              {possibleCount > 0 && (
                <span style={{
                  marginLeft: 6, background: "#fd7e14", color: "#fff",
                  padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                }}>
                  {possibleCount} possible
                </span>
              )}
            </div>
            <div className="d-flex gap-2 align-items-center">
              {/* Refresh */}
              <button onClick={(e) => { e.stopPropagation(); fetchAlerts(); }}
                style={{ border:"none", background:"none", cursor:"pointer", color:"#888", fontSize:13 }}
                title="Refresh alerts">
                {loading ? <span className="spinner-border spinner-border-sm" style={{width:"0.75rem",height:"0.75rem"}}/> : "↻"}
              </button>
              {/* Dismiss all */}
              {visible.length > 0 && (
                <button onClick={dismissAll}
                  style={{ border:"none", background:"none", fontSize:11, color:"#888", fontWeight:600, cursor:"pointer" }}>
                  Dismiss all
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {visible.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#aaa" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 13 }}>No integrity alerts right now</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  {loading ? "Checking…" : `Checks every ${Math.round(POLL_MS / 1000)}s`}
                </div>
              </div>
            ) : visible.map(alert => {
              const isFl   = alert.cpiClass === "flagged";
              const accentC = isFl ? "#dc3545" : "#fd7e14";
              const bgC     = isFl ? "#fff5f5"  : "#fff8f0";
              const tagText = isFl ? "FLAGGED"   : "POSSIBLE";

              return (
                <Link
                  key={alert.key}
                  to={`/instructor/exams/${alert.examId}`}
                  state={{ openAnomalyTab: true }}
                  className="iab-row"
                  onClick={() => setOpen(false)}
                  style={{
                    gap: 10, padding: "11px 14px",
                    borderBottom: "1px solid #f5f5f5",
                    background: bgC,
                    alignItems: "flex-start",
                  }}
                >
                  {/* Left colour bar */}
                  <div style={{
                    width: 3, borderRadius: 4, alignSelf: "stretch",
                    background: accentC, flexShrink: 0,
                  }} />

                  {/* Avatar */}
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: accentC, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 13,
                  }}>
                    {alert.studentName.charAt(0).toUpperCase()}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e" }}>
                        {alert.studentName}
                      </span>
                      {/* CPI badge */}
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: "#fff",
                        background: accentC, borderRadius: 5,
                        padding: "0px 5px",
                      }}>
                        {tagText} · {alert.cpi.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#666",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {alert.studentEmail}
                    </div>
                    <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>
                      📋 {alert.examTitle}
                    </div>
                  </div>

                  {/* Dismiss ✕ */}
                  <button
                    onClick={(e) => dismiss(alert.key, e)}
                    title="Dismiss this alert"
                    style={{
                      border: "none", background: "none",
                      color: "#bbb", fontSize: 14, cursor: "pointer",
                      padding: "0 2px", lineHeight: 1, flexShrink: 0,
                      alignSelf: "flex-start",
                    }}
                  >
                    ×
                  </button>
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: "9px 16px",
            borderTop: "1px solid #f0f0f0",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <Link
              to="/instructor/alerts"
              onClick={() => setOpen(false)}
              style={{ fontSize: 12, color: "#6c63ff", fontWeight: 600, textDecoration: "none" }}
            >
              View all anomaly alerts →
            </Link>
            <span style={{ fontSize: 10, color: "#bbb" }}>
              {/* ── THRESHOLD DISPLAY ── shown so instructor knows what's being flagged */}
              Flagged ≥ {FLAGGED_THRESHOLD}% CPI
            </span>
          </div>
        </div>
      )}
    </div>
  );
}