import cron from "node-cron";
import { prisma } from "../config/db";

export function startReportSchedulers() {
  cron.schedule("0 9 * * *", async () => {
    console.log("📊 Running daily analytics report scheduler");

    const gyms = await prisma.gym.findMany();

    for (const gym of gyms) {
      const memberCount = await prisma.member.count({
        where: { gymId: gym.id },
      });

      const revenue = await prisma.payment.aggregate({
        where: {
          gymId: gym.id,
          status: "PAID",
        },
        _sum: {
          amount: true,
        },
      });

      console.log(`
==============================
GYM REPORT
Gym: ${gym.name}
Members: ${memberCount}
Revenue: ${revenue._sum.amount || 0}
Generated: ${new Date().toISOString()}
==============================
`);
    }
  });

  cron.schedule("0 10 * * 1", async () => {
    console.log("📈 Running weekly churn analysis");

    const members = await prisma.member.findMany({
      include: {
        user: true,
        attendances: {
          orderBy: {
            date: "desc",
          },
          take: 1,
        },
      },
    });

    const today = new Date();

    const riskyMembers = members.filter((member) => {
      const lastAttendance = member.attendances[0];

      if (!lastAttendance) return true;

      const daysInactive = Math.floor(
        (today.getTime() - lastAttendance.date.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return daysInactive >= 14;
    });

    console.log(`
==============================
CHURN RISK REPORT
High Risk Members: ${riskyMembers.length}
Generated: ${new Date().toISOString()}
==============================
`);
  });

  console.log("✅ Report schedulers initialized");
}