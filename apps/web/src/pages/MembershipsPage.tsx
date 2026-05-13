import { useEffect, useState } from "react";
import api from "../lib/api";
import { CreditCard, Plus, BadgeCheck, Clock } from "lucide-react";

type Membership = {
  id: string;
  plan: string;
  amount: number;
  paymentStatus: string;
};

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [plan, setPlan] = useState("MONTHLY");
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PAID");

  const fetchMemberships = async () => {
    const res = await api.get("/memberships");
    setMemberships(res.data);
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/memberships", {
        plan,
        amount: Number(amount),
        paymentStatus,
      });

      setPlan("MONTHLY");
      setAmount("");
      setPaymentStatus("PAID");

      fetchMemberships();
    } catch (error) {
      console.error(error);
      alert("Failed to create membership");
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          Memberships
        </h1>
        <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 13 }}>
          Manage subscription plans and payment status
        </p>
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* LEFT FORM */}
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
            <h3 style={{ margin: 0, fontSize: 14 }}>Create Membership</h3>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            {/* PLAN */}
            <label style={labelStyle}>Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              style={inputStyle}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="HALF_YEARLY">Half Yearly</option>
              <option value="YEARLY">Yearly</option>
            </select>

            {/* AMOUNT */}
            <label style={labelStyle}>Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              style={inputStyle}
            />

            {/* STATUS */}
            <label style={labelStyle}>Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              style={inputStyle}
            >
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            <button style={buttonStyle}>
              <CreditCard size={16} />
              Create Membership
            </button>
          </form>
        </div>

        {/* RIGHT LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {memberships.length === 0 && (
            <div style={emptyBox}>
              No memberships created yet
            </div>
          )}

          {memberships.map((m) => {
            const isPaid = m.paymentStatus === "PAID";

            return (
              <div key={m.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15 }}>{m.plan}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      ₹{m.amount}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      color: isPaid ? "var(--success)" : "var(--warning)",
                    }}
                  >
                    {isPaid ? <BadgeCheck size={16} /> : <Clock size={16} />}
                    {m.paymentStatus}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  marginTop: 6,
  marginBottom: 12,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  color: "var(--text)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 10,
  padding: 10,
  borderRadius: 10,
  border: "none",
  background: "var(--primary)",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 16,
  boxShadow: "var(--shadow-sm)",
};

const emptyBox: React.CSSProperties = {
  padding: 20,
  border: "1px dashed var(--border)",
  borderRadius: 14,
  color: "var(--muted)",
};