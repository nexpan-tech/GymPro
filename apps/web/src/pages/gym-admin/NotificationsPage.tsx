import { useEffect, useState } from "react";
import { notificationService } from "@/services/notification.service";
import { Card } from "@/components/ui/Card";
import Page from "@/components/ui/Page";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  const load = async () => {
    const data = await notificationService.getAll();
    setNotifications(data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Page title="Notifications">
      <div className="grid gap-3">
        {notifications.map((n) => (
          <Card key={n.id} className="p-4">
            <h3 className="font-semibold">{n.title}</h3>
            <p className="text-sm opacity-70">{n.message}</p>
          </Card>
        ))}
      </div>
    </Page>
  );
}