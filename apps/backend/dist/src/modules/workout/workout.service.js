"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWorkoutPlan = exports.getWorkoutPlanByMember = exports.getWorkoutPlans = exports.createWorkoutPlan = void 0;
const db_1 = require("../../config/db");
const createWorkoutPlan = async (gymId, payload) => {
    return db_1.prisma.workoutPlan.create({
        data: {
            gymId,
            memberId: payload.memberId,
            goal: payload.goal,
            monday: payload.monday,
            tuesday: payload.tuesday,
            wednesday: payload.wednesday,
            thursday: payload.thursday,
            friday: payload.friday,
            saturday: payload.saturday,
            sunday: payload.sunday,
            notes: payload.notes,
        },
    });
};
exports.createWorkoutPlan = createWorkoutPlan;
const getWorkoutPlans = async (gymId) => {
    return db_1.prisma.workoutPlan.findMany({
        where: { gymId },
        include: {
            member: {
                include: {
                    user: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getWorkoutPlans = getWorkoutPlans;
const getWorkoutPlanByMember = async (gymId, memberId) => {
    return db_1.prisma.workoutPlan.findFirst({
        where: {
            gymId,
            memberId,
        },
        include: {
            member: {
                include: {
                    user: true,
                },
            },
        },
    });
};
exports.getWorkoutPlanByMember = getWorkoutPlanByMember;
const updateWorkoutPlan = async (gymId, memberId, payload) => {
    return db_1.prisma.workoutPlan.updateMany({
        where: {
            gymId,
            memberId,
        },
        data: payload,
    });
};
exports.updateWorkoutPlan = updateWorkoutPlan;
