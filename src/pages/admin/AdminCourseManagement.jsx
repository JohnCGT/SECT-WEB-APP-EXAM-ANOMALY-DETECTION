// src/pages/admin/AdminCourseManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell";

/* ─── Inject shared styles ───────────────────────────────────────────── */
(function bootstrap() {
  if (document.getElementById("admin-base-styles")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Epilogue:wght@400;500;600&display=swap";
  document.head.appendChild(link);
  const style = document.createElement("style");
  style.id = "admin-base-styles";
  style.textContent = `
    *{box-sizing:border-box}body{margin:0;font-family:'Epilogue',sans-serif}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes rowIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
    .a-btn{transition:filter .15s,transform .12s,opacity .15s;cursor:pointer}
    .a-btn:hover:not(:disabled){filter:brightness(1.07);transform:translateY(-1px)}
    .a-btn:active:not(:disabled){transform:translateY(0)}
    .a-btn:disabled{opacity:.5;cursor:not-allowed}
    .a-row{animation:rowIn .2s ease both}
    .a-tr td{transition:background .12s}
    .a-tr:hover td{background:#F5F4FF}
    .a-nav-link{transition:all .15s;text-decoration:none}
    .a-nav-link:hover{background:rgba(108,99,255,.08)!important}
    ::-webkit-scrollbar{width:6px;height:6px}
    ::-webkit-scrollbar-track{background:#F4F3FF}
    ::-webkit-scrollbar-thumb{background:#D0CEFF;border-radius:3px}
  `;
  document.head.appendChild(style);
})();

/* ─── Design tokens ──────────────────────────────────────────────────── */
const C = {
  bg:"#F4F3FF", card:"#FFFFFF", border:"#E6E4FF",
  accent:"#6C63FF", text:"#0D0C1D", muted:"#7A788F",
  danger:"#E53935", warn:"#FB8C00", green:"#2E7D32", sidebar:"#0D0C1D",
};

/* ─── API helper ─────────────────────────────────────────────────────── */
const BASE = import.meta?.env?.VITE_API_URL ?? "/api";
async function api(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type":"application/json","Accept":"application/json","X-Requested-With":"XMLHttpRequest" },
    credentials: "include",
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? "Request failed.");
  return json;
}

/* ─── Sidebar ────────────────────────────────────────────────────────── */
const NAV = [
  { to:"/admin",           icon:"⊞", label:"Dashboard" },
  { to:"/admin/users",     icon:"👥", label:"Users"     },
  { to:"/admin/courses",   icon:"📚", label:"Courses"   },
  { to:"/admin/exams",     icon:"📋", label:"Exams"     },
  { to:"/admin/anomalies", icon:"⚠️", label:"Anomalies" },
  { to:"/admin/support",   icon:"🎫", label:"Support"   },
];

function Sidebar() {
  const loc = useLocation();
  return (
    <nav style={{ width:200, background:C.sidebar, display:"flex", flexDirection:"column",
      padding:"24px 0", flexShrink:0, minHeight:"100vh",
      position:"sticky", top:0, height:"100vh" }}>
      <div style={{ padding:"0 20px 24px", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
        <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:".14em" }}>SECT</p>
        <p style={{ margin:"2px 0 0", fontSize:18, fontWeight:800, fontFamily:"'Syne',sans-serif", color:"#fff" }}>Admin</p>
      </div>
      <ul style={{ listStyle:"none", margin:"16px 0 0", padding:"0 10px", flexGrow:1 }}>
        {NAV.map(({ to, icon, label }) => {
          const active = loc.pathname === to || (to !== "/admin" && loc.pathname.startsWith(to));
          return (
            <li key={to} style={{ marginBottom:4 }}>
              <Link to={to} className="a-nav-link" style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                borderRadius:10, fontSize:13, fontWeight:600,
                background: active ? "rgba(108,99,255,.22)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,.55)",
                borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent",
              }}><span style={{ fontSize:16 }}>{icon}</span>{label}</Link>
            </li>
          );
        })}
      </ul>
      <div style={{ padding:"16px 10px 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
        <Link to="/" className="a-nav-link" style={{
          display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
          borderRadius:10, fontSize:13, fontWeight:600, color:"rgba(255,255,255,.4)",
        }}><span>⏻</span> Logout</Link>
      </div>
    </nav>
  );
}

/* ─── Topbar ─────────────────────────────────────────────────────────── */
function Topbar({ title, subtitle }) {
  return (
    <div style={{ height:60, background:C.card, borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 28px", flexShrink:0 }}>
      <div>
        <p style={{ margin:0, fontSize:16, fontWeight:700, fontFamily:"'Syne',sans-serif", color:C.text }}>{title}</p>
        {subtitle && <p style={{ margin:0, fontSize:12, color:C.muted }}>{subtitle}</p>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <NotificationBell />
        <div style={{ width:36, height:36, borderRadius:"50%", background:C.accent,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, fontWeight:800, fontFamily:"'Syne',sans-serif", color:"#fff",
          cursor:"pointer", border:`2px solid ${C.border}` }}>A</div>
      </div>
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────── */
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3800); return () => clearTimeout(t); }, [onDone]);
  const isErr = type === "error";
  return (
    <div style={{
      position:"fixed", bottom:28, right:28, zIndex:9999,
      background: isErr ? "#FFEBEE" : "#E8F5E9", color: isErr ? C.danger : C.green,
      padding:"12px 20px", borderRadius:10, fontSize:14, fontWeight:500,
      fontFamily:"'Epilogue',sans-serif", display:"flex", alignItems:"center", gap:10,
      boxShadow:"0 6px 30px rgba(0,0,0,.14)", animation:"slideUp .25s ease",
    }}>
      <span style={{ fontWeight:700 }}>{isErr ? "✕" : "✓"}</span>{msg}
    </div>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────────── */
function Avatar({ name = "" }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      width:30, height:30, borderRadius:"50%", flexShrink:0,
      background:`hsl(${hue},55%,88%)`, color:`hsl(${hue},45%,30%)`,
      fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif",
    }}>
      {initials}
    </span>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function AdminCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [toast,   setToast]   = useState(null);
  const [page,    setPage]    = useState(1);

  const notify = (msg, type="success") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      /**
       * GET /api/admin/courses
       * Response: { data: [{ id, code, name, semester, credits,
       *   instructor: {id,name,email}, students_count, exams_count, created_at }] }
       */
      const res = await api("GET", "/admin/courses");
      setCourses(res.data ?? (Array.isArray(res) ? res : []));
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Client-side search + pagination */
  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    return !q
      || c.code?.toLowerCase().includes(q)
      || c.name?.toLowerCase().includes(q)
      || c.instructor?.name?.toLowerCase().includes(q)
      || c.semester?.toLowerCase().includes(q);
  });

  const PER_PAGE   = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageData   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* Summary counts */
  const instructorSet = new Set(courses.map(c => c.instructor?.id).filter(Boolean));
  const totalStudents = courses.reduce((a, c) => a + (c.students_count ?? 0), 0);
  const totalExams    = courses.reduce((a, c) => a + (c.exams_count    ?? 0), 0);

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'Epilogue',sans-serif" }}>
      <Sidebar />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Topbar title="Course Management" subtitle="All courses across all instructors — read-only admin view" />

        <div style={{ flex:1, padding:"28px", overflowY:"auto" }}>

          {/* Summary stat cards */}
          <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
            {[
              { label:"Total Courses",     value:courses.length,         color:C.accent,  icon:"📚" },
              { label:"Instructors",        value:instructorSet.size,     color:"#1E88E5", icon:"👨‍🏫" },
              { label:"Total Enrollments",  value:totalStudents,          color:C.green,   icon:"👥" },
              { label:"Total Exams",        value:totalExams,             color:C.warn,    icon:"📋" },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{
                background:C.card, borderRadius:12, border:`1px solid ${C.border}`,
                padding:"16px 18px", flex:1, minWidth:130,
                boxShadow:"0 2px 10px rgba(108,99,255,.05)",
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.muted,
                      textTransform:"uppercase", letterSpacing:".08em" }}>{label}</p>
                    <p style={{ margin:"4px 0 0", fontSize:28, fontWeight:800,
                      fontFamily:"'Syne',sans-serif", color }}>{value}</p>
                  </div>
                  <span style={{ fontSize:20 }}>{icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Table card */}
          <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`,
            boxShadow:"0 2px 12px rgba(108,99,255,.05)", overflow:"hidden" }}>

            {/* Toolbar */}
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}`,
              display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ position:"relative", flex:1, minWidth:200 }}>
                <span style={{ position:"absolute", left:11, top:"50%",
                  transform:"translateY(-50%)", fontSize:13, color:C.muted }}>🔍</span>
                <input
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by code, name, instructor, semester…"
                  style={{
                    width:"100%", padding:"8px 12px 8px 34px",
                    border:`1.5px solid ${C.border}`, borderRadius:8,
                    fontSize:13, fontFamily:"'Epilogue',sans-serif", color:C.text,
                    background:"#fff", outline:"none",
                  }}
                />
              </div>
              <button className="a-btn" onClick={load} style={{
                border:`1.5px solid ${C.border}`, background:"transparent",
                borderRadius:8, padding:"7px 14px", fontSize:12,
                fontWeight:600, color:C.muted, fontFamily:"'Epilogue',sans-serif",
              }}>↻ Refresh</button>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ padding:60, textAlign:"center", color:C.muted, fontSize:14 }}>
                Loading courses…
              </div>
            ) : pageData.length === 0 ? (
              <div style={{ padding:60, textAlign:"center" }}>
                <p style={{ fontSize:36, margin:"0 0 10px" }}>📚</p>
                <p style={{ fontSize:14, color:C.muted, margin:0 }}>
                  {search ? "No courses match your search." : "No courses found."}
                </p>
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#FAFAFE", borderBottom:`1px solid ${C.border}` }}>
                    {["Course","Instructor","Semester","Credits","Students","Exams","Created"].map(h => (
                      <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11,
                        fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((course, i) => (
                    <tr key={course.id} className="a-tr a-row"
                      style={{ borderBottom:`1px solid ${C.border}`, animationDelay:`${i*20}ms` }}>
                      {/* Course code + name */}
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{
                            width:36, height:36, borderRadius:9, flexShrink:0,
                            background:"#EDE9FF", display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:16,
                          }}>📚</div>
                          <div>
                            <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.accent }}>
                              {course.code}
                            </p>
                            <p style={{ margin:"2px 0 0", fontSize:12, color:C.text, fontWeight:500 }}>
                              {course.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Instructor */}
                      <td style={{ padding:"12px 16px" }}>
                        {course.instructor ? (
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <Avatar name={course.instructor.name} />
                            <div>
                              <p style={{ margin:0, fontSize:13, fontWeight:600, color:C.text }}>
                                {course.instructor.name}
                              </p>
                              <p style={{ margin:"1px 0 0", fontSize:11, color:C.muted }}>
                                {course.instructor.email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize:13, color:C.muted }}>—</span>
                        )}
                      </td>

                      {/* Semester */}
                      <td style={{ padding:"12px 16px", fontSize:13, color:C.muted }}>
                        {course.semester ?? "—"}
                      </td>

                      {/* Credits */}
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{
                          padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                          background:"#EDE9FF", color:C.accent,
                        }}>
                          {course.credits ?? "—"} units
                        </span>
                      </td>

                      {/* Students count */}
                      <td style={{ padding:"12px 16px", fontSize:15, fontWeight:800,
                        fontFamily:"'Syne',sans-serif", color:C.green }}>
                        {course.students_count ?? 0}
                      </td>

                      {/* Exams count */}
                      <td style={{ padding:"12px 16px", fontSize:15, fontWeight:800,
                        fontFamily:"'Syne',sans-serif", color:"#1E88E5" }}>
                        {course.exams_count ?? 0}
                      </td>

                      {/* Created date */}
                      <td style={{ padding:"12px 16px", fontSize:12, color:C.muted }}>
                        {course.created_at
                          ? new Date(course.created_at).toLocaleDateString("en-PH", {
                              month:"short", day:"numeric", year:"numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {!loading && filtered.length > PER_PAGE && (
              <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.border}`,
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:C.muted }}>
                  Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
                </span>
                <div style={{ display:"flex", gap:6 }}>
                  <button className="a-btn" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} style={{
                    border:`1.5px solid ${C.border}`, background:"transparent",
                    borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:600, color:C.muted,
                  }}>← Prev</button>
                  <span style={{ fontSize:12, color:C.text, display:"flex", alignItems:"center", padding:"0 8px" }}>
                    {page} / {totalPages}
                  </span>
                  <button className="a-btn" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} style={{
                    border:`1.5px solid ${C.border}`, background:"transparent",
                    borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:600, color:C.muted,
                  }}>Next →</button>
                </div>
              </div>
            )}
            {!loading && filtered.length > 0 && filtered.length <= PER_PAGE && (
              <div style={{ padding:"10px 20px", borderTop:`1px solid ${C.border}`,
                fontSize:12, color:C.muted, textAlign:"right" }}>
                {filtered.length} course{filtered.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}