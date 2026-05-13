import { useState } from "react";
import api from "../../lib/api";

type Props = {
  onSuccess: () => void;
  onClose: () => void;
};

export default function MemberForm({ onSuccess, onClose }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    fitnessGoal: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/members", form);
      onSuccess();
      onClose();
    } catch (err) {
      alert("Failed to create member");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: 14 }}>Create Member</h3>

      {Object.entries(form).map(([key, value]) => (
        <input
          key={key}
          name={key}
          value={value}
          onChange={handleChange}
          placeholder={key}
          type={key === "password" ? "password" : "text"}
          style={inputStyle}
        />
      ))}

      <button style={btn}>Create Member</button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  color: "var(--text)",
};

const btn: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "none",
  background: "var(--primary)",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};