import { useState } from "react";
import { paymentService } from "../../services/payment.service";
import { Payment } from "../../types/payment.types";

interface Props {
  initialData?: Partial<Payment>;
  onSuccess?: () => void;
}

export default function PaymentForm({ initialData, onSuccess }: Props) {
  const [form, setForm] = useState({
    memberId: initialData?.memberId || "",
    amount: initialData?.amount || 0,
    method: initialData?.method || "cash",
    status: initialData?.status || "paid",
    date: initialData?.date || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (initialData?.id) {
      await paymentService.update(initialData.id, form);
    } else {
      await paymentService.create(form);
    }

    onSuccess?.();
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <input
        name="memberId"
        placeholder="Member ID"
        onChange={handleChange}
        className="input"
      />

      <input
        name="amount"
        type="number"
        placeholder="Amount"
        onChange={handleChange}
        className="input"
      />

      <select name="method" onChange={handleChange} className="input">
        <option value="cash">Cash</option>
        <option value="card">Card</option>
        <option value="upi">UPI</option>
        <option value="bank">Bank</option>
      </select>

      <select name="status" onChange={handleChange} className="input">
        <option value="paid">Paid</option>
        <option value="pending">Pending</option>
        <option value="failed">Failed</option>
      </select>

      <input
        name="date"
        type="date"
        onChange={handleChange}
        className="input"
      />

      <button className="btn">Save Payment</button>
    </form>
  );
}