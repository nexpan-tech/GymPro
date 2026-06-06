import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Flame,
  Zap,
  CheckCircle2,
  CalendarDays,
  Dumbbell,
  Salad,
  CreditCard,
  ArrowRight,
  Clock,
  Star,
  Trophy,
  Target,
  Shield,
  TrendingUp,
  Sparkles,
  Medal,
  Award,
} from "lucide-react";

import { useAuthStore } from "@/store/auth.store";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { attendanceService } from "@/services/attendance.service";
import { membershipService } from "@/services/membership.service";
import { workoutService } from "@/services/workout.service";
import { dietService } from "@/services/diet.service";
import { memberService } from "@/services/member.service";
import type { Attendance } from "@/types/attendance.types";
import type { Member } from "@/types/member.types";
import { cn } from "@/lib/cn";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysLeft(endDate?: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function calcStreak(attendance: Attendance[]): number {
  if (!attendance.length) return 0;
  const sorted = [...attendance]
    .map((a) => new Date(a.date).toDateString())
    .filter((v, i, arr) => arr.indexOf(v) === i) // deduplicate
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const dateStr of sorted) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((cursor.getTime() - d.getTime()) / 86_400_000);
    if (diff === 0 || diff === 1) {
      streak++;
      cursor = d;
    } else {
      break;
    }
  }

  return streak;
}

function daysActiveThisMonth(attendance: Attendance[]): number {
  const now = new Date();
  return attendance.filter((a) => {
    const d = new Date(a.date);
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;
}

/** Build last-30-day weight/attendance chart data from attendance records */
function buildProgressData(attendance: Attendance[], member: Member | null) {
  const days = 30;
  const today = new Date();
  const data: { date: string; weight: number; attended: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const dayStr = d.toDateString();
    const attended = attendance.some(
      (a) => new Date(a.date).toDateString() === dayStr
    )
      ? 1
      : 0;
    // Weight is flat from profile — future iterations can add log-based weight
    data.push({ date: label, weight: member?.weight ?? 70, attended });
  }

  return data;
}

/** Count non-empty day slots in a workout/diet plan */
function countActiveDays(plan: Record<string, string | null | undefined>): number {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  return days.filter((d) => !!plan[d]).length;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subLabel?: string;
}

function StatCard({ icon, label, value, color, subLabel }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex min-w-35 flex-col gap-2 rounded-2xl border border-(--border) bg-(--glass-strong)",
        "p-4 shadow-(--shadow-md) backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-(--shadow-xl)"
      )}
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", color)}>
        {icon}
      </div>
      <p className="text-2xl font-black tracking-tight text-(--text-primary)">
        {value}
      </p>
      <p className="text-xs font-semibold text-(--text-secondary)">{label}</p>
      {subLabel && (
        <p className="text-[11px] text-(--text-muted)">{subLabel}</p>
      )}
    </div>
  );
}

// ─── Today's Greeting Banner ──────────────────────────────────────────────────

