// src/config/navigation.ts
// Role-based navigation configuration for GymPro dashboard

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: number;
  group?: string;
}

const SUPER_ADMIN_NAV: NavItem[] = [
  // Platform
  { label: "Dashboard",        path: "/super-admin/dashboard",  icon: "LayoutDashboard", group: "Platform" },
  { label: "Gyms",             path: "/super-admin/gyms",       icon: "Building2",       group: "Platform" },
  { label: "Subscriptions",    path: "/super-admin/plans",      icon: "CreditCard",      group: "Platform" },
  { label: "SaaS Billing",     path: "/super-admin/billing",    icon: "Receipt",         group: "Platform" },

  // Analytics
  { label: "Enterprise Analytics", path: "/super-admin/enterprise", icon: "Building2",   group: "Analytics" },
  { label: "Revenue Analytics", path: "/super-admin/analytics", icon: "TrendingUp",      group: "Analytics" },
  { label: "Retention",         path: "/super-admin/retention", icon: "HeartPulse",      group: "Analytics" },
  { label: "Engagement",        path: "/super-admin/engagement", icon: "Trophy",         group: "Analytics" },
  { label: "Platform Metrics",  path: "/super-admin/metrics",   icon: "BarChart3",       group: "Analytics" },

  // Operations
  { label: "System Monitor",   path: "/super-admin/system",     icon: "Activity",        group: "Operations" },
  { label: "Queue Dashboard",  path: "/super-admin/queues",     icon: "ListTodo",        group: "Operations" },
  { label: "Audit Logs",       path: "/super-admin/audit",      icon: "ScrollText",      group: "Operations" },

  // Config
  { label: "Feature Flags",    path: "/super-admin/feature-flags", icon: "Flag",         group: "Config" },
  { label: "Settings",         path: "/super-admin/settings",   icon: "Settings",        group: "Config" },
];

const ADMIN_NAV: NavItem[] = [
  // Core
  { label: "Dashboard",    path: "/gym-admin/dashboard",    icon: "LayoutDashboard", group: "Core" },
  { label: "Users",        path: "/gym-admin/users",        icon: "UserCheck",       group: "Core" },
  { label: "Members",      path: "/gym-admin/members",      icon: "Users",           group: "Core" },
  { label: "Trainers",     path: "/gym-admin/trainers",     icon: "UserCheck",       group: "Core" },
  { label: "Attendance",   path: "/gym-admin/attendance",   icon: "CalendarCheck",   group: "Core" },
  { label: "Memberships",  path: "/gym-admin/memberships",  icon: "IdCard",          group: "Core" },
  { label: "Payments",     path: "/gym-admin/payments",     icon: "Banknote",        group: "Core" },

  // Growth
  { label: "Analytics",   path: "/gym-admin/analytics",    icon: "BarChart3",       group: "Growth" },
  { label: "Leads CRM",   path: "/gym-admin/leads",        icon: "Funnel",          group: "Growth" },
  { label: "Retention",   path: "/gym-admin/retention",    icon: "HeartPulse",      group: "Growth" },
  { label: "AI Insights", path: "/gym-admin/ai-insights",  icon: "Brain",           group: "Growth" },
  { label: "Automation",  path: "/gym-admin/automation",   icon: "Bot",             group: "Growth" },
  { label: "Campaigns",   path: "/gym-admin/campaigns",    icon: "Megaphone",       group: "Growth" },
  { label: "Reports",     path: "/gym-admin/reports",      icon: "FileText",        group: "Growth" },

  // Communication
  { label: "Notifications", path: "/gym-admin/notifications", icon: "Bell",          group: "Communication" },
  { label: "Broadcast",     path: "/gym-admin/broadcast",     icon: "Megaphone",     group: "Communication" },
  { label: "Announcements", path: "/gym-admin/announcements", icon: "Megaphone",     group: "Communication" },
  { label: "Member Chat",   path: "/gym-admin/chat",          icon: "MessageSquare", group: "Communication" },
  { label: "Comms Analytics", path: "/gym-admin/communication-analytics", icon: "BarChart3", group: "Communication" },
  { label: "Audit Logs",    path: "/gym-admin/audit",         icon: "ScrollText",    group: "Communication" },

  // Engagement
  { label: "Challenges",   path: "/gym-admin/challenges",   icon: "Trophy",          group: "Engagement" },
  { label: "Rewards",      path: "/gym-admin/rewards",      icon: "Gift",            group: "Engagement" },
  { label: "Leaderboard",  path: "/gym-admin/leaderboard",  icon: "Medal",           group: "Engagement" },
  { label: "Referrals",    path: "/gym-admin/referrals",    icon: "Share2",          group: "Engagement" },

  // Multi-branch
  { label: "Branches",    path: "/gym-admin/branches",     icon: "GitBranch",       group: "Multi-branch" },
  { label: "Marketplace", path: "/gym-admin/marketplace",  icon: "ShoppingBag",     group: "Multi-branch" },
  { label: "Billing",     path: "/gym-admin/billing",      icon: "Receipt",         group: "Multi-branch" },

  // Config
  { label: "White Label", path: "/gym-admin/white-label",  icon: "Palette",         group: "Config" },
  { label: "Settings",    path: "/gym-admin/settings",     icon: "Settings",        group: "Config" },
];

const TRAINER_NAV: NavItem[] = [
  { label: "Dashboard",          path: "/trainer/dashboard",     icon: "LayoutDashboard", group: "Core" },
  { label: "My Members",         path: "/trainer/my-members",    icon: "Users",           group: "Core" },
  { label: "Member Risk",        path: "/trainer/retention",     icon: "ShieldAlert",     group: "Core" },
  { label: "Engagement",         path: "/trainer/engagement",    icon: "Trophy",          group: "Core" },
  { label: "Member Chat",        path: "/trainer/chat",          icon: "MessageSquare",   group: "Core" },
  { label: "Workout Plans",      path: "/trainer/workout-plans", icon: "Dumbbell",        group: "Programs" },
  { label: "Diet Plans",         path: "/trainer/diet-plans",    icon: "Salad",           group: "Programs" },
  { label: "Attendance",         path: "/trainer/attendance",    icon: "CalendarCheck",   group: "Tracking" },
  { label: "Progress Tracking",  path: "/trainer/progress",      icon: "TrendingUp",      group: "Tracking" },
  { label: "Progress",           path: "/trainer/progress",      icon: "TrendingUp",      group: "Tracking" },
  { label: "Schedule",           path: "/trainer/schedule",      icon: "CalendarDays",    group: "Schedule" },
  { label: "Notifications",      path: "/trainer/notifications", icon: "Bell",            group: "Schedule" },
];

const MEMBER_NAV: NavItem[] = [
  { label: "Dashboard",    path: "/member/dashboard",           icon: "LayoutDashboard", group: "Overview" },
  { label: "My Workout",   path: "/member/workout-plan",        icon: "Dumbbell",        group: "Fitness" },
  { label: "My Diet",      path: "/member/diet-plan",           icon: "Salad",           group: "Fitness" },
  { label: "Attendance",   path: "/member/attendance-history",  icon: "CalendarCheck",   group: "Fitness" },
  { label: "Progress",     path: "/member/progress",            icon: "TrendingUp",      group: "Fitness" },
  { label: "Goals",        path: "/member/goals",               icon: "Target",          group: "Fitness" },
  { label: "Challenges",   path: "/member/challenges",          icon: "Flame",           group: "Community" },
  { label: "Achievements", path: "/member/achievements",        icon: "Trophy",          group: "Community" },
  { label: "Rewards",      path: "/member/rewards",             icon: "Gift",            group: "Community" },
  { label: "Announcements", path: "/member/announcements",      icon: "Megaphone",       group: "Account" },
  { label: "Chat",         path: "/member/chat",                icon: "MessageSquare",   group: "Account" },
  { label: "Membership",   path: "/member/membership-details",  icon: "IdCard",          group: "Account" },
  { label: "Payments",     path: "/member/payment-history",     icon: "CreditCard",      group: "Account" },
  { label: "Invoices",     path: "/member/invoices",            icon: "Receipt",         group: "Account" },
  { label: "Notifications", path: "/member/notifications",      icon: "Bell",            group: "Account" },
];

/**
 * Returns the navigation items for the given role.
 * Falls back to MEMBER_NAV for unknown roles.
 */
export function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "SUPER_ADMIN":
      return SUPER_ADMIN_NAV;

    case "ADMIN":
    case "GYM_ADMIN":
    case "REGIONAL_MANAGER":
    case "BRANCH_MANAGER":
    case "RECEPTIONIST":
      return ADMIN_NAV;

    case "TRAINER":
      return TRAINER_NAV;

    case "MEMBER":
    default:
      return MEMBER_NAV;
  }
}

/** Returns a human-readable label for a role string. */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPER_ADMIN:      "Super Admin",
    ADMIN:            "Gym Admin",
    GYM_ADMIN:        "Gym Admin",
    REGIONAL_MANAGER: "Regional Manager",
    BRANCH_MANAGER:   "Branch Manager",
    RECEPTIONIST:     "Receptionist",
    TRAINER:          "Trainer",
    MEMBER:           "Member",
  };
  return labels[role] ?? role;
}

/** Returns the role badge color class for Tailwind. */
export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":      return "bg-violet-500/20 text-violet-300 border-violet-500/30";
    case "ADMIN":
    case "GYM_ADMIN":        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
    case "REGIONAL_MANAGER":
    case "BRANCH_MANAGER":   return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "RECEPTIONIST":     return "bg-sky-500/20 text-sky-300 border-sky-500/30";
    case "TRAINER":          return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "MEMBER":           return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    default:                 return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  }
}
