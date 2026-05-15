// src/config/sidebar.config.ts
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
} from "lucide-react";

export interface SidebarItem {
  label: string;
  path: string;
  icon: any;
}

export interface SidebarConfig {
  super_admin: SidebarItem[];
  gym_admin: SidebarItem[];
  trainer: SidebarItem[];
}

export const sidebarConfig: SidebarConfig = {
  super_admin: [
    { label: "Dashboard", path: "/super-admin/dashboard", icon: LayoutDashboard },
    { label: "Gyms", path: "/super-admin/gyms", icon: Building2 },
    { label: "Plans", path: "/super-admin/plans", icon: CreditCard },
    { label: "Analytics", path: "/super-admin/analytics", icon: BarChart3 },
    { label: "Billing", path: "/super-admin/billing", icon: FileText },
    { label: "Settings", path: "/super-admin/settings", icon: Settings },
  ],

  gym_admin: [
    { label: "Dashboard", path: "/gym-admin/dashboard", icon: LayoutDashboard },
    { label: "Members", path: "/gym-admin/members", icon: Users },
    { label: "Memberships", path: "/gym-admin/memberships", icon: CreditCard },
    { label: "Attendance", path: "/gym-admin/attendance", icon: CalendarCheck },
    { label: "Payments", path: "/gym-admin/payments", icon: FileText },
    { label: "Trainers", path: "/gym-admin/trainers", icon: Users },
    { label: "Workout Plans", path: "/gym-admin/workout-plans", icon: Dumbbell },
    { label: "Diet Plans", path: "/gym-admin/diet-plans", icon: ClipboardList },
    { label: "Analytics", path: "/gym-admin/analytics", icon: BarChart3 },
    { label: "Notifications", path: "/gym-admin/notifications", icon: Bell },
    { label: "Settings", path: "/gym-admin/settings", icon: Settings },
  ],

  trainer: [
    { label: "Dashboard", path: "/trainer/dashboard", icon: LayoutDashboard },
    { label: "My Members", path: "/trainer/my-members", icon: Users },
    { label: "Attendance", path: "/trainer/attendance", icon: CalendarCheck },
    { label: "Workout Plans", path: "/trainer/workout-plans", icon: Dumbbell },
    { label: "Diet Plans", path: "/trainer/diet-plans", icon: ClipboardList },
    { label: "Progress", path: "/trainer/progress", icon: BarChart3 },
  ],
};