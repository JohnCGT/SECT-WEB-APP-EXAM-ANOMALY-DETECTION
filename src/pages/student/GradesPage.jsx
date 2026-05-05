import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";

/* ─── Global CSS ─── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  body, html {
    margin: 0; padding: 0;
    background: #f0f4fb;
    font-family: 'DM Sans', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  :root {
    --blue:      #0056b3;
    --blue-mid:  #1a6ed8;
    --blue-lite: #e8f0fe;
    --slate:     #64748b;
    --slate-lt:  #94a3b8;
    --card-bg:   #ffffff;
    --card-br:   14px;
  }

  .topbar {
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(0,86,179,.08);
    position: sticky; top: 0; z-index: 200; height: 56px;
  }
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
  .nav-pill:hover  { background: var(--blue-lite); color: var(--blue); transform: translateY(-1px); }
  .nav-pill.active { background: var(--blue); color: #fff; box-shadow: 0 4px 14px rgba(0,86,179,.35); }
  .nav-pill i { font-size: 18px; }

  .avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: var(--blue); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; flex-shrink: 0;
  }

  .search-input {
    border: 1px solid rgba(0,86,179,.15); border-radius: 10px;
    background: #f8faff; padding: 8px 14px 8px 36px;
    font-size: 13px; color: #1e293b; outline: none;
    font-family: 'DM Sans', sans-serif; width: 100%;
    transition: border-color .2s, box-shadow .2s;
  }
  .search-input:focus {
    border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0,86,179,.10); background: #fff;
  }

  /* Horizontal filter tabs */
  .filter-track {
    display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px;
    scrollbar-width: none;
  }
  .filter-track::-webkit-scrollbar { display: none; }
  .filter-tab {
    flex-shrink: 0; padding: 6px 14px; border-radius: 99px; border: none;
    font-size: 12px; font-weight: 600; cursor: pointer;
    background: transparent; color: var(--slate-lt);
    transition: background .15s, color .15s;
    font-family: 'DM Sans', sans-serif;
  }
  .filter-tab.active { background: var(--blue-lite); color: var(--blue); }
  .filter-tab:hover:not(.active) { color: var(--slate); background: #f1f5f9; }

  /* Tab pills (legacy) */
  .tab-pill {
    padding: 7px 18px; border-radius: 99px; border: none;
    font-size: 13px; font-weight: 600; cursor: pointer;
    background: transparent; color: var(--slate-lt);
    transition: background .15s, color .15s;
    font-family: 'DM Sans', sans-serif; white-space: nowrap;
  }
  .tab-pill.active { background: var(--blue-lite); color: var(--blue); }
  .tab-pill:hover:not(.active) { color: var(--slate); background: #f1f5f9; }

  /* Course section card */
  .course-card {
    background: #fff;
    border: 1px solid rgba(0,86,179,.08);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,86,179,.05);
    transition: box-shadow .2s;
  }
  .course-card:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,.06), 0 8px 24px rgba(0,86,179,.09);
  }

  /* Exam row inside a course */
  .exam-item {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; padding: 11px 16px;
    border-top: 1px solid #f4f6fb;
    transition: background .12s;
    flex-wrap: wrap;
  }
  .exam-item:hover { background: #fafbff; }

  /* Progress bar */
  .prog-track { height: 4px; border-radius: 99px; background: #eef2ff; overflow: hidden; }
  .prog-fill  { height: 100%; border-radius: 99px; transition: width 1.2s cubic-bezier(.4,0,.2,1); }

  /* Pending grading badge */
  @keyframes gentle-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: .55; }
  }
  .pending-badge { animation: gentle-pulse 2.4s ease infinite; }

  /* Fade up */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .32s ease both; }

  /* Skeleton shimmer */
  .skeleton {
    background: linear-gradient(90deg, #f0f4fb 25%, #e8eef8 50%, #f0f4fb 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 10px;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Bottom nav */
  .bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0; height: 64px;
    background: rgba(255,255,255,0.96);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid rgba(0,86,179,0.10);
    display: flex; align-items: stretch; z-index: 150;
    box-shadow: 0 -4px 24px rgba(0,86,179,0.08);
  }
  .bottom-nav a {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; font-size: 10px; font-weight: 600; gap: 3px;
    text-decoration: none; color: #94a3b8; transition: color .2s;
    border-top: 2px solid transparent;
  }
  .bottom-nav a.active { color: #0056b3; border-top-color: #0056b3; }
  .bottom-nav a i { font-size: 19px; }

  /* ── Notification dropdown ── */
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
  .shimmer-block {
    border-radius: 10px;
    background: linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }

  /* Search overlay */
  @keyframes overlayFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes overlayPanelIn {
    from { opacity: 0; transform: translateY(-10px) scale(.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,86,179,.15); border-radius: 99px; }
`;

/* ─── Constants ─── */
const NAV_ITEMS = [
  { to: "/student",                  icon: "bi-speedometer2",     label: "Home"     },
  { to: "/student/subjects",         icon: "bi-journal-bookmark", label: "Subjects" },
  { to: "/student/exams",            icon: "bi-pencil-square",    label: "Exams"    },
  { to: "/student/grades",           icon: "bi-graph-up-arrow",   label: "Grades"   },
  { to: "/student/account-settings", icon: "bi-gear",             label: "Settings" },
];

/* ─── Notification type config (mirrored from ExamsPage) ─── */
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
    label: "Enrolled",
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

/* ─── Philippine Grading Helpers ─── */
const pctToGradePoint = (pct) => {
  if (pct === null || pct === undefined) return null;
  if (pct >= 97) return 1.00;
  if (pct >= 93) return 1.25;
  if (pct >= 89) return 1.50;
  if (pct >= 85) return 1.75;
  if (pct >= 81) return 2.00;
  if (pct >= 77) return 2.25;
  if (pct >= 75) return 2.50;
  return 5.00;
};

// 1.00 fills bar fully, 5.00 = empty
const gpaToBarPct = (gpa) => {
  if (!gpa) return 0;
  return Math.round(((5.00 - Math.min(5, Math.max(1, gpa))) / 4) * 100);
};

const scoreColor = (pct) => {
  if (pct === null || pct === undefined) return "#94a3b8";
  return pct >= 75 ? "#0056b3" : "#64748b";
};

const examTypeMeta = (type) => {
  const map = {
    midterm: { label: "Midterm", bg: "#e8f0fe", color: "#0056b3" },
    final:   { label: "Final",   bg: "#f5f3ff", color: "#8b5cf6" },
    quiz:    { label: "Quiz",    bg: "#f0fdf4", color: "#16a34a" },
    prelim:  { label: "Prelim",  bg: "#fff7ed", color: "#d97706" },
  };
  return map[type?.toLowerCase()] ?? { label: type ?? "Exam", bg: "#f1f5f9", color: "#64748b" };
};

/* ─── Semester classification helper ─── */
const SEMESTER_TABS = [
  { key: "all",    label: "All"           },
  { key: "first",  label: "1st Semester"  },
  { key: "second", label: "2nd Semester"  },
  { key: "summer", label: "Summer"        },
];

const classifySemester = (semStr) => {
  if (!semStr) return "all";
  const s = semStr.toLowerCase();
  if (s.includes("summer") || s.includes("midyear")) return "summer";
  if (s.includes("2nd") || s.includes("second"))     return "second";
  if (s.includes("1st") || s.includes("first"))      return "first";
  return "other";
};

/* ─────────────────────────────────────────────
   NOTIFICATION DROPDOWN (same as ExamsPage)
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
            borderRadius: 99, transition: "background .15s",
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
                <div style={{ width: 10, flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 5 }}>
                  {!n.is_read && <div className="notif-dot" />}
                </div>
                <div className="notif-icon-wrap" style={{ background: meta.bg }}>
                  <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: 15 }}></i>
                </div>
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
   GRADES SEARCH OVERLAY
   Searches by course name, course code, or exam title
───────────────────────────────────────────── */
const GradesSearchOverlay = ({ courses, onClose, onSelectCourse }) => {
  const [query, setQuery] = useState("");
  const inputRef          = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return courses.filter(c =>
      (c.course_name || "").toLowerCase().includes(q) ||
      (c.course_code || "").toLowerCase().includes(q) ||
      (c.instructor  || "").toLowerCase().includes(q) ||
      c.exams?.some(e => (e.title || "").toLowerCase().includes(q))
    ).slice(0, 8);
  }, [query, courses]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 80, animation: "overlayFadeIn .15s ease both",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "min(560px, calc(100vw - 32px))", background: "#fff", borderRadius: 18,
        boxShadow: "0 24px 80px rgba(0,86,179,.18), 0 4px 16px rgba(0,0,0,.08)",
        border: "1px solid rgba(0,86,179,.10)", overflow: "hidden",
        animation: "overlayPanelIn .2s cubic-bezier(.32,1,.45,1) both",
      }}>
        {/* Input row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
          <i className="bi bi-search" style={{ color: "#0056b3", fontSize: 16, flexShrink: 0 }}></i>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search courses or exams…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: "#0f172a", background: "transparent" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 15, flexShrink: 0, padding: 0 }}>
              <i className="bi bi-x-circle-fill"></i>
            </button>
          )}
          <kbd style={{ fontSize: 10, color: "#94a3b8", background: "#f1f5f9", padding: "2px 6px", borderRadius: 5, flexShrink: 0, fontFamily: "monospace" }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: "auto" }}>
          {!query ? (
            <div style={{ padding: "28px 18px", textAlign: "center", color: "#94a3b8" }}>
              <i className="bi bi-graph-up-arrow" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: .4 }}></i>
              <span style={{ fontSize: 13 }}>Start typing to search your grades…</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div style={{ padding: "28px 18px", textAlign: "center", color: "#94a3b8" }}>
              <i className="bi bi-emoji-frown" style={{ fontSize: 24, display: "block", marginBottom: 8 }}></i>
              <span style={{ fontSize: 13 }}>No courses match "<strong>{query}</strong>"</span>
            </div>
          ) : suggestions.map((course, i) => {
            const hasGrade = course.average !== null && course.average !== undefined;
            const gp       = hasGrade ? pctToGradePoint(course.average) : null;
            return (
              <div
                key={course.course_id}
                onClick={() => onSelectCourse(course)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", cursor: "pointer",
                  borderBottom: i < suggestions.length - 1 ? "1px solid #f8faff" : "none",
                  transition: "background .12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="bi bi-journal-text" style={{ color: "#0056b3", fontSize: 16 }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {course.course_name}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                    {course.course_code}{course.semester ? ` · ${course.semester}` : ""}
                  </p>
                </div>
                {hasGrade ? (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0056b3", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
                      {gp?.toFixed(2) ?? "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{course.average}%</div>
                  </div>
                ) : (
                  <span style={{ background: "#f1f5f9", color: "#94a3b8", borderRadius: 99, padding: "2px 9px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    No grade
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─── Nav components ─── */
const BottomNav = ({ active }) => (
  <nav className="bottom-nav d-lg-none">
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={active === label ? "active" : ""}>
        <i className={`bi ${icon}`}></i>{label}
      </Link>
    ))}
  </nav>
);

/* ─────────────────────────────────────────────
   TOPBAR — with notifications + grades search
   (same structure as ExamsPage)
───────────────────────────────────────────── */
const Topbar = ({
  user, onLogout,
  onSearchBarClick,
  notifOpen, setNotifOpen,
  notifications, unreadCount,
  onMarkAllRead, onNotifClick,
  notifBtnRef,
}) => {
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "S";
  const firstName = user?.name?.split(" ")[0] ?? "Student";

  return (
    <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
      <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
        SECT Portal
      </span>

      {/* Desktop: clickable search bar that opens grades overlay */}
      <div
        className="d-none d-md-flex align-items-center ms-4 position-relative"
        style={{ maxWidth: 300 }}
        onClick={onSearchBarClick}
      >
        <i className="bi bi-search" style={{ position: "absolute", left: 12, color: "#94a3b8", fontSize: 13, zIndex: 1, pointerEvents: "none" }}></i>
        <input className="search-input" placeholder="Search grades…" readOnly style={{ cursor: "pointer", width: 220 }} />
      </div>

      <div className="ms-auto d-flex align-items-center gap-2">
        {/* Bell */}
        <div style={{ position: "relative" }} ref={notifBtnRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            style={{
              background: notifOpen ? "#e8f0fe" : "transparent",
              border: "none", position: "relative", padding: "6px 8px",
              cursor: "pointer", borderRadius: 10, transition: "background .15s",
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
              onMarkAllRead={onMarkAllRead}
              onNotifClick={onNotifClick}
            />
          )}
        </div>

        {/* Avatar / dropdown */}
        <div className="dropdown">
          <button className="d-flex align-items-center gap-2 dropdown-toggle"
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }}
            data-bs-toggle="dropdown">
            <div className="avatar">{initial}</div>
            <span className="d-none d-sm-inline" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{firstName}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
            <li><Link className="dropdown-item" to="/student/profile">My Profile</Link></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger" onClick={onLogout}
                style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ active }) => (
  <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
    style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}>
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={`nav-pill${active === label ? " active" : ""}`}>
        <i className={`bi ${icon}`}></i>{label}
      </Link>
    ))}
  </nav>
);

/* ─── GWA Banner — no standing text ─── */
const GWABanner = ({ gpa, gradedCount, totalCount, semesterLabel }) => {
  const hasGWA = gpa !== null && gpa !== undefined;
  const barPct = hasGWA ? gpaToBarPct(gpa) : 0;
  return (
    <div className="fade-up" style={{
      background: "linear-gradient(135deg, #0056b3 0%, #1a6ed8 60%, #4d90fe 100%)",
      borderRadius: 14, padding: "20px", position: "relative",
      overflow: "hidden", marginBottom: 16
    }}>
      <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
      <div style={{ position: "absolute", right: 40, bottom: -40, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />

      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: ".08em" }}>
        {semesterLabel ? `${semesterLabel} · ` : ""}General Weighted Average
      </p>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, margin: "6px 0 12px", flexWrap: "wrap" }}>
        <span style={{
          fontSize: 52, fontWeight: 700, color: "#fff", lineHeight: 1,
          letterSpacing: "-2px", fontFamily: "'DM Mono', monospace"
        }}>
          {hasGWA ? gpa.toFixed(2) : "—"}
        </span>
        {!hasGWA && (
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)", paddingBottom: 8 }}>
            No graded exams yet
          </span>
        )}
      </div>

      <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,.2)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${barPct}%`, background: "#fff", borderRadius: 99, transition: "width 1.2s" }} />
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 10, color: "rgba(255,255,255,.4)" }}>
        {gradedCount} of {totalCount} course{totalCount !== 1 ? "s" : ""} graded
      </p>
    </div>
  );
};

