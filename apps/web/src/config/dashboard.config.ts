// src/config/dashboard.config.ts
export const dashboardConfig = {
  super_admin: {
    title: "Super Admin Dashboard",
    stats: [
      "Total Gyms",
      "Active Subscriptions",
      "Monthly Revenue",
      "Total Members",
    ],
  },

  gym_admin: {
    title: "Gym Admin Dashboard",
    stats: [
      "Total Members",
      "Active Memberships",
      "Today's Attendance",
      "Monthly Revenue",
    ],
  },

  trainer: {
    title: "Trainer Dashboard",
    stats: [
      "Assigned Members",
      "Today's Sessions",
      "Workout Plans",
      "Diet Plans",
    ],
  },
};