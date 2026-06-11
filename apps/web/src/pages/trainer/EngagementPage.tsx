import { useEffect, useState } from "react";
import { Flame, AlertTriangle, Trophy } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { gamificationService, type TrainerMemberRow } from "@/services/gamification.service";

export default function TrainerEngagementPage() {
  const [rows, setRows] = useState<TrainerMemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gamificationService.trainerMembers().then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, []);

  const needMotivation = rows.filter((r) => r.needsMotivation);

  if (loading) return <Page title="Member Engagement"><Skeleton height="h-64" /></Page>;

  return (
    <Page title="Member Engagement" description="Your assigned members' streaks, challenge participation, and motivation alerts.">
      {rows.length === 0 ? (
        <EmptyState icon={<Flame className="h-7 w-7" />} title="No assigned members" message="Members assigned to you will appear here with their streaks." />
      ) : (
        <div className="space-y-6">
          <Card variant="solid" className="p-5">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-(--text-primary)">{needMotivation.length}</span>
              <span className="text-(--text-secondary)">members need motivation (no active attendance streak)</span>
            </div>
          </Card>

          <Card variant="solid" className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-4 py-2">Member</th><th className="px-4 py-2">Points</th><th className="px-4 py-2">Attendance</th>
                    <th className="px-4 py-2">Workout</th><th className="px-4 py-2">Diet</th><th className="px-4 py-2">Challenges</th><th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr key={r.memberId}>
                      <td className="px-4 py-2 font-medium text-(--text-primary)">{r.name}</td>
                      <td className="px-4 py-2">{r.points} <span className="text-xs text-(--text-secondary)">(Lvl {r.level})</span></td>
                      <td className="px-4 py-2"><span className="flex items-center gap-1"><Flame className="h-3 w-3 text-muted-foreground" />{r.attendanceStreak}</span></td>
                      <td className="px-4 py-2">{r.workoutStreak}</td>
                      <td className="px-4 py-2">{r.dietStreak}</td>
                      <td className="px-4 py-2"><span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-muted-foreground" />{r.activeChallenges}</span></td>
                      <td className="px-4 py-2">{r.needsMotivation && <Badge variant="warning">Motivate</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}
