"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gym_controller_1 = require("./gym.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const roles_1 = require("../../constants/roles");
const router = (0, express_1.Router)();
/**
 * SUPER ADMIN ONLY ROUTES
 * This is your SaaS control plane
 */
router.post("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.SUPER_ADMIN]), gym_controller_1.GymController.create);
router.get("/", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.SUPER_ADMIN]), gym_controller_1.GymController.getAll);
router.get("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.SUPER_ADMIN, roles_1.ROLES.ADMIN]), gym_controller_1.GymController.getById);
router.put("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.SUPER_ADMIN]), gym_controller_1.GymController.update);
router.patch("/:id/activate", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.SUPER_ADMIN]), gym_controller_1.GymController.activate);
router.patch("/:id/deactivate", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.SUPER_ADMIN]), gym_controller_1.GymController.deactivate);
router.delete("/:id", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)([roles_1.ROLES.SUPER_ADMIN]), gym_controller_1.GymController.delete);
exports.default = router;
