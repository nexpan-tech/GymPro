import { Member } from "../../types/member.types";
import { memberService } from "../../services/member.service";

interface Props {
  data: Member[];
  onEdit: (member: Member) => void;
  onRefresh: () => void;
}

export default function MembersTable({ data, onEdit, onRefresh }: Props) {
  const handleDelete = async (id: string) => {
    await memberService.remove(id);
    onRefresh();
  };

  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {data.map((m) => (
          <tr key={m.id}>
            <td>{m.name}</td>
            <td>{m.email}</td>
            <td>{m.phone}</td>
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