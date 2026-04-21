// src/pages/instructor/InstructorSupport.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import InstructorAlertBell from "../../components/InstructorAlertBell";

/* ─── Shared sidebar config ──────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/instructor",                  icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/instructor/courses",          icon: "bi-book",                 label: "Courses"   },
  { to: "/instructor/exams",            icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/instructor/students",         icon: "bi-people",               label: "Students"  },
  { to: "/instructor/alerts",           icon: "bi-exclamation-triangle", label: "Alerts"    },
  // { to: "/instructor/reports",          icon: "bi-bar-chart",            label: "Reports"   },
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

const STATUS_BADGE = {
  open:        { cls: "bg-primary",   label: "Open"        },
  in_progress: { cls: "bg-warning text-dark", label: "In Progress" },
  resolved:    { cls: "bg-success",   label: "Resolved"    },
  closed:      { cls: "bg-secondary", label: "Closed"      },
};

const PRIORITY_BADGE = {
  low:    { cls: "bg-success",          label: "Low"    },
  medium: { cls: "bg-warning text-dark", label: "Medium" },
  high:   { cls: "bg-danger",           label: "High"   },
};

export default function InstructorSupport() {
  const navigate = useNavigate();
  const location = useLocation();

  /* ── State ── */
  const [user,     setUser]     = useState(null);
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState("list");  // "list" | "new" | "detail"
  const [selected, setSelected] = useState(null);
  const [toast,    setToast]    = useState(null);
  const [saving,   setSaving]   = useState(false);

  const [form, setForm] = useState({
    subject: "", message: "", category: "technical", priority: "low",
  });
  const [errors, setErrors] = useState({});

  /* ── Boot ── */
  useEffect(() => {
    API.get("/me").then((r) => setUser(r.data.user)).catch(() => {});
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

  /* ── Helpers ── */
  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3800);
  };

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.subject.trim()) e.subject = "Subject is required.";
    if (!form.message.trim()) e.message = "Message is required.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/");
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
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

  /* ── Detail ── */
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
    all:         tickets.length,
    open:        tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved:    tickets.filter((t) => t.status === "resolved").length,
  };

  const isActive = (to) =>
    to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="d-flex flex-column min-vh-100">

      {/* ── Navbar ── */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold text-primary" href="#">SECT Instructor</a>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <InstructorAlertBell />
            <div className="dropdown">
              <button className="btn btn-light dropdown-toggle fw-bold" type="button" data-bs-toggle="dropdown">
                <i className="bi bi-person-circle me-2"></i>{user?.name || "Instructor"}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><Link className="dropdown-item" to="/instructor/account-settings"><i className="bi bi-gear me-2"></i>Account Settings</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile"><i className="bi bi-person me-2"></i>Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="d-flex flex-grow-1">

        {/* ── Sidebar ── */}
        <nav className="bg-white border-end d-flex flex-column align-items-center py-3" style={{ width: 72, minHeight: "100%" }}>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <Link key={to} to={to}
              className={`nav-link d-flex flex-column align-items-center py-2 px-1 mb-2 rounded ${
                isActive(to) ? "text-primary bg-primary bg-opacity-10 fw-bold" : "text-secondary"
              }`}
              style={{ fontSize: 10, width: 56, textAlign: "center" }} title={label}>
              <i className={`bi ${icon} fs-5 mb-1`}></i>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* ── Main Content ── */}
        <div className="flex-grow-1 p-4 bg-light">

          {/* Toast */}
          {toast && (
            <div
              className={`alert alert-${toast.type} alert-dismissible fade show position-fixed`}
              style={{ bottom: 24, right: 24, zIndex: 9999, minWidth: 280, boxShadow: "0 4px 20px rgba(0,0,0,.15)" }}
              role="alert"
            >
              {toast.msg}
              <button type="button" className="btn-close" onClick={() => setToast(null)} />
            </div>
          )}

          {/* ── LIST VIEW ── */}
          {view === "list" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="mb-0 fw-bold">Support Center</h4>
                  <p className="text-muted mb-0 small">Submit and track your support requests</p>
                </div>
                <button className="btn btn-primary" onClick={() => setView("new")}>
                  <i className="bi bi-plus-lg me-2"></i>New Ticket
                </button>
              </div>

              {/* Summary Cards */}
              <div className="row g-3 mb-4">
                {[
                  { label: "All Tickets",   value: counts.all,         color: "primary" },
                  { label: "Open",          value: counts.open,        color: "warning" },
                  { label: "In Progress",   value: counts.in_progress, color: "info"    },
                  { label: "Resolved",      value: counts.resolved,    color: "success" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="col-md-3">
                    <div className={`card shadow-sm border-0 border-start border-${color} border-4`}>
                      <div className="card-body">
                        <h6 className="card-title text-muted small mb-1">{label}</h6>
                        <p className={`card-text display-6 fw-bold text-${color} mb-0`}>{value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tickets Table */}
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-semibold"><i className="bi bi-ticket-perforated me-2 text-primary"></i>My Tickets</h6>
                  <small className="text-muted">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</small>
                </div>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center text-muted py-5">
                      <div className="spinner-border spinner-border-sm me-2" role="status" />
                      Loading tickets…
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <i className="bi bi-headset fs-1 d-block mb-2 opacity-25"></i>
                      <p className="mb-2 fw-semibold">No tickets yet</p>
                      <button className="btn btn-primary btn-sm" onClick={() => setView("new")}>
                        <i className="bi bi-plus-lg me-1"></i>Submit your first request
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Subject</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Submitted</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((t, i) => {
                            const sb = STATUS_BADGE[t.status]    ?? { cls: "bg-secondary", label: t.status };
                            const pb = PRIORITY_BADGE[t.priority] ?? { cls: "bg-secondary", label: t.priority };
                            const catLabel = CATEGORY_OPTIONS.find((c) => c.value === t.category)?.label ?? t.category;
                            return (
                              <tr key={t.id}>
                                <td className="text-muted align-middle">{i + 1}</td>
                                <td className="align-middle">
                                  <div className="fw-semibold">{t.subject}</div>
                                  <small className="text-muted">
                                    {t.message?.slice(0, 60)}{t.message?.length > 60 ? "…" : ""}
                                  </small>
                                </td>
                                <td className="align-middle"><small className="text-muted">{catLabel}</small></td>
                                <td className="align-middle"><span className={`badge ${pb.cls}`}>{pb.label}</span></td>
                                <td className="align-middle"><span className={`badge ${sb.cls}`}>{sb.label}</span></td>
                                <td className="align-middle">
                                  <small className="text-muted">
                                    {t.created_at
                                      ? new Date(t.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                                      : "—"}
                                  </small>
                                </td>
                                <td className="align-middle">
                                  <button className="btn btn-sm btn-outline-primary" onClick={() => openDetail(t)}>
                                    <i className="bi bi-eye me-1"></i>View
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
              </div>
            </>
          )}

          {/* ── NEW TICKET VIEW ── */}
          {view === "new" && (
            <>
              <div className="d-flex align-items-center mb-4 gap-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => { setView("list"); setErrors({}); }}>
                  <i className="bi bi-arrow-left me-1"></i>Back
                </button>
                <div>
                  <h4 className="mb-0 fw-bold">New Support Ticket</h4>
                  <p className="text-muted mb-0 small">Describe your issue and we'll get back to you shortly</p>
                </div>
              </div>

              <div className="row justify-content-center">
                <div className="col-lg-8">
                  <div className="card shadow-sm border-0">
                    <div className="card-body p-4">
                      <form onSubmit={handleSubmit} noValidate>

                        {/* Subject */}
                        <div className="mb-3">
                          <label className="form-label fw-semibold">Subject <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className={`form-control ${errors.subject ? "is-invalid" : ""}`}
                            value={form.subject}
                            onChange={setField("subject")}
                            placeholder="Brief summary of your issue"
                            maxLength={255}
                          />
                          {errors.subject && <div className="invalid-feedback">{errors.subject}</div>}
                        </div>

                        {/* Category + Priority */}
                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Category</label>
                            <select className="form-select" value={form.category} onChange={setField("category")}>
                              {CATEGORY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Priority</label>
                            <select className="form-select" value={form.priority} onChange={setField("priority")}>
                              {PRIORITY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <div className="form-text">Use <strong>High</strong> only for urgent issues that block exam access.</div>
                          </div>
                        </div>

                        {/* Message */}
                        <div className="mb-4">
                          <label className="form-label fw-semibold">Message <span className="text-danger">*</span></label>
                          <textarea
                            className={`form-control ${errors.message ? "is-invalid" : ""}`}
                            rows={6}
                            value={form.message}
                            onChange={setField("message")}
                            placeholder="Describe your issue in detail. Include any steps to reproduce, error messages, or relevant exam/course information."
                            maxLength={5000}
                          />
                          <div className="d-flex justify-content-between mt-1">
                            <span className="form-text">
                              {errors.message
                                ? <span className="text-danger">{errors.message}</span>
                                : "Be as detailed as possible"}
                            </span>
                            <span className="form-text text-muted">{form.message.length} / 5000</span>
                          </div>
                        </div>

                        <div className="d-flex gap-2 justify-content-end">
                          <button type="button" className="btn btn-outline-secondary" onClick={() => { setView("list"); setErrors({}); }}>
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving
                              ? <><span className="spinner-border spinner-border-sm me-2" />Submitting…</>
                              : <><i className="bi bi-send me-2" />Submit Ticket</>}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── DETAIL VIEW ── */}
          {view === "detail" && selected && (
            <>
              <div className="d-flex align-items-center mb-4 gap-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setView("list")}>
                  <i className="bi bi-arrow-left me-1"></i>Back to Tickets
                </button>
                <div>
                  <h4 className="mb-0 fw-bold">Ticket #{selected.id}</h4>
                  <p className="text-muted mb-0 small">
                    Submitted{" "}
                    {selected.created_at
                      ? new Date(selected.created_at).toLocaleString("en-PH", {
                          month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="row justify-content-center">
                <div className="col-lg-8">

                  {/* Ticket Info */}
                  <div className="card shadow-sm border-0 mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="card-title mb-0 fw-semibold">{selected.subject}</h5>
                        <div className="d-flex gap-2">
                          {STATUS_BADGE[selected.status] && (
                            <span className={`badge ${STATUS_BADGE[selected.status].cls}`}>
                              {STATUS_BADGE[selected.status].label}
                            </span>
                          )}
                          {PRIORITY_BADGE[selected.priority] && (
                            <span className={`badge ${PRIORITY_BADGE[selected.priority].cls}`}>
                              {PRIORITY_BADGE[selected.priority].label}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-muted small mb-3">
                        <i className="bi bi-tag me-1"></i>
                        {CATEGORY_OPTIONS.find((c) => c.value === selected.category)?.label ?? selected.category}
                      </p>
                      <hr />
                      <p className="mb-0" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                        {selected.message}
                      </p>
                    </div>
                  </div>

                  {/* Admin Response */}
                  <div className="card shadow-sm border-0">
                    <div className="card-body">
                      <h6 className="card-title d-flex align-items-center gap-2 fw-semibold">
                        <i className="bi bi-chat-text text-primary"></i>Admin Response
                      </h6>
                      {selected.admin_response ? (
                        <div className="alert alert-info mb-0">
                          <p className="mb-0" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                            {selected.admin_response}
                          </p>
                          {selected.responded_at && (
                            <small className="text-muted mt-2 d-block">
                              Responded on{" "}
                              {new Date(selected.responded_at).toLocaleString("en-PH", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                              })}
                            </small>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-muted py-4">
                          <i className="bi bi-hourglass-split fs-2 d-block mb-2 text-warning"></i>
                          <p className="mb-0">Your ticket is being reviewed. We'll respond as soon as possible.</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}