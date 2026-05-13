import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  Activity,
  Apple,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { sidebarItems } from "../config/sidebar.config";

const iconMap: Record<string, any> = {
  dashboard: LayoutDashboard,
  users: Users,
  "credit-card": CreditCard,
  calendar: Calendar,
  activity: Activity,
  apple: Apple,
  bell: Bell,
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const items = sidebarItems.filter((i) =>
    i.allowedRoles.includes(user.role)
  );

  return (
    <aside
      style={{
        width: collapsed ? 80 : 260,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",

        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        transition: "all 0.25s ease",
      }}
    >
      {/* TOP */}
      <div>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: collapsed ? "center" : "space-between",
            alignItems: "center",
            padding: "16px 14px",
          }}
        >
          {!collapsed && (
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>GymPro</h2>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                Management System
              </p>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 6,
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* NAV */}
        <nav style={{ padding: "6px 8px" }}>
          {items.map((item) => {
            const Icon = iconMap[item.icon];
            const active = location.pathname === item.path;

            return (
              <motion.div
                key={item.path}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
              >
                <Link
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,

                    padding: "10px 12px",
                    borderRadius: 10,
                    marginBottom: 6,

                    textDecoration: "none",
                    fontSize: 14,

                    color: active ? "var(--text)" : "var(--muted)",
                    background: active ? "var(--primary-soft)" : "transparent",

                    border: active
                      ? "1px solid var(--border)"
                      : "1px solid transparent",

                    transition: "all 0.2s ease",
                  }}
                >
                  {Icon && <Icon size={18} strokeWidth={1.8} />}
                  {!collapsed && <span>{item.label}</span>}

                  {/* subtle active indicator */}
                  {active && (
                    <div
                      style={{
                        marginLeft: "auto",
                        width: 4,
                        height: 18,
                        borderRadius: 10,
                        background: "var(--primary)",
                      }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>

      {/* USER SECTION */}
      <div
        style={{
          padding: 14,
          borderTop: "1px solid var(--border)",
        }}
      >
        {!collapsed && (
          <>
            <p style={{ margin: 0, fontSize: 13 }}>
              {user.name || "Admin"}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              {user.role}
            </p>
          </>
        )}
      </div>
    </aside>
  );
}