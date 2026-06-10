import { useEffect, useState, type ReactNode } from "react";
import { Award, Flame, Star, Trophy } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { gamificationService, type MemberSummary } from "@/services/gamification.service";

interface EarnedBadge { id: string; earnedAt: string; badge: { name: string; description?: string | null; type: string; icon?: string | null } }

export default function AchievementsPage() {
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      gamificationService.mySummary().catch(() => null),
      api.get("/badges/me").then((r) => (r.data?.data ?? r.data) as EarnedBadge[]).catch(() => []),
    ]).then(([s, b]) => { setSummary(s); setBadges(Array.isArray(b) ? b : []); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Page title="Achievements"><Skeleton height="h-64" /></Page>;

  const streakBy = (t: string) => summary?.streaks.find((s) => s.type === t);

  return (
    <Page title="Achievements" description="Your points, level, streaks, and earned badges.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Level" value={String(summary?.level ?? 1)} icon={<Star className="h-5 w-5" />} tone="amber" />
          <Stat label="Points balance" value={String(summary?.balance ?? 0)} icon={<Trophy className="h-5 w-5" />} />
          <Stat label="Lifetime points" value={String(summary?.lifetimePoints ?? 0)} icon={<Trophy className="h-5 w-5" />} />
          <Stat label="Badges" value={String(summary?.badgeCount ?? badges.length)} icon={<Award className="h-5 w-5" />} tone="emerald" />
        </div>

        {/* Streaks */}
        <div className="grid grid-cols-3 gap-4">
          {(["ATTENDANCE", "WORKOUT", "DIET"] as const).map((t) => (
            <Card key={t} variant="solid" className="p-5 text-center">
              <Flame className="mx-auto h-6 w-6 text-orange-500" />
              <div className="mt-2 text-2xl font-bold text-(--text-primary)">{streakBy(t)?.current ?? 0}</div>
              <div className="text-xs uppercase tracking-wide text-(--text-secondary)">{t} streak</div>
              <div className="mt-1 text-xs text-(--text-secondary)">Best: {streakBy(t)?.longest ?? 0}</div>
            </Card>
          ))}
        </div>

        {/* Badges */}
        <Card variant="solid" className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-(--text-primary)">Earned badges</h3>
          {badges.length === 0 ? (
            <p className="text-sm text-(--text-secondary)">No badges yet — keep training to earn your first!</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {badges.map((b) => (
                <div key={b.id} className="rounded-lg border border-(--border) p-3 text-center">
                  <div className="text-2xl">{b.badge.icon || "🏅"}</div>
                  <div className="mt-1 text-sm font-medium text-(--text-primary)">{b.badge.name}</div>
                  <Badge variant="info">{b.badge.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone?: "amber" | "emerald" }) {
  const color = tone === "amber" ? "text-amber-500" : tone === "emerald" ? "text-emerald-500" : "text-indigo-500";
  return (
    <Card variant="solid" className="p-5">
      <div className="flex items-center justify-between"><span className="text-sm text-(--text-secondary)">{label}</span><span className={color}>{icon}</span></div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary)">{value}</div>
    </Card>
  );
}
