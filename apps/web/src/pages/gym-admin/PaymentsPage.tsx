import { useEffect, useState } from "react";
import PaymentsTable from "@/components/tables/PaymentsTable";
import { paymentService } from "@/services/payment.service";
import type { Payment } from "@/types/payment.types";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();

    const filtered = payments.filter((payment) => {
      const method = payment.method?.toLowerCase() ?? "";
      const status = payment.status?.toLowerCase() ?? "";
      const amountStr = payment.amount?.toString() ?? "";

      return (
        method.includes(q) ||
        status.includes(q) ||
        amountStr.includes(q)
      );
    });

    setFilteredPayments(filtered);
  }, [search, payments]);

  async function loadPayments() {
    try {
      setLoading(true);
      const data = await paymentService.getAll();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = filteredPayments.reduce(
    (sum, payment) =>
      payment.status === "paid" ? sum + payment.amount : sum,
    0
  );

  const paidCount = filteredPayments.filter(
    (p) => p.status === "paid"
  ).length;

  const pendingCount = filteredPayments.filter(
    (p) => p.status === "pending"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Payments
        </h1>
        <p className="mt-1 text-gray-500">
          View and track all payment transactions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Paid Payments</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {paidCount}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending Payments</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">
            {pendingCount}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search by invoice, member, method, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Loading payments...
        </div>
      ) : (
        <PaymentsTable payments={filteredPayments} />
      )}
    </div>
  );
}