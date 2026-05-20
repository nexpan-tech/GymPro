import { useCallback, useEffect, useState } from "react";
import { Activity, Ruler, Scale, Target } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { memberService } from "@/services/member.service";
import type { Member } from "@/types/member.types";

export default function ProgressPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    try {
      const profile = await memberService.getMyProfile();
      setMember(profile);
    } catch (error) {
      console.error("Failed to load progress:", error);
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  if (loading) {
    return <div className="text-(--text-secondary)">Loading progress...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress"
        description="Track your body stats and fitness goal progress."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <ProgressMetric
          icon={Scale}
          label="Weight"
          value={member?.weight ? `${member.weight} kg` : "Not set"}
        />
        <ProgressMetric
          icon={Ruler}
          label="Height"
          value={member?.height ? `${member.height} cm` : "Not set"}
        />
        <ProgressMetric
          icon={Target}
          label="Goal"
          value={member?.fitnessGoal || "Not set"}
        />
        <ProgressMetric icon={Activity} label="Status" value="Active" />
      </div>

      <Card variant="premium">
        <CardContent>
          <h2 className="text-xl font-black text-(--text-primary)">
            Progress Summary
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-(--text-secondary)">
            Your current fitness goal is{" "}
            <span className="font-bold text-(--text-primary)">
              {member?.fitnessGoal || "not set yet"}
            </span>
            . As your trainer updates your stats, this page will show richer
            progress charts, body measurements, and transformation history.
          </p>

          <div className="mt-6 h-4 overflow-hidden rounded-full bg-(--surface-secondary)">
            <div className="h-full w-[68%] rounded-full bg-[image:var(--gradient-primary)]" />
          </div>

          <p className="mt-2 text-sm font-semibold text-(--text-secondary)">
            Estimated profile completion: 68%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Scale;
  label: string;
  value: string;
}) {
  return (
    <Card variant="glass" padding="md" hover>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-white">
          <Icon className="h-6 w-6" />
        </div>

        <div>
          <p className="text-sm font-semibold text-(--text-secondary)">
            {label}
          </p>
          <p className="mt-1 text-xl font-black text-(--text-primary)">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}