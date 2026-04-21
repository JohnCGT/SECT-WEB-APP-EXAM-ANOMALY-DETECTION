import React, { useState, useEffect, useMemo } from "react";
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
  { to: "/instructor/reports",          icon: "bi-bar-chart",            label: "Reports"   },
  { to: "/instructor/support",          icon: "bi-headset",              label: "Support"   },
  { to: "/instructor/account-settings", icon: "bi-gear",                 label: "Settings"  },
];

const STATUS_BADGE = {
  active:    "bg-success",
  scheduled: "bg-warning text-dark",
  completed: "bg-info",
  draft:     "bg-secondary",
};

const STAT_TABS = (stats) => [
  { key:"all",       label:"Total",     value:stats.total,     color:"primary",   icon:"bi-file-earmark-text" },
  { key:"active",    label:"Active",    value:stats.active,    color:"success",   icon:"bi-play-circle"       },
  { key:"scheduled", label:"Scheduled", value:stats.scheduled, color:"warning",   icon:"bi-calendar-event"    },
  { key:"completed", label:"Completed", value:stats.completed, color:"info",      icon:"bi-check-circle"      },
  { key:"draft",     label:"Draft",     value:stats.draft,     color:"secondary", icon:"bi-pencil-square"     },
];

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════════ */
const ExamPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [courses, setCourses]         = useState([]);
  const [exams, setExams]             = useState([]);
  const [showExamModal, setShowExamModal] = useState(false);
  const [displayCount, setDisplayCount]  = useState(20);
  const [searchQuery, setSearchQuery]    = useState("");
  const [statusFilter, setStatusFilter]  = useState("all");

  const CACHE_KEY      = "examPageData";
  const CACHE_DURATION = 5 * 60 * 1000;

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
              setUser(data.user); setCourses(data.courses); setExams(data.exams);
              setLoading(false); setDataLoading(false); return;
            }
          } catch { localStorage.removeItem(CACHE_KEY); }
        }
        const userRes = await API.get("/me");
        setUser(userRes.data.user);
        setLoading(false);
        const [coursesRes, examsRes] = await Promise.all([API.get("/courses"), API.get("/exams")]);
        const data = {
          user:    userRes.data.user,
          courses: coursesRes.data.courses || [],
          exams:   examsRes.data.exams     || [],
        };
        setCourses(data.courses); setExams(data.exams);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      } catch {
        Swal.fire({ icon:"error", title:"Failed to load data", text:"Please refresh and try again." });
      } finally { setLoading(false); setDataLoading(false); }
    };
    fetchData();
  }, []);

  const clearCache = () => localStorage.removeItem(CACHE_KEY);

  const stats = useMemo(() => ({
    total:     exams.length,
    active:    exams.filter(e => e.status === "active").length,
    scheduled: exams.filter(e => e.status === "scheduled").length,
    completed: exams.filter(e => e.status === "completed").length,
    draft:     exams.filter(e => e.status === "draft").length,
  }), [exams]);

  const filteredExams = useMemo(() => {
    let list = exams;
    if (statusFilter !== "all") list = list.filter(e => e.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.course?.name?.toLowerCase().includes(q) ||
        e.course?.code?.toLowerCase().includes(q) ||
        e.type?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [exams, searchQuery, statusFilter]);

  const handleDeleteExam = async (examId) => {
    const result = await Swal.fire({
      title:"Delete this exam?", text:"This cannot be undone.", icon:"warning",
      showCancelButton:true, confirmButtonColor:"#d33", confirmButtonText:"Yes, delete it!",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/exams/${examId}`);
      setExams(exams.filter(e => e.id !== examId));
      clearCache();
      Swal.fire("Deleted!", "Exam has been deleted.", "success");
    } catch { Swal.fire("Error!", "Failed to delete exam.", "error"); }
  };

  const isActive = (to) =>
    to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status"/>
    </div>
  );

  return (
    <div className="d-flex flex-column min-vh-100">

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold text-primary" href="#">SECT Instructor</a>
          <div className="d-flex mx-auto" style={{ width:"40%" }}>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input className="form-control border-start-0" type="search" placeholder="Search exams…"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
              {searchQuery && (
                <button className="btn btn-outline-secondary" onClick={() => setSearchQuery("")}>
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <InstructorAlertBell />
            <div className="dropdown">
              <button className="btn btn-light dropdown-toggle fw-bold" type="button" data-bs-toggle="dropdown">
                <i className="bi bi-person-circle me-2"></i>{user?.name || "Instructor"}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><Link className="dropdown-item" to="/instructor/account-settings"><i className="bi bi-gear me-2"></i>Account Settings</Link></li>
                <li><Link className="dropdown-item" to="/instructor/profile"><i className="bi bi-person me-2"></i>Profile</Link></li>
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
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="mb-0 fw-bold">Exam Management</h4>
              <small className="text-muted">Create and manage your exams</small>
            </div>
            <div className="d-flex gap-2">
              <Link to="/instructor/courses" className="btn btn-outline-primary">
                <i className="bi bi-book me-2"></i>Manage Courses
              </Link>
              <button className="btn btn-primary" onClick={() => setShowExamModal(true)}>
                <i className="bi bi-plus-circle me-2"></i>New Exam
              </button>
            </div>
          </div>

          {dataLoading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"/></div>
          ) : (
            <>
              {/* Stat Pill Bar */}
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body py-2 px-3">
                  <div className="d-flex align-items-center flex-wrap gap-1">
                    {STAT_TABS(stats).map(({ key, label, value, color, icon }, idx, arr) => (
                      <React.Fragment key={key}>
                        <button
                          className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-pill border-0 ${statusFilter===key?`btn-${color}`:"btn-light"}`}
                          onClick={() => setStatusFilter(key)}
                          style={{ transition:"all 0.15s" }}
                        >
                          <i className={`bi ${icon} ${statusFilter!==key?`text-${color}`:""}`}></i>
                          <span className={`small fw-semibold ${statusFilter!==key?"text-muted":""}`}>{label}</span>
                          <span className={`badge rounded-pill ms-1 ${statusFilter===key?"bg-white text-dark":`bg-${color} bg-opacity-15 text-${color}`}`} style={{fontSize:11}}>
                            {value}
                          </span>
                        </button>
                        {idx < arr.length-1 && <div className="vr" style={{height:22,opacity:0.3}}></div>}
                      </React.Fragment>
                    ))}
                    <span className="ms-auto text-muted small">{filteredExams.length} of {exams.length} shown</span>
                  </div>
                </div>
              </div>

              {/* Exams Table */}
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-semibold">All Exams</h6>
                  {filteredExams.length === 0 && exams.length > 0 && (
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => { setStatusFilter("all"); setSearchQuery(""); }}>
                      <i className="bi bi-x-circle me-1"></i>Clear filters
                    </button>
                  )}
                </div>
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>EXAM NAME</th><th>COURSE</th><th>TYPE</th>
                        <th>START TIME</th><th>DURATION</th><th>QUESTIONS</th>
                        <th>STATUS</th><th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExams.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-5">
                            <i className="bi bi-file-earmark-x fs-1 text-muted d-block mb-2"></i>
                            <span className="text-muted">
                              {searchQuery || statusFilter !== "all" ? "No exams match your search or filter." : "No exams yet."}
                            </span>
                            {!searchQuery && statusFilter === "all" && (
                              <div className="mt-3">
                                <button className="btn btn-primary btn-sm" onClick={() => setShowExamModal(true)}>
                                  <i className="bi bi-plus-circle me-2"></i>Create your first exam
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : filteredExams.slice(0, displayCount).map(exam => (
                        <tr key={exam.id}>
                          <td>
                            <Link to={`/instructor/exams/${exam.id}`} className="fw-semibold text-decoration-none text-dark">
                              {exam.title}
                            </Link>
                          </td>
                          <td>
                            <Link to={`/instructor/courses/${exam.course?.id}`} className="text-decoration-none text-muted small">
                              <i className="bi bi-folder2 me-1"></i>{exam.course?.code} — {exam.course?.name}
                            </Link>
                          </td>
                          <td><span className="badge bg-secondary text-capitalize">{exam.type}</span></td>
                          <td className="text-muted small">{new Date(exam.start_time).toLocaleString()}</td>
                          <td className="text-muted small">{exam.duration_minutes} min</td>
                          <td className="text-center fw-semibold">{exam.questions_count || 0}</td>
                          <td><span className={`badge ${STATUS_BADGE[exam.status]||"bg-secondary"} text-capitalize`}>{exam.status}</span></td>
                          <td>
                            <div className="d-flex gap-1">
                              <Link to={`/instructor/exams/${exam.id}`}      className="btn btn-sm btn-outline-primary"   title="View"><i className="bi bi-eye"></i></Link>
                              <Link to={`/instructor/exams/${exam.id}/edit`} className="btn btn-sm btn-outline-secondary" title="Edit"><i className="bi bi-pencil"></i></Link>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteExam(exam.id)} title="Delete"><i className="bi bi-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredExams.length > displayCount && (
                  <div className="card-footer bg-white text-center border-top">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => setDisplayCount(p => p + 20)}>
                      Load more ({filteredExams.length - displayCount} remaining)
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <CreateExamModal
        show={showExamModal}
        onHide={() => setShowExamModal(false)}
        courses={courses}
        onSuccess={newExam => {
          setExams([newExam, ...exams]);
          setShowExamModal(false);
          clearCache();
          navigate(`/instructor/exams/${newExam.id}`, { state:{ openAddQuestion:true } });
        }}
      />
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   CREATE EXAM MODAL
════════════════════════════════════════════════════════════════════════════ */
const CreateExamModal = ({ show, onHide, courses, onSuccess }) => {
  const [formData, setFormData] = useState({
    course_id:"", title:"", description:"", type:"quiz",
    start_time:"", end_time:"", duration_minutes:60,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleStartOrDuration = (field, value) => {
    const updated = { ...formData, [field]:value };
    if (updated.start_time && updated.duration_minutes) {
      try {
        const end = new Date(new Date(updated.start_time).getTime() + updated.duration_minutes * 60000);
        const p = n => String(n).padStart(2, "0");
        updated.end_time = `${end.getFullYear()}-${p(end.getMonth()+1)}-${p(end.getDate())}T${p(end.getHours())}:${p(end.getMinutes())}`;
      } catch {}
    }
    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await API.post("/exams", formData);
      Swal.fire({ icon:"success", title:"Exam Created!", timer:2000, showConfirmButton:false });
      onSuccess(res.data.exam);
      setFormData({ course_id:"", title:"", description:"", type:"quiz", start_time:"", end_time:"", duration_minutes:60 });
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.message || "Failed to create exam", "error");
    } finally { setSubmitting(false); }
  };

  if (!show) return null;
  const hasCourses = courses.length > 0;

  return (
    <div className="modal show d-block" style={{backgroundColor:"rgba(0,0,0,0.5)"}}
      onClick={e => { if (e.target === e.currentTarget) onHide(); }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <div>
              <h5 className="modal-title fw-bold"><i className="bi bi-file-earmark-plus me-2 text-primary"></i>Create New Exam</h5>
              <p className="text-muted small mb-0">Set up an exam for one of your courses</p>
            </div>
            <button type="button" className="btn-close" onClick={onHide} disabled={submitting}/>
          </div>
          {!hasCourses && (
            <div className="mx-3 mt-3">
              <div className="alert alert-warning py-2 mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle"></i>
                <span>No courses yet. <Link to="/instructor/courses" className="fw-semibold">Create a course first</Link> before adding an exam.</span>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="modal-body pt-3">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Course <span className="text-danger">*</span></label>
                  <select className="form-select" value={formData.course_id}
                    onChange={e => setFormData({...formData,course_id:e.target.value})}
                    required disabled={submitting||!hasCourses}>
                    <option value="">{hasCourses?"Select a course…":"No courses available"}</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                  </select>
                </div>
                <div className="col-md-8">
                  <label className="form-label fw-semibold">Exam Title <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" placeholder="e.g., Midterm Examination"
                    value={formData.title} onChange={e => setFormData({...formData,title:e.target.value})} required disabled={submitting}/>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Type <span className="text-danger">*</span></label>
                  <select className="form-select" value={formData.type}
                    onChange={e => setFormData({...formData,type:e.target.value})} required disabled={submitting}>
                    <option value="quiz">Quiz</option>
                    <option value="prelim">Prelim</option>
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Duration (min) <span className="text-danger">*</span></label>
                  <input type="number" className="form-control" min="1" value={formData.duration_minutes}
                    onChange={e => handleStartOrDuration("duration_minutes", parseInt(e.target.value))} required disabled={submitting}/>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Start Time <span className="text-danger">*</span></label>
                  <input type="datetime-local" className="form-control" value={formData.start_time}
                    onChange={e => handleStartOrDuration("start_time", e.target.value)} required disabled={submitting}/>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">End Time <span className="text-danger">*</span></label>
                  <input type="datetime-local" className="form-control" value={formData.end_time}
                    onChange={e => setFormData({...formData,end_time:e.target.value})} required disabled={submitting}/>
                  <div className="form-text"><i className="bi bi-magic me-1"></i>Auto-set from start + duration</div>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea className="form-control" rows="2" placeholder="Optional instructions for students"
                    value={formData.description} onChange={e => setFormData({...formData,description:e.target.value})} disabled={submitting}/>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-light" onClick={onHide} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={submitting||!hasCourses}>
                {submitting ? <><span className="spinner-border spinner-border-sm me-2"/>Creating…</> : <><i className="bi bi-check2 me-2"></i>Create Exam</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;