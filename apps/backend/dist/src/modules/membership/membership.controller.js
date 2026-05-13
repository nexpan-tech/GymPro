"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipController = void 0;
const membership_service_1 = require("./membership.service");
const membership_validation_1 = require("./membership.validation");
class MembershipController {
    static async create(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const data = membership_validation_1.createMembershipSchema.parse(req.body);
        const membership = await membership_service_1.MembershipService.create(req.user.gymId, data);
        res.json({
            success: true,
            message: "Membership created successfully",
            data: membership,
        });
    }
    static async getAll(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const memberships = await membership_service_1.MembershipService.getAll(req.user.gymId);
        res.json({
            success: true,
            data: memberships,
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
        const memberships = await membership_service_1.MembershipService.getByMember(req.user.gymId, memberId);
        res.json({
            success: true,
            data: memberships,
        });
    }
    static async update(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const data = membership_validation_1.updateMembershipSchema.parse(req.body);
        const updated = await membership_service_1.MembershipService.update(req.user.gymId, req.params.id, data);
        res.json({
            success: true,
            message: "Membership updated successfully",
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
        await membership_service_1.MembershipService.delete(req.user.gymId, req.params.id);
        res.json({
            success: true,
            message: "Membership deleted successfully",
        });
    }
}
exports.MembershipController = MembershipController;
