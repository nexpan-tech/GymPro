import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Dumbbell, CheckCircle2, CalendarDays, Clock, History as HistoryIcon, Flame, ChevronLeft, ChevronRight, UserCircle } from "lucide-react";
import PersonalWorkoutsPanel from "@/components/member/PersonalWorkoutsPanel";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  workoutService,
  type TodayWorkout,
  type WorkoutAssignmentFull,
  type WorkoutAssignmentStatus,
  type WorkoutWeek,
  type WorkoutDayStatus,
} from "@/services/workout.service";
import { useCelebrate } from "@/components/premium/CelebrationProvider";
import { personalWorkoutService, type PersonalWorkout } from "@/services/personal.service";

type Tab = "today" | "week" | "history" | "personal";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
function todayWeekday() { return WEEKDAYS[new Date().getDay()]; }

const DAY_STATUS_VARIANT: Record<WorkoutDayStatus, "info" | "success" | "warning" | "default"> = {
  SCHEDULED: "info", COMPLETED: "success", MISSED: "warning", SKIPPED: "default", REST: "default",
};

const STATUS_VARIANT: Record<WorkoutAssignmentStatus, "info" | "success" | "warning" | "default"> = {
  SCHEDULED: "info",
  COMPLETED: "success",
  EXPIRED: "warning",
  SKIPPED: "default",
};

