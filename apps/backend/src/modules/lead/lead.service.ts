import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

export class LeadService {
  static async create(user: AuthUser, data: any) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    return prisma.lead.create({
      data: {
        gymId: user.gymId,
        assignedToId: data.assignedToId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        source: data.source,
        status: data.status || "NEW",
        fitnessGoal: data.fitnessGoal,
        notes: data.notes,
        trialDate: data.trialDate
          ? new Date(data.trialDate)
          : undefined,
        followUpDate: data.followUpDate
          ? new Date(data.followUpDate)
          : undefined,
      },
      include: {
        assignedTo: true,
      },
    });
  }

  static async getAll(user: AuthUser) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    return prisma.lead.findMany({
      where: {
        gymId: user.gymId,
      },
      include: {
        assignedTo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getById(user: AuthUser, id: string) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        gymId: user.gymId,
      },
      include: {
        assignedTo: true,
      },
    });

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    return lead;
  }

  static async update(user: AuthUser, id: string, data: any) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        gymId: user.gymId,
      },
    });

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    return prisma.lead.update({
      where: {
        id,
      },
      data: {
        assignedToId: data.assignedToId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        source: data.source,
        status: data.status,
        fitnessGoal: data.fitnessGoal,
        notes: data.notes,
        trialDate: data.trialDate
          ? new Date(data.trialDate)
          : undefined,
        followUpDate: data.followUpDate
          ? new Date(data.followUpDate)
          : undefined,
        convertedAt: data.convertedAt
          ? new Date(data.convertedAt)
          : undefined,
        lostReason: data.lostReason,
        leadScore: data.leadScore,
      },
      include: {
        assignedTo: true,
      },
    });
  }

  static async remove(user: AuthUser, id: string) {
    if (!user.gymId) {
      throw new AppError("Gym context missing", 403);
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        gymId: user.gymId,
      },
    });

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    await prisma.lead.delete({
      where: {
        id,
      },
    });

    return { id };
  }

  static async getFunnelAnalytics(user: AuthUser) {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  const leads = await prisma.lead.findMany({
    where: {
      gymId: user.gymId,
    },
  });

  const funnel = {
    NEW: 0,
    CONTACTED: 0,
    TRIAL_BOOKED: 0,
    TRIAL_COMPLETED: 0,
    NEGOTIATION: 0,
    CONVERTED: 0,
    LOST: 0,
  };

  leads.forEach((lead) => {
    funnel[lead.status]++;
  });

  const totalLeads = leads.length;
  const converted = funnel.CONVERTED;
  const lost = funnel.LOST;

  const conversionRate =
    totalLeads > 0
      ? Number(((converted / totalLeads) * 100).toFixed(2))
      : 0;

  const lossRate =
    totalLeads > 0
      ? Number(((lost / totalLeads) * 100).toFixed(2))
      : 0;

  const scoredLeads = leads.map((lead) => {
    let score = 0;

    if (lead.status === "CONTACTED") score += 20;
    if (lead.status === "TRIAL_BOOKED") score += 50;
    if (lead.status === "TRIAL_COMPLETED") score += 70;
    if (lead.status === "NEGOTIATION") score += 85;
    if (lead.status === "CONVERTED") score += 100;

    if (lead.source === "REFERRAL") score += 15;
    if (lead.source === "INSTAGRAM") score += 10;

    return {
      id: lead.id,
      name: lead.name,
      status: lead.status,
      source: lead.source,
      leadScore: score,
    };
  });

  return {
    totalLeads,
    conversionRate,
    lossRate,
    funnel,
    scoredLeads,
  };
}

static async processFollowUps(user: AuthUser) {
  if (!user.gymId) {
    throw new AppError("Gym context missing", 403);
  }

  const now = new Date();

  const dueLeads = await prisma.lead.findMany({
    where: {
      gymId: user.gymId,
      followUpDate: {
        lte: now,
      },
      status: {
        notIn: ["CONVERTED", "LOST"],
      },
    },
  });

  const created = [];

  for (const lead of dueLeads) {
    const notification = await prisma.notification.create({
      data: {
        gymId: user.gymId,
        type: "GENERAL",
        title: "Lead follow-up due",
        message: `Follow up with ${lead.name} (${lead.phone}). Status: ${lead.status}`,
      },
    });

    created.push(notification);
  }

  return {
    scannedLeads: dueLeads.length,
    createdNotifications: created.length,
    notifications: created,
  };
}
}