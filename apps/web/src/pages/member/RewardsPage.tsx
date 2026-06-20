import { useEffect, useMemo, useState, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Gift, Coins, Share2, Users, Clock, CheckCircle2, Copy, Link2, MessageCircle,
  Trophy, Flame, Crown, Sparkles, Award, CalendarClock, TrendingUp, Lock,
} from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/hooks/useToast";
import {
  gamificationService, referralService,
  type Reward, type Redemption, type MemberSummary, type Referral, type LeaderboardRow,
} from "@/services/gamification.service";

type CodeInfo = { code: string; shareText: string; total: number; converted: number; rewardPerConversion: number };

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const isSuccessful = (s: string) => s === "CONVERTED" || s === "REWARDED";
function referralTone(s: string): "success" | "warning" | "danger" | "default" {
  if (isSuccessful(s)) return "success";
  if (s === "PENDING") return "warning";
  if (s === "CANCELLED" || s === "REJECTED") return "danger";
  return "default";
}
const referralLabel = (s: string) => (isSuccessful(s) ? "Successful" : s.charAt(0) + s.slice(1).toLowerCase());

// ── UI-only referral levels (computed from successful referral count) ─────────
const LEVELS = [
  { name: "Bronze", min: 0, accent: "#b08d57" },
  { name: "Silver", min: 3, accent: "#aab4bd" },
  { name: "Gold", min: 10, accent: "#e8c14e" },
  { name: "Diamond", min: 25, accent: "#6fd3e6" },
  { name: "Elite", min: 50, accent: "#e73725" },
] as const;
function levelFor(successful: number) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (successful >= LEVELS[i].min) idx = i;
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const span = next ? next.min - current.min : 1;
  const into = successful - current.min;
  const pct = next ? Math.min(100, Math.round((into / span) * 100)) : 100;
  return { current, next, pct, toNext: next ? Math.max(0, next.min - successful) : 0 };
}

// ── UI-only achievements (computed from successful referral count) ────────────
const ACHIEVEMENTS = [
  { key: "first", label: "First Referral", need: 1, icon: Sparkles },
  { key: "social", label: "Social Starter", need: 3, icon: Users },
  { key: "builder", label: "Network Builder", need: 5, icon: TrendingUp },
  { key: "hero", label: "Community Hero", need: 10, icon: Award },
  { key: "ambassador", label: "Gym Ambassador", need: 20, icon: Crown },
  { key: "legend", label: "Referral Legend", need: 50, icon: Trophy },
] as const;

function Ring({ pct, size = 132, stroke = 11, accent = "var(--flame)", children }: { pct: number; size?: number; stroke?: number; accent?: string; children: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke="var(--surface-secondary)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke={accent} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export default function MemberRewardsPage() {
  const toast = useToast();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [code, setCode] = useState<CodeInfo | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [leaders, setLeaders] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [r, d, s, c, refs, lb] = await Promise.all([
      gamificationService.rewards().catch(() => []),
      gamificationService.myRedemptions().catch(() => []),
      gamificationService.mySummary().catch(() => null),
      referralService.myCode().catch(() => null),
      referralService.myReferrals().catch(() => [] as Referral[]),
      gamificationService.leaderboard("GYM", undefined, "ALL").catch(() => [] as LeaderboardRow[]),
    ]);
    setRewards(r); setRedemptions(d); setSummary(s); setCode(c); setReferrals(refs); setLeaders(lb);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function redeem(rw: Reward) {
    try { await gamificationService.redeem(rw.id); toast.success(`Redeemed ${rw.title}`); void load(); }
    catch (e) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Redeem failed"); }
  }

  const balance = summary?.balance ?? 0;
  const successful = code?.converted ?? 0;
  const pending = Math.max(0, (code?.total ?? 0) - successful);
  const pointsEarned = successful * (code?.rewardPerConversion ?? 0);
  const level = useMemo(() => levelFor(successful), [successful]);

  // Next reward the member is working toward (cheapest not yet affordable).
  const nextReward = useMemo(() => {
    const cost = (r: Reward) => r.pointsCost || r.xpCost || 0;
    return rewards.map((r) => ({ r, cost: cost(r) })).filter((x) => x.cost > balance).sort((a, b) => a.cost - b.cost)[0] ?? null;
  }, [rewards, balance]);

  // Referral momentum (derived from real history — no fabricated streak).
  const momentum = useMemo(() => {
    const now = Date.now();
    const d30 = now - 30 * 864e5;
    const thisMonth = new Date().getMonth();
    const last30 = referrals.filter((r) => new Date(r.createdAt).getTime() >= d30).length;
    const conv30 = referrals.filter((r) => r.convertedAt && new Date(r.convertedAt).getTime() >= d30).length;
    const monthCount = referrals.filter((r) => new Date(r.createdAt).getMonth() === thisMonth).length;
    return { last30, conv30, monthCount };
  }, [referrals]);

  const inviteLink = code ? `${window.location.origin}/register?ref=${encodeURIComponent(code.code)}` : "";

  function share(kind: "code" | "link" | "whatsapp" | "native") {
    if (!code) return;
    const msg = `${code.shareText} ${inviteLink}`;
    if (kind === "code") { navigator.clipboard?.writeText(code.code); toast.success("Code copied"); }
    else if (kind === "link") { navigator.clipboard?.writeText(inviteLink); toast.success("Invite link copied"); }
    else if (kind === "whatsapp") { window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener"); }
    else if (kind === "native") {
      if (navigator.share) void navigator.share({ title: "Join my gym", text: code.shareText, url: inviteLink }).catch(() => undefined);
      else { navigator.clipboard?.writeText(msg); toast.success("Invite copied"); }
    }
  }

  if (loading) return <Page title="Rewards"><div className="space-y-4"><Skeleton height="h-48" /><Skeleton height="h-32" /></div></Page>;

  return (
    <Page title="Rewards & Referrals" description="Invite friends, climb the ranks, and turn your network into rewards.">
      <div className="space-y-6">
        {/* ── Hero: referral code + QR ─────────────────────────────────────── */}
        {code && (
          <Card variant="premium" className="overflow-hidden p-0">
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: level.current.accent }}>
                  <Crown className="h-4 w-4" />{level.current.name} Referrer
                </div>
                <p className="mt-2 text-sm text-(--text-secondary)">Your referral code</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <code className="rounded-xl bg-(--surface-secondary) px-4 py-2 text-3xl font-black tracking-[0.15em] text-(--text-primary)">{code.code}</code>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" iconLeft={<Copy className="h-4 w-4" />} onClick={() => share("code")}>Copy code</Button>
                  <Button size="sm" variant="secondary" iconLeft={<Link2 className="h-4 w-4" />} onClick={() => share("link")}>Copy link</Button>
                  <Button size="sm" variant="secondary" iconLeft={<MessageCircle className="h-4 w-4" />} onClick={() => share("whatsapp")}>WhatsApp</Button>
                  <Button size="sm" variant="secondary" iconLeft={<Share2 className="h-4 w-4" />} onClick={() => share("native")}>Share</Button>
                </div>
                <p className="mt-3 text-xs text-(--text-muted)">Earn <strong className="text-(--text-primary)">{code.rewardPerConversion} pts</strong> when a friend joins <strong>and activates their first membership</strong>.</p>
              </div>
              <div className="grid place-items-center gap-2">
                <div className="rounded-2xl bg-white p-3 shadow-(--shadow-md)">
                  <QRCodeSVG value={inviteLink || code.code} size={132} level="M" />
                </div>
                <p className="text-[11px] text-(--text-muted)">Scan to join</p>
              </div>
            </div>
          </Card>
        )}

        {/* ── Level ring + lifetime stats ──────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
          <Card variant="solid" className="grid place-items-center p-6">
            <Ring pct={level.pct} accent={level.current.accent}>
              <div>
                <p className="text-2xl font-black text-(--text-primary)">{successful}</p>
                <p className="text-[11px] text-(--text-muted)">successful</p>
              </div>
            </Ring>
            <p className="mt-3 text-sm font-bold" style={{ color: level.current.accent }}>{level.current.name}</p>
            <p className="text-xs text-(--text-muted)">{level.next ? `${level.toNext} more → ${level.next.name}` : "Top tier reached 🏆"}</p>
          </Card>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={<Users className="h-5 w-5" />} label="Total" value={code?.total ?? 0} />
            <StatCard icon={<Clock className="h-5 w-5" />} label="Pending" value={pending} />
            <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Successful" value={successful} accent />
            <StatCard icon={<Coins className="h-5 w-5" />} label="Points earned" value={pointsEarned} />
            <StatCard icon={<Gift className="h-5 w-5" />} label="Points balance" value={balance} />
            <StatCard icon={<Flame className="h-5 w-5" />} label="Last 30 days" value={momentum.last30} />
            <StatCard icon={<CalendarClock className="h-5 w-5" />} label="This month" value={momentum.monthCount} />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Converted 30d" value={momentum.conv30} />
          </div>
        </div>

        {/* ── Next reward progress ─────────────────────────────────────────── */}
        {nextReward && (
          <Card variant="solid" className="flex flex-wrap items-center gap-6 p-6">
            <Ring pct={Math.min(100, Math.round((balance / Math.max(1, nextReward.cost)) * 100))} size={108} stroke={9}>
              <p className="text-lg font-black text-(--text-primary)">{Math.min(100, Math.round((balance / Math.max(1, nextReward.cost)) * 100))}%</p>
            </Ring>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-(--text-muted)">Next reward</p>
              <p className="text-lg font-bold text-(--text-primary)">{nextReward.r.title}</p>
              <p className="text-sm text-(--text-secondary)">{nextReward.r.description || nextReward.r.type}</p>
              <p className="mt-1 text-sm font-semibold text-(--flame)">{Math.max(0, nextReward.cost - balance)} pts to go</p>
            </div>
          </Card>
        )}

        {/* ── Achievements ─────────────────────────────────────────────────── */}
        <Section title="Referral achievements" subtitle="Unlock badges as your network grows">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {ACHIEVEMENTS.map((a) => {
              const earned = successful >= a.need;
              const Icon = a.icon;
              return (
                <div key={a.key} className={`rounded-2xl border p-4 text-center ${earned ? "border-(--flame)/40 bg-(--flame)/5" : "border-border bg-(--surface-secondary) opacity-70"}`}>
                  <div className={`mx-auto grid h-11 w-11 place-items-center rounded-xl ${earned ? "bg-(--flame)/15 text-(--flame)" : "bg-(--surface) text-(--text-muted)"}`}>
                    {earned ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <p className="mt-2 text-xs font-bold text-(--text-primary)">{a.label}</p>
                  <p className="text-[11px] text-(--text-muted)">{earned ? "Unlocked" : `${a.need} referral${a.need === 1 ? "" : "s"}`}</p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Active campaigns (UI-ready empty state — no fake live campaigns) ─ */}
        <Section title="Active campaigns" subtitle="Seasonal referral drives from your gym">
          <Card variant="solid" className="p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-(--surface-secondary) text-(--text-muted)"><CalendarClock className="h-7 w-7" /></div>
            <p className="mt-3 font-semibold text-(--text-primary)">No active campaigns right now</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-(--text-secondary)">When your gym launches a referral campaign, you'll see the countdown, campaign leaderboard, and special rewards here.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {["Countdown", "Campaign leaderboard", "Bonus rewards"].map((t) => (
                <div key={t} className="rounded-xl border border-dashed border-border p-4 text-sm text-(--text-muted)">{t}<p className="mt-1 text-[11px]">Coming soon</p></div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ── Referral timeline ────────────────────────────────────────────── */}
        <Section title="Referral timeline" subtitle="Registered → Pending → Membership activated → Reward eligible">
          {referrals.length === 0 ? (
            <Card variant="solid" className="p-6"><p className="text-sm text-(--text-secondary)">No referrals yet — share your code to start earning rewards!</p></Card>
          ) : (
            <Card variant="solid" className="divide-y divide-border p-0">
              {referrals.map((rf) => {
                const ok = isSuccessful(rf.status);
                const steps = [
                  { label: "Registered", done: true },
                  { label: "Pending", done: true },
                  { label: "Membership activated", done: ok },
                  { label: "Reward eligible", done: ok },
                ];
                return (
                  <div key={rf.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-medium text-(--text-primary)">{rf.inviteeName ?? "Invited friend"}</p>
                      <Badge variant={referralTone(rf.status)}>{referralLabel(rf.status)}</Badge>
                    </div>
                    <div className="mt-3 flex items-center">
                      {steps.map((s, i) => (
                        <div key={s.label} className="flex flex-1 items-center last:flex-none">
                          <div className="flex flex-col items-center">
                            <div className={`grid h-6 w-6 place-items-center rounded-full text-[10px] ${s.done ? "bg-(--flame) text-white" : "bg-(--surface-secondary) text-(--text-muted)"}`}>{s.done ? "✓" : i + 1}</div>
                            <span className="mt-1 hidden text-[10px] text-(--text-muted) sm:block">{s.label}</span>
                          </div>
                          {i < steps.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${steps[i + 1].done ? "bg-(--flame)" : "bg-(--surface-secondary)"}`} />}
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-(--text-muted)">Registered {fmtDate(rf.createdAt)}{rf.convertedAt ? ` · activated ${fmtDate(rf.convertedAt)}` : ""}</p>
                  </div>
                );
              })}
            </Card>
          )}
        </Section>

        {/* ── Reward gallery ───────────────────────────────────────────────── */}
        <Section title="Reward gallery" subtitle="Redeem your points">
          {rewards.length === 0 ? (
            <EmptyState icon={<Gift className="h-7 w-7" />} title="No rewards available" message="Check back soon for rewards to redeem." />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {rewards.map((rw) => {
                const cost = rw.pointsCost || rw.xpCost || 0;
                const out = rw.stock != null && rw.stock <= 0;
                const affordable = balance >= cost && !out;
                return (
                  <Card key={rw.id} variant="solid" className="flex flex-col p-5">
                    <div className="flex items-center justify-between">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-(--flame)/10 text-(--flame)"><Gift className="h-5 w-5" /></div>
                      <Badge variant="default">{rw.type}</Badge>
                    </div>
                    <p className="mt-3 font-bold text-(--text-primary)">{rw.title}</p>
                    <p className="mt-0.5 flex-1 text-sm text-(--text-secondary)">{rw.description || "—"}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-(--flame)">{cost} pts{rw.stock != null ? ` · ${rw.stock} left` : ""}</span>
                      <Button size="sm" disabled={!affordable} onClick={() => redeem(rw)}>{out ? "Sold out" : affordable ? "Redeem" : "Locked"}</Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Section>

        {/* ── Redemptions + leaderboard preview ────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="border-b border-border px-5 py-3 text-sm font-semibold text-(--text-primary)">My redemptions</div>
            {redemptions.length === 0 ? (
              <p className="px-5 py-6 text-sm text-(--text-secondary)">No redemptions yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {redemptions.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-(--text-primary)">{d.reward?.title ?? "Reward"}</span>
                    <span className="flex items-center gap-3"><span className="text-(--text-secondary)">{d.pointsSpent} pts</span><Badge variant={d.status === "FULFILLED" ? "success" : "warning"}>{d.status}</Badge></span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card variant="solid" className="overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-sm font-semibold text-(--text-primary)"><Trophy className="h-4 w-4 text-(--flame)" />Leaderboard</div>
            {leaders.length === 0 ? (
              <p className="px-5 py-6 text-sm text-(--text-secondary)">Leaderboard updates as members earn points.</p>
            ) : (
              <div className="divide-y divide-border">
                {leaders.slice(0, 5).map((m) => (
                  <div key={m.memberId} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-(--surface-secondary) text-xs font-bold text-(--text-primary)">{m.rank}</span><span className="text-(--text-primary)">{m.name}</span></span>
                    <span className="text-(--text-secondary)">{(m.xp ?? 0).toLocaleString("en-IN")} XP</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}

function StatCard({ icon, label, value, accent }: { icon: ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <Card variant="solid" className="p-4">
      <div className="flex items-center justify-between text-(--text-secondary)"><span className="text-xs">{label}</span><span className={accent ? "text-(--flame)" : "text-(--text-muted)"}>{icon}</span></div>
      <div className="mt-1 text-2xl font-black text-(--text-primary)">{value.toLocaleString("en-IN")}</div>
    </Card>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-(--text-primary)">{title}</h2>
        {subtitle && <p className="text-sm text-(--text-secondary)">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
