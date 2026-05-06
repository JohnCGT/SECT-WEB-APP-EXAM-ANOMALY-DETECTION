import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";

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

  /* Topbar */
  .topbar {
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(0,86,179,.08);
    position: sticky; top: 0; z-index: 200;
    height: 56px;
  }

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
    color: var(--slate); transition: background .15s, color .15s, transform .15s;
    width: 100%;
  }
  .nav-pill:hover  { background: var(--blue-lite); color: var(--blue); transform: translateY(-1px); }
  .nav-pill.active { background: var(--blue); color: #fff; box-shadow: 0 4px 14px rgba(0,86,179,.35); }
  .nav-pill i { font-size: 18px; }

  /* Search */
  .search-input {
    border: 1px solid rgba(0,86,179,.15); border-radius: 10px;
    background: #f8faff; padding: 8px 14px 8px 36px;
    font-size: 13px; color: #1e293b; outline: none;
    font-family: 'DM Sans', sans-serif;
    transition: border-color .2s, box-shadow .2s; width: 100%;
  }
  .search-input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(0,86,179,.10);
    background: #fff;
  }

  .avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: var(--blue); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; flex-shrink: 0;
  }

  /* Subject list row */
  .subject-row {
    background: #fff;
    border: 1px solid rgba(0,86,179,.07);
    border-radius: 12px;
    padding: 14px 16px;
    display: flex; align-items: center; gap: 14px;
    cursor: pointer;
    transition: box-shadow .18s, border-color .18s, transform .18s;
    text-decoration: none; color: inherit;
  }
  .subject-row:hover {
    box-shadow: 0 4px 20px rgba(0,86,179,.11);
    border-color: rgba(0,86,179,.18);
    transform: translateY(-1px);
  }
  .subject-row.active-row {
    border-color: var(--blue);
    box-shadow: 0 0 0 2px rgba(0,86,179,.18), 0 4px 20px rgba(0,86,179,.10);
  }

  /* Detail panel */
  .detail-panel {
    background: #fff;
    border: 1px solid rgba(0,86,179,.09);
    border-radius: 16px;
    box-shadow: 0 4px 32px rgba(0,86,179,.10);
    overflow: hidden;
    position: sticky;
    top: 72px;
  }

  /* Drawer (mobile) */
  .drawer-backdrop {
    position: fixed; inset: 0; background: rgba(15,23,42,.35);
    backdrop-filter: blur(2px); z-index: 300;
    animation: fadeIn .2s ease;
  }
  .drawer {
    position: fixed; bottom: 0; left: 0; right: 0;
    background: #fff; border-radius: 20px 20px 0 0;
    z-index: 301; max-height: 85vh; overflow-y: auto;
    animation: slideUp .28s cubic-bezier(.32,1,.45,1);
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }

  /* Progress bar */
  .prog-track { height: 5px; border-radius: 99px; background: #eef2ff; overflow: hidden; }
  .prog-fill  { height: 100%; border-radius: 99px; transition: width 1s cubic-bezier(.4,0,.2,1); }

  /* Fade-up */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .3s ease both; }

  /* Sort dropdown */
  .sort-btn {
    border: 1px solid rgba(0,86,179,.15); border-radius: 10px;
    background: #f8faff; padding: 7px 12px;
    font-size: 12px; font-weight: 600; color: var(--slate);
    cursor: pointer; display: flex; align-items: center; gap: 5px;
    font-family: 'DM Sans', sans-serif; white-space: nowrap;
    transition: border-color .2s, background .2s;
  }
  .sort-btn:hover { border-color: var(--blue); background: #fff; }

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

  /* ── Notification dropdown (improved) ── */
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
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .shimmer-block {
    border-radius: 10px;
    background: linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }

  /* Scrollbar subtle */
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

const CARD_ACCENTS = [
  { bg: "#eef2ff", iconColor: "#0056b3" },
  { bg: "#fff7ed", iconColor: "#f59e0b" },
  { bg: "#fdf2f8", iconColor: "#ec4899" },
  { bg: "#f0fdf4", iconColor: "#22c55e" },
  { bg: "#fef9c3", iconColor: "#ca8a04" },
  { bg: "#f0f9ff", iconColor: "#0ea5e9" },
];

const SUBJECT_ICON = "bi-book-half";

const hashId = (id) => {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};
const getAccent = (id) => CARD_ACCENTS[hashId(id) % CARD_ACCENTS.length];

const SORT_OPTIONS = [
  { value: "name-asc",   label: "Name A–Z"     },
  { value: "name-desc",  label: "Name Z–A"     },
  { value: "exams-desc", label: "Most Exams"   },
  { value: "exams-asc",  label: "Fewest Exams" },
  { value: "code-asc",   label: "Course Code"  },
];

/* ─── Notification type config ─── */
/*
  Supported types:
    new_exam        → new exam posted by instructor
    new_subject     → student enrolled in a new subject/course
    results_updated → exam results are now visible
    score_updated   → instructor finished grading essays; score updated
*/
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

/* ─── Helpers ─── */
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 992);
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isDesktop;
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