/* ─── Pending Essay Banner ─── */
const PendingEssayBanner = ({ count }) => {
  if (!count || count === 0) return null;
  return (
    <div className="fade-up" style={{
      background: "#fffbeb", border: "1px solid #fcd34d",
      borderRadius: 12, padding: "12px 16px",
      display: "flex", alignItems: "center", gap: 12, marginBottom: 16
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%", background: "#fff7ed",
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <i className="bi bi-hourglass-split" style={{ color: "#f59e0b", fontSize: 15 }}></i>
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#92400e" }}>
          {count} exam{count !== 1 ? "s are" : " is"} awaiting essay grading
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#b45309" }}>
          Your score will update once your instructor finishes grading. You'll be notified.
        </p>
      </div>
    </div>
  );
};

/* ─── Skeleton ─── */
const SkeletonGrades = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div className="skeleton" style={{ height: 108, borderRadius: 14 }} />
    <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
    <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
  </div>
);

/* ─── Course Section Card ─── */
const CourseSection = ({ course, highlightQuery }) => {
  const hasGrade = course.average !== null && course.average !== undefined;
  const gp       = hasGrade ? pctToGradePoint(course.average) : null;
  const hasPendingEssay = course.exams?.some(e => e.has_essay && !e.essay_graded && e.submitted);
  const now      = new Date();

  // Accent color based on course code (deterministic, not random per render)
  const ACCENTS = [
    { accent: "#0056b3", iconBg: "#e8f0fe" },
    { accent: "#f59e0b", iconBg: "#fff7ed" },
    { accent: "#ec4899", iconBg: "#fdf2f8" },
    { accent: "#22c55e", iconBg: "#f0fdf4" },
    { accent: "#8b5cf6", iconBg: "#f5f3ff" },
    { accent: "#0ea5e9", iconBg: "#f0f9ff" },
    { accent: "#ef4444", iconBg: "#fef2f2" },
    { accent: "#14b8a6", iconBg: "#f0fdfa" },
  ];
  const accentIdx = (course.course_code || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENTS.length;
  const acc = ACCENTS[accentIdx];

  return (
    <div className="course-card fade-up">

      {/* ── Course Header ── */}
      <div style={{
        padding: "16px 16px 0",
        borderLeft: `4px solid ${acc.accent}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Icon — consistent journal icon, no random illustrations */}
          <div style={{
            width: 44, height: 44, borderRadius: 11, background: acc.iconBg,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <i className="bi bi-journal-text" style={{ color: acc.accent, fontSize: 19 }}></i>
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
                {course.course_name}
              </span>
              {hasPendingEssay && (
                <span className="pending-badge" style={{
                  background: "#fff7ed", color: "#d97706",
                  borderRadius: 99, padding: "1px 7px", fontSize: 9, fontWeight: 700
                }}>
                  <i className="bi bi-hourglass-split" style={{ fontSize: 8, marginRight: 2 }}></i>Pending
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: acc.accent,
                background: acc.iconBg, borderRadius: 99, padding: "1px 8px"
              }}>{course.course_code}</span>
              {course.semester && (
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{course.semester}</span>
              )}
              {course.instructor && (
                <span style={{ fontSize: 10, color: "#94a3b8" }}>
                  <i className="bi bi-person" style={{ marginRight: 2 }}></i>{course.instructor}
                </span>
              )}
            </div>
          </div>

          {/* Grade point for this course */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {hasGrade ? (
              <>
                <div style={{
                  fontSize: 22, fontWeight: 700, color: "#0f172a",
                  fontFamily: "'DM Mono', monospace", lineHeight: 1
                }}>
                  {gp?.toFixed(2) ?? "—"}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                  {course.average}%
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>No grade yet</div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {hasGrade && (
          <div style={{ marginTop: 12, marginBottom: 14, paddingLeft: 56 }}>
            <div className="prog-track">
              <div className="prog-fill" style={{ width: `${course.average}%`, background: acc.accent }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>
                {course.submitted_exams ?? 0} of {course.total_exams ?? 0} exam{course.total_exams !== 1 ? "s" : ""} submitted
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: acc.accent }}>{course.average}%</span>
            </div>
          </div>
        )}
        {!hasGrade && <div style={{ marginBottom: 14 }} />}
      </div>

      {/* ── Exams Section ── */}
      <div style={{ borderTop: "1px solid #f1f5f9" }}>
        <div style={{
          padding: "8px 16px",
          background: "#fafbff",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Exam
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Grade
          </span>
        </div>

        {!course.exams || course.exams.length === 0 ? (
          <div style={{ padding: "20px 16px", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
            No exams published for this course yet.
          </div>
        ) : (
          course.exams.map((exam) => {
            const typeMeta   = examTypeMeta(exam.type);
            const hasPending = exam.has_essay && !exam.essay_graded && exam.submitted;
            const isMissed   = !exam.submitted && new Date(exam.end_time) < now;
            const isUpcoming = !exam.submitted && new Date(exam.end_time) >= now;
            const gp         = exam.percentage !== null ? pctToGradePoint(exam.percentage) : null;

            return (
              <div key={exam.id} className="exam-item">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <span style={{
                    background: typeMeta.bg, color: typeMeta.color,
                    borderRadius: 99, padding: "2px 8px",
                    fontSize: 10, fontWeight: 700, flexShrink: 0, textTransform: "capitalize"
                  }}>{typeMeta.label}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: "#1e293b",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>{exam.title}</span>
                </div>

                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  {exam.submitted && !hasPending && exam.percentage !== null && (
                    <>
                      <div style={{ textAlign: "right" }}>
                        <div style={{
                          fontSize: 15, fontWeight: 700,
                          fontFamily: "'DM Mono', monospace",
                          color: scoreColor(exam.percentage)
                        }}>
                          {gp?.toFixed(2) ?? "—"}
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>
                          {exam.score}/{exam.total_points} ({exam.percentage}%)
                        </div>
                      </div>
                      <Link to={`/student/exams/${exam.id}/results`}
                        style={{
                          fontSize: 10, fontWeight: 600, color: "#0056b3",
                          background: "#e8f0fe", borderRadius: 99,
                          padding: "3px 10px", textDecoration: "none", flexShrink: 0
                        }}>
                        View
                      </Link>
                    </>
                  )}
                  {hasPending && (
                    <div style={{ textAlign: "right" }}>
                      {exam.score !== null && (
                        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 2 }}>
                          {exam.score}/{exam.total_points} partial
                        </div>
                      )}
                      <span className="pending-badge" style={{
                        background: "#fff7ed", color: "#d97706",
                        borderRadius: 99, padding: "3px 9px",
                        fontSize: 10, fontWeight: 700,
                        display: "inline-flex", alignItems: "center", gap: 3
                      }}>
                        <i className="bi bi-hourglass-split" style={{ fontSize: 9 }}></i>
                        Essay pending
                      </span>
                    </div>
                  )}
                  {isMissed && (
                    <span style={{
                      background: "#f1f5f9", color: "#94a3b8",
                      borderRadius: 99, padding: "3px 9px", fontSize: 10, fontWeight: 600
                    }}>Missed</span>
                  )}
                  {isUpcoming && (
                    <span style={{
                      background: "#f8faff", color: "#64748b",
                      borderRadius: 99, padding: "3px 9px", fontSize: 10, fontWeight: 600,
                      border: "1px solid #e2e8f0"
                    }}>Not yet taken</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   GRADES PAGE
══════════════════════════════════════ */
const GradesPage = () => {
  const navigate  = useNavigate();
  const notifBtnRef = useRef(null);

  const [user,        setUser]        = useState(null);
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [semesterTab, setSemesterTab] = useState("all");
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [highlightId, setHighlightId] = useState(null);

  /* ── Notification state ── */
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [notifications,  setNotifications]  = useState(null);
  const [unreadCount,    setUnreadCount]    = useState(0);

  /* ── Data ── */
  useEffect(() => {
    (async () => {
      try {
        const [uRes, gRes] = await Promise.all([
          API.get("/me"),
          API.get("/student/grades"),
        ]);
        setUser(uRes.data.user);
        setData(gRes.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load grades.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Notifications (same pattern as ExamsPage) ── */
  const fetchNotifications = useCallback(() => {
    API.get("/student/notifications")
      .then(res => {
        setNotifications(res.data.notifications ?? []);
        setUnreadCount(res.data.unread_count ?? 0);
      })
      .catch(() => { setNotifications([]); setUnreadCount(0); });
  }, []);

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 60000);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  const handleMarkAllRead = () => {
    API.patch("/student/notifications/read-all")
      .then(() => {
        setNotifications(prev => prev?.map(n => ({ ...n, is_read: true })) ?? []);
        setUnreadCount(0);
      })
      .catch(() => {});
  };

  const handleNotifClick = (notif) => {
    if (!notif.is_read) {
      API.patch(`/student/notifications/${notif.id}/read`)
        .then(() => {
          setNotifications(prev => prev?.map(n => n.id === notif.id ? { ...n, is_read: true } : n) ?? []);
          setUnreadCount(prev => Math.max(0, prev - 1));
        })
        .catch(() => {});
    }
    if (notif.url) {
      setNotifOpen(false);
      navigate(notif.url);
    }
  };

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/");
  };

  /* When user picks a course from the search overlay */
  const handleSearchSelect = (course) => {
    setSearchOpen(false);
    // Determine which semester tab to switch to so the course is visible
    const semKey = classifySemester(course.semester);
    const tabKey = (semKey === "other" || semKey === "all") ? "all" : semKey;
    setSemesterTab(tabKey);
    setHighlightId(course.course_id);
    // Scroll after a short delay for the tab to render
    setTimeout(() => {
      const el = document.getElementById(`course-${course.course_id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  };

  const courses = data?.courses ?? [];
  const gpa     = data?.gpa ?? null;

  /* ── Semester tab filtering ── */
  const displayedCourses = useMemo(() => {
    if (semesterTab === "all") return courses;
    return courses.filter(c => classifySemester(c.semester) === semesterTab);
  }, [courses, semesterTab]);

  /* Counts per tab for badge */
  const semesterCounts = useMemo(() => {
    const counts = { all: courses.length, first: 0, second: 0, summer: 0 };
    courses.forEach(c => {
      const k = classifySemester(c.semester);
      if (counts[k] !== undefined) counts[k]++;
    });
    return counts;
  }, [courses]);

  /* GWA for displayed subset */
  const displayedGPA = useMemo(() => {
    if (semesterTab === "all") return gpa;
    const graded = displayedCourses.filter(c => c.average !== null);
    if (graded.length === 0) return null;
    const avgGP = graded.reduce((sum, c) => sum + (pctToGradePoint(c.average) ?? 0), 0) / graded.length;
    return Math.round(avgGP * 100) / 100;
  }, [semesterTab, displayedCourses, gpa]);

  const gradedDisplayed = displayedCourses.filter(c => c.average !== null).length;

  const pendingEssayCount = courses.reduce((acc, c) =>
    acc + (c.exams?.filter(e => e.has_essay && !e.essay_graded && e.submitted).length ?? 0), 0
  );

  /* Label shown in GWA banner */
  const semLabelMap = { all: null, first: "1st Semester", second: "2nd Semester", summer: "Summer" };
  const gwaSemLabel = semLabelMap[semesterTab] ?? null;

  /* Newly released grades (from the API notifications) */
  const hasNewGrades = (notifications ?? []).some(n =>
    (n.type === "results_updated" || n.type === "score_updated") && !n.is_read
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Grades search overlay */}
      {searchOpen && (
        <GradesSearchOverlay
          courses={courses}
          onClose={() => setSearchOpen(false)}
          onSelectCourse={handleSearchSelect}
        />
      )}

      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>
        <Topbar
          user={user}
          onLogout={handleLogout}
          onSearchBarClick={() => setSearchOpen(true)}
          notifOpen={notifOpen}
          setNotifOpen={setNotifOpen}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={handleMarkAllRead}
          onNotifClick={handleNotifClick}
          notifBtnRef={notifBtnRef}
        />

        <div className="d-flex">
          <Sidebar active="Grades" />

          <main style={{ flex: 1, padding: "20px 16px", paddingBottom: 88, minWidth: 0 }}>

            {/* Mobile search bar — opens overlay */}
            <div className="d-md-none mb-3 position-relative" onClick={() => setSearchOpen(true)}>
              <i className="bi bi-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, zIndex: 1, pointerEvents: "none" }}></i>
              <input className="search-input" placeholder="Search grades…" readOnly style={{ cursor: "pointer" }} />
            </div>

            {/* Page header */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>Academic</p>
              <h1 style={{ margin: "2px 0 2px", fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-.3px" }}>Grades</h1>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                {courses.length} course{courses.length !== 1 ? "s" : ""} enrolled
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10 }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ color: "#ef4444", marginTop: 2 }}></i>
                <div>
                  <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 600, color: "#dc2626" }}>Could not load grades</p>
                  <button onClick={() => window.location.reload()}
                    style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Retry
                  </button>
                </div>
              </div>
            )}

            {loading && <SkeletonGrades />}

            {!loading && !error && (
              <>
                {/* GWA Banner */}
                <GWABanner
                  gpa={displayedGPA}
                  gradedCount={gradedDisplayed}
                  totalCount={displayedCourses.length}
                  semesterLabel={gwaSemLabel}
                />

                {/* Pending essay notice */}
                <PendingEssayBanner count={pendingEssayCount} />

                {/* New grades alert */}
                {hasNewGrades && (
                  <div className="fade-up" style={{
                    background: "#f0fdf4", border: "1px solid #86efac",
                    borderRadius: 12, padding: "12px 16px",
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 16
                  }}>
                    <i className="bi bi-patch-check-fill" style={{ color: "#22c55e", fontSize: 20, flexShrink: 0 }}></i>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#14532d" }}>
                        New grade{(notifications ?? []).filter(n => (n.type === "results_updated" || n.type === "score_updated") && !n.is_read).length > 1 ? "s" : ""} released!
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#166534" }}>
                        Your instructor finished grading. Check the results below.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Semester Filter Tabs ── */}
                <div className="filter-track" style={{ marginBottom: 18 }}>
                  {SEMESTER_TABS.map(tab => {
                    const count = semesterCounts[tab.key] ?? 0;
                    if (tab.key !== "all" && count === 0) return null;
                    return (
                      <button
                        key={tab.key}
                        className={`filter-tab${semesterTab === tab.key ? " active" : ""}`}
                        onClick={() => setSemesterTab(tab.key)}
                      >
                        {tab.label}
                        {tab.key !== "all" && count > 0 && (
                          <span style={{
                            marginLeft: 5,
                            background: semesterTab === tab.key ? "#0056b3" : "#e2e8f0",
                            color: semesterTab === tab.key ? "#fff" : "#64748b",
                            borderRadius: 99, padding: "0 6px", fontSize: 10, fontWeight: 700
                          }}>{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Course list */}
                {displayedCourses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 24px", color: "#94a3b8" }}>
                    <i className="bi bi-journal-x" style={{ fontSize: 42, display: "block", marginBottom: 12, opacity: .4 }}></i>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#64748b" }}>
                      {semesterTab === "all" ? "No courses enrolled" : `No courses for ${semLabelMap[semesterTab]}`}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {displayedCourses.map((course) => (
                      <div
                        key={course.course_id}
                        id={`course-${course.course_id}`}
                        style={{
                          outline: highlightId === course.course_id ? "2px solid #0056b3" : "none",
                          borderRadius: 14,
                          transition: "outline .3s",
                        }}
                        onAnimationEnd={() => {
                          if (highlightId === course.course_id) setHighlightId(null);
                        }}
                      >
                        <CourseSection course={course} highlightQuery={highlightId === course.course_id} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        <BottomNav active="Grades" />
      </div>
    </>
  );
};

export default GradesPage;