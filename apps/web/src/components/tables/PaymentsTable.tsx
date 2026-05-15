import { Payment } from "../../types/payment.types";
import { paymentService } from "../../services/payment.service";

interface Props {
  data: Payment[];
  onEdit: (item: Payment) => void;
  onRefresh: () => void;
}

export default function PaymentsTable({ data, onEdit, onRefresh }: Props) {
  const handleDelete = async (id: string) => {
    await paymentService.remove(id);
    onRefresh();
  };

  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>Member</th>
          <th>Amount</th>
          <th>Method</th>
          <th>Status</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {data.map((p) => (
          <tr key={p.id}>
            <td>{p.memberId}</td>
            <td>{p.amount}</td>
            <td>{p.method}</td>
            <td>{p.status}</td>
            <td>{p.date}</td>
            <td className="space-x-2">
              <button onClick={() => onEdit(p)}>Edit</button>
              <button onClick={() => handleDelete(p.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}