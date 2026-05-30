import { useCallback, useEffect, useState } from "react";
import { dietService, type DietPlan } from "@/services/diet.service";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Page from "@/components/ui/Page";

export default function DietPlansPage() {
  const [diets, setDiets] = useState<DietPlan[]>([]);

  const load = useCallback(async () => {
    const data = await dietService.getAll();
    setDiets(data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <Page title="Diet Plans">
      <div className="flex justify-end mb-4">
        <Button>Create Plan</Button>
      </div>

      <div className="grid gap-4">
        {diets.map((d) => (
          <Card key={d.id} className="p-4">
            <h2 className="text-lg font-semibold">{d.goal ?? `Plan for member ${d.memberId}`}</h2>
            <p className="text-sm opacity-70">{d.notes ?? ""}</p>
          </Card>
        ))}
      </div>
    </Page>
  );
}