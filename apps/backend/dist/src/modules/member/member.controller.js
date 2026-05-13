"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberController = void 0;
const member_service_1 = require("./member.service");
const member_validation_1 = require("./member.validation");
class MemberController {
    static async create(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const data = member_validation_1.createMemberSchema.parse(req.body);
        const member = await member_service_1.MemberService.create(req.user.gymId, data);
        res.json({
            success: true,
            message: "Member created successfully",
            data: member,
        });
    }
    static async getAll(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const members = await member_service_1.MemberService.getAll(req.user.gymId);
        res.json({
            success: true,
            data: members,
        });
    }
    static async getById(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const member = await member_service_1.MemberService.getById(req.user.gymId, req.params.id);
        res.json({
            success: true,
            data: member,
        });
    }
    static async update(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const data = member_validation_1.updateMemberSchema.parse(req.body);
        const member = await member_service_1.MemberService.update(req.user.gymId, req.params.id, data);
        res.json({
            success: true,
            message: "Member updated successfully",
            data: member,
        });
    }
    static async delete(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        await member_service_1.MemberService.delete(req.user.gymId, req.params.id);
        res.json({
            success: true,
            message: "Member deleted successfully",
        });
    }
}
exports.MemberController = MemberController;
