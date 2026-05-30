// src/layouts/AuthLayout.tsx
// Split auth layout: left branding panel + right form area
import type { PropsWithChildren } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle,
  CreditCard,
  Dumbbell,
  Users,
} from "lucide-react";

// ── Feature list shown in the left branding panel ────────────────────────────
const FEATURES = [
  { icon: Users,     text: "Member Management & CRM" },
  { icon: CheckCircle, text: "Attendance Tracking" },
  { icon: CreditCard, text: "Billing & Auto-Renewals" },
  { icon: Dumbbell,  text: "Workout & Diet Plans" },
  { icon: BarChart3, text: "Analytics & Revenue Reports" },
  { icon: Activity,  text: "Real-time System Monitoring" },
] as const;

// ── Props ─────────────────────────────────────────────────────────────────────
interface AuthLayoutProps {
  title: string;
  subtitle: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AuthLayout({
  children,
  title,
  subtitle,
}: PropsWithChildren<AuthLayoutProps>) {
  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel ─────────────────────────────────────────── */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-120 xl:w-130"
        style={{
          background: "linear-gradient(145deg, #1e1b4b 0%, #312e81 35%, #4c1d95 70%, #1e1b4b 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div
            className="absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: "#818cf8" }}
          />
          <div
            className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: "#c084fc" }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl"
            style={{ backgroundColor: "#38bdf8" }}
          />
        </div>

        {/* Top: Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              boxShadow: "0 12px 32px rgba(99,102,241,0.45)",
            }}
          >
            GP
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              GymPro
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-300">
              Premium Gym OS
            </p>
          </div>
        </div>

        {/* Middle: tagline + features */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-black leading-tight text-white">
              The complete platform for modern gyms.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-indigo-200">
              Manage members, trainers, payments, and growth — all from one
              intelligent dashboard.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                >
                  <Icon className="h-3.5 w-3.5 text-indigo-200" />
                </div>
                <span className="text-sm font-medium text-indigo-100">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: testimonial / social proof */}
        <div
          className="relative rounded-2xl p-4"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <p className="text-sm leading-relaxed text-indigo-100">
            "GymPro transformed how we run our 3 branches. Revenue up 40% in
            the first quarter."
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white"
              style={{
                background: "linear-gradient(135deg,#6366f1,#a855f7)",
              }}
            >
              RK
            </div>
            <div>
              <p className="text-xs font-bold text-white">Rajesh Kumar</p>
              <p className="text-[11px] text-indigo-300">Owner, FitZone Gyms</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────── */}
      <div
        className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10"
        style={{ backgroundColor: "var(--bg-page, #f8fafc)" }}
      >
        {/* Mobile logo — shown only on small screens */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white"
            style={{
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              boxShadow: "0 8px 20px rgba(79,70,229,0.3)",
            }}
          >
            GP
          </div>
          <span
            className="text-xl font-black tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            GymPro
          </span>
        </div>

        {/* Card */}
        <div className="w-full max-w-md">
          <div
            className="w-full rounded-3xl border p-8 shadow-lg"
            style={{
              background: "var(--surface-solid, #ffffff)",
              borderColor: "var(--border, rgba(15,23,42,0.10))",
              boxShadow: "var(--shadow-lg, 0 20px 55px rgba(15,23,42,0.10))",
            }}
          >
            {/* Heading */}
            <div className="mb-6">
              <h1
                className="text-2xl font-black tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h1>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {subtitle}
              </p>
            </div>

            {/* Form slot */}
            {children}
          </div>

          {/* Footer note */}
          <p
            className="mt-6 text-center text-[11px]"
            style={{ color: "var(--text-muted)" }}
          >
            By continuing you agree to GymPro's{" "}
            <a
              href="#"
              className="underline underline-offset-2 transition-colors"
              style={{ color: "var(--primary-600, #4f46e5)" }}
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="underline underline-offset-2 transition-colors"
              style={{ color: "var(--primary-600, #4f46e5)" }}
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
