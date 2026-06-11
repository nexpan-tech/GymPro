// src/pages/gym-admin/NotificationsPage.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Send, Trash2, Users, Megaphone, CalendarDays, Dumbbell } from "lucide-react";
import Page from "@/components/ui/Page";
import { StatTile, SectionHeader, StatusPill, EmptyMomentumState } from "@/components/premium";
import { notificationService } from "@/services/notification.service";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  audience: "ALL" | "MEMBERS" | "TRAINERS" | "STAFF";
  createdAt: string;
}

const audienceOptions = [
  { value: "ALL", label: "All" },
  { value: "MEMBERS", label: "Members" },
  { value: "TRAINERS", label: "Trainers" },
  { value: "STAFF", label: "Staff" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<NotificationItem["audience"]>("ALL");

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationService.list();
      const data = res.data?.notifications ?? [];
      setNotifications(data as unknown as NotificationItem[]);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadNotifications();
  }, [loadNotifications]);

  const stats = useMemo(() => {
    const now = new Date();
    const total = notifications.length;
    const thisMonth = notifications.filter((n) => {
      const d = new Date(n.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const toMembers = notifications.filter((n) => n.audience === "MEMBERS" || n.audience === "ALL").length;
    const toTrainers = notifications.filter((n) => n.audience === "TRAINERS" || n.audience === "ALL").length;
    return { total, thisMonth, toMembers, toTrainers };
  }, [notifications]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert("Please enter title and message.");
      return;
    }
    try {
      setSending(true);
      await notificationService.create({ title, message, audience });
      setTitle("");
      setMessage("");
      setAudience("ALL");
      await loadNotifications();
    } catch (error) {
      console.error("Failed to send notification:", error);
      alert("Failed to send notification.");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Are you sure you want to delete this notification?");
    if (!confirmed) return;
    try {
      await notificationService.remove(id);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
      alert("Failed to delete notification.");
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  }

  const inputCls =
    "w-full rounded-xl border border-border bg-(--surface-solid) px-4 py-3 text-sm text-(--text-primary) outline-none transition-colors placeholder:text-(--text-muted) focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

  return (
    <Page title="Notifications" eyebrow="Engagement Control Center" description="Reach your whole gym in one tap — and keep momentum high.">
      <div className="space-y-8">
        {/* ── Reach stats ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-5 stagger xl:grid-cols-4">
          <StatTile label="Broadcasts sent" value={loading ? "—" : stats.total} icon={<Megaphone />} tone="energy" />
          <StatTile label="This month" value={loading ? "—" : stats.thisMonth} icon={<CalendarDays />} tone="neutral" />
          <StatTile label="Reaching members" value={loading ? "—" : stats.toMembers} icon={<Users />} tone="neutral" />
          <StatTile label="Reaching trainers" value={loading ? "—" : stats.toTrainers} icon={<Dumbbell />} tone="neutral" />
        </div>

        {/* ── Composer ──────────────────────────────────────────────────────── */}
        <div className="surface-card spotlight p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(image:--gradient-primary) text-white shadow-[0_10px_24px_rgba(231,55,37,0.35)]">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-(--text-primary)">Compose broadcast</h2>
              <p className="text-sm text-(--text-secondary)">Announce a class, a deal, or a moment of recognition.</p>
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="eyebrow mb-1.5 block">Title</label>
              <input type="text" placeholder="e.g. New HIIT class drops Monday 🔥" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="eyebrow mb-1.5 block">Message</label>
              <textarea rows={4} placeholder="Write something your members will be excited to read…" value={message} onChange={(e) => setMessage(e.target.value)} className={inputCls} required />
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-48">
                <label className="eyebrow mb-1.5 block">Audience</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value as NotificationItem["audience"])} className={inputCls}>
                  {audienceOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={sending}
                className="press inline-flex items-center gap-2 rounded-xl bg-(image:--gradient-primary) px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(231,55,37,0.3)] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending…" : "Send broadcast"}
              </button>
            </div>
          </form>
        </div>

        {/* ── History ───────────────────────────────────────────────────────── */}
        <div>
          <SectionHeader eyebrow="History" title="Sent broadcasts" />
          {loading ? (
            <div className="surface-card p-10 text-center text-sm text-(--text-muted)">Loading broadcasts…</div>
          ) : notifications.length === 0 ? (
            <div className="surface-card">
              <EmptyMomentumState
                icon={<Megaphone />}
                title="Start the conversation"
                description="Your first broadcast is one tap away. A timely message keeps members engaged and coming back."
              />
            </div>
          ) : (
            <div className="surface-card divide-y divide-border p-0">
              {notifications.map((notification) => (
                <div key={notification.id} className="group flex items-start justify-between gap-4 p-5 transition-colors hover:bg-(--surface-hover)">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black tracking-tight text-(--text-primary)">{notification.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-(--text-secondary)">{notification.message}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <StatusPill tone="completed" size="sm">
                        <Users className="h-3 w-3" />
                        {audienceOptions.find((a) => a.value === notification.audience)?.label}
                      </StatusPill>
                      <span className="text-xs font-medium text-(--text-muted)">{formatDate(notification.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="shrink-0 rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-primary/10 hover:text-primary"
                    title="Delete Notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
