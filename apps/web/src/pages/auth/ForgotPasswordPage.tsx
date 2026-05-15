import { useState } from "react";
import AuthLayout from "@/layouts/AuthLayout";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to receive password reset instructions."
    >
      {submitted ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-900 shadow-sm">
          <p>Your password reset request has been recorded.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
            required
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-black px-4 py-3 text-white hover:bg-gray-900"
          >
            Send reset instructions
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
