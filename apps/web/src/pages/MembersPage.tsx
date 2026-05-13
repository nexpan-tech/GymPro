import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";
import { Plus, X } from "lucide-react";
import MemberForm from "../components/forms/MemberForm";

type Member = {
  id: string;
  user?: {
    name: string;
    email: string;
  };
  phone?: string;
  fitnessGoal?: string;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await api.get("/members");
      setMembers(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Members</h1>
          <p style={{ color: "var(--muted)", marginTop: 4 }}>
            Manage gym members
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          style={addBtn}
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      {/* LIST */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        members.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            style={card}
          >
            <h3 style={{ margin: 0 }}>{m.user?.name}</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              {m.user?.email}
            </p>
            <p style={{ margin: 0 }}>{m.phone || "-"}</p>
            <p style={{ margin: 0, fontSize: 12 }}>
              {m.fitnessGoal || "-"}
            </p>
          </motion.div>
        ))
      )}

      {/* MODAL */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={overlay}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={modal}
            >
              {/* CLOSE */}
              <button onClick={() => setOpen(false)} style={closeBtn}>
                <X size={18} />
              </button>

              {/* FORM */}
              <MemberForm
                onSuccess={fetchMembers}
                onClose={() => setOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* STYLES */

const addBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  background: "var(--primary)",
  color: "white",
  cursor: "pointer",
};

const card: React.CSSProperties = {
  padding: 14,
  marginBottom: 10,
  borderRadius: 14,
  background: "var(--surface)",
  border: "1px solid var(--border)",
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modal: React.CSSProperties = {
  width: 420,
  padding: 20,
  borderRadius: 16,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  position: "relative",
};

const closeBtn: React.CSSProperties = {
  position: "absolute",
  top: 10,
  right: 10,
  background: "transparent",
  border: "none",
  cursor: "pointer",
};