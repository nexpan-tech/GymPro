import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CreditCard,
  Dumbbell,
  Flame,
  Salad,
  TrendingUp,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import KPICard from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { attendanceService } from "@/services/attendance.service";
import { memberService } from "@/services/member.service";
import { membershipService } from "@/services/membership.service";
import { workoutService, type WorkoutPlan } from "@/services/workout.service";
import { dietService, type DietPlan } from "@/services/diet.service";
import type { Attendance } from "@/types/attendance.types";
import type { Member } from "@/types/member.types";
import type { Membership } from "@/types/membership.types";

const GYM_QR_ID = import.meta.env.VITE_GYM_QR_ID || "";

function isToday(date: string) {
  const today = new Date();
  const target = new Date(date);

  return (
    today.getFullYear() === target.getFullYear() &&
    today.getMonth() === target.getMonth() &&
    today.getDate() === target.getDate()
  );
}

function daysLeft(endDate?: string) {
  if (!endDate) return null;

  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function DashboardPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [diet, setDiet] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const [memberProfile, attendanceRecords, activeMembership] =
        await Promise.all([
          memberService.getMyProfile(),
          attendanceService.getMyAttendance(),
          membershipService.getMyActive(),
        ]);

      setMember(memberProfile);
      setAttendance(attendanceRecords);
      setMembership(activeMembership);

      if (memberProfile?.id) {
        const [workoutPlan, dietPlan] = await Promise.all([
          workoutService.getByMember(memberProfile.id).catch(() => null),
          dietService.getByMember(memberProfile.id).catch(() => null),
        ]);

        setWorkout(workoutPlan);
        setDiet(dietPlan);
      }
    } catch (error) {
      console.error("Failed to load member dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const checkedInToday = useMemo(
    () => attendance.some((item) => isToday(item.date)),
    [attendance]
  );

  const attendanceThisMonth = useMemo(() => {
    const now = new Date();

    return attendance.filter((item) => {
      const date = new Date(item.date);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [attendance]);

  const renewalDays = daysLeft((membership as any)?.endDate);

  async function handleCheckIn() {
    if (!GYM_QR_ID) {
      alert("Gym QR ID is not configured. Add VITE_GYM_QR_ID in apps/web/.env");
      return;
    }

    try {
      setCheckingIn(true);
      await attendanceService.scanQr(GYM_QR_ID);
      await loadDashboard();
    } catch (error) {
      console.error("Check-in failed:", error);
      alert("Check-in failed. You may have already checked in today.");
    } finally {
      setCheckingIn(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-(--text-secondary)">
        Loading your fitness dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Fitness Dashboard"
        description="Track attendance, membership, workout, diet, and progress from one premium dashboard."
      />

      <Card variant="premium" className="overflow-hidden">
        <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-(--text-secondary)">
              Welcome back
            </p>
            <h2 className="mt-1 text-3xl font-black text-(--text-primary)">
              {member?.user?.name || "Member"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-(--text-secondary)">
              {checkedInToday
                ? "You are checked in today. Keep your momentum strong."
                : "Scan your gym QR and mark today’s attendance before your workout."}
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleCheckIn}
            loading={checkingIn}
            disabled={checkedInToday}
          >
            <CalendarCheck className="h-5 w-5" />
            {checkedInToday ? "Checked In Today" : "Scan QR Check-in"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Attendance This Month"
          value={attendanceThisMonth}
          subtitle={`${attendance.length} total check-ins`}
          icon={CalendarCheck}
          trend={8.4}
          color="from-blue-500 to-indigo-600"
        />

        <KPICard
          title="Membership"
          value={(membership as any)?.paymentStatus || "Active"}
          subtitle={
            renewalDays !== null ? `Renews in ${renewalDays} days` : "No active plan"
          }
          icon={CreditCard}
          trend={0}
          color="from-emerald-500 to-teal-600"
        />

        <KPICard
          title="Workout Plan"
          value={workout ? "Assigned" : "Pending"}
          subtitle={workout?.goal || "Waiting for trainer"}
          icon={Dumbbell}
          trend={workout ? 12 : 0}
          color="from-violet-500 to-purple-600"
        />

        <KPICard
          title="Diet Plan"
          value={diet ? "Active" : "Pending"}
          subtitle={diet?.goal || "Nutrition plan not assigned"}
          icon={Salad}
          trend={diet ? 5.7 : 0}
          color="from-amber-500 to-orange-600"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Today’s Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FocusItem
              icon={Flame}
              title="Workout"
              value={workout?.goal || "No workout goal assigned"}
            />
            <FocusItem
              icon={Salad}
              title="Diet"
              value={diet?.goal || "No diet goal assigned"}
            />
            <FocusItem
              icon={TrendingUp}
              title="Progress"
              value={member?.fitnessGoal || "Set your fitness goal"}
            />
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendance.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl bg-(--surface-secondary) px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-(--text-primary)">
                      Gym Check-in
                    </p>
                    <p className="text-xs text-(--text-secondary)">
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
                    Present
                  </span>
                </div>
              ))}

              {attendance.length === 0 && (
                <p className="text-sm text-(--text-secondary)">
                  No attendance records yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FocusItem({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Dumbbell;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-(--surface-secondary) p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(image:--gradient-primary) text-white">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-sm font-bold text-(--text-primary)">{title}</p>
        <p className="text-sm text-(--text-secondary)">{value}</p>
      </div>
    </div>
  );
}