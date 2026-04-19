// src/pages/admin/NotificationBell.jsx
// Self-contained notification bell — import and drop into any admin Topbar.
// Polls GET /api/admin/notifications every 45s.
// Stores read state in localStorage under "al_read_notifs".
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";

/* ─── Inject dropdown animation once ─────────────────────────────────── */
(function injectDropAnim() {
  if (document.getElementById("nb-styles")) return;
  const s = document.createElement("style");
  s.id = "nb-styles";
  s.textContent = `
    @keyframes nb-dropIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
    .nb-item{transition:background .12s;cursor:pointer;text-decoration:none;display:flex}
    .nb-item:hover{background:#F5F4FF!important}
    .nb-bell{transition:all .15s;cursor:pointer;border:none}
    .nb-bell:hover{filter:brightness(1.05)}
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
    return json.data ?? [];
  } catch {
    return [];
  }
}

const C = {
  accent: "#6C63FF", text: "#0D0C1D", muted: "#7A788F",
  danger: "#E53935", border: "#E6E4FF", bg: "#F4F3FF", card: "#FFFFFF",
};

const NOTIF_CFG = {
  new_ticket:    { icon: "🎫", color: C.accent,  bg: "#EDE9FF", link: "/admin/support"   },
  high_cpi:      { icon: "🚨", color: C.danger,  bg: "#FFEBEE", link: "/admin/anomalies" },
  exam_flagged:  { icon: "🚩", color: "#FB8C00", bg: "#FFF3E0", link: "/admin/anomalies" },
  exam_completed:{ icon: "✅", color: "#2E7D32", bg: "#E8F5E9", link: "/admin/exams"     },
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("al_read_notifs") || "[]")); }
    catch { return new Set(); }
  });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  /* Poll every 45 s */
  const load = useCallback(async () => {
    const data = await fetchNotifs();
    setNotifications(data);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 45_000);
    return () => clearInterval(t);
  }, [load]);

  /* Close on outside click */
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const unread = notifications.filter(n => !readIds.has(n.id)).length;

  const markAll = () => {
    const ids = new Set(notifications.map(n => n.id));
    setReadIds(ids);
    try { localStorage.setItem("al_read_notifs", JSON.stringify([...ids])); } catch {}
  };

  const markOne = (id) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem("al_read_notifs", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const recent = notifications.slice(0, 8);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        className="nb-bell"
        onClick={() => setOpen(v => !v)}
        style={{
          border: `1.5px solid ${open ? C.accent : C.border}`,
          background: open ? "#EDE9FF" : C.card,
          borderRadius: 10, width: 40, height: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", fontSize: 18,
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: C.danger, color: "#fff",
            width: 18, height: 18, borderRadius: "50%",
            fontSize: 10, fontWeight: 800, fontFamily: "'Syne',sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff", lineHeight: 1,
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: 48, right: 0, zIndex: 1100,
          width: 340, background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14, boxShadow: "0 16px 50px rgba(0,0,0,.16)",
          animation: "nb-dropIn .18s ease",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 16px", borderBottom: `1px solid ${C.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: C.text }}>
              Notifications
              {unread > 0 && (
                <span style={{
                  marginLeft: 8, background: C.accent, color: "#fff",
                  padding: "1px 7px", borderRadius: 10, fontSize: 11,
                }}>
                  {unread} new
                </span>
              )}
            </span>
            {unread > 0 && (
              <button onClick={markAll} style={{
                border: "none", background: "none", fontSize: 11,
                color: C.accent, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Epilogue',sans-serif",
              }}>
                Mark all read
              </button>
            )}
          </div>

          {/* Items */}
          {recent.length === 0 ? (
            <div style={{ padding: "30px 16px", textAlign: "center", color: C.muted, fontSize: 13 }}>
              No notifications yet
            </div>
          ) : (
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {recent.map(n => {
                const cfg     = NOTIF_CFG[n.type] ?? { icon: "📌", color: C.muted, bg: C.bg, link: "/admin" };
                const isUnread = !readIds.has(n.id);
                return (
                  <Link
                    key={n.id}
                    to={cfg.link}
                    className="nb-item"
                    onClick={() => { markOne(n.id); setOpen(false); }}
                    style={{
                      gap: 12, padding: "12px 16px",
                      borderBottom: `1px solid ${C.border}`,
                      background: isUnread ? "#FAFAFE" : "transparent",
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: cfg.bg, display: "flex",
                      alignItems: "center", justifyContent: "center", fontSize: 17,
                    }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: 13, color: C.text, lineHeight: 1.4,
                        fontWeight: isUnread ? 700 : 500,
                      }}>
                        {n.title}
                      </p>
                      <p style={{
                        margin: "2px 0 0", fontSize: 11, color: C.muted,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {n.body}
                      </p>
                      <p style={{ margin: "3px 0 0", fontSize: 10, color: C.muted }}>
                        {n.created_at
                          ? new Date(n.created_at).toLocaleString("en-PH", {
                              month: "short", day: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : ""}
                      </p>
                    </div>
                    {isUnread && (
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: C.accent, flexShrink: 0, marginTop: 6,
                      }} />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
            <Link
              to="/admin/support"
              onClick={() => setOpen(false)}
              style={{ fontSize: 12, color: C.accent, fontWeight: 600, textDecoration: "none" }}
            >
              View all support tickets →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}