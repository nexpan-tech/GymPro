"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const error_middleware_1 = require("./middleware/error.middleware");
// Routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./modules/user/user.routes"));
const gym_routes_1 = __importDefault(require("./modules/gym/gym.routes"));
const member_routes_1 = __importDefault(require("./modules/member/member.routes"));
const membership_routes_1 = __importDefault(require("./modules/membership/membership.routes"));
const attendance_routes_1 = __importDefault(require("./modules/attendance/attendance.routes"));
const diet_routes_1 = __importDefault(require("./modules/diet/diet.routes"));
const workout_routes_1 = __importDefault(require("./modules/workout/workout.routes"));
const notification_routes_1 = __importDefault(require("./modules/notification/notification.routes"));
const payment_routes_1 = __importDefault(require("./modules/payment/payment.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const app = (0, express_1.default)();
/**
 * ----------------------------
 * GLOBAL MIDDLEWARES
 * ----------------------------
 */
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use((0, morgan_1.default)("dev"));
/**
 * ----------------------------
 * HEALTH CHECK
 * ----------------------------
 */
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "OK",
        service: "GymPro API",
        timestamp: new Date().toISOString(),
    });
});
/**
 * ----------------------------
 * API ROUTES
 * ----------------------------
 */
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/gyms", gym_routes_1.default);
app.use("/api/members", member_routes_1.default);
app.use("/api/memberships", membership_routes_1.default);
app.use("/api/attendance", attendance_routes_1.default);
app.use("/api/diet-plans", diet_routes_1.default);
app.use("/api/workout-plans", workout_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/payments", payment_routes_1.default);
app.use("/api/analytics", analytics_routes_1.default);
/**
 * ----------------------------
 * ERROR HANDLER (LAST)
 * ----------------------------
 */
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
