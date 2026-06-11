// apps/web/src/components/dashboard/NotificationsPanel.tsx

import { Bell, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
}

interface NotificationsPanelProps {
  data?: NotificationItem[];
}

const defaultData: NotificationItem[] = [
  {
    id: 1,
    title: "Membership Expiring",
    message: "14 memberships are expiring this week.",
    time: "10 min ago",
    unread: true,
  },
  {
    id: 2,
    title: "Payment Received",
    message: "₹2,500 received from Priya Sharma.",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 3,
    title: "Attendance Alert",
    message: "Today's attendance crossed 100 members.",
    time: "3 hours ago",
    unread: false,
  },
];

export default function NotificationsPanel({
  data = defaultData,
}: NotificationsPanelProps) {
  return (
    <Card className="rounded-3xl border border-border bg-white/95 p-6 shadow-xl dark:border-border dark:bg-muted">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary dark:bg-primary/15 dark:text-primary">
          <Bell className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white">
            Notifications
          </h3>
          <p className="text-sm text-muted-foreground">
            Latest alerts and updates
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border bg-muted p-4 dark:border-border dark:bg-muted"
          >
            <div className="mb-2 flex items-start justify-between">
              <h4 className="font-semibold text-foreground dark:text-white">
                {item.title}
              </h4>

              {item.unread && (
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {item.message}
            </p>

            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {item.time}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}