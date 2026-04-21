import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";
import InstructorAlertBell from "../../components/InstructorAlertBell";

/* ─── Shared sidebar ─────────────────────────────────────────────────────── */
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

const TYPE_LABELS = {
  tab_switch:         "Tab Switching",
  keyboard_shortcut:  "Keyboard Shortcut",
  response_time:      "Response Time",
  keystroke_dynamics: "Keystroke Dynamics",
};
const SEVERITY_MAP = {
  high:   { badge:"bg-danger",            label:"High"   },
  medium: { badge:"bg-warning text-dark", label:"Medium" },
  low:    { badge:"bg-secondary",         label:"Low"    },
};
const riskColor = (s) => s >= 50 ? "text-danger" : s >= 20 ? "text-warning" : "text-success";

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════════ */
const Alerts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser]                         = useState(null);
  const [exams, setExams]                       = useState([]);
  const [selectedExamId, setSelectedExamId]     = useState("");
  const [summaries, setSummaries]               = useState([]);
  const [logs, setLogs]                         = useState([]);
  const [logPage, setLogPage]                   = useState(null);
  const [filterSeverity, setFilterSeverity]     = useState("all");
  const [filterType, setFilterType]             = useState("all");
  const [view, setView]                         = useState("summary");
  const [loading, setLoading]                   = useState(false);
  const [detailSubmission, setDetailSubmission] = useState(null);
  const [detailLoading, setDetailLoading]       = useState(false);

  useEffect(() => {
    const boot = async () => {
      try {
        const [meRes, examsRes] = await Promise.all([API.get("/me"), API.get("/exams")]);
        setUser(meRes.data.user);
        const examList = examsRes.data.exams || [];
        setExams(examList);
        if (examList.length > 0) setSelectedExamId(String(examList[0].id));
      } catch (err) { console.error("Boot failed:", err); }
    };
    boot();
  }, []);

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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openDetail = async (submissionId) => {
    setDetailLoading(true); setDetailSubmission(null);
    try {
      const res = await API.get(`/exams/${selectedExamId}/submissions/${submissionId}/anomalies`);
      setDetailSubmission(res.data);
    } catch {
      Swal.fire("Error", "Could not load student detail.", "error");
    } finally { setDetailLoading(false); }
  };

  const markReviewed = async (logId, reviewed) => {
    const { value:notes } = await Swal.fire({
      title: reviewed ? "Mark as Reviewed" : "Reopen Log",
      input:"textarea", inputLabel:"Reviewer notes (optional)",
      inputPlaceholder:"Add your observations here...",
      showCancelButton:true, confirmButtonText: reviewed ? "Mark Reviewed" : "Reopen",
    });
    if (notes === undefined) return;
    try {
      await API.patch(`/exams/${selectedExamId}/anomalies/${logId}/review`, {
        reviewed, reviewer_notes: notes || null,
      });
      Swal.fire({ toast:true, position:"top-end", icon:"success", title:"Saved", showConfirmButton:false, timer:2000 });
      if (detailSubmission) openDetail(detailSubmission.submission.id);
      else fetchLogs();
    } catch { Swal.fire("Error", "Failed to save review.", "error"); }
  };

  const stats = {
    flagged: summaries.filter(s => s.flag_status === "flagged").length,
    warning: summaries.filter(s => s.flag_status === "warning").length,
    clear:   summaries.filter(s => s.flag_status === "none").length,
    total:   summaries.length,
  };
  const typeCounts = logs.reduce((acc, log) => { acc[log.type] = (acc[log.type]||0)+1; return acc; }, {});
  const totalLogs  = logs.length || 1;

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/instructor/login");
  };

  const isActive = (to) =>
    to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="d-flex flex-column min-vh-100">

      {/* Navbar */}
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
                <li><Link className="dropdown-item" to="/instructor/account-settings">Account Settings</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile">Profile</Link></li>
                <li><hr className="dropdown-divider"/></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="d-flex flex-grow-1">

        {/* Sidebar */}
        <nav className="bg-white border-end d-flex flex-column align-items-center py-3" style={{ width:72, minHeight:"100%" }}>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <Link key={to} to={to}
              className={`nav-link d-flex flex-column align-items-center py-2 px-1 mb-2 rounded ${
                isActive(to) ? "text-primary bg-primary bg-opacity-10 fw-bold" : "text-secondary"
              }`}
              style={{ fontSize:10, width:56, textAlign:"center" }} title={label}>
              <i className={`bi ${icon} fs-5 mb-1`}></i>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Main */}
        <div className="flex-grow-1 p-4 bg-light">

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-0 fw-bold">Cheating Alerts &amp; Anomalies</h4>
              <small className="text-muted">Review flagged students and anomalous events</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <label className="form-label mb-0 fw-semibold text-muted small">Exam:</label>
              <select className="form-select form-select-sm" style={{ minWidth:240 }}
                value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                {exams.length === 0 && <option value="">No exams found</option>}
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.title} — {ex.course?.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            {[
              { label:"Flagged Students", value:stats.flagged, color:"danger",  sub:"Requires review"     },
              { label:"Warning Students", value:stats.warning, color:"warning", sub:"Monitor closely"     },
              { label:"Clear Students",   value:stats.clear,   color:"success", sub:"No anomalies"        },
              { label:"Total Monitored",  value:stats.total,   color:"primary", sub:"Submissions tracked" },
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
                <button className={`btn ${view==="summary"?"btn-primary":"btn-outline-primary"}`} onClick={() => setView("summary")}>
                  <i className="bi bi-people me-2"></i>Student Risk Summary
                </button>
                <button className={`btn ${view==="logs"?"btn-primary":"btn-outline-primary"}`} onClick={() => setView("logs")}>
                  <i className="bi bi-list-ul me-2"></i>Event Log
                </button>
              </div>
              {view === "logs" && (
                <div className="d-flex gap-2 ms-auto flex-wrap">
                  <select className="form-select form-select-sm" style={{width:160}}
                    value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
                    <option value="all">All severities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select className="form-select form-select-sm" style={{width:200}}
                    value={filterType} onChange={e => setFilterType(e.target.value)}>
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
            <div className="text-center py-5"><div className="spinner-border text-primary"/></div>
          ) : (
            <>
              {/* SUMMARY VIEW */}
              {view === "summary" && (
                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <h6 className="card-title mb-3">Student Risk Overview</h6>
                    {summaries.length === 0 ? (
                      <div className="text-center text-muted py-5">
                        <i className="bi bi-shield-check fs-1 d-block mb-2"></i>
                        No anomaly data yet for this exam.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>STUDENT</th><th>RISK SCORE</th><th>FLAG</th>
                              <th title="Tab Switches"><i className="bi bi-box-arrow-up-right"></i> Tabs</th>
                              <th title="Keyboard Shortcuts"><i className="bi bi-keyboard"></i> Shortcuts</th>
                              <th title="Response Time Anomalies"><i className="bi bi-clock"></i> Response</th>
                              <th title="Keystroke Anomalies"><i className="bi bi-activity"></i> Keystrokes</th>
                              <th>LAST EVENT</th><th>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summaries.map(s => (
                              <tr key={s.submission_id}>
                                <td>
                                  <div className="fw-semibold">{s.student?.name}</div>
                                  <small className="text-muted">{s.student?.email}</small>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="progress flex-grow-1" style={{height:8,minWidth:80}}>
                                      <div className={`progress-bar ${s.cpi_score>=50?"bg-danger":s.cpi_score>=25?"bg-warning":"bg-success"}`}
                                        style={{width:`${Math.min(s.cpi_score??0,100)}%`}}/>
                                    </div>
                                    <span className={`fw-bold ${riskColor(s.cpi_score??0)}`}>
                                      {(s.cpi_score??0).toFixed(1)}%
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${s.is_flagged?"bg-danger":(s.cpi_score??0)>=25?"bg-warning text-dark":"bg-success"}`}>
                                    {s.is_flagged?"Flagged":(s.cpi_score??0)>=25?"Possible":"Unlikely"}
                                  </span>
                                </td>
                                <td className="text-center">{s.tab_switch_count}</td>
                                <td className="text-center">{s.keyboard_shortcut_count}</td>
                                <td className="text-center">{s.response_time_anomaly_count}</td>
                                <td className="text-center">{s.keystroke_anomaly_count}</td>
                                <td><small className="text-muted">{s.last_anomaly_at ? new Date(s.last_anomaly_at).toLocaleString() : "—"}</small></td>
                                <td>
                                  <button className="btn btn-sm btn-outline-primary" onClick={() => openDetail(s.submission_id)}>
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

              {/* LOG VIEW */}
              {view === "logs" && (
                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <h6 className="card-title mb-3">All Anomaly Events</h6>
                    {logs.length === 0 ? (
                      <div className="text-center text-muted py-5">
                        <i className="bi bi-list-ul fs-1 d-block mb-2"></i>No events match the current filters.
                      </div>
                    ) : (
                      <>
                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>TIME</th><th>STUDENT</th><th>TYPE</th><th>SEVERITY</th>
                                <th>QUESTION</th><th>DETAIL</th><th>REVIEWED</th><th>ACTIONS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {logs.map(log => (
                                <tr key={log.id} className={log.reviewed?"table-light opacity-75":""}>
                                  <td><small>{new Date(log.occurred_at).toLocaleString()}</small></td>
                                  <td>
                                    <div className="fw-semibold">{log.student?.name}</div>
                                    <small className="text-muted">{log.student?.email}</small>
                                  </td>
                                  <td><span className="badge bg-dark">{TYPE_LABELS[log.type]??log.type}</span></td>
                                  <td><span className={`badge ${SEVERITY_MAP[log.severity]?.badge}`}>{SEVERITY_MAP[log.severity]?.label}</span></td>
                                  <td>{log.question ? <small>Q{log.question.order}: {log.question.question_text?.slice(0,40)}…</small> : <small className="text-muted">—</small>}</td>
                                  <td style={{maxWidth:220}}><MetadataSummary type={log.type} meta={log.metadata}/></td>
                                  <td>{log.reviewed ? <span className="badge bg-success">Reviewed</span> : <span className="badge bg-secondary">Pending</span>}</td>
                                  <td>
                                    <button className={`btn btn-sm ${log.reviewed?"btn-outline-secondary":"btn-outline-success"}`}
                                      onClick={() => markReviewed(log.id, !log.reviewed)}>
                                      <i className={`bi ${log.reviewed?"bi-arrow-counterclockwise":"bi-check-circle"}`}></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {logPage && logPage.last_page > 1 && (
                          <div className="d-flex justify-content-center gap-2 mt-3">
                            {Array.from({ length:logPage.last_page }, (_,i) => i+1).map(p => (
                              <button key={p}
                                className={`btn btn-sm ${p===logPage.current_page?"btn-primary":"btn-outline-primary"}`}
                                onClick={() => fetchLogs(p)}>{p}</button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Type Distribution */}
              {view === "logs" && logs.length > 0 && (
                <div className="card shadow-sm border-0 mt-3">
                  <div className="card-body">
                    <h6 className="card-title mb-3">Event Type Distribution</h6>
                    {Object.entries(TYPE_LABELS).map(([key, label]) => {
                      const pct = Math.round(((typeCounts[key]||0) / totalLogs) * 100);
                      return (
                        <div key={key} className="d-flex align-items-center mb-2">
                          <span style={{width:180}} className="small">{label}</span>
                          <div className="progress flex-grow-1 mx-3" style={{height:10}}>
                            <div className="progress-bar bg-primary" style={{width:`${pct}%`}}/>
                          </div>
                          <span className="fw-bold small" style={{width:40}}>{pct}%</span>
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

      {(detailLoading || detailSubmission) && (
        <StudentDetailModal
          loading={detailLoading}
          data={detailSubmission}
          onClose={() => setDetailSubmission(null)}
          onMarkReviewed={markReviewed}
        />
      )}
    </div>
  );
};

/* ─── Metadata summary ───────────────────────────────────────────────────── */
const MetadataSummary = ({ type, meta }) => {
  if (!meta) return <small className="text-muted">—</small>;
  switch (type) {
    case "tab_switch":         return <small>Hidden {((meta.hidden_duration_ms??0)/1000).toFixed(1)}s · Switch #{meta.count_in_session}</small>;
    case "keyboard_shortcut":  return <small><kbd>{meta.keys}</kbd></small>;
    case "response_time":      return <small>{meta.direction==="too_fast"?"⚡ Too fast":"🐢 Too slow"} · z={meta.z_score} · {((meta.response_time_ms??0)/1000).toFixed(1)}s</small>;
    case "keystroke_dynamics": return <small>{meta.reason==="impossible_speed"?"🚀 Impossible speed":"📊 Deviation"} · {meta.wpm?.toFixed(0)} WPM</small>;
    default:                   return <small className="text-muted">—</small>;
  }
};

/* ─── Student Detail Modal ───────────────────────────────────────────────── */
const StudentDetailModal = ({ loading, data, onClose, onMarkReviewed }) => (
  <div className="modal show d-block" style={{backgroundColor:"rgba(0,0,0,0.6)"}}>
    <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title fw-bold">{loading?"Loading…":`${data?.student?.name} — Anomaly Detail`}</h5>
          <button className="btn-close" onClick={onClose}/>
        </div>
        <div className="modal-body">
          {loading && <div className="text-center py-5"><div className="spinner-border text-primary"/></div>}
          {!loading && data && (
            <>
              <div className="row g-3 mb-4">
                {[
                  { label:"Risk Score",  value:`${(data.summary?.cpi_score??0).toFixed(1)}%`, color:riskColor(data.summary?.cpi_score??0) },
                  { label:"Tab Switches",value:data.summary?.tab_switch_count??0,             color:"text-dark" },
                  { label:"Shortcuts",   value:data.summary?.keyboard_shortcut_count??0,      color:"text-dark" },
                  { label:"Response ⚠", value:data.summary?.response_time_anomaly_count??0,  color:"text-dark" },
                  { label:"Keystroke ⚠",value:data.summary?.keystroke_anomaly_count??0,      color:"text-dark" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="col">
                    <div className="card border-0 bg-light text-center p-2">
                      <div className={`display-6 fw-bold ${color}`}>{value}</div>
                      <small className="text-muted">{label}</small>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mb-3 small text-muted">
                <strong>Started:</strong> {new Date(data.submission?.started_at).toLocaleString()} &nbsp;·&nbsp;
                <strong>Submitted:</strong> {data.submission?.submitted_at ? new Date(data.submission.submitted_at).toLocaleString() : "In progress"} &nbsp;·&nbsp;
                <strong>Score:</strong> {data.submission?.score}/{data.submission?.total_points}
              </div>
              <h6 className="fw-bold mb-3">Event Timeline</h6>
              {!data.logs || data.logs.length === 0 ? (
                <p className="text-muted text-center py-3">No events recorded.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle">
                    <thead className="table-light">
                      <tr><th>TIME</th><th>TYPE</th><th>SEVERITY</th><th>QUESTION</th><th>DETAIL</th><th>NOTES</th><th>ACTION</th></tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(data.logs) ? data.logs : Object.values(data.logs||{}).flat()).map(log => (
                        <tr key={`${log.type||""}-${log.id}`} className={log.reviewed?"opacity-50":""}>
                          <td><small>{new Date(log.occurred_at).toLocaleTimeString()}</small></td>
                          <td><span className="badge bg-dark">{TYPE_LABELS[log.type]??log.type}</span></td>
                          <td><span className={`badge ${SEVERITY_MAP[log.severity]?.badge}`}>{SEVERITY_MAP[log.severity]?.label}</span></td>
                          <td>{log.question?<small>Q{log.question.order}</small>:<small className="text-muted">—</small>}</td>
                          <td><MetadataSummary type={log.type} meta={log.metadata}/></td>
                          <td><small className="text-muted fst-italic">{log.reviewer_notes||"—"}</small></td>
                          <td>
                            <button className={`btn btn-sm ${log.reviewed?"btn-outline-secondary":"btn-outline-success"}`}
                              onClick={() => onMarkReviewed(log.id, !log.reviewed)}>
                              <i className={`bi ${log.reviewed?"bi-arrow-counterclockwise":"bi-check-circle"}`}></i>
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