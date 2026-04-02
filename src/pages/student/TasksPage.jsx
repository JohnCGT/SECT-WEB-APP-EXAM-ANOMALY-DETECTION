import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";

/* ─── Shared design-system styles ─── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body, html { margin:0; padding:0; background:#f0f4fb; font-family:'DM Sans',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
  :root {
    --blue:#0056b3; --blue-mid:#1a6ed8; --blue-lite:#e8f0fe;
    --slate:#64748b; --slate-lt:#94a3b8;
    --card-bg:#ffffff; --card-br:16px;
    --card-sh:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,86,179,.06);
  }
  .topbar {
    background:rgba(255,255,255,0.80); backdrop-filter:blur(16px);
    -webkit-backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(0,86,179,.08);
    position:sticky; top:0; z-index:100; height:56px;
  }
  .glass-sidebar {
    background:rgba(255,255,255,0.60);
    backdrop-filter:blur(20px) saturate(180%);
    -webkit-backdrop-filter:blur(20px) saturate(180%);
    border-right:1px solid rgba(255,255,255,0.80);
    box-shadow:4px 0 24px rgba(0,86,179,.07);
  }
  .nav-pill {
    display:flex; flex-direction:column; align-items:center;
    padding:10px 8px; border-radius:12px; gap:4px;
    font-size:11px; font-weight:600; text-decoration:none;
    color:var(--slate); transition:background .15s,color .15s,transform .15s; width:100%;
  }
  .nav-pill:hover  { background:var(--blue-lite); color:var(--blue); transform:translateY(-1px); }
  .nav-pill.active { background:var(--blue); color:#fff; box-shadow:0 4px 14px rgba(0,86,179,.35); }
  .nav-pill i { font-size:18px; }
  .avatar {
    width:34px; height:34px; border-radius:50%;
    background:var(--blue); color:#fff;
    display:flex; align-items:center; justify-content:center;
    font-size:14px; font-weight:700; flex-shrink:0;
  }
  .search-input {
    border:1px solid rgba(0,86,179,.15); border-radius:10px;
    background:#f8faff; padding:7px 14px 7px 36px;
    font-size:13px; color:#1e293b; outline:none;
    font-family:'DM Sans',sans-serif; width:100%;
    transition:border-color .2s,box-shadow .2s;
  }
  .search-input:focus { border-color:var(--blue); box-shadow:0 0 0 3px rgba(0,86,179,.10); background:#fff; }
  .tab-pill {
    padding:6px 16px; border-radius:99px; border:none;
    font-size:13px; font-weight:600; cursor:pointer;
    background:transparent; color:var(--slate-lt);
    transition:background .15s,color .15s; font-family:'DM Sans',sans-serif; white-space:nowrap;
  }
  .tab-pill.active { background:var(--blue-lite); color:var(--blue); }
  .tab-pill:hover:not(.active) { color:var(--slate); background:#f1f5f9; }
  .task-card {
    background:var(--card-bg); border-radius:var(--card-br);
    box-shadow:var(--card-sh); border:1px solid rgba(0,86,179,.06);
    transition:box-shadow .2s,transform .2s; overflow:hidden;
    display:flex; flex-direction:column; height:100%;
  }
  .task-card:hover { box-shadow:0 4px 24px rgba(0,86,179,.12); transform:translateY(-2px); }
  .tag { display:inline-flex; align-items:center; padding:2px 9px; border-radius:99px; font-size:11px; font-weight:600; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .fade-up { animation:fadeUp .35s ease both; }
  .bottom-nav {
    position:fixed; bottom:0; left:0; right:0; height:64px;
    background:rgba(255,255,255,0.92); backdrop-filter:blur(16px);
    border-top:1px solid rgba(0,86,179,0.10);
    display:flex; align-items:stretch; z-index:1030;
    box-shadow:0 -4px 24px rgba(0,86,179,0.08);
  }
  .bottom-nav a {
    flex:1; display:flex; flex-direction:column; align-items:center;
    justify-content:center; font-size:10px; font-weight:600; gap:3px;
    text-decoration:none; color:#94a3b8; transition:color .2s;
    border-top:2px solid transparent;
  }
  .bottom-nav a.active { color:#0056b3; border-top-color:#0056b3; }
  .bottom-nav a i { font-size:19px; }
`;

const NAV_ITEMS = [
  { to: "/student",                  icon: "bi-speedometer2",     label: "Home"     },
  { to: "/student/subjects",         icon: "bi-journal-bookmark", label: "Subjects" },
  { to: "/student/tasks",            icon: "bi-pencil-square",    label: "Tasks"    },
  { to: "/student/grades",           icon: "bi-graph-up-arrow",   label: "Grades"   },
  { to: "/student/account-settings", icon: "bi-gear",             label: "Settings" },
];

const TASKS = {
  all: [
    { id: 1, title: "Data Structures Project II",  subject: "CS-101", desc: "Implementation of Red-Black Trees",       due: "Tomorrow",   status: "In Progress", urgency: "high",   grade: null  },
    { id: 2, title: "SQL Optimization Quiz",        subject: "DB-202", desc: "Chapter 4–5 Review",                     due: "Fri, Oct 24",status: "Not Started", urgency: "medium", grade: null  },
    { id: 3, title: "Network Security Lab",         subject: "CS-202", desc: "Packet capture & analysis exercise",     due: "Nov 01",     status: "Not Started", urgency: "low",    grade: null  },
    { id: 4, title: "Multivariable Calculus Exam",  subject: "MTH-201",desc: "Score: 94/100",                          due: "Oct 12",     status: "Completed",   urgency: "none",   grade: "A"   },
    { id: 5, title: "Algorithm Analysis Quiz 2",    subject: "CS-102", desc: "Time complexity problems",               due: "Oct 10",     status: "Completed",   urgency: "none",   grade: "B+"  },
  ],
  progress: [1],
  completed: [4, 5],
};

const URGENCY = {
  high:   { color: "#ef4444", bg: "#fef2f2", label: "High Priority"   },
  medium: { color: "#f59e0b", bg: "#fff7ed", label: "Medium Priority" },
  low:    { color: "#22c55e", bg: "#f0fdf4", label: "Low Priority"    },
  none:   { color: "#64748b", bg: "#f8faff", label: "Completed"       },
};

const BottomNav = ({ active }) => (
  <nav className="bottom-nav d-lg-none">
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={active === label ? "active" : ""}>
        <i className={`bi ${icon}`}></i>{label}
      </Link>
    ))}
  </nav>
);

const Topbar = ({ user, onLogout }) => {
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "S";
  const firstName = user?.name?.split(" ")[0] ?? "Student";
  return (
    <div className="topbar d-flex align-items-center px-3 px-lg-4 gap-3">
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:15, color:"#0056b3", letterSpacing:"-.3px", flexShrink:0 }}>
        SECT Portal
      </span>
      <div className="ms-auto d-flex align-items-center gap-2">
        <button style={{ background:"transparent", border:"none", position:"relative", padding:"4px 8px", cursor:"pointer" }}>
          <i className="bi bi-bell" style={{ fontSize:18, color:"#64748b" }}></i>
          <span style={{ position:"absolute", top:2, right:6, width:7, height:7, background:"#ef4444", borderRadius:"50%", border:"1.5px solid #f0f4fb" }}></span>
        </button>
        <div className="dropdown">
          <button className="d-flex align-items-center gap-2 dropdown-toggle"
            style={{ background:"transparent", border:"none", cursor:"pointer", padding:"4px 6px", borderRadius:10 }}
            data-bs-toggle="dropdown">
            <div className="avatar">{initial}</div>
            <span className="d-none d-sm-inline" style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{firstName}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ borderRadius:12, fontSize:13 }}>
            <li><Link className="dropdown-item" to="/student/profile">My Profile</Link></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger" onClick={onLogout}
                style={{ border:"none", background:"none", width:"100%", textAlign:"left" }}>Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ active }) => (
  <nav className="glass-sidebar d-none d-lg-flex flex-column align-items-center py-4 gap-1"
    style={{ width:80, minHeight:"calc(100vh - 56px)", position:"sticky", top:56, alignSelf:"flex-start", flexShrink:0 }}>
    {NAV_ITEMS.map(({ to, icon, label }) => (
      <Link key={to} to={to} className={`nav-pill${active === label ? " active" : ""}`}>
        <i className={`bi ${icon}`}></i>{label}
      </Link>
    ))}
  </nav>
);

const TaskCard = ({ task }) => {
  const urg = URGENCY[task.urgency];
  const done = task.status === "Completed";
  return (
    <div className="task-card fade-up">
      {/* Priority stripe */}
      <div style={{ height: 3, background: urg.color, width: "100%" }} />
      <div style={{ padding: "16px 18px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <span style={{
            background: urg.bg, color: urg.color,
            borderRadius: 99, padding: "2px 9px", fontSize: 10, fontWeight: 700
          }}>{urg.label}</span>
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, flexShrink: 0 }}>{task.subject}</span>
        </div>
        {/* Title */}
        <h3 style={{
          margin: 0, fontSize: 14, fontWeight: 700, color: done ? "#94a3b8" : "#0f172a",
          lineHeight: 1.3, textDecoration: done ? "line-through" : "none"
        }}>{task.title}</h3>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{task.desc}</p>

        {/* Footer */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"auto", paddingTop:10, borderTop:"1px solid #f1f5f9" }}>
          <div>
            <p style={{ margin:0, fontSize:10, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".04em" }}>
              {done ? "Graded" : "Due"}
            </p>
            <p style={{ margin:0, fontSize:13, fontWeight:700, color: done ? "#22c55e" : task.urgency === "high" ? "#ef4444" : "#0f172a" }}>
              {task.due}
            </p>
          </div>
          {done ? (
            <span style={{ background:"#f0fdf4", color:"#22c55e", borderRadius:8, padding:"5px 12px", fontSize:13, fontWeight:700 }}>
              {task.grade}
            </span>
          ) : (
            <button style={{
              background:"#0056b3", color:"#fff", border:"none", borderRadius:99,
              padding:"6px 14px", fontSize:11, fontWeight:700, cursor:"pointer",
              transition:"opacity .15s", fontFamily:"'DM Sans',sans-serif"
            }} onMouseEnter={e=>e.target.style.opacity=".8"} onMouseLeave={e=>e.target.style.opacity="1"}>
              <i className="bi bi-arrow-right me-1"></i>Open
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const TasksPage = () => {
  const navigate = useNavigate();
  const [user, setUser]     = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    API.get("/me").then(r => setUser(r.data.user)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await API.post("/logout"); } catch {}
    localStorage.removeItem("user"); navigate("/");
  };

  const visibleIds = activeTab === "progress"  ? TASKS.progress  :
                     activeTab === "completed" ? TASKS.completed : TASKS.all.map(t=>t.id);
  const visible    = TASKS.all.filter(t => visibleIds.includes(t.id));

  const counts = {
    all:       TASKS.all.length,
    progress:  TASKS.progress.length,
    completed: TASKS.completed.length,
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ background:"#f0f4fb", minHeight:"100vh" }}>

        <Topbar user={user} onLogout={handleLogout} />

        <div className="d-flex align-items-stretch">
          <Sidebar active="Tasks" />

          <main style={{ flex:1, padding:"24px 20px", paddingBottom:100, minWidth:0 }}>

            {/* Page header */}
            <div style={{ marginBottom:24 }}>
              <p style={{ margin:0, fontSize:12, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>Academic</p>
              <h1 style={{ margin:"4px 0 4px", fontSize:24, fontWeight:700, color:"#0f172a", letterSpacing:"-.4px" }}>Assignments</h1>
              <p style={{ margin:0, fontSize:13, color:"#64748b" }}>Fall Semester 2025 · Tasks Overview</p>
            </div>

            {/* Stats strip */}
            <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
              {[
                { label:"Total Tasks",  val: TASKS.all.length,       color:"#0056b3", bg:"#e8f0fe" },
                { label:"In Progress",  val: TASKS.progress.length,  color:"#f59e0b", bg:"#fff7ed" },
                { label:"Completed",    val: TASKS.completed.length, color:"#22c55e", bg:"#f0fdf4" },
                { label:"High Priority",val: TASKS.all.filter(t=>t.urgency==="high").length, color:"#ef4444", bg:"#fef2f2" },
              ].map(s => (
                <div key={s.label} className="fade-up" style={{
                  background:s.bg, borderRadius:12, padding:"10px 16px",
                  display:"flex", alignItems:"center", gap:10, minWidth:110
                }}>
                  <span style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.val}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:s.color, opacity:.8 }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:6, marginBottom:24, overflowX:"auto", paddingBottom:2 }}>
              {[
                { key:"all",       label:`All Tasks (${counts.all})`         },
                { key:"progress",  label:`In Progress (${counts.progress})`  },
                { key:"completed", label:`Completed (${counts.completed})`   },
              ].map(({ key, label }) => (
                <button key={key} className={`tab-pill${activeTab===key?" active":""}`}
                  onClick={() => setActiveTab(key)}>{label}</button>
              ))}
            </div>

            {/* Task grid */}
            {visible.length === 0 ? (
              <div style={{ textAlign:"center", padding:"64px 24px", color:"#94a3b8" }}>
                <i className="bi bi-check-circle" style={{ fontSize:48, display:"block", marginBottom:16, opacity:.4 }}></i>
                <p style={{ margin:0, fontSize:15, fontWeight:700, color:"#64748b" }}>No tasks here</p>
              </div>
            ) : (
              <div style={{ display:"grid", gap:16, gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))" }}>
                {visible.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            )}
          </main>
        </div>

        <BottomNav active="Tasks" />
      </div>
    </>
  );
};

export default TasksPage;