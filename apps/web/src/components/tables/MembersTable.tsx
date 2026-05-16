import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/common/StatusBadge";
import type { Member } from "@/pages/gym-admin/MembersPage";

interface MembersTableProps {
  data: Member[];
  loading?: boolean;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

export default function MembersTable({
  data,
  loading = false,
  onEdit,
  onDelete,
}: MembersTableProps) {
  if (loading) {
    return (
      <Card className="p-6 text-center text-gray-500">
        Loading members...
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="p-6 text-center text-gray-500">
        No members found.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                Member ID
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Phone
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Status
              </th>
              <th className="px-4 py-3 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((member) => (
              <tr
                key={member.id}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="px-4 py-3">
                  {member.memberId}
                </td>

                <td className="px-4 py-3 font-medium">
                  {member.fullName}
                </td>

                <td className="px-4 py-3">
                  {member.phone}
                </td>

                <td className="px-4 py-3">
                  {member.email || "-"}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={member.status} />
                </td>

                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onEdit(member)
                      }
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onDelete(member)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}