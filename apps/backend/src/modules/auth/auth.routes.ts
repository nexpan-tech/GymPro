import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { bruteForceProtection } from "../../middleware/bruteForce.middleware";
import { authLimiter } from "../../middleware/rateLimits";

const router = Router();

// Rate limiting applies ONLY to the credential-accepting endpoints (brute-force
// surface). /me, /refresh, /logout are deliberately excluded.
router.post("/register", authLimiter, AuthController.register);
router.post("/register-gym", authLimiter, AuthController.registerGym);
router.post("/login", authLimiter, bruteForceProtection, AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.post("/logout-all", authMiddleware, AuthController.logoutAll);
router.get("/me", authMiddleware, AuthController.me);

export default router;