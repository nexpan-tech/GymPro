import { useState } from "react";
import { authService } from "@/services/auth.service";

export default function RegisterGymForm() {
  const [form, setForm] = useState({
    gymName: "",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(
    key: keyof typeof form,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setSuccess("");
    setError("");
    setIsSubmitting(true);

    try {
      await authService.registerGym(form);
      setSuccess("Gym registered successfully.");
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };
      setError(
        err.response?.data?.message ||
          "Registration failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {Object.entries(form).map(([key, value]) => (
        <input
          key={key}
          type={key === "password" ? "password" : "text"}
          placeholder={key}
          value={value}
          onChange={(e) =>
            updateField(
              key as keyof typeof form,
              e.target.value
            )
          }
          className="w-full rounded-lg border px-4 py-3"
          required={key !== "phone"}
        />
      ))}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
      >
        {isSubmitting
          ? "Creating..."
          : "Register Gym"}
      </button>
    </form>
  );
}