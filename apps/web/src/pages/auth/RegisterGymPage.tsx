import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, Building2, User, ClipboardCheck } from "lucide-react";
import AuthLayout from "@/layouts/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { getRoleDashboard } from "@/lib/permissions";
import type { UserRole } from "@/types/user.types";

// ─── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Gym Info",    icon: Building2 },
  { id: 2, label: "Admin",       icon: User },
  { id: 3, label: "Confirm",     icon: ClipboardCheck },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// ─── Form data shape ───────────────────────────────────────────────────────────

interface GymInfoForm {
  gymName: string;
  email: string;
  phone: string;
  address: string;
}

interface AdminForm {
  ownerName: string;
  adminEmail: string;
  password: string;
  confirmPassword: string;
}

// ─── Validation helpers ────────────────────────────────────────────────────────

function validateGymInfo(f: GymInfoForm) {
  const errors: Partial<GymInfoForm> = {};
  if (!f.gymName.trim()) errors.gymName = "Gym name is required.";
  if (!f.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
    errors.email = "Enter a valid email address.";
  if (f.phone && !/^\+?[\d\s\-()]{7,15}$/.test(f.phone))
    errors.phone = "Enter a valid phone number.";
  return errors;
}

function validateAdmin(f: AdminForm) {
  const errors: Partial<Record<keyof AdminForm, string>> = {};
  if (!f.ownerName.trim()) errors.ownerName = "Owner name is required.";
  if (!f.adminEmail.trim()) errors.adminEmail = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.adminEmail))
    errors.adminEmail = "Enter a valid email address.";
  if (!f.password) errors.password = "Password is required.";
  else if (f.password.length < 8)
    errors.password = "Password must be at least 8 characters.";
  if (!f.confirmPassword) errors.confirmPassword = "Please confirm your password.";
  else if (f.password !== f.confirmPassword)
    errors.confirmPassword = "Passwords do not match.";
  return errors;
}

// ─── Progress indicator ────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: StepId }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {STEPS.map((step, idx) => {
        const done = current > step.id;
        const active = current === step.id;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors duration-300",
                  done
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : active
                    ? "border-indigo-600 bg-white text-indigo-600 dark:bg-gray-900"
                    : "border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-900",
                ].join(" ")}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={[
                  "text-xs font-medium",
                  active ? "text-indigo-600" : done ? "text-indigo-500" : "text-gray-400",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div
                className={[
                  "mx-2 mb-4 h-0.5 w-12 transition-colors duration-300",
                  current > step.id ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function RegisterGymPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [step, setStep] = useState<StepId>(1);

  const [gymInfo, setGymInfo] = useState<GymInfoForm>({
    gymName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [gymErrors, setGymErrors] = useState<Partial<GymInfoForm>>({});

  const [admin, setAdmin] = useState<AdminForm>({
    ownerName: "",
    adminEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [adminErrors, setAdminErrors] = useState<Partial<Record<keyof AdminForm, string>>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Field helpers ────────────────────────────────────────────────────────────

  function updateGym(key: keyof GymInfoForm, value: string) {
    setGymInfo((p) => ({ ...p, [key]: value }));
    if (gymErrors[key]) setGymErrors((p) => ({ ...p, [key]: undefined }));
  }

  function updateAdmin(key: keyof AdminForm, value: string) {
    setAdmin((p) => ({ ...p, [key]: value }));
    if (adminErrors[key]) setAdminErrors((p) => ({ ...p, [key]: undefined }));
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  function handleNext() {
    if (step === 1) {
      const errors = validateGymInfo(gymInfo);
      if (Object.keys(errors).length > 0) { setGymErrors(errors); return; }
    }
    if (step === 2) {
      const errors = validateAdmin(admin);
      if (Object.keys(errors).length > 0) { setAdminErrors(errors); return; }
    }
    setStep((s) => (s < 3 ? ((s + 1) as StepId) : s));
  }

  function handleBack() {
    setStep((s) => (s > 1 ? ((s - 1) as StepId) : s));
  }

  // ── Final submit ─────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setApiError("");
    setIsSubmitting(true);
    try {
      const response = await authService.registerGym({
        gymName: gymInfo.gymName,
        ownerName: admin.ownerName,
        email: admin.adminEmail,
        password: admin.password,
        phone: gymInfo.phone || undefined,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = response.data as any;
      const user = data.user;
      if (user) {
        setUser(user);
        setSuccess(true);
        setTimeout(() => {
          navigate(getRoleDashboard(user.role as UserRole), { replace: true });
        }, 1800);
      } else {
        setSuccess(true);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setApiError(
        axiosErr.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render steps ─────────────────────────────────────────────────────────────

  if (success) {
    return (
      <AuthLayout title="You're all set!" subtitle="Your gym has been registered successfully.">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <p className="text-sm text-(--text-secondary)">
            Taking you to your dashboard…
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Register Your Gym"
      subtitle="Create your GymPro account and start managing your gym"
    >
      <StepIndicator current={step} />

      {apiError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* ── Step 1: Gym Info ── */}
      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Gym Name"
            placeholder="e.g. Iron Peak Fitness"
            value={gymInfo.gymName}
            onChange={(e) => updateGym("gymName", e.target.value)}
            error={gymErrors.gymName}
            autoFocus
            required
          />
          <Input
            label="Gym Email"
            type="email"
            placeholder="gym@example.com"
            value={gymInfo.email}
            onChange={(e) => updateGym("email", e.target.value)}
            error={gymErrors.email}
            required
          />
          <Input
            label="Phone (optional)"
            type="tel"
            placeholder="+1 555 000 0000"
            value={gymInfo.phone}
            onChange={(e) => updateGym("phone", e.target.value)}
            error={gymErrors.phone}
          />
          <Input
            label="Address (optional)"
            placeholder="123 Main St, City, State"
            value={gymInfo.address}
            onChange={(e) => updateGym("address", e.target.value)}
          />
          <Button fullWidth size="lg" onClick={handleNext}>
            Continue
          </Button>
        </div>
      )}

      {/* ── Step 2: Admin Account ── */}
      {step === 2 && (
        <div className="space-y-4">
          <Input
            label="Your Full Name"
            placeholder="Jane Smith"
            value={admin.ownerName}
            onChange={(e) => updateAdmin("ownerName", e.target.value)}
            error={adminErrors.ownerName}
            autoFocus
            required
          />
          <Input
            label="Admin Email"
            type="email"
            placeholder="you@example.com"
            value={admin.adminEmail}
            onChange={(e) => updateAdmin("adminEmail", e.target.value)}
            error={adminErrors.adminEmail}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={admin.password}
            onChange={(e) => updateAdmin("password", e.target.value)}
            error={adminErrors.password}
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            value={admin.confirmPassword}
            onChange={(e) => updateAdmin("confirmPassword", e.target.value)}
            error={adminErrors.confirmPassword}
            autoComplete="new-password"
            required
          />
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" fullWidth size="lg" onClick={handleBack}>
              Back
            </Button>
            <Button fullWidth size="lg" onClick={handleNext}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirmation ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="rounded-xl border border-(--border) bg-(--surface-secondary) p-4 space-y-3 text-sm">
            <p className="font-semibold text-(--text-primary) pb-1 border-b border-(--border)">
              Gym Details
            </p>
            <Row label="Gym Name"  value={gymInfo.gymName} />
            <Row label="Gym Email" value={gymInfo.email} />
            {gymInfo.phone   && <Row label="Phone"   value={gymInfo.phone} />}
            {gymInfo.address && <Row label="Address" value={gymInfo.address} />}

            <p className="font-semibold text-(--text-primary) pt-2 pb-1 border-b border-(--border)">
              Admin Account
            </p>
            <Row label="Owner"       value={admin.ownerName} />
            <Row label="Admin Email" value={admin.adminEmail} />
            <Row label="Password"    value="••••••••" />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth size="lg" onClick={handleBack} disabled={isSubmitting}>
              Back
            </Button>
            <Button
              fullWidth
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Creating…" : "Create Gym"}
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="mt-4 text-center text-sm text-(--text-muted)">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

// ─── Small helper component ────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-(--text-muted)">{label}</span>
      <span className="font-medium text-(--text-primary) text-right">{value}</span>
    </div>
  );
}
