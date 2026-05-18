import { Bell, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

const mockNotifications = [
  {
    id: 1,
    title: "Membership Expiring",
    message: "Arun Kumar's membership expires tomorrow.",
    time: "10 min ago",
    unread: true,
  },
  {
    id: 2,
    title: "Payment Received",
    message: "₹2,500 received from Priya.",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 3,
    title: "New Member Registered",
    message: "Karthik joined Gold Plan.",
    time: "3 hours ago",
    unread: false,
  },
];

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = mockNotifications.filter((item) => item.unread).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative z-9999">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          "relative rounded-2xl border border-(--border) bg-(--surface) p-2.5 shadow-(--shadow-sm) transition-all duration-200",
          "hover:bg-(--surface-hover) hover:shadow-(--shadow-md)"
        )}
      >
        <Bell className="h-5 w-5 text-(--text-secondary)" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-9999 mt-3 w-88 overflow-hidden rounded-2xl border border-(--glass-border) bg-(--glass) shadow-(--shadow-xl) backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-(--border) px-5 py-4">
            <div>
              <h3 className="text-sm font-black text-(--text-primary)">
                Notifications
              </h3>
              <p className="text-xs text-(--text-secondary)">
                {unreadCount} unread updates
              </p>
            </div>

            <CheckCircle2 className="h-5 w-5 text-(--color-success)" />
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {mockNotifications.map((item) => (
              <div
                key={item.id}
                className="rounded-xl px-3 py-3 transition hover:bg-(--surface-hover)"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={clsx(
                      "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                      item.unread ? "bg-indigo-500" : "bg-(--border-strong)"
                    )}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-(--text-primary)">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-(--text-secondary)">
                      {item.message}
                    </p>

                    <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-(--text-muted)">
                      <Clock className="h-3 w-3" />
                      {item.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center gap-2 border-t border-(--border) px-4 py-3 text-sm font-bold text-indigo-600 transition hover:bg-(--surface-hover) dark:text-indigo-400"
          >
            View all notifications
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}