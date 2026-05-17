import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../lib/api";
import Swal from "sweetalert2";
import TypingTest from "./TypingTest";

const TypingTestPage = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  const handleComplete = async (ikis) => {
    try {
      setSaving(true);
      await API.post("/student/typing-baseline", { flight_times_ms: ikis });
      setDone(true);
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save baseline.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: "#f0f4fb", minHeight: "100vh",
      display: "flex", flexDirection: "column"
    }}>

      {/* ── Minimal topbar ── */}
      <div style={{
        background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,86,179,.08)",
        padding: "12px 20px", display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 100
      }}>
        <button onClick={() => navigate("/student")} style={{
          background: "#f1f5f9", border: "none", borderRadius: 9,
          padding: "7px 12px", cursor: "pointer", display: "flex",
          alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600,
          color: "#64748b", fontFamily: "'DM Sans', sans-serif",
          transition: "background .15s"
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
          onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
        >
          <i className="bi bi-arrow-left" style={{ fontSize: 14 }}></i>
          Back to Dashboard
        </button>
        <span style={{
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
          fontSize: 15, color: "#0056b3"
        }}>
          SECT Portal
        </span>
      </div>

      {/* ── Content ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 24
      }}>
        <div style={{ maxWidth: 600, width: "100%" }}>

          {/* Page heading */}
          {!done && (
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <span style={{
                background: "#e8f0fe", color: "#0056b3", borderRadius: 99,
                padding: "4px 14px", fontSize: 12, fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif"
              }}>
                OPTIONAL UPDATE
              </span>
              <h1 style={{
                margin: "12px 0 6px", fontSize: 22, fontWeight: 700,
                color: "#0f172a", fontFamily: "'DM Sans', sans-serif"
              }}>
                Update Your Typing Baseline
              </h1>
              <p style={{
                margin: 0, fontSize: 14, color: "#64748b",
                fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6
              }}>
                Your typing rhythm may have changed over time. Updating your baseline
                helps SECT verify your identity more accurately during essay exams.
              </p>
            </div>
          )}

          {/* Saving overlay */}
          {saving ? (
            <div style={{
              background: "#fff", borderRadius: 16, padding: 40,
              textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06)"
            }}>
              <div className="spinner-border text-primary" role="status" />
              <p style={{ margin: "14px 0 0", fontSize: 14, color: "#94a3b8", fontFamily: "'DM Sans',sans-serif" }}>
                Saving your new baseline…
              </p>
            </div>

          ) : done ? (
            /* ── Success screen ── */
            <div style={{
              background: "#fff", borderRadius: 16, padding: 40,
              textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06)"
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#f0fdf4", display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 16px"
              }}>
                <i className="bi bi-check-circle-fill" style={{ fontSize: 32, color: "#22c55e" }}></i>
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#0f172a", fontFamily: "'DM Sans',sans-serif" }}>
                Baseline Updated!
              </h2>
              <p style={{ margin: "0 0 28px", fontSize: 14, color: "#64748b", fontFamily: "'DM Sans',sans-serif" }}>
                Your new typing profile has been saved and will be used for future exam verification.
              </p>
              <button onClick={() => navigate("/student")} style={{
                background: "#0056b3", color: "#fff", border: "none",
                borderRadius: 10, padding: "10px 28px",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif", transition: "opacity .15s"
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <i className="bi bi-house" style={{ marginRight: 6 }}></i>
                Back to Dashboard
              </button>
            </div>

          ) : (
            /* ── Typing test (reuses existing component, no gate logic needed here) ── */
            <TypingTest
              onComplete={handleComplete}
              hasExistingBaseline={false}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default TypingTestPage;