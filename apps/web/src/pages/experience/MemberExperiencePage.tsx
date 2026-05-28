import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { experienceService } from "@/services/experience.service";
import { AnimatedCard } from "@/components/premium/AnimatedCard";
import { XPProgressRing } from "@/components/premium/XPProgressRing";
import { LeaderboardPreview } from "@/components/premium/LeaderboardPreview";
import { ChallengeCarousel } from "@/components/premium/ChallengeCarousel";

const MEMBER_ID = "a8ffcdfd-20f2-414d-8b80-4cd06817afc4";

export function MemberExperiencePage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);

      const [dashboardData, recommendationData] = await Promise.all([
        experienceService.getDashboard(MEMBER_ID),
        experienceService.getRecommendations(MEMBER_ID),
      ]);

      setDashboard(dashboardData);
      setRecommendations(recommendationData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
        >
          Loading premium experience...
        </motion.div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white">
        No experience data found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.section
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-600 to-purple-600 p-8 shadow-xl"
        >
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 left-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="relative z-10">
            <p className="text-sm opacity-80">Welcome back</p>
            <h1 className="mt-2 text-4xl font-bold">
              {dashboard.member.name}
            </h1>
            <p className="mt-2 text-indigo-100">
              Goal: {dashboard.member.fitnessGoal || "Stay consistent"}
            </p>
          </div>
        </motion.section>

        <section className="grid gap-4 md:grid-cols-4">
          <AnimatedCard delay={0.05}>
            <StatCard title="XP" value={dashboard.gamification.xp} />
          </AnimatedCard>

          <AnimatedCard delay={0.1}>
            <StatCard title="Level" value={dashboard.gamification.level} />
          </AnimatedCard>

          <AnimatedCard delay={0.15}>
            <StatCard
              title="Streak"
              value={`${dashboard.gamification.streak} days`}
            />
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <StatCard title="Check-ins" value={dashboard.activity.attendanceCount} />
          </AnimatedCard>
        </section>

        <AnimatedCard
          className="rounded-3xl bg-slate-900 p-6 shadow-lg"
          delay={0.25}
        >
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Level Progress</h2>
              <p className="mt-2 max-w-xl text-slate-400">
                Keep earning XP to unlock rewards, higher achievement levels,
                and consistency bonuses.
              </p>
            </div>

            <XPProgressRing
              xp={dashboard.gamification.xp}
              level={dashboard.gamification.level}
            />
          </div>
        </AnimatedCard>

        <section className="grid gap-4 md:grid-cols-3">
          <AnimatedCard delay={0.3}>
            <PremiumCard title="Membership">
              <p>{dashboard.membership?.plan || "No plan"}</p>
              <p
                className={
                  dashboard.membership?.isActive
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {dashboard.membership?.isActive ? "Active" : "Expired"}
              </p>
            </PremiumCard>
          </AnimatedCard>

          <AnimatedCard delay={0.35}>
            <PremiumCard title="Workout">
              <p>{dashboard.activity.workoutCompletions} completed sessions</p>
              <p>{dashboard.activity.activeChallenges} active challenges</p>
            </PremiumCard>
          </AnimatedCard>

          <AnimatedCard delay={0.4}>
            <PremiumCard title="Progress">
              <p>Weight: {dashboard.progress.latestWeight ?? "-"} kg</p>
              <p>BMI: {dashboard.progress.latestBmi ?? "-"}</p>
            </PremiumCard>
          </AnimatedCard>
        </section>

        <ChallengeCarousel
          items={[
            {
              title: "30 Day Consistency Challenge",
              description: "Complete 20 gym check-ins in 30 days",
              progress: dashboard.activity.attendanceCount,
              targetValue: 20,
            },
          ]}
        />

        <LeaderboardPreview
          items={[
            {
              rank: 1,
              name: dashboard.member.name,
              xp: dashboard.gamification.xp,
              level: dashboard.gamification.level,
            },
          ]}
        />

        <AnimatedCard
          className="rounded-3xl bg-slate-900 p-6 shadow-lg"
          delay={0.45}
        >
          <h2 className="mb-4 text-xl font-semibold">Smart Recommendations</h2>

          <div className="grid gap-3 md:grid-cols-2">
            {recommendations?.recommendations?.map(
              (item: string, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.06 }}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-200"
                >
                  {item}
                </motion.div>
              )
            )}
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-slate-900 p-5 shadow-lg transition hover:bg-slate-800">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function PremiumCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="h-full rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <div className="space-y-1 text-slate-300">{children}</div>
    </div>
  );
}