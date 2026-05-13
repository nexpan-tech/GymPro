"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
class NotificationController {
    static async create(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const { memberId, type, title, message } = req.body;
        const notification = await notification_service_1.NotificationService.create(req.user.gymId, { memberId, type, title, message });
        res.json({
            success: true,
            message: "Notification created successfully",
            data: notification,
        });
    }
    static async getAll(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!req.user.gymId) {
            return res.status(400).json({ success: false, message: "Gym ID required" });
        }
        const notifications = await notification_service_1.NotificationService.getAll(req.user.gymId);
        res.json({
            success: true,
            data: notifications,
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
        const notifications = await notification_service_1.NotificationService.getByMember(req.user.gymId, memberId);
        res.json({
            success: true,
            data: notifications,
        });
    }
    static async markSent(req, res) {
        const id = req.params.id;
        const updated = await notification_service_1.NotificationService.markAsSent(id);
        res.json({
            success: true,
            message: "Marked as sent",
            data: updated,
        });
    }
}
exports.NotificationController = NotificationController;
