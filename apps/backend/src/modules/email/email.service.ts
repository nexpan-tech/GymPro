import { emailTransporter } from "../../config/email";
import { logger } from "../../config/logger";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  /** Optional file attachments (e.g. invoice PDFs). */
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[];
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn("SMTP not configured. Email skipped.", {
      to: input.to,
      subject: input.subject,
    });

    return {
      skipped: true,
    };
  }

  const result = await emailTransporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.attachments ? { attachments: input.attachments } : {}),
  });

  logger.info("Email sent", {
    to: input.to,
    messageId: result.messageId,
  });

  return result;
}