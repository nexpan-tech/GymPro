import { useCallback, useEffect, useState } from "react";
import { memberService } from "@/services/member.service";
import { Card } from "@/components/ui/Card";
import Page from "@/components/ui/Page";

interface ProgressMember {
  id: string;
  name: string;
  weight?: number | string;
}

export default function ProgressPage() {
  const [members, setMembers] = useState<ProgressMember[]>([]);

  const load = useCallback(async () => {
    const res = await memberService.list();
    const data = res.data?.members ?? [];
    setMembers(Array.isArray(data) ? (data as unknown as ProgressMember[]) : []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <Page title="Progress Tracking">
      <div className="grid gap-4">
        {members.map((m) => (
          <Card key={m.id} className="p-4">
            <h2 className="text-lg font-semibold">{m.name}</h2>
            <p className="text-sm opacity-70">
              Weight: {m.weight || "N/A"} kg
            </p>
          </Card>
        ))}
      </div>
    </Page>
  );
}