// src/pages/student/StudentSupport.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";

/* ─────────────────────────────────────────────────────────────────────────
   Student Support Center
   Matches the Dashboard.jsx design system exactly:
   - Same DM Sans font + CSS variables
   - Same glassmorphism sidebar (d-none d-lg-flex)
   - Same BottomNav for mobile
   - Same Topbar structure
   - Bento-grid card layout

   API endpoints used:
     POST GET /api/support/tickets  → SupportTicketController@store / myTickets
     GET      /api/support/tickets/{id} → SupportTicketController@myShow
───────────────────────────────────────────────────────────────────────── */

/* ─── Bottom nav (mobile only) ──────────────────────────────────────── */
const BottomNav = ({ active }) => (
  <nav style={{
    position: "fixed", bottom: 0, left: 0, right: 0, height: 64,
    background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)",
    borderTop: "1px solid rgba(0,86,179,0.10)",
    display: "flex", alignItems: "stretch", zIndex: 1030,
    boxShadow: "0 -4px 24px rgba(0,86,179,0.08)",
  }} className="d-lg-none">
    {[
      { to: "/student",                  icon: "bi-speedometer2",    label: "Home"     },
      { to: "/student/subjects",         icon: "bi-journal-bookmark",label: "Subjects" },
      { to: "/student/tasks",            icon: "bi-pencil-square",   label: "Tasks"    },
      { to: "/student/grades",           icon: "bi-graph-up-arrow",  label: "Grades"   },
      { to: "/student/account-settings", icon: "bi-gear",            label: "Settings" },
    ].map(({ to, icon, label }) => (
      <Link key={to} to={to} style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", fontSize: 10, fontWeight: 600, gap: 3,
        textDecoration: "none",
        color: active === label ? "#0056b3" : "#94a3b8",
        transition: "color .2s",
        borderTop: active === label ? "2px solid #0056b3" : "2px solid transparent",
      }}>
        <i className={`bi ${icon}`} style={{ fontSize: 19 }}></i>
        {label}
      </Link>
    ))}
  </nav>
);

/* ─── Config ─────────────────────────────────────────────────────────── */
const CATEGORY_OPTIONS = [
  { value: "technical",  label: "Technical Issue"  },
  { value: "exam_issue", label: "Exam Issue"        },
  { value: "account",    label: "Account"           },
  { value: "grading",    label: "Grading"           },
  { value: "other",      label: "Other"             },
];

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Low — General question"           },
  { value: "medium", label: "Medium — Affecting my work"       },
  { value: "high",   label: "High — Blocking exam access"      },
];

const STATUS_CFG = {
  open:        { color: "#6C63FF", bg: "#EDE9FF", label: "Open",        dot: "#6C63FF" },
  in_progress: { color: "#E65100", bg: "#FFF3E0", label: "In Progress", dot: "#FB8C00" },
  resolved:    { color: "#2E7D32", bg: "#E8F5E9", label: "Resolved",    dot: "#22c55e" },
  closed:      { color: "#546E7A", bg: "#ECEFF1", label: "Closed",      dot: "#90A4AE" },
};

const PRIORITY_CFG = {
  low:    { color: "#2E7D32", bg: "#E8F5E9" },
  medium: { color: "#E65100", bg: "#FFF3E0" },
  high:   { color: "#ef4444", bg: "#FFEBEE" },
};

const CAT_ICON = {
  technical:  "bi-tools",
  exam_issue: "bi-file-earmark-text",
  account:    "bi-person",
  grading:    "bi-pencil",
  other:      "bi-chat-text",
};

