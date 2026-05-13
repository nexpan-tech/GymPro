import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, #0b1f14, #050807 60%, #030504)",
      }}
    >
      {/* CARD */}
      <div
        style={{
          width: 420,
          padding: 32,
          borderRadius: 18,
          border: "1px solid rgba(34,197,94,0.25)",
          background: "rgba(10,15,12,0.75)",
          backdropFilter: "blur(18px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* BRAND */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              color: "#22c55e",
              letterSpacing: 1,
            }}
          >
            GymPro
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
            Secure Admin Access
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            type="email"
          />

          <input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            type="password"
          />

          {error && (
            <p style={{ color: "#ef4444", fontSize: 12 }}>{error}</p>
          )}

          <button
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(90deg, #22c55e, #16a34a)",
              color: "black",
              fontWeight: 700,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            <LogIn size={16} />
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  marginBottom: 12,
  borderRadius: 12,
  border: "1px solid rgba(34,197,94,0.2)",
  outline: "none",
  background: "rgba(255,255,255,0.02)",
  color: "#e5e7eb",
};