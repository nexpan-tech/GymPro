import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, UserCircle } from "lucide-react";

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* TOP BAR */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 64,
            padding: "0 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>GymPro</h3>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              Admin Dashboard
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ThemeToggle />

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <UserCircle size={16} />
              {user?.name || "Admin"}
            </div>

            <button onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{ flex: 1, padding: 24 }}>
          <Outlet />
        </main>

      </div>
    </div>
  );
}

