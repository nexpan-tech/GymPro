"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
/**
 * Generate JWT Token
 */
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};
exports.generateToken = generateToken;
/**
 * Verify JWT Token
 */
const verifyToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
};
exports.verifyToken = verifyToken;
