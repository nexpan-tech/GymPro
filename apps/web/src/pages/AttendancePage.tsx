import { useEffect, useState } from "react";
import api from "../lib/api";
import { motion } from "framer-motion";
import { CalendarCheck2 } from "lucide-react";

type Attendance = {
  id: string;
  memberName: string;
  checkInAt: string;
};

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      const res = await api.get("/attendance");
      setRecords(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* HEADER */}
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Attendance
        </h1>

        <p
          style={{
            marginTop: 6,
            fontSize: 14,
            color: "var(--muted)",
          }}
        >
          Real-time gym check-ins and member activity tracking
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--muted)",
          }}
        >
          Loading attendance records...
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && records.length === 0 && (
        <div
          style={{
            padding: 24,
            borderRadius: 14,
            border: "1px dashed var(--border)",
            background: "var(--surface)",
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          No attendance records found
        </div>
      )}

      {/* LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {records.map((record, index) => {
          const date = new Date(record.checkInAt);

          return (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",

                padding: 16,
                borderRadius: 14,

                background:
                  "linear-gradient(180deg, var(--surface), var(--surface-2))",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",

                transition: "all 0.2s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateY(-2px)";
                el.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateY(0px)";
                el.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              {/* LEFT */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "var(--primary-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CalendarCheck2 size={18} color="var(--primary)" />
                </div>

                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {record.memberName}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    Checked in successfully
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                  {date.toLocaleDateString()}
                </p>

                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                  {date.toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}