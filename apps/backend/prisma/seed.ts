import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  await prisma.user.upsert({
    where: {
      email: "superadmin@gympro.com",
    },
    update: {
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      name: "Super Admin",
      email: "superadmin@gympro.com",
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
      gymId: null,
    },
  });

  console.log("✅ SUPER_ADMIN user created");
  console.log("Email: superadmin@gympro.com");
  console.log("Password: Admin@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });