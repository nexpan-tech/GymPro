import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { ApiPlatformController } from "./api-platform.controller";

const router = Router();

router.get("/public/gym-profile", ApiPlatformController.publicGymProfile);

router.use(authMiddleware);

router.post("/keys", ApiPlatformController.createApiKey);
router.get("/keys", ApiPlatformController.getApiKeys);
router.patch("/keys/:id/revoke", ApiPlatformController.revokeApiKey);

router.post("/webhooks", ApiPlatformController.createWebhook);
router.get("/webhooks", ApiPlatformController.getWebhooks);

router.post("/integrations", ApiPlatformController.createIntegration);
router.get("/integrations", ApiPlatformController.getIntegrations);

export default router;