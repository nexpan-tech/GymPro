import { useState, type ChangeEvent, type FormEvent } from "react";
import { memberService } from "../../services/member.service";
import type { Member } from "../../types/member.types";

interface Props {
  initialData?: Partial<Member>;
  onSuccess?: () => void;
}

type MemberFormState = {
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: "male" | "female" | "other";
};

export default function MemberForm({ initialData, onSuccess }: Props) {
  const [form, setForm] = useState<MemberFormState>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    age: initialData?.age?.toString() || "",
    gender: initialData?.gender || "male",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const ageValue = form.age.trim();
    const parsedAge = ageValue ? Number(form.age) : undefined;

    const payload: Partial<Member> = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      age: parsedAge && !Number.isNaN(parsedAge) ? parsedAge : undefined,
      gender: form.gender,
    };

    try {
      if (initialData?.id) {
        await memberService.update(initialData.id, payload);
      } else {
        await memberService.create(payload);
      }

      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="name"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
        className="input"
      />

      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="input"
      />

      <input
        name="phone"
        placeholder="Phone"
        value={form.phone}
        onChange={handleChange}
        className="input"
      />

      <input
        name="age"
        placeholder="Age"
        value={form.age}
        onChange={handleChange}
        className="input"
      />

      <select
        name="gender"
        value={form.gender}
        onChange={handleChange}
        className="input"
      >
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>

      <button disabled={loading} className="btn">
        {loading ? "Saving..." : "Save Member"}
      </button>
    </form>
  );
}