import { Trainer } from "../../types/user.types";
import { trainerService } from "../../services/trainer.service";

interface Props {
  data: Trainer[];
  onEdit: (item: Trainer) => void;
  onRefresh: () => void;
}

export default function TrainersTable({ data, onEdit, onRefresh }: Props) {
  const handleDelete = async (id: string) => {
    await trainerService.remove(id);
    onRefresh();
  };

  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Specialization</th>
          <th>Experience</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {data.map((t) => (
          <tr key={t.id}>
            <td>{t.name}</td>
            <td>{t.email}</td>
            <td>{t.specialization}</td>
            <td>{t.experience}</td>
            <td className="space-x-2">
              <button onClick={() => onEdit(t)}>Edit</button>
              <button onClick={() => handleDelete(t.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}