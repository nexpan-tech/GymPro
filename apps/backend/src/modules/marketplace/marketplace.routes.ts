import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { MarketplaceController } from "./marketplace.controller";

const router = Router();

router.get("/public", MarketplaceController.publicMarketplace);

router.use(authMiddleware);

router.post("/", MarketplaceController.createItem);
router.get("/", MarketplaceController.getItems);

router.patch("/:id/publish", MarketplaceController.publishItem);
router.patch("/:id/unpublish", MarketplaceController.unpublishItem);

export default router;