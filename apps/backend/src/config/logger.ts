import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProduction ? winston.format.json() : winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

/**
 * Stage 10 — standardized log channels. info/warn/error come from `logger`;
 * `audit` and `security` are tagged streams for compliance + security events so
 * they can be filtered/shipped separately (e.g. to a SIEM) without new infra.
 */
export function logAudit(event: string, meta: Record<string, unknown> = {}) {
  logger.info(`[AUDIT] ${event}`, { channel: "audit", ...meta });
}

export function logSecurity(event: string, meta: Record<string, unknown> = {}) {
  logger.warn(`[SECURITY] ${event}`, { channel: "security", ...meta });
}