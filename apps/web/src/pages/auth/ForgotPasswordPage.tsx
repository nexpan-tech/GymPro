import { useState } from "react";
import { authService } from "@/services/auth.service";
import AuthLayout from "@/layouts/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await authService.forgotPassword({ email });
      setSuccess(
        "If an account exists with this email, a password reset link has been sent."
      );
      setEmail("");
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };
      setError(
        err.response?.data?.message || "Failed to send reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email address and we’ll send you a password reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {success && (
          <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground dark:border-border dark:bg-muted dark:text-muted-foreground">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary dark:border-primary/40 dark:bg-primary/15 dark:text-primary">
            {error}
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          required
        />

        <Button type="submit" fullWidth size="lg" disabled={loading} loading={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>
    </AuthLayout>
  );
}