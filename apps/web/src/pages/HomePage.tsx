import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dumbbell, QrCode, Salad, Trophy, Share2, Gift, BarChart3, ReceiptIndianRupee,
  Building2, ShieldCheck, Users, Smartphone, CheckCircle2, ArrowRight, Menu, X, Star,
} from "lucide-react";
import { APP_CONFIG } from "@/config/app.config";

const FEATURES = [
  { icon: Building2, title: "Gym Admin Console", desc: "Members, memberships, branches, payments, attendance and reports in one command center." },
  { icon: Dumbbell, title: "Trainer Workspace", desc: "Bulk-assign workouts & diets, track progress, review attendance, message members." },
  { icon: Smartphone, title: "Member Mobile App", desc: "Today's plan, attendance streaks, goals, rewards and chat — in their pocket." },
  { icon: QrCode, title: "QR Check-in & Attendance", desc: "Fast QR check-ins with offline support, streaks and attendance analytics." },
  { icon: Salad, title: "Workout & Diet Plans", desc: "Personal and trainer-assigned plans, weekly schedules, history and completion tracking." },
  { icon: Trophy, title: "Leaderboards & Gamification", desc: "Points, levels, badges and challenges that keep members coming back." },
  { icon: Share2, title: "Referral System", desc: "Permanent referral codes, QR sharing, and rewards that only pay on real conversions." },
  { icon: Gift, title: "Rewards & Redemptions", desc: "Configurable reward rules with admin-approved claims and inventory control." },
  { icon: BarChart3, title: "Analytics & Insights", desc: "Retention, engagement, revenue and churn — real numbers, no guesswork." },
  { icon: ReceiptIndianRupee, title: "License-Based Billing", desc: "Flat monthly SaaS pricing with GST invoices, trials, renewals and capacity limits." },
  { icon: ShieldCheck, title: "Secure & Multi-Tenant", desc: "Strict per-gym isolation, RBAC, JWT auth, rate limiting and audit logs." },
  { icon: Users, title: "Roles for Everyone", desc: "Super Admin, Gym Admin, Branch Manager, Receptionist, Trainer and Member." },
];

const PLANS = [
  { name: "Launch", price: "₹1,499", members: "100 members", branches: "1 branch", highlight: false },
  { name: "Scale", price: "₹2,999", members: "250 members", branches: "3 branches", highlight: true },
  { name: "Elite", price: "₹4,999", members: "500 members", branches: "10 branches", highlight: false },
  { name: "Enterprise", price: "Custom", members: "Unlimited", branches: "Unlimited", highlight: false },
];

const WHY = [
  "One platform for admins, trainers and members — no spreadsheets",
  "Members pay your gym directly; GymPro never touches member money",
  "Predictable flat monthly pricing — simple accounting, no surprises",
  "Production-grade security: RBAC, multi-tenant isolation, audit logs",
  "Works on web and mobile (Android & iOS) out of the box",
  "Built-in growth engine: referrals, rewards and leaderboards",
];

const FAQS = [
  { q: "How does billing work?", a: "You pay GymPro a flat monthly license fee based on your member capacity. Your members continue paying your gym directly — GymPro never collects member payments." },
  { q: "Is there a free trial?", a: "Yes. Every new gym starts on a trial with billing disabled. You only start paying after the trial ends." },
  { q: "Can I run multiple branches?", a: "Absolutely. Branch capacity is included in your plan, and higher tiers unlock more branches and staff seats." },
  { q: "Do members get a mobile app?", a: "Yes — members get a native mobile experience for attendance, workouts, diets, goals, rewards and chat." },
  { q: "Is my data isolated from other gyms?", a: "Every gym is fully isolated with strict multi-tenant boundaries, role-based access control and audit logging." },
  { q: "What happens when I reach my member limit?", a: "You'll be prompted to upgrade. Your existing members are never affected — only new activations beyond your capacity are paused until you upgrade." },
];

function NavBar() {
  const [open, setOpen] = useState(false);
  const links = [["Features", "#features"], ["Pricing", "#pricing"], ["Why GymPro", "#why"], ["FAQ", "#faq"]] as const;
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-(--surface)/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center gap-2 font-black text-(--text-primary)">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-(image:--gradient-primary) text-white"><Dumbbell className="h-5 w-5" /></span>
          {APP_CONFIG.appName}
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map(([l, h]) => <a key={l} href={h} className="text-sm font-medium text-(--text-secondary) hover:text-(--text-primary)">{l}</a>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-(--text-primary) hover:bg-(--surface-secondary)">Login</Link>
          <Link to="/register-gym" className="rounded-xl bg-(image:--gradient-primary) px-4 py-2 text-sm font-semibold text-white shadow-(--shadow-sm)">Start Free Trial</Link>
        </div>
        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="border-t border-border px-5 py-3 md:hidden">
          {links.map(([l, h]) => <a key={l} href={h} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-(--text-secondary)">{l}</a>)}
          <div className="mt-2 flex gap-2">
            <Link to="/login" className="flex-1 rounded-xl border border-border py-2 text-center text-sm font-semibold">Login</Link>
            <Link to="/register-gym" className="flex-1 rounded-xl bg-(image:--gradient-primary) py-2 text-center text-sm font-semibold text-white">Free Trial</Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen((o) => !o)} className="w-full rounded-2xl border border-border bg-(--surface) p-5 text-left transition hover:border-(--flame)/40">
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-(--text-primary)">{q}</span>
        <span className={`text-(--flame) transition ${open ? "rotate-45" : ""}`}>+</span>
      </div>
      {open && <p className="mt-3 text-sm leading-6 text-(--text-secondary)">{a}</p>}
    </button>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-(--surface) text-(--text-primary)">
      <NavBar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-(--flame)/20 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-(--surface-secondary) px-3 py-1 text-xs font-semibold text-(--text-secondary)">
              <Star className="h-3.5 w-3.5 text-(--flame)" /> The all-in-one gym management SaaS
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Run your gym like a <span className="text-(--flame)">pro</span>.
            </h1>
            <p className="mt-5 max-w-md text-lg text-(--text-secondary)">
              {APP_CONFIG.appName} brings members, trainers, attendance, workouts, billing and growth into one premium platform — on web and mobile.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register-gym" className="inline-flex items-center gap-2 rounded-xl bg-(image:--gradient-primary) px-6 py-3.5 font-semibold text-white shadow-(--shadow-md)">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#contact" className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3.5 font-semibold text-(--text-primary) hover:bg-(--surface-secondary)">
                Book a Demo
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-(--text-muted)">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-(--flame)" /> Free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-(--flame)" /> No card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-(--flame)" /> Cancel anytime</span>
            </div>
          </div>
          <div className="relative grid place-items-center">
            <div className="w-full max-w-md rounded-3xl border border-border bg-(image:--gradient-surface) p-6 shadow-(--shadow-xl)">
              <div className="grid grid-cols-2 gap-4">
                {[["Active members", "1,284"], ["Attendance today", "412"], ["MRR", "₹2.9L"], ["Retention", "94%"]].map(([l, v]) => (
                  <div key={l} className="rounded-2xl border border-border bg-(--surface) p-4">
                    <p className="text-xs text-(--text-muted)">{l}</p>
                    <p className="mt-1 text-2xl font-black">{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-border bg-(--surface) p-4">
                <div className="flex items-center justify-between text-xs text-(--text-muted)"><span>Member capacity</span><span>228 / 250</span></div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-(--surface-secondary)"><div className="h-full rounded-full bg-(--flame)" style={{ width: "91%" }} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-16">
        <SectionHead eyebrow="Everything you need" title="One platform. Every role." subtitle="From the front desk to the treadmill to the boardroom." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-(--surface) p-6 transition hover:-translate-y-1 hover:border-(--flame)/40 hover:shadow-(--shadow-lg)">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-(--flame)/10 text-(--flame)"><f.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-(--text-secondary)">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why GymPro ────────────────────────────────────────────────────── */}
      <section id="why" className="bg-(--surface-secondary)/40 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2 md:items-center">
          <div>
            <SectionHead eyebrow="Why GymPro" title="Built for real gyms, ready for thousands." align="left" />
            <ul className="mt-6 space-y-3">
              {WHY.map((w) => (
                <li key={w} className="flex items-start gap-3 text-(--text-secondary)"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-(--flame)" /><span>{w}</span></li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[["10+", "modules"], ["5", "user roles"], ["100%", "multi-tenant"], ["24/7", "uptime target"]].map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-border bg-(--surface) p-6 text-center">
                <p className="text-3xl font-black text-(--flame)">{v}</p>
                <p className="mt-1 text-sm text-(--text-secondary)">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-7xl px-5 py-16">
        <SectionHead eyebrow="Simple pricing" title="Flat monthly licenses" subtitle="Pick a capacity. Your members always pay you directly." />
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {PLANS.map((p) => (
            <div key={p.name} className={`flex flex-col rounded-3xl border p-6 ${p.highlight ? "border-(--flame) bg-(image:--gradient-surface) shadow-(--shadow-lg)" : "border-border bg-(--surface)"}`}>
              {p.highlight && <span className="mb-3 w-fit rounded-full bg-(--flame) px-2.5 py-0.5 text-[11px] font-bold text-white">MOST POPULAR</span>}
              <p className="font-bold">{p.name}</p>
              <p className="mt-2 text-3xl font-black">{p.price}<span className="text-sm font-normal text-(--text-muted)">{p.price === "Custom" ? "" : "/mo"}</span></p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-(--text-secondary)">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-(--flame)" />{p.members}</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-(--flame)" />{p.branches}</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-(--flame)" />All core modules</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-(--flame)" />GST invoices</li>
              </ul>
              <Link to="/register-gym" className={`mt-6 rounded-xl py-2.5 text-center text-sm font-semibold ${p.highlight ? "bg-(image:--gradient-primary) text-white" : "border border-border text-(--text-primary) hover:bg-(--surface-secondary)"}`}>
                {p.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-(--text-muted)">Prices shown are representative. GST applicable. Final pricing is confirmed during onboarding.</p>
      </section>

      {/* ── Testimonials (placeholder) ────────────────────────────────────── */}
      <section className="bg-(--surface-secondary)/40 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHead eyebrow="Loved by gyms" title="What owners will say" subtitle="Real testimonials land here after launch." />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-(--surface) p-6">
                <div className="flex gap-1 text-(--flame)">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-(--flame)" />)}</div>
                <p className="mt-3 text-sm text-(--text-secondary)">"Placeholder testimonial — a real gym owner's words about how GymPro transformed their operations will appear here."</p>
                <p className="mt-4 text-sm font-semibold">Gym Owner</p>
                <p className="text-xs text-(--text-muted)">City, India</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-16">
        <SectionHead eyebrow="Questions" title="Frequently asked" />
        <div className="mt-8 space-y-3">{FAQS.map((f) => <Faq key={f.q} {...f} />)}</div>
      </section>

      {/* ── CTA / Contact ─────────────────────────────────────────────────── */}
      <section id="contact" className="mx-auto max-w-7xl px-5 pb-16">
        <div className="overflow-hidden rounded-3xl border border-(--flame)/30 bg-(image:--gradient-surface) p-10 text-center shadow-(--shadow-xl)">
          <h2 className="text-3xl font-black md:text-4xl">Ready to grow your gym?</h2>
          <p className="mx-auto mt-3 max-w-xl text-(--text-secondary)">Start your free trial today, or book a demo and we'll walk you through everything.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/register-gym" className="inline-flex items-center gap-2 rounded-xl bg-(image:--gradient-primary) px-6 py-3.5 font-semibold text-white shadow-(--shadow-md)">Start Free Trial <ArrowRight className="h-4 w-4" /></Link>
            <a href="mailto:sales@gympro.app" className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3.5 font-semibold hover:bg-(--surface-secondary)">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2 font-black"><span className="grid h-7 w-7 place-items-center rounded-lg bg-(image:--gradient-primary) text-white"><Dumbbell className="h-4 w-4" /></span>{APP_CONFIG.appName}</div>
          <div className="flex flex-wrap items-center gap-5 text-sm text-(--text-secondary)">
            <a href="#features" className="hover:text-(--text-primary)">Features</a>
            <a href="#pricing" className="hover:text-(--text-primary)">Pricing</a>
            <a href="#faq" className="hover:text-(--text-primary)">FAQ</a>
            <Link to="/privacy" className="hover:text-(--text-primary)">Privacy</Link>
            <Link to="/terms" className="hover:text-(--text-primary)">Terms</Link>
            <Link to="/login" className="hover:text-(--text-primary)">Login</Link>
          </div>
        </div>
        <p className="pb-8 text-center text-xs text-(--text-muted)">© {new Date().getFullYear()} {APP_CONFIG.appName}. All rights reserved.</p>
      </footer>
    </div>
  );
}

function SectionHead({ eyebrow, title, subtitle, align = "center" }: { eyebrow: string; title: string; subtitle?: string; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <p className="text-xs font-bold uppercase tracking-widest text-(--flame)">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{title}</h2>
      {subtitle && <p className={`mt-2 text-(--text-secondary) ${align === "center" ? "mx-auto max-w-2xl" : ""}`}>{subtitle}</p>}
    </div>
  );
}
