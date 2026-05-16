import { useEffect, useState } from "react";
import { membershipService } from "@/services/membership.service";

export default function MembershipDetailsPage() {
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembership();
  }, []);

  async function loadMembership() {
    try {
      const res = await membershipService.getAll();
      setMembership(Array.isArray(res) ? res[0] : null);
    } catch (error) {
      console.error("Failed to load membership", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading membership details...</div>;

  if (!membership) {
    return <div>No active membership found.</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Membership Details</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p><strong>Name:</strong> {membership.name}</p>
        <p><strong>Price:</strong> ₹{membership.price}</p>
        <p><strong>Duration:</strong> {membership.durationInDays} days</p>
        <p><strong>Status:</strong> {membership.status || "ACTIVE"}</p>
      </div>
    </div>
  );
}