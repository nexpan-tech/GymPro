import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import Select from "@/components/forms/Select";
import EmptyState from "@/components/common/EmptyState";
import { Users } from "lucide-react";
import { memberService } from "@/services/member.service";
import ProgressManager from "@/components/stage5/ProgressManager";

// Member list is role-scoped server-side (TRAINER → assigned, ADMIN → all), so
// this one component serves both the trainer and gym-admin progress pages.
export default function MemberProgressReview() {
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    memberService
      .list()
      .then((res) => {
        if (!active) return;
        const list = (res.data.members ?? []).map((m) => ({
          id: m.id,
          name: m.user?.name ?? "Member",
        }));
        setMembers(list);
        if (list.length > 0) setSelected(list[0].id);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const options = useMemo(
    () => members.map((m) => ({ label: m.name, value: m.id })),
    [members],
  );

  if (!loading && members.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-7 w-7" />}
        title="No members"
        message="No members are available to review yet."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="solid" className="p-4">
        <div className="max-w-sm">
          <Select
            label="Select member"
            options={options}
            value={selected}
            placeholder="Select a member"
            onChange={(e) => setSelected(e.target.value)}
          />
        </div>
      </Card>

      {selected ? <ProgressManager key={selected} scope={`member/${selected}`} canEdit /> : null}
    </div>
  );
}
