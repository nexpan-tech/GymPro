"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsQueue = void 0;
const logger_1 = require("../config/logger");
/**
 * SMS Queue (MVP)
 * Later upgrade → BullMQ / Redis + provider (Twilio / MSG91 / WhatsApp API)
 */
class SMSQueue {
    queue = [];
    processing = false;
    /**
     * Add SMS job to queue
     */
    add(job) {
        this.queue.push(job);
        this.process();
    }
    /**
     * Process queue sequentially
     */
    async process() {
        if (this.processing)
            return;
        this.processing = true;
        while (this.queue.length > 0) {
            const job = this.queue.shift();
            if (!job)
                continue;
            try {
                // 🚀 Replace this with real SMS provider later
                await this.sendSMS(job.phone, job.message);
                logger_1.logger.info(`📲 SMS sent to ${job.phone}`);
            }
            catch (error) {
                logger_1.logger.error("❌ SMS queue error", error);
            }
        }
        this.processing = false;
    }
    /**
     * Mock SMS sender (replace with real provider)
     */
    async sendSMS(phone, message) {
        // simulate network delay
        await new Promise((res) => setTimeout(res, 300));
        logger_1.logger.info(`📤 Sending SMS → ${phone}: ${message}`);
        // Example future integration:
        // await axios.post("https://sms-provider.com/send", { phone, message });
    }
}
exports.smsQueue = new SMSQueue();
