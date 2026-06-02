import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Settings,
  Users,
  Building2,
  ClipboardList,
  Bell,
  FileText,
  UserCheck,
  TrendingUp,
  ScrollText,
  MapPin,
} from "lucide-react";

export interface SidebarItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface SidebarConfig {
  super_admin: SidebarItem[];
  gym_admin: SidebarItem[];
  trainer: SidebarItem[];
  member: SidebarItem[];
}

export const sidebarConfig: SidebarConfig = {
  super_admin: [
    { label: "Dashboard", path: "/super-admin/dashboard", icon: LayoutDashboard },
    { label: "Gyms", path: "/super-admin/gyms", icon: Building2 },
    { label: "Plans", path: "/super-admin/plans", icon: CreditCard },
    { label: "Analytics", path: "/super-admin/analytics", icon: BarChart3 },
    { label: "Billing", path: "/super-admin/billing", icon: FileText },
    { label: "Audit Logs", path: "/super-admin/audit", icon: ScrollText },
    { label: "Settings", path: "/super-admin/settings", icon: Settings },
  ],

  gym_admin: [
    { label: "Dashboard", path: "/gym-admin/dashboard", icon: LayoutDashboard },
    { label: "Users", path: "/gym-admin/users", icon: UserCheck },
    { label: "Branches", path: "/gym-admin/branches", icon: MapPin },
    { label: "Members", path: "/gym-admin/members", icon: Users },
    { label: "Memberships", path: "/gym-admin/memberships", icon: CreditCard },
    { label: "Attendance", path: "/gym-admin/attendance", icon: CalendarCheck },
    { label: "Payments", path: "/gym-admin/payments", icon: FileText },
    { label: "Trainers", path: "/gym-admin/trainers", icon: UserCheck },
    { label: "Workout Plans", path: "/gym-admin/workout-plans", icon: Dumbbell },
    { label: "Diet Plans", path: "/gym-admin/diet-plans", icon: ClipboardList },
    { label: "Analytics", path: "/gym-admin/analytics", icon: BarChart3 },
    { label: "Audit Logs", path: "/gym-admin/audit", icon: ScrollText },
    { label: "Notifications", path: "/gym-admin/notifications", icon: Bell },
    { label: "Settings", path: "/gym-admin/settings", icon: Settings },
  ],

  trainer: [
    { label: "Dashboard", path: "/trainer/dashboard", icon: LayoutDashboard },
    { label: "My Members", path: "/trainer/my-members", icon: Users },
    { label: "Attendance", path: "/trainer/attendance", icon: CalendarCheck },
    { label: "Workout Plans", path: "/trainer/workout-plans", icon: Dumbbell },
    { label: "Diet Plans", path: "/trainer/diet-plans", icon: ClipboardList },
    { label: "Progress", path: "/trainer/progress", icon: TrendingUp },
  ],

  member: [
    { label: "Dashboard", path: "/member/dashboard", icon: LayoutDashboard },
    { label: "Attendance", path: "/member/attendance-history", icon: CalendarCheck },
    { label: "Membership", path: "/member/membership-details", icon: CreditCard },
    { label: "Payments", path: "/member/payment-history", icon: FileText },
    { label: "Workout", path: "/member/workout-plan", icon: Dumbbell },
    { label: "Diet", path: "/member/diet-plan", icon: ClipboardList },
    { label: "Progress", path: "/member/progress", icon: TrendingUp },
  ],
};