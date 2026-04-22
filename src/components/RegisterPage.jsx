import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { fetchCsrfToken } from "../api";
import Swal from "sweetalert2";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_ROUTES = {
  admin:      "/admin",
  instructor: "/instructor/exams",
  student:    "/student",
};

const LOGIN_LINKS = {
  instructor: "/instructor/login",
  student:    "/",
};

// ─── Component ────────────────────────────────────────────────────────────────

const RegisterPage = ({ role: fixedRole }) => {
  const [form, setForm] = useState({
    name:     "",
    email:    "",
    password: "",
    role:     fixedRole ?? "student",
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setMounted(true); }, []);

  const roleLabel = fixedRole ? capitalize(fixedRole) : "";
  const loginLink = LOGIN_LINKS[fixedRole] ?? "/";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev)   => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null  }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await fetchCsrfToken();

      const { data } = await API.post("/register", {
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        role:     fixedRole ?? form.role,
      });

      const { user } = data;
      localStorage.setItem("user", JSON.stringify(user));

      await Swal.fire({
        icon: "success", title: "Registration Successful!",
        text: `Welcome to SECT, ${user.name}!`,
        timer: 1500, showConfirmButton: false,
      });

      navigate(ROLE_ROUTES[user.role] ?? "/");

    } catch (err) {
      console.error("Register error:", err);

      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
        await Swal.fire({
          icon: "error", title: "Validation Error",
          text: err.response.data.message ?? "Please fix the errors below.",
        });
      } else {
        await Swal.fire({
          icon: "error", title: "Registration Failed",
          text: err.response?.data?.message ?? "Something went wrong. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      {/* ── Mobile-only top bar ── */}
      <div className="auth-mobile-header">
        <div className="auth-mobile-logo">
          <div className="auth-mobile-logo-icon"><ShieldIcon /></div>
          <div>
            <span className="auth-mobile-wordmark">SECT</span>
            <span className="auth-mobile-tagline">Web Exam Anomaly Detection</span>
          </div>
        </div>
      </div>

      <div className="auth-page">

        {/* ── Left branding panel (desktop only) ── */}
        <div className="auth-brand-panel">
          <div className="auth-brand-inner">

            <div className="auth-logo">
              <div className="auth-logo-icon"><ShieldIcon /></div>
              <div>
                <h1 className="auth-wordmark">SECT</h1>
                <p className="auth-tagline">Web Exam Anomaly Detection</p>
              </div>
            </div>

            <div className="auth-brand-divider" />

            <ul className="auth-features">
              {[
                { icon: "bi-activity",       text: "Real-time behavioral monitoring" },
                { icon: "bi-cpu",            text: "AI-powered anomaly detection"    },
                { icon: "bi-shield-check",   text: "Secure exam integrity assurance" },
                { icon: "bi-graph-up-arrow", text: "Detailed performance analytics"  },
              ].map(({ icon, text }) => (
                <li key={text} className="auth-feature-item">
                  <span className="auth-feature-icon"><i className={`bi ${icon}`} /></span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div className="auth-stats-row">
              {[
                { value: "99%",       label: "Accuracy"  },
                { value: "Real-time", label: "Detection" },
                { value: "Secure",    label: "Platform"  },
              ].map(({ value, label }) => (
                <div key={label} className="auth-stat-chip">
                  <span className="auth-stat-value">{value}</span>
                  <span className="auth-stat-label">{label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Form panel ── */}
        <div className={`auth-form-panel ${mounted ? "auth-fade-in" : ""}`}>
          <div className="auth-form-card">

            <div className="auth-form-header">
              <span className="auth-role-badge">
                <i className="bi bi-person-plus-fill" />
                {roleLabel || "New"} Account
              </span>
              <h2 className="auth-form-title">Create account</h2>
              <p className="auth-form-sub">Register to access the SECT platform</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <AuthField
                id="name" label="Full Name" type="text" name="name"
                placeholder="Enter your full name"
                value={form.name} onChange={handleChange}
                autoComplete="name"
                error={errors.name?.[0]} disabled={loading}
                icon={<i className="bi bi-person" />}
              />
              <AuthField
                id="email" label="Email Address" type="email" name="email"
                placeholder="user@institution.edu"
                value={form.email} onChange={handleChange}
                autoComplete="email" error={errors.email?.[0]}
                disabled={loading} icon={<i className="bi bi-envelope" />}
              />
              <AuthField
                id="password" label="Password" type="password" name="password"
                placeholder="Min 8 chars · upper · lower · number · special"
                value={form.password} onChange={handleChange}
                autoComplete="new-password" error={errors.password?.[0]}
                disabled={loading} icon={<i className="bi bi-key" />}
              />

              {/* Role selector — only shown when role is not pre-set */}
              {!fixedRole && (
                <div className="auth-field">
                  <label htmlFor="role" className="auth-label">Role</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><i className="bi bi-people" /></span>
                    <select
                      id="role" name="role"
                      className={`auth-input auth-select ${errors.role ? "auth-input-error" : ""}`}
                      value={form.role} onChange={handleChange}
                      required disabled={loading}
                    >
                      <option value="student">Student</option>
                    </select>
                  </div>
                  {errors.role && <span className="auth-error-msg">{errors.role[0]}</span>}
                </div>
              )}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <><span className="auth-spinner" />Creating account…</>
                ) : (
                  <><i className="bi bi-person-check" />Register</>
                )}
              </button>
            </form>

            <p className="auth-form-footer">
              Already have an account?{" "}
              <Link to={loginLink} className="auth-link">Sign in here</Link>
            </p>

            <p className="auth-system-note">
              <i className="bi bi-shield-lock" />
              SECT v2.0 · All sessions are monitored
            </p>

          </div>
        </div>

      </div>
    </>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const AuthField = ({ id, label, icon, error, ...inputProps }) => (
  <div className="auth-field">
    <label htmlFor={id} className="auth-label">{label}</label>
    <div className="auth-input-wrap">
      <span className="auth-input-icon">{icon}</span>
      <input
        id={id}
        className={`auth-input ${error ? "auth-input-error" : ""}`}
        required
        {...inputProps}
      />
    </div>
    {error && <span className="auth-error-msg">{error}</span>}
  </div>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="26" height="26">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l7 4v5c0 5-3.5 9.5-7 11C8.5 20.5 5 16 5 11V6l7-4z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// ─── Styles ───────────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --blue:      #0056b3;
    --blue-mid:  #1a6ed8;
    --blue-lite: #e8f0fe;
    --blue-xlt:  #f0f4fb;
    --slate:     #64748b;
    --slate-lt:  #94a3b8;
    --text-dark: #0f172a;
    --text-mid:  #1e293b;
    --sans:      'DM Sans', system-ui, sans-serif;
    --mono:      'DM Mono', monospace;
  }

  html { height: -webkit-fill-available; }

  body, html {
    margin: 0; padding: 0;
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  /* ── Mobile top bar ──────────────────────────── */
  .auth-mobile-header {
    display: none;
    background: var(--blue);
    padding: 14px 20px;
    padding-top:   max(14px, env(safe-area-inset-top));
    padding-left:  max(20px, env(safe-area-inset-left));
    padding-right: max(20px, env(safe-area-inset-right));
  }

  .auth-mobile-logo { display: flex; align-items: center; gap: 12px; }

  .auth-mobile-logo-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: rgba(255,255,255,.18);
    border: 1px solid rgba(255,255,255,.28);
    display: flex; align-items: center; justify-content: center;
    color: #fff; flex-shrink: 0;
  }

  .auth-mobile-wordmark {
    display: block; font-family: var(--mono);
    font-size: 1.3rem; font-weight: 500; color: #fff;
    letter-spacing: .12em; line-height: 1;
  }

  .auth-mobile-tagline {
    display: block; font-size: .65rem;
    color: rgba(255,255,255,.65);
    letter-spacing: .05em; text-transform: uppercase; margin-top: 2px;
  }

  /* ── Page wrapper ────────────────────────────── */
  .auth-page {
    display: flex;
    min-height: 100vh;
    min-height: 100dvh;
    background: var(--blue-xlt);
    font-family: var(--sans);
  }

  /* ── Brand panel ─────────────────────────────── */
  .auth-brand-panel {
    width: 46%;
    background: var(--blue);
    position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    padding: 3rem 3.5rem;
    min-height: 100vh; min-height: 100dvh;
  }

  .auth-brand-panel::before {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 10% 10%, rgba(255,255,255,.10), transparent),
      radial-gradient(ellipse 60% 80% at 90% 90%, rgba(0,30,80,.35),     transparent);
    pointer-events: none;
  }

  .auth-brand-panel::after {
    content: ''; position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,.12) 1px, transparent 1px);
    background-size: 28px 28px; pointer-events: none;
  }

  .auth-brand-inner {
    position: relative; z-index: 1;
    display: flex; flex-direction: column;
    gap: 1.5rem; width: 100%; max-width: 340px;
  }

  .auth-logo { display: flex; align-items: center; gap: 14px; }

  .auth-logo-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: rgba(255,255,255,.15);
    border: 1px solid rgba(255,255,255,.25);
    display: flex; align-items: center; justify-content: center;
    color: #fff; backdrop-filter: blur(8px); flex-shrink: 0;
  }

  .auth-wordmark {
    font-family: var(--mono); font-size: 2.4rem;
    font-weight: 500; color: #fff; letter-spacing: .12em; line-height: 1;
  }

  .auth-tagline {
    font-size: .72rem; color: rgba(255,255,255,.65);
    letter-spacing: .06em; text-transform: uppercase; margin-top: 3px;
  }

  .auth-brand-divider { width: 100%; height: 1px; background: rgba(255,255,255,.15); }

  .auth-features { list-style: none; display: flex; flex-direction: column; gap: .85rem; }

  .auth-feature-item {
    display: flex; align-items: center; gap: 12px;
    font-size: .85rem; color: rgba(255,255,255,.85); font-weight: 500;
  }

  .auth-feature-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; color: #fff; flex-shrink: 0;
  }

  .auth-stats-row { display: flex; gap: 10px; }

  .auth-stat-chip {
    flex: 1; background: rgba(255,255,255,.10);
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 12px; padding: 12px 10px;
    text-align: center; backdrop-filter: blur(6px);
  }

  .auth-stat-value {
    display: block; font-size: .9rem;
    font-weight: 700; color: #fff; line-height: 1;
  }

  .auth-stat-label {
    display: block; font-size: .65rem;
    color: rgba(255,255,255,.60); margin-top: 4px;
    text-transform: uppercase; letter-spacing: .05em; font-weight: 500;
  }

  /* ── Form panel ──────────────────────────────── */
  .auth-form-panel {
    flex: 1; display: flex;
    align-items: center; justify-content: center;
    overflow-y: auto;
    padding: 2.5rem 2rem;
    padding-bottom: max(2.5rem, env(safe-area-inset-bottom));
    opacity: 0; transform: translateX(20px);
    transition: opacity .5s ease, transform .5s ease;
  }

  .auth-fade-in { opacity: 1 !important; transform: translateX(0) !important; }

  .auth-form-card { width: 100%; max-width: 400px; }

  .auth-form-header { margin-bottom: 2rem; }

  .auth-role-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: .68rem; font-weight: 700;
    color: var(--blue); background: var(--blue-lite);
    border: 1px solid rgba(0,86,179,.18);
    border-radius: 99px; padding: 4px 12px;
    letter-spacing: .06em; text-transform: uppercase;
    margin-bottom: 1rem;
  }

  .auth-form-title {
    font-size: 1.85rem; font-weight: 700;
    color: var(--text-dark); letter-spacing: -.03em; line-height: 1.15;
  }

  .auth-form-sub { margin-top: .45rem; font-size: .84rem; color: var(--slate); }

  /* ── Fields ──────────────────────────────────── */
  .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }
  .auth-field { display: flex; flex-direction: column; gap: .4rem; }

  .auth-label { font-size: .75rem; font-weight: 600; color: var(--text-mid); letter-spacing: .02em; }

  .auth-input-wrap { position: relative; display: flex; align-items: center; }

  .auth-input-icon {
    position: absolute; left: 13px; color: var(--slate-lt);
    font-size: 14px; display: flex; pointer-events: none; transition: color .2s;
  }

  .auth-input-wrap:focus-within .auth-input-icon { color: var(--blue); }

  .auth-input {
    width: 100%; background: #fff;
    border: 1px solid rgba(0,86,179,.15); border-radius: 10px;
    padding: .78rem .9rem .78rem 2.5rem;
    font-family: var(--sans);
    font-size: 16px; /* prevents iOS zoom */
    color: var(--text-dark); outline: none;
    transition: border-color .2s, box-shadow .2s;
    box-shadow: 0 1px 2px rgba(0,0,0,.04);
    -webkit-appearance: none; appearance: none;
  }

  .auth-input::placeholder { color: var(--slate-lt); }

  .auth-input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(0,86,179,.10);
  }

  .auth-select { cursor: pointer; }

  .auth-input-error { border-color: #ef4444 !important; }
  .auth-error-msg { font-size: .78rem; color: #ef4444; }

  /* ── Button ──────────────────────────────────── */
  .auth-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: .88rem; margin-top: .5rem;
    background: var(--blue); border: none; border-radius: 10px;
    color: #fff; font-family: var(--sans);
    font-size: 1rem; font-weight: 700; letter-spacing: .01em;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0,86,179,.30);
    transition: background .2s, box-shadow .2s, transform .1s;
    touch-action: manipulation;
  }

  .auth-btn:hover:not(:disabled) {
    background: var(--blue-mid);
    box-shadow: 0 6px 20px rgba(0,86,179,.38);
    transform: translateY(-1px);
  }

  .auth-btn:active:not(:disabled) { transform: translateY(0); }
  .auth-btn:disabled { opacity: .6; cursor: not-allowed; }

  /* ── Spinner ─────────────────────────────────── */
  .auth-spinner {
    width: 15px; height: 15px;
    border: 2px solid rgba(255,255,255,.35);
    border-top-color: #fff; border-radius: 50%;
    display: inline-block;
    animation: auth-spin .7s linear infinite;
  }

  @keyframes auth-spin { to { transform: rotate(360deg); } }

  /* ── Footer ──────────────────────────────────── */
  .auth-form-footer {
    text-align: center; margin-top: 1.5rem;
    font-size: .88rem; color: var(--slate);
  }

  .auth-link {
    color: var(--blue); font-weight: 600;
    text-decoration: none; transition: opacity .2s;
  }

  .auth-link:hover { opacity: .75; }

  .auth-system-note {
    display: flex; align-items: center;
    justify-content: center; gap: 5px;
    margin-top: 2rem;
    font-size: .7rem; color: var(--slate-lt); letter-spacing: .04em;
  }

  /* ════════════════════════════════════════════
     RESPONSIVE BREAKPOINTS
  ════════════════════════════════════════════ */

  /* ── Tablet (769–1024px) ─────────────────── */
  @media (min-width: 769px) and (max-width: 1024px) {
    .auth-brand-panel { width: 40%; padding: 2.5rem 2rem; }
    .auth-wordmark    { font-size: 2rem; }
    .auth-form-panel  { padding: 2rem 1.5rem; }
  }

  /* ── Mobile (≤768px) ─────────────────────── */
  @media (max-width: 768px) {
    .auth-mobile-header { display: block; }
    .auth-brand-panel   { display: none; }

    .auth-page {
      flex-direction: column;
      background: #fff;
      min-height: calc(100vh - 66px);
      min-height: calc(100dvh - 66px);
    }

    .auth-form-panel {
      flex: 1;
      align-items: flex-start;
      padding: 2rem 1.25rem;
      padding-bottom: max(2rem, env(safe-area-inset-bottom));
      background: #fff;
      opacity: 1;
      transform: none;
      transition: none;
    }

    .auth-form-card { max-width: 100%; }

    .auth-form-title { font-size: 1.6rem; }
    .auth-input      { padding: .82rem .9rem .82rem 2.5rem; }
    .auth-btn        { padding: .95rem; }
  }

  /* ── Very small phones (≤360px) ─────────── */
  @media (max-width: 360px) {
    .auth-mobile-header   { padding: 12px 16px; }
    .auth-form-panel      { padding: 1.5rem 1rem; }
    .auth-form-title      { font-size: 1.4rem; }
    .auth-form-header     { margin-bottom: 1.5rem; }
    .auth-mobile-wordmark { font-size: 1.1rem; }
  }
`;

export default RegisterPage;