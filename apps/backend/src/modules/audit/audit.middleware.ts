import { Request, Response, NextFunction } from "express";
import { AuditService } from "./audit.service";

function mapMethodToAuditAction(method: string) {
  if (method === "POST") return "CREATE";
  if (method === "PUT" || method === "PATCH") return "UPDATE";
  if (method === "DELETE") return "DELETE";

  return "UPDATE";
}

export async function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();

  res.on("finish", async () => {
    try {
      const user = (req as any).user;

      await AuditService.create({
        gymId: user?.gymId,
        userId: user?.id,
        action: mapMethodToAuditAction(req.method),
        method: req.method,
        path: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        metadata: {
          statusCode: res.statusCode,
          responseTime: Date.now() - start,
          originalAction: `${req.method}_${req.path}`,
        },
      });
    } catch (error) {
      console.error("Audit middleware failed", error);
    }
  });

  next();
}