import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../../lib/api";
import Swal from "sweetalert2";
import InstructorAlertBell from "../../components/InstructorAlertBell";

/* ─── Shared sidebar config ──────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/instructor",                  icon: "bi-speedometer2",         label: "Dashboard" },
  { to: "/instructor/courses",          icon: "bi-book",                 label: "Courses"   },
  { to: "/instructor/exams",            icon: "bi-file-earmark-text",    label: "Exams"     },
  { to: "/instructor/students",         icon: "bi-people",               label: "Students"  },
  { to: "/instructor/alerts",           icon: "bi-exclamation-triangle", label: "Alerts"    },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

/* ─── Timezone helpers ───────────────────────────────────────────────────── */
const utcToLocalInput = (utcString) => {
  if (!utcString) return "";
  const d = new Date(utcString);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const localInputToUTC = (localString) => {
  if (!localString) return "";
  return new Date(localString).toISOString();
};

/* ─── Shared CSS ─────────────────────────────────────────────────────────── */
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body,html{margin:0;padding:0;background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
  :root{
    --blue:#0056b3;--blue-mid:#1a6ed8;--blue-lite:#e8f0fe;
    --slate:#64748b;--slate-lt:#94a3b8;
    --card-bg:#ffffff;--card-br:16px;
    --card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);
  }
  .dash-card{
    background:var(--card-bg);border-radius:var(--card-br);
    box-shadow:var(--card-sh);border:1px solid rgba(0,86,179,.06);
    overflow:hidden;
  }
  .glass-sidebar{
    background:rgba(255,255,255,0.60);
    backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
    border-right:1px solid rgba(255,255,255,0.80);box-shadow:4px 0 24px rgba(0,86,179,.07);
  }
  .nav-pill{
    display:flex;flex-direction:column;align-items:center;
    padding:10px 8px;border-radius:12px;gap:4px;
    font-size:11px;font-weight:600;text-decoration:none;
    color:var(--slate);transition:background .15s,color .15s,transform .15s;width:100%;
  }
  .nav-pill:hover{background:var(--blue-lite);color:var(--blue);transform:translateY(-1px);}
  .nav-pill.active{background:var(--blue);color:#fff;box-shadow:0 4px 14px rgba(0,86,179,.35);}
  .nav-pill i{font-size:18px;}
  .topbar{
    background:rgba(255,255,255,0.80);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(0,86,179,.08);position:sticky;top:0;z-index:200;height:56px;
    display:flex;align-items:center;padding:0 20px;gap:12px;
  }
  .dash-avatar{width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .form-lbl{font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;display:block;}
  .form-ctrl{
    width:100%;border:1px solid rgba(0,86,179,.15);border-radius:10px;
    padding:9px 13px;font-size:13px;color:#1e293b;outline:none;
    font-family:'DM Sans',sans-serif;background:#f8faff;
    transition:border-color .2s,box-shadow .2s;
  }
  .form-ctrl:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,86,179,.10);background:#fff;}
  .form-ctrl:disabled{opacity:.6;cursor:not-allowed;}
  .dash-btn-primary{
    background:var(--blue);color:#fff;border:none;border-radius:10px;
    padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;
    font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;
    transition:opacity .15s,transform .15s;text-decoration:none;width:100%;justify-content:center;
  }
  .dash-btn-primary:hover{opacity:.87;color:#fff;}
  .dash-btn-primary:disabled{opacity:.5;cursor:not-allowed;}
  .dash-btn-ghost{
    background:#fff;border:1px solid rgba(0,86,179,.15);color:#64748b;
    border-radius:10px;padding:9px 16px;font-size:13px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;
    transition:all .15s;text-decoration:none;width:100%;justify-content:center;
  }
  .dash-btn-ghost:hover{background:#f1f5f9;color:#1e293b;}
  .card-section-hdr{
    padding:16px 20px;border-bottom:1px solid #f1f5f9;
    display:flex;align-items:center;gap:10px;
  }
  .card-section-hdr h3{margin:0;font-size:14px;font-weight:700;color:#0f172a;}
  .section-icon{
    width:32px;height:32px;border-radius:9px;background:var(--blue-lite);
    display:flex;align-items:center;justify-content:center;flex-shrink:0;
  }
  .section-icon i{color:var(--blue);font-size:15px;}
  .summary-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f8faff;font-size:13px;}
  .summary-row:last-child{border-bottom:none;}
  .summary-label{color:#94a3b8;font-weight:500;}
  .summary-value{color:#1e293b;font-weight:600;text-align:right;}
  .status-pill{
    display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;
    font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  }
  /* Bottom nav */
  .instructor-bottom-nav{
    position:fixed;bottom:0;left:0;right:0;height:64px;
    background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);
    border-top:1px solid rgba(0,86,179,0.10);
    display:flex;align-items:stretch;z-index:1030;
    box-shadow:0 -4px 24px rgba(0,86,179,0.08);
  }
  .bnav-item{
    flex:1;display:flex;flex-direction:column;align-items:center;
    justify-content:center;font-size:10px;font-weight:600;gap:3px;
    text-decoration:none;transition:color .2s;
  }
  .bnav-item i{font-size:19px;}
  /* Responsive */
  @media(max-width:991px){
    .edit-grid{grid-template-columns:1fr!important;}
  }
  @media(max-width:575px){
    .schedule-grid{grid-template-columns:1fr!important;}
    .basic-grid{grid-template-columns:1fr!important;}
  }
`;

const STATUS_STYLE = {
  active:    { bg: "#f0fdf4", color: "#15803d", label: "Active"    },
  scheduled: { bg: "#fff7ed", color: "#c2410c", label: "Scheduled" },
  completed: { bg: "#f0f9ff", color: "#0369a1", label: "Completed" },
  draft:     { bg: "#f1f5f9", color: "#64748b", label: "Draft"     },
};

/* ─── Bottom Nav ─────────────────────────────────────────────────────────── */
const InstructorBottomNav = ({ active }) => {
  const items = [
    { to: "/instructor",                  icon: "bi-speedometer2",      label: "Home"     },
    { to: "/instructor/exams",            icon: "bi-file-earmark-text", label: "Exams"    },
    { to: "/instructor/students",         icon: "bi-people",            label: "Students" },
    { to: "/instructor/account-settings", icon: "bi-gear",              label: "Settings" },
  ];
  return (
    <nav className="instructor-bottom-nav d-lg-none">
      {items.map(({ to, icon, label }) => (
        <Link key={to} to={to} className="bnav-item"
          style={{ color: active === label ? "#0056b3" : "#94a3b8", borderTop: active === label ? "2px solid #0056b3" : "2px solid transparent" }}>
          <i className={`bi ${icon}`}></i>
          {label}
        </Link>
      ))}
    </nav>
  );
};

const ExamEdit = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [courses, setCourses] = useState([]);
  const [exam,    setExam]    = useState(null);

  const [formData, setFormData] = useState({
    course_id:        "",
    title:            "",
    description:      "",
    type:             "quiz",
    start_time:       "",
    end_time:         "",
    duration_minutes: 60,
    status:           "draft",
  });

  const isActive = (to) =>
    to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

  useEffect(() => {
    API.get("/me").then((r) => setUser(r.data.user)).catch(() => {});
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [examRes, coursesRes] = await Promise.all([
        API.get(`/exams/${id}`),
        API.get("/courses"),
      ]);
      const e = examRes.data.exam;
      setExam(e);
      setCourses(coursesRes.data.courses || []);
      setFormData({
        course_id:        e.course_id,
        title:            e.title,
        description:      e.description || "",
        type:             e.type,
        start_time:       utcToLocalInput(e.start_time),
        end_time:         utcToLocalInput(e.end_time),
        duration_minutes: e.duration_minutes,
        status:           e.status,
      });
    } catch {
      Swal.fire("Error!", "Failed to load exam details.", "error");
      navigate("/instructor/exams");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put(`/exams/${id}`, {
        ...formData,
        start_time:       localInputToUTC(formData.start_time),
        end_time:         localInputToUTC(formData.end_time),
        duration_minutes: parseInt(formData.duration_minutes, 10),
      });
      Swal.fire({ icon: "success", title: "Exam updated!", timer: 1400, showConfirmButton: false });
      navigate(`/instructor/exams/${id}`);
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.message || "Failed to update exam.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    navigate("/instructor/login");
  };

  const setField = (key) => (e) => {
    let val;
    if (e.target.type === "number") {
      val = parseInt(e.target.value, 10);
      if (isNaN(val)) val = "";
    } else {
      val = e.target.value;
    }
    setFormData((f) => ({ ...f, [key]: val }));
  };

  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "I";
  const firstName = user?.name?.split(" ")[0] ?? "Instructor";

  const selectedCourse = courses.find((c) => String(c.id) === String(formData.course_id));
  const ss = STATUS_STYLE[formData.status] || STATUS_STYLE.draft;

  const typeOptions = [
    { value: "quiz",    label: "Quiz"    },
    { value: "prelim",  label: "Prelim"  },
    { value: "midterm", label: "Midterm" },
    { value: "final",   label: "Final"   },
  ];
  const statusOptions = [
    { value: "draft",     label: "Draft"     },
    { value: "scheduled", label: "Scheduled" },
    { value: "active",    label: "Active"    },
    { value: "completed", label: "Completed" },
  ];

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f0f4fb" }}>
      <style>{SHARED_CSS}</style>
      <div className="spinner-border" style={{ color: "#0056b3" }} />
    </div>
  );

  return (
    <>
      <style>{SHARED_CSS}</style>
      <div style={{ background: "#f0f4fb", minHeight: "100vh" }}>

        {/* ── Topbar ── */}
        <div className="topbar">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0056b3", letterSpacing: "-.3px", flexShrink: 0 }}>
            SECT Instructor
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <InstructorAlertBell />
            <div className="dropdown">
              <button className="d-flex align-items-center gap-2 dropdown-toggle"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10 }}
                data-bs-toggle="dropdown">
                <div className="dash-avatar">{initial}</div>
                <span className="d-none d-sm-inline" style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{firstName}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius: 12, fontSize: 13 }}>
                <li><Link className="dropdown-item" to="/instructor/account-settings">Account Settings</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile">Profile</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout}
                  style={{ border: "none", background: "none", width: "100%", textAlign: "left" }}>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="d-flex">

          {/* ── Sidebar ── */}
          <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
            style={{ width: 80, minHeight: "calc(100vh - 56px)", position: "sticky", top: 56, alignSelf: "flex-start", flexShrink: 0 }}>
            {NAV_ITEMS.map(({ to, icon, label }) => (
              <Link key={to} to={to} className={`nav-pill ${isActive(to) ? "active" : ""}`}>
                <i className={`bi ${icon}`}></i>{label}
              </Link>
            ))}
          </nav>

          {/* ── Main ── */}
          <main style={{ flex: 1, padding: "24px 20px", paddingBottom: 100, minWidth: 0 }}>

            {/* Breadcrumb */}
            <nav style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", flexWrap: "wrap" }}>
                <Link to="/instructor" style={{ color: "#94a3b8", textDecoration: "none" }}>Dashboard</Link>
                <i className="bi bi-chevron-right" style={{ fontSize: 10 }}></i>
                <Link to="/instructor/exams" style={{ color: "#94a3b8", textDecoration: "none" }}>Exams</Link>
                <i className="bi bi-chevron-right" style={{ fontSize: 10 }}></i>
                {exam && (
                  <>
                    <Link to={`/instructor/exams/${id}`} style={{ color: "#94a3b8", textDecoration: "none" }}>{exam.title}</Link>
                    <i className="bi bi-chevron-right" style={{ fontSize: 10 }}></i>
                  </>
                )}
                <span style={{ color: "#0f172a", fontWeight: 600 }}>Edit</span>
              </div>
            </nav>

            {/* Timezone info banner */}
            <div style={{ padding: "10px 16px", background: "#e8f0fe", borderRadius: 10, border: "1px solid rgba(0,86,179,.15)", marginBottom: 20, fontSize: 13, color: "#0056b3", display: "flex", alignItems: "center", gap: 8 }}>
              <i className="bi bi-clock-history"></i>
              <span>Times are shown in your local timezone <strong>({Intl.DateTimeFormat().resolvedOptions().timeZone})</strong> and will be saved correctly for all users.</span>
            </div>

            {/* Page header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px" }}>Edit Exam</h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Update exam details and scheduling</p>
              </div>
              <Link to={`/instructor/exams/${id}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid rgba(0,86,179,.15)", color: "#64748b", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                <i className="bi bi-arrow-left"></i> Back to Exam
              </Link>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="edit-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>

                {/* Left column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Basic Info */}
                  <div className="dash-card fade-up">
                    <div className="card-section-hdr">
                      <div className="section-icon"><i className="bi bi-info-circle"></i></div>
                      <h3>Basic Information</h3>
                    </div>
                    <div style={{ padding: "20px" }}>
                      <div style={{ marginBottom: 16 }}>
                        <label className="form-lbl">Course <span style={{ color: "#ef4444" }}>*</span></label>
                        <select className="form-ctrl" value={formData.course_id} onChange={setField("course_id")} required>
                          <option value="">Select a course</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>{c.code} – {c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <label className="form-lbl">Exam Title <span style={{ color: "#ef4444" }}>*</span></label>
                        <input type="text" className="form-ctrl"
                          value={formData.title} onChange={setField("title")}
                          placeholder="e.g., Midterm Examination" required />
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <label className="form-lbl">Description</label>
                        <textarea className="form-ctrl" rows={3}
                          value={formData.description} onChange={setField("description")}
                          placeholder="Brief instructions or description for students…"
                          style={{ resize: "vertical" }} />
                      </div>
                      <div className="basic-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label className="form-lbl">Exam Type <span style={{ color: "#ef4444" }}>*</span></label>
                          <select className="form-ctrl" value={formData.type} onChange={setField("type")} required>
                            {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="form-lbl">Status <span style={{ color: "#ef4444" }}>*</span></label>
                          <select className="form-ctrl" value={formData.status} onChange={setField("status")} required>
                            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scheduling */}
                  <div className="dash-card fade-up">
                    <div className="card-section-hdr">
                      <div className="section-icon"><i className="bi bi-calendar-event"></i></div>
                      <h3>Scheduling</h3>
                    </div>
                    <div style={{ padding: "20px" }}>
                      <div className="schedule-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                        <div>
                          <label className="form-lbl">
                            Start Time <span style={{ color: "#ef4444" }}>*</span>
                            <span style={{ color: "#94a3b8", marginLeft: 4, textTransform: "none", fontWeight: 500 }}>(local)</span>
                          </label>
                          <input type="datetime-local" className="form-ctrl"
                            value={formData.start_time} onChange={setField("start_time")} required />
                        </div>
                        <div>
                          <label className="form-lbl">
                            End Time <span style={{ color: "#ef4444" }}>*</span>
                            <span style={{ color: "#94a3b8", marginLeft: 4, textTransform: "none", fontWeight: 500 }}>(local)</span>
                          </label>
                          <input type="datetime-local" className="form-ctrl"
                            value={formData.end_time} onChange={setField("end_time")} required />
                        </div>
                        <div>
                          <label className="form-lbl">Duration (minutes) <span style={{ color: "#ef4444" }}>*</span></label>
                          <input type="number" className="form-ctrl"
                            min={1} max={480} step={1}
                            value={formData.duration_minutes}
                            onChange={setField("duration_minutes")} required />
                          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>Whole numbers only.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Summary */}
                  <div className="dash-card fade-up">
                    <div className="card-section-hdr">
                      <div className="section-icon"><i className="bi bi-eye"></i></div>
                      <h3>Summary</h3>
                    </div>
                    <div style={{ padding: "16px 20px" }}>
                      {[
                        { label: "Course",   value: selectedCourse?.code || "—" },
                        { label: "Type",     value: formData.type ? formData.type.charAt(0).toUpperCase()+formData.type.slice(1) : "—" },
                        { label: "Duration", value: formData.duration_minutes ? `${formData.duration_minutes} min` : "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="summary-row">
                          <span className="summary-label">{label}</span>
                          <span className="summary-value">{value}</span>
                        </div>
                      ))}
                      <div className="summary-row">
                        <span className="summary-label">Status</span>
                        {formData.status && (
                          <span className="status-pill" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                        )}
                      </div>
                      {formData.start_time && (
                        <div className="summary-row">
                          <span className="summary-label">Start</span>
                          <span className="summary-value" style={{ fontSize: 11 }}>{new Date(formData.start_time).toLocaleString()}</span>
                        </div>
                      )}
                      {formData.end_time && (
                        <div className="summary-row">
                          <span className="summary-label">End</span>
                          <span className="summary-value" style={{ fontSize: 11 }}>{new Date(formData.end_time).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="dash-card fade-up">
                    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                      <button type="submit" className="dash-btn-primary" disabled={saving}>
                        {saving
                          ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                          : <><i className="bi bi-check-lg"></i> Save Changes</>}
                      </button>
                      <Link to={`/instructor/exams/${id}`} className="dash-btn-ghost">
                        <i className="bi bi-x"></i> Cancel
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          </main>
        </div>

        <InstructorBottomNav active="Exams" />
      </div>
    </>
  );
};

export default ExamEdit;