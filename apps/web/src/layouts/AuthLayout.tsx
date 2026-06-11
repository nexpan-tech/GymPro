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
import ThemeToggle from "@/components/layout/ThemeToggle";

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
      {/* ── Left branding panel — Jet Black ─────────────────────────────── */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-120 xl:w-130"
        style={{
          background:
            "linear-gradient(145deg, #010000 0%, #0a0a0a 45%, #0a0a0a 75%, #010000 100%)",
        }}
      >
        {/* Decorative blobs — Crimson Blaze + Varden warm glow */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div
            className="absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
            style={{ backgroundColor: "#e73725" }}
          />
          <div
            className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: "#a11f13" }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl"
            style={{ backgroundColor: "#f4f4f4" }}
          />
          {/* Athletic grid texture — subtle depth, fades toward the top-right. */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(130% 130% at 100% 0%, #000 0%, transparent 72%)",
              WebkitMaskImage: "radial-gradient(130% 130% at 100% 0%, #000 0%, transparent 72%)",
            }}
          />
        </div>

        {/* Top: Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg, #e73725 0%, #a11f13 100%)",
              boxShadow: "0 12px 32px rgba(231,55,37,0.45)",
            }}
          >
            GP
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              GymPro
            </h1>
            <p
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: "#f4f4f4" }}
            >
              Premium Gym OS
            </p>
          </div>
        </div>

        {/* Middle: aspirational headline + proof metrics */}
        <div className="reveal relative space-y-9">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/55">
              Premium Gym Operating System
            </p>
            <h2 className="text-display mt-4 text-[2.75rem] text-white">
              Run a gym members
              <br />
              never want to <span className="text-gradient-red">leave.</span>
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-white/65">
              Members, training, billing, retention and growth — engineered into
              one performance platform. Built for transformation.
            </p>
          </div>

          {/* Proof metric strip */}
          <div className="grid max-w-md grid-cols-3 gap-3">
            {[
              { v: "+40%", l: "Avg. revenue lift" },
              { v: "10k+", l: "Members managed" },
              { v: "99.9%", l: "Platform uptime" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm"
              >
                <p className="metric-number text-2xl text-white">{s.v}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  {s.l}
                </p>
              </div>
            ))}
          </div>

          {/* Capability chips */}
          <ul className="flex flex-wrap gap-2">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: testimonial / social proof */}
        <div
          className="relative rounded-2xl p-4"
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.16)",
          }}
        >
          <p
            className="text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            "GymPro transformed how we run our 3 branches. Revenue up 40% in
            the first quarter."
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white"
              style={{
                background: "linear-gradient(135deg,#e73725,#a11f13)",
              }}
            >
              RK
            </div>
            <div>
              <p className="text-xs font-bold text-white">Rajesh Kumar</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                Owner, FitZone Gyms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────── */}
      <div
        className="relative flex flex-1 flex-col items-center justify-center p-6 sm:p-10"
        style={{ backgroundColor: "var(--bg-page, #ffffff)" }}
      >
        {/* Theme toggle — available on every auth page */}
        <div className="absolute right-5 top-5 z-10">
          <ThemeToggle />
        </div>

        {/* Mobile logo — shown only on small screens */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white"
            style={{
              background: "linear-gradient(135deg,#e73725,#a11f13)",
              boxShadow: "0 8px 20px rgba(231,55,37,0.3)",
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
        <div className="reveal w-full max-w-md">
          <div
            className="w-full rounded-3xl border p-8 shadow-lg"
            style={{
              background: "var(--surface-solid, #ffffff)",
              borderColor: "var(--border, rgba(1,0,0,0.10))",
              boxShadow: "var(--shadow-lg, 0 20px 55px rgba(1,0,0,0.10))",
            }}
          >
            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-display text-3xl" style={{ color: "var(--text-primary)" }}>
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
              style={{ color: "var(--primary)" }}
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="underline underline-offset-2 transition-colors"
              style={{ color: "var(--primary)" }}
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
