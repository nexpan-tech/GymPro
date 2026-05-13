"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentById = exports.getPayments = exports.createPayment = void 0;
const paymentService = __importStar(require("./payment.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
exports.createPayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!req.user.gymId) {
        return res.status(400).json({ success: false, message: "Gym ID required" });
    }
    const gymId = req.user.gymId;
    const data = await paymentService.createPayment(gymId, req.body);
    return (0, response_1.successResponse)(res, "Payment recorded successfully", data, 201);
});
exports.getPayments = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!req.user.gymId) {
        return res.status(400).json({ success: false, message: "Gym ID required" });
    }
    const gymId = req.user.gymId;
    const data = await paymentService.getPayments(gymId);
    return (0, response_1.successResponse)(res, "Payments fetched successfully", data, 200);
});
exports.getPaymentById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!req.user.gymId) {
        return res.status(400).json({ success: false, message: "Gym ID required" });
    }
    const gymId = req.user.gymId;
    const id = req.params.id;
    const data = await paymentService.getPaymentById(gymId, id);
    return (0, response_1.successResponse)(res, "Payment details fetched", data, 200);
});
