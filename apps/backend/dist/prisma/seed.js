"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcryptjs_1.default.hash("Admin@123", 10);
    await prisma.user.upsert({
        where: {
            email: "admin@gympro.com",
        },
        update: {},
        create: {
            name: "Gym Owner",
            email: "admin@gympro.com",
            passwordHash,
            role: client_1.Role.ADMIN,
        },
    });
    console.log("✅ Admin user created");
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
