"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleMiddleware = void 0;
/**
 * Role-based access control
 */
const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    message: "Access denied: insufficient permissions",
                });
            }
            next();
        }
        catch (error) {
            return res.status(500).json({ message: "Role middleware error" });
        }
    };
};
exports.roleMiddleware = roleMiddleware;
