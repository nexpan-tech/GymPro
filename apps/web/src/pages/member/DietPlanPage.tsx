import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Salad, Flame, UserCircle } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { dietService, type TodayDiet, type DietWeek } from "@/services/diet.service";
import PersonalDietsPanel from "@/components/member/PersonalDietsPanel";
import { personalDietService, type PersonalDiet } from "@/services/personal.service";

// Meal ordering for a sensible daily flow.
const MEAL_ORDER: Record<string, number> = {
  BREAKFAST: 0, MORNING_SNACK: 1, PRE_WORKOUT: 1, LUNCH: 2, SNACK: 3, EVENING_SNACK: 4, POST_WORKOUT: 4, DINNER: 5,
};

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
function todayWeekday() { return WEEKDAYS[new Date().getDay()]; }

function SectionLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-(--text-muted)">
      {icon}
      {children}
    </div>
  );
}

function dietTotals(d: PersonalDiet) {
  return d.meals.reduce((s, m) => s + (m.calories ?? 0), 0);
}

function mealTypeLabel(t: string) {
  return t.toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function DietPlanPage() {
  const [view, setView] = useState<"today" | "week" | "personal">("today");
  const [today, setToday] = useState<TodayDiet | null>(null);
  const [week, setWeek] = useState<DietWeek | null>(null);
  const [personal, setPersonal] = useState<PersonalDiet[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([
        dietService.getMyToday(),
        personalDietService.list({ archived: false }).catch(() => [] as PersonalDiet[]),
      ]);
      setToday(t);
      setPersonal(p);
    } catch (error) {
      console.error("Failed to load diet plan:", error);
      setToday(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (view === "week" && !week) void dietService.getMyWeek().then(setWeek).catch(() => setWeek(null));
  }, [view, week]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Today's Diet" description="Your nutrition plan for today." />
        <Skeleton height="h-32" />
        <Skeleton height="h-48" />
      </div>
    );
  }

  const meals = [...(today?.meals ?? [])].sort(
    (a, b) => (MEAL_ORDER[a.mealType] ?? 9) - (MEAL_ORDER[b.mealType] ?? 9),
  );
  const totalKcal = meals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const dayLabel = today?.day ? today.day.charAt(0).toUpperCase() + today.day.slice(1) : "Today";

  return (
    <div className="space-y-6">
      <PageHeader title="My Diet" description={view === "today" ? `Your meals for ${dayLabel}.` : "Your full week of nutrition."} />

      {/* Today / Week toggle */}
      <div className="flex gap-1 rounded-2xl bg-(--surface-secondary) p-1">
        {(["today", "week", "personal"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold capitalize transition ${view === v ? "bg-(--surface) text-(--text-primary) shadow-sm" : "text-(--text-secondary)"}`}
          >
            {v === "today" ? "Today" : v === "week" ? "Weekly" : "Personal"}
          </button>
        ))}
      </div>

      {view === "personal" ? (
        <PersonalDietsPanel />
      ) : view === "week" ? (
        <DietWeekView week={week} personal={personal} onManage={() => setView("personal")} />
      ) : (
      <div className="space-y-6">
      <section className="space-y-3">
      <SectionLabel icon={<Salad className="h-3.5 w-3.5" />}>Trainer Assigned</SectionLabel>
      <Card variant="premium">
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(image:--gradient-primary) text-white">
                <Salad className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-(--text-secondary)">Nutrition goal</p>
                <h2 className="text-2xl font-black text-(--text-primary)">{today?.goal || "Balanced nutrition"}</h2>
              </div>
            </div>
            {totalKcal > 0 && (
              <div className="text-right">
                <p className="flex items-center gap-1 text-2xl font-black text-(--flame)"><Flame className="h-5 w-5" />{totalKcal.toLocaleString()}</p>
                <p className="text-xs text-(--text-secondary)">kcal today</p>
              </div>
            )}
          </div>
          {today?.dayPlanText && (
            <p className="mt-5 rounded-2xl bg-(--surface-secondary) p-4 text-sm leading-6 text-(--text-secondary)">{today.dayPlanText}</p>
          )}
        </CardContent>
      </Card>

      {meals.length === 0 ? (
        <Card variant="glass">
          <CardContent>
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-(--surface-secondary) text-(--text-secondary)">
                <Salad className="h-7 w-7" />
              </div>
              <p className="font-semibold text-(--text-primary)">No meals planned for today</p>
              <p className="text-sm text-(--text-secondary)">Your trainer hasn't set meals for {dayLabel.toLowerCase()} yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {meals.map((m) => (
            <Card key={m.id} variant="glass" hover>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-(--flame)">
                      {mealTypeLabel(m.mealType)}{m.time ? ` · ${m.time}` : ""}
                    </p>
                    <p className="mt-0.5 text-base font-semibold text-(--text-primary)">{m.title}</p>
                    {m.description && <p className="mt-0.5 text-sm text-(--text-secondary)">{m.description}</p>}
                    <p className="mt-1 text-xs text-(--text-muted)">
                      {m.calories != null ? `${m.calories} kcal` : ""}
                      {m.protein != null ? ` · P ${m.protein}g` : ""}
                      {m.carbs != null ? ` · C ${m.carbs}g` : ""}
                      {m.fats != null ? ` · F ${m.fats}g` : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </section>

      {/* Personal Plan — same day, below trainer */}
      {personal.filter((p) => (p.dayOfWeek ?? "").toLowerCase() === todayWeekday()).length > 0 && (
        <section className="space-y-3">
          <SectionLabel icon={<UserCircle className="h-3.5 w-3.5" />}>Personal Plan</SectionLabel>
          <div className="space-y-2">
            {personal
              .filter((p) => (p.dayOfWeek ?? "").toLowerCase() === todayWeekday())
              .map((p) => {
                const kcal = dietTotals(p);
                return (
                  <Card key={p.id} variant="glass" className="cursor-pointer transition hover:border-(--flame)/40" onClick={() => setView("personal")}>
                    <CardContent className="p-4!">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-(--text-primary)">{p.title}</p>
                          <p className="truncate text-xs text-(--text-secondary)">{p.meals.length} meal{p.meals.length === 1 ? "" : "s"}{kcal > 0 ? ` · ${kcal} kcal` : ""}{p.category ? ` · ${p.category}` : ""}</p>
                        </div>
                        <Badge variant="default">Personal</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
          <p className="text-xs text-(--text-muted)">Manage these in the <button onClick={() => setView("personal")} className="font-semibold text-(--flame)">Personal</button> tab.</p>
        </section>
      )}
      </div>
      )}
    </div>
  );
}

function DietWeekView({ week, personal, onManage }: { week: DietWeek | null; personal: PersonalDiet[]; onManage: () => void }) {
  if (!week) {
    return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="h-20" />)}</div>;
  }
  return (
    <div className="space-y-2">
      {week.days.map((d) => {
        const dayPersonal = personal.filter((p) => (p.dayOfWeek ?? "").toLowerCase() === d.day.toLowerCase());
        return (
        <Card key={d.day} variant={d.isToday ? "premium" : "glass"} className={d.mealCount === 0 && dayPersonal.length === 0 ? "opacity-70" : ""}>
          <CardContent>
            <div className="space-y-2">
              {/* Trainer Assigned */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-(--text-muted)">Trainer Assigned</p>
                  <p className="text-sm font-semibold capitalize text-(--text-primary)">{d.day}{d.isToday ? " · Today" : ""}</p>
                  <p className="truncate text-xs text-(--text-secondary)">
                    {d.mealCount > 0 ? `${d.mealCount} meal${d.mealCount === 1 ? "" : "s"} · ${d.totals.kcal} kcal · P${d.totals.protein} C${d.totals.carbs} F${d.totals.fats}` : "No meals planned"}
                  </p>
                </div>
                {d.source && <Badge variant="info">{d.source === "TRAINER" ? "Trainer" : "Personal"}</Badge>}
              </div>
              {/* Personal Plan — below trainer */}
              {dayPersonal.length > 0 && (
                <div className="border-t border-border pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-(--flame)">Personal Plan</p>
                  {dayPersonal.map((p) => (
                    <button key={p.id} onClick={onManage} className="block max-w-full truncate text-left text-sm font-semibold text-(--text-primary) hover:text-(--flame)">
                      {p.title}
                      <span className="text-xs font-normal text-(--text-secondary)">{" "}· {p.meals.length} meal{p.meals.length === 1 ? "" : "s"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
