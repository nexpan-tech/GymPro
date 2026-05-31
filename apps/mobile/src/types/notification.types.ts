export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

export interface PushTokenRegistration {
  token: string;
  platform: "ios" | "android" | "web";
}
