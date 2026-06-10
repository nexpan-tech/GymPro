import { useEffect, useState, type ReactNode } from "react";
import { Medal, Flame, Trophy, Gift, Users } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { gamificationService, type LeaderboardRow, type EngagementAnalytics } from "@/services/gamification.service";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [analytics, setAnalytics] = useState<EngagementAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([gamificationService.leaderboard("GYM").catch(() => []), gamificationService.analytics().catch(() => null)])
      .then(([r, a]) => { setRows(r); setAnalytics(a); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Page title="Leaderboard" description="Top members by points, plus gym engagement metrics.">
      {loading ? <Skeleton height="h-64" /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Challenge participation" value={`${analytics?.challengeParticipationRate ?? 0}%`} icon={<Trophy className="h-5 w-5" />} />
            <Stat label="Reward redemption" value={`${analytics?.rewardRedemptionRate ?? 0}%`} icon={<Gift className="h-5 w-5" />} tone="pink" />
            <Stat label="Referral conversion" value={`${analytics?.referralConversionRate ?? 0}%`} icon={<Users className="h-5 w-5" />} tone="emerald" />
            <Stat label="Avg level" value={String(analytics?.avgLevel ?? 1)} icon={<Flame className="h-5 w-5" />} tone="amber" />
          </div>

          <Card variant="solid" className="overflow-hidden p-0">
            <div className="border-b border-(--border) px-5 py-3 text-sm font-semibold text-(--text-primary)">Top members by points</div>
            {rows.length === 0 ? (
              <p className="px-5 py-6 text-sm text-(--text-secondary)">No ranked members yet.</p>
            ) : (
              <div className="divide-y divide-(--border)">
                {rows.map((r) => (
                  <div key={r.memberId} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="flex items-center gap-3">
                      <span className={`w-7 text-center font-bold ${r.rank <= 3 ? "text-amber-500" : "text-(--text-secondary)"}`}>
                        {r.rank <= 3 ? <Medal className="inline h-4 w-4" /> : r.rank}
                      </span>
                      {r.name}
                    </span>
                    <span className="flex items-center gap-3">
                      <Badge variant="info">Lvl {r.level}</Badge>
                      <span className="flex items-center gap-1 text-(--text-secondary)"><Flame className="h-3 w-3 text-orange-500" />{r.streak ?? 0}</span>
                      <span className="font-bold text-indigo-500">{r.xp} pts</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </Page>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone?: "pink" | "emerald" | "amber" }) {
  const color = tone === "pink" ? "text-pink-500" : tone === "emerald" ? "text-emerald-500" : tone === "amber" ? "text-amber-500" : "text-indigo-500";
  return (
    <Card variant="solid" className="p-5">
      <div className="flex items-center justify-between"><span className="text-sm text-(--text-secondary)">{label}</span><span className={color}>{icon}</span></div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary)">{value}</div>
    </Card>
  );
}
