import { useEffect, useState } from "react";
import { membershipService } from "../../services/membership.service";
import { Membership } from "../../types/membership.types";
import MembershipsTable from "../../components/tables/MembershipsTable";
import MembershipForm from "../../components/forms/MembershipForm";

export default function MembershipsPage() {
  const [data, setData] = useState<Membership[]>([]);
  const [selected, setSelected] = useState<Membership | null>(null);

  const load = async () => {
    const res = await membershipService.getAll();
    setData(res);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Memberships</h1>

      <MembershipForm
        initialData={selected || undefined}
        onSuccess={() => {
          setSelected(null);
          load();
        }}
      />

      <MembershipsTable
        data={data}
        onEdit={(m) => setSelected(m)}
        onRefresh={load}
      />
    </div>
  );
}