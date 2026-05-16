import { useEffect, useState } from "react";
import { api } from "@/constants/api";
import type { Member } from "@/types/member.types";

export default function MyMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await api.get("/members");
      const data = res.data?.data || res.data || [];
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading members...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Members</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
          >
            <h3 className="font-semibold text-lg">
              {member.name || "Unnamed Member"}
            </h3>

            <p className="text-sm text-gray-500">
              {member.email || "No email"}
            </p>

            <p className="text-sm mt-2">
              Phone: {member.phone || "N/A"}
            </p>

            <p className="text-sm">
              Status: {member.status || "Active"}
            </p>
          </div>
        ))}

        {members.length === 0 && (
          <div className="text-gray-500">
            No members assigned.
          </div>
        )}
      </div>
    </div>
  );
}