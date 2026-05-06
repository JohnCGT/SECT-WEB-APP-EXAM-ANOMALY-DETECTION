// src/components/InstructorAlertBell.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../api";

const FLAGGED_THRESHOLD  = 50;
const POSSIBLE_THRESHOLD = 25;
const POLL_MS = 60_000;

(function injectStyles() {
  if (document.getElementById("iab-styles")) return;
  const s = document.createElement("style");
  s.id = "iab-styles";
  s.textContent = `
    @keyframes iab-drop  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes iab-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
    @keyframes iab-ring  {
      0%   { transform: rotate(0deg);   }
      10%  { transform: rotate(14deg);  }
      20%  { transform: rotate(-12deg); }
      30%  { transform: rotate(10deg);  }
      40%  { transform: rotate(-8deg);  }
      50%  { transform: rotate(6deg);   }
      60%  { transform: rotate(-4deg);  }
      70%  { transform: rotate(2deg);   }
      80%  { transform: rotate(0deg);   }
      100% { transform: rotate(0deg);   }
    }
    .iab-bell-btn { transition:all .15s; border:none; cursor:pointer; background:none; padding:0; position:relative; }
    .iab-bell-icon { display:flex; align-items:center; justify-content:center; transition:all .15s; }
    .iab-bell-icon.ringing { animation: iab-ring 1s ease both; }
    .iab-row { display:flex; text-decoration:none; transition:background .1s; cursor:pointer; }
    .iab-row:hover { background:#fff8f0 !important; }
    .iab-dropdown {
      position:fixed;
      right:12px;
      top:60px;
      z-index:9999;
      width:min(360px, calc(100vw - 24px));
      background:#fff;
      border:1px solid #e9ecef;
      border-radius:14px;
      box-shadow:0 16px 50px rgba(0,0,0,.18);
      animation:iab-drop .18s ease;
      overflow:hidden;
    }
  `;
  document.head.appendChild(s);
})();

function getCpiClass(cpi, isFlagged) {
  if (isFlagged && cpi >= FLAGGED_THRESHOLD) return "flagged";
  if (cpi >= POSSIBLE_THRESHOLD)             return "possible";
  return "clear";
}

export default function InstructorAlertBell() {
  const [alerts,        setAlerts]        = useState([]);
  const [open,          setOpen]          = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [ringing,       setRinging]       = useState(false);
  const [dismissedKeys, setDismissedKeys] = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem("iab_dismissed") || "[]")); }
    catch { return new Set(); }
  });
  const ref         = useRef(null);
  const prevCount   = useRef(0);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const examsRes = await API.get("/exams");
      const exams    = examsRes.data.exams || [];
      if (exams.length === 0) { setAlerts([]); return; }

      const relevant = exams.filter(e => e.status === "active" || e.status === "completed");
      const results  = await Promise.allSettled(
        relevant.map(exam =>
          API.get(`/exams/${exam.id}/anomalies/summary`)
            .then(r => ({ exam, summaries: r.data.summaries || [] }))
        )
      );

      const newAlerts = [];
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const { exam, summaries } = r.value;
        for (const s of summaries) {
          const cpi       = s.cpi_score ?? 0;
          const isFlagged = !!s.is_flagged;
          const cls       = getCpiClass(cpi, isFlagged);
          if (cls === "clear") continue;
          newAlerts.push({
            key:          `${exam.id}-${s.submission_id}`,
            studentName:  s.student?.name  || "Unknown",
            studentEmail: s.student?.email || "",
            examId:       exam.id,
            examTitle:    exam.title,
            // Use updated_at or submitted_at for recency sort; fall back to 0
            submittedAt:  s.submitted_at || s.updated_at || null,
            cpi,
            isFlagged,
            cpiClass: cls,
          });
        }
      }

      /*
       * Sort priority:
       * 1. Class: flagged before possible
       * 2. Recency: most recently submitted/updated first
       * 3. CPI score descending as tiebreaker
       */
      newAlerts.sort((a, b) => {
        // Class order
        if (a.cpiClass !== b.cpiClass) return a.cpiClass === "flagged" ? -1 : 1;
        // Recency (latest first)
        const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        // CPI tiebreaker
        return b.cpi - a.cpi;
      });

      // Ring the bell if new alerts appeared
      const newCount = newAlerts.length;
      if (newCount > prevCount.current && prevCount.current !== null) {
        setRinging(true);
        setTimeout(() => setRinging(false), 1100);
      }
      prevCount.current = newCount;

      setAlerts(newAlerts);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAlerts();
    if (POLL_MS > 0) {
      const t = setInterval(fetchAlerts, POLL_MS);
      return () => clearInterval(t);
    }
  }, [fetchAlerts]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const dismiss = (key, e) => {
    e.preventDefault(); e.stopPropagation();
    setDismissedKeys(prev => {
      const next = new Set(prev); next.add(key);
      try { sessionStorage.setItem("iab_dismissed", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const dismissAll = (e) => {
    e.stopPropagation();
    const allKeys = new Set(alerts.map(a => a.key));
    setDismissedKeys(allKeys);
    try { sessionStorage.setItem("iab_dismissed", JSON.stringify([...allKeys])); } catch {}
    setOpen(false);
  };

  const visible       = alerts.filter(a => !dismissedKeys.has(a.key));
  const flaggedCount  = visible.filter(a => a.cpiClass === "flagged").length;
  const possibleCount = visible.filter(a => a.cpiClass === "possible").length;
  const totalCount    = visible.length;
  const hasBadge      = totalCount > 0;
  const badgeColor    = flaggedCount > 0 ? "#dc3545" : "#fd7e14";

  // Bell button colours
  const bellColor       = open
    ? (flaggedCount > 0 ? "#dc3545" : hasBadge ? "#fd7e14" : "#6c757d")
    : (hasBadge ? (flaggedCount > 0 ? "#dc3545" : "#fd7e14") : "#6c757d");
  const bellBg          = open
    ? (flaggedCount > 0 ? "#fff0f0" : hasBadge ? "#fff8f0" : "#f8f9fa")
    : (hasBadge ? (flaggedCount > 0 ? "#fff0f0" : "#fff8f0") : "#f8f9fa");
  const bellBorderColor = open || hasBadge
    ? (flaggedCount > 0 ? "#dc3545" : hasBadge ? "#fd7e14" : "#dee2e6")
    : "#dee2e6";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="iab-bell-btn"
        onClick={() => setOpen(v => !v)}
        aria-label={`${totalCount} integrity alert${totalCount !== 1 ? "s" : ""}`}
      >
        {/* Bell icon button */}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: bellBg,
          border: `1.5px solid ${bellBorderColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .15s",
        }}>
          <i
            className={`bi bi-bell${hasBadge ? "-fill" : ""} iab-bell-icon${ringing ? " ringing" : ""}`}
            style={{ fontSize: 16, color: bellColor, display: "block" }}
          ></i>
        </div>

        {/* Badge */}
        {hasBadge && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: badgeColor, color: "#fff",
            minWidth: 16, height: 16, borderRadius: 8,
            fontSize: 9, fontWeight: 800, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff", padding: "0 3px",
            animation: flaggedCount > 0 ? "iab-pulse 2s ease infinite" : "none",
          }}>
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="iab-dropdown">

          {/* ── Header ── */}
          <div style={{
            padding: "12px 14px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: flaggedCount > 0 ? "#fff5f5" : visible.length > 0 ? "#fff8f0" : "#f8f9fa",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>
                <i className="bi bi-bell-fill me-1" style={{ fontSize: 12, color: bellColor }}></i>
                Integrity Alerts
              </span>
              {flaggedCount > 0 && (
                <span style={{ background: "#dc3545", color: "#fff", padding: "1px 7px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>
                  {flaggedCount} flagged
                </span>
              )}
              {possibleCount > 0 && (
                <span style={{ background: "#fd7e14", color: "#fff", padding: "1px 7px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>
                  {possibleCount} possible
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              <button
                onClick={(e) => { e.stopPropagation(); fetchAlerts(); }}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#888", fontSize: 14, lineHeight: 1 }}
                title="Refresh">
                {loading
                  ? <span className="spinner-border spinner-border-sm" style={{ width: "0.7rem", height: "0.7rem" }} />
                  : <i className="bi bi-arrow-clockwise"></i>}
              </button>
              {visible.length > 0 && (
                <button onClick={dismissAll}
                  style={{ border: "none", background: "none", fontSize: 11, color: "#888", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Dismiss all
                </button>
              )}
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {visible.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center", color: "#aaa" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>
                  <i className="bi bi-bell-slash" style={{ color: "#ccc" }}></i>
                </div>
                <div style={{ fontSize: 13 }}>No integrity alerts right now</div>
                <div style={{ fontSize: 11, marginTop: 3 }}>
                  {loading ? "Checking…" : `Refreshes every ${Math.round(POLL_MS / 1000)}s`}
                </div>
              </div>
            ) : (
              visible.map(alert => {
                const isFl    = alert.cpiClass === "flagged";
                const accentC = isFl ? "#dc3545" : "#fd7e14";
                const bgC     = isFl ? "#fff5f5" : "#fff8f0";
                const tagText = isFl ? "FLAGGED" : "POSSIBLE";

                // Format relative time if available
                let timeLabel = null;
                if (alert.submittedAt) {
                  const diff = Date.now() - new Date(alert.submittedAt).getTime();
                  const mins = Math.floor(diff / 60000);
                  const hrs  = Math.floor(mins / 60);
                  const days = Math.floor(hrs / 24);
                  if (days > 0)       timeLabel = `${days}d ago`;
                  else if (hrs > 0)   timeLabel = `${hrs}h ago`;
                  else if (mins > 0)  timeLabel = `${mins}m ago`;
                  else                timeLabel = "just now";
                }

                return (
                  <Link
                    key={alert.key}
                    to={`/instructor/exams/${alert.examId}`}
                    state={{ openAnomalyTab: true }}
                    className="iab-row"
                    onClick={() => setOpen(false)}
                    style={{ gap: 8, padding: "10px 12px", borderBottom: "1px solid #f5f5f5", background: bgC, alignItems: "flex-start" }}
                  >
                    {/* Left accent bar */}
                    <div style={{ width: 3, borderRadius: 4, alignSelf: "stretch", background: accentC, flexShrink: 0 }} />

                    {/* Avatar */}
                    <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: accentC, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>
                      {alert.studentName.charAt(0).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 1, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e" }}>{alert.studentName}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: accentC, borderRadius: 4, padding: "0 4px" }}>
                          {tagText} · {alert.cpi.toFixed(1)}%
                        </span>
                        {timeLabel && (
                          <span style={{ fontSize: 9, color: "#aaa", marginLeft: "auto" }}>{timeLabel}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {alert.studentEmail}
                      </div>
                      <div style={{ fontSize: 10, color: "#999", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <i className="bi bi-file-earmark-text me-1"></i>{alert.examTitle}
                      </div>
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={(e) => dismiss(alert.key, e)}
                      title="Dismiss"
                      style={{ border: "none", background: "none", color: "#bbb", fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1, flexShrink: 0, alignSelf: "flex-start" }}>
                      ×
                    </button>
                  </Link>
                );
              })
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ padding: "8px 14px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link to="/instructor/alerts" onClick={() => setOpen(false)}
              style={{ fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              <i className="bi bi-arrow-right-circle"></i> View all alerts
            </Link>
            <span style={{ fontSize: 10, color: "#bbb" }}>Flagged ≥ {FLAGGED_THRESHOLD}% CPI</span>
          </div>
        </div>
      )}
    </div>
  );
}