import { logger } from "../config/logger";

type SMSPayload = {
  phone: string;
  message: string;
  gymId: string;
  meta?: Record<string, any>;
};

/**
 * SMS Queue (MVP)
 * Later upgrade → BullMQ / Redis + provider (Twilio / MSG91 / WhatsApp API)
 */
class SMSQueue {
  private queue: SMSPayload[] = [];
  private processing = false;

  /**
   * Add SMS job to queue
   */
  add(job: SMSPayload) {
    this.queue.push(job);
    this.process();
  }

  /**
   * Process queue sequentially
   */
  private async process() {
    if (this.processing) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();

      if (!job) continue;

      try {
        // 🚀 Replace this with real SMS provider later
        await this.sendSMS(job.phone, job.message);

        logger.info(`📲 SMS sent to ${job.phone}`);
      } catch (error) {
        logger.error("❌ SMS queue error", error);
      }
    }

    this.processing = false;
  }

  /**
   * Mock SMS sender (replace with real provider)
   */
  private async sendSMS(phone: string, message: string) {
    // simulate network delay
    await new Promise((res) => setTimeout(res, 300));

    logger.info(`📤 Sending SMS → ${phone}: ${message}`);

    // Example future integration:
    // await axios.post("https://sms-provider.com/send", { phone, message });
  }
}

export const smsQueue = new SMSQueue();