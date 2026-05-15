interface Activity {
  id: string;
  message: string;
  time: string;
}

interface Props {
  data: Activity[];
}

export default function RecentActivity({ data }: Props) {
  return (
    <div className="p-4 border rounded-xl">
      <h2 className="font-semibold mb-3">Recent Activity</h2>

      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.message}</span>
            <span className="text-gray-500">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}