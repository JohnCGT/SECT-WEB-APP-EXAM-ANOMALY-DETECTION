import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../lib/api";

/* ─── Design tokens ─── */
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
    --card-sh:   0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,86,179,.06);
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

  /* ── Filter segmented control ── */
  .filter-bar {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0;
    background: #f1f5f9;
    border-radius: 12px;
    padding: 3px;
    width: 100%;
  }
  .filter-seg {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1px; padding: 7px 4px; border-radius: 9px; border: none;
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
    color: #94a3b8; background: transparent; cursor: pointer;
    transition: background .15s, color .15s, box-shadow .15s;
    line-height: 1.2; min-width: 0;
  }
  .filter-seg i { font-size: 13px; }
  .filter-seg:hover:not(.active) { color: #64748b; background: rgba(255,255,255,.6); }
  .filter-seg.active {
    background: #fff; color: #0056b3;
    box-shadow: 0 1px 4px rgba(0,0,0,.10), 0 0 0 1px rgba(0,86,179,.10);
  }

  /* Exam card — list style */
  .exam-card {
    background: #fff;
    border: 1px solid rgba(0,86,179,.07);
    border-radius: 12px;
    overflow: hidden;
    transition: box-shadow .18s, border-color .18s, transform .18s;
  }
  .exam-card:hover {
    box-shadow: 0 4px 20px rgba(0,86,179,.11);
    border-color: rgba(0,86,179,.16);
    transform: translateY(-1px);
  }

  /* Urgent pulse */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: .55; }
  }
  .pulse { animation: pulse 2s ease infinite; }

  /* Progress bar */
  .prog-track { height: 4px; border-radius: 99px; background: #eef2ff; overflow: hidden; }
  .prog-fill  { height: 100%; border-radius: 99px; transition: width 1s cubic-bezier(.4,0,.2,1); }

  /* Fade up */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .3s ease both; }

  /* Section label */
  .section-label {
    font-size: 11px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: .07em;
    margin: 0 0 10px; display: flex; align-items: center; gap: 8px;
  }
  .section-label::after {
    content: ''; flex: 1; height: 1px; background: rgba(0,86,179,.07);
  }

  /* Stats pill */
  .stat-pill {
    display: flex; align-items: center; gap: 8px;
    background: var(--bg,#e8f0fe); border-radius: 10px;
    padding: 8px 14px; min-width: 80px;
  }

  /* Bottom nav */
  .bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0; height: 64px;
    background: rgba(255,255,255,0.95);
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
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .shimmer-block {
    border-radius: 10px;
    background: linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }

  /* Exam search overlay */
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

const NAV_ITEMS = [
  { to: "/student",                  icon: "bi-speedometer2",     label: "Home"     },
  { to: "/student/subjects",         icon: "bi-journal-bookmark", label: "Subjects" },
  { to: "/student/exams",            icon: "bi-pencil-square",    label: "Exams"    },
  { to: "/student/grades",           icon: "bi-graph-up-arrow",   label: "Grades"   },
  { to: "/student/account-settings", icon: "bi-gear",             label: "Settings" },
];

/* ─── Notification type config ─── */
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

/* ─── Status helpers ─── */
const STATUS_META = {
  submitted: { color: "#22c55e", bg: "#f0fdf4", label: "Submitted",   icon: "bi-check-circle-fill",   borderColor: "#86efac" },
  open:      { color: "#0056b3", bg: "#e8f0fe", label: "Open Now",    icon: "bi-pencil-square",        borderColor: "#93c5fd" },
  upcoming:  { color: "#f59e0b", bg: "#fff7ed", label: "Upcoming",    icon: "bi-clock",                borderColor: "#fcd34d" },
  ended:     { color: "#94a3b8", bg: "#f1f5f9", label: "Ended",       icon: "bi-lock-fill",            borderColor: "#e2e8f0" },
};

const getStatus = (exam) => {
  if (exam.submission?.status === "submitted") return "submitted";
  const now = new Date();
  if (new Date(exam.end_time)   < now) return "ended";
  if (new Date(exam.start_time) > now) return "upcoming";
  return "open";
};

const formatDate = (d) => new Date(d).toLocaleString("en-PH", {
  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
});

const timeLeft = (end) => {
  const diff = new Date(end) - new Date();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
};

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

const TABS = [
  { key: "all",       label: "All",   icon: "bi-grid-3x2-gap" },
  { key: "open",      label: "Open",  icon: "bi-pencil-square" },
  { key: "upcoming",  label: "Soon",  icon: "bi-clock"         },
  { key: "submitted", label: "Done",  icon: "bi-check-circle"  },
  { key: "ended",     label: "Ended", icon: "bi-lock"          },
];

/* ─── Sub-components ─── */
const BottomNav = ({ active }) => (
  <nav className="bottom-nav d-lg-none">
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={active === label ? "active" : ""}>
        <i className={`bi ${icon}`}></i>{label}
      </Link>
    ))}
  </nav>
);

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

const EmptyState = ({ icon, title, subtitle }) => (
  <div style={{ textAlign: "center", padding: "48px 24px", color: "#94a3b8" }}>
    <i className={`bi ${icon}`} style={{ fontSize: 42, display: "block", marginBottom: 14, opacity: .4 }}></i>
    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#64748b" }}>{title}</p>
    {subtitle && <p style={{ margin: "5px 0 0", fontSize: 13 }}>{subtitle}</p>}
  </div>
);

/* ─────────────────────────────────────────────
   NOTIFICATION DROPDOWN
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
                style={{ cursor: n.url || n.type ? "pointer" : "default" }}
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
   EXAM SEARCH OVERLAY
───────────────────────────────────────────── */
const ExamSearchOverlay = ({ exams, onClose, onSelectExam }) => {
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
    return exams.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.course?.name  || e.course_name  || "").toLowerCase().includes(q) ||
      (e.course?.code  || e.course_code  || "").toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, exams]);

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
            placeholder="Search your exams…"
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
              <i className="bi bi-pencil-square" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: .4 }}></i>
              <span style={{ fontSize: 13 }}>Start typing to search your exams…</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div style={{ padding: "28px 18px", textAlign: "center", color: "#94a3b8" }}>
              <i className="bi bi-emoji-frown" style={{ fontSize: 24, display: "block", marginBottom: 8 }}></i>
              <span style={{ fontSize: 13 }}>No exams match "<strong>{query}</strong>"</span>
            </div>
          ) : suggestions.map((exam, i) => {
            const status = getStatus(exam);
            const st     = STATUS_META[status];
            return (
              <div
                key={exam.id}
                onClick={() => onSelectExam(exam)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", cursor: "pointer",
                  borderBottom: i < suggestions.length - 1 ? "1px solid #f8faff" : "none",
                  transition: "background .12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={`bi ${st.icon}`} style={{ color: st.color, fontSize: 16 }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {exam.title}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                    {exam.course?.code ?? exam.course_code ?? ""}
                    {(exam.course?.name ?? exam.course_name) ? ` · ${exam.course?.name ?? exam.course_name}` : ""}
                  </p>
                </div>
                <span style={{ background: st.bg, color: st.color, borderRadius: 99, padding: "2px 9px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   TOPBAR
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

      <div
        className="d-none d-md-flex align-items-center ms-4 position-relative"
        style={{ maxWidth: 300 }}
        onClick={onSearchBarClick}
      >
        <i className="bi bi-search" style={{ position: "absolute", left: 12, color: "#94a3b8", fontSize: 13, zIndex: 1, pointerEvents: "none" }}></i>
        <input className="search-input" placeholder="Search exams…" readOnly style={{ cursor: "pointer", width: 220 }} />
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

/* ─── Exam Row Card ─── */
const ExamCard = ({ exam, idx }) => {
  const status    = getStatus(exam);
  const st        = STATUS_META[status];
  const isOpen    = status === "open";
  const isDone    = status === "submitted";
  const remaining = isOpen ? timeLeft(exam.end_time) : null;
  const pct       = isDone && exam.submission?.total_points > 0
    ? Math.round((exam.submission.score / exam.submission.total_points) * 100) : null;

  return (
    <div
      className="exam-card fade-up"
      style={{ animationDelay: `${idx * 0.04}s`, borderLeft: `4px solid ${st.borderColor}` }}
    >
      <div style={{ padding: "14px 16px" }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: st.bg, color: st.color,
            borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700
          }}>
            <i className={`bi ${st.icon}`} style={{ fontSize: 10 }}></i>
            {st.label}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: "#0056b3",
            background: "#e8f0fe", borderRadius: 99, padding: "2px 8px"
          }}>
            {exam.course?.code ?? exam.course_code ?? ""}
          </span>
          {remaining && (
            <span className="pulse" style={{
              fontSize: 10, fontWeight: 700, color: "#ef4444",
              background: "#fef2f2", borderRadius: 99, padding: "2px 8px",
              display: "inline-flex", alignItems: "center", gap: 4
            }}>
              <i className="bi bi-alarm-fill" style={{ fontSize: 9 }}></i>{remaining}
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>
            {exam.course?.name ?? exam.course_name ?? ""}
          </span>
        </div>

        {/* Title */}
        <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
          {exam.title}
        </h3>

        {/* Metadata row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: isDone ? 10 : 12 }}>
          {[
            { icon: "bi-list-check", val: `${exam.questions_count} questions` },
            { icon: "bi-stopwatch",  val: `${exam.duration_minutes} min`       },
            { icon: "bi-award",      val: `${exam.total_points} pts`           },
          ].map(m => (
            <span key={m.val} style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
              <i className={`bi ${m.icon}`} style={{ color: "#94a3b8" }}></i>{m.val}
            </span>
          ))}
          <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
            <i className="bi bi-calendar3" style={{ color: "#94a3b8" }}></i>
            {formatDate(exam.start_time)}
          </span>
        </div>

        {/* Score bar if submitted */}
        {isDone && pct !== null && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Your Score</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1e293b" }}>
                {exam.submission.score}/{exam.submission.total_points} ({pct}%)
              </span>
            </div>
            <div className="prog-track">
              <div className="prog-fill" style={{ width: `${pct}%`, background: "#64748b" }} />
            </div>
          </div>
        )}

        {/* CTA */}
        {isOpen && (
          <Link to={`/student/exams/${exam.id}/take`} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "#0056b3", color: "#fff",
            borderRadius: 9, padding: "10px 16px",
            fontSize: 13, fontWeight: 700, textDecoration: "none",
            transition: "opacity .15s", width: "100%"
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <i className="bi bi-pencil-square"></i>Take Exam Now
          </Link>
        )}
        {isDone && (
          <Link to={`/student/exams/${exam.id}/results`} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "#f0fdf4", color: "#22c55e", border: "1px solid #bbf7d0",
            borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 700,
            textDecoration: "none", transition: "background .15s", width: "100%"
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#dcfce7"}
            onMouseLeave={e => e.currentTarget.style.background = "#f0fdf4"}
          >
            <i className="bi bi-bar-chart"></i>View Results
          </Link>
        )}
        {!isOpen && !isDone && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "#f8faff", color: "#94a3b8",
            border: "1px solid #e2e8f0", borderRadius: 9, padding: "10px 16px",
            fontSize: 13, fontWeight: 600
          }}>
            {status === "upcoming"
              ? <><i className="bi bi-clock"></i>Opens {formatDate(exam.start_time)}</>
              : <><i className="bi bi-lock"></i>Exam Closed</>}
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   EXAMS PAGE
══════════════════════════════════════ */
const ExamsPage = () => {
  const navigate = useNavigate();
  const [user, setUser]             = useState(null);
  const [exams, setExams]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const notifBtnRef                 = useRef(null);

  /* ── Notification state ── */
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState(null);
  const [unreadCount, setUnreadCount]     = useState(0);

  /* ── Data ── */
  useEffect(() => {
    (async () => {
      try {
        const [uRes, eRes] = await Promise.all([
          API.get("/me"),
          API.get("/student/exams"),
        ]);
        setUser(uRes.data.user);
        setExams(eRes.data.exams || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Notifications ── */
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

    if (notif.url || notif.type) {
      setNotifOpen(false);

      if (notif.type === "new_subject") {
        navigate("/student/subjects");
        return;
      }
      if (notif.type === "new_exam") {
        navigate(notif.url ? `${notif.url}/take` : "/student/exams");
        return;
      }
      if (notif.url) navigate(notif.url);
    }
  };

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/");
  };

  /* When user picks an exam from the search overlay */
  const handleSearchSelect = (exam) => {
    setSearchOpen(false);
    const status = getStatus(exam);
    if (status === "open")           navigate(`/student/exams/${exam.id}/take`);
    else if (status === "submitted") navigate(`/student/exams/${exam.id}/results`);
    else {
      setActiveTab(status);
      setSearchTerm(exam.title);
    }
  };

  const counts = useMemo(() => ({
    all:       exams.length,
    open:      exams.filter(e => getStatus(e) === "open").length,
    upcoming:  exams.filter(e => getStatus(e) === "upcoming").length,
    submitted: exams.filter(e => getStatus(e) === "submitted").length,
    ended:     exams.filter(e => getStatus(e) === "ended").length,
  }), [exams]);

  const filtered = useMemo(() => {
    let list = [...exams];
    if (activeTab !== "all") list = list.filter(e => getStatus(e) === activeTab);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.course?.name  || e.course_name  || "").toLowerCase().includes(q) ||
        (e.course?.code  || e.course_code  || "").toLowerCase().includes(q) ||
        (e.description   || "").toLowerCase().includes(q)
      );
    }
    const ORDER = { open: 0, upcoming: 1, submitted: 2, ended: 3 };
    list.sort((a, b) => ORDER[getStatus(a)] - ORDER[getStatus(b)]);
    return list;
  }, [exams, activeTab, searchTerm]);

  // Grouped for "all" tab
  const grouped = useMemo(() => {
    if (activeTab !== "all" || searchTerm.trim()) return null;
    const groups = { open: [], upcoming: [], submitted: [], ended: [] };
    exams.forEach(e => groups[getStatus(e)].push(e));
    return groups;
  }, [exams, activeTab, searchTerm]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f4fb" }}>
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  const SECTION_LABELS = {
    open:      { label: "Open Now — Action Required", color: "#0056b3" },
    upcoming:  { label: "Coming Up",                  color: "#f59e0b" },
    submitted: { label: "Submitted",                   color: "#22c55e" },
    ended:     { label: "Ended",                       color: "#94a3b8" },
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {searchOpen && (
        <ExamSearchOverlay
          exams={exams}
          onClose={() => setSearchOpen(false)}
          onSelectExam={handleSearchSelect}
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
          <Sidebar active="Exams" />

          <main style={{ flex: 1, padding: "20px 16px", paddingBottom: 88, minWidth: 0 }}>

            {/* Mobile search bar */}
            <div className="d-md-none mb-3 position-relative" onClick={() => setSearchOpen(true)}>
              <i className="bi bi-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, zIndex: 1, pointerEvents: "none" }}></i>
              <input className="search-input" placeholder="Search exams…" readOnly style={{ cursor: "pointer" }} />
            </div>

            {/* Page header */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>Academic</p>
              <h1 style={{ margin: "2px 0 2px", fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-.3px" }}>My Exams</h1>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                {counts.all} exam{counts.all !== 1 ? "s" : ""} across all enrolled subjects
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10 }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ color: "#ef4444", marginTop: 2 }}></i>
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "#dc2626" }}>Could not load exams</p>
                  <button onClick={() => window.location.reload()}
                    style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Retry
                  </button>
                </div>
              </div>
            )}

            {!error && (
              <>
                {/* Stats strip */}
                {counts.all > 0 && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto", paddingBottom: 2 }}>
                    {[
                      { label: "Open",      val: counts.open,      color: "#0056b3", bg: "#e8f0fe" },
                      { label: "Upcoming",  val: counts.upcoming,  color: "#f59e0b", bg: "#fff7ed" },
                      { label: "Submitted", val: counts.submitted, color: "#22c55e", bg: "#f0fdf4" },
                      { label: "Ended",     val: counts.ended,     color: "#94a3b8", bg: "#f1f5f9" },
                    ].map(s => (
                      <div key={s.label} className="stat-pill" style={{ "--bg": s.bg }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: s.color, opacity: .75 }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Open Now alert banner */}
                {counts.open > 0 && (activeTab === "all" || activeTab === "open") && !searchTerm && (
                  <div style={{
                    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                    border: "1px solid #93c5fd",
                    borderRadius: 12, padding: "12px 16px",
                    display: "flex", alignItems: "center", gap: 12,
                    marginBottom: 18
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", background: "#0056b3",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      <i className="bi bi-pencil-square" style={{ color: "#fff", fontSize: 16 }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e3a5f" }}>
                        {counts.open} exam{counts.open !== 1 ? "s are" : " is"} open right now!
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#3b82f6" }}>
                        Scroll down or tap "Open" to see them.
                      </p>
                    </div>
                    {activeTab !== "open" && (
                      <button onClick={() => setActiveTab("open")} style={{
                        background: "#0056b3", color: "#fff", border: "none",
                        borderRadius: 8, padding: "6px 12px", fontSize: 11,
                        fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0
                      }}>
                        Go to Open
                      </button>
                    )}
                  </div>
                )}

                {/* Filter segmented control */}
                <div className="filter-bar" style={{ marginBottom: 18 }}>
                  {TABS.map(tab => {
                    const count    = tab.key === "all" ? counts.all : counts[tab.key];
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        className={`filter-seg${isActive ? " active" : ""}`}
                        onClick={() => { setActiveTab(tab.key); setSearchTerm(""); }}
                        title={
                          tab.key === "upcoming"  ? "Upcoming"  :
                          tab.key === "submitted" ? "Submitted" : undefined
                        }
                      >
                        <i className={`bi ${tab.icon}`}></i>
                        <span>{tab.label}</span>
                        {count > 0 && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, lineHeight: 1,
                            background: isActive ? "#e8f0fe" : "rgba(0,0,0,.06)",
                            color: isActive ? "#0056b3" : "#94a3b8",
                            borderRadius: 99, padding: "1px 5px",
                          }}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Grouped view (only on "all" tab with no search) */}
                {grouped && counts.all > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {(["open", "upcoming", "submitted", "ended"]).map(key => {
                      if (grouped[key].length === 0) return null;
                      const sec = SECTION_LABELS[key];
                      return (
                        <div key={key}>
                          <p className="section-label" style={{ color: sec.color }}>
                            {sec.label}
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {grouped[key].map((exam, i) => (
                              <ExamCard key={exam.id} exam={exam} idx={i} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  filtered.length === 0 ? (
                    <EmptyState
                      icon="bi-file-earmark-x"
                      title={searchTerm ? "No exams match your search" : `No ${activeTab === "all" ? "" : (TABS.find(t => t.key === activeTab)?.label ?? activeTab) + " "}exams`}
                      subtitle={searchTerm ? "Try a different keyword" : activeTab === "all" ? "Your instructor hasn't published any exams yet." : undefined}
                    />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filtered.map((exam, i) => (
                        <ExamCard key={exam.id} exam={exam} idx={i} />
                      ))}
                    </div>
                  )
                )}

                {counts.all === 0 && !error && (
                  <EmptyState
                    icon="bi-journal-x"
                    title="No exams yet"
                    subtitle="Your instructors haven't published any exams yet."
                  />
                )}
              </>
            )}
          </main>
        </div>

        <BottomNav active="Exams" />
      </div>
    </>
  );
};

export default ExamsPage;