import { lazy, Suspense, type ComponentType } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

// Eager — guards, layouts, and the first-paint pages (landing + login).
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import ProtectedRoute from "@/routes/ProtectedRoute";
import PublicRoute from "@/routes/PublicRoute";
import GymAdminLayout from "@/layouts/GymAdminLayout";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import TrainerLayout from "@/layouts/TrainerLayout";
import MemberLayout from "@/layouts/MemberLayout";

// Lightweight fallback while a route chunk loads.
function PageLoader() {
  return (
    <div className="grid min-h-[60vh] w-full place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--flame) border-t-transparent" aria-label="Loading" />
    </div>
  );
}

// Wrap a lazily-imported page in its own Suspense boundary so each route is a
// separate, on-demand chunk (route-level code splitting).
function el(factory: () => Promise<{ default: ComponentType }>) {
  const C = lazy(factory);
  return (
    <Suspense fallback={<PageLoader />}>
      <C />
    </Suspense>
  );
}

const router = createBrowserRouter([
  // ── Public routes ─────────────────────────────────────────────────────────
  {
    element: <PublicRoute />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: el(() => import("@/pages/auth/RegisterGymPage")) },
      { path: "/register-gym", element: el(() => import("@/pages/auth/RegisterGymPage")) },
      { path: "/forgot-password", element: el(() => import("@/pages/auth/ForgotPasswordPage")) },
    ],
  },

  // ── Super Admin ───────────────────────────────────────────────────────────
  {
    path: "/super-admin",
    element: <ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />,
    children: [
      {
        element: <SuperAdminLayout />,
        children: [
          { index: true, element: el(() => import("@/pages/super-admin/DashboardPage")) },
          { path: "dashboard", element: el(() => import("@/pages/super-admin/DashboardPage")) },
          { path: "analytics", element: el(() => import("@/pages/super-admin/AnalyticsPage")) },
          { path: "gyms", element: el(() => import("@/pages/super-admin/GymsPage")) },
          { path: "plans", element: el(() => import("@/pages/super-admin/PlansPage")) },
          { path: "billing", element: el(() => import("@/pages/super-admin/BillingPage")) },
          { path: "retention", element: el(() => import("@/pages/super-admin/RetentionPage")) },
          { path: "engagement", element: el(() => import("@/pages/super-admin/EngagementPage")) },
          { path: "enterprise", element: el(() => import("@/pages/super-admin/EnterpriseAnalyticsPage")) },
          { path: "metrics", element: el(() => import("@/pages/super-admin/PlatformMetricsPage")) },
          { path: "system", element: el(() => import("@/pages/super-admin/SystemMonitorPage")) },
          { path: "queues", element: el(() => import("@/pages/super-admin/QueueDashboardPage")) },
          { path: "feature-flags", element: el(() => import("@/pages/super-admin/FeatureFlagsPage")) },
          { path: "billing-settings", element: el(() => import("@/pages/super-admin/PlatformBillingSettingsPage")) },
          { path: "audit", element: el(() => import("@/pages/shared/AuditLogsPage")) },
          { path: "settings", element: el(() => import("@/pages/super-admin/SettingsPage")) },
        ],
      },
    ],
  },

  // ── Gym Admin (Admin, Branch Manager, Receptionist) ───────────────────────
  {
    path: "/gym-admin",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN", "GYM_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST"]} />
    ),
    children: [
      {
        element: <GymAdminLayout />,
        children: [
          { index: true, element: el(() => import("@/pages/gym-admin/DashboardPage")) },
          { path: "dashboard", element: el(() => import("@/pages/gym-admin/DashboardPage")) },
          { path: "analytics", element: el(() => import("@/pages/gym-admin/AnalyticsPage")) },
          { path: "admins", element: el(() => import("@/pages/gym-admin/UsersPage")) },
          { path: "users", element: <Navigate to="/gym-admin/admins" replace /> },
          { path: "branches", element: el(() => import("@/pages/gym-admin/BranchesPage")) },
          { path: "members", element: el(() => import("@/pages/gym-admin/MembersPage")) },
          { path: "members/:id", element: el(() => import("@/pages/gym-admin/MemberProfilePage")) },
          { path: "memberships", element: el(() => import("@/pages/gym-admin/MembershipsPage")) },
          { path: "attendance", element: el(() => import("@/pages/gym-admin/AttendancePage")) },
          { path: "payments", element: el(() => import("@/pages/gym-admin/PaymentsPage")) },
          { path: "billing", element: el(() => import("@/pages/gym-admin/BillingPage")) },
          { path: "leads", element: el(() => import("@/pages/gym-admin/LeadsPage")) },
          { path: "retention", element: el(() => import("@/pages/gym-admin/RetentionPage")) },
          { path: "automation", element: el(() => import("@/pages/gym-admin/AutomationPage")) },
          { path: "challenges", element: el(() => import("@/pages/gym-admin/ChallengesPage")) },
          { path: "rewards", element: el(() => import("@/pages/gym-admin/RewardsPage")) },
          { path: "leaderboard", element: el(() => import("@/pages/gym-admin/LeaderboardPage")) },
          { path: "referrals", element: el(() => import("@/pages/gym-admin/ReferralsPage")) },
          { path: "broadcast", element: el(() => import("@/pages/gym-admin/BroadcastPage")) },
          { path: "announcements", element: el(() => import("@/pages/gym-admin/AnnouncementsPage")) },
          { path: "communication-analytics", element: el(() => import("@/pages/gym-admin/CommunicationAnalyticsPage")) },
          { path: "chat", element: el(() => import("@/pages/gym-admin/AdminChatPage")) },
          { path: "ai-insights", element: el(() => import("@/pages/gym-admin/AIInsightsPage")) },
          { path: "reports", element: el(() => import("@/pages/gym-admin/ReportsPage")) },
          { path: "white-label", element: el(() => import("@/pages/gym-admin/WhiteLabelPage")) },
          { path: "trainers", element: el(() => import("@/pages/gym-admin/TrainersPage")) },
          { path: "workout-plans", element: el(() => import("@/pages/gym-admin/WorkoutPlansPage")) },
          { path: "diet-plans", element: el(() => import("@/pages/gym-admin/DietPlansPage")) },
          { path: "notifications", element: el(() => import("@/pages/gym-admin/NotificationsPage")) },
          // P2: Audit log + Settings are SUPER_ADMIN-only now — hidden from gym admin.
          { path: "audit", element: <Navigate to="/gym-admin/dashboard" replace /> },
          { path: "settings", element: <Navigate to="/gym-admin/dashboard" replace /> },
        ],
      },
    ],
  },

  // ── Trainer ───────────────────────────────────────────────────────────────
  {
    path: "/trainer",
    element: <ProtectedRoute allowedRoles={["TRAINER"]} />,
    children: [
      {
        element: <TrainerLayout />,
        children: [
          { index: true, element: el(() => import("@/pages/trainer/DashboardPage")) },
          { path: "dashboard", element: el(() => import("@/pages/trainer/DashboardPage")) },
          { path: "my-members", element: el(() => import("@/pages/trainer/MyMembersPage")) },
          { path: "attendance", element: el(() => import("@/pages/trainer/AttendancePage")) },
          { path: "workout-plans", element: el(() => import("@/pages/trainer/WorkoutPlansPage")) },
          { path: "diet-plans", element: el(() => import("@/pages/trainer/DietPlansPage")) },
          { path: "progress", element: el(() => import("@/pages/trainer/ProgressPage")) },
          { path: "retention", element: el(() => import("@/pages/trainer/RetentionPage")) },
          { path: "engagement", element: el(() => import("@/pages/trainer/EngagementPage")) },
          { path: "chat", element: el(() => import("@/pages/trainer/ChatPage")) },
        ],
      },
    ],
  },

  // ── Member ────────────────────────────────────────────────────────────────
  {
    path: "/member",
    element: <ProtectedRoute allowedRoles={["MEMBER"]} />,
    children: [
      {
        element: <MemberLayout />,
        children: [
          { index: true, element: el(() => import("@/pages/member/DashboardPage")) },
          { path: "experience", element: el(() => import("@/pages/experience/MemberExperiencePage").then((m) => ({ default: m.MemberExperiencePage }))) },
          { path: "dashboard", element: el(() => import("@/pages/member/DashboardPage")) },
          { path: "attendance-history", element: el(() => import("@/pages/member/AttendanceHistoryPage")) },
          { path: "membership-details", element: el(() => import("@/pages/member/MembershipDetailsPage")) },
          { path: "payment-history", element: el(() => import("@/pages/member/PaymentHistoryPage")) },
          { path: "invoices", element: el(() => import("@/pages/member/InvoicesPage")) },
          { path: "workout-plan", element: el(() => import("@/pages/member/WorkoutPlanPage")) },
          { path: "diet-plan", element: el(() => import("@/pages/member/DietPlanPage")) },
          { path: "progress", element: el(() => import("@/pages/member/ProgressPage")) },
          { path: "goals", element: el(() => import("@/pages/member/GoalsPage")) },
          { path: "achievements", element: el(() => import("@/pages/member/AchievementsPage")) },
          { path: "challenges", element: el(() => import("@/pages/member/ChallengesPage")) },
          { path: "leaderboard", element: el(() => import("@/pages/member/LeaderboardPage")) },
          { path: "rewards", element: el(() => import("@/pages/member/RewardsPage")) },
          { path: "announcements", element: el(() => import("@/pages/member/AnnouncementsPage")) },
          { path: "chat", element: el(() => import("@/pages/member/ChatPage")) },
        ],
      },
    ],
  },

  // ── Shared authenticated routes (any logged-in role) ──────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/profile", element: el(() => import("@/pages/shared/ProfilePage")) },
      { path: "/notifications", element: el(() => import("@/pages/shared/NotificationsPage")) },
    ],
  },

  // ── Public legal pages (accessible to everyone) ───────────────────────────
  { path: "/privacy", element: el(() => import("@/pages/marketing/legal").then((m) => ({ default: m.PrivacyPage }))) },
  { path: "/terms", element: el(() => import("@/pages/marketing/legal").then((m) => ({ default: m.TermsPage }))) },

  // ── Fallback ──────────────────────────────────────────────────────────────
  { path: "*", element: el(() => import("@/pages/shared/NotFoundPage")) },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
