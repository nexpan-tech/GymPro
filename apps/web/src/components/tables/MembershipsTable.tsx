import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/common/StatusBadge";
import type { Membership } from "@/pages/gym-admin/MembershipsPage";

interface MembershipsTableProps {
  data: Membership[];
  loading?: boolean;
  onEdit: (membership: Membership) => void;
  onDelete: (membership: Membership) => void;
}

export default function MembershipsTable({
  data,
  loading = false,
  onEdit,
  onDelete,
}: MembershipsTableProps) {
  if (loading) {
    return (
      <Card className="p-6 text-center text-gray-500">
        Loading membership plans...
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="p-6 text-center text-gray-500">
        No membership plans found.
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
                Plan Name
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Duration
              </th>
              <th className="px-4 py-3 text-left font-medium">
                Price
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
            {data.map((membership) => (
              <tr
                key={membership.id}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {membership.name}
                  </div>
                  {membership.description && (
                    <div className="text-xs text-gray-500">
                      {membership.description}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3">
                  {membership.duration} month
                  {membership.duration > 1 ? "s" : ""}
                </td>

                <td className="px-4 py-3 font-medium">
                  ₹{membership.price.toLocaleString()}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge
                    status={membership.status}
                  />
                </td>

                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        onEdit(membership)
                      }
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onDelete(membership)}
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