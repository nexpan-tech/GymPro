"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const membership_controller_1 = require("./membership.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const roles_1 = require("../../constants/roles");
const router = (0, express_1.Router)();
/**
 * Billing & Membership system
 */
router.post("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.ADMIN, roles_1.ROLES.RECEPTIONIST]), membership_controller_1.MembershipController.create);
router.get("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.ADMIN, roles_1.ROLES.RECEPTIONIST]), membership_controller_1.MembershipController.getAll);
router.get("/member/:memberId", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([
    roles_1.ROLES.ADMIN,
    roles_1.ROLES.RECEPTIONIST,
    roles_1.ROLES.TRAINER,
]), membership_controller_1.MembershipController.getByMember);
router.put("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.ADMIN]), membership_controller_1.MembershipController.update);
router.delete("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.ADMIN]), membership_controller_1.MembershipController.delete);
exports.default = router;
