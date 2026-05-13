"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const auth_validation_1 = require("./auth.validation");
class AuthController {
    static async register(req, res) {
        const data = auth_validation_1.registerSchema.parse(req.body);
        const result = await auth_service_1.AuthService.register(data);
        res.json({
            success: true,
            message: "User registered successfully",
            data: result,
        });
    }
    static async login(req, res) {
        const data = auth_validation_1.loginSchema.parse(req.body);
        const result = await auth_service_1.AuthService.login(data);
        res.json({
            success: true,
            message: "Login successful",
            data: result,
        });
    }
    static async me(req, res) {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const user = await auth_service_1.AuthService.me(req.user.id);
        res.json({
            success: true,
            data: user,
        });
    }
}
exports.AuthController = AuthController;
