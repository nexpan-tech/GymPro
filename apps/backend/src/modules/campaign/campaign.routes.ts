import { Router } from "express";
import { CampaignController } from "./campaign.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", CampaignController.create);
router.get("/", CampaignController.getAll);
router.post("/:id/send", CampaignController.send);

export default router;