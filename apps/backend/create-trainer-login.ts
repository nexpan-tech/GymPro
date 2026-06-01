import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "trainer@titan.com";
  const passwordHash = await bcrypt.hash("Trainer@123", 10);

  const admin = await prisma.user.findUnique({
    where: { email: "admin@titan.com" },
  });

  if (!admin?.gymId) {
    throw new Error("Admin gymId not found");
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Test Trainer",
      passwordHash,
      role: Role.TRAINER,
      isActive: true,
      gymId: admin.gymId,
      branchId: admin.branchId,
    },
    create: {
      name: "Test Trainer",
      email,
      passwordHash,
      role: Role.TRAINER,
      isActive: true,
      gymId: admin.gymId,
      branchId: admin.branchId,
    },
  });

  console.log("Trainer login ready:");
  console.log("Email:", email);
  console.log("Password: Trainer@123");
  console.log("User ID:", user.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