function GreetingBanner({
  name,
  streak,
  xp,
  goalsCompleted,
  daysActive,
  loading,
}: {
  name: string;
  streak: number;
  xp: number;
  goalsCompleted: number;
  daysActive: number;
  loading: boolean;
}) {
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Card variant="premium" className="overflow-hidden">
      <CardContent className="p-6">
        {/* Top row */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold text-(--text-secondary)">
              {greeting} —{" "}
              <span className="text-(--text-muted)">{todayStr}</span>
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-(--text-primary)">
              {loading ? (
                <Skeleton height="h-9" width="w-56" />
              ) : (
                <>
                  Welcome back,{" "}
                  <span className="bg-linear-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent">
                    {name}!
                  </span>
                </>
              )}
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-(--text-secondary)">
              {streak > 0
                ? `You're on a ${streak}-day streak. Keep it going — consistency is your superpower.`
                : "Start logging your workouts to build a streak. Every session counts!"}
            </p>
          </div>

          {/* XP badge */}
          {!loading && xp > 0 && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-3">
              <Zap className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  XP Points
                </p>
                <p className="text-xl font-black text-(--text-primary)">{xp.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-6 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width="w-[140px]" height="h-[120px]" rounded="lg" className="shrink-0" />
            ))
          ) : (
            <>
              <StatCard
                icon={<Flame className="h-5 w-5 text-orange-500" />}
                label="Current Streak"
                value={`${streak}d`}
                color="bg-orange-500/10"
                subLabel={streak > 0 ? "Keep it up!" : "Start today"}
              />
              <StatCard
                icon={<Zap className="h-5 w-5 text-amber-500" />}
                label="XP Points"
                value={xp > 0 ? xp.toLocaleString() : "0"}
                color="bg-amber-500/10"
                subLabel="Lifetime total"
              />
              <StatCard
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                label="Goals Completed"
                value={goalsCompleted}
                color="bg-emerald-500/10"
                subLabel="All time"
              />
              <StatCard
                icon={<CalendarDays className="h-5 w-5 text-indigo-500" />}
                label="Days Active"
                value={daysActive}
                color="bg-indigo-500/10"
                subLabel="This month"
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Action Cards Row ─────────────────────────────────────────────────────────

function TodayWorkoutCard({
  workout,
  loading,
}: {
  workout: { goal: string | null; exerciseCount: number; duration: string } | null;
  loading: boolean;
}) {
  const navigate = useNavigate();

  if (loading) return <SkeletonCard lines={3} />;

  return (
    <Card variant="glass" hover className="flex flex-col">
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-purple-600 text-white shadow-lg">
            <Dumbbell className="h-6 w-6" />
          </div>
          <Badge variant="primary" dot>
            Today
          </Badge>
        </div>

        <h3 className="mt-4 text-lg font-black text-(--text-primary)">
          Today's Workout
        </h3>

        {workout ? (
          <>
            <p className="mt-1 text-sm text-(--text-secondary) line-clamp-2">
              {workout.goal ?? "Custom workout plan assigned by your trainer"}
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-(--text-secondary)">
              <span className="flex items-center gap-1">
                <Dumbbell className="h-3.5 w-3.5 text-violet-500" />
                {workout.exerciseCount} exercises
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-violet-500" />
                {workout.duration}
              </span>
            </div>
            <div className="mt-auto pt-5">
              <Button
                variant="primary"
                fullWidth
                iconRight={<ArrowRight />}
                onClick={() => navigate("/member/workout")}
              >
                Start Workout
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-(--text-secondary)">
              No workout plan assigned yet. Your trainer will set one up for you.
            </p>
            <div className="mt-auto pt-5">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate("/member/workout")}
              >
                View Plans
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TodayDietCard({
  diet,
  loading,
}: {
  diet: { goal: string | null; mealCount: number; calories: string } | null;
  loading: boolean;
}) {
  const navigate = useNavigate();

  if (loading) return <SkeletonCard lines={3} />;

  return (
    <Card variant="glass" hover className="flex flex-col">
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <Salad className="h-6 w-6" />
          </div>
          <Badge variant="success" dot>
            Today
          </Badge>
        </div>

        <h3 className="mt-4 text-lg font-black text-(--text-primary)">
          Today's Diet
        </h3>

        {diet ? (
          <>
            <p className="mt-1 text-sm text-(--text-secondary) line-clamp-2">
              {diet.goal ?? "Customised nutrition plan designed for your goals"}
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-(--text-secondary)">
              <span className="flex items-center gap-1">
                <Salad className="h-3.5 w-3.5 text-emerald-500" />
                {diet.mealCount} meals
              </span>
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-emerald-500" />
                {diet.calories}
              </span>
            </div>
            <div className="mt-auto pt-5">
              <Button
                variant="success"
                fullWidth
                iconRight={<ArrowRight />}
                onClick={() => navigate("/member/diet")}
              >
                View Diet Plan
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-(--text-secondary)">
              No diet plan assigned yet. Good nutrition fuels great performance.
            </p>
            <div className="mt-auto pt-5">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate("/member/diet")}
              >
                Explore Nutrition
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MembershipStatusCard({
  membership,
  loading,
}: {
  membership: {
    planName: string;
    status: string;
    daysLeft: number | null;
    totalDays: number;
    id: string;
  } | null;
  loading: boolean;
}) {
  const navigate = useNavigate();

  if (loading) return <SkeletonCard lines={3} />;

  const isExpiring =
    membership?.daysLeft !== null &&
    membership?.daysLeft !== undefined &&
    membership.daysLeft < 30;

  const progress =
    membership?.daysLeft !== null &&
    membership?.daysLeft !== undefined &&
    membership.totalDays > 0
      ? Math.max(0, Math.min(100, (membership.daysLeft / membership.totalDays) * 100))
      : 0;

  return (
    <Card variant="glass" hover className="flex flex-col">
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg",
              isExpiring
                ? "bg-linear-to-br from-rose-500 to-red-600"
                : "bg-linear-to-br from-sky-500 to-indigo-600"
            )}
          >
            <CreditCard className="h-6 w-6" />
          </div>
          {membership ? (
            <Badge variant={isExpiring ? "warning" : "success"} dot>
              {membership.status}
            </Badge>
          ) : (
            <Badge variant="danger" dot>
              Inactive
            </Badge>
          )}
        </div>

        <h3 className="mt-4 text-lg font-black text-(--text-primary)">
          Membership Status
        </h3>

        {membership ? (
          <>
            <p className="mt-1 text-sm font-semibold text-(--text-secondary)">
              {membership.planName}
            </p>
            <p className="mt-1 text-sm text-(--text-secondary)">
              {membership.daysLeft !== null
                ? `${membership.daysLeft} days remaining`
                : "No expiry date set"}
            </p>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-(--surface-secondary)">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isExpiring
                      ? "bg-linear-to-r from-rose-500 to-red-400"
                      : "bg-linear-to-r from-sky-500 to-indigo-500"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-(--text-muted)">
                {Math.round(progress)}% of plan remaining
              </p>
            </div>

            <div className="mt-auto pt-5">
              {isExpiring ? (
                <Button
                  variant="danger"
                  fullWidth
                  iconRight={<ArrowRight />}
                  onClick={() => navigate("/member/membership-details")}
                >
                  Renew Now
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate("/member/membership-details")}
                >
                  View Details
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-(--text-secondary)">
              You don't have an active membership. Get started today!
            </p>
            <div className="mt-auto pt-5">
              <Button
                variant="primary"
                fullWidth
                iconRight={<ArrowRight />}
                onClick={() => navigate("/member/membership-details")}
              >
                Get Membership
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Progress Chart ───────────────────────────────────────────────────────────

function ProgressChart({
  data,
  loading,
  hasWeight,
}: {
  data: { date: string; weight: number; attended: number }[];
  loading: boolean;
  hasWeight: boolean;
}) {
  if (loading) {
    return (
      <Card variant="default">
        <CardHeader title="Your Progress" subtitle="Loading chart data..." />
        <CardContent>
          <Skeleton height="h-64" rounded="lg" />
        </CardContent>
      </Card>
    );
  }

  // Show attendance frequency if no specific weight data
  const dataKey = hasWeight ? "weight" : "attended";
  const chartLabel = hasWeight ? "Weight (kg)" : "Sessions";
  const chartColor = hasWeight ? "#f97316" : "#6366f1";
  const gradientId = hasWeight ? "weightGrad" : "attendGrad";

  return (
    <Card variant="default">
      <CardHeader
        title="Your Progress"
        subtitle={
          hasWeight
            ? "Body weight over the last 30 days"
            : "Gym sessions over the last 30 days"
        }
        action={
          <div className="flex items-center gap-1.5 text-xs font-semibold text-(--text-secondary)">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
            Last 30 days
          </div>
        }
      />
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={data}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.12)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                interval={6}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                label={undefined}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--glass-strong)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
                labelStyle={{ color: "var(--text-secondary)", marginBottom: 4 }}
                itemStyle={{ color: chartColor }}
                formatter={(v) => [`${v ?? 0} ${chartLabel}`, ""]}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={chartColor}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: chartColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={<TrendingUp className="h-10 w-10" />}
            title="No progress data yet"
            description="Check in to the gym or log your weight to start tracking your progress journey."
            color="indigo"
          />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Recent Attendance ────────────────────────────────────────────────────────

function RecentAttendanceCard({
  attendance,
  loading,
}: {
  attendance: Attendance[];
  loading: boolean;
}) {
  if (loading) return <SkeletonCard lines={5} />;

  const recent = attendance.slice(0, 7);

  return (
    <Card variant="default">
      <CardHeader title="Recent Attendance" subtitle="Your last 7 gym visits" />
      <CardContent className="p-0">
        {recent.length > 0 ? (
          <ul className="divide-y divide-(--border)">
            {recent.map((item, idx) => {
              const checkInDate = new Date(item.checkInAt || item.date);
              const isToday =
                checkInDate.toDateString() === new Date().toDateString();

              return (
                <li
                  key={item.id ?? idx}
                  className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-(--surface-secondary)"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                      <CalendarDays className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-(--text-primary)">
                        Gym Check-in
                        {isToday && (
                          <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            Today
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-(--text-secondary)">
                        {checkInDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-(--text-secondary)">
                      {checkInDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <Badge variant="success" size="sm">
                      Present
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={<CalendarDays className="h-10 w-10" />}
              title="No attendance yet"
              description="Check in at the gym to start building your record. Your consistency journey starts today!"
              color="emerald"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Active Challenges ────────────────────────────────────────────────────────

// Static mock challenges — real data would come from a challenges service
const STATIC_CHALLENGES = [
  {
    id: "1",
    name: "30-Day Consistency",
    description: "Check in 20 out of 30 days",
    target: 20,
    unit: "days",
    icon: <Flame className="h-5 w-5" />,
    color: "from-orange-500 to-rose-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "2",
    name: "Streak Builder",
    description: "Achieve a 7-day streak",
    target: 7,
    unit: "days",
    icon: <Zap className="h-5 w-5" />,
    color: "from-amber-500 to-yellow-400",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "3",
    name: "Monthly Goal",
    description: "Hit 15 sessions this month",
    target: 15,
    unit: "sessions",
    icon: <Target className="h-5 w-5" />,
    color: "from-indigo-500 to-violet-500",
    bgColor: "bg-indigo-500/10",
  },
];

function ActiveChallengesCard({
  streak,
  daysActive,
  loading,
}: {
  streak: number;
  daysActive: number;
  loading: boolean;
}) {
  if (loading) return <SkeletonCard lines={4} />;

  const progress = [daysActive, streak, daysActive];

  return (
    <Card variant="default">
      <CardHeader title="Active Challenges" subtitle="Your fitness missions" />
      <CardContent className="space-y-4">
        {STATIC_CHALLENGES.map((challenge, idx) => {
          const current = Math.min(progress[idx] ?? 0, challenge.target);
          const pct = Math.round((current / challenge.target) * 100);
          const done = current >= challenge.target;

          return (
            <div
              key={challenge.id}
              className="rounded-2xl border border-(--border) bg-(--surface-secondary) p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    challenge.bgColor
                  )}
                >
                  <span
                    className={cn(
                      "bg-linear-to-br bg-clip-text text-transparent",
                      challenge.color
                    )}
                  >
                    {challenge.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-(--text-primary) truncate">
                      {challenge.name}
                    </p>
                    {done ? (
                      <Badge variant="success" size="sm">
                        Done!
                      </Badge>
                    ) : (
                      <span className="shrink-0 text-xs font-semibold text-(--text-secondary)">
                        {current}/{challenge.target} {challenge.unit}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-(--text-secondary)">
                    {challenge.description}
                  </p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-(--border)">
                    <div
                      className={cn(
                        "h-full rounded-full bg-linear-to-r transition-all duration-700",
                        challenge.color
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Achievements / Badges ────────────────────────────────────────────────────

// Icons map for known badge types
function BadgeIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("star") || lower.includes("champion"))
    return <Star className="h-6 w-6" />;
  if (lower.includes("trophy") || lower.includes("winner"))
    return <Trophy className="h-6 w-6" />;
  if (lower.includes("medal") || lower.includes("gold"))
    return <Medal className="h-6 w-6" />;
  if (lower.includes("shield") || lower.includes("pro"))
    return <Shield className="h-6 w-6" />;
  if (lower.includes("streak") || lower.includes("fire"))
    return <Flame className="h-6 w-6" />;
  if (lower.includes("lightning") || lower.includes("speed"))
    return <Zap className="h-6 w-6" />;
  if (lower.includes("award"))
    return <Award className="h-6 w-6" />;
  return <Sparkles className="h-6 w-6" />;
}

// Static unearned badge templates
const UNEARNED_BADGES = [
  { id: "u1", name: "Iron Champion", xpRequired: 5000 },
  { id: "u2", name: "Speed Demon", xpRequired: 2500 },
  { id: "u3", name: "Consistency Pro", xpRequired: 1000 },
  { id: "u4", name: "Gold Streak", xpRequired: 3000 },
];

function AchievementsSection({
  member,
  loading,
}: {
  member: Member | null;
  loading: boolean;
}) {
  const earned = member?.badges ?? [];
  const currentXP = member?.xp?.points ?? 0;

  const unearnedFiltered = UNEARNED_BADGES.filter(
    (u) =>
      !earned.some(
        (e) => e.badge?.name?.toLowerCase() === u.name.toLowerCase()
      ) && (u.xpRequired ?? 0) > currentXP
  );

  if (loading) {
    return (
      <Card variant="default">
        <CardHeader title="Your Achievements" />
        <CardContent>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height="h-24" rounded="lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="default">
      <CardHeader
        title="Your Achievements"
        subtitle={`${earned.length} badge${earned.length !== 1 ? "s" : ""} earned`}
        action={
          earned.length > 0 ? (
            <Badge variant="primary" dot>
              {earned.length} earned
            </Badge>
          ) : undefined
        }
      />
      <CardContent>
        {earned.length === 0 && unearnedFiltered.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-10 w-10" />}
            title="Your trophy case awaits"
            description="Complete challenges, check in consistently, and hit your goals to earn achievement badges!"
            color="amber"
          />
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {/* Earned badges */}
            {earned.map((mb) => (
              <div
                key={mb.id}
                title={mb.badge?.description ?? mb.badge?.name ?? "Badge"}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-amber-400/20 bg-linear-to-b from-amber-500/10 to-amber-500/5 p-3 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-500 text-white shadow-md">
                  <BadgeIcon name={mb.badge?.name ?? ""} />
                </div>
                <p className="text-[10px] font-bold leading-tight text-(--text-primary)">
                  {mb.badge?.name ?? "Badge"}
                </p>
              </div>
            ))}

            {/* Unearned / locked badges */}
            {unearnedFiltered.map((ub) => (
              <div
                key={ub.id}
                title={`Locked — Requires ${ub.xpRequired?.toLocaleString()} XP`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-(--border) bg-(--surface-secondary) p-3 text-center opacity-40 grayscale"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--surface-hover) text-(--text-muted)">
                  <BadgeIcon name={ub.name} />
                </div>
                <p className="text-[10px] font-bold leading-tight text-(--text-muted)">
                  {ub.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Empty State Helper ───────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  description,
  color = "indigo",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: "indigo" | "emerald" | "amber" | "rose";
}) {
  const colorMap = {
    indigo: "text-indigo-400 bg-indigo-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    rose: "text-rose-400 bg-rose-500/10",
  };

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl",
          colorMap[color]
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-(--text-primary)">{title}</p>
        <p className="mt-1 max-w-xs text-sm leading-6 text-(--text-secondary)">
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MemberDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const memberId = user?.id ?? "";

  // ── Data queries ───────────────────────────────────────────────────────────

  const { data: memberData, isLoading: memberLoading } = useQuery({
    queryKey: ["member-profile", memberId],
    queryFn: async () => {
      // memberService.getMyProfile exists on the mobile side; for web we derive
      // the member profile by fetching by userId (the member record links to user)
      const res = await memberService.list({ gymId: user?.gymId ?? undefined });
      const members = res.data?.members ?? [];
      return members.find((m) => m.userId === memberId) ?? null;
    },
    enabled: !!memberId,
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["member-attendance", memberId],
    queryFn: async () => {
      const records = await attendanceService.getMyAttendance();
      return (records ?? []) as Attendance[];
    },
    enabled: !!memberId,
  });

  const { data: membershipData, isLoading: membershipLoading } = useQuery({
    queryKey: ["member-active-membership", memberId],
    queryFn: async () => {
      return await membershipService.getMyActive();
    },
    enabled: !!memberId,
  });

  const { data: workoutPlan, isLoading: workoutLoading } = useQuery({
    queryKey: ["member-workout", memberData?.id],
    queryFn: () => workoutService.getByMember(memberData!.id),
    enabled: !!memberData?.id,
  });

  const { data: dietPlan, isLoading: dietLoading } = useQuery({
    queryKey: ["member-diet", memberData?.id],
    queryFn: () => dietService.getByMember(memberData!.id),
    enabled: !!memberData?.id,
  });

  // ── Derived stats ──────────────────────────────────────────────────────────

  const attendance = attendanceData ?? [];

  const streak = useMemo(() => calcStreak(attendance), [attendance]);
  const daysActive = useMemo(
    () => daysActiveThisMonth(attendance),
    [attendance]
  );
  const xp = memberData?.xp?.points ?? 0;
  const goalsCompleted = memberData?.badges?.length ?? 0;

  const chartData = useMemo(
    () => buildProgressData(attendance, memberData ?? null),
    [attendance, memberData]
  );

  const workoutCardData = workoutPlan
    ? {
        goal: workoutPlan.goal ?? null,
        exerciseCount: countActiveDays(workoutPlan as unknown as Record<string, string | null | undefined>),
        duration: "45–60 min",
      }
    : null;

  const dietCardData = dietPlan
    ? {
        goal: dietPlan.goal ?? null,
        mealCount: countActiveDays(dietPlan as unknown as Record<string, string | null | undefined>),
        calories: "~2,200 kcal",
      }
    : null;

  const membershipCardData = membershipData
    ? (() => {
        const start = membershipData.startDate;
        const end = membershipData.endDate;
        const totalDays =
          start && end
            ? Math.max(
                1,
                Math.round(
                  (new Date(end).getTime() - new Date(start).getTime()) /
                    86_400_000
                )
              )
            : 30;
        return {
          planName:
            (membershipData as { planName?: string }).planName ??
            membershipData.status,
          status: membershipData.status,
          daysLeft: daysLeft(membershipData.endDate),
          totalDays,
          id: membershipData.id,
        };
      })()
    : null;

  const isLoadingCore = memberLoading || attendanceLoading;
  const isLoadingPlans = workoutLoading || dietLoading || membershipLoading;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-12">
      {/* SECTION 1 — Greeting + Quick Stats */}
      <GreetingBanner
        name={user?.name ?? "Athlete"}
        streak={streak}
        xp={xp}
        goalsCompleted={goalsCompleted}
        daysActive={daysActive}
        loading={isLoadingCore}
      />

      {/* SECTION 2 — Three Action Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        <TodayWorkoutCard workout={workoutCardData} loading={isLoadingPlans} />
        <TodayDietCard diet={dietCardData} loading={isLoadingPlans} />
        <MembershipStatusCard
          membership={membershipCardData}
          loading={membershipLoading}
        />
      </div>

      {/* SECTION 3 — Progress Chart */}
      <ProgressChart
        data={chartData}
        loading={isLoadingCore}
        hasWeight={!!memberData?.weight}
      />

      {/* SECTION 4 — Attendance + Challenges */}
      <div className="grid gap-5 xl:grid-cols-2">
        <RecentAttendanceCard
          attendance={attendance}
          loading={attendanceLoading}
        />
        <ActiveChallengesCard
          streak={streak}
          daysActive={daysActive}
          loading={isLoadingCore}
        />
      </div>

      {/* SECTION 5 — Achievements */}
      <AchievementsSection member={memberData ?? null} loading={memberLoading} />
    </div>
  );
}
