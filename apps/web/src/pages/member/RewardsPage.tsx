import { useEffect, useState } from "react";
import { Gift, Coins, Share2 } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/hooks/useToast";
import { gamificationService, referralService, type Reward, type Redemption, type MemberSummary } from "@/services/gamification.service";

export default function MemberRewardsPage() {
  const toast = useToast();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [code, setCode] = useState<{ code: string; shareText: string } | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [r, d, s, c] = await Promise.all([
      gamificationService.rewards().catch(() => []),
      gamificationService.myRedemptions().catch(() => []),
      gamificationService.mySummary().catch(() => null),
      referralService.myCode().catch(() => null),
    ]);
    setRewards(r); setRedemptions(d); setSummary(s); setCode(c);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function redeem(rw: Reward) {
    try { await gamificationService.redeem(rw.id); toast.success(`Redeemed ${rw.title}`); void load(); }
    catch (e) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Redeem failed"); }
  }

  if (loading) return <Page title="Rewards"><Skeleton height="h-64" /></Page>;

  const balance = summary?.balance ?? 0;

  return (
    <Page title="Rewards" description="Redeem your points for rewards, and share your referral code.">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="solid" className="p-5">
            <div className="flex items-center justify-between"><span className="text-sm text-(--text-secondary)">Your points balance</span><Coins className="h-5 w-5 text-primary" /></div>
            <div className="mt-2 text-3xl font-bold text-(--text-primary)">{balance}</div>
          </Card>
          {code && (
            <Card variant="solid" className="p-5">
              <div className="flex items-center justify-between"><span className="text-sm text-(--text-secondary)">Your referral code</span><Share2 className="h-5 w-5 text-muted-foreground" /></div>
              <div className="mt-2 flex items-center gap-3">
                <code className="rounded bg-(--surface-elevated) px-2 py-1 text-lg font-bold">{code.code}</code>
                <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard?.writeText(code.shareText); toast.success("Invite copied"); }}>Copy invite</Button>
              </div>
            </Card>
          )}
        </div>

        {rewards.length === 0 ? (
          <EmptyState icon={<Gift className="h-7 w-7" />} title="No rewards available" message="Check back soon for rewards to redeem." />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {rewards.map((rw) => {
              const cost = rw.pointsCost || rw.xpCost || 0;
              const affordable = balance >= cost && (rw.stock == null || rw.stock > 0);
              return (
                <Card key={rw.id} variant="solid" className="p-5">
                  <div className="flex items-center gap-2 font-semibold text-(--text-primary)"><Gift className="h-4 w-4 text-primary" />{rw.title}</div>
                  <p className="mt-1 text-sm text-(--text-secondary)">{rw.description || rw.type}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-primary">{cost} pts</span>
                    <Button size="sm" disabled={!affordable} onClick={() => redeem(rw)}>{affordable ? "Redeem" : "Not enough"}</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Card variant="solid" className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold text-(--text-primary)">My redemptions</div>
          {redemptions.length === 0 ? (
            <p className="px-5 py-6 text-sm text-(--text-secondary)">No redemptions yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {redemptions.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>{d.reward?.title ?? "Reward"}</span>
                  <span className="flex items-center gap-3"><span className="text-(--text-secondary)">{d.pointsSpent} pts</span><Badge variant={d.status === "FULFILLED" ? "success" : "warning"}>{d.status}</Badge></span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
