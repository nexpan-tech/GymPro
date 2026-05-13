"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = exports.addDays = exports.endOfDay = exports.startOfDay = void 0;
const startOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};
exports.startOfDay = startOfDay;
const endOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};
exports.endOfDay = endOfDay;
const addDays = (days, date = new Date()) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};
exports.addDays = addDays;
const formatDate = (date) => {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
};
exports.formatDate = formatDate;