/* ─── Main component ─────────────────────────────────────────────────── */
export default function StudentSupport() {
  const navigate = useNavigate();

  const [user,     setUser]     = useState(null);
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState("list");  // "list" | "new" | "detail"
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const [form, setForm] = useState({
    subject: "", message: "", category: "technical", priority: "low",
  });
  const [errors, setErrors] = useState({});

  /* ── Bootstrap user ── */
  useEffect(() => {
    API.get("/me").then(res => setUser(res.data.user)).catch(() => {});
  }, []);

  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "S";
  const firstName = user?.name?.split(" ")[0] ?? "Student";

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/");
  };

  /* ── Load tickets ── */
  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/support/tickets");
      setTickets(res.data?.data ?? res.data ?? []);
    } catch {
      notify("Could not load tickets.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  /* ── Helpers ── */
  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3800);
  };

  const setField = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.subject.trim()) e.subject = "Subject is required.";
    if (!form.message.trim()) e.message = "Please describe your issue.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit new ticket ── */
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await API.post("/support/tickets", form);
      notify("Ticket submitted! We'll get back to you soon.");
      setForm({ subject: "", message: "", category: "technical", priority: "low" });
      setErrors({});
      setView("list");
      loadTickets();
    } catch (err) {
      notify(err.response?.data?.message ?? "Failed to submit.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Open detail ── */
  const openDetail = async (ticket) => {
    try {
      const res = await API.get(`/support/tickets/${ticket.id}`);
      setSelected(res.data?.ticket ?? ticket);
    } catch {
      setSelected(ticket);
    }
    setView("detail");
  };

  /* ── Counts ── */
  const counts = {
    all:      tickets.length,
    open:     tickets.filter(t => t.status === "open").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <>
      {/* ── Same global styles as Dashboard.jsx ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; background: #f0f4fb; font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        :root {
          --blue: #0056b3; --blue-mid: #1a6ed8; --blue-lite: #e8f0fe;
          --slate: #64748b; --slate-lt: #94a3b8;
          --card-bg: #ffffff; --card-br: 16px;
          --card-sh: 0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,86,179,.06);
        }
        .dash-card { background: var(--card-bg); border-radius: var(--card-br); box-shadow: var(--card-sh); border: 1px solid rgba(0,86,179,.06); transition: box-shadow .2s, transform .2s; overflow: hidden; }
        .dash-card:hover { box-shadow: 0 2px 6px rgba(0,0,0,.06), 0 8px 28px rgba(0,86,179,.10); transform: translateY(-1px); }
        .glass-sidebar { background: rgba(255,255,255,0.60); backdrop-filter: blur(20px) saturate(180%); border-right: 1px solid rgba(255,255,255,0.80); box-shadow: 4px 0 24px rgba(0,86,179,.07); }
        .nav-pill { display: flex; flex-direction: column; align-items: center; padding: 10px 8px; border-radius: 12px; gap: 4px; font-size: 11px; font-weight: 600; text-decoration: none; color: var(--slate); transition: background .15s, color .15s, transform .15s; width: 100%; }
        .nav-pill:hover { background: var(--blue-lite); color: var(--blue); transform: translateY(-1px); }
        .nav-pill.active { background: var(--blue); color: #fff; box-shadow: 0 4px 14px rgba(0,86,179,.35); }
        .nav-pill i { font-size: 18px; }
        .topbar { background: rgba(255,255,255,0.80); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(0,86,179,.08); position: sticky; top: 0; z-index: 100; height: 56px; }
        .avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--blue); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
        .search-input { border: 1px solid rgba(0,86,179,.15); border-radius: 10px; background: #f8faff; padding: 7px 14px 7px 36px; font-size: 13px; color: #1e293b; outline: none; font-family: 'DM Sans', sans-serif; width: 220px; transition: border-color .2s, box-shadow .2s; }
        .search-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0,86,179,.10); background: #fff; }
        .sup-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #1e293b; background: #fff; outline: none; transition: border-color .2s, box-shadow .2s; }
        .sup-input:focus { border-color: #0056b3; box-shadow: 0 0 0 3px rgba(0,86,179,.10); }
        .sup-input.error { border-color: #ef4444; }
        .sup-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .15s; border: none; }
        .sup-btn-primary { background: #0056b3; color: #fff; }
        .sup-btn-primary:hover:not(:disabled) { background: #1a6ed8; transform: translateY(-1px); }
        .sup-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
        .sup-btn-ghost { background: #f8faff; color: #64748b; border: 1.5px solid #e2e8f0; }
        .sup-btn-ghost:hover { border-color: #0056b3; color: #0056b3; background: #fff; }
        .ticket-row { padding: 14px 0; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background .12s; }
        .ticket-row:last-child { border-bottom: none; }
        .ticket-row:hover { background: #f8faff; margin: 0 -4px; padding-left: 4px; padding-right: 4px; border-radius: 8px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp .35s ease both; }
        .fade-up:nth-child(1){animation-delay:.04s}
        .fade-up:nth-child(2){animation-delay:.08s}
        .fade-up:nth-child(3){animation-delay:.12s}
        .fade-up:nth-child(4){animation-delay:.16s}
      `}</style>

      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* ── Topbar ── */}
        <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
          <span style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
            SECT Portal
          </span>
          <div className="d-none d-md-flex align-items-center ms-4 position-relative">
            <i className="bi bi-search" style={{ position: "absolute", left: 12, color: "#94a3b8", fontSize: 13 }}></i>
            <input className="search-input" placeholder="Search subjects, exams…" />
          </div>
          <div className="ms-auto d-flex align-items-center gap-2">
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
                  <button className="dropdown-item text-danger" onClick={handleLogout}
                    style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="d-flex align-items-stretch">

          {/* Glassmorphism Sidebar (desktop) */}
          <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
            style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}>
            {[
              { to: "/student",                  icon: "bi-speedometer2",    label: "Home"     },
              { to: "/student/subjects",         icon: "bi-journal-bookmark",label: "Subjects" },
              { to: "/student/tasks",            icon: "bi-pencil-square",   label: "Tasks"    },
              { to: "/student/grades",           icon: "bi-graph-up-arrow",  label: "Grades"   },
              { to: "/student/support",          icon: "bi-headset",         label: "Support"  },
              { to: "/student/account-settings", icon: "bi-gear",            label: "Settings" },
            ].map(({ to, icon, label }) => (
              <Link key={to} to={to} className={`nav-pill${to === "/student/support" ? " active" : ""}`}>
                <i className={`bi ${icon}`}></i>
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Main content ── */}
          <main style={{ flex: 1, padding: "24px 20px", paddingBottom: 100, minWidth: 0 }}>

            {/* Toast */}
            {toast && (
              <div style={{
                position: "fixed", bottom: 80, right: 24, zIndex: 9999,
                background: toast.type === "error" ? "#FFEBEE" : "#E8F5E9",
                color:      toast.type === "error" ? "#ef4444"  : "#2E7D32",
                padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 500,
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "0 6px 30px rgba(0,0,0,.14)", minWidth: 260,
              }}>
                <i className={`bi ${toast.type === "error" ? "bi-x-circle" : "bi-check-circle"}`}></i>
                {toast.msg}
              </div>
            )}

            {/* ── LIST VIEW ── */}
            {view === "list" && (
              <>
                {/* Page header */}
                <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-3">
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Help & Support</p>
                    <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px" }}>
                      Support Center 🎫
                    </h1>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                      Submit requests and track your tickets
                    </p>
                  </div>
                  <button className="sup-btn sup-btn-primary" onClick={() => setView("new")}>
                    <i className="bi bi-plus-lg"></i>New Ticket
                  </button>
                </div>

                {/* Stat chips */}
                <div className="d-flex gap-3 mb-4 flex-wrap">
                  {[
                    { label: "All Tickets", value: counts.all,      color: "#0056b3", bg: "#e8f0fe", icon: "bi-ticket-perforated" },
                    { label: "Open",        value: counts.open,     color: "#6C63FF", bg: "#EDE9FF", icon: "bi-envelope-open"      },
                    { label: "Resolved",    value: counts.resolved, color: "#2E7D32", bg: "#E8F5E9", icon: "bi-check-circle"       },
                  ].map(({ label, value, color, bg, icon }) => (
                    <div key={label} className="dash-card fade-up" style={{ padding: "16px 20px", flex: 1, minWidth: 120 }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</p>
                          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 700, color, letterSpacing: "-1px", lineHeight: 1 }}>{value}</p>
                        </div>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <i className={`bi ${icon}`} style={{ color, fontSize: 16 }}></i>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ticket list */}
                <div className="dash-card fade-up" style={{ padding: 24 }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>My Tickets</h2>
                    <button className="sup-btn sup-btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }} onClick={loadTickets}>
                      <i className="bi bi-arrow-clockwise"></i>Refresh
                    </button>
                  </div>

                  {loading ? (
                    <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
                      <div className="spinner-border" style={{ color: "#0056b3", width: 28, height: 28, borderWidth: 3 }} />
                      <p style={{ margin: "12px 0 0", fontSize: 13 }}>Loading your tickets…</p>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0" }}>
                      <i className="bi bi-headset" style={{ fontSize: 40, color: "#94a3b8", display: "block", marginBottom: 12 }}></i>
                      <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>No tickets yet.</p>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
                        Have an issue? Click <strong>New Ticket</strong> and we'll help you out.
                      </p>
                    </div>
                  ) : (
                    tickets.map((ticket) => {
                      const sc = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
                      const pc = PRIORITY_CFG[ticket.priority] ?? PRIORITY_CFG.low;
                      const catIcon = CAT_ICON[ticket.category] ?? "bi-chat-text";
                      const catLabel = CATEGORY_OPTIONS.find(c => c.value === ticket.category)?.label ?? ticket.category;
                      return (
                        <div key={ticket.id} className="ticket-row" onClick={() => openDetail(ticket)}>
                          <div className="d-flex align-items-start gap-3">
                            {/* Icon */}
                            <div style={{
                              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                              background: "#f0f4fb", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <i className={`bi ${catIcon}`} style={{ color: "#0056b3", fontSize: 16 }}></i>
                            </div>
                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {ticket.subject}
                                  </p>
                                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {catLabel} · {ticket.message?.slice(0, 60)}{ticket.message?.length > 60 ? "…" : ""}
                                  </p>
                                </div>
                                <div className="d-flex gap-2 align-items-center flex-shrink-0">
                                  <span style={{
                                    padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                    background: pc.bg, color: pc.color, textTransform: "capitalize",
                                  }}>{ticket.priority}</span>
                                  <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                    background: sc.bg, color: sc.color,
                                  }}>
                                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot }} />
                                    {sc.label}
                                  </span>
                                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                                    {ticket.created_at
                                      ? new Date(ticket.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })
                                      : ""}
                                  </span>
                                  <i className="bi bi-chevron-right" style={{ color: "#94a3b8", fontSize: 12 }}></i>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* ── NEW TICKET VIEW ── */}
            {view === "new" && (
              <>
                {/* Back + header */}
                <div className="d-flex align-items-center gap-3 mb-4">
                  <button className="sup-btn sup-btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }}
                    onClick={() => { setView("list"); setErrors({}); }}>
                    <i className="bi bi-arrow-left"></i>Back
                  </button>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>New Support Ticket</h1>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Describe your issue and we'll respond as soon as possible</p>
                  </div>
                </div>

                <div style={{ maxWidth: 640 }}>
                  <div className="dash-card" style={{ padding: 28 }}>
                    <form onSubmit={handleSubmit} noValidate>

                      {/* Subject */}
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b",
                          textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
                          Subject <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          className={`sup-input${errors.subject ? " error" : ""}`}
                          value={form.subject}
                          onChange={setField("subject")}
                          placeholder="Brief summary of your issue"
                          maxLength={255}
                        />
                        {errors.subject && (
                          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#ef4444" }}>{errors.subject}</p>
                        )}
                      </div>

                      {/* Category + Priority */}
                      <div className="d-flex gap-3 mb-4 flex-wrap">
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b",
                            textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
                            Category
                          </label>
                          <select className="sup-input" value={form.category} onChange={setField("category")}>
                            {CATEGORY_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b",
                            textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
                            Priority
                          </label>
                          <select className="sup-input" value={form.priority} onChange={setField("priority")}>
                            {PRIORITY_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Message */}
                      <div style={{ marginBottom: 24 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b",
                          textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
                          Message <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <textarea
                          className={`sup-input${errors.message ? " error" : ""}`}
                          rows={6}
                          value={form.message}
                          onChange={setField("message")}
                          placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, or relevant exam/course information."
                          maxLength={5000}
                          style={{ resize: "vertical" }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                          {errors.message
                            ? <p style={{ margin: 0, fontSize: 12, color: "#ef4444" }}>{errors.message}</p>
                            : <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Be as specific as possible</p>}
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{form.message.length} / 5000</span>
                        </div>
                      </div>

                      {/* Info banner */}
                      <div style={{
                        background: "#e8f0fe", border: "1px solid rgba(0,86,179,.15)",
                        borderRadius: 10, padding: "12px 16px", marginBottom: 22,
                        display: "flex", gap: 10, alignItems: "flex-start",
                      }}>
                        <i className="bi bi-info-circle" style={{ color: "#0056b3", fontSize: 15, flexShrink: 0, marginTop: 1 }}></i>
                        <p style={{ margin: 0, fontSize: 13, color: "#0056b3", lineHeight: 1.5 }}>
                          Our admin team typically responds within 24 hours on school days.
                          For urgent exam issues, select <strong>High</strong> priority.
                        </p>
                      </div>

                      <div className="d-flex gap-3 justify-content-end">
                        <button type="button" className="sup-btn sup-btn-ghost"
                          onClick={() => { setView("list"); setErrors({}); }}>
                          Cancel
                        </button>
                        <button type="submit" className="sup-btn sup-btn-primary" disabled={saving}>
                          {saving
                            ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} /> Submitting…</>
                            : <><i className="bi bi-send"></i>Submit Ticket</>}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            )}

            {/* ── DETAIL VIEW ── */}
            {view === "detail" && selected && (
              <>
                <div className="d-flex align-items-center gap-3 mb-4">
                  <button className="sup-btn sup-btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }}
                    onClick={() => setView("list")}>
                    <i className="bi bi-arrow-left"></i>My Tickets
                  </button>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
                      Ticket #{selected.id}
                    </h1>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                      Submitted{" "}
                      {selected.created_at
                        ? new Date(selected.created_at).toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </p>
                  </div>
                </div>

                <div style={{ maxWidth: 640 }}>

                  {/* Ticket body */}
                  <div className="dash-card fade-up" style={{ padding: 24, marginBottom: 16 }}>
                    <div className="d-flex justify-content-between align-items-start mb-3 gap-2 flex-wrap">
                      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                        {selected.subject}
                      </h2>
                      <div className="d-flex gap-2">
                        {(() => {
                          const sc = STATUS_CFG[selected.status] ?? STATUS_CFG.open;
                          return (
                            <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                              padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                              background:sc.bg, color:sc.color }}>
                              <span style={{ width:5, height:5, borderRadius:"50%", background:sc.dot }} />
                              {sc.label}
                            </span>
                          );
                        })()}
                        {(() => {
                          const pc = PRIORITY_CFG[selected.priority] ?? PRIORITY_CFG.low;
                          return (
                            <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                              background:pc.bg, color:pc.color, textTransform:"capitalize" }}>
                              {selected.priority}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <p style={{ margin: "0 0 14px", fontSize: 12, color: "#94a3b8" }}>
                      <i className={`bi ${CAT_ICON[selected.category] ?? "bi-chat-text"} me-1`}></i>
                      {CATEGORY_OPTIONS.find(c => c.value === selected.category)?.label ?? selected.category}
                    </p>

                    <div style={{
                      background: "#f8faff", border: "1px solid #e2e8f0",
                      borderRadius: 10, padding: "14px 16px",
                    }}>
                      <p style={{ margin: 0, fontSize: 14, color: "#1e293b", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {selected.message}
                      </p>
                    </div>
                  </div>

                  {/* Admin response */}
                  <div className="dash-card fade-up" style={{ padding: 24 }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                      <i className="bi bi-chat-dots me-2" style={{ color: "#0056b3" }}></i>
                      Admin Response
                    </h3>

                    {selected.admin_response ? (
                      <div style={{
                        background: "linear-gradient(135deg, #e8f0fe, #f0f4fb)",
                        border: "1px solid rgba(0,86,179,.12)",
                        borderRadius: 12, padding: "16px 18px",
                      }}>
                        <p style={{ margin: 0, fontSize: 14, color: "#1e293b", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                          {selected.admin_response}
                        </p>
                        {selected.responded_at && (
                          <p style={{ margin: "10px 0 0", fontSize: 12, color: "#94a3b8" }}>
                            <i className="bi bi-clock me-1"></i>
                            Responded{" "}
                            {new Date(selected.responded_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "32px 0" }}>
                        <div style={{
                          width: 56, height: 56, borderRadius: "50%",
                          background: "#fff7ed", margin: "0 auto 12px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <i className="bi bi-hourglass-split" style={{ fontSize: 22, color: "#f59e0b" }}></i>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                          Waiting for a response
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
                          Our team is reviewing your ticket. Check back soon!
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </>
            )}

          </main>
        </div>

        <BottomNav active="Support" />
      </div>
    </>
  );
}