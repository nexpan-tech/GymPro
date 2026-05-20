import { useCallback, useEffect, useState } from "react";
import { Salad } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { memberService } from "@/services/member.service";
import { dietService, type DietPlan } from "@/services/diet.service";
import type { Member } from "@/types/member.types";

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export default function DietPlanPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    try {
      const profile = await memberService.getMyProfile();
      setMember(profile);

      if (profile?.id) {
        const data = await dietService.getByMember(profile.id);
        setPlan(data);
      }
    } catch (error) {
      console.error("Failed to load diet plan:", error);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  if (loading) {
    return <div className="text-(--text-secondary)">Loading diet plan...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diet Plan"
        description="Your trainer-assigned weekly nutrition plan."
      />

      <Card variant="premium">
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white">
              <Salad className="h-7 w-7" />
            </div>

            <div>
              <p className="text-sm font-semibold text-(--text-secondary)">
                Nutrition Goal
              </p>
              <h2 className="text-2xl font-black text-(--text-primary)">
                {plan?.goal || member?.fitnessGoal || "No goal assigned"}
              </h2>
            </div>
          </div>

          {plan?.notes && (
            <p className="mt-5 rounded-2xl bg-(--surface-secondary) p-4 text-sm leading-6 text-(--text-secondary)">
              {plan.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {days.map((day) => {
          const value = plan?.[day];

          return (
            <Card key={day} variant="glass" hover>
              <CardHeader>
                <CardTitle className="capitalize">{day}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="min-h-20 whitespace-pre-line text-sm leading-6 text-(--text-secondary)">
                  {value || "No diet assigned"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}