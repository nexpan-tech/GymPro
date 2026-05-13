import { useEffect, useState } from "react";
import api from "../lib/api";
import { motion } from "framer-motion";
import { Dumbbell, Plus } from "lucide-react";

type WorkoutPlan = {
  id: string;
  goal: string;
  monday: string;
};

export default function WorkoutPlansPage() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [goal, setGoal] = useState("");
  const [monday, setMonday] = useState("");

  const fetchPlans = async () => {
    const res = await api.get("/workout-plans");
    setPlans(res.data);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/workout-plans", { goal, monday });

      setGoal("");
      setMonday("");

      fetchPlans();
    } catch (error) {
      alert("Failed to create workout plan");
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          Workout Plans
        </h1>
        <p style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
          Build structured training programs for members
        </p>
      </div>

      {/* LAYOUT */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* CREATE PANEL */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: 14 }}>Create Workout Plan</h3>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
            <label style={labelStyle}>Fitness Goal</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Strength, Fat Loss"
              style={inputStyle}
            />

            <label style={labelStyle}>Monday Workout</label>
            <textarea
              value={monday}
              onChange={(e) => setMonday(e.target.value)}
              placeholder="Chest, Back, Cardio..."
              rows={6}
              style={textareaStyle}
            />

            <button type="submit" style={buttonStyle}>
              Save Plan
            </button>
          </form>
        </div>

        {/* LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {plans.length === 0 && (
            <div style={emptyStyle}>
              No workout plans created yet
            </div>
          )}

          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              style={planCard}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-3px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0px)")
              }
            >
              {/* HEADER */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={iconBox}>
                  <Dumbbell size={16} color="var(--primary)" />
                </div>

                <h3 style={{ margin: 0, fontSize: 15 }}>{plan.goal}</h3>
              </div>

              {/* CONTENT */}
              <div style={{ marginTop: 10 }}>
                <p style={textMuted}>
                  <strong style={{ color: "var(--text)" }}>Monday:</strong>{" "}
                  {plan.monday}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== STYLES ========== */

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "var(--shadow-sm)",
};

const planCard: React.CSSProperties = {
  background: "linear-gradient(180deg, var(--surface), var(--surface-2))",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "var(--shadow-sm)",
  transition: "all 0.2s ease",
};

const iconBox: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: "var(--primary-soft)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
  marginTop: 10,
  display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  marginTop: 6,
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
  marginTop: 14,
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "none",
  background: "var(--primary)",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  padding: 20,
  border: "1px dashed var(--border)",
  borderRadius: 14,
  color: "var(--muted)",
};

const textMuted: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  color: "var(--muted)",
};