import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import AuthLayout from "@/layouts/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { getRoleDashboard } from "@/lib/permissions";
import type { UserRole } from "@/types/user.types";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    return errors;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const authUser = await login({ email: email.trim(), password });
      const dashboard = getRoleDashboard(authUser.role as UserRole);
      navigate(dashboard, { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setApiError(
        axiosErr.response?.data?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Sign in to your command center and keep the momentum going."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* API error banner */}
        {apiError && (
          <div className="flex items-start gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary dark:border-primary/40 dark:bg-primary/15 dark:text-primary">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Email */}
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
          }}
          error={fieldErrors.email}
          autoComplete="email"
          autoFocus
          required
        />

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-(--text-secondary)">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary transition-colors hover:opacity-80"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password)
                  setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
              error={fieldErrors.password}
              autoComplete="current-password"
              required
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-3 text-(--text-muted) hover:text-(--text-secondary) transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {/* Footer */}
      <p className="mt-2 text-center text-sm text-(--text-muted)">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="font-semibold text-primary transition-colors hover:opacity-80"
        >
          Register your gym
        </Link>
      </p>
    </AuthLayout>
  );
}
