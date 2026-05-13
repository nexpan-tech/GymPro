"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gymMiddleware = void 0;
/**
 * Ensures gym context is always valid
 */
const gymMiddleware = (req, res, next) => {
    try {
        if (!req.user?.gymId) {
            return res.status(403).json({ message: "Gym context missing" });
        }
        // attach for easy access
        req.headers["x-gym-id"] = req.user.gymId;
        next();
    }
    catch (error) {
        return res.status(500).json({ message: "Gym middleware error" });
    }
};
exports.gymMiddleware = gymMiddleware;
