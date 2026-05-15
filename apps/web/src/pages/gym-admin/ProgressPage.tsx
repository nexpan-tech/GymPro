import { useEffect, useState } from "react";
import { memberService } from "@/services/member.service";
import { Card } from "@/components/ui/Card";
import Page from "@/components/ui/Page";

export default function ProgressPage() {
  const [members, setMembers] = useState<any[]>([]);

  const load = async () => {
    const data = await memberService.getAll();
    setMembers(data);
  };

  useEffect(() => {
    load();
  }, []);

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