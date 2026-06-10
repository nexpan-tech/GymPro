import { Router } from "express";
import * as controller from "./referral.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

router.use(authMiddleware);

const STAFF = [ROLES.ADMIN, ROLES.RECEPTIONIST];

// Member self-service — static paths before "/:id".
router.get("/me/code", roleMiddleware([ROLES.MEMBER, ...STAFF]), controller.myCode);
router.get("/me", roleMiddleware([ROLES.MEMBER, ...STAFF]), controller.myReferrals);
router.post("/", roleMiddleware([ROLES.MEMBER, ...STAFF]), controller.createInvite);

// Staff referral dashboard + conversion.
router.get("/", roleMiddleware(STAFF), controller.listForGym);
router.post("/:id/convert", roleMiddleware(STAFF), controller.convert);

export default router;
