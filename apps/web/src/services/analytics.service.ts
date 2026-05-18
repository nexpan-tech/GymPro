import api from "@/lib/axios";
import type { DashboardAnalytics } from "@/types/analytics.types";

export const analyticsService = {
  getDashboardAnalytics: async (): Promise<DashboardAnalytics> => {
    try {
      const res = await api.get("/analytics/dashboard");
      return res.data.data;
    } catch {
      // Mock data fallback for local development
      return {
        stats: [
          { title: "Members", value: 120, change: 5 },
          { title: "Revenue", value: "$3,200", change: 12 },
          { title: "Active Plans", value: 48, change: -2 },
          { title: "Sessions", value: 320, change: 3 },
        ],
        revenue: { labels: ["Jan", "Feb", "Mar"], series: [300, 400, 500] },
        attendance: { labels: ["Mon", "Tue", "Wed"], series: [20, 30, 40] },
        memberships: { labels: ["Basic", "Pro"], series: [30, 70] },
        recentActivity: [
          { id: "1", message: "New member John joined", time: "2h" },
        ],
      } as unknown as DashboardAnalytics;
    }
  },

  getGymAnalytics: async (): Promise<DashboardAnalytics> => {
    const res = await api.get("/analytics/gym");
    return res.data.data;
  },

  getTrainerAnalytics: async (): Promise<DashboardAnalytics> => {
    const res = await api.get("/analytics/trainer");
    return res.data.data;
  },

  getSuperAdminAnalytics: async (): Promise<DashboardAnalytics> => {
    const res = await api.get("/analytics/super-admin");
    return res.data.data;
  },
};