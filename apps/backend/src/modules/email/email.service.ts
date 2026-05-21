import { emailTransporter } from "../../config/email";
import { logger } from "../../config/logger";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
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
  });

  logger.info("Email sent", {
    to: input.to,
    messageId: result.messageId,
  });

  return result;
}