import { useEffect, useState } from "react";
import api from "../lib/api";
import { motion } from "framer-motion";
import { Bell, Send } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const fetchNotifications = async () => {
    const res = await api.get("/notifications");
    setNotifications(res.data);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/notifications", {
        title,
        message,
        type: "GENERAL",
      });

      setTitle("");
      setMessage("");
      fetchNotifications();
    } catch (error) {
      alert("Failed to create notification");
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          Notifications
        </h1>
        <p style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
          Broadcast messages to members, trainers & staff
        </p>
      </div>

      {/* LAYOUT GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* CREATE NOTIFICATION */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 16,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Send size={16} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: 14 }}>Send Notification</h3>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />

            <textarea
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              style={textareaStyle}
            />

            <button style={buttonStyle} type="submit">
              Send
            </button>
          </form>
        </div>

        {/* LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notifications.length === 0 && (
            <div
              style={{
                padding: 20,
                border: "1px dashed var(--border)",
                borderRadius: 14,
                color: "var(--muted)",
              }}
            >
              No notifications yet
            </div>
          )}

          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              style={cardStyle}
            >
              <div style={{ display: "flex", gap: 10 }}>
                <div style={iconBox}>
                  <Bell size={16} color="var(--primary)" />
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: 15 }}>{n.title}</h3>
                  <p style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
                    {n.message}
                  </p>

                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--primary)",
                      marginTop: 6,
                      display: "inline-block",
                    }}
                  >
                    {n.type}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== STYLES ========== */

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  color: "var(--text)",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "none",
};

const buttonStyle: React.CSSProperties = {
  marginTop: 12,
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "none",
  background: "var(--primary)",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "var(--shadow-sm)",
};

const iconBox: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--primary-soft)",
};