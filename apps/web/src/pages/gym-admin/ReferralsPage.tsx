import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Share2, Percent, CheckCircle2, Coins, Clock, Trophy, BarChart3, Megaphone } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import { referralService, type Referral } from "@/services/gamification.service";

const isSuccessful = (s: string) => s === "REWARDED" || s === "CONVERTED";
const tone = (s: string) => (isSuccessful(s) ? "success" : s === "EXPIRED" || s === "CANCELLED" || s === "REJECTED" ? "danger" : "warning");
const statusLabel = (s: string) => (isSuccessful(s) ? "Successful" : s.charAt(0) + s.slice(1).toLowerCase());

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

  // Top referrers — derived from real referral records (grouped by referrer).
  const topReferrers = useMemo(() => {
    const map = new Map<string, { name: string; successful: number; total: number; points: number }>();
    for (const r of referrals) {
      const name = r.referrer?.user?.name ?? "Unknown";
      const e = map.get(name) ?? { name, successful: 0, total: 0, points: 0 };
      e.total += 1;
      if (isSuccessful(r.status)) e.successful += 1;
      e.points += r.rewardPoints || 0;
      map.set(name, e);
    }
    return [...map.values()].sort((a, b) => b.successful - a.successful || b.total - a.total).slice(0, 5);
  }, [referrals]);

  // Real monthly trend (last 6 months) derived from referral registration dates.
  const trend = useMemo(() => {
    const months: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleDateString("en-IN", { month: "short" }), count: 0 });
    }
    for (const r of referrals) {
      const d = new Date(r.createdAt);
      const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diff >= 0 && diff <= 5) months[5 - diff].count += 1;
    }
    const max = Math.max(1, ...months.map((m) => m.count));
    return { months, max };
  }, [referrals]);

  return (
    <Page title="Referrals" description="Member referrals, conversions, rewards issued, and top advocates.">
      {loading ? <Skeleton height="h-64" /> : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Stat label="Total referrals" value={String(stats?.total ?? 0)} icon={<Share2 className="h-5 w-5" />} />
            <Stat label="Pending" value={String(stats?.pending ?? 0)} icon={<Clock className="h-5 w-5" />} tone="neutral" />
            <Stat label="Successful" value={String(stats?.converted ?? 0)} icon={<CheckCircle2 className="h-5 w-5" />} />
            <Stat label="Conversion rate" value={`${stats?.conversionRate ?? 0}%`} icon={<Percent className="h-5 w-5" />} />
            <Stat label="Reward points issued" value={String(stats?.rewardsIssued ?? 0)} icon={<Coins className="h-5 w-5" />} tone="neutral" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top referrers */}
            <Card variant="solid" className="overflow-hidden p-0">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-sm font-semibold text-(--text-primary)"><Trophy className="h-4 w-4 text-(--flame)" />Top referrers</div>
              {topReferrers.length === 0 ? (
                <p className="px-5 py-6 text-sm text-(--text-secondary)">No referrers yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {topReferrers.map((t, i) => (
                    <div key={t.name} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-(--surface-secondary) text-xs font-bold text-(--text-primary)">{i + 1}</span><span className="text-(--text-primary)">{t.name}</span></span>
                      <span className="flex items-center gap-3 text-xs text-(--text-secondary)"><span>{t.successful} successful</span><span>·</span><span>{t.points} pts</span></span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Monthly trend (real, derived) */}
            <Card variant="solid" className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-(--text-primary)"><BarChart3 className="h-4 w-4 text-(--flame)" />Monthly referral trend</div>
              <div className="mt-4 flex h-32 items-end gap-2">
                {trend.months.map((m) => (
                  <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-1 items-end">
                      <div className="w-full rounded-t-md bg-(--flame)/70" style={{ height: `${Math.max(4, (m.count / trend.max) * 100)}%` }} title={`${m.count} referrals`} />
                    </div>
                    <span className="text-[11px] text-(--text-muted)">{m.label}</span>
                    <span className="text-[11px] font-semibold text-(--text-primary)">{m.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Campaign analytics — UI-ready empty state (no live campaign data yet) */}
          <Card variant="solid" className="p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-(--text-primary)"><Megaphone className="h-4 w-4 text-(--flame)" />Campaign analytics</div>
            <p className="mt-2 text-sm text-(--text-secondary)">Referral campaigns (seasonal drives with their own leaderboards and bonus rewards) will report performance here — participants, conversions, and the most successful campaign.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {["Active campaigns", "Campaign conversions", "Most successful campaign"].map((t) => (
                <div key={t} className="rounded-xl border border-dashed border-border p-4 text-sm text-(--text-muted)">{t}<p className="mt-1 text-[11px]">Available once campaigns launch</p></div>
              ))}
            </div>
          </Card>

          {/* Referral list */}
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="border-b border-border px-5 py-3 text-sm font-semibold text-(--text-primary)">Referral list</div>
            {referrals.length === 0 ? (
              <p className="px-5 py-6 text-sm text-(--text-secondary)">No referrals yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase tracking-wide text-(--text-secondary)">
                    <tr><th className="px-4 py-2">Referrer</th><th className="px-4 py-2">Invitee</th><th className="px-4 py-2">Code</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Reward</th><th className="px-4 py-2">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {referrals.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2 font-medium text-(--text-primary)">{r.referrer?.user?.name ?? "—"}</td>
                        <td className="px-4 py-2 text-(--text-secondary)">{r.inviteeName ?? "—"}{r.inviteePhone ? ` · ${r.inviteePhone}` : ""}</td>
                        <td className="px-4 py-2"><code className="text-xs">{r.code}</code></td>
                        <td className="px-4 py-2"><Badge variant={tone(r.status)}>{statusLabel(r.status)}</Badge></td>
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

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone?: "neutral" }) {
  return (
    <Card variant="solid" className="p-5">
      <div className="flex items-center justify-between"><span className="text-sm text-(--text-secondary)">{label}</span><span className={tone === "neutral" ? "text-muted-foreground" : "text-primary"}>{icon}</span></div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary)">{value}</div>
    </Card>
  );
}
