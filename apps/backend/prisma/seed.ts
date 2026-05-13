import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@gympro.com",
    },
    update: {},
    create: {
      name: "Gym Owner",
      email: "admin@gympro.com",
      passwordHash,
      role: Role.ADMIN,
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