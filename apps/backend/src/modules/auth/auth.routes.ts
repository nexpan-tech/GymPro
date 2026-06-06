import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { bruteForceProtection } from "../../middleware/bruteForce.middleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/register-gym", AuthController.registerGym);
router.post("/login", bruteForceProtection, AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.post("/logout-all", authMiddleware, AuthController.logoutAll);
router.get("/me", authMiddleware, AuthController.me);

export default router;