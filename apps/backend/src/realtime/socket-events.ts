export const SOCKET_EVENTS = {
  CONNECTED: "connected",
  NOTIFICATION: "notification",
  DASHBOARD_UPDATE: "dashboard:update",
  ATTENDANCE_UPDATE: "attendance:update",
  LEADERBOARD_UPDATE: "leaderboard:update",

  // Stage 9 — communication & realtime
  NOTIFICATION_CREATED: "notification.created",
  ANNOUNCEMENT_SENT: "announcement.sent",
  CHAT_MESSAGE: "chat.message",
  CHAT_READ: "chat.read",
  CHAT_TYPING: "chat.typing",
  // Phase L — presence (online / away / offline) + typing indicators.
  PRESENCE_UPDATE: "presence:update",
  PAYMENT_UPDATED: "payment.updated",
  CHALLENGE_UPDATED: "challenge.updated",
} as const;