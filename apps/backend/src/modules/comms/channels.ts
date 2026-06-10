import type { CommChannel } from "@prisma/client";

/**
 * Stage 9 — which channels are configured/available in this deployment.
 * The broadcast UI uses this to disable (not crash on) unavailable channels.
 * IN_APP / SOCKET / PUSH are always available (Expo push needs no server keys);
 * EMAIL/SMS/WHATSAPP depend on env config.
 */
export function channelAvailability(): Record<CommChannel, boolean> {
  return {
    IN_APP: true,
    SOCKET: true,
    PUSH: true,
    EMAIL: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
    SMS: process.env.SMS_ENABLED === "true",
    WHATSAPP: process.env.WHATSAPP_ENABLED === "true",
  };
}

export function availableChannels(): CommChannel[] {
  const a = channelAvailability();
  return (Object.keys(a) as CommChannel[]).filter((c) => a[c]);
}

export function isChannelAvailable(channel: CommChannel): boolean {
  return channelAvailability()[channel];
}
