export const DOMAIN_EVENTS = {
  MEMBER_CREATED: "member.created",
  MEMBER_UPDATED: "member.updated",
  PAYMENT_RECEIVED: "payment.received",
  ATTENDANCE_MARKED: "attendance.marked",
  WORKOUT_COMPLETED: "workout.completed",
  NOTIFICATION_CREATED: "notification.created",
} as const;

export type DomainEvent =
  (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];