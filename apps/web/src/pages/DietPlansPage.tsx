import { useEffect, useState } from "react";
import api from "../lib/api";
import { Plus, Utensils } from "lucide-react";

type DietPlan = {
  id: string;
  goal: string;
  monday: string;
};

export default function DietPlansPage() {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [goal, setGoal] = useState("");
  const [monday, setMonday] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      const res = await api.get("/diet-plans");
      setPlans(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/diet-plans", { goal, monday });

      setGoal("");
      setMonday("");

      fetchPlans();
    } catch (err) {
      console.error(err);
      alert("Failed to create diet plan");
    }
  };

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
          Diet Plans
        </h1>

        <p
          style={{
            marginTop: 6,
            fontSize: 14,
            color: "var(--muted)",
          }}
        >
          Build structured weekly nutrition plans for your members
        </p>
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 18,
          alignItems: "start",
        }}
      >

        {/* LEFT - FORM */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 18,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              Create Plan
            </h3>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
            {/* GOAL */}
            <label style={{ fontSize: 12, color: "var(--muted)" }}>
              Fitness Goal
            </label>

            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Fat Loss / Muscle Gain"
              style={{
                width: "100%",
                marginTop: 6,
                marginBottom: 12,
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                outline: "none",
              }}
            />

            {/* MONDAY */}
            <label style={{ fontSize: 12, color: "var(--muted)" }}>
              Monday Plan
            </label>

            <textarea
              value={monday}
              onChange={(e) => setMonday(e.target.value)}
              placeholder="Breakfast / Lunch / Dinner..."
              rows={5}
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                resize: "none",
                outline: "none",
              }}
            />

            <button
              type="submit"
              style={{
                marginTop: 14,
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "none",
                background: "var(--primary)",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save Plan
            </button>
          </form>
        </div>

        {/* RIGHT - LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* LOADING */}
          {loading && (
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--muted)",
              }}
            >
              Loading diet plans...
            </div>
          )}

          {/* EMPTY */}
          {!loading && plans.length === 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: 14,
                border: "1px dashed var(--border)",
                background: "var(--surface)",
                color: "var(--muted)",
                textAlign: "center",
              }}
            >
              No diet plans created yet
            </div>
          )}

          {/* LIST */}
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                background:
                  "linear-gradient(180deg, var(--surface), var(--surface-2))",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 16,
                boxShadow: "var(--shadow-sm)",
                transition: "all 0.2s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateY(-3px)";
                el.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateY(0px)";
                el.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              {/* HEADER */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Utensils size={16} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                  {plan.goal}
                </h3>
              </div>

              {/* CONTENT */}
              <p
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: "var(--muted)",
                  whiteSpace: "pre-line",
                }}
              >
                <span style={{ color: "var(--text)", fontWeight: 600 }}>
                  Monday:
                </span>{" "}
                {plan.monday}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}