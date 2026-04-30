// src/pages/instructor/InstructorSupport.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import InstructorAlertBell from "../../components/InstructorAlertBell";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{--blue:#0056b3;--blue-lite:#e8f0fe;--slate:#64748b;--slate-lt:#94a3b8;--card-bg:#fff;--card-br:16px;--card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);}
  .dash-card{background:var(--card-bg);border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);overflow:hidden;transition:box-shadow .2s,transform .2s;}
  .dash-card:hover{box-shadow:0 2px 6px rgba(0,0,0,.06),0 8px 28px rgba(0,86,179,.10);}
  .glass-sidebar{background:rgba(255,255,255,0.60);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);}
  .nav-pill{display:flex;flex-direction:column;align-items:center;padding:10px 8px;border-radius:12px;gap:4px;font-size:11px;font-weight:600;text-decoration:none;color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;}
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .topbar{background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:100;height:56px;}
  .avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  .skeleton{background:linear-gradient(90deg,#f1f5f9 25%,#e8f0fe 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .stat-chip{flex:1;min-width:120px;background:#fff;border-radius:var(--card-br);box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);padding:16px 18px;}
  .form-field{width:100%;border:1.5px solid rgba(0,86,179,.15);border-radius:10px;padding:9px 14px;font-size:13px;font-family:'DM Sans',sans-serif;color:#1e293b;outline:none;background:#f8faff;transition:border-color .2s,box-shadow .2s;}
  .form-field:focus{border-color:#0056b3;box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .form-field.is-invalid{border-color:#ef4444;}
  .form-label{font-size:12px;font-weight:600;color:#374151;margin-bottom:6px;display:block;}
  .btn-primary-dash{display:inline-flex;align-items:center;gap:8px;background:#0056b3;color:#fff;border:none;border-radius:10px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .15s;}
  .btn-primary-dash:hover{opacity:.87;}
  .btn-primary-dash:disabled{opacity:.6;cursor:not-allowed;}
  .btn-outline-dash{display:inline-flex;align-items:center;gap:8px;background:transparent;color:#0056b3;border:1.5px solid rgba(0,86,179,.25);border-radius:10px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s,border-color .15s;}
  .btn-outline-dash:hover{background:var(--blue-lite);border-color:#0056b3;}
  .ticket-row{padding:14px 20px;border-bottom:1px solid #f1f5f9;transition:background .15s;cursor:default;}
  .ticket-row:last-child{border-bottom:none;}
  .ticket-row:hover{background:#f8faff;}
  .status-pill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}
  .back-btn{display:inline-flex;align-items:center;gap:6px;background:#f8faff;border:1.5px solid rgba(0,86,179,.15);border-radius:10px;padding:6px 14px;font-size:13px;font-weight:600;color:#0056b3;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:none;transition:background .15s;}
  .back-btn:hover{background:var(--blue-lite);}
  .toast-float{position:fixed;bottom:24px;right:24px;z-index:9999;min-width:280px;padding:14px 18px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.15);animation:fadeUp .3s ease;}
  .bottom-nav{position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-top:1px solid rgba(0,86,179,.10);display:flex;align-items:stretch;z-index:1030;box-shadow:0 -4px 24px rgba(0,86,179,.08);}
  .bottom-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:600;gap:3px;text-decoration:none;transition:color .2s;}
  .bottom-nav-item i{font-size:19px;}
  @media(max-width:991px){.main-content{padding:16px 12px 88px!important;}}
  @media(max-width:767px){.form-row{flex-direction:column!important;}.stats-row{flex-wrap:wrap!important;}}
`;

const NAV_ITEMS = [
  { to: "/instructor",                  icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/instructor/courses",          icon: "bi-book",                 label: "Courses"   },
  { to: "/instructor/exams",            icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/instructor/students",         icon: "bi-people",               label: "Students"  },
  { to: "/instructor/alerts",           icon: "bi-exclamation-triangle", label: "Alerts"    },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

const CATEGORY_OPTIONS = [
  { value: "technical",  label: "Technical Issue" },
  { value: "exam_issue", label: "Exam Issue"       },
  { value: "account",    label: "Account"          },
  { value: "grading",    label: "Grading"          },
  { value: "other",      label: "Other"            },
];

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Low"    },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High"   },
];

const STATUS_STYLES = {
  open:        { bg: "#e8f0fe", color: "#0056b3", label: "Open"        },
  in_progress: { bg: "#fff7ed", color: "#c2410c", label: "In Progress" },
  resolved:    { bg: "#f0fdf4", color: "#15803d", label: "Resolved"    },
  closed:      { bg: "#f1f5f9", color: "#64748b", label: "Closed"      },
};

const PRIORITY_STYLES = {
  low:    { bg: "#f0fdf4", color: "#15803d", label: "Low"    },
  medium: { bg: "#fff7ed", color: "#c2410c", label: "Medium" },
  high:   { bg: "#fef2f2", color: "#dc2626", label: "High"   },
};

export default function InstructorSupport() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user,     setUser]     = useState(null);
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState("list");
  const [selected, setSelected] = useState(null);
  const [toast,    setToast]    = useState(null);
  const [saving,   setSaving]   = useState(false);

  const [form,   setForm]   = useState({ subject: "", message: "", category: "technical", priority: "low" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    API.get("/me").then(r => setUser(r.data.user)).catch(() => {});
    loadTickets();
  }, []);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/support/tickets");
      setTickets(res.data?.data ?? res.data ?? []);
    } catch {
      notify("Failed to load tickets.", "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3800);
  };

  const setField = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.subject.trim()) e.subject = "Subject is required.";
    if (!form.message.trim()) e.message = "Message is required.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/instructor/login");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await API.post("/support/tickets", form);
      notify("Ticket submitted! Our admin team will respond shortly.");
      setForm({ subject: "", message: "", category: "technical", priority: "low" });
      setErrors({});
      setView("list");
      loadTickets();
    } catch (err) {
      notify(err.response?.data?.message ?? "Failed to submit ticket.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async ticket => {
    try {
      const res = await API.get(`/support/tickets/${ticket.id}`);
      setSelected(res.data?.ticket ?? ticket);
    } catch {
      setSelected(ticket);
    }
    setView("detail");
  };

  const counts = {
    all:         tickets.length,
    open:        tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved:    tickets.filter(t => t.status === "resolved").length,
  };

  const isActive  = to => to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "I";
  const firstName = user?.name?.split(" ")[0] ?? "Instructor";

  const STAT_CHIPS = [
    { label: "All Tickets",  value: counts.all,         color: "#0056b3", bg: "#e8f0fe" },
    { label: "Open",         value: counts.open,        color: "#c2410c", bg: "#fff7ed" },
    { label: "In Progress",  value: counts.in_progress, color: "#1d4ed8", bg: "#eff6ff" },
    { label: "Resolved",     value: counts.resolved,    color: "#15803d", bg: "#f0fdf4" },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* Toast */}
        {toast && (
          <div className="toast-float" style={{
            background: toast.type === "danger" ? "#fef2f2" : "#f0fdf4",
            color:      toast.type === "danger" ? "#dc2626" : "#15803d",
            border:     `1px solid ${toast.type === "danger" ? "#fecaca" : "#bbf7d0"}`,
          }}>
            <i className={`bi bi-${toast.type === "danger" ? "x-circle" : "check-circle"} me-2`}></i>
            {toast.msg}
            <button onClick={() => setToast(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "inherit" }}>✕</button>
          </div>
        )}

        {/* Topbar */}
        <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>SECT Instructor</span>
          <div className="ms-auto d-flex align-items-center gap-2">
            <InstructorAlertBell />
            <div className="dropdown">
              <button className="d-flex align-items-center gap-2 dropdown-toggle" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }} data-bs-toggle="dropdown">
                <div className="avatar">{initial}</div>
                <span className="d-none d-sm-inline" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{firstName}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
                <li><Link className="dropdown-item" to="/instructor/account-settings"><i className="bi bi-gear me-2"></i>Account Settings</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile"><i className="bi bi-person me-2"></i>Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout} style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}><i className="bi bi-box-arrow-right me-2"></i>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-stretch">
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
          <main className="main-content" style={{ flex: 1, padding: "24px 20px", paddingBottom: 100, minWidth: 0 }}>

            {/* ── LIST VIEW ── */}
            {view === "list" && (
              <>
                <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>🎧 Support Center</h1>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Submit and track your support requests</p>
                  </div>
                  <button className="btn-primary-dash" onClick={() => setView("new")}>
                    <i className="bi bi-plus-lg"></i>New Ticket
                  </button>
                </div>

                {/* Stat chips */}
                <div className="stats-row fade-up" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                  {STAT_CHIPS.map(({ label, value, color, bg }) => (
                    <div key={label} className="stat-chip">
                      <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</p>
                      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Tickets card */}
                <div className="dash-card fade-up">
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                      <i className="bi bi-ticket-perforated me-2" style={{ color: "#0056b3" }}></i>My Tickets
                    </h2>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</span>
                  </div>

                  {loading ? (
                    <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
                    </div>
                  ) : tickets.length === 0 ? (
                    <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
                      <i className="bi bi-headset" style={{ fontSize: 36, display: "block", marginBottom: 10, opacity: .3 }}></i>
                      <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#64748b" }}>No tickets yet</p>
                      <button className="btn-primary-dash" onClick={() => setView("new")}><i className="bi bi-plus-lg"></i>Submit your first request</button>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "#f8faff", borderBottom: "1px solid #f1f5f9" }}>
                            {["#","Subject","Category","Priority","Status","Submitted",""].map(h => (
                              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", textTransform: "uppercase" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((t, i) => {
                            const ss  = STATUS_STYLES[t.status]    ?? { bg: "#f1f5f9", color: "#64748b", label: t.status };
                            const ps  = PRIORITY_STYLES[t.priority] ?? { bg: "#f1f5f9", color: "#64748b", label: t.priority };
                            const cat = CATEGORY_OPTIONS.find(c => c.value === t.category)?.label ?? t.category;
                            return (
                              <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>{i + 1}</td>
                                <td style={{ padding: "12px 16px" }}>
                                  <p style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>{t.subject}</p>
                                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{t.message?.slice(0, 60)}{t.message?.length > 60 ? "…" : ""}</p>
                                </td>
                                <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{cat}</td>
                                <td style={{ padding: "12px 16px" }}>
                                  <span className="status-pill" style={{ background: ps.bg, color: ps.color }}>{ps.label}</span>
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                  <span className="status-pill" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                                </td>
                                <td style={{ padding: "12px 16px", fontSize: 11, color: "#94a3b8" }}>
                                  {t.created_at ? new Date(t.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                  <button className="btn-outline-dash" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => openDetail(t)}>
                                    <i className="bi bi-eye"></i>View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── NEW TICKET VIEW ── */}
            {view === "new" && (
              <>
                <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                  <button className="back-btn" onClick={() => { setView("list"); setErrors({}); }}>
                    <i className="bi bi-arrow-left"></i>Back
                  </button>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>New Support Ticket</h1>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Describe your issue and we'll get back to you shortly</p>
                  </div>
                </div>

                <div className="dash-card fade-up" style={{ maxWidth: 680, padding: 28 }}>
                  <form onSubmit={handleSubmit} noValidate>
                    <div style={{ marginBottom: 16 }}>
                      <label className="form-label">Subject <span style={{ color: "#ef4444" }}>*</span></label>
                      <input className={`form-field${errors.subject ? " is-invalid" : ""}`} type="text"
                        placeholder="Brief summary of your issue" maxLength={255}
                        value={form.subject} onChange={setField("subject")} />
                      {errors.subject && <p style={{ margin: "5px 0 0", fontSize: 11, color: "#ef4444" }}>{errors.subject}</p>}
                    </div>

                    <div className="form-row" style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Category</label>
                        <select className="form-field" value={form.category} onChange={setField("category")}>
                          {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Priority</label>
                        <select className="form-field" value={form.priority} onChange={setField("priority")}>
                          {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <p style={{ margin: "5px 0 0", fontSize: 11, color: "#94a3b8" }}>Use <strong>High</strong> only for urgent issues that block exam access.</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label className="form-label">Message <span style={{ color: "#ef4444" }}>*</span></label>
                      <textarea className={`form-field${errors.message ? " is-invalid" : ""}`} rows={6}
                        placeholder="Describe your issue in detail. Include any steps to reproduce, error messages, or relevant exam/course information."
                        maxLength={5000} value={form.message} onChange={setField("message")}
                        style={{ resize: "vertical" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        {errors.message
                          ? <span style={{ fontSize: 11, color: "#ef4444" }}>{errors.message}</span>
                          : <span style={{ fontSize: 11, color: "#94a3b8" }}>Be as detailed as possible</span>}
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{form.message.length} / 5000</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                      <button type="button" className="btn-outline-dash" onClick={() => { setView("list"); setErrors({}); }}>Cancel</button>
                      <button type="submit" className="btn-primary-dash" disabled={saving}>
                        {saving ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }}></span>Submitting…</> : <><i className="bi bi-send"></i>Submit Ticket</>}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}

            {/* ── DETAIL VIEW ── */}
            {view === "detail" && selected && (
              <>
                <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                  <button className="back-btn" onClick={() => setView("list")}><i className="bi bi-arrow-left"></i>Back to Tickets</button>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Ticket #{selected.id}</h1>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                      Submitted {selected.created_at ? new Date(selected.created_at).toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </p>
                  </div>
                </div>

                <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Ticket info */}
                  <div className="dash-card fade-up" style={{ padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{selected.subject}</h2>
                      <div style={{ display: "flex", gap: 6 }}>
                        {STATUS_STYLES[selected.status] && (
                          <span className="status-pill" style={{ background: STATUS_STYLES[selected.status].bg, color: STATUS_STYLES[selected.status].color }}>
                            {STATUS_STYLES[selected.status].label}
                          </span>
                        )}
                        {PRIORITY_STYLES[selected.priority] && (
                          <span className="status-pill" style={{ background: PRIORITY_STYLES[selected.priority].bg, color: PRIORITY_STYLES[selected.priority].color }}>
                            {PRIORITY_STYLES[selected.priority].label}
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: "0 0 14px", fontSize: 12, color: "#94a3b8" }}>
                      <i className="bi bi-tag me-1"></i>{CATEGORY_OPTIONS.find(c => c.value === selected.category)?.label ?? selected.category}
                    </p>
                    <hr style={{ borderColor: "#f1f5f9", margin: "0 0 14px" }} />
                    <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{selected.message}</p>
                  </div>

                  {/* Admin response */}
                  <div className="dash-card fade-up" style={{ padding: 24 }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                      <i className="bi bi-chat-text me-2" style={{ color: "#0056b3" }}></i>Admin Response
                    </h3>
                    {selected.admin_response ? (
                      <div style={{ padding: "14px 16px", borderRadius: 10, background: "#e8f0fe", border: "1px solid rgba(0,86,179,.15)" }}>
                        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#1e293b", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{selected.admin_response}</p>
                        {selected.responded_at && (
                          <span style={{ fontSize: 11, color: "#64748b" }}>
                            Responded on {new Date(selected.responded_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: "28px 0", textAlign: "center", color: "#94a3b8" }}>
                        <i className="bi bi-hourglass-split" style={{ fontSize: 28, display: "block", marginBottom: 8, color: "#f59e0b" }}></i>
                        <p style={{ margin: 0, fontSize: 13 }}>Your ticket is being reviewed. We'll respond as soon as possible.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>

        {/* Bottom Nav */}
        <nav className="bottom-nav d-lg-none">
          {NAV_ITEMS.slice(0, 5).map(({ to, icon, label }) => (
            <Link key={to} to={to} className="bottom-nav-item"
              style={{ color: isActive(to) ? "#0056b3" : "#94a3b8", borderTop: isActive(to) ? "2px solid #0056b3" : "2px solid transparent" }}>
              <i className={`bi ${icon}`}></i>{label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}