"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DietController = void 0;
const diet_service_1 = require("./diet.service");
const diet_validation_1 = require("./diet.validation");
class DietController {
    static async create(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const data = diet_validation_1.createDietPlanSchema.parse(req.body);
        const diet = await diet_service_1.DietService.create(req.user.gymId, data);
        res.json({
            success: true,
            message: "Diet plan created successfully",
            data: diet,
        });
    }
    static async getAll(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const diets = await diet_service_1.DietService.getAll(req.user.gymId);
        res.json({
            success: true,
            data: diets,
        });
    }
    static async getByMember(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const memberId = req.params.memberId;
        const diet = await diet_service_1.DietService.getByMember(req.user.gymId, memberId);
        res.json({
            success: true,
            data: diet,
        });
    }
    static async update(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const memberId = req.params.memberId;
        const data = diet_validation_1.updateDietPlanSchema.parse(req.body);
        const updated = await diet_service_1.DietService.update(req.user.gymId, memberId, data);
        res.json({
            success: true,
            message: "Diet plan updated successfully",
            data: updated,
        });
    }
    static async delete(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const memberId = req.params.memberId;
        await diet_service_1.DietService.delete(req.user.gymId, memberId);
        res.json({
            success: true,
            message: "Diet plan deleted successfully",
        });
    }
}
exports.DietController = DietController;
