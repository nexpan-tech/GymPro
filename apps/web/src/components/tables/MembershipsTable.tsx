import { Membership } from "../../types/membership.types";
import { membershipService } from "../../services/membership.service";

interface Props {
  data: Membership[];
  onEdit: (item: Membership) => void;
  onRefresh: () => void;
}

export default function MembershipsTable({ data, onEdit, onRefresh }: Props) {
  const handleDelete = async (id: string) => {
    await membershipService.remove(id);
    onRefresh();
  };

  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>Member</th>
          <th>Plan</th>
          <th>Start</th>
          <th>End</th>
          <th>Price</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {data.map((m) => (
          <tr key={m.id}>
            <td>{m.memberId}</td>
            <td>{m.planName}</td>
            <td>{m.startDate}</td>
            <td>{m.endDate}</td>
            <td>{m.price}</td>
            <td>{m.status}</td>
            <td className="space-x-2">
              <button onClick={() => onEdit(m)}>Edit</button>
              <button onClick={() => handleDelete(m.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}