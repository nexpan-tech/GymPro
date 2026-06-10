import { Router } from "express";
import * as controller from "./trial.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authMiddleware);
// Front-desk / sales staff manage trials.
router.use(roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]));

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/stats", controller.stats); // before "/:id"
router.get("/:id", controller.getById);
router.post("/:id/convert", controller.convert);
router.post("/:id/cancel", controller.cancel);

export default router;
