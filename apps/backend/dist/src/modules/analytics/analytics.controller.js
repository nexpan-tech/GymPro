"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = exports.AnalyticsController = void 0;
const analytics_service_1 = require("./analytics.service");
class AnalyticsController {
    async getDashboard(req, res) {
        const gymId = req.user?.gymId;
        if (!gymId) {
            return res.status(400).json({
                success: false,
                message: "Gym ID is required",
            });
        }
        const data = await analytics_service_1.analyticsService.getDashboard(gymId);
        return res.json({
            success: true,
            data,
        });
    }
    async getRevenueChart(req, res) {
        const gymId = req.user?.gymId;
        if (!gymId) {
            return res.status(400).json({
                success: false,
                message: "Gym ID is required",
            });
        }
        const data = await analytics_service_1.analyticsService.getRevenueChart(gymId);
        return res.json({
            success: true,
            data,
        });
    }
    async getMembershipDistribution(req, res) {
        const gymId = req.user?.gymId;
        if (!gymId) {
            return res.status(400).json({
                success: false,
                message: "Gym ID is required",
            });
        }
        const data = await analytics_service_1.analyticsService.getMembershipDistribution(gymId);
        return res.json({
            success: true,
            data,
        });
    }
    async getGymOverview(req, res) {
        const gymId = req.user?.gymId;
        if (!gymId) {
            return res.status(400).json({
                success: false,
                message: "Gym ID is required",
            });
        }
        const data = await analytics_service_1.analyticsService.getGymOverview(gymId);
        return res.json({
            success: true,
            data,
        });
    }
}
exports.AnalyticsController = AnalyticsController;
exports.analyticsController = new AnalyticsController();
