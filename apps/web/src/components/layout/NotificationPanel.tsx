// src/components/layout/NotificationPanel.tsx
// Slide-in panel from the right showing realtime + API notifications.
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Clock,
  CreditCard,
  Dumbbell,
  Megaphone,
  ShieldAlert,
  Star,
  Trophy,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type { AppNotification } from "@/store/notification.store";

// ── Props ──────────────────────────────────────────────────────────────────────

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

// ── Icon by type ───────────────────────────────────────────────────────────────

function NotificationIcon({ type }: { type?: string }) {
  const cls = "h-4 w-4 shrink-0";
  switch (type) {
    case "PAYMENT_REMINDER":
    case "payment:received":
      return <CreditCard className={cls} style={{ color: "var(--color-success, #767676)" }} />;
    case "MEMBERSHIP_RENEWAL":
      return <Star className={cls} style={{ color: "var(--primary-500, #e73725)" }} />;
    case "ATTENDANCE_REMINDER":
    case "attendance:update":
      return <Dumbbell className={cls} style={{ color: "var(--primary-400, #ec5848)" }} />;
    case "GOAL_ACHIEVED":
    case "BADGE_EARNED":
    case "CHALLENGE_COMPLETED":
      return <Trophy className={cls} style={{ color: "#767676" }} />;
    case "CHALLENGE_STARTED":
    case "dashboard:refresh":
      return <Zap className={cls} style={{ color: "#767676" }} />;
    case "WORKOUT_PLAN_UPDATED":
    case "DIET_PLAN_UPDATED":
      return <Dumbbell className={cls} style={{ color: "var(--primary-500, #e73725)" }} />;
    case "LEAD_ASSIGNED":
      return <UserPlus className={cls} style={{ color: "var(--primary-500, #e73725)" }} />;
    case "SYSTEM_ALERT":
      return <ShieldAlert className={cls} style={{ color: "#e73725" }} />;
    case "SESSION_REMINDER":
    case "SESSION_CANCELLED":
      return <Clock className={cls} style={{ color: "var(--text-muted)" }} />;
    case "GENERAL":
    default:
      return <Megaphone className={cls} style={{ color: "var(--text-secondary)" }} />;
  }
}

// ── Relative time helper ───────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "var(--surface-hover, #f4f4f4)" }}
      >
        <Bell className="h-6 w-6" style={{ color: "var(--text-muted)" }} />
      </div>
      <div className="text-center">
        <p
          className="text-sm font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          All caught up
        </p>
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          No notifications yet. We'll let you know when something happens.
        </p>
      </div>
    </div>
  );
}

// ── Notification row ───────────────────────────────────────────────────────────

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      className="group flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition-colors"
      style={{
        background: notification.isRead
          ? "transparent"
          : "var(--primary-50, rgba(231,55,37,0.04))",
      }}
      onClick={() => {
        if (!notification.isRead) onMarkRead(notification.id);
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor =
          "var(--surface-hover, #f4f4f4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = notification.isRead
          ? "transparent"
          : "var(--primary-50, rgba(231,55,37,0.04))";
      }}
    >
      {/* Type icon */}
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "var(--surface-hover, #f4f4f4)" }}
      >
        <NotificationIcon type={notification.type} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm font-bold leading-5"
            style={{ color: "var(--text-primary)" }}
          >
            {notification.title}
          </p>
          {/* Unread dot */}
          {!notification.isRead && (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ background: "var(--primary-500, #e73725)" }}
            />
          )}
        </div>

        <p
          className="mt-0.5 text-xs leading-5"
          style={{ color: "var(--text-secondary)" }}
        >
          {notification.message}
        </p>

        <div
          className="mt-1.5 flex items-center gap-1 text-[11px]"
          style={{ color: "var(--text-muted)" }}
        >
          <Clock className="h-3 w-3" />
          {relativeTime(notification.createdAt)}
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

export default function NotificationPanel({
  open,
  onClose,
}: NotificationPanelProps) {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    useNotifications();

  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    // Use a small timeout so the open-click itself doesn't immediately close
    const tid = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleEsc);
    }, 50);

    return () => {
      clearTimeout(tid);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop (mobile only) */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-99 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            ref={panelRef}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 z-100 flex h-full w-full flex-col overflow-hidden border-l shadow-2xl sm:w-105"
            style={{
              background: "var(--glass, rgba(255,255,255,0.97))",
              borderColor: "var(--border, rgba(1,0,0,0.10))",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div
              className="flex shrink-0 items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--border, rgba(1,0,0,0.10))" }}
            >
              <div>
                <h2
                  className="text-base font-black"
                  style={{ color: "var(--text-primary)" }}
                >
                  Notifications
                </h2>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {isLoading
                    ? "Loading..."
                    : unreadCount > 0
                    ? `${unreadCount} unread`
                    : "All caught up"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Mark all as read */}
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
                    style={{
                      background: "var(--surface-hover, #f4f4f4)",
                      color: "var(--primary-600, #e73725)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--primary-50, rgba(231,55,37,0.08))";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--surface-hover, #f4f4f4)";
                    }}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}

                {/* Close */}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "var(--surface-hover, #f4f4f4)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "transparent";
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── Body ──────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                // Skeleton
                <div className="space-y-2 p-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex animate-pulse items-start gap-3 rounded-xl px-3 py-3"
                    >
                      <div
                        className="h-8 w-8 shrink-0 rounded-xl"
                        style={{ background: "var(--surface-hover, #f4f4f4)" }}
                      />
                      <div className="flex-1 space-y-2">
                        <div
                          className="h-3 w-3/4 rounded"
                          style={{ background: "var(--surface-hover, #f4f4f4)" }}
                        />
                        <div
                          className="h-2.5 w-full rounded"
                          style={{ background: "var(--surface-hover, #f4f4f4)" }}
                        />
                        <div
                          className="h-2 w-1/4 rounded"
                          style={{ background: "var(--surface-hover, #f4f4f4)" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-0.5">
                  {notifications.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      onMarkRead={markRead}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            {!isLoading && notifications.length > 0 && (
              <div
                className="shrink-0 border-t px-4 py-3"
                style={{ borderColor: "var(--border, rgba(1,0,0,0.10))" }}
              >
                <p
                  className="text-center text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Showing {notifications.length} notification
                  {notifications.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
