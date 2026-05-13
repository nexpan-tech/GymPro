"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const roles_1 = require("../../constants/roles");
const router = (0, express_1.Router)();
/**
 * Notifications = Automation layer
 */
router.post("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([
    roles_1.ROLES.ADMIN,
    roles_1.ROLES.RECEPTIONIST,
    roles_1.ROLES.TRAINER,
]), notification_controller_1.NotificationController.create);
router.get("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.ADMIN, roles_1.ROLES.RECEPTIONIST]), notification_controller_1.NotificationController.getAll);
router.get("/member/:memberId", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([
    roles_1.ROLES.ADMIN,
    roles_1.ROLES.TRAINER,
    roles_1.ROLES.RECEPTIONIST,
]), notification_controller_1.NotificationController.getByMember);
router.patch("/:id/sent", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([
    roles_1.ROLES.ADMIN,
    roles_1.ROLES.RECEPTIONIST,
]), notification_controller_1.NotificationController.markSent);
exports.default = router;
