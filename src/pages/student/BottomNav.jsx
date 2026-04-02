import React from "react";
import { Link } from "react-router-dom";

/**
 * BottomNav — fixed bottom navigation for mobile (hidden on lg+).
 * Props:
 *   active: one of "Home" | "Subjects" | "Tasks" | "Grades" | "Settings"
 */
const BottomNav = ({ active }) => {
  const items = [
    { to: "/student",                  icon: "bi-speedometer2",     label: "Home"     },
    { to: "/student/subjects",         icon: "bi-journal-bookmark", label: "Subjects" },
    { to: "/student/tasks",            icon: "bi-pencil-square",    label: "Tasks"    },
    { to: "/student/grades",           icon: "bi-graph-up-arrow",   label: "Grades"   },
    { to: "/student/account-settings", icon: "bi-gear",             label: "Settings" },
  ];

  return (
    <nav
      className="d-lg-none"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        height: 64, background: "#fff",
        borderTop: "1px solid #e5e7eb",
        display: "flex", alignItems: "stretch",
        zIndex: 1030, boxShadow: "0 -2px 12px rgba(0,0,0,.08)",
      }}
    >
      {items.map(({ to, icon, label }) => {
        const isActive = active === label;
        return (
          <Link
            key={to}
            to={to}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 600, gap: 2,
              textDecoration: "none",
              color: isActive ? "#0d6efd" : "#6b7280",
              transition: "color .15s",
              borderTop: isActive ? "2px solid #0d6efd" : "2px solid transparent",
            }}
          >
            <i className={`bi ${icon}`} style={{ fontSize: 20 }}></i>
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;