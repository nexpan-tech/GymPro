import { useEffect, useState } from "react";
import { memberService } from "../../services/member.service";
import { Member } from "../../types/member.types";
import MembersTable from "../../components/tables/MembersTable";
import MemberForm from "../../components/forms/MemberForm";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);

  const load = async () => {
    const data = await memberService.getAll();
    setMembers(data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Members</h1>

      <MemberForm
        initialData={selected || undefined}
        onSuccess={() => {
          setSelected(null);
          load();
        }}
      />

      <MembersTable
        data={members}
        onEdit={(m) => setSelected(m)}
        onRefresh={load}
      />
    </div>
  );
}