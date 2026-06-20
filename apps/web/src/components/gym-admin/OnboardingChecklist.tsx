import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, X, Rocket, ArrowRight } from "lucide-react";
import { branchService } from "@/services/branch.service";
import { memberService } from "@/services/member.service";
import { trainerService } from "@/services/trainer.service";
import { membershipService } from "@/services/membership.service";

const DISMISS_KEY = "gympro_onboarding_dismissed";

interface Step { key: string; label: string; hint: string; done: boolean; to: string }

/**
 * First-customer onboarding checklist. Derives completion from REAL data
 * (branches, trainers, members, memberships) — no fake data. Self-contained:
 * fetches its own counts with safe fallbacks and renders above the dashboard.
 * Auto-hides once the core steps are complete (or when dismissed).
 */
export default function OnboardingChecklist() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");

  useEffect(() => {
    if (dismissed) return;
    let active = true;
    (async () => {
      const [branches, trainersRes, membersRes, memberships] = await Promise.all([
        branchService.list().catch(() => [] as unknown[]),
        trainerService.list().catch(() => null),
        memberService.list().catch(() => null),
        membershipService.list().catch(() => [] as unknown[]),
      ]);
      const trainerCount = (trainersRes as { data?: { trainers?: unknown[] } } | null)?.data?.trainers?.length ?? 0;
      const memberCount = (membersRes as { data?: { members?: unknown[] } } | null)?.data?.members?.length ?? 0;
      const next: Step[] = [
        { key: "branch", label: "Create your first branch", hint: "Add the location your members train at.", done: (branches as unknown[]).length > 0, to: "/gym-admin/branches" },
        { key: "trainers", label: "Invite trainers", hint: "Give your trainers their own login and workspace.", done: trainerCount > 0, to: "/gym-admin/trainers" },
        { key: "members", label: "Add your members", hint: "Register members or import your existing list.", done: memberCount > 0, to: "/gym-admin/members" },
        { key: "membership", label: "Activate a membership", hint: "Set up plans and activate a member's first membership.", done: (memberships as unknown[]).length > 0, to: "/gym-admin/memberships" },
      ];
      if (active) setSteps(next);
    })();
    return () => { active = false; };
  }, [dismissed]);

  if (dismissed || !steps) return null;

  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  if (done === steps.length) return null; // fully onboarded → hide

  function dismiss() { localStorage.setItem(DISMISS_KEY, "1"); setDismissed(true); }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-(--flame)/30 bg-(image:--gradient-surface) p-5 shadow-(--shadow-md)">
      <button onClick={dismiss} aria-label="Dismiss" className="absolute right-3 top-3 rounded-lg p-1.5 text-(--text-muted) hover:bg-(--surface-secondary) hover:text-(--text-primary)"><X className="h-4 w-4" /></button>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-(--flame)/15 text-(--flame)"><Rocket className="h-5 w-5" /></div>
        <div>
          <p className="font-bold text-(--text-primary)">Finish setting up your gym</p>
          <p className="text-sm text-(--text-secondary)">{done} of {steps.length} steps complete</p>
        </div>
        <div className="ml-auto hidden w-40 sm:block">
          <div className="h-2 w-full overflow-hidden rounded-full bg-(--surface-secondary)"><div className="h-full rounded-full bg-(--flame) transition-all" style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 text-right text-xs font-semibold text-(--text-primary)">{pct}%</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((s) => (
          <button key={s.key} onClick={() => navigate(s.to)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition hover:border-(--flame)/40 ${s.done ? "border-border bg-(--surface)/60 opacity-70" : "border-border bg-(--surface)"}`}>
            {s.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-(--flame)" /> : <Circle className="h-5 w-5 shrink-0 text-(--text-muted)" />}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${s.done ? "text-(--text-secondary) line-through" : "text-(--text-primary)"}`}>{s.label}</p>
              {!s.done && <p className="truncate text-xs text-(--text-muted)">{s.hint}</p>}
            </div>
            {!s.done && <ArrowRight className="h-4 w-4 shrink-0 text-(--text-muted)" />}
          </button>
        ))}
      </div>
    </div>
  );
}
