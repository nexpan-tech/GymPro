import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { retentionService, type MemberRisk, type RiskLevel } from "@/services/retention.service";

const riskBadge = (l: RiskLevel | null) =>
  l === "CRITICAL" || l === "HIGH" ? "danger" : l === "MEDIUM" ? "warning" : "success";

export default function TrainerRetentionPage() {
  const [members, setMembers] = useState<MemberRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    retentionService
      .trainerMy()
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const needsFollowUp = members.filter((m) => m.riskLevel === "HIGH" || m.riskLevel === "CRITICAL");

  return (
    <Page title="Member Risk" description="Your assigned members ranked by churn risk — prioritise follow-ups.">
      {loading ? (
        <Skeleton height="h-64" />
      ) : members.length === 0 ? (
        <EmptyState icon={<ShieldAlert className="h-7 w-7" />} title="No assigned members" message="Members assigned to you will appear here with their risk scores." />
      ) : (
        <div className="space-y-6">
          <Card variant="solid" className="p-5">
            <div className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-(--text-primary)">{needsFollowUp.length}</span>
              <span className="text-(--text-secondary)">members need follow-up (high/critical risk)</span>
            </div>
          </Card>

          <Card variant="solid" className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--border) text-xs uppercase tracking-wide text-(--text-secondary)">
                  <tr>
                    <th className="px-4 py-2 font-medium">Member</th>
                    <th className="px-4 py-2 font-medium">Risk</th>
                    <th className="px-4 py-2 font-medium">Risk score</th>
                    <th className="px-4 py-2 font-medium">Retention score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)">
                  {members.map((m) => (
                    <tr key={m.memberId}>
                      <td className="px-4 py-2 font-medium text-(--text-primary)">{m.name}</td>
                      <td className="px-4 py-2"><Badge variant={riskBadge(m.riskLevel)}>{m.riskLevel ?? "—"}</Badge></td>
                      <td className="px-4 py-2">{m.riskScore ?? "—"}</td>
                      <td className="px-4 py-2 text-(--text-secondary)">{m.retentionScore ?? "—"}</td>
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
