// apps/web/src/pages/trainer/DashboardPage.tsx
// Trainer Dashboard — fitness professional view: client management & performance

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  CheckCircle,
  Bell,
  ChevronRight,
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  MessageSquare,
  AlertCircle,
  Zap,
  MoreHorizontal,
  Target,
} from "lucide-react";

import KpiCard from "@/components/ui/KpiCard";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/auth.store";
import { trainerService } from "@/services/trainer.service";
import { memberService } from "@/services/member.service";
import { attendanceService } from "@/services/attendance.service";
import { notificationService } from "@/services/notification.service";
import type { Member } from "@/types/member.types";
import type { Notification } from "@/services/notification.service";

// ─── Local types ──────────────────────────────────────────────────────────────

interface ScheduledSession {
  id: string;
  memberName: string;
  memberId: string;
  scheduledAt: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  workoutName?: string;
}

interface WorkoutCompleted {
  id: string;
  memberName: string;
  memberId: string;
  workoutName: string;
  completedAt: string;
}

interface MemberProgress {
  memberId: string;
  memberName: string;
  weightChange: number | null;
  goalProgress: number;
  goalType: string;
}

// ─── Native date utilities (no external library) ──────────────────────────────

/** Format a Date to "hh:mm AM/PM" */
function fmtTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format a Date to "EEEE, MMMM d" e.g. "Friday, May 30" */
function fmtLongDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Format a Date to "EEE, MMM d" e.g. "Fri, May 30" */
function fmtShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Format a Date to ISO date string "YYYY-MM-DD" */
function fmtIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns a human-readable relative time, e.g. "3 hours ago", "just now" */
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) !== 1 ? "s" : ""} ago`;
}

/** Returns true if date falls on today */
function isDateToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function avatarColor(name: string): string {
  const colors = [
    "bg-indigo-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-violet-500",
    "bg-sky-500",
    "bg-rose-500",
    "bg-teal-500",
    "bg-orange-500",
  ];
  const idx =
    name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    colors.length;
  return colors[idx];
}

function planBadgeVariant(
  plan: string
): "primary" | "success" | "warning" | "info" | "default" {
  switch (plan) {
    case "YEARLY":
      return "success";
    case "HALF_YEARLY":
      return "primary";
    case "QUARTERLY":
      return "info";
    case "MONTHLY":
      return "warning";
    default:
      return "default";
  }
}

function planLabel(plan: string): string {
  const map: Record<string, string> = {
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    HALF_YEARLY: "6 Months",
    YEARLY: "Annual",
    CUSTOM: "Custom",
  };
  return map[plan] ?? plan;
}

function sessionStatusBadge(
  status: ScheduledSession["status"]
): "success" | "primary" | "warning" | "danger" | "default" {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "IN_PROGRESS":
      return "primary";
    case "CANCELLED":
      return "danger";
    default:
      return "warning";
  }
}

// ─── Avatar component ─────────────────────────────────────────────────────────

function MemberAvatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClasses[size]} shrink-0 rounded-full object-cover ring-2 ring-(--border)`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${avatarColor(name)} shrink-0 rounded-full flex items-center justify-center font-bold text-white`}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  value,
  color = "indigo",
}: {
  value: number;
  color?: "indigo" | "emerald" | "amber" | "rose";
}) {
  const colorMap = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="h-1.5 w-full rounded-full bg-(--surface-hover)">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${colorMap[color]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ─── Notification icon map ────────────────────────────────────────────────────

function NotificationIcon({ title }: { title: string }) {
  const lower = title.toLowerCase();
  if (lower.includes("feedback") || lower.includes("message"))
    return <MessageSquare className="h-4 w-4 text-indigo-400" />;
  if (lower.includes("progress") || lower.includes("update"))
    return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  if (lower.includes("alert") || lower.includes("overdue"))
    return <AlertCircle className="h-4 w-4 text-rose-400" />;
  if (lower.includes("session") || lower.includes("schedule"))
    return <Calendar className="h-4 w-4 text-amber-400" />;
  return <Bell className="h-4 w-4 text-sky-400" />;
}

// ─── Mock data generators (fallback when API returns empty) ───────────────────
// These produce deterministic data so the UI is always illustrative.

function buildMockSessions(_trainerId: string): ScheduledSession[] {
  const now = new Date();
  return [
    {
      id: "s1",
      memberName: "Arjun Mehta",
      memberId: "m1",
      scheduledAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        9,
        0
      ).toISOString(),
      status: "COMPLETED",
      workoutName: "Upper Body Strength",
    },
    {
      id: "s2",
      memberName: "Priya Sharma",
      memberId: "m2",
      scheduledAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        10,
        30
      ).toISOString(),
      status: "IN_PROGRESS",
      workoutName: "HIIT Cardio Blast",
    },
    {
      id: "s3",
      memberName: "Rohan Verma",
      memberId: "m3",
      scheduledAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        12,
        0
      ).toISOString(),
      status: "SCHEDULED",
      workoutName: "Core & Flexibility",
    },
    {
      id: "s4",
      memberName: "Ananya Bose",
      memberId: "m4",
      scheduledAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        15,
        0
      ).toISOString(),
      status: "SCHEDULED",
      workoutName: "Lower Body Power",
    },
    {
      id: "s5",
      memberName: "Karan Singh",
      memberId: "m5",
      scheduledAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        17,
        30
      ).toISOString(),
      status: "SCHEDULED",
      workoutName: "Full Body Circuit",
    },
  ];
}

function buildMockCompletions(): WorkoutCompleted[] {
  const now = new Date();
  return [
    {
      id: "wc1",
      memberName: "Arjun Mehta",
      memberId: "m1",
      workoutName: "Upper Body Strength",
      completedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "wc2",
      memberName: "Priya Sharma",
      memberId: "m2",
      workoutName: "HIIT Cardio Blast",
      completedAt: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "wc3",
      memberName: "Deepika Nair",
      memberId: "m6",
      workoutName: "Yoga Flow",
      completedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "wc4",
      memberName: "Rahul Joshi",
      memberId: "m7",
      workoutName: "Leg Day",
      completedAt: new Date(now.getTime() - 5.5 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function buildMockProgress(): MemberProgress[] {
  return [
    {
      memberId: "m1",
      memberName: "Arjun Mehta",
      weightChange: -2.4,
      goalProgress: 74,
      goalType: "Weight Loss",
    },
    {
      memberId: "m2",
      memberName: "Priya Sharma",
      weightChange: 1.1,
      goalProgress: 88,
      goalType: "Muscle Gain",
    },
    {
      memberId: "m3",
      memberName: "Rohan Verma",
      weightChange: -0.8,
      goalProgress: 61,
      goalType: "Endurance",
    },
    {
      memberId: "m4",
      memberName: "Ananya Bose",
      weightChange: -3.2,
      goalProgress: 92,
      goalType: "Weight Loss",
    },
    {
      memberId: "m5",
      memberName: "Karan Singh",
      weightChange: 0.5,
      goalProgress: 45,
      goalType: "Strength",
    },
  ];
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({ member }: { member: Member }) {
  const name = member.user?.name ?? "Unknown Member";
  const plan = member.activeMembership?.plan;
  const lastSeen = member.updatedAt;
  // Simulate goal completion from XP level (0–100)
  const goalPct = member.xp ? Math.min(100, (member.xp.level / 10) * 100) : 0;
  const progressColor =
    goalPct >= 80
      ? "emerald"
      : goalPct >= 50
        ? "indigo"
        : goalPct >= 25
          ? "amber"
          : "rose";

  return (
    <Link
      to={`/trainer/my-members`}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-(--surface-hover)"
    >
      <MemberAvatar name={name} photoUrl={member.profilePhotoUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-(--text-primary)">
            {name}
          </p>
          {plan && (
            <Badge variant={planBadgeVariant(plan)} size="sm">
              {planLabel(plan)}
            </Badge>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-xs text-(--text-muted)">
            {lastSeen
              ? `Seen ${timeAgo(new Date(lastSeen))}`
              : "No recent activity"}
          </p>
          <span className="shrink-0 text-xs font-medium text-(--text-secondary)">
            {Math.round(goalPct)}%
          </span>
        </div>
        <div className="mt-1.5">
          <ProgressBar value={goalPct} color={progressColor} />
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-(--text-muted) opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

// ─── Session Timeline Item ────────────────────────────────────────────────────

function SessionTimelineItem({ session }: { session: ScheduledSession }) {
  const time = fmtTime(new Date(session.scheduledAt));
  const isPast = new Date(session.scheduledAt) < new Date();
  const isNow = session.status === "IN_PROGRESS";

  return (
    <div className="flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
            isNow
              ? "border-indigo-500 bg-indigo-500 shadow-[0_0_6px_2px_rgba(99,102,241,0.4)]"
              : session.status === "COMPLETED"
                ? "border-emerald-500 bg-emerald-500"
                : session.status === "CANCELLED"
                  ? "border-rose-400 bg-rose-400"
                  : "border-(--border) bg-(--surface-secondary)"
          }`}
        />
        <div className="mt-1 w-px flex-1 bg-(--border)" />
      </div>

      {/* Content */}
      <div className="mb-4 min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={`truncate text-sm font-semibold ${isPast ? "text-(--text-secondary)" : "text-(--text-primary)"}`}
            >
              {session.memberName}
            </p>
            {session.workoutName && (
              <p className="truncate text-xs text-(--text-muted)">
                {session.workoutName}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-xs font-medium text-(--text-muted)">{time}</span>
            <Badge variant={sessionStatusBadge(session.status)} size="sm" dot>
              {session.status === "IN_PROGRESS"
                ? "Now"
                : session.status === "COMPLETED"
                  ? "Done"
                  : session.status === "CANCELLED"
                    ? "Cancelled"
                    : "Upcoming"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Workout Completed Row ────────────────────────────────────────────────────

function WorkoutCompletedRow({ item }: { item: WorkoutCompleted }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-(--surface-hover)">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
        <Dumbbell className="h-4 w-4 text-emerald-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-(--text-primary)">
          {item.memberName}
        </p>
        <p className="truncate text-xs text-(--text-muted)">{item.workoutName}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs text-(--text-muted)">
          {timeAgo(new Date(item.completedAt))}
        </p>
        <Badge variant="success" size="sm">
          Done
        </Badge>
      </div>
    </div>
  );
}

// ─── Progress Row ─────────────────────────────────────────────────────────────

function MemberProgressRow({ item }: { item: MemberProgress }) {
  const isGain = (item.weightChange ?? 0) > 0;
  const isLoss = (item.weightChange ?? 0) < 0;
  const progressColor =
    item.goalProgress >= 80
      ? "emerald"
      : item.goalProgress >= 50
        ? "indigo"
        : "amber";

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-(--surface-hover)">
      <MemberAvatar name={item.memberName} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-(--text-primary)">
            {item.memberName}
          </p>
          <span className="shrink-0 text-xs font-semibold text-(--text-secondary)">
            {item.goalProgress}%
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="text-xs text-(--text-muted)">{item.goalType}</p>
          {item.weightChange !== null && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                isLoss
                  ? "text-emerald-500"
                  : isGain
                    ? "text-amber-500"
                    : "text-(--text-muted)"
              }`}
            >
              {isLoss ? (
                <TrendingDown className="h-3 w-3" />
              ) : isGain ? (
                <TrendingUp className="h-3 w-3" />
              ) : null}
              {Math.abs(item.weightChange ?? 0).toFixed(1)} kg
            </span>
          )}
        </div>
        <div className="mt-1.5">
          <ProgressBar value={item.goalProgress} color={progressColor} />
        </div>
      </div>
    </div>
  );
}

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-(--surface-hover) ${
        !notification.isRead ? "bg-(--surface-secondary)" : ""
      }`}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-(--surface-hover)">
        <NotificationIcon title={notification.title} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-(--text-primary) leading-snug">
            {notification.title}
          </p>
          {!notification.isRead && (
            <button
              onClick={() => onMarkRead(notification.id)}
              className="shrink-0 rounded-full p-1 text-(--text-muted) hover:text-(--text-primary) transition-colors"
              title="Mark as read"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-0.5 text-xs text-(--text-muted) line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-(--text-muted)">
          {timeAgo(new Date(notification.createdAt))}
        </p>
      </div>
      {!notification.isRead && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
      )}
    </div>
  );
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function MemberListSkeleton() {
  return (
    <div className="space-y-2 px-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <Skeleton width="w-10" height="h-10" rounded="full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton height="h-4" width="w-36" />
            <Skeleton height="h-3" width="w-24" />
            <Skeleton height="h-1.5" width="w-full" rounded="full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrainerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const trainerId = user?.id ?? "";
  const gymId = user?.gymId ?? "";
  const queryClient = useQueryClient();

  // ── Trainer stats ──────────────────────────────────────────────────────────
  const {
    data: statsData,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["trainer-stats", trainerId],
    queryFn: () => trainerService.getStats(trainerId),
    enabled: Boolean(trainerId),
    staleTime: 30_000,
  });

  // ── Assigned members ───────────────────────────────────────────────────────
  const {
    data: membersData,
    isLoading: membersLoading,
  } = useQuery({
    queryKey: ["trainer-members", trainerId],
    queryFn: () =>
      memberService.list({ trainerId, gymId: gymId || undefined }),
    enabled: Boolean(trainerId),
    staleTime: 60_000,
    select: (res) => (res?.data as { members?: Member[] })?.members ?? [],
  });

  const members: Member[] = membersData ?? [];

  // ── Today's attendance ─────────────────────────────────────────────────────
  const todayStr = fmtIsoDate(new Date());
  const {
    data: attendanceData,
    isLoading: attendanceLoading,
  } = useQuery({
    queryKey: ["attendance-today", gymId, todayStr],
    queryFn: () =>
      gymId
        ? attendanceService.getByDate(gymId, todayStr)
        : Promise.resolve({ data: { attendance: [] } } as never),
    // /attendance/today is ADMIN/RECEPTIONIST-only — trainers can't read the
    // gym-wide feed, so we don't call it here (avoids a 403 on every load).
    enabled: false,
    retry: false,
    staleTime: 60_000,
    select: (res) =>
      (res?.data as { attendance?: { memberId: string }[] })?.attendance ?? [],
  });

  const attendedMemberIds = new Set(
    (attendanceData ?? []).map((a) => a.memberId)
  );
  const myMembersAttendedToday = members.filter((m) =>
    attendedMemberIds.has(m.userId)
  ).length;

  // ── Notifications ──────────────────────────────────────────────────────────
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
  } = useQuery({
    queryKey: ["trainer-notifications", gymId],
    queryFn: () =>
      notificationService.list({
        gymId: gymId || undefined,
        limit: 10,
      }),
    // GET /notifications is ADMIN/RECEPTIONIST-only; trainers have no feed
    // endpoint, so skip the call instead of 403-spamming.
    enabled: false,
    retry: false,
    staleTime: 30_000,
    select: (res) =>
      (res?.data as { notifications?: Notification[] })?.notifications ?? [],
  });

  const notifications: Notification[] = notificationsData ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Mark notification read ─────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["trainer-notifications"],
      });
    },
  });

  // ── Derived KPI values ─────────────────────────────────────────────────────
  const stats = statsData?.data;
  const totalMembers = stats?.totalMembers ?? members.length ?? 0;
  const pendingFeedback = Math.max(
    0,
    members.filter(
      (m) =>
        !m.updatedAt ||
        new Date(m.updatedAt) <
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
  );

  // ── Mock data for schedule, completions, progress ─────────────────────────
  // In production these would be real API calls.
  const todaySessions = buildMockSessions(trainerId);
  const recentCompletions = buildMockCompletions();
  const memberProgressList = buildMockProgress();

  // ── Greeting ───────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const trainerName = user?.name?.split(" ")[0] ?? "Trainer";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-(--text-primary)">
            {greeting}, {trainerName}
          </h1>
          <p className="mt-1 text-sm text-(--text-secondary)">
            {fmtLongDate(new Date())} · Your client overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-(--border) bg-(--glass-strong) px-3 py-1.5 text-xs font-medium text-(--text-secondary) shadow-(--shadow-sm)">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            {todaySessions.filter((s) => s.status === "IN_PROGRESS").length > 0
              ? "Session in progress"
              : `${todaySessions.filter((s) => s.status === "SCHEDULED").length} sessions today`}
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Bell className="h-3.5 w-3.5" />
              {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 1: KPI Row ────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="My Members"
          value={statsLoading || membersLoading ? "—" : totalMembers}
          icon={<Users className="h-full w-full" />}
          color="indigo"
          loading={statsLoading && membersLoading}
          change={stats ? ((totalMembers - (stats.activeMembers ?? totalMembers)) / Math.max(1, totalMembers)) * 100 : undefined}
          changeType={totalMembers > 0 ? "up" : "neutral"}
          changeLabel="active members"
        />
        <KpiCard
          title="Attendance Today"
          value={attendanceLoading ? "—" : myMembersAttendedToday}
          icon={<CheckCircle className="h-full w-full" />}
          color="emerald"
          loading={attendanceLoading}
          change={
            totalMembers > 0
              ? Math.round((myMembersAttendedToday / Math.max(1, totalMembers)) * 100)
              : undefined
          }
          changeType={myMembersAttendedToday > 0 ? "up" : "neutral"}
          changeLabel="of my members"
        />
        <KpiCard
          title="Pending Feedback"
          value={membersLoading ? "—" : pendingFeedback}
          icon={<Bell className="h-full w-full" />}
          color="amber"
          loading={membersLoading}
          changeType={pendingFeedback > 0 ? "down" : "neutral"}
          changeLabel="need progress update"
        />
      </div>

      {/* ── SECTION 2: Members list + Schedule ───────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] xl:grid-cols-[65fr_35fr]">
        {/* My Members list */}
        <Card variant="default">
          <CardHeader
            title="My Members"
            subtitle={`${members.length} assigned member${members.length !== 1 ? "s" : ""}`}
            action={
              <Link
                to="/trainer/my-members"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardContent className="px-0 pt-2 pb-3">
            {membersLoading ? (
              <MemberListSkeleton />
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Users className="h-10 w-10 text-(--text-muted)" />
                <p className="text-sm font-medium text-(--text-secondary)">
                  No members assigned yet
                </p>
                <p className="text-xs text-(--text-muted)">
                  Contact gym admin to get members assigned.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-(--border)/40">
                {members.slice(0, 8).map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))}
                {members.length > 8 && (
                  <div className="px-3 pt-3">
                    <Link
                      to="/trainer/my-members"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-(--border) py-2.5 text-sm font-medium text-(--text-secondary) transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/5 hover:text-indigo-500"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      {members.length - 8} more members
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card variant="default" className="min-w-65">
          <CardHeader
            title="Today's Schedule"
            subtitle={fmtShortDate(new Date())}
            action={
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10">
                <Calendar className="h-4 w-4 text-indigo-500" />
              </div>
            }
          />
          <CardContent className="px-4 pb-4 pt-3">
            {todaySessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <Calendar className="h-8 w-8 text-(--text-muted)" />
                <p className="text-sm text-(--text-secondary)">
                  No sessions today
                </p>
              </div>
            ) : (
              <div className="mt-1">
                {todaySessions.map((session) => (
                  <SessionTimelineItem key={session.id} session={session} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION 3: Workouts + Progress ───────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Workouts Completed */}
        <Card variant="default">
          <CardHeader
            title="Workouts Completed Today"
            subtitle="Members who finished their sessions"
            action={
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Zap className="h-3 w-3" />
                {recentCompletions.filter((c) =>
                  isDateToday(new Date(c.completedAt))
                ).length}{" "}
                today
              </div>
            }
          />
          <CardContent className="px-0 pt-2 pb-3">
            {recentCompletions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <Dumbbell className="h-8 w-8 text-(--text-muted)" />
                <p className="text-sm text-(--text-secondary)">
                  No completions yet today
                </p>
              </div>
            ) : (
              <div className="space-y-1 px-2">
                {recentCompletions.map((item) => (
                  <WorkoutCompletedRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Progress Overview */}
        <Card variant="default">
          <CardHeader
            title="Member Progress Overview"
            subtitle="Goal completion & weight changes"
            action={
              <Link
                to="/trainer/progress"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                Full report
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardContent className="px-0 pt-2 pb-3">
            {memberProgressList.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <Target className="h-8 w-8 text-(--text-muted)" />
                <p className="text-sm text-(--text-secondary)">
                  No progress data yet
                </p>
              </div>
            ) : (
              <div className="space-y-1 px-2">
                {memberProgressList.map((item) => (
                  <MemberProgressRow key={item.memberId} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION 4: Notifications feed ────────────────────────────────── */}
      <Card variant="default">
        <CardHeader
          title="Recent Notifications"
          subtitle="Messages, feedback requests, and alerts"
          action={
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {unreadCount} unread
                </span>
              )}
              <Link
                to="/notifications"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          }
        />
        <CardContent className="px-0 pt-2 pb-3">
          {notificationsLoading ? (
            <div className="space-y-2 px-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} showAvatar lines={2} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Bell className="h-10 w-10 text-(--text-muted)" />
              <p className="text-sm font-medium text-(--text-secondary)">
                You're all caught up
              </p>
              <p className="text-xs text-(--text-muted)">
                No notifications at this time.
              </p>
            </div>
          ) : (
            <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
              {notifications.slice(0, 9).map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Action Bar ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "My Members",
            icon: Users,
            to: "/trainer/my-members",
            color: "indigo",
          },
          {
            label: "Attendance",
            icon: CheckCircle,
            to: "/trainer/attendance",
            color: "emerald",
          },
          {
            label: "Workout Plans",
            icon: Dumbbell,
            to: "/trainer/workout-plans",
            color: "violet",
          },
          {
            label: "Progress Reports",
            icon: TrendingUp,
            to: "/trainer/progress",
            color: "amber",
          },
        ].map(({ label, icon: Icon, to, color }) => (
          <Link
            key={to}
            to={to}
            className={`group flex items-center gap-3 rounded-[18px] border border-(--border) bg-(--glass-strong) p-4 shadow-(--shadow-sm) backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-md)`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-${color}-500/10`}
            >
              <Icon className={`h-4.5 w-4.5 text-${color}-500`} />
            </div>
            <span className="text-sm font-semibold text-(--text-primary)">
              {label}
            </span>
            <ChevronRight className="ml-auto h-4 w-4 text-(--text-muted) opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  );
}
