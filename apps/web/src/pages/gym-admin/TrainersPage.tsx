import { useCallback, useEffect, useState } from "react";
import { trainerService } from "../../services/trainer.service";
import { Trainer } from "../../types/user.types";
import TrainersTable from "../../components/tables/TrainersTable";
import TrainerForm from "../../components/forms/TrainerForm";

export default function TrainersPage() {
  const [data, setData] = useState<Trainer[]>([]);
  const [selected, setSelected] = useState<Trainer | null>(null);

  const load = useCallback(async () => {
    const res = await trainerService.getAll();
    setData(res);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Trainers</h1>

      <TrainerForm
        initialData={selected || undefined}
        onSuccess={() => {
          setSelected(null);
          load();
        }}
      />

      <TrainersTable
        data={data}
        onEdit={(t) => setSelected(t)}
        onRefresh={load}
      />
    </div>
  );
}