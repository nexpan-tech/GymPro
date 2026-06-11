import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useToast } from "@/hooks/useToast";
import { challengeService, gamificationService, type Challenge } from "@/services/gamification.service";

export default function MemberChallengesPage() {
  const toast = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [list, summary] = await Promise.all([
      challengeService.list().catch(() => []),
      gamificationService.mySummary().catch(() => null),
    ]);
    setChallenges(list);
    setMemberId(summary?.memberId ?? null);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  function myPart(c: Challenge) {
    return memberId ? c.participants?.find((p) => p.memberId === memberId) : undefined;
  }

  async function join(c: Challenge) {
    if (!memberId) return;
    try { await challengeService.join(c.id, memberId); toast.success(`Joined ${c.title}`); void load(); }
    catch { toast.error("Could not join"); }
  }

  if (loading) return <Page title="Challenges"><Skeleton height="h-64" /></Page>;

  return (
    <Page title="Challenges" description="Join gym challenges and climb the leaderboard.">
      {challenges.length === 0 ? (
        <EmptyState icon={<Trophy className="h-7 w-7" />} title="No challenges" message="Your gym hasn't published challenges yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {challenges.map((c) => {
            const part = myPart(c);
            const pct = c.targetValue && part ? Math.min(100, Math.round((part.progress / c.targetValue) * 100)) : 0;
            return (
              <Card key={c.id} variant="solid" className="p-5">
                <div className="flex items-start justify-between">
                  <span className="flex items-center gap-2 font-semibold text-(--text-primary)"><Trophy className="h-4 w-4 text-muted-foreground" />{c.title}</span>
                  <Badge variant={c.status === "ACTIVE" ? "success" : "info"}>{c.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-(--text-secondary)">{c.description || c.type}</p>
                {part ? (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-(--text-secondary)"><span>Progress</span><span>{part.progress}{c.targetValue ? ` / ${c.targetValue}` : ""}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-(--surface-elevated)"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                    {part.isCompleted && <Badge variant="success" className="mt-2">Completed 🎉</Badge>}
                  </div>
                ) : (
                  <Button size="sm" className="mt-3" onClick={() => join(c)} disabled={c.status === "COMPLETED" || c.status === "CANCELLED"}>Join challenge</Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}