/* ─── BottomNav ─── */
const BottomNav = ({ active }) => (
  <nav className="bottom-nav d-lg-none">
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={active === label ? "active" : ""}>
        <i className={`bi ${icon}`}></i>{label}
      </Link>
    ))}
  </nav>
);

/* ─── Sidebar ─── */
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

/* ─────────────────────────────────────────────
   NOTIFICATION DROPDOWN (improved design)
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
          {notifications.map((n, idx) => {
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
   SUBJECT SEARCH OVERLAY
───────────────────────────────────────────── */
const SubjectSearchOverlay = ({ courses, onClose, onSelectCourse }) => {
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
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.instructor?.name || "").toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, courses]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      paddingTop: 80, animation: "fadeUp .15s ease both",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{
        width: "min(560px, calc(100vw - 32px))", background: "#fff", borderRadius: 18,
        boxShadow: "0 24px 80px rgba(0,86,179,.18), 0 4px 16px rgba(0,0,0,.08)",
        border: "1px solid rgba(0,86,179,.10)", overflow: "hidden",
      }}>
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
          <i className="bi bi-search" style={{ color: "#0056b3", fontSize: 16, flexShrink: 0 }}></i>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search your subjects…"
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
              <i className="bi bi-book-half" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: .5 }}></i>
              <span style={{ fontSize: 13 }}>Start typing to find your enrolled subjects…</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div style={{ padding: "28px 18px", textAlign: "center", color: "#94a3b8" }}>
              <i className="bi bi-emoji-frown" style={{ fontSize: 24, display: "block", marginBottom: 8 }}></i>
              <span style={{ fontSize: 13 }}>No subjects match "<strong>{query}</strong>"</span>
            </div>
          ) : suggestions.map((c, i) => {
            const acc = getAccent(courses.findIndex(x => x.id === c.id));
            return (
              <div
                key={c.id}
                onClick={() => onSelectCourse(c)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", cursor: "pointer",
                  borderBottom: i < suggestions.length - 1 ? "1px solid #f8faff" : "none",
                  transition: "background .12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: acc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={`bi ${SUBJECT_ICON}`} style={{ color: acc.iconColor, fontSize: 16 }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                    {c.code}{c.instructor?.name ? ` · ${c.instructor.name}` : ""}
                    {` · ${c.exams?.length || 0} exam${(c.exams?.length || 0) !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <i className="bi bi-arrow-right" style={{ color: "#94a3b8", fontSize: 13, flexShrink: 0 }}></i>
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

      {/* Desktop: clickable search that opens overlay */}
      <div className="d-none d-md-flex align-items-center ms-4 position-relative" style={{ maxWidth: 300 }} onClick={onSearchBarClick}>
        <i className="bi bi-search" style={{ position: "absolute", left: 12, color: "#94a3b8", fontSize: 13, zIndex: 1, pointerEvents: "none" }}></i>
        <input className="search-input" placeholder="Search subjects…" readOnly style={{ cursor: "pointer", width: 220 }} />
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

/* ─── Subject Detail Panel ─── */
const SubjectDetail = ({ course, accentIdx, onClose }) => {
  const acc       = getAccent(accentIdx);
  const examCount = course.exams?.length || 0;

  return (
    <div>
      {/* Banner */}
      <div style={{ background: acc.bg, padding: "28px 24px 20px", position: "relative" }}>
        {onClose && (
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(255,255,255,.8)", border: "none",
            width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, color: "#64748b"
          }}>
            <i className="bi bi-x"></i>
          </button>
        )}
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,.09)", marginBottom: 12
        }}>
          <i className={`bi ${SUBJECT_ICON}`} style={{ fontSize: 24, color: acc.iconColor }}></i>
        </div>
        <div style={{
          display: "inline-block", background: acc.iconColor, color: "#fff",
          borderRadius: 99, padding: "2px 10px", fontSize: 10, fontWeight: 700,
          marginBottom: 8
        }}>{course.code}</div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
          {course.name}
        </h2>
        {course.semester && (
          <p style={{ margin: "4px 0 0", fontSize: 12, color: acc.iconColor, fontWeight: 600, opacity: .8 }}>
            {course.semester}
          </p>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px" }}>
        {/* Instructor */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#f8faff", borderRadius: 10, padding: "10px 14px", marginBottom: 16
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: acc.bg,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <i className="bi bi-person-fill" style={{ fontSize: 14, color: acc.iconColor }}></i>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>Instructor</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
              {course.instructor?.name || "Not assigned"}
            </p>
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>About</p>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{course.description}</p>
          </div>
        )}

        {/* Stats — exams count only */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#f8faff", borderRadius: 10,
            border: "1px solid rgba(0,86,179,.07)", padding: "10px 16px",
          }}>
            <i className="bi bi-pencil-square" style={{ fontSize: 18, color: acc.iconColor }}></i>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{examCount}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>
                Exam{examCount !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Exams list preview */}
        {course.exams?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>Exams in this subject</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {course.exams.slice(0, 4).map(exam => {
                const now    = new Date();
                const isOpen = new Date(exam.start_time) <= now && new Date(exam.end_time) >= now;
                const done   = exam.submission?.status === "submitted";
                const tag    = done    ? { label: "Done",     color: "#22c55e", bg: "#f0fdf4" }
                             : isOpen  ? { label: "Open",     color: "#0056b3", bg: "#e8f0fe" }
                             :           { label: "Upcoming", color: "#f59e0b", bg: "#fff7ed" };
                return (
                  <div key={exam.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "#f8faff", borderRadius: 8, padding: "8px 12px",
                    border: "1px solid rgba(0,86,179,.06)"
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{exam.title}</span>
                    <span style={{ background: tag.bg, color: tag.color, borderRadius: 99, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>
                      {tag.label}
                    </span>
                  </div>
                );
              })}
              {course.exams.length > 4 && (
                <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", textAlign: "center", paddingTop: 2 }}>
                  +{course.exams.length - 4} more exam{course.exams.length - 4 !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link to={`/student/courses/${course.id}/exams`} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          background: acc.iconColor, color: "#fff",
          borderRadius: 10, padding: "12px",
          fontSize: 13, fontWeight: 700, textDecoration: "none",
          transition: "opacity .15s"
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          View All Exams <i className="bi bi-arrow-right"></i>
        </Link>
      </div>
    </div>
  );
};

/* ─── Empty State ─── */
const EmptyState = ({ icon, title, subtitle }) => (
  <div style={{ textAlign: "center", padding: "64px 24px", color: "#94a3b8" }}>
    <i className={`bi ${icon}`} style={{ fontSize: 48, display: "block", marginBottom: 16, opacity: .5 }}></i>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#64748b" }}>{title}</p>
    {subtitle && <p style={{ margin: "6px 0 0", fontSize: 13 }}>{subtitle}</p>}
  </div>
);

/* ══════════════════════════════════════
   SUBJECT PAGE
══════════════════════════════════════ */
const SubjectPage = () => {
  const navigate          = useNavigate();
  const isDesktop         = useIsDesktop();
  const [user, setUser]   = useState(null);
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [searchTerm, setSearchTerm]     = useState("");
  const [sortBy, setSortBy]             = useState("name-asc");
  const [selectedId, setSelectedId]     = useState(null);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const sortRef     = useRef(null);
  const notifBtnRef = useRef(null);

  /* ── Notification state ── */
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState(null);
  const [unreadCount, setUnreadCount]     = useState(0);

  /* ── Data ── */
  useEffect(() => {
    (async () => {
      try {
        const [uRes, cRes] = await Promise.all([API.get("/me"), API.get("/student/courses")]);
        setUser(uRes.data.user);
        const list = cRes.data.courses || [];
        setCourses(list);
        if (list.length > 0 && window.innerWidth >= 992) setSelectedId(list[0].id);
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
    if (notif.url) {
      setNotifOpen(false);
      let finalUrl = notif.url;
      if (notif.type === "new_exam")         finalUrl = `${notif.url}/take`;
      // else if (notif.type === "results_updated") finalUrl = `${notif.url}/results`;
      // else if (notif.type === "score_updated")   finalUrl = `${notif.url}/results`;
      else if (notif.type === "new_subject")     finalUrl = "/student/subjects";
      navigate(finalUrl);
    }
  };

  /* ── Close sort dropdown on outside click ── */
  useEffect(() => {
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/");
  };

  const handleRowClick = (courseId) => {
    setSelectedId(courseId);
    if (!isDesktop) setDrawerOpen(true);
  };

  const handleSearchSelect = (course) => {
    setSearchOpen(false);
    setSelectedId(course.id);
    if (!isDesktop) setDrawerOpen(true);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sortedFiltered = useMemo(() => {
    let list = [...courses];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.instructor?.name || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === "name-asc")   return a.name.localeCompare(b.name);
      if (sortBy === "name-desc")  return b.name.localeCompare(a.name);
      if (sortBy === "exams-desc") return (b.exams?.length || 0) - (a.exams?.length || 0);
      if (sortBy === "exams-asc")  return (a.exams?.length || 0) - (b.exams?.length || 0);
      if (sortBy === "code-asc")   return a.code.localeCompare(b.code);
      return 0;
    });
    return list;
  }, [courses, searchTerm, sortBy]);

  const selectedCourse    = courses.find(c => c.id === selectedId);
  const selectedAccentIdx = courses.findIndex(c => c.id === selectedId);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f4fb" }}>
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {searchOpen && (
        <SubjectSearchOverlay
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
          <Sidebar active="Subjects" />

          <main style={{ flex: 1, padding: "20px 16px", paddingBottom: 88, minWidth: 0 }}>

            {/* Mobile search bar — opens overlay */}
            <div className="d-md-none mb-3 position-relative" onClick={() => setSearchOpen(true)}>
              <i className="bi bi-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, zIndex: 1, pointerEvents: "none" }}></i>
              <input className="search-input" placeholder="Search subjects…" readOnly style={{ cursor: "pointer" }} />
            </div>

            {/* Page header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>Academic</p>
                <h1 style={{ margin: "2px 0 2px", fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-.3px" }}>My Subjects</h1>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                  {courses.length} course{courses.length !== 1 ? "s" : ""} this semester
                </p>
              </div>
              {/* Sort control */}
              <div ref={sortRef} style={{ position: "relative" }}>
                <button className="sort-btn" onClick={() => setShowSortMenu(s => !s)}>
                  <i className="bi bi-sort-alpha-down"></i>
                  {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                  <i className={`bi bi-chevron-${showSortMenu ? "up" : "down"}`} style={{ fontSize: 10 }}></i>
                </button>
                {showSortMenu && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                    background: "#fff", border: "1px solid rgba(0,86,179,.12)", borderRadius: 10,
                    boxShadow: "0 4px 20px rgba(0,0,0,.10)", overflow: "hidden", minWidth: 155
                  }}>
                    {SORT_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => { setSortBy(o.value); setShowSortMenu(false); }}
                        style={{
                          display: "block", width: "100%", background: sortBy === o.value ? "#e8f0fe" : "transparent",
                          border: "none", padding: "9px 14px", fontSize: 12, fontWeight: 600,
                          color: sortBy === o.value ? "#0056b3" : "#64748b",
                          cursor: "pointer", textAlign: "left", fontFamily: "inherit"
                        }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10 }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ color: "#ef4444", marginTop: 2 }}></i>
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "#dc2626" }}>Could not load courses</p>
                  <button onClick={() => window.location.reload()}
                    style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Two-column layout */}
            {!error && (
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

                {/* Subject list */}
                <div style={{ flex: "0 0 auto", width: isDesktop ? 340 : "100%" }}>
                  {sortedFiltered.length === 0 ? (
                    <EmptyState
                      icon="bi-journal-x"
                      title={searchTerm ? "No subjects match" : "No courses enrolled"}
                      subtitle={searchTerm ? "Try a different keyword" : "Contact your instructor to be enrolled."}
                    />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {sortedFiltered.map((course, i) => {
                        const acc       = getAccent(courses.findIndex(c => c.id === course.id));
                        const examCount = course.exams?.length || 0;
                        const isActive  = selectedId === course.id && isDesktop;
                        return (
                          <div
                            key={course.id}
                            className={`subject-row fade-up${isActive ? " active-row" : ""}`}
                            style={{ animationDelay: `${i * 0.04}s` }}
                            onClick={() => handleRowClick(course.id)}
                          >
                            <div style={{
                              width: 42, height: 42, borderRadius: 11, background: acc.bg,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0
                            }}>
                              <i className={`bi ${SUBJECT_ICON}`} style={{ fontSize: 18, color: acc.iconColor }}></i>
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {course.name}
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: acc.iconColor, background: acc.bg, borderRadius: 99, padding: "1px 7px" }}>
                                  {course.code}
                                </span>
                                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                  {examCount} exam{examCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>

                            <i className="bi bi-chevron-right" style={{ fontSize: 12, color: isActive ? "#0056b3" : "#d1d5db", flexShrink: 0 }}></i>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Desktop detail panel */}
                {isDesktop && selectedCourse && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="detail-panel">
                      <SubjectDetail course={selectedCourse} accentIdx={selectedAccentIdx} onClose={null} />
                    </div>
                  </div>
                )}

                {isDesktop && !selectedCourse && sortedFiltered.length > 0 && (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <EmptyState icon="bi-hand-index" title="Select a subject" subtitle="Click a subject on the left to see details." />
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Mobile bottom drawer */}
        {!isDesktop && drawerOpen && selectedCourse && (
          <>
            <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
            <div className="drawer">
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
                <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e2e8f0" }}></div>
              </div>
              <SubjectDetail
                course={selectedCourse}
                accentIdx={selectedAccentIdx}
                onClose={() => setDrawerOpen(false)}
              />
            </div>
          </>
        )}

        <BottomNav active="Subjects" />
      </div>
    </>
  );
};

export default SubjectPage;