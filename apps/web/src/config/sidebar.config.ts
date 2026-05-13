export type Role = "ADMIN" | "RECEPTIONIST" | "TRAINER" | "MEMBER";

export type SidebarItem = {
  label: string;
  path: string;
  icon: string;
  allowedRoles: Role[];
};

export const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: "grid",
    allowedRoles: ["ADMIN", "RECEPTIONIST", "TRAINER", "MEMBER"],
  },
  {
    label: "Members",
    path: "/members",
    icon: "users",
    allowedRoles: ["ADMIN", "RECEPTIONIST"],
  },
  {
    label: "Memberships",
    path: "/memberships",
    icon: "credit-card",
    allowedRoles: ["ADMIN", "RECEPTIONIST"],
  },
  {
    label: "Attendance",
    path: "/attendance",
    icon: "calendar",
    allowedRoles: ["ADMIN", "RECEPTIONIST", "TRAINER"],
  },
  {
    label: "Diet Plans",
    path: "/diet-plans",
    icon: "apple",
    allowedRoles: ["ADMIN", "TRAINER"],
  },
  {
    label: "Workout Plans",
    path: "/workout-plans",
    icon: "activity",
    allowedRoles: ["ADMIN", "TRAINER"],
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: "bell",
    allowedRoles: ["ADMIN", "RECEPTIONIST", "TRAINER", "MEMBER"],
  },
];