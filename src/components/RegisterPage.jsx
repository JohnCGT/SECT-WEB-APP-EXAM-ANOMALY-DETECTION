import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { fetchCsrfToken } from "../lib/api";
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

// ─── Password helpers (ported from AccountSettings) ───────────────────────────

const checkPasswordStrength = password => {
  const checks = {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { checks, passed, total: 5 };
};

const PasswordStrengthBar = ({ password }) => {
  if (!password) return null;
  const { checks, passed } = checkPasswordStrength(password);
  const pct   = (passed / 5) * 100;
  const color = passed <= 2 ? "#ef4444" : passed <= 3 ? "#f59e0b" : passed <= 4 ? "#3b82f6" : "#22c55e";
  const label = passed <= 2 ? "Weak" : passed <= 3 ? "Fair" : passed <= 4 ? "Good" : "Strong";
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 5, borderRadius: 99, background: "#f1f5f9", overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .3s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {[
            { key: "length",  label: "8+ chars"  },
            { key: "upper",   label: "Uppercase"  },
            { key: "lower",   label: "Lowercase"  },
            { key: "number",  label: "Number"     },
            { key: "special", label: "Special"    },
          ].map(({ key, label }) => (
            <span key={key} style={{
              fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 6,
              background: checks[key] ? "#dcfce7" : "#f1f5f9",
              color:      checks[key] ? "#15803d" : "#94a3b8",
            }}>
              {checks[key] ? "✓" : "✗"} {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const RegisterPage = ({ role: fixedRole }) => {
  const [form, setForm] = useState({
    name:                  "",
    email:                 "",
    password:              "",
    password_confirmation: "",
    role:                  fixedRole ?? "student",
  });
  const [errors,        setErrors]        = useState({});
  const [loading,       setLoading]       = useState(false);
  const [mounted,       setMounted]       = useState(false);
  const [showPw,        setShowPw]        = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
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

    // ── Client-side password guards (same logic as AccountSettings) ──
    if (form.password !== form.password_confirmation) {
      Swal.fire("Mismatch", "New passwords do not match.", "warning");
      return;
    }
    const { passed } = checkPasswordStrength(form.password);
    if (passed < 5) {
      Swal.fire(
        "Weak Password",
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
        "warning"
      );
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await fetchCsrfToken();

      const { data } = await API.post("/register", {
        name:                  form.name.trim(),
        email:                 form.email.trim().toLowerCase(),
        password:              form.password,
        password_confirmation: form.password_confirmation,
        role:                  fixedRole ?? form.role,
      });

      const { user } = data;

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

  // Shared form fields rendered in both mobile and desktop layouts
  const renderFields = (idPrefix = "") => (
    <>
      <AuthField
        id={`${idPrefix}name`} label="Full Name" type="text" name="name"
        placeholder="Enter your full name"
        value={form.name} onChange={handleChange}
        autoComplete="name" error={errors.name?.[0]}
        disabled={loading} icon={<i className="bi bi-person" />}
      />
      <AuthField
        id={`${idPrefix}email`} label="Email Address" type="email" name="email"
        placeholder="user@institution.edu"
        value={form.email} onChange={handleChange}
        autoComplete="email" error={errors.email?.[0]}
        disabled={loading} icon={<i className="bi bi-envelope" />}
      />

      {/* ── Password with strength bar ── */}
      <div className="auth-field">
        <label htmlFor={`${idPrefix}password`} className="auth-label">Password</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon"><i className="bi bi-key" /></span>
          <input
            id={`${idPrefix}password`}
            name="password"
            type={showPw ? "text" : "password"}
            className={`auth-input auth-input-pw-toggle ${errors.password ? "auth-input-error" : ""}`}
            placeholder="Min 8 chars · upper · lower · number · special"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
            disabled={loading}
          />
          <button
            type="button"
            className="auth-eye-btn"
            onClick={() => setShowPw(v => !v)}
            tabIndex={-1}
          >
            <i className={`bi bi-eye${showPw ? "-slash" : ""}`} />
          </button>
        </div>
        {errors.password && <span className="auth-error-msg">{errors.password[0]}</span>}
        <PasswordStrengthBar password={form.password} />
      </div>

      {/* ── Confirm Password ── */}
      <div className="auth-field">
        <label htmlFor={`${idPrefix}password_confirmation`} className="auth-label">Confirm Password</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon"><i className="bi bi-key-fill" /></span>
          <input
            id={`${idPrefix}password_confirmation`}
            name="password_confirmation"
            type={showConfirmPw ? "text" : "password"}
            className={`auth-input auth-input-pw-toggle ${
              form.password_confirmation && form.password !== form.password_confirmation
                ? "auth-input-error"
                : ""
            }`}
            placeholder="Repeat new password"
            value={form.password_confirmation}
            onChange={handleChange}
            autoComplete="new-password"
            required
            disabled={loading}
          />
          <button
            type="button"
            className="auth-eye-btn"
            onClick={() => setShowConfirmPw(v => !v)}
            tabIndex={-1}
          >
            <i className={`bi bi-eye${showConfirmPw ? "-slash" : ""}`} />
          </button>
        </div>
        {form.password_confirmation && (
          <p style={{
            margin: "4px 0 0", fontSize: 11, fontWeight: 600,
            color: form.password === form.password_confirmation ? "#22c55e" : "#ef4444",
          }}>
            <i className={`bi bi-${form.password === form.password_confirmation ? "check" : "x"}-circle me-1`} />
            {form.password === form.password_confirmation ? "Passwords match" : "Passwords do not match"}
          </p>
        )}
      </div>

      {/* Role selector — only shown when role is not pre-set */}
      {!fixedRole && (
        <div className="auth-field">
          <label htmlFor={`${idPrefix}role`} className="auth-label">Role</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon"><i className="bi bi-people" /></span>
            <select
              id={`${idPrefix}role`} name="role"
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
    </>
  );

  return (
    <>
      <style>{STYLES}</style>

      {/* ── Mobile layout (hidden on desktop) ── */}
      <div className="mobile-page">
        <MobileHeader />
        <div className={`mobile-form-wrap ${mounted ? "auth-fade-in" : ""}`}>
          <FormCard
            roleLabel={roleLabel}
            badgeIcon="bi-person-plus-fill"
            badgeSuffix="Account"
            title="Create account"
            subtitle="Register to access the SECT platform"
          >
            <form onSubmit={handleSubmit} className="auth-form">
              {renderFields("m-")}
              <SubmitButton loading={loading} label="Register" loadingLabel="Creating account…" icon="bi-person-check" />
            </form>
            <p className="auth-form-footer">
              Already have an account?{" "}
              <Link to={loginLink} className="auth-link">Sign in here</Link>
            </p>
          </FormCard>
        </div>
      </div>

      {/* ── Desktop layout (hidden on mobile) ── */}
      <div className="desktop-page">
        <BrandPanel />

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
              {renderFields()}
              <SubmitButton loading={loading} label="Register" loadingLabel="Creating account…" icon="bi-person-check" />
            </form>

            <p className="auth-form-footer">
              Already have an account?{" "}
              <Link to={loginLink} className="auth-link">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Reusable labeled input with left icon. */
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

/** Loading-aware submit button. */
const SubmitButton = ({ loading, label, loadingLabel, icon }) => (
  <button type="submit" className="auth-btn" disabled={loading}>
    {loading ? (
      <><span className="auth-spinner" />{loadingLabel}</>
    ) : (
      <><i className={`bi ${icon}`} />{label}</>
    )}
  </button>
);

/** Mobile-only top hero bar with branding. */
const MobileHeader = () => (
  <div className="mobile-hero">
    <div className="mobile-hero-inner">
      <div className="mobile-logo-wrap">
        <div className="mobile-logo-icon"><ShieldIcon /></div>
        <div>
          <span className="mobile-wordmark">SECT</span>
          <span className="mobile-tagline">Web Exam Anomaly Detection</span>
        </div>
      </div>
      <div className="mobile-hero-stats">
        {[
          { value: "Online",  label: "Examination" },
          { value: "Anomaly", label: "Detection"   },
          { value: "User",    label: "Monitoring"  },
        ].map(({ value, label }) => (
          <div key={label} className="mobile-stat-chip">
            <span className="mobile-stat-value">{value}</span>
            <span className="mobile-stat-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** Wrapper card used only in the mobile layout. */
const FormCard = ({ roleLabel, badgeIcon, badgeSuffix, title, subtitle, children }) => (
  <div className="mobile-card">
    <div className="auth-form-header">
      <span className="auth-role-badge">
        <i className={`bi ${badgeIcon}`} />
        {roleLabel || "New"} {badgeSuffix}
      </span>
      <h2 className="auth-form-title">{title}</h2>
      <p className="auth-form-sub">{subtitle}</p>
    </div>
    {children}
  </div>
);

/** Desktop left branding panel. */
const BrandPanel = () => (
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
          { icon: "bi-activity",       text: "Behavioral monitoring during exams" },
          { icon: "bi-shield-check",   text: "Anomaly detection for suspicious activity patterns" },
          { icon: "bi-journal-check",  text: "Web-based exam management for college students" },
          { icon: "bi-graph-up-arrow", text: "Flagged anomaly reports generated after submission" },
        ].map(({ icon, text }) => (
          <li key={text} className="auth-feature-item">
            <span className="auth-feature-icon"><i className={`bi ${icon}`} /></span>
            <span>{text}</span>
          </li>
        ))}
      </ul>

      <div className="auth-stats-row">
        {[
          { value: "Online",  label: "Examinations" },
          { value: "Anomaly", label: "Detection"    },
          { value: "User",    label: "Monitoring"   },
        ].map(({ value, label }) => (
          <div key={label} className="auth-stat-chip">
            <span className="auth-stat-value">{value}</span>
            <span className="auth-stat-label">{label}</span>
          </div>
        ))}
      </div>

    </div>
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

const STYLES = `
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

  body, html {
    margin: 0; padding: 0;
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    height: -webkit-fill-available;
  }

  .mobile-page  { display: none; }
  .desktop-page { display: flex; min-height: 100vh; min-height: 100dvh; }

  @media (max-width: 768px) {
    .mobile-page  { display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh; background: #f8faff; }
    .desktop-page { display: none; }
  }

  .mobile-hero {
    background: var(--blue);
    padding: 28px 20px 36px;
    padding-top:   max(28px, env(safe-area-inset-top));
    padding-left:  max(20px, env(safe-area-inset-left));
    padding-right: max(20px, env(safe-area-inset-right));
    position: relative;
    overflow: hidden;
  }

  .mobile-hero::after {
    content: '';
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,.10) 1px, transparent 1px);
    background-size: 22px 22px;
    pointer-events: none;
  }

  .mobile-hero-inner {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; gap: 20px;
  }

  .mobile-logo-wrap { display: flex; align-items: center; gap: 12px; }

  .mobile-logo-icon {
    width: 44px; height: 44px; border-radius: 12px;
    background: rgba(255,255,255,.18);
    border: 1px solid rgba(255,255,255,.28);
    display: flex; align-items: center; justify-content: center;
    color: #fff; flex-shrink: 0;
  }

  .mobile-wordmark {
    display: block;
    font-family: var(--mono); font-size: 1.5rem;
    font-weight: 500; color: #fff; letter-spacing: .12em; line-height: 1;
  }

  .mobile-tagline {
    display: block; font-size: .62rem;
    color: rgba(255,255,255,.65);
    letter-spacing: .05em; text-transform: uppercase; margin-top: 3px;
  }

  .mobile-hero-stats { display: flex; gap: 8px; }

  .mobile-stat-chip {
    flex: 1;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.20);
    border-radius: 10px; padding: 10px 6px;
    text-align: center; backdrop-filter: blur(6px);
  }

  .mobile-stat-value {
    display: block; font-size: .85rem;
    font-weight: 700; color: #fff; line-height: 1;
  }

  .mobile-stat-label {
    display: block; font-size: .6rem;
    color: rgba(255,255,255,.60); margin-top: 3px;
    text-transform: uppercase; letter-spacing: .05em; font-weight: 500;
  }

  .mobile-form-wrap {
    flex: 1;
    overflow-y: auto;
    margin-top: -20px;
    padding: 0 16px 32px;
    padding-bottom: max(32px, env(safe-area-inset-bottom));
    opacity: 0;
    transform: translateY(12px);
    transition: opacity .45s ease, transform .45s ease;
  }

  .mobile-form-wrap.auth-fade-in {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }

  .mobile-card {
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0, 56, 140, .10);
    padding: 28px 20px 24px;
  }

  @media (max-width: 360px) {
    .mobile-hero       { padding: 20px 16px 30px; }
    .mobile-form-wrap  { padding: 0 12px 24px; }
    .mobile-card       { padding: 22px 16px 20px; }
    .mobile-wordmark   { font-size: 1.25rem; }
  }

  .desktop-page { background: var(--blue-xlt); font-family: var(--sans); }

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

  @media (min-width: 769px) and (max-width: 1024px) {
    .auth-brand-panel { width: 40%; padding: 2.5rem 2rem; }
    .auth-wordmark    { font-size: 2rem; }
    .auth-form-panel  { padding: 2rem 1.5rem; }
  }

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

  .auth-form  { display: flex; flex-direction: column; gap: 1.1rem; }
  .auth-field { display: flex; flex-direction: column; gap: .4rem; }

  .auth-label { font-size: .75rem; font-weight: 600; color: var(--text-mid); letter-spacing: .02em; }

  .auth-input-wrap { position: relative; display: flex; align-items: center; }

  .auth-input-icon {
    position: absolute; left: 13px;
    color: var(--slate-lt); font-size: 14px;
    display: flex; pointer-events: none; transition: color .2s;
  }

  .auth-input-wrap:focus-within .auth-input-icon { color: var(--blue); }

  .auth-input {
    width: 100%; background: #fff;
    border: 1px solid rgba(0,86,179,.15); border-radius: 10px;
    padding: .78rem .9rem .78rem 2.5rem;
    font-family: var(--sans);
    font-size: 16px;
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

  /* Extra right padding so text doesn't run under the eye button */
  .auth-input-pw-toggle { padding-right: 2.6rem; }

  .auth-eye-btn {
    position: absolute; right: 12px;
    background: none; border: none; cursor: pointer;
    color: var(--slate-lt); font-size: 15px;
    padding: 0; display: flex; align-items: center;
    transition: color .2s;
  }
  .auth-eye-btn:hover { color: var(--blue); }

  .auth-select { cursor: pointer; }

  .auth-input-error { border-color: #ef4444 !important; }
  .auth-error-msg   { font-size: .78rem; color: #ef4444; }

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

  .auth-spinner {
    width: 15px; height: 15px;
    border: 2px solid rgba(255,255,255,.35);
    border-top-color: #fff; border-radius: 50%;
    display: inline-block;
    animation: auth-spin .7s linear infinite;
  }

  @keyframes auth-spin { to { transform: rotate(360deg); } }

  .auth-form-footer {
    text-align: center; margin-top: 1.5rem;
    font-size: .88rem; color: var(--slate);
  }

  .auth-link {
    color: var(--blue); font-weight: 600;
    text-decoration: none; transition: opacity .2s;
  }

  .auth-link:hover { opacity: .75; }
`;

export default RegisterPage;