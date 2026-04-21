// src/pages/instructor/AccountSettings.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../../api";
import Swal from "sweetalert2";
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

const AccountSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user,       setUser]       = useState(null);
  const [activeTab,  setActiveTab]  = useState("general");
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPw,   setSavingPw]   = useState(false);

  /* ── General form state ── */
  const [infoForm, setInfoForm] = useState({
    name: "", email: "", phone: "", department: "Computer Science", office: "", consultation_hours: "",
  });

  /* ── Password form state ── */
  const [pwForm,        setPwForm]        = useState({ current_password: "", password: "", password_confirmation: "" });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw,     setShowNewPw]     = useState(false);

  /* ── Notification toggles (local only — extend with API as needed) ── */
  const [notifToggles, setNotifToggles] = useState({
    examAlerts: true, cheatingAlerts: true, submissions: true, systemUpdates: false,
  });

  /* ── Monitoring toggles ── */
  const [monitorToggles, setMonitorToggles] = useState({
    tabSwitching: true, keyboardPatterns: true, isolationForest: true, oneClassSVM: true,
  });
  const [sensitivity, setSensitivity] = useState(3);

  /* ── Boot ── */
  useEffect(() => {
    API.get("/me").then((r) => {
      const u = r.data.user;
      setUser(u);
      setInfoForm((f) => ({
        ...f,
        name:  u.name  || "",
        email: u.email || "",
        phone: u.phone || "",
      }));
    }).catch(() => {});
  }, []);

  /* ── Handlers ── */
  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      await API.patch("/admin/profile", { name: infoForm.name, email: infoForm.email });
      Swal.fire({ icon: "success", title: "Saved!", timer: 1400, showConfirmButton: false });
      setUser((u) => ({ ...u, name: infoForm.name, email: infoForm.email }));
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save changes.", "error");
    } finally { setSavingInfo(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.password !== pwForm.password_confirmation) {
      Swal.fire("Mismatch", "New passwords do not match.", "warning"); return;
    }
    setSavingPw(true);
    try {
      await API.patch("/admin/profile", pwForm);
      Swal.fire({ icon: "success", title: "Password updated!", timer: 1400, showConfirmButton: false });
      setPwForm({ current_password: "", password: "", password_confirmation: "" });
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to update password.", "error");
    } finally { setSavingPw(false); }
  };

  const isActive = (to) =>
    to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to);

  const TABS = [
    { key: "general",      label: "General",              icon: "bi-person" },
    { key: "security",     label: "Security",             icon: "bi-shield-lock" },
    { key: "notifications",label: "Notifications",        icon: "bi-bell" },
    { key: "monitoring",   label: "Monitoring Settings",  icon: "bi-camera-video" },
  ];

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

        {/* ── Main ── */}
        <div className="flex-grow-1 p-4 bg-light">

          <div className="mb-4">
            <h4 className="mb-0 fw-bold">Account Settings</h4>
            <p className="text-muted mb-0 small">Manage your profile, security, and preferences</p>
          </div>

          {/* Inner tab nav + content */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
              <ul className="nav nav-tabs border-0">
                {TABS.map(({ key, label, icon }) => (
                  <li key={key} className="nav-item">
                    <button
                      className={`nav-link ${activeTab === key ? "active fw-semibold" : "text-muted"}`}
                      onClick={() => setActiveTab(key)}
                    >
                      <i className={`bi ${icon} me-2`}></i>{label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-body p-4">

              {/* ── GENERAL ── */}
              {activeTab === "general" && (
                <>
                  <h6 className="fw-semibold mb-3">Personal Information</h6>
                  <form onSubmit={handleSaveInfo}>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Full Name</label>
                        <input type="text" className="form-control"
                          value={infoForm.name}
                          onChange={(e) => setInfoForm((f) => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Email Address</label>
                        <input type="email" className="form-control"
                          value={infoForm.email}
                          onChange={(e) => setInfoForm((f) => ({ ...f, email: e.target.value }))} />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Phone Number</label>
                        <input type="tel" className="form-control"
                          placeholder="+63 912 345 6789"
                          value={infoForm.phone}
                          onChange={(e) => setInfoForm((f) => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Department</label>
                        <select className="form-select"
                          value={infoForm.department}
                          onChange={(e) => setInfoForm((f) => ({ ...f, department: e.target.value }))}>
                          <option>Computer Science</option>
                          <option>Information Technology</option>
                          <option>Engineering</option>
                          <option>Mathematics</option>
                        </select>
                      </div>
                    </div>
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Office Location</label>
                        <input type="text" className="form-control"
                          placeholder="Room 305, Engineering Building"
                          value={infoForm.office}
                          onChange={(e) => setInfoForm((f) => ({ ...f, office: e.target.value }))} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Consultation Hours</label>
                        <input type="text" className="form-control"
                          placeholder="Mon-Fri, 2:00 PM - 4:00 PM"
                          value={infoForm.consultation_hours}
                          onChange={(e) => setInfoForm((f) => ({ ...f, consultation_hours: e.target.value }))} />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={savingInfo}>
                      {savingInfo
                        ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                        : <><i className="bi bi-check-lg me-2" />Save Changes</>}
                    </button>
                  </form>
                </>
              )}

              {/* ── SECURITY ── */}
              {activeTab === "security" && (
                <>
                  <h6 className="fw-semibold mb-3">Change Password</h6>
                  <form onSubmit={handleChangePassword} className="mb-4">
                    <div className="row g-3 mb-4">
                      <div className="col-md-12">
                        <label className="form-label fw-semibold small">Current Password</label>
                        <div className="input-group">
                          <input type={showCurrentPw ? "text" : "password"} className="form-control"
                            placeholder="Enter current password"
                            value={pwForm.current_password}
                            onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))} />
                          <button type="button" className="btn btn-outline-secondary"
                            onClick={() => setShowCurrentPw((v) => !v)}>
                            <i className={`bi bi-eye${showCurrentPw ? "-slash" : ""}`}></i>
                          </button>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">New Password</label>
                        <div className="input-group">
                          <input type={showNewPw ? "text" : "password"} className="form-control"
                            placeholder="Min. 8 characters"
                            value={pwForm.password}
                            onChange={(e) => setPwForm((f) => ({ ...f, password: e.target.value }))} />
                          <button type="button" className="btn btn-outline-secondary"
                            onClick={() => setShowNewPw((v) => !v)}>
                            <i className={`bi bi-eye${showNewPw ? "-slash" : ""}`}></i>
                          </button>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">Confirm New Password</label>
                        <input type="password" className="form-control"
                          placeholder="Repeat new password"
                          value={pwForm.password_confirmation}
                          onChange={(e) => setPwForm((f) => ({ ...f, password_confirmation: e.target.value }))} />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={savingPw}>
                      {savingPw
                        ? <><span className="spinner-border spinner-border-sm me-2" />Updating…</>
                        : <><i className="bi bi-lock me-2" />Update Password</>}
                    </button>
                  </form>

                  <hr />

                  <h6 className="fw-semibold mb-3">Two-Factor Authentication</h6>
                  <div className="card bg-light border-0 mb-4">
                    <div className="card-body d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-semibold">Two-Factor Authentication</div>
                        <p className="text-muted mb-0 small">Add an extra layer of security to your account</p>
                      </div>
                      <div className="form-check form-switch mb-0">
                        <input className="form-check-input" type="checkbox" id="2fa" style={{ width: 40, height: 22 }} />
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-semibold mb-3">Login History</h6>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr><th>DATE & TIME</th><th>IP ADDRESS</th><th>DEVICE</th><th>LOCATION</th></tr>
                      </thead>
                      <tbody>
                        {[
                          { date: "Feb 05, 2026 – 8:30 AM", ip: "192.168.1.100", device: "Windows PC – Chrome",    loc: "Manila, PH"      },
                          { date: "Feb 04, 2026 – 2:15 PM", ip: "192.168.1.100", device: "Windows PC – Chrome",    loc: "Manila, PH"      },
                          { date: "Feb 03, 2026 – 9:00 AM", ip: "192.168.1.101", device: "Android – Chrome Mobile",loc: "Quezon City, PH" },
                        ].map((r) => (
                          <tr key={r.date}>
                            <td className="small">{r.date}</td>
                            <td className="small text-muted">{r.ip}</td>
                            <td className="small text-muted">{r.device}</td>
                            <td className="small text-muted">{r.loc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── NOTIFICATIONS ── */}
              {activeTab === "notifications" && (
                <>
                  <h6 className="fw-semibold mb-3">Email Notifications</h6>
                  <div className="card bg-light border-0 mb-4">
                    <div className="card-body">
                      {[
                        { key: "examAlerts",     label: "Exam Alerts",         sub: "Receive notifications when exams start or end"          },
                        { key: "cheatingAlerts", label: "Cheating Alerts",     sub: "Get notified when suspicious behavior is detected"       },
                        { key: "submissions",    label: "Student Submissions",  sub: "Notify when students complete their exams"              },
                        { key: "systemUpdates",  label: "System Updates",      sub: "Receive notifications about maintenance and updates"     },
                      ].map(({ key, label, sub }, idx, arr) => (
                        <div key={key} className={`d-flex justify-content-between align-items-center ${idx < arr.length - 1 ? "mb-3 pb-3 border-bottom" : ""}`}>
                          <div>
                            <div className="fw-semibold small">{label}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>{sub}</div>
                          </div>
                          <div className="form-check form-switch mb-0">
                            <input className="form-check-input" type="checkbox"
                              checked={notifToggles[key]}
                              onChange={() => setNotifToggles((t) => ({ ...t, [key]: !t[key] }))}
                              style={{ width: 40, height: 22 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <h6 className="fw-semibold mb-3">Notification Preferences</h6>
                  <div className="card bg-light border-0">
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold small">Alert Frequency</label>
                          <select className="form-select">
                            <option>Real-time</option>
                            <option>Hourly Digest</option>
                            <option>Daily Summary</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold small">CPI Threshold for Alerts</label>
                          <div className="input-group">
                            <input type="number" className="form-control" defaultValue={50} min={0} max={100} />
                            <span className="input-group-text">%</span>
                          </div>
                          <div className="form-text">Alert when student CPI exceeds this value.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── MONITORING ── */}
              {activeTab === "monitoring" && (
                <>
                  <h6 className="fw-semibold mb-1">Default Exam Monitoring Settings</h6>
                  <p className="text-muted small mb-3">These settings apply to all new exams by default.</p>

                  <div className="card bg-light border-0 mb-4">
                    <div className="card-body">
                      {[
                        { key: "tabSwitching",    label: "Tab Switching Detection",   sub: "Track when students switch browser tabs" },
                        { key: "keyboardPatterns",label: "Keyboard Pattern Analysis",  sub: "Analyze typing patterns and speed"      },
                      ].map(({ key, label, sub }, idx, arr) => (
                        <div key={key} className={`d-flex justify-content-between align-items-center ${idx < arr.length - 1 ? "mb-3 pb-3 border-bottom" : ""}`}>
                          <div>
                            <div className="fw-semibold small">{label}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>{sub}</div>
                          </div>
                          <div className="form-check form-switch mb-0">
                            <input className="form-check-input" type="checkbox"
                              checked={monitorToggles[key]}
                              onChange={() => setMonitorToggles((t) => ({ ...t, [key]: !t[key] }))}
                              style={{ width: 40, height: 22 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <h6 className="fw-semibold mb-3">Anomaly Detection Algorithms</h6>
                  <div className="card bg-light border-0 mb-4">
                    <div className="card-body">
                      {[
                        { key: "isolationForest", label: "Isolation Forest (IF)",  sub: "Primary anomaly detection method"   },
                        { key: "oneClassSVM",     label: "One-Class SVM",          sub: "Secondary validation method"        },
                      ].map(({ key, label, sub }, idx, arr) => (
                        <div key={key} className={`d-flex justify-content-between align-items-center ${idx < arr.length - 1 ? "mb-3 pb-3 border-bottom" : ""}`}>
                          <div>
                            <div className="fw-semibold small">{label}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>{sub}</div>
                          </div>
                          <div className="form-check form-switch mb-0">
                            <input className="form-check-input" type="checkbox"
                              checked={monitorToggles[key]}
                              onChange={() => setMonitorToggles((t) => ({ ...t, [key]: !t[key] }))}
                              style={{ width: 40, height: 22 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <h6 className="fw-semibold mb-3">Detection Sensitivity</h6>
                  <div className="card bg-light border-0 mb-4">
                    <div className="card-body">
                      <label className="form-label fw-semibold small">
                        Sensitivity: <span className="text-primary">{["", "Low", "Low-Medium", "Medium", "Medium-High", "High"][sensitivity]}</span>
                      </label>
                      <input type="range" className="form-range" min={1} max={5}
                        value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} />
                      <div className="d-flex justify-content-between">
                        <small className="text-muted">Low (fewer alerts)</small>
                        <small className="text-muted">Medium</small>
                        <small className="text-muted">High (more alerts)</small>
                      </div>
                    </div>
                  </div>

                  <button className="btn btn-primary">
                    <i className="bi bi-check-lg me-2"></i>Save Monitoring Settings
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;