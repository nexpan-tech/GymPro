// src/config/navigation.ts
// Role-based navigation configuration for GymPro dashboard
import { RELEASE_FLAGS } from "./features";

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: number;
  group?: string;
  /**
   * Optional platform feature-flag key. When the gym has this feature
   * explicitly disabled, the item is hidden from the sidebar (fail-open:
   * unset key or unknown flag = always shown). See useFeatureFlags.
   */
  featureKey?: string;
}

const SUPER_ADMIN_NAV: NavItem[] = [
  // Platform
  { label: "Dashboard",        path: "/super-admin/dashboard",  icon: "LayoutDashboard", group: "Platform" },
  { label: "Gyms",             path: "/super-admin/gyms",       icon: "Building2",       group: "Platform" },
  { label: "Subscriptions",    path: "/super-admin/plans",      icon: "CreditCard",      group: "Platform" },
  { label: "License Management", path: "/super-admin/billing",   icon: "Receipt",         group: "Platform" },

  // Analytics
  { label: "Enterprise Analytics", path: "/super-admin/enterprise", icon: "Building2",   group: "Analytics" },
  // "Revenue Analytics" (/super-admin/analytics) was a duplicate that hit the
  // gym-admin analytics endpoint (403); it now redirects to Enterprise Analytics,
  // so the nav entry is removed to avoid a redirecting link.
  { label: "Retention",         path: "/super-admin/retention", icon: "HeartPulse",      group: "Analytics" },
  { label: "Engagement",        path: "/super-admin/engagement", icon: "Trophy",         group: "Analytics" },
  { label: "Platform Metrics",  path: "/super-admin/metrics",   icon: "BarChart3",       group: "Analytics" },

  // Operations
  { label: "System Monitor",   path: "/super-admin/system",     icon: "Activity",        group: "Operations" },
  { label: "Queue Dashboard",  path: "/super-admin/queues",     icon: "ListTodo",        group: "Operations" },
  { label: "Audit Logs",       path: "/super-admin/audit",      icon: "ScrollText",      group: "Operations" },

  // Config
  { label: "Feature Flags",    path: "/super-admin/feature-flags", icon: "Flag",         group: "Config" },
  { label: "Billing Settings", path: "/super-admin/billing-settings", icon: "Receipt",   group: "Config" },
  // NOTE: a generic "Settings" entry was removed — it was a placeholder with no
  // backend. Real platform config lives in Billing Settings + Feature Flags.
];

const ADMIN_NAV: NavItem[] = [
  // Core
  { label: "Dashboard",    path: "/gym-admin/dashboard",    icon: "LayoutDashboard", group: "Core" },
  { label: "Members",      path: "/gym-admin/members",      icon: "Users",           group: "Core" },
  { label: "Trainers",     path: "/gym-admin/trainers",     icon: "Dumbbell",        group: "Core" },
  { label: "Admins",       path: "/gym-admin/admins",       icon: "UserCheck",       group: "Core" },
  { label: "Attendance",   path: "/gym-admin/attendance",   icon: "CalendarCheck",   group: "Core" },
  { label: "Memberships",  path: "/gym-admin/memberships",  icon: "IdCard",          group: "Core" },
  { label: "Payments",     path: "/gym-admin/payments",     icon: "Banknote",        group: "Core" },

  // Growth
  { label: "Analytics",   path: "/gym-admin/analytics",    icon: "BarChart3",       group: "Growth", featureKey: "analytics" },
  { label: "Reports",     path: "/gym-admin/reports",      icon: "FileText",        group: "Growth", featureKey: "reports" },
  { label: "Leads CRM",   path: "/gym-admin/leads",        icon: "Funnel",          group: "Growth", featureKey: "crm" },
  { label: "Retention",   path: "/gym-admin/retention",    icon: "HeartPulse",      group: "Growth", featureKey: "retention" },
  { label: "AI Insights", path: "/gym-admin/ai-insights",  icon: "Brain",           group: "Growth", featureKey: "ai" },
  { label: "Automation",  path: "/gym-admin/automation",   icon: "Bot",             group: "Growth", featureKey: "automation" },

  // Communication
  { label: "Chat",          path: "/gym-admin/chat",          icon: "MessageSquare", group: "Communication", featureKey: "chat" },
  { label: "Notifications", path: "/gym-admin/notifications", icon: "Bell",          group: "Communication" },
  { label: "Broadcast",     path: "/gym-admin/broadcast",     icon: "Megaphone",     group: "Communication", featureKey: "announcements" },
  { label: "Announcements", path: "/gym-admin/announcements", icon: "Megaphone",     group: "Communication", featureKey: "announcements" },
  { label: "Comms Analytics", path: "/gym-admin/communication-analytics", icon: "BarChart3", group: "Communication", featureKey: "analytics" },

  // Engagement
  { label: "Challenges",   path: "/gym-admin/challenges",   icon: "Trophy",          group: "Engagement", featureKey: "community" },
  { label: "Rewards",      path: "/gym-admin/rewards",      icon: "Gift",            group: "Engagement", featureKey: "gamification" },
  { label: "Leaderboard",  path: "/gym-admin/leaderboard",  icon: "Medal",           group: "Engagement", featureKey: "leaderboard" },
  { label: "Referrals",    path: "/gym-admin/referrals",    icon: "Share2",          group: "Engagement", featureKey: "referral" },

  // Multi-branch
  { label: "Branches",    path: "/gym-admin/branches",     icon: "GitBranch",       group: "Multi-branch" },
  { label: "Billing",     path: "/gym-admin/billing",      icon: "Receipt",         group: "Multi-branch" },

  // Config
  { label: "White Label", path: "/gym-admin/white-label",  icon: "Palette",         group: "Config", featureKey: "white-label" },
  { label: "Support",     path: "/gym-admin/support",      icon: "LifeBuoy",        group: "Config" },
];

const TRAINER_NAV: NavItem[] = [
  { label: "Dashboard",          path: "/trainer/dashboard",     icon: "LayoutDashboard", group: "Core" },
  { label: "My Members",         path: "/trainer/my-members",    icon: "Users",           group: "Core" },
  { label: "Member Risk",        path: "/trainer/retention",     icon: "ShieldAlert",     group: "Core", featureKey: "retention" },
  { label: "Engagement",         path: "/trainer/engagement",    icon: "Trophy",          group: "Core", featureKey: "gamification" },
  { label: "Member Chat",        path: "/trainer/chat",          icon: "MessageSquare",   group: "Core", featureKey: "chat" },
  { label: "Workout Plans",      path: "/trainer/workout-plans", icon: "Dumbbell",        group: "Programs", featureKey: "workout-builder" },
  { label: "Diet Plans",         path: "/trainer/diet-plans",    icon: "Salad",           group: "Programs", featureKey: "diet-builder" },
  { label: "Attendance",         path: "/trainer/attendance",    icon: "CalendarCheck",   group: "Tracking" },
  // Single Member Progress entry (the former duplicate "Progress Tracking"/"Progress"
  // both pointed at /trainer/progress). Schedule + Notifications were removed:
  // no /trainer/schedule route/page exists, and there is no trainer-self
  // notification endpoint yet — hidden until built to avoid broken links.
  { label: "Member Progress",    path: "/trainer/progress",      icon: "TrendingUp",      group: "Tracking" },
];

const MEMBER_NAV: NavItem[] = [
  { label: "Dashboard",    path: "/member/dashboard",           icon: "LayoutDashboard", group: "Overview" },
  { label: "My Workout",   path: "/member/workout-plan",        icon: "Dumbbell",        group: "Fitness" },
  { label: "My Diet",      path: "/member/diet-plan",           icon: "Salad",           group: "Fitness" },
  { label: "Attendance",   path: "/member/attendance-history",  icon: "CalendarCheck",   group: "Fitness" },
  { label: "Progress",     path: "/member/progress",            icon: "TrendingUp",      group: "Fitness", featureKey: "progress" },
  { label: "Goals",        path: "/member/goals",               icon: "Target",          group: "Fitness", featureKey: "goals" },
  { label: "Challenges",   path: "/member/challenges",          icon: "Flame",           group: "Community", featureKey: "community" },
  { label: "Leaderboard",  path: "/member/leaderboard",         icon: "Trophy",          group: "Community", featureKey: "leaderboard" },
  { label: "Achievements", path: "/member/achievements",        icon: "Medal",           group: "Community", featureKey: "gamification" },
  { label: "Rewards",      path: "/member/rewards",             icon: "Gift",            group: "Community", featureKey: "gamification" },
  { label: "Announcements", path: "/member/announcements",      icon: "Megaphone",       group: "Account", featureKey: "announcements" },
  { label: "Chat",         path: "/member/chat",                icon: "MessageSquare",   group: "Account", featureKey: "chat" },
  { label: "Membership",   path: "/member/membership-details",  icon: "IdCard",          group: "Account" },
  { label: "Payments",     path: "/member/payment-history",     icon: "CreditCard",      group: "Account" },
  { label: "Invoices",     path: "/member/invoices",            icon: "Receipt",         group: "Account" },
  { label: "Notifications", path: "/notifications",             icon: "Bell",            group: "Account" },
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
      // Broadcast is hidden this release (RELEASE_FLAGS.broadcast) — drop the
      // nav entry without deleting it.
      return RELEASE_FLAGS.broadcast ? ADMIN_NAV : ADMIN_NAV.filter((i) => i.path !== "/gym-admin/broadcast");

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
    case "SUPER_ADMIN":      return "bg-primary text-white border-primary/40";
    case "ADMIN":
    case "GYM_ADMIN":        return "bg-primary text-white border-primary/40";
    case "REGIONAL_MANAGER":
    case "BRANCH_MANAGER":   return "bg-primary text-white border-primary/40";
    case "RECEPTIONIST":     return "bg-primary text-white border-primary/40";
    case "TRAINER":          return "bg-muted text-muted-foreground border-border";
    case "MEMBER":           return "bg-muted text-muted-foreground border-border";
    default:                 return "bg-muted text-muted-foreground border-border";
  }
}
