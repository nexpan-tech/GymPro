import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const authUser = await login({ email, password });

      const role = authUser?.role;

      if (role === "SUPER_ADMIN") {
        navigate("/super-admin/dashboard", { replace: true });
      } else if (role === "ADMIN" || role === "GYM_ADMIN") {
        navigate("/gym-admin/dashboard", { replace: true });
      } else if (role === "TRAINER") {
        navigate("/trainer/dashboard", { replace: true });
      } else if (role === "MEMBER") {
        navigate("/member/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
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
          "Invalid email or password"
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
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        className="w-full rounded-lg border px-4 py-3"
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        className="w-full rounded-lg border px-4 py-3"
        required
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
      >
        {isSubmitting ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}



