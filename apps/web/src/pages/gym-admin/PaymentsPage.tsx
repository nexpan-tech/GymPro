import { useEffect, useState } from "react";
import { paymentService } from "../../services/payment.service";
import { Payment } from "../../types/payment.types";
import PaymentsTable from "../../components/tables/PaymentsTable";
import PaymentForm from "../../components/forms/PaymentForm";

export default function PaymentsPage() {
  const [data, setData] = useState<Payment[]>([]);
  const [selected, setSelected] = useState<Payment | null>(null);

  const load = async () => {
    const res = await paymentService.getAll();
    setData(res);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Payments</h1>

      <PaymentForm
        initialData={selected || undefined}
        onSuccess={() => {
          setSelected(null);
          load();
        }}
      />

      <PaymentsTable
        data={data}
        onEdit={(p) => setSelected(p)}
        onRefresh={load}
      />
    </div>
  );
}