import { Request, Response } from "express";
import {
  registerToken,
  getTokensForUser,
  sendPushToToken,
} from "./push.service";

const EXPO_TOKEN_PREFIX = "ExponentPushToken[";

function isValidExpoToken(token: string): boolean {
  return token.startsWith(EXPO_TOKEN_PREFIX) && token.endsWith("]");
}

export class PushController {
  /**
   * POST /push/register-token
   * Body: { token: string, platform: 'ios' | 'android' }
   * Registers an Expo push token for the authenticated user.
   */
  static async registerToken(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { token, platform } = req.body as {
      token?: string;
      platform?: string;
    };

    if (!token || !platform) {
      res.status(400).json({
        success: false,
        message: "token and platform are required",
      });
      return;
    }

    if (!["ios", "android"].includes(platform)) {
      res.status(400).json({
        success: false,
        message: "platform must be 'ios' or 'android'",
      });
      return;
    }

    if (!isValidExpoToken(token)) {
      res.status(400).json({
        success: false,
        message: "Invalid Expo push token format. Token must start with 'ExponentPushToken['",
      });
      return;
    }

    await registerToken(req.user.id, token, platform);

    res.status(200).json({
      success: true,
      message: "Device token registered successfully",
    });
  }

  /**
   * POST /push/test
   * Sends a test push notification to all devices registered for the current user.
   */
  static async sendTest(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const tokens = await getTokensForUser(req.user.id);

    if (tokens.length === 0) {
      res.status(200).json({
        success: true,
        message: "No registered devices found for this user",
        data: { sent: 0 },
      });
      return;
    }

    const results = await Promise.all(
      tokens.map((token) =>
        sendPushToToken(
          token,
          "GymPro Test Notification",
          "Your push notifications are working correctly!",
          { type: "test" }
        )
      )
    );

    const sent = results.filter(Boolean).length;

    res.status(200).json({
      success: true,
      message: `Test notification sent to ${sent} of ${tokens.length} device(s)`,
      data: { sent, total: tokens.length },
    });
  }
}
