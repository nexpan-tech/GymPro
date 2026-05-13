"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const router = (0, express_1.Router)();
// Dashboard
router.get("/dashboard", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(["ADMIN", "RECEPTIONIST", "TRAINER"]), analytics_controller_1.analyticsController.getDashboard.bind(analytics_controller_1.analyticsController));
// Revenue chart
router.get("/revenue-chart", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(["ADMIN"]), analytics_controller_1.analyticsController.getRevenueChart.bind(analytics_controller_1.analyticsController));
// Membership distribution
router.get("/membership-distribution", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(["ADMIN"]), analytics_controller_1.analyticsController.getMembershipDistribution.bind(analytics_controller_1.analyticsController));
// Gym overview
router.get("/gym-overview", auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(["ADMIN"]), analytics_controller_1.analyticsController.getGymOverview.bind(analytics_controller_1.analyticsController));
exports.default = router;
