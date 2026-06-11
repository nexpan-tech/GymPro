import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import Page from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { announcementService } from "@/services/comms.service";

const prioTone = (p: string) => (p === "URGENT" ? "danger" : p === "HIGH" ? "warning" : "info");

export default function MemberAnnouncementsPage() {
  const [items, setItems] = useState<{ id: string; title: string; message: string; priority: string; sentAt: string; isRead: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await announcementService.listMine().catch(() => ({ items: [], unreadCount: 0 }));
    setItems(res.items);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function open(id: string, isRead: boolean) {
    if (!isRead) { await announcementService.markRead(id).catch(() => undefined); void load(); }
  }

  if (loading) return <Page title="Announcements"><Skeleton height="h-64" /></Page>;

  return (
    <Page title="Announcements" description="Updates from your gym.">
      {items.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-7 w-7" />} title="No announcements" message="You're all caught up." />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} variant="solid" className={`cursor-pointer p-4 ${!a.isRead ? "border-l-4 border-l-primary/40" : ""}`} onClick={() => open(a.id, a.isRead)}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold text-(--text-primary)">
                  <Megaphone className="h-4 w-4 text-primary" />{a.title}
                  {!a.isRead && <Badge variant="danger">New</Badge>}
                </span>
                <Badge variant={prioTone(a.priority)}>{a.priority}</Badge>
              </div>
              <p className="mt-1 text-sm text-(--text-secondary)">{a.message}</p>
              {a.sentAt && <p className="mt-2 text-xs text-(--text-secondary)">{new Date(a.sentAt).toLocaleString()}</p>}
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}
