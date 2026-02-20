import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";

// ─── Helpers ────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  tab_switch:         "Tab Switching",
  keyboard_shortcut:  "Keyboard Shortcut",
  response_time:      "Response Time",
  keystroke_dynamics: "Keystroke Dynamics",
};

const SEVERITY_MAP = {
  high:   { badge: "bg-danger",             label: "High"   },
  medium: { badge: "bg-warning text-dark",  label: "Medium" },
  low:    { badge: "bg-secondary",          label: "Low"    },
};

const FLAG_MAP = {
  flagged: { badge: "bg-danger",            label: "Flagged"  },
  warning: { badge: "bg-warning text-dark", label: "Warning"  },
  none:    { badge: "bg-success",           label: "Clear"    },
};

const getRiskColor = (score) => {
  if (score >= 50) return "text-danger";
  if (score >= 20) return "text-warning";
  return "text-success";
};

// ─── Main Component ──────────────────────────────────────────────────────────

const Alerts = () => {
  const navigate = useNavigate();

  // User
  const [user, setUser] = useState(null);

  // Exam selector
  const [exams, setExams]           = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");

  // Summaries (risk table)
  const [summaries, setSummaries]   = useState([]);

  // Flat log list (detail view)
  const [logs, setLogs]             = useState([]);
  const [logPage, setLogPage]       = useState(null); // paginator meta

  // UI state
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterType, setFilterType]         = useState("all");
  const [view, setView]                     = useState("summary"); // "summary" | "logs"
  const [loading, setLoading]               = useState(false);

  // Detail modal
  const [detailSubmission, setDetailSubmission] = useState(null); // { student, submission, summary, logs }
  const [detailLoading, setDetailLoading]       = useState(false);

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const boot = async () => {
      try {
        const [meRes, examsRes] = await Promise.all([
          API.get("/me"),
          API.get("/exams"),
        ]);
        setUser(meRes.data.user);
        const examList = examsRes.data.exams || [];
        setExams(examList);
        // Auto-select the first exam
        if (examList.length > 0) setSelectedExamId(String(examList[0].id));
      } catch (err) {
        console.error("Boot failed:", err);
      }
    };
    boot();
  }, []);

  // ── Fetch data whenever exam or view changes ──────────────────────────────
  useEffect(() => {
    if (!selectedExamId) return;
    if (view === "summary") fetchSummaries();
    if (view === "logs")    fetchLogs();
  }, [selectedExamId, view, filterSeverity, filterType]);

  const fetchSummaries = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/exams/${selectedExamId}/anomalies/summary`);
      setSummaries(res.data.summaries || []);
    } catch (err) {
      console.error("Failed to fetch summaries:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page });
      if (filterSeverity !== "all") params.append("severity", filterSeverity);
      if (filterType !== "all")     params.append("type",     filterType);

      const res = await API.get(`/exams/${selectedExamId}/anomalies?${params}`);
      setLogs(res.data.logs.data || []);
      setLogPage(res.data.logs);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Open student detail modal ─────────────────────────────────────────────
  const openDetail = async (submissionId) => {
    setDetailLoading(true);
    setDetailSubmission(null);
    try {
      const res = await API.get(
        `/exams/${selectedExamId}/submissions/${submissionId}/anomalies`
      );
      setDetailSubmission(res.data);
    } catch (err) {
      console.error("Failed to fetch detail:", err);
      Swal.fire("Error", "Could not load student detail.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Mark log reviewed ─────────────────────────────────────────────────────
  const markReviewed = async (logId, reviewed) => {
    const { value: notes } = await Swal.fire({
      title:       reviewed ? "Mark as Reviewed" : "Reopen Log",
      input:       "textarea",
      inputLabel:  "Reviewer notes (optional)",
      inputPlaceholder: "Add your observations here...",
      showCancelButton: true,
      confirmButtonText: reviewed ? "Mark Reviewed" : "Reopen",
    });

    if (notes === undefined) return; // cancelled

    try {
      await API.patch(`/exams/${selectedExamId}/anomalies/${logId}/review`, {
        reviewed,
        reviewer_notes: notes || null,
      });

      Swal.fire({
        toast: true, position: "top-end",
        icon: "success", title: "Saved",
        showConfirmButton: false, timer: 2000,
      });

      // Refresh whichever view is open
      if (detailSubmission) {
        openDetail(detailSubmission.submission.id);
      } else {
        fetchLogs();
      }
    } catch (err) {
      Swal.fire("Error", "Failed to save review.", "error");
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = {
    flagged:  summaries.filter(s => s.flag_status === "flagged").length,
    warning:  summaries.filter(s => s.flag_status === "warning").length,
    clear:    summaries.filter(s => s.flag_status === "none").length,
    total:    summaries.length,
  };

  const typeCounts = logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {});
  const totalLogs = logs.length || 1;

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/");
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="d-flex flex-column min-vh-100">

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold text-primary" href="#">SECT Instructor</a>
          <div className="dropdown">
            <button className="btn btn-light dropdown-toggle" type="button"
              data-bs-toggle="dropdown">
              <span className="fw-bold">Welcome, {user?.name || "Instructor"}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><Link className="dropdown-item" to="/instructor/account-settings">Account Settings</Link></li>
              <li><Link className="dropdown-item" to="/instructor/profile">Profile</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item" onClick={handleLogout}>Logout</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="d-flex flex-grow-1">

        {/* Sidebar */}
        <nav className="text-black d-flex justify-content-center" style={{ width: 110, minHeight: "100%" }}>
          <ul className="nav flex-column p-3 align-items-center">
            {[
              { to: "/instructor",                icon: "speedometer2",       label: "Dashboard" },
              { to: "/instructor/exams",          icon: "file-earmark-text",  label: "Exams"     },
              { to: "/instructor/students",       icon: "people",             label: "Students"  },
              { to: "/instructor/alerts",         icon: "exclamation-triangle",label: "Alerts"   },
              { to: "/instructor/reports",        icon: "bar-chart",          label: "Reports"   },
              { to: "/instructor/account-settings",icon: "gear",              label: "Settings"  },
            ].map(({ to, icon, label }) => {
              const active = window.location.pathname === to;
              return (
                <li key={to} className="nav-item mb-3">
                  <Link className={`nav-link fw-semibold d-flex flex-column align-items-center py-3 ${
                    active ? "text-white bg-primary rounded" : "text-black"
                  }`} to={to}>
                    <i className={`bi bi-${icon} fs-3 mb-1`}></i>
                    <span style={{ fontSize: 11 }}>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Main */}
        <div className="flex-grow-1 p-4 bg-light">

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">Cheating Alerts &amp; Anomalies</h4>

            {/* Exam selector */}
            <div className="d-flex align-items-center gap-2">
              <label className="form-label mb-0 fw-semibold text-muted small">Exam:</label>
              <select
                className="form-select form-select-sm"
                style={{ minWidth: 240 }}
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                {exams.length === 0 && <option value="">No exams found</option>}
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} — {ex.course?.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            {[
              { label: "Flagged Students",  value: stats.flagged,  color: "danger",   sub: "Requires review"     },
              { label: "Warning Students",  value: stats.warning,  color: "warning",  sub: "Monitor closely"     },
              { label: "Clear Students",    value: stats.clear,    color: "success",  sub: "No anomalies"        },
              { label: "Total Monitored",   value: stats.total,    color: "primary",  sub: "Submissions tracked" },
            ].map(({ label, value, color, sub }) => (
              <div key={label} className="col-md-3">
                <div className={`card shadow-sm border-0 border-start border-${color} border-4`}>
                  <div className="card-body">
                    <h6 className="card-title text-muted">{label}</h6>
                    <p className={`card-text display-6 fw-bold text-${color}`}>{value}</p>
                    <small className={`text-${color}`}>{sub}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View Toggle */}
          <div className="card shadow-sm border-0 mb-3">
            <div className="card-body d-flex flex-wrap align-items-center gap-3">
              <div className="btn-group">
                <button
                  className={`btn ${view === "summary" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setView("summary")}
                >
                  <i className="bi bi-people me-2"></i>Student Risk Summary
                </button>
                <button
                  className={`btn ${view === "logs" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setView("logs")}
                >
                  <i className="bi bi-list-ul me-2"></i>Event Log
                </button>
              </div>

              {/* Filters — only shown in log view */}
              {view === "logs" && (
                <div className="d-flex gap-2 ms-auto flex-wrap">
                  <select className="form-select form-select-sm" style={{ width: 160 }}
                    value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
                    <option value="all">All severities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select className="form-select form-select-sm" style={{ width: 200 }}
                    value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="all">All types</option>
                    <option value="tab_switch">Tab Switching</option>
                    <option value="keyboard_shortcut">Keyboard Shortcut</option>
                    <option value="response_time">Response Time</option>
                    <option value="keystroke_dynamics">Keystroke Dynamics</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : (
            <>
              {/* ── SUMMARY VIEW ── */}
              {view === "summary" && (
                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <h6 className="card-title mb-3">Student Risk Overview</h6>
                    {summaries.length === 0 ? (
                      <p className="text-center text-muted py-4">
                        No anomaly data yet for this exam.
                      </p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>STUDENT</th>
                              <th>RISK SCORE</th>
                              <th>FLAG</th>
                              <th title="Tab Switches"><i className="bi bi-box-arrow-up-right"></i> Tabs</th>
                              <th title="Keyboard Shortcuts"><i className="bi bi-keyboard"></i> Shortcuts</th>
                              <th title="Response Time Anomalies"><i className="bi bi-clock"></i> Response</th>
                              <th title="Keystroke Anomalies"><i className="bi bi-activity"></i> Keystrokes</th>
                              <th>LAST EVENT</th>
                              <th>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summaries.map((s) => (
                              <tr key={s.submission_id}>
                                <td>
                                  <div className="fw-semibold">{s.student?.name}</div>
                                  <small className="text-muted">{s.student?.email}</small>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="progress flex-grow-1" style={{ height: 8, minWidth: 80 }}>
                                      <div
                                        className={`progress-bar ${
                                          s.risk_score >= 50 ? "bg-danger"
                                          : s.risk_score >= 20 ? "bg-warning"
                                          : "bg-success"
                                        }`}
                                        style={{ width: `${s.risk_score}%` }}
                                      />
                                    </div>
                                    <span className={`fw-bold ${getRiskColor(s.risk_score)}`}>
                                      {s.risk_score}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${FLAG_MAP[s.flag_status]?.badge}`}>
                                    {FLAG_MAP[s.flag_status]?.label}
                                  </span>
                                </td>
                                <td className="text-center">{s.tab_switch_count}</td>
                                <td className="text-center">{s.keyboard_shortcut_count}</td>
                                <td className="text-center">{s.response_time_anomaly_count}</td>
                                <td className="text-center">{s.keystroke_anomaly_count}</td>
                                <td>
                                  <small className="text-muted">
                                    {s.last_anomaly_at
                                      ? new Date(s.last_anomaly_at).toLocaleString()
                                      : "—"}
                                  </small>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => openDetail(s.submission_id)}
                                    title="View full event log for this student"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── LOG VIEW ── */}
              {view === "logs" && (
                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <h6 className="card-title mb-3">All Anomaly Events</h6>
                    {logs.length === 0 ? (
                      <p className="text-center text-muted py-4">No events match the current filters.</p>
                    ) : (
                      <>
                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>TIME</th>
                                <th>STUDENT</th>
                                <th>TYPE</th>
                                <th>SEVERITY</th>
                                <th>QUESTION</th>
                                <th>DETAIL</th>
                                <th>REVIEWED</th>
                                <th>ACTIONS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {logs.map((log) => (
                                <tr key={log.id} className={log.reviewed ? "table-light opacity-75" : ""}>
                                  <td>
                                    <small>{new Date(log.occurred_at).toLocaleString()}</small>
                                  </td>
                                  <td>
                                    <div className="fw-semibold">{log.student?.name}</div>
                                    <small className="text-muted">{log.student?.email}</small>
                                  </td>
                                  <td>
                                    <span className="badge bg-dark">
                                      {TYPE_LABELS[log.type] ?? log.type}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${SEVERITY_MAP[log.severity]?.badge}`}>
                                      {SEVERITY_MAP[log.severity]?.label}
                                    </span>
                                  </td>
                                  <td>
                                    {log.question
                                      ? <small>Q{log.question.order}: {log.question.question_text?.slice(0, 40)}…</small>
                                      : <small className="text-muted">—</small>}
                                  </td>
                                  <td style={{ maxWidth: 220 }}>
                                    <MetadataSummary type={log.type} meta={log.metadata} />
                                  </td>
                                  <td>
                                    {log.reviewed
                                      ? <span className="badge bg-success">Reviewed</span>
                                      : <span className="badge bg-secondary">Pending</span>}
                                  </td>
                                  <td>
                                    <button
                                      className={`btn btn-sm ${log.reviewed ? "btn-outline-secondary" : "btn-outline-success"}`}
                                      onClick={() => markReviewed(log.id, !log.reviewed)}
                                      title={log.reviewed ? "Reopen" : "Mark reviewed"}
                                    >
                                      <i className={`bi ${log.reviewed ? "bi-arrow-counterclockwise" : "bi-check-circle"}`}></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {logPage && logPage.last_page > 1 && (
                          <div className="d-flex justify-content-center gap-2 mt-3">
                            {Array.from({ length: logPage.last_page }, (_, i) => i + 1).map((p) => (
                              <button
                                key={p}
                                className={`btn btn-sm ${p === logPage.current_page ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => fetchLogs(p)}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── TYPE DISTRIBUTION (shown below both views) ── */}
              {view === "logs" && logs.length > 0 && (
                <div className="card shadow-sm border-0 mt-3">
                  <div className="card-body">
                    <h6 className="card-title mb-3">Event Type Distribution</h6>
                    {Object.entries(TYPE_LABELS).map(([key, label]) => {
                      const count = typeCounts[key] || 0;
                      const pct   = Math.round((count / totalLogs) * 100);
                      return (
                        <div key={key} className="d-flex align-items-center mb-2">
                          <span style={{ width: 180 }} className="small">{label}</span>
                          <div className="progress flex-grow-1 mx-3" style={{ height: 10 }}>
                            <div className="progress-bar bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="fw-bold small" style={{ width: 40 }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Student Detail Modal ── */}
      {(detailLoading || detailSubmission) && (
        <StudentDetailModal
          loading={detailLoading}
          data={detailSubmission}
          examId={selectedExamId}
          onClose={() => setDetailSubmission(null)}
          onMarkReviewed={markReviewed}
        />
      )}
    </div>
  );
};

// ─── Metadata summary cell ────────────────────────────────────────────────────
const MetadataSummary = ({ type, meta }) => {
  if (!meta) return <small className="text-muted">—</small>;
  switch (type) {
    case "tab_switch":
      return <small>Hidden {((meta.hidden_duration_ms ?? 0) / 1000).toFixed(1)}s · Switch #{meta.count_in_session}</small>;
    case "keyboard_shortcut":
      return <small><kbd>{meta.keys}</kbd></small>;
    case "response_time":
      return <small>{meta.direction === "too_fast" ? "⚡ Too fast" : "🐢 Too slow"} · z={meta.z_score} · {((meta.response_time_ms ?? 0) / 1000).toFixed(1)}s</small>;
    case "keystroke_dynamics":
      return <small>{meta.reason === "impossible_speed" ? "🚀 Impossible speed" : "📊 Deviation"} · {meta.wpm?.toFixed(0)} WPM</small>;
    default:
      return <small className="text-muted">See logs</small>;
  }
};

// ─── Student Detail Modal ────────────────────────────────────────────────────
const StudentDetailModal = ({ loading, data, onClose, onMarkReviewed }) => (
  <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
    <div className="modal-dialog modal-xl modal-dialog-scrollable">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">
            {loading ? "Loading…" : `${data?.student?.name} — Anomaly Detail`}
          </h5>
          <button className="btn-close" onClick={onClose} />
        </div>

        <div className="modal-body">
          {loading && (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          )}

          {!loading && data && (
            <>
              {/* Summary badges */}
              <div className="row g-3 mb-4">
                {[
                  { label: "Risk Score",   value: data.summary?.risk_score ?? 0,                color: getRiskColor(data.summary?.risk_score ?? 0) },
                  { label: "Tab Switches", value: data.summary?.tab_switch_count ?? 0,          color: "text-dark" },
                  { label: "Shortcuts",    value: data.summary?.keyboard_shortcut_count ?? 0,   color: "text-dark" },
                  { label: "Response ⚠",  value: data.summary?.response_time_anomaly_count ?? 0,color: "text-dark" },
                  { label: "Keystroke ⚠", value: data.summary?.keystroke_anomaly_count ?? 0,    color: "text-dark" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="col">
                    <div className="card border-0 bg-light text-center p-2">
                      <div className={`display-6 fw-bold ${color}`}>{value}</div>
                      <small className="text-muted">{label}</small>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submission info */}
              <div className="mb-3 small text-muted">
                <strong>Started:</strong> {new Date(data.submission?.started_at).toLocaleString()} &nbsp;·&nbsp;
                <strong>Submitted:</strong> {data.submission?.submitted_at ? new Date(data.submission.submitted_at).toLocaleString() : "In progress"} &nbsp;·&nbsp;
                <strong>Score:</strong> {data.submission?.score}/{data.submission?.total_points}
              </div>

              {/* Event timeline */}
              <h6 className="fw-bold mb-3">Event Timeline</h6>
              {data.logs?.length === 0 ? (
                <p className="text-muted">No events recorded.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>TIME</th>
                        <th>TYPE</th>
                        <th>SEVERITY</th>
                        <th>QUESTION</th>
                        <th>DETAIL</th>
                        <th>NOTES</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((log) => (
                        <tr key={log.id} className={log.reviewed ? "opacity-50" : ""}>
                          <td><small>{new Date(log.occurred_at).toLocaleTimeString()}</small></td>
                          <td><span className="badge bg-dark">{TYPE_LABELS[log.type] ?? log.type}</span></td>
                          <td>
                            <span className={`badge ${SEVERITY_MAP[log.severity]?.badge}`}>
                              {SEVERITY_MAP[log.severity]?.label}
                            </span>
                          </td>
                          <td>
                            {log.question
                              ? <small>Q{log.question.order}</small>
                              : <small className="text-muted">—</small>}
                          </td>
                          <td><MetadataSummary type={log.type} meta={log.metadata} /></td>
                          <td>
                            <small className="text-muted fst-italic">
                              {log.reviewer_notes || "—"}
                            </small>
                          </td>
                          <td>
                            <button
                              className={`btn btn-sm ${log.reviewed ? "btn-outline-secondary" : "btn-outline-success"}`}
                              onClick={() => onMarkReviewed(log.id, !log.reviewed)}
                              title={log.reviewed ? "Reopen" : "Mark reviewed"}
                            >
                              <i className={`bi ${log.reviewed ? "bi-arrow-counterclockwise" : "bi-check-circle"}`}></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  </div>
);

export default Alerts;