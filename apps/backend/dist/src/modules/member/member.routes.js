"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const member_controller_1 = require("./member.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const roles_1 = require("../../constants/roles");
const router = (0, express_1.Router)();
/**
 * ADMIN + RECEPTIONIST manage members
 * TRAINER can view only (optional later)
 */
router.post("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.ADMIN, roles_1.ROLES.RECEPTIONIST]), member_controller_1.MemberController.create);
router.get("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([
    roles_1.ROLES.ADMIN,
    roles_1.ROLES.RECEPTIONIST,
    roles_1.ROLES.TRAINER,
]), member_controller_1.MemberController.getAll);
router.get("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([
    roles_1.ROLES.ADMIN,
    roles_1.ROLES.RECEPTIONIST,
    roles_1.ROLES.TRAINER,
]), member_controller_1.MemberController.getById);
router.put("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.ADMIN, roles_1.ROLES.RECEPTIONIST]), member_controller_1.MemberController.update);
router.delete("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.ADMIN]), member_controller_1.MemberController.delete);
exports.default = router;
