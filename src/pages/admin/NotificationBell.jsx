// src/pages/admin/NotificationBell.jsx
// Self-contained notification bell — import and drop into any admin Topbar.
// Polls GET /api/admin/notifications every 45s.
// Stores read state in localStorage under "al_read_notifs".
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";

(function injectStyles() {
  if (document.getElementById("nb-styles")) return;
  const s = document.createElement("style");
  s.id = "nb-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
    @keyframes nb-drop { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes nb-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
    .nb-bell-btn { transition:all .15s; border:none; cursor:pointer; background:none; padding:0; position:relative; }
    .nb-row { display:flex; text-decoration:none; transition:background .1s; cursor:pointer; }
    .nb-row:hover { background:#f8faff !important; }
    .nb-dropdown {
      position:fixed;
      right:12px;
      top:60px;
      z-index:9999;
      width:min(360px, calc(100vw - 24px));
      background:#fff;
      border:1px solid #e2e8f0;
      border-radius:14px;
      box-shadow:0 16px 50px rgba(0,86,179,.15);
      animation:nb-drop .18s ease;
      overflow:hidden;
      font-family:'DM Sans',system-ui,sans-serif;
    }
  `;
  document.head.appendChild(s);
})();

const BASE = import.meta?.env?.VITE_API_URL ?? "/api";

async function fetchNotifs() {
  try {
    const res = await fetch(BASE + "/admin/notifications", {
      headers: { "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" },
      credentials: "include",
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    // Only keep support-ticket related notifications — filter out any CPI/anomaly entries
    const all = json.data ?? [];
    return all.filter(n => n.type === "new_ticket" || n.type === "ticket_updated" || n.type === "exam_completed");
  } catch {
    return [];
  }
}

/* ─── Only support-ticket and exam notifications ─────────────────────── */
const NOTIF_CFG = {
  new_ticket:     { icon: "🎫", color: "#0056b3", bg: "#e8f0fe", link: "/admin/support" },
  ticket_updated: { icon: "💬", color: "#1a6ed8", bg: "#eff6ff", link: "/admin/support" },
  exam_completed: { icon: "✅", color: "#16a34a", bg: "#f0fdf4", link: "/admin/exams"   },
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("al_read_notifs") || "[]")); }
    catch { return new Set(); }
  });
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchNotifs();
    setNotifications(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 45_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const unread = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAll = () => {
    const ids = new Set(notifications.map((n) => n.id));
    setReadIds(ids);
    try { localStorage.setItem("al_read_notifs", JSON.stringify([...ids])); } catch {}
  };

  const markOne = (id) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem("al_read_notifs", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const recent   = notifications.slice(0, 8);
  const hasBadge = unread > 0;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="nb-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${unread} notification${unread !== 1 ? "s" : ""}`}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10, fontSize: 16,
          background: open ? "#e8f0fe" : "#f8f9fa",
          border: `1.5px solid ${open ? "#0056b3" : "#dee2e6"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .15s",
        }}>
          🔔
        </div>
        {hasBadge && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: "#dc3545", color: "#fff",
            minWidth: 16, height: 16, borderRadius: 8,
            fontSize: 9, fontWeight: 800, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff", padding: "0 3px",
            animation: "nb-pulse 2s ease infinite",
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="nb-dropdown">
          {/* Header */}
          <div style={{
            padding: "12px 14px", borderBottom: "1px solid #f0f0f0",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: unread > 0 ? "#f8faff" : "#f8f9fa",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Notifications</span>
              {unread > 0 && (
                <span style={{ background: "#0056b3", color: "#fff", padding: "1px 7px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>
                  {unread} new
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={(e) => { e.stopPropagation(); load(); }}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#888", fontSize: 14 }}
                title="Refresh"
              >
                {loading
                  ? <span style={{ display: "inline-block", width: 11, height: 11, border: "2px solid #dee2e6", borderTopColor: "#0056b3", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  : "↻"}
              </button>
              {unread > 0 && (
                <button onClick={markAll} style={{ border: "none", background: "none", fontSize: 11, color: "#888", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {recent.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center", color: "#aaa" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🔔</div>
                <div style={{ fontSize: 13 }}>No notifications yet</div>
                <div style={{ fontSize: 11, marginTop: 3, color: "#bbb" }}>
                  {loading ? "Checking…" : "Refreshes every 45s"}
                </div>
              </div>
            ) : (
              recent.map((n) => {
                const cfg     = NOTIF_CFG[n.type] ?? { icon: "📌", color: "#64748b", bg: "#f1f5f9", link: "/admin/support" };
                const isUnread = !readIds.has(n.id);
                return (
                  <Link
                    key={n.id}
                    to={cfg.link}
                    className="nb-row"
                    onClick={() => { markOne(n.id); setOpen(false); }}
                    style={{
                      gap: 10, padding: "10px 12px",
                      borderBottom: "1px solid #f5f5f5",
                      background: isUnread ? "#f8faff" : "#fff",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#1e293b", lineHeight: 1.4, fontWeight: isUnread ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {n.title}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {n.body}
                      </p>
                      <p style={{ margin: "3px 0 0", fontSize: 10, color: "#94a3b8" }}>
                        {n.created_at
                          ? new Date(n.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </p>
                    </div>
                    {isUnread && (
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0056b3", flexShrink: 0, marginTop: 4 }} />
                    )}
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "8px 14px", borderTop: "1px solid #f0f0f0", textAlign: "center" }}>
            <Link
              to="/admin/support"
              onClick={() => setOpen(false)}
              style={{ fontSize: 12, color: "#0056b3", fontWeight: 600, textDecoration: "none" }}
            >
              View all support tickets →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}