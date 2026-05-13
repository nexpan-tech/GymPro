"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GymController = void 0;
const gym_service_1 = require("./gym.service");
const gym_validation_1 = require("./gym.validation");
class GymController {
    static async create(req, res) {
        const data = gym_validation_1.createGymSchema.parse(req.body);
        const gym = await gym_service_1.GymService.create(data);
        res.json({
            success: true,
            message: "Gym created successfully",
            data: gym,
        });
    }
    static async getAll(req, res) {
        const gyms = await gym_service_1.GymService.getAll();
        res.json({
            success: true,
            data: gyms,
        });
    }
    static async getById(req, res) {
        const gym = await gym_service_1.GymService.getById(req.params.id);
        res.json({
            success: true,
            data: gym,
        });
    }
    static async update(req, res) {
        const data = gym_validation_1.updateGymSchema.parse(req.body);
        const gym = await gym_service_1.GymService.update(req.params.id, data);
        res.json({
            success: true,
            message: "Gym updated successfully",
            data: gym,
        });
    }
    static async activate(req, res) {
        const gym = await gym_service_1.GymService.activate(req.params.id);
        res.json({
            success: true,
            message: "Gym activated",
            data: gym,
        });
    }
    static async deactivate(req, res) {
        const gym = await gym_service_1.GymService.deactivate(req.params.id);
        res.json({
            success: true,
            message: "Gym deactivated",
            data: gym,
        });
    }
    static async delete(req, res) {
        await gym_service_1.GymService.delete(req.params.id);
        res.json({
            success: true,
            message: "Gym deleted successfully",
        });
    }
}
exports.GymController = GymController;
