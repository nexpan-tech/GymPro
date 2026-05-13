"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const isDev = process.env.NODE_ENV !== "production";
const format = (level, message, data) => {
    return `[${new Date().toISOString()}] [${level}] ${message} ${data ? JSON.stringify(data) : ""}`;
};
exports.logger = {
    info: (message, data) => {
        console.log(format("INFO", message, data));
    },
    warn: (message, data) => {
        console.warn(format("WARN", message, data));
    },
    error: (message, data) => {
        console.error(format("ERROR", message, data));
    },
    debug: (message, data) => {
        if (isDev) {
            console.log(format("DEBUG", message, data));
        }
    },
};