function estimateMinutes(exerciseCount: number) {
  return Math.max(15, exerciseCount * 6);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function WorkoutPlanPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [today, setToday] = useState<TodayWorkout | null>(null);
  const [history, setHistory] = useState<WorkoutAssignmentFull[]>([]);
  const [personal, setPersonal] = useState<PersonalWorkout[]>([]);
  const [week, setWeek] = useState<WorkoutWeek | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const celebrate = useCelebrate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, h, p] = await Promise.all([
        workoutService.getToday().catch(() => ({ date: "", assignments: [] } as TodayWorkout)),
        workoutService.getHistory().catch(() => []),
        personalWorkoutService.list({ archived: false }).catch(() => []),
      ]);
      setToday(t);
      setHistory(h);
      setPersonal(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Weekly schedule loads on demand and when the week is changed.
  useEffect(() => {
    void workoutService.getWeek(weekOffset).then(setWeek).catch(() => setWeek(null));
  }, [weekOffset]);

  async function complete(id: string) {
    setCompleting(id);
    try {
      await workoutService.completeAssignment(id);
      celebrate("WORKOUT");
      await load();
    } finally {
      setCompleting(null);
    }
  }

  const todays = today?.assignments ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Workout" description="Your assigned training — today first, never the wrong day." />

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-(--surface-secondary) p-1">
        {([["today", "Today", Dumbbell], ["week", "Week", CalendarDays], ["history", "History", HistoryIcon], ["personal", "Personal", UserCircle]] as const).map(
          ([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                tab === key ? "bg-(--surface) text-(--text-primary) shadow-sm" : "text-(--text-secondary) hover:text-(--text-primary)"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ),
        )}
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height="h-40" />)}</div>
      ) : tab === "today" ? (
        <div className="space-y-6">
          {/* Trainer Assigned — always first */}
          <section className="space-y-3">
            <SectionLabel icon={<Dumbbell className="h-3.5 w-3.5" />}>Trainer Assigned</SectionLabel>
            {todays.length === 0 ? (
              <Card variant="glass">
                <CardContent>
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-(--surface-secondary) text-(--text-secondary)">
                      <Dumbbell className="h-7 w-7" />
                    </div>
                    <p className="font-semibold text-(--text-primary)">No workout assigned for today</p>
                    <p className="text-sm text-(--text-secondary)">Enjoy your rest day, or check your week ahead.</p>
                    <Button variant="secondary" onClick={() => setTab("week")}>View week</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
          <div className="space-y-5">
            {todays.map((a) => {
              const ex = a.workoutPlan.exercises ?? [];
              const done = a.status === "COMPLETED";
              return (
                <Card key={a.id} variant="premium">
                  <CardContent>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(image:--gradient-primary) text-white">
                          <Dumbbell className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-(--text-secondary)">Today's workout</p>
                          <h2 className="text-2xl font-black text-(--text-primary)">{a.workoutPlan.title}</h2>
                          {a.workoutPlan.trainer?.name && (
                            <p className="text-xs text-(--text-muted)">Assigned by {a.workoutPlan.trainer.name}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-4 text-sm text-(--text-secondary)">
                      <span className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-(--flame)" />{a.workoutPlan.difficulty}</span>
                      <span className="flex items-center gap-1.5"><Dumbbell className="h-4 w-4" />{ex.length} exercises</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />~{estimateMinutes(ex.length)} min</span>
                    </div>

                    {ex.length > 0 && (
                      <div className="mt-5 space-y-2">
                        {ex.map((e) => (
                          <div key={e.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-(--text-primary)">{e.exercise?.name}</p>
                              <p className="text-xs text-(--text-secondary)">
                                {e.sets} × {e.reps}
                                {e.restSeconds ? ` · ${e.restSeconds}s rest` : ""}
                                {e.exercise?.muscleGroup ? ` · ${e.exercise.muscleGroup}` : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-6">
                      {done ? (
                        <div className="flex items-center justify-center gap-2 rounded-2xl bg-(--success)/10 py-3 text-sm font-semibold text-(--success)">
                          <CheckCircle2 className="h-5 w-5" /> Completed{a.completedAt ? ` · ${fmtDate(a.completedAt)}` : ""}
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          fullWidth
                          disabled={completing === a.id}
                          onClick={() => void complete(a.id)}
                          iconLeft={<CheckCircle2 className="h-4 w-4" />}
                        >
                          {completing === a.id ? "Saving…" : "Mark workout complete"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
                  .map((p) => <PersonalWorkoutLine key={p.id} w={p} onClick={() => setTab("personal")} />)}
              </div>
              <p className="text-xs text-(--text-muted)">Manage these in the <button onClick={() => setTab("personal")} className="font-semibold text-(--flame)">Personal</button> tab.</p>
            </section>
          )}
        </div>
      ) : tab === "week" ? (
        <WeekSchedule week={week} offset={weekOffset} onOffset={setWeekOffset} personal={personal} onManage={() => setTab("personal")} />
      ) : tab === "personal" ? (
        <PersonalWorkoutsPanel />
      ) : (
        <AssignmentList items={history} emptyText="No completed or past workouts yet." />
      )}
    </div>
  );
}

function SectionLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-(--text-muted)">
      {icon}
      {children}
    </div>
  );
}

function PersonalWorkoutLine({ w, onClick }: { w: PersonalWorkout; onClick: () => void }) {
  return (
    <Card variant="glass" className="cursor-pointer transition hover:border-(--flame)/40" onClick={onClick}>
      <CardContent className="p-4!">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-(--text-primary)">{w.title}</p>
            <p className="truncate text-xs text-(--text-secondary)">
              {w.exercises.length} exercise{w.exercises.length === 1 ? "" : "s"}
              {w.estMinutes ? ` · ~${w.estMinutes} min` : ""}
              {w.category ? ` · ${w.category}` : ""}
            </p>
          </div>
          <Badge variant="default">Personal</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function WeekSchedule({ week, offset, onOffset, personal, onManage }: { week: WorkoutWeek | null; offset: number; onOffset: (n: number) => void; personal: PersonalWorkout[]; onManage: () => void }) {
  const label = offset === 0 ? "This Week" : offset === -1 ? "Last Week" : offset === 1 ? "Next Week" : `Week ${offset > 0 ? "+" : ""}${offset}`;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => onOffset(offset - 1)} iconLeft={<ChevronLeft className="h-4 w-4" />}>Prev</Button>
        <div className="text-center">
          <p className="text-sm font-semibold text-(--text-primary)">{label}</p>
          {week && <p className="text-xs text-(--text-muted)">{fmtDate(week.weekStart)} – {fmtDate(week.weekEnd)}</p>}
        </div>
        <Button variant="ghost" onClick={() => onOffset(offset + 1)} iconRight={<ChevronRight className="h-4 w-4" />}>Next</Button>
      </div>
      {!week ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {week.days.map((d) => {
            const dayPersonal = personal.filter((p) => (p.dayOfWeek ?? "").toLowerCase() === d.weekday.toLowerCase());
            return (
            <Card key={d.date} variant={d.isToday ? "premium" : "glass"} className={d.status === "REST" && dayPersonal.length === 0 ? "opacity-70" : ""}>
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="w-12 shrink-0 text-center">
                      <p className="text-xs font-semibold uppercase text-(--text-muted)">{d.weekday.slice(0, 3)}</p>
                      <p className="text-lg font-black text-(--text-primary)">{d.date.slice(8, 10)}</p>
                    </div>
                    <div className="min-w-0 space-y-2">
                      {/* Trainer Assigned */}
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-(--text-muted)">Trainer Assigned</p>
                        {d.plan ? (
                          <>
                            <p className="truncate text-sm font-semibold text-(--text-primary)">{d.plan.title}</p>
                            <p className="truncate text-xs text-(--text-secondary)">
                              {d.plan.exerciseCount} exercises · ~{d.plan.estMinutes} min{d.plan.muscles.length ? ` · ${d.plan.muscles.join(", ")}` : ""}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-(--text-muted)">Rest day</p>
                        )}
                      </div>
                      {/* Personal Plan — below trainer */}
                      {dayPersonal.length > 0 && (
                        <div className="min-w-0 border-t border-border pt-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-(--flame)">Personal Plan</p>
                          {dayPersonal.map((p) => (
                            <button key={p.id} onClick={onManage} className="block max-w-full truncate text-left text-sm font-semibold text-(--text-primary) hover:text-(--flame)">
                              {p.title}
                              <span className="text-xs font-normal text-(--text-secondary)">{" "}· {p.exercises.length} ex{p.estMinutes ? ` · ~${p.estMinutes}m` : ""}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={DAY_STATUS_VARIANT[d.status]}>{d.status === "REST" ? "REST" : d.status}</Badge>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssignmentList({ items, emptyText }: { items: WorkoutAssignmentFull[]; emptyText: string }) {
  if (items.length === 0) {
    return (
      <Card variant="glass">
        <CardContent>
          <p className="py-8 text-center text-sm text-(--text-secondary)">{emptyText}</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((a) => (
        <Card key={a.id} variant="glass">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-(--surface-secondary) text-(--text-secondary)">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-(--text-primary)">{a.workoutPlan.title}</p>
                  <p className="text-xs text-(--text-secondary)">{fmtDate(a.scheduledDate)} · {(a.workoutPlan.exercises ?? []).length} exercises</p>
                </div>
              </div>
              <Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
