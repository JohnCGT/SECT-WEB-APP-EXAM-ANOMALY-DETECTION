// src/pages/admin/ExamManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{
    --blue:#0056b3;--blue-mid:#1a6ed8;--blue-lite:#e8f0fe;
    --slate:#64748b;--slate-lt:#94a3b8;
    --card-bg:#ffffff;--card-br:16px;
    --card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);
    --danger:#dc3545;--warn:#fd7e14;--green:#16a34a;
  }
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;}
  .glass-sidebar{background:rgba(255,255,255,0.60);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);}
  .nav-pill{display:flex;flex-direction:column;align-items:center;padding:10px 8px;border-radius:12px;gap:4px;font-size:11px;font-weight:600;text-decoration:none;color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;}
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .topbar{background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:200;height:56px;display:flex;align-items:center;padding:0 20px;gap:12px;}
  .dash-avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  .dash-search{border:1px solid rgba(0,86,179,.15);border-radius:10px;background:#f8faff;padding:7px 14px 7px 36px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif;width:100%;transition:border-color .2s,box-shadow .2s;}
  .dash-search:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .skeleton{background:linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .dash-btn-primary{background:var(--blue);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:opacity .15s,transform .15s;text-decoration:none;}
  .dash-btn-primary:hover{opacity:.87;transform:translateY(-1px);color:#fff;}
  .dash-btn-ghost{background:#fff;border:1px solid rgba(0,86,179,.15);color:#64748b;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:all .15s;text-decoration:none;}
  .dash-btn-ghost:hover{background:#f1f5f9;color:#1e293b;}
  .badge-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;flex-shrink:0;}
  .dash-table{width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif;}
  .dash-table th{padding:10px 14px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.06em;white-space:nowrap;border-bottom:1px solid #f1f5f9;text-align:left;background:#f8faff;}
  .dash-table td{padding:12px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle;}
  .dash-table tbody tr{transition:background .15s;}
  .dash-table tbody tr:hover{background:#f8faff;}
  .dash-table tbody tr:last-child td{border-bottom:none;}
  .filter-chip{
    border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:8px;
    cursor:pointer;border:2px solid transparent;flex:1;min-width:100px;
    transition:border-color .15s,box-shadow .15s,transform .15s;background:#f8faff;
  }
  .filter-chip:hover{transform:translateY(-1px);}
  .filter-chip.selected{border-color:currentColor;box-shadow:0 4px 14px rgba(0,86,179,.10);}
  .action-btn-sm{
    border:none;border-radius:8px;padding:5px 13px;font-size:12px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:5px;
    transition:all .15s;white-space:nowrap;
  }
  .action-btn-sm:hover{opacity:.85;transform:translateY(-1px);}
  .action-btn-sm:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .exam-card{background:#fff;border-radius:14px;border:1px solid rgba(0,86,179,.06);box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden;margin-bottom:8px;}
  .admin-bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,0.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,0.08);}
  .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bnav-item i{font-size:19px;}
  .page-btn{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,86,179,.15);background:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;color:#64748b;padding:0 6px;}
  .page-btn:hover{background:var(--blue-lite);border-color:var(--blue);color:var(--blue);}
  .page-btn.active{background:var(--blue);border-color:var(--blue);color:#fff;}
  .page-btn:disabled{opacity:.4;cursor:not-allowed;}
  /* confirm modal */
  .modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);backdrop-filter:blur(4px);z-index:1055;display:flex;align-items:center;justify-content:center;padding:16px;}
  .modal-box{background:#fff;border-radius:20px;width:100%;max-width:420px;box-shadow:0 24px 64px rgba(0,0,0,.18);overflow:hidden;animation:fadeUp .25s ease;}
  .modal-hdr{padding:20px 22px 14px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:flex-start;}
  .modal-body{padding:16px 22px 20px;}
  .modal-ftr{padding:12px 22px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;}
  @media(max-width:991px){.hide-md{display:none!important;}}
  @media(max-width:767px){
    .hide-mobile{display:none!important;}
    .dash-table td,.dash-table th{padding:8px 10px;font-size:12px;}
    .filter-chip{min-width:calc(50% - 5px);}
  }
  @media(max-width:480px){.filter-chip{min-width:calc(50% - 5px);}}
`;

const NAV_ITEMS = [
  { to: "/admin",           icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/admin/users",     icon: "bi-people",               label: "Users"     },
  { to: "/admin/courses",   icon: "bi-book",                 label: "Courses"   },
  { to: "/admin/exams",     icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/admin/anomalies", icon: "bi-exclamation-triangle", label: "Anomalies" },
  { to: "/admin/support",   icon: "bi-headset",              label: "Support"   },
];
const BOTTOM_NAV = [
  { to: "/admin",         icon: "bi-speedometer2",      label: "Home"    },
  { to: "/admin/users",   icon: "bi-people",            label: "Users"   },
  { to: "/admin/courses", icon: "bi-book",              label: "Courses" },
  { to: "/admin/exams",   icon: "bi-file-earmark-text", label: "Exams"   },
  { to: "/admin/support", icon: "bi-headset",           label: "Support" },
];

const BASE = import.meta?.env?.VITE_API_URL ?? "/api";
async function api(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" },
    credentials: "include",
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? "Request failed.");
  return json;
}

const PER_PAGE = 15;

const STATUS_CFG = {
  active:    { bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e", label: "Active"    },
  scheduled: { bg: "#eff6ff", color: "#1a6ed8", dot: "#3b82f6", label: "Scheduled" },
  draft:     { bg: "#e8f0fe", color: "#0056b3", dot: "#0056b3", label: "Draft"     },
  completed: { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8", label: "Completed" },
};

const TYPE_CFG = {
  midterm: { bg: "#e8f0fe", color: "#0056b3"  },
  final:   { bg: "#fff0f0", color: "#dc3545"  },
  quiz:    { bg: "#f0fdf4", color: "#16a34a"  },
  prelim:  { bg: "#fff8f0", color: "#fd7e14"  },
};

function StatusPill({ status }) {
  const s = STATUS_CFG[status?.toLowerCase()] ?? { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8", label: status };
  return (
    <span className="badge-pill" style={{ background: s.bg, color: s.color }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }}></span>
      {s.label}
    </span>
  );
}

function TypePill({ type }) {
  const s = TYPE_CFG[type?.toLowerCase()] ?? { bg: "#f1f5f9", color: "#64748b" };
  return <span className="badge-pill" style={{ background: s.bg, color: s.color }}>{type}</span>;
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3800); return () => clearTimeout(t); }, [onDone]);
  const isErr = type === "error";
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: isErr ? "#fff0f0" : "#f0fdf4",
      color: isErr ? "#dc3545" : "#16a34a",
      padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 8px 32px rgba(0,0,0,.14)",
      border: `1px solid ${isErr ? "#fecaca" : "#bbf7d0"}`,
      fontFamily: "'DM Sans', sans-serif",
      animation: "fadeUp .25s ease",
    }}>
      <i className={`bi ${isErr ? "bi-x-circle-fill" : "bi-check-circle-fill"}`}></i>
      {msg}
    </div>
  );
}

function ConfirmModal({ title, body, confirmLabel, variant, onConfirm, onClose, busy }) {
  const variantStyles = {
    danger:  { bg: "#dc3545", hover: "#bb2d3b" },
    warn:    { bg: "#fd7e14", hover: "#e86c00" },
    primary: { bg: "#0056b3", hover: "#004494" },
  };
  const vs = variantStyles[variant] ?? variantStyles.primary;
  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div>
            <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</h5>
          </div>
          <button onClick={onClose} disabled={busy}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8", padding: 4, lineHeight: 1 }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-body">
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{body}</p>
        </div>
        <div className="modal-ftr">
          <button className="dash-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            className="dash-btn-primary"
            style={{ background: vs.bg }}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy
              ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: "0.75rem", height: "0.75rem" }} />Working…</>
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ total, page, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);
  const visible = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
      <button className="page-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <i className="bi bi-chevron-left" style={{ fontSize: 11 }}></i>
      </button>
      {visible.map((p, idx) => {
        const prev = visible[idx - 1];
        return (
          <React.Fragment key={p}>
            {prev && p - prev > 1 && <span style={{ color: "#94a3b8", fontSize: 13 }}>…</span>}
            <button className={`page-btn ${p === page ? "active" : ""}`} onClick={() => onChange(p)}>{p}</button>
          </React.Fragment>
        );
      })}
      <button className="page-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        <i className="bi bi-chevron-right" style={{ fontSize: 11 }}></i>
      </button>
      <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
      </span>
    </div>
  );
}

export default function ExamManagement() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user,         setUser]         = useState(null);
  const [exams,        setExams]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search,       setSearch]       = useState("");
  const [modal,        setModal]        = useState(null);
  const [busy,         setBusy]         = useState(false);
  const [toast,        setToast]        = useState(null);
  const [page,         setPage]         = useState(1);

  const notify   = (msg, type = "success") => setToast({ msg, type });
  const closeModal = () => setModal(null);
  const isActive  = (to) => to === "/admin" ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = async () => {
    try { await api("POST", "/logout"); } catch {}
    navigate("/");
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, meRes] = await Promise.all([
        api("GET", "/admin/exams"),
        api("GET", "/me").catch(() => ({ user: null })),
      ]);
      setExams(res.data ?? (Array.isArray(res) ? res : []));
      setUser(meRes.user);
    } catch (err) { notify(err.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async () => {
    const exam = modal.exam;
    const newStatus = exam.status === "active" ? "draft" : "active";
    setBusy(true);
    setExams(e => e.map(x => x.id === exam.id ? { ...x, status: newStatus } : x));
    try {
      await api("PATCH", `/admin/exams/${exam.id}/status`, { status: newStatus });
      notify(`Exam ${newStatus === "active" ? "enabled" : "disabled"} successfully.`);
      closeModal();
    } catch (err) {
      setExams(e => e.map(x => x.id === exam.id ? { ...x, status: exam.status } : x));
      notify(err.message, "error");
    } finally { setBusy(false); }
  };

  const handleReset = async () => {
    const { id, title } = modal.exam;
    setBusy(true);
    try {
      await api("DELETE", `/admin/exams/${id}/sessions`);
      notify(`Sessions reset for "${title}".`);
      closeModal();
      load();
    } catch (err) { notify(err.message, "error"); }
    finally { setBusy(false); }
  };

  const filtered = exams.filter(e => {
    const q  = search.toLowerCase();
    const ok = !q || e.title?.toLowerCase().includes(q) || e.course?.name?.toLowerCase().includes(q) || e.course?.code?.toLowerCase().includes(q);
    return ok && (statusFilter === "all" || e.status?.toLowerCase() === statusFilter);
  });

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    all:       exams.length,
    active:    exams.filter(e => e.status === "active").length,
    scheduled: exams.filter(e => e.status === "scheduled").length,
    draft:     exams.filter(e => e.status === "draft").length,
    completed: exams.filter(e => e.status === "completed").length,
  };

  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "A";
  const firstName = user?.name?.split(" ")[0] ?? "Admin";

  const STATUS_CHIPS = [
    { key: "all",       label: "All",       value: counts.all,       color: "#0056b3", bg: "#e8f0fe", icon: "bi-file-earmark-text"  },
    { key: "active",    label: "Active",    value: counts.active,    color: "#16a34a", bg: "#f0fdf4", icon: "bi-play-circle"         },
    { key: "scheduled", label: "Scheduled", value: counts.scheduled, color: "#1a6ed8", bg: "#eff6ff", icon: "bi-calendar-event"      },
    { key: "draft",     label: "Draft",     value: counts.draft,     color: "#0056b3", bg: "#e8f0fe", icon: "bi-pencil-square"       },
    { key: "completed", label: "Completed", value: counts.completed, color: "#64748b", bg: "#f1f5f9", icon: "bi-check-circle"        },
  ];

  return (
    <>
      <style>{SHARED_CSS}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* Topbar */}
        <div className="topbar">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
            SECT Admin
          </span>
          <div className="hide-mobile" style={{ flex: 1, maxWidth: 380, position: "relative" }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13 }}></i>
            <input className="dash-search" placeholder="Search exams…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <NotificationBell />
            <div className="dropdown">
              <button className="d-flex align-items-center gap-2 dropdown-toggle"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }}
                data-bs-toggle="dropdown">
                <div className="dash-avatar">{initial}</div>
                <span className="d-none d-sm-inline" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{firstName}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
                <li><Link className="dropdown-item" to="/admin/profile">My Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout}
                  style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="d-flex">
          {/* Sidebar */}
          <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
            style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}>
            {NAV_ITEMS.map(({ to, icon, label }) => (
              <Link key={to} to={to} className={`nav-pill ${isActive(to) ? "active" : ""}`}>
                <i className={`bi ${icon}`}></i>{label}
              </Link>
            ))}
          </nav>

          {/* Main */}
          <main style={{ flex: 1, padding: "20px 16px", paddingBottom: 90, minWidth: 0 }}>

            {/* Mobile search */}
            <div className="d-lg-none mb-3" style={{ position: "relative" }}>
              <i className="bi bi-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, zIndex: 1 }}></i>
              <input className="dash-search" style={{ paddingLeft: 36 }} placeholder="Search exams…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Page header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Admin</p>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px" }}>Exam Management</h1>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Control exam access, sessions and monitoring settings</p>
              </div>
              <button className="dash-btn-ghost" onClick={load} style={{ flexShrink: 0, fontSize: 12, padding: "7px 13px" }}>
                {loading
                  ? <span className="spinner-border spinner-border-sm" style={{ width: "0.75rem", height: "0.75rem" }} />
                  : <><i className="bi bi-arrow-clockwise"></i><span className="d-none d-sm-inline"> Refresh</span></>}
              </button>
            </div>

            {/* Status filter chips */}
            <div className="dash-card fade-up" style={{ padding: "12px", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STATUS_CHIPS.map(({ key, label, value, color, bg, icon }) => {
                  const sel = statusFilter === key;
                  return (
                    <div key={key}
                      className={`filter-chip ${sel ? "selected" : ""}`}
                      style={{ color, background: sel ? bg : "#f8faff" }}
                      onClick={() => setStatusFilter(sel && key !== "all" ? "all" : key)}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className={`bi ${icon}`} style={{ color, fontSize: 13 }}></i>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                        <p style={{ margin: "1px 0 0", fontSize: 10, fontWeight: 600, color, opacity: .75 }}>{label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {(search || statusFilter !== "all") && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{filtered.length} of {exams.length} shown</span>
                  <button className="dash-btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }}
                    onClick={() => { setStatusFilter("all"); setSearch(""); }}>
                    <i className="bi bi-x-circle"></i> Clear
                  </button>
                </div>
              )}
            </div>

            {/* Table card */}
            <div className="dash-card fade-up">
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  <i className="bi bi-file-earmark-text me-2" style={{ color: "#0056b3" }}></i>All Exams
                </h2>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{filtered.length} exam{filtered.length !== 1 ? "s" : ""}</span>
              </div>

              {loading ? (
                <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8" }}>
                  <i className="bi bi-file-earmark-x" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: .3 }}></i>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    {search || statusFilter !== "all" ? "No exams match your filters." : "No exams found."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hide-mobile" style={{ overflowX: "auto" }}>
                    <table className="dash-table">
                      <thead>
                        <tr>
                          {["Exam", "Course", "Type", "Status", "Duration", "Submissions", "Flagged", "Actions"].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.map((exam) => {
                          const isActive = exam.status === "active";
                          return (
                            <tr key={exam.id}>
                              <td>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{exam.title}</p>
                                {exam.start_time && (
                                  <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8" }}>
                                    {new Date(exam.start_time).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                  </p>
                                )}
                              </td>
                              <td>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{exam.course?.code ?? "—"}</p>
                                <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8" }}>{exam.course?.name ?? ""}</p>
                              </td>
                              <td><TypePill type={exam.type} /></td>
                              <td><StatusPill status={exam.status} /></td>
                              <td style={{ fontSize: 12, color: "#64748b" }}>{exam.duration_minutes ? `${exam.duration_minutes}m` : "—"}</td>
                              <td style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{exam.submissions_count ?? "—"}</td>
                              <td>
                                {(exam.flagged_count ?? 0) > 0
                                  ? <span style={{ fontSize: 14, fontWeight: 700, color: "#dc3545" }}>{exam.flagged_count}</span>
                                  : <span style={{ fontSize: 12, color: "#94a3b8" }}>0</span>}
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button className="action-btn-sm"
                                    onClick={() => setModal({ type: "toggle", exam })}
                                    style={{
                                      background: isActive ? "#fff8f0" : "#f0fdf4",
                                      color: isActive ? "#fd7e14" : "#16a34a",
                                    }}>
                                    <i className={`bi ${isActive ? "bi-pause-circle" : "bi-play-circle"}`}></i>
                                    {isActive ? "Disable" : "Enable"}
                                  </button>
                                  <button className="action-btn-sm"
                                    onClick={() => setModal({ type: "reset", exam })}
                                    style={{ background: "#fff0f0", color: "#dc3545" }}>
                                    <i className="bi bi-arrow-counterclockwise"></i> Reset
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="d-lg-none" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {pageData.map(exam => {
                      const isActiveExam = exam.status === "active";
                      return (
                        <div key={exam.id} className="exam-card">
                          <div style={{ padding: "13px 15px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exam.title}</p>
                              <StatusPill status={exam.status} />
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                              <TypePill type={exam.type} />
                              {exam.course?.code && (
                                <span className="badge-pill" style={{ background: "#e8f0fe", color: "#0056b3" }}>{exam.course.code}</span>
                              )}
                              {exam.duration_minutes && (
                                <span className="badge-pill" style={{ background: "#f1f5f9", color: "#64748b" }}>
                                  <i className="bi bi-clock"></i> {exam.duration_minutes}m
                                </span>
                              )}
                              {(exam.flagged_count ?? 0) > 0 && (
                                <span className="badge-pill" style={{ background: "#fff0f0", color: "#dc3545" }}>
                                  <i className="bi bi-flag-fill"></i> {exam.flagged_count} flagged
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button className="action-btn-sm"
                                onClick={() => setModal({ type: "toggle", exam })}
                                style={{ background: isActiveExam ? "#fff8f0" : "#f0fdf4", color: isActiveExam ? "#fd7e14" : "#16a34a" }}>
                                <i className={`bi ${isActiveExam ? "bi-pause-circle" : "bi-play-circle"}`}></i>
                                {isActiveExam ? "Disable" : "Enable"}
                              </button>
                              <button className="action-btn-sm"
                                onClick={() => setModal({ type: "reset", exam })}
                                style={{ background: "#fff0f0", color: "#dc3545" }}>
                                <i className="bi bi-arrow-counterclockwise"></i> Reset Sessions
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage} />
                </>
              )}
            </div>
          </main>
        </div>

        {/* Bottom Nav */}
        <nav className="admin-bottom-nav d-lg-none">
          {BOTTOM_NAV.map(({ to, icon, label }) => (
            <Link key={to} to={to} className="bnav-item"
              style={{ color: isActive(to) ? "#0056b3" : "#94a3b8", borderTop: isActive(to) ? "2px solid #0056b3" : "2px solid transparent" }}>
              <i className={`bi ${icon}`}></i>{label}
            </Link>
          ))}
        </nav>
      </div>

      {modal?.type === "toggle" && (
        <ConfirmModal
          title={modal.exam.status === "active" ? "Disable Exam" : "Enable Exam"}
          body={modal.exam.status === "active"
            ? `Disabling "${modal.exam.title}" will prevent students from starting or continuing it.`
            : `Enabling "${modal.exam.title}" will allow eligible students to access it.`}
          confirmLabel={modal.exam.status === "active" ? "Yes, Disable" : "Yes, Enable"}
          variant={modal.exam.status === "active" ? "warn" : "primary"}
          onConfirm={handleToggleStatus} onClose={closeModal} busy={busy}
        />
      )}
      {modal?.type === "reset" && (
        <ConfirmModal
          title="Reset Exam Sessions"
          body={`This will permanently delete all submissions for "${modal.exam.title}". This action cannot be undone.`}
          confirmLabel="Yes, Reset Sessions"
          variant="danger"
          onConfirm={handleReset} onClose={closeModal} busy={busy}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}