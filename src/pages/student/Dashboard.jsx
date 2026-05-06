import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body, html {
    margin: 0; padding: 0;
    background: #f0f4fb;
    font-family: 'DM Sans', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  :root {
    --blue:     #0056b3;
    --blue-lt:  #e8f0fe;
    --slate:    #64748b;
    --slate-lt: #94a3b8;
  }

  /* Topbar */
  .topbar {
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(0,86,179,.08);
    position: sticky; top: 0; z-index: 200;
    height: 56px; display: flex; align-items: center;
    padding: 0 12px; gap: 12px;
  }
  @media(min-width:1024px){ .topbar { padding: 0 16px; } }

  /* Sidebar */
  .glass-sidebar {
    background: rgba(255,255,255,0.60);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-right: 1px solid rgba(255,255,255,0.80);
    box-shadow: 4px 0 24px rgba(0,86,179,.07);
  }

  .nav-pill {
    display: flex; flex-direction: column; align-items: center;
    padding: 10px 8px; border-radius: 12px; gap: 4px;
    font-size: 11px; font-weight: 600; text-decoration: none;
    color: var(--slate); transition: background .15s, color .15s, transform .15s; width: 100%;
  }
  .nav-pill:hover  { background: var(--blue-lt); color: var(--blue); transform: translateY(-1px); }
  .nav-pill.active { background: var(--blue); color: #fff; box-shadow: 0 4px 14px rgba(0,86,179,.35); }
  .nav-pill i { font-size: 18px; }

  /* Cards */
  .card {
    background: #fff;
    border-radius: 14px;
    border: 1px solid rgba(0,86,179,.07);
    box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 14px rgba(0,86,179,.05);
  }

  /* Avatar */
  .avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: var(--blue); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; flex-shrink: 0;
  }

  /* Search bar (clickable trigger) */
  .search-trigger {
    display: flex; align-items: center; gap: 8px;
    background: #f8faff;
    border: 1px solid rgba(0,86,179,.15);
    border-radius: 10px; padding: 7px 14px 7px 36px;
    cursor: pointer; position: relative;
    transition: border-color .2s, box-shadow .2s;
    font-size: 13px; color: #94a3b8;
    font-family: 'DM Sans', sans-serif;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .search-trigger:hover {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(0,86,179,.08);
    background: #fff;
  }

  /* Courses grid — 2 cols on mobile, auto-fill on wider */
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media(min-width: 540px) {
    .courses-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media(min-width: 900px) {
    .courses-grid { grid-template-columns: repeat(4, 1fr); }
  }

  .course-card {
    background: #fff;
    border: 1px solid rgba(0,86,179,.08);
    border-radius: 12px;
    padding: 12px;
    text-decoration: none;
    display: flex; flex-direction: column; gap: 5px;
    transition: box-shadow .18s, border-color .18s, transform .18s;
    min-width: 0;
  }
  .course-card:hover {
    box-shadow: 0 4px 16px rgba(0,86,179,.12);
    border-color: rgba(0,86,179,.20);
    transform: translateY(-2px);
  }

  /* Two-column grid */
  .dash-cols {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media(min-width: 768px) {
    .dash-cols { grid-template-columns: 1fr 1fr; }
  }

  /* Quick actions grid — 2 cols on mobile, 4 on wider */
  .quick-actions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media(min-width: 640px) {
    .quick-actions-grid { grid-template-columns: repeat(4, 1fr); }
  }

  /* Exam row */
  .exam-row {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 0; border-bottom: 1px solid #f1f5f9;
  }
  .exam-row:last-child { border-bottom: none; }

  /* Result row */
  .result-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 0; border-bottom: 1px solid #f1f5f9;
  }
  .result-row:last-child { border-bottom: none; }

  /* Bottom nav */
  .bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0; height: 64px;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid rgba(0,86,179,.10);
    display: flex; align-items: stretch;
    z-index: 1030; box-shadow: 0 -4px 20px rgba(0,86,179,.07);
  }
  @media(min-width:1024px){ .bottom-nav { display: none; } }

  .bottom-nav a {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-size: 9px; font-weight: 600; gap: 3px;
    text-decoration: none; color: #94a3b8; transition: color .2s;
    border-top: 2px solid transparent;
  }
  .bottom-nav a.bnav-active { color: #0056b3; border-top-color: #0056b3; }
  .bottom-nav a i { font-size: 18px; }

  /* Skeleton */
  .skeleton {
    background: linear-gradient(90deg, #f1f5f9 25%, #e8f0fe 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
  }

  /* Section heading */
  .section-heading {
    font-size: 13px; font-weight: 700; color: #0f172a;
    margin: 0; display: flex; align-items: center; gap: 7px;
  }
  .section-heading i { color: var(--blue); font-size: 15px; }

  /* ── Notification dropdown (matches SubjectPage design) ── */
  @keyframes notifSlideDown {
    from { opacity: 0; transform: translateY(-8px) scale(.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }
  .notif-dropdown {
    position: fixed;
    top: 66px;
    right: 12px;
    left: auto;
    width: 360px;
    max-width: calc(100vw - 24px);
    max-height: 480px;
    overflow-y: auto;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 12px 48px rgba(0,86,179,.16), 0 3px 12px rgba(0,0,0,.07);
    border: 1px solid rgba(0,86,179,.09);
    z-index: 2000;
    animation: notifSlideDown .22s cubic-bezier(.32,1,.45,1) both;
  }
  .notif-header {
    padding: 14px 18px 12px;
    border-bottom: 1px solid #f1f5f9;
    display: flex; justify-content: space-between; align-items: center;
    position: sticky; top: 0; background: #fff; z-index: 1;
    border-radius: 18px 18px 0 0;
  }
  .notif-item {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 12px 16px;
    cursor: pointer;
    transition: background .12s;
    border-bottom: 1px solid #f8faff;
    position: relative;
  }
  .notif-item:last-child { border-bottom: none; }
  .notif-item:hover { background: #f8fbff; }
  .notif-item.unread { background: linear-gradient(90deg, #f0f6ff 0%, #fff 100%); }
  .notif-item.unread:hover { background: #e8f2ff; }
  .notif-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #0056b3; flex-shrink: 0; margin-top: 6px;
    box-shadow: 0 0 0 2px rgba(0,86,179,.2);
  }
  .notif-icon-wrap {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* ── Search overlay ── */
  .search-overlay-backdrop {
    position: fixed; inset: 0; z-index: 3000;
    background: rgba(15,23,42,0.45); backdrop-filter: blur(4px);
    display: flex; align-items: flex-start; justify-content: center;
    padding: 72px 12px 0;
    animation: fadeIn .15s ease both;
  }
  .search-overlay-box {
    width: min(560px, 100%);
    background: #fff; border-radius: 18px;
    box-shadow: 0 24px 80px rgba(0,86,179,.18), 0 4px 16px rgba(0,0,0,.08);
    border: 1px solid rgba(0,86,179,.10); overflow: hidden;
  }
  .search-result-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 18px; cursor: pointer;
    transition: background .12s;
    border-bottom: 1px solid #f8faff;
  }
  .search-result-item:last-child { border-bottom: none; }
  .search-result-item:hover { background: #f8faff; }

  /* Shimmer */
  .shimmer-block {
    border-radius: 10px;
    background: linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }

  /* Animations */
  @keyframes shimmer   { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }

  .fade-up { animation: fadeUp .35s ease both; }

  /* Scrollbar subtle */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,86,179,.15); border-radius: 99px; }
`;

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/student",                  icon: "bi-speedometer2",     label: "Home"     },
  { to: "/student/subjects",         icon: "bi-journal-bookmark", label: "Subjects" },
  { to: "/student/exams",            icon: "bi-pencil-square",    label: "Exams"    },
  { to: "/student/grades",           icon: "bi-graph-up-arrow",   label: "Grades"   },
  { to: "/student/account-settings", icon: "bi-gear",             label: "Settings" },
];

const ACCENTS = [
  { bg: "#eef2ff", color: "#0056b3" },
  { bg: "#fff7ed", color: "#ea8c00" },
  { bg: "#f0fdf4", color: "#16a34a" },
  { bg: "#fdf2f8", color: "#c026d3" },
  { bg: "#f0f9ff", color: "#0284c7" },
  { bg: "#fef9c3", color: "#ca8a04" },
];

const hashId = (id) => {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};
const accent = (id) => ACCENTS[hashId(id) % ACCENTS.length];

const EXAM_LIMIT   = 3;
const RESULT_LIMIT = 3;

/* ─────────────────────────────────────────────
   NOTIFICATION TYPE META  (matches SubjectPage)
───────────────────────────────────────────── */
const NOTIF_TYPE_META = {
  new_exam: {
    icon: "bi-pencil-square",
    bg: "#e8f0fe",
    color: "#0056b3",
    label: "New Exam",
  },
  new_subject: {
    icon: "bi-journal-plus",
    bg: "#fff7ed",
    color: "#f59e0b",
    label: "New Subject",
  },
  results_updated: {
    icon: "bi-bar-chart-fill",
    bg: "#f0fdf4",
    color: "#15803d",
    label: "Results",
  },
  score_updated: {
    icon: "bi-stars",
    bg: "#fdf4ff",
    color: "#9333ea",
    label: "Score Updated",
  },
  default: {
    icon: "bi-megaphone-fill",
    bg: "#e8f0fe",
    color: "#0056b3",
    label: "Notice",
  },
};

const getNotifMeta = (type) => NOTIF_TYPE_META[type] ?? NOTIF_TYPE_META.default;

/* ─────────────────────────────────────────────
   EXAM TYPE BADGE
───────────────────────────────────────────── */
const ExamTypeBadge = ({ type }) => {
  const map = {
    midterm: { bg: "#ede9fe", color: "#6d28d9", label: "Midterm" },
    final:   { bg: "#fef2f2", color: "#dc2626", label: "Final"   },
    quiz:    { bg: "#f0fdf4", color: "#15803d", label: "Quiz"    },
    prelim:  { bg: "#fff7ed", color: "#c2410c", label: "Prelim"  },
  };
  const s = map[type] ?? { bg: "#f1f5f9", color: "#64748b", label: type ?? "Exam" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px", borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: ".04em",
      background: s.bg, color: s.color, textTransform: "uppercase", flexShrink: 0,
    }}>{s.label}</span>
  );
};

/* ─────────────────────────────────────────────
   COUNTDOWN
───────────────────────────────────────────── */
const Countdown = ({ startTime }) => {
  const [diff, setDiff] = useState(null);
  useEffect(() => {
    const calc = () => {
      const ms = new Date(startTime) - new Date();
      if (ms <= 0) { setDiff(null); return; }
      setDiff({ h: Math.floor(ms / 3600000), m: Math.floor((ms % 3600000) / 60000) });
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [startTime]);
  if (!diff) return null;
  const urgent = diff.h === 0 && diff.m <= 30;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, flexShrink: 0,
      color: urgent ? "#ef4444" : "#64748b",
      background: urgent ? "#fef2f2" : "#f1f5f9",
      borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap",
    }}>
      {diff.h > 0 ? `${diff.h}h ${diff.m}m` : `${diff.m}m`}
    </span>
  );
};

/* ─────────────────────────────────────────────
   TIME AGO HELPER
───────────────────────────────────────────── */
const timeAgo = (iso) => {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso);
  const m  = Math.floor(ms / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/* ─────────────────────────────────────────────
   NOTIFICATION DROPDOWN  (matches SubjectPage design)
───────────────────────────────────────────── */
const NotificationDropdown = ({ notifications, unreadCount, onClose, onMarkAllRead, onNotifClick }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="notif-dropdown">
      {/* Header */}
      <div className="notif-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, background: "#ef4444", color: "#fff",
              padding: "2px 7px", borderRadius: 99, lineHeight: 1.4,
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead} style={{
            background: "none", border: "1px solid rgba(0,86,179,.18)", cursor: "pointer",
            fontSize: 11, fontWeight: 600, color: "#0056b3", padding: "3px 10px",
            borderRadius: 99, transition: "background .15s", fontFamily: "inherit",
          }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      {notifications === null ? (
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="shimmer-block" style={{ height: 64 }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: "40px 18px", textAlign: "center", color: "#94a3b8" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", background: "#f1f5f9",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <i className="bi bi-bell-slash" style={{ fontSize: 22, color: "#cbd5e1" }}></i>
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#64748b" }}>All caught up!</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>No notifications yet.</p>
        </div>
      ) : (
        <div>
          {notifications.map((n) => {
            const meta = getNotifMeta(n.type);
            return (
              <div
                key={n.id}
                className={`notif-item${n.is_read ? "" : " unread"}`}
                onClick={() => onNotifClick(n)}
                style={{ cursor: n.url ? "pointer" : "default" }}
              >
                {/* Unread dot */}
                <div style={{ width: 10, flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 5 }}>
                  {!n.is_read && <div className="notif-dot" />}
                </div>

                {/* Icon */}
                <div className="notif-icon-wrap" style={{ background: meta.bg }}>
                  <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: 15 }}></i>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: meta.color,
                      background: meta.bg, borderRadius: 99, padding: "1px 7px",
                    }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p style={{
                    margin: "0 0 2px", fontSize: 13,
                    fontWeight: n.is_read ? 500 : 700,
                    color: "#1e293b", lineHeight: 1.35,
                  }}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.45 }}>
                      {n.body}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   SEARCH OVERLAY
───────────────────────────────────────────── */
const SEARCH_TYPE_META = {
  subject: { icon: "bi-book-half",      bg: "#eef2ff", color: "#0056b3", label: "Subject" },
  exam:    { icon: "bi-pencil-square",  bg: "#f0fdf4", color: "#16a34a", label: "Exam"    },
  grade:   { icon: "bi-graph-up-arrow", bg: "#fff7ed", color: "#ea8c00", label: "Grade"   },
};

const SearchOverlay = ({ query, setQuery, results, loading, onClose, onNavigate }) => {
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleResultClick = (r) => {
    onClose();
    if (!r.url && !r.type) return;
    if (r.type === "exam")    { onNavigate("/student/exams");    return; }
    if (r.type === "grade")   { onNavigate("/student/grades");   return; }
    if (r.type === "subject") { onNavigate("/student/subjects"); return; }
    onNavigate(r.url ?? "/student");
  };

  const grouped = results.reduce((acc, r) => {
    const key = r.type ?? "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div
      className="search-overlay-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="search-overlay-box">
        {/* Input row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 18px", borderBottom: "1px solid #f1f5f9",
        }}>
          <i className="bi bi-search" style={{ color: "#0056b3", fontSize: 16, flexShrink: 0 }}></i>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search subjects, exams, grades…"
            style={{
              flex: 1, border: "none", outline: "none", fontSize: 15,
              fontFamily: "'DM Sans', sans-serif", color: "#0f172a", background: "transparent",
            }}
          />
          {loading && (
            <i className="bi bi-arrow-repeat" style={{ color: "#94a3b8", fontSize: 15, animation: "spin 1s linear infinite", flexShrink: 0 }}></i>
          )}
          {!loading && query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, flexShrink: 0 }}>
              <i className="bi bi-x-circle-fill" style={{ fontSize: 15 }}></i>
            </button>
          )}
          <kbd style={{ fontSize: 10, color: "#94a3b8", background: "#f1f5f9", padding: "2px 6px", borderRadius: 5, fontFamily: "monospace", flexShrink: 0 }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {!query ? (
            <div style={{ padding: "16px 18px" }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Quick Access
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {[
                  { label: "Subjects", icon: "bi-book-half",      to: "/student/subjects", bg: "#eef2ff", color: "#0056b3" },
                  { label: "Exams",    icon: "bi-pencil-square",  to: "/student/exams",    bg: "#f0fdf4", color: "#16a34a" },
                  { label: "Grades",   icon: "bi-graph-up-arrow", to: "/student/grades",   bg: "#fff7ed", color: "#ea8c00" },
                ].map(item => (
                  <div
                    key={item.to}
                    onClick={() => { onClose(); onNavigate(item.to); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 8, padding: "14px 8px", background: item.bg,
                      borderRadius: 12, cursor: "pointer", transition: "opacity .15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >
                    <i className={`bi ${item.icon}`} style={{ fontSize: 20, color: item.color }}></i>
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div className="shimmer-block" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="shimmer-block" style={{ height: 11, width: "55%", marginBottom: 7 }} />
                    <div className="shimmer-block" style={{ height: 9, width: "35%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: "32px 18px", textAlign: "center", color: "#94a3b8" }}>
              <i className="bi bi-emoji-frown" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: .6 }}></i>
              <span style={{ fontSize: 13 }}>No results for "<strong>{query}</strong>"</span>
            </div>
          ) : (
            Object.entries(grouped).map(([type, items]) => {
              const meta = SEARCH_TYPE_META[type] ?? { icon: "bi-search", bg: "#f1f5f9", color: "#64748b", label: type };
              return (
                <div key={type}>
                  <p style={{
                    margin: 0, padding: "10px 18px 4px",
                    fontSize: 10, fontWeight: 700, color: "#94a3b8",
                    textTransform: "uppercase", letterSpacing: ".06em",
                    borderTop: "1px solid #f8faff",
                  }}>
                    {meta.label}s
                  </p>
                  {items.map((r, i) => (
                    <div key={i} className="search-result-item" onClick={() => handleResultClick(r)}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, background: meta.bg,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: 15 }}></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.title}
                        </p>
                        {r.subtitle && (
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{r.subtitle}</p>
                        )}
                      </div>
                      <i className="bi bi-arrow-right" style={{ color: "#cbd5e1", fontSize: 13, flexShrink: 0 }}></i>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   QUICK ACTIONS DATA
───────────────────────────────────────────── */
const QUICK_ACTIONS = [
  {
    to: "/student/subjects",
    icon: "bi-journal-bookmark-fill",
    bg: "#eef2ff",
    color: "#0056b3",
    label: "My Subjects",
    desc: "View your enrolled subjects",
  },
  {
    to: "/student/exams",
    icon: "bi-pencil-square",
    bg: "#f0fdf4",
    color: "#16a34a",
    label: "Exams",
    desc: "See upcoming & past exams",
  },
  {
    to: "/student/grades",
    icon: "bi-graph-up-arrow",
    bg: "#fff7ed",
    color: "#ea8c00",
    label: "Grades",
    desc: "Check your exam results",
  },
  {
    to: "/student/account-settings",
    icon: "bi-person-circle",
    bg: "#fdf4ff",
    color: "#9333ea",
    label: "My Profile",
    desc: "Manage account settings",
  },
];

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();

  const [time, setTime]                   = useState(new Date());
  const [user, setUser]                   = useState(null);
  const [baselineInfo, setBaselineInfo]   = useState(null);
  const [upcomingExams, setUpcomingExams] = useState(null);
  const [recentResults, setRecentResults] = useState(null);
  const [courses, setCourses]             = useState(null);

  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState(null);
  const [unreadCount, setUnreadCount]     = useState(0);

  const [searchOpen, setSearchOpen]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  /* Clock */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Data */
  useEffect(() => {
    API.get("/me").then(r => setUser(r.data.user)).catch(() => {});
    API.get("/student/typing-baseline/status")
      .then(r => setBaselineInfo(r.data))
      .catch(() => setBaselineInfo({ has_baseline: false, recorded_at: null }));
    API.get("/student/courses").then(r => setCourses(r.data.courses ?? [])).catch(() => setCourses([]));
    API.get("/student/dashboard/exams/upcoming").then(r => setUpcomingExams(r.data)).catch(() => setUpcomingExams([]));
    API.get("/student/dashboard/exams/results").then(r => setRecentResults(r.data)).catch(() => setRecentResults([]));
  }, []);

  /* ── Notifications ── */
  const fetchNotifs = useCallback(() => {
    API.get("/student/notifications")
      .then(r => {
        setNotifications(r.data.notifications ?? []);
        setUnreadCount(r.data.unread_count ?? 0);
      })
      .catch(() => { setNotifications([]); setUnreadCount(0); });
  }, []);

  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 60000);
    return () => clearInterval(t);
  }, [fetchNotifs]);

  const handleMarkAllRead = () => {
    API.patch("/student/notifications/read-all").then(() => {
      setNotifications(prev => prev?.map(n => ({ ...n, is_read: true })) ?? []);
      setUnreadCount(0);
    }).catch(() => {});
  };

  const handleNotifClick = (notif) => {
    if (!notif.is_read) {
      API.patch(`/student/notifications/${notif.id}/read`).then(() => {
        setNotifications(prev => prev?.map(n => n.id === notif.id ? { ...n, is_read: true } : n) ?? []);
        setUnreadCount(prev => Math.max(0, prev - 1));
      }).catch(() => {});
    }
    if (notif.url || notif.type) {
      setNotifOpen(false);
      if (notif.type === "new_subject")         { navigate("/student/subjects"); return; }
      if (notif.type === "new_exam")             { navigate(`${notif.url}/take`); return; }
      // if (notif.type === "results_updated")      { navigate(`${notif.url}/results`); return; }
      // if (notif.type === "score_updated")        { navigate(`${notif.url}/results`); return; }
      if (notif.url)                             { navigate(notif.url); }
    }
  };

  /* Search debounce */
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    const t = setTimeout(() => {
      API.get("/student/search", { params: { q: searchQuery } })
        .then(r => { setSearchResults(r.data.results ?? []); setSearchLoading(false); })
        .catch(() => { setSearchResults([]); setSearchLoading(false); });
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/");
  };

  const closeSearch = () => { setSearchOpen(false); setSearchQuery(""); setSearchResults([]); };

  /* Helpers */
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "S";
  const firstName = user?.name?.split(" ")[0] ?? "Student";
  const fullName  = user?.name ?? "Student";
  const hour      = time.getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const fmtTime = (iso) => iso
    ? new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <>
      <style>{CSS}</style>

      {searchOpen && (
        <SearchOverlay
          query={searchQuery}
          setQuery={setSearchQuery}
          results={searchResults}
          loading={searchLoading}
          onClose={closeSearch}
          onNavigate={(path) => { closeSearch(); navigate(path); }}
        />
      )}

      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* ── TOPBAR ── */}
        <header className="topbar">
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
            SECT Portal
          </span>

          {/* Desktop search trigger */}
          <div
            className="d-none d-md-flex align-items-center ms-4 position-relative"
            style={{ maxWidth: 280 }}
            onClick={() => setSearchOpen(true)}
          >
            <i className="bi bi-search" style={{ position: "absolute", left: 12, color: "#94a3b8", fontSize: 13, zIndex: 1, pointerEvents: "none" }}></i>
            <div className="search-trigger" style={{ width: 240, paddingLeft: 36 }}>
              Search subjects, exams…
            </div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            {/* Bell */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                style={{
                  background: notifOpen ? "#e8f0fe" : "transparent",
                  border: "none", padding: "6px 8px", cursor: "pointer",
                  borderRadius: 10, transition: "background .15s", position: "relative",
                }}
              >
                <i className="bi bi-bell" style={{ fontSize: 18, color: notifOpen ? "#0056b3" : "#64748b" }}></i>
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: 2, right: 4,
                    minWidth: 16, height: 16, padding: "0 4px",
                    background: "#ef4444", borderRadius: 99,
                    border: "1.5px solid #f0f4fb",
                    fontSize: 9, fontWeight: 700, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onClose={() => setNotifOpen(false)}
                  onMarkAllRead={handleMarkAllRead}
                  onNotifClick={handleNotifClick}
                />
              )}
            </div>

            {/* User menu */}
            <div className="dropdown">
              <button
                className="d-flex align-items-center gap-2 dropdown-toggle"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }}
                data-bs-toggle="dropdown"
              >
                <div className="avatar">{initial}</div>
                <span className="d-none d-sm-inline" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{firstName}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
                <li><Link className="dropdown-item" to="/student/profile">My Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}
                    style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* ── PAGE BODY ── */}
        <div style={{ display: "flex" }}>

          {/* Sidebar (desktop only) */}
          <nav
            className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
            style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}
          >
            {NAV_ITEMS.map(({ to, icon, label }) => (
              <Link key={to} to={to} className={`nav-pill${label === "Home" ? " active" : ""}`}>
                <i className={`bi ${icon}`}></i>{label}
              </Link>
            ))}
          </nav>

          {/* Main */}
          <main style={{ flex: 1, minWidth: 0, padding: "18px 16px", paddingBottom: 84 }}>

            {/* Mobile search trigger */}
            <div
              className="d-md-none mb-3"
              onClick={() => setSearchOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#fff", border: "1px solid rgba(0,86,179,.12)",
                borderRadius: 10, padding: "10px 14px", cursor: "pointer",
              }}
            >
              <i className="bi bi-search" style={{ color: "#94a3b8", fontSize: 13 }}></i>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>Search subjects, exams, grades…</span>
            </div>

            {/* ── GREETING BANNER ── */}
            <div className="card fade-up" style={{
              padding: "18px 20px", marginBottom: 14,
              background: "linear-gradient(135deg, #0056b3 0%, #1a6ed8 100%)",
              border: "none",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,.7)", fontWeight: 500 }}>{greeting}</p>
                  <h1 style={{ margin: "2px 0 4px", fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-.3px", lineHeight: 1.2 }}>
                    {fullName}
                  </h1>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,.65)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user
                      ? [user.year_level, user.course, user.section ? `Section ${user.section}` : null].filter(Boolean).join(" · ")
                      : "Loading your profile…"}
                  </p>
                </div>

                {/* Clock + baseline pill */}
                <div className="d-none d-sm-flex" style={{ flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500,
                      color: "#fff", letterSpacing: -1, lineHeight: 1,
                    }}>
                      {time.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,.6)" }}>
                      {time.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                  </div>

                  {baselineInfo !== null && (
                    baselineInfo.has_baseline ? (
                      <button onClick={() => navigate("/student/typing-test")} style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.28)",
                        borderRadius: 99, padding: "3px 10px 3px 7px",
                        cursor: "pointer", fontFamily: "inherit", transition: "background .15s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.24)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.15)"}
                      >
                        <i className="bi bi-shield-check-fill" style={{ color: "#86efac", fontSize: 11 }}></i>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.9)", whiteSpace: "nowrap" }}>Baseline active</span>
                      </button>
                    ) : (
                      <button onClick={() => navigate("/student/typing-test")} style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        background: "rgba(251,191,36,.18)", border: "1px solid rgba(251,191,36,.42)",
                        borderRadius: 99, padding: "3px 10px 3px 7px",
                        cursor: "pointer", fontFamily: "inherit", transition: "background .15s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(251,191,36,.28)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(251,191,36,.18)"}
                      >
                        <i className="bi bi-exclamation-triangle-fill" style={{ color: "#fbbf24", fontSize: 11 }}></i>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.9)", whiteSpace: "nowrap" }}>Setup baseline</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* ── MY COURSES ── */}
            <div className="card fade-up" style={{ padding: "16px 18px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 className="section-heading">
                  <i className="bi bi-journal-bookmark-fill"></i>My Courses
                </h2>
                <Link to="/student/subjects" style={{ fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none" }}>
                  See all
                </Link>
              </div>

              {courses === null ? (
                <div className="courses-grid">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "18px 0", color: "#94a3b8" }}>
                  <i className="bi bi-journal-x" style={{ fontSize: 24, display: "block", marginBottom: 6 }}></i>
                  <span style={{ fontSize: 13 }}>No courses enrolled yet.</span>
                </div>
              ) : (
                <div className="courses-grid">
                  {courses.map((c, i) => {
                    const a = accent(i);
                    return (
                      <Link key={c.id} to={`/student/courses/${c.id}/exams`} className="course-card">
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, background: a.bg,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <i className="bi bi-book-half" style={{ fontSize: 13, color: a.color }}></i>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: a.color, textTransform: "uppercase", letterSpacing: ".04em" }}>
                          {c.code}
                        </span>
                        <span style={{
                          fontSize: 12, fontWeight: 600, color: "#1e293b", lineHeight: 1.3,
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {c.name}
                        </span>
                        <span style={{ fontSize: 11, color: "#94a3b8", marginTop: "auto" }}>
                          {c.exams_count ?? 0} exam{(c.exams_count ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── UPCOMING EXAMS + RECENT RESULTS ── */}
            <div className="dash-cols">

              {/* Upcoming Exams */}
              <div className="card fade-up" style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h2 className="section-heading">
                    <i className="bi bi-calendar-event-fill"></i>Upcoming Exams
                  </h2>
                  <Link to="/student/exams" style={{ fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none" }}>
                    See all
                  </Link>
                </div>

                {upcomingExams === null ? (
                  [1, 2].map(i => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: 11, width: "60%", marginBottom: 7 }} />
                        <div className="skeleton" style={{ height: 9, width: "40%" }} />
                      </div>
                    </div>
                  ))
                ) : upcomingExams.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
                    <i className="bi bi-calendar-check" style={{ fontSize: 24, display: "block", marginBottom: 6 }}></i>
                    <span style={{ fontSize: 13 }}>No upcoming exams right now.</span>
                  </div>
                ) : (
                  <>
                    {upcomingExams.slice(0, EXAM_LIMIT).map(exam => (
                      <div key={exam.id} className="exam-row">
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: "#e8f0fe", display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#0056b3", lineHeight: 1 }}>
                            {new Date(exam.start_time).getDate()}
                          </span>
                          <span style={{ fontSize: 9, fontWeight: 600, color: "#4d90fe", textTransform: "uppercase" }}>
                            {new Date(exam.start_time).toLocaleDateString("en-PH", { month: "short" })}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{exam.title}</span>
                            <ExamTypeBadge type={exam.type} />
                          </div>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                            {exam.course} · {fmtTime(exam.start_time)} · {exam.duration_minutes} min
                          </p>
                        </div>
                        <Countdown startTime={exam.start_time} />
                      </div>
                    ))}
                    {upcomingExams.length > EXAM_LIMIT && (
                      <Link to="/student/exams" style={{ display: "block", textAlign: "center", fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none", paddingTop: 10 }}>
                        +{upcomingExams.length - EXAM_LIMIT} more →
                      </Link>
                    )}
                  </>
                )}
              </div>

              {/* Recent Results */}
              <div className="card fade-up" style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h2 className="section-heading">
                    <i className="bi bi-bar-chart-fill"></i>Recent Results
                  </h2>
                  <Link to="/student/grades" style={{ fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none" }}>
                    See all
                  </Link>
                </div>

                {recentResults === null ? (
                  [1, 2].map(i => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: 11, width: "55%", marginBottom: 7 }} />
                        <div className="skeleton" style={{ height: 9, width: "35%" }} />
                      </div>
                      <div className="skeleton" style={{ width: 34, height: 18, borderRadius: 6, flexShrink: 0 }} />
                    </div>
                  ))
                ) : recentResults.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
                    <i className="bi bi-bar-chart" style={{ fontSize: 24, display: "block", marginBottom: 6 }}></i>
                    <span style={{ fontSize: 13 }}>No exam results yet.</span>
                  </div>
                ) : (
                  <>
                    {recentResults.slice(0, RESULT_LIMIT).map((r, i) => {
                      const pct        = r.total > 0 ? Math.round((r.score / r.total) * 100) : null;
                      const passed     = r.passed;
                      const scoreColor = passed === true ? "#16a34a" : passed === false ? "#dc2626" : "#0f172a";
                      return (
                        <div key={i} className="result-row">
                          <div style={{
                            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                            background: passed === true ? "#f0fdf4" : passed === false ? "#fef2f2" : "#f8faff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <i
                              className={`bi ${passed === true ? "bi-check-lg" : passed === false ? "bi-x-lg" : "bi-dash"}`}
                              style={{ fontSize: 13, color: scoreColor }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {r.exam}
                            </p>
                            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                              {r.course}{r.type ? " · " : ""}
                              {r.type && <ExamTypeBadge type={r.type} />}
                            </p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: scoreColor }}>
                              {pct !== null ? `${pct}%` : r.score}
                            </p>
                            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>{r.score}/{r.total}</p>
                          </div>
                        </div>
                      );
                    })}
                    {recentResults.length > RESULT_LIMIT && (
                      <Link to="/student/grades" style={{ display: "block", textAlign: "center", fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none", paddingTop: 10 }}>
                        View all results →
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── QUICK ACTIONS ── */}
            <div className="card fade-up" style={{ padding: "16px 18px", marginTop: 14 }}>
              <h2 className="section-heading" style={{ marginBottom: 12 }}>
                <i className="bi bi-lightning-charge-fill" style={{ color: "#f59e0b" }}></i>Quick Actions
              </h2>
              <div className="quick-actions-grid">
                {QUICK_ACTIONS.map(({ to, icon, bg, color, label, desc }) => (
                  <Link
                    key={to}
                    to={to}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "14px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,86,179,.07)",
                      background: "#fafcff",
                      textDecoration: "none",
                      transition: "box-shadow .18s, border-color .18s, transform .18s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,86,179,.10)";
                      e.currentTarget.style.borderColor = "rgba(0,86,179,.18)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "rgba(0,86,179,.07)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <i className={`bi ${icon}`} style={{ fontSize: 16, color }}></i>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{label}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </main>
        </div>

        {/* ── BOTTOM NAV (mobile) ── */}
        <nav className="bottom-nav">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <Link key={to} to={to} className={label === "Home" ? "bnav-active" : ""}>
              <i className={`bi ${icon}`}></i>{label}
            </Link>
          ))}
        </nav>

      </div>
    </>
  );
};

export default Dashboard;