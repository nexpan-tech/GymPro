import { useEffect, useState, type ReactNode } from "react";
import { Share2, Percent, CheckCircle2, Coins } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import { referralService, type Referral } from "@/services/gamification.service";

const tone = (s: string) => (s === "REWARDED" || s === "CONVERTED" ? "success" : s === "EXPIRED" ? "danger" : "warning");

export default function ReferralsPage() {
  const toast = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<{ total: number; converted: number; pending: number; conversionRate: number; rewardsIssued: number } | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await referralService.listForGym().catch(() => null);
    setReferrals(res?.referrals ?? []);
    setStats(res?.stats ?? null);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function convert(id: string) {
    try { await referralService.convert(id); toast.success("Referral converted, points awarded"); void load(); }
    catch { toast.error("Convert failed"); }
  }

  return (
    <Page title="Referrals" description="Member referrals, conversions, and reward points issued.">
      {loading ? <Skeleton height="h-64" /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Total referrals" value={String(stats?.total ?? 0)} icon={<Share2 className="h-5 w-5" />} />
            <Stat label="Converted" value={String(stats?.converted ?? 0)} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" />
            <Stat label="Conversion rate" value={`${stats?.conversionRate ?? 0}%`} icon={<Percent className="h-5 w-5" />} />
            <Stat label="Reward points issued" value={String(stats?.rewardsIssued ?? 0)} icon={<Coins className="h-5 w-5" />} tone="amber" />
          </div>

          <Card variant="solid" className="overflow-hidden p-0">
            <div className="border-b border-(--border) px-5 py-3 text-sm font-semibold text-(--text-primary)">Referral list</div>
            {referrals.length === 0 ? (
              <p className="px-5 py-6 text-sm text-(--text-secondary)">No referrals yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-(--border) text-xs uppercase tracking-wide text-(--text-secondary)">
                    <tr><th className="px-4 py-2">Referrer</th><th className="px-4 py-2">Invitee</th><th className="px-4 py-2">Code</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Reward</th><th className="px-4 py-2">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)">
                    {referrals.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2 font-medium text-(--text-primary)">{r.referrer?.user?.name ?? "—"}</td>
                        <td className="px-4 py-2 text-(--text-secondary)">{r.inviteeName ?? "—"}{r.inviteePhone ? ` · ${r.inviteePhone}` : ""}</td>
                        <td className="px-4 py-2"><code className="text-xs">{r.code}</code></td>
                        <td className="px-4 py-2"><Badge variant={tone(r.status)}>{r.status}</Badge></td>
                        <td className="px-4 py-2 text-(--text-secondary)">{r.rewardPoints || 0} pts</td>
                        <td className="px-4 py-2">
                          {r.status === "PENDING" ? <Button size="sm" variant="secondary" onClick={() => convert(r.id)}>Mark converted</Button> : <span className="text-xs text-(--text-secondary)">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </Page>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone?: "emerald" | "amber" }) {
  const color = tone === "emerald" ? "text-emerald-500" : tone === "amber" ? "text-amber-500" : "text-indigo-500";
  return (
    <Card variant="solid" className="p-5">
      <div className="flex items-center justify-between"><span className="text-sm text-(--text-secondary)">{label}</span><span className={color}>{icon}</span></div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary)">{value}</div>
    </Card>
  );
}
