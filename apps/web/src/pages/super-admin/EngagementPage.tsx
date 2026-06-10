import { useEffect, useState, type ReactNode } from "react";
import { Trophy, Gift, Share2, Star } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { gamificationService, type PlatformEngagement } from "@/services/gamification.service";

export default function SuperAdminEngagementPage() {
  const [data, setData] = useState<PlatformEngagement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gamificationService.platform().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  return (
    <Page title="Platform Engagement" description="Gamification adoption across all gyms.">
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height="h-24" />)}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Challenge participations" value={String(data?.totalChallengeParticipations ?? 0)} icon={<Trophy className="h-5 w-5" />} />
            <Stat label="Reward redemptions" value={String(data?.totalRedemptions ?? 0)} icon={<Gift className="h-5 w-5" />} tone="pink" />
            <Stat label="Referrals (conv %)" value={`${data?.totalReferrals ?? 0} (${data?.referralConversionRate ?? 0}%)`} icon={<Share2 className="h-5 w-5" />} tone="emerald" />
            <Stat label="Avg level" value={String(data?.avgLevel ?? 1)} icon={<Star className="h-5 w-5" />} tone="amber" />
          </div>

          <Card variant="solid" className="overflow-hidden p-0">
            <div className="border-b border-(--border) px-5 py-3 text-sm font-semibold text-(--text-primary)">Top gyms by participation</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--border) text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr><th className="px-4 py-2">Gym</th><th className="px-4 py-2">Challenge participations</th><th className="px-4 py-2">Redemptions</th><th className="px-4 py-2">Referrals</th></tr>
                </thead>
                <tbody className="divide-y divide-(--border)">
                  {(data?.topGyms ?? []).map((g) => (
                    <tr key={g.gymId}>
                      <td className="px-4 py-2 font-medium text-(--text-primary)">{g.name}</td>
                      <td className="px-4 py-2">{g.participations}</td>
                      <td className="px-4 py-2 text-(--text-secondary)">{g.redemptions}</td>
                      <td className="px-4 py-2 text-(--text-secondary)">{g.referrals}</td>
                    </tr>
                  ))}
                  {(data?.topGyms ?? []).length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-(--text-secondary)">No engagement data yet.</td></tr>}
                </tbody>
              </table>
            </div>
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
