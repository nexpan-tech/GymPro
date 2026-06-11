import {
  Activity,
  UserPlus,
  CreditCard,
  CalendarCheck,
  Dumbbell,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: "member" | "payment" | "attendance" | "workout";
  title: string;
  description: string;
  time: string;
}

interface Props {
  data?: ActivityItem[];
}

const defaultData: ActivityItem[] = [
  {
    id: "1",
    type: "member",
    title: "New Member Joined",
    description: "Rahul Kumar registered",
    time: "2 hours ago",
  },
  {
    id: "2",
    type: "payment",
    title: "Payment Received",
    description: "₹2,000 membership renewal",
    time: "4 hours ago",
  },
  {
    id: "3",
    type: "attendance",
    title: "Attendance Marked",
    description: "95 members checked in",
    time: "Today",
  },
  {
    id: "4",
    type: "workout",
    title: "Workout Updated",
    description: "Trainer assigned new plan",
    time: "Yesterday",
  },
];

const iconMap = {
  member: UserPlus,
  payment: CreditCard,
  attendance: CalendarCheck,
  workout: Dumbbell,
};

const colorMap = {
  member: "bg-primary/10 text-primary",
  payment: "bg-muted text-muted-foreground",
  attendance: "bg-primary/10 text-primary",
  workout: "bg-muted text-muted-foreground",
};

export default function RecentActivity({ data = defaultData }: Props) {
  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Recent Activity
        </h2>
      </div>

      <div className="space-y-4">
        {data.map((item) => {
          const Icon = iconMap[item.type];

          return (
            <div
              key={item.id}
              className="flex items-start gap-3 pb-4 border-b border-border last:border-0"
            >
              <div
                className={`p-2 rounded-lg ${colorMap[item.type]}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {item.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}