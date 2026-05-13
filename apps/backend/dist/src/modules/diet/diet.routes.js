"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const diet_controller_1 = require("./diet.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const roles_1 = require("../../constants/roles");
const router = (0, express_1.Router)();
/**
 * Trainers + Admin can manage diet plans
 */
router.post("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.ADMIN, roles_1.ROLES.TRAINER]), diet_controller_1.DietController.create);
router.get("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.ADMIN, roles_1.ROLES.TRAINER]), diet_controller_1.DietController.getAll);
router.get("/:memberId", auth_middleware_1.authMiddleware, diet_controller_1.DietController.getByMember);
router.put("/:memberId", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.ADMIN, roles_1.ROLES.TRAINER]), diet_controller_1.DietController.update);
router.delete("/:memberId", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.ADMIN]), diet_controller_1.DietController.delete);
exports.default = router;
