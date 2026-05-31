import { prisma } from "../../config/db";
import { logger } from "../../config/logger";

export interface SyncAction {
  type: string;
  payload: Record<string, unknown>;
  clientId: string;
  attemptedAt: string;
}

export interface SyncResult {
  clientId: string;
  status: "processed" | "skipped" | "failed";
  reason?: string;
}

export interface AppConfig {
  features: {
    qrAttendance: boolean;
    pushNotifications: boolean;
    progressPhotos: boolean;
  };
  version: string;
  minAppVersion: string;
}

export class MobileService {
  static async processSyncActions(
    userId: string,
    gymId: string | undefined,
    actions: SyncAction[]
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const action of actions) {
      try {
        switch (action.type) {
          case "notification_read": {
            const notificationId = action.payload.notificationId as string;

            if (!notificationId) {
              results.push({
                clientId: action.clientId,
                status: "failed",
                reason: "notificationId is required in payload",
              });
              break;
            }

            await prisma.notification.update({
              where: { id: notificationId },
              data: {
                isSent: true,
                sentAt: new Date(action.attemptedAt) || new Date(),
              },
            });

            results.push({ clientId: action.clientId, status: "processed" });
            break;
          }

          case "workout_completed": {
            const workoutPlanId = action.payload.workoutPlanId as string;
            const memberId = action.payload.memberId as string | undefined;
            const dayNumber = action.payload.dayNumber as number | undefined;
            const notes = action.payload.notes as string | undefined;
            const workoutExerciseId = action.payload.workoutExerciseId as
              | string
              | undefined;

            if (!workoutPlanId) {
              results.push({
                clientId: action.clientId,
                status: "failed",
                reason: "workoutPlanId is required in payload",
              });
              break;
            }

            if (!gymId) {
              results.push({
                clientId: action.clientId,
                status: "failed",
                reason: "Gym context missing",
              });
              break;
            }

            const member = await prisma.member.findFirst({
              where: memberId
                ? { id: memberId, gymId }
                : { userId, gymId },
            });

            if (!member) {
              results.push({
                clientId: action.clientId,
                status: "failed",
                reason: "Member not found",
              });
              break;
            }

            const existing = await prisma.workoutCompletion.findFirst({
              where: {
                gymId,
                memberId: member.id,
                workoutPlanId,
                ...(dayNumber !== undefined ? { dayNumber } : {}),
                ...(workoutExerciseId ? { workoutExerciseId } : {}),
              },
            });

            if (existing) {
              results.push({
                clientId: action.clientId,
                status: "skipped",
                reason: "workout completion already exists",
              });
              break;
            }

            await prisma.workoutCompletion.create({
              data: {
                gymId,
                memberId: member.id,
                workoutPlanId,
                workoutExerciseId: workoutExerciseId || null,
                dayNumber: dayNumber !== undefined ? Number(dayNumber) : null,
                notes: notes || null,
              },
            });

            results.push({ clientId: action.clientId, status: "processed" });
            break;
          }

          default: {
            results.push({
              clientId: action.clientId,
              status: "skipped",
              reason: "unknown action type",
            });
            break;
          }
        }
      } catch (error) {
        logger.error(`MobileService: sync action failed [${action.type}]`, error);
        results.push({
          clientId: action.clientId,
          status: "failed",
          reason: error instanceof Error ? error.message : "unexpected error",
        });
      }
    }

    return results;
  }

  static getMobileAppConfig(): AppConfig {
    return {
      features: {
        qrAttendance: true,
        pushNotifications: true,
        progressPhotos: true,
      },
      version: "1.0.0",
      minAppVersion: "1.0.0",
    };
  }
}
