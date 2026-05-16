// src/pages/gym-admin/NotificationsPage.tsx

import { useEffect, useState } from "react";
import { Bell, Send, Trash2, Users } from "lucide-react";
import { notificationService } from "@/services/notification.service";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  audience: "ALL_MEMBERS" | "ACTIVE_MEMBERS" | "EXPIRED_MEMBERS" | "TRAINERS";
  createdAt: string;
}

const audienceOptions = [
  { value: "ALL_MEMBERS", label: "All Members" },
  { value: "ACTIVE_MEMBERS", label: "Active Members" },
  { value: "EXPIRED_MEMBERS", label: "Expired Members" },
  { value: "TRAINERS", label: "Trainers" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] =
    useState<NotificationItem["audience"]>("ALL_MEMBERS");

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const data = await notificationService.getAll();

      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (Array.isArray(data?.data)) {
        setNotifications(data.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      alert("Please enter title and message.");
      return;
    }

    try {
      setSending(true);

      await notificationService.create({
        title,
        message,
        audience,
      });

      setTitle("");
      setMessage("");
      setAudience("ALL_MEMBERS");

      await loadNotifications();
    } catch (error) {
      console.error("Failed to send notification:", error);
      alert("Failed to send notification.");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this notification?"
    );

    if (!confirmed) return;

    try {
      await notificationService.delete(id);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
      alert("Failed to delete notification.");
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-gray-500">
          Send announcements to members and trainers.
        </p>
      </div>

      {/* Send Notification Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Bell className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Send Notification
          </h2>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              placeholder="Enter notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              rows={4}
              placeholder="Enter notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Audience
            </label>
            <select
              value={audience}
              onChange={(e) =>
                setAudience(
                  e.target.value as NotificationItem["audience"]
                )
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              {audienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Send Notification"}
          </button>
        </form>
      </div>

      {/* Notification History */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Notification History
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No notifications found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start justify-between p-6"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {notification.title}
                  </h3>

                  <p className="mt-2 text-sm text-gray-600">
                    {notification.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                      <Users className="h-3 w-3" />
                      {
                        audienceOptions.find(
                          (a) => a.value === notification.audience
                        )?.label
                      }
                    </span>

                    <span>{formatDate(notification.createdAt)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(notification.id)}
                  className="ml-4 rounded-lg p-2 text-red-500 hover:bg-red-50"
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
  );
}