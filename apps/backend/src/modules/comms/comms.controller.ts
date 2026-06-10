import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse, AppError } from "../../utils/response";
import { CommunicationOrchestrator } from "./orchestrator.service";
import { CommsAnalyticsService } from "./comms.analytics.service";
import { channelAvailability } from "./channels";
import type { CommChannel } from "@prisma/client";
import { getAllQueueStats } from "../../queues/queueMonitor";
import { notificationQueue, emailQueue, billingQueue } from "../../queues/queue";
import { deadLetterQueue } from "../../queues/dlq";

// ── Channel availability (for broadcast UI gating) ──
export const channels = asyncHandler(async (_req: Request, res: Response) => {
  return successResponse(res, "Channel availability", channelAvailability());
});

// ── Broadcast to an audience over selected channels ──
export const broadcast = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!user.gymId) throw new AppError("Gym context missing", 403);
  const { audience = "ALL", branchId, memberIds, channels: reqChannels, title, message, type } = req.body;
  if (!title || !message) throw new AppError("title and message are required", 400);

  const recipients = await CommunicationOrchestrator.resolveAudience(user.gymId, audience, { branchId, memberIds });
  // IN_APP + SOCKET always; plus any requested available channels.
  const channelList = Array.from(new Set<CommChannel>(["IN_APP", "SOCKET", ...((reqChannels as CommChannel[]) ?? [])]));

  const delivery = await CommunicationOrchestrator.dispatch({
    gymId: user.gymId,
    channels: channelList,
    recipients,
    title,
    message,
    type,
    refType: "broadcast",
    refId: `broadcast_${Date.now()}`,
  });

  return successResponse(res, "Broadcast dispatched", { recipients: recipients.length, delivery }, 201);
});

// ── Analytics ──
export const analytics = asyncHandler(async (req: Request, res: Response) => {
  return successResponse(res, "Communication analytics", await CommsAnalyticsService.overview(req.user!));
});

export const deliveryLogs = asyncHandler(async (req: Request, res: Response) => {
  return successResponse(res, "Delivery logs", await CommsAnalyticsService.deliveryLogs(req.user!));
});

// ── Queue health + DLQ ──
export const queueHealth = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await getAllQueueStats([notificationQueue, emailQueue, billingQueue, deadLetterQueue]);
  return successResponse(res, "Queue health", stats);
});

export const dlqList = asyncHandler(async (_req: Request, res: Response) => {
  const jobs = await deadLetterQueue.getJobs(["waiting", "delayed", "failed", "completed"], 0, 50);
  const data = jobs.map((j) => ({
    id: j.id,
    name: j.name,
    originalQueue: j.data?.originalQueue,
    originalJobName: j.data?.originalJobName,
    errorMessage: j.data?.errorMessage,
    attemptsMade: j.data?.attemptsMade,
    timestamp: j.timestamp,
  }));
  return successResponse(res, "Dead-letter jobs", data);
});

export const dlqRetry = asyncHandler(async (req: Request, res: Response) => {
  const job = await deadLetterQueue.getJob(req.params.id as string);
  if (!job) throw new AppError("DLQ job not found", 404);
  const { originalQueue, originalJobName, originalJobData } = job.data ?? {};
  const target =
    originalQueue === "emails" ? emailQueue : originalQueue === "billing" ? billingQueue : notificationQueue;
  await target.add(originalJobName || "retried-job", originalJobData ?? {});
  await job.remove();
  return successResponse(res, "Job requeued", { requeuedTo: originalQueue });
});
