import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterGymPage from "@/pages/auth/RegisterGymPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ProtectedRoute from "@/routes/ProtectedRoute";
import PublicRoute from "@/routes/PublicRoute";
import GymAdminLayout from "@/layouts/GymAdminLayout";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import TrainerLayout from "@/layouts/TrainerLayout";

// Shared
import ProfilePage from "@/pages/shared/ProfilePage";
import NotificationsPage from "@/pages/shared/NotificationsPage";
import NotFoundPage from "@/pages/shared/NotFoundPage";
import AuditLogsPage from "@/pages/shared/AuditLogsPage";

// Super Admin
import SuperAdminDashboardPage from "@/pages/super-admin/DashboardPage";
import SuperAdminAnalyticsPage from "@/pages/super-admin/AnalyticsPage";
import SuperAdminGymsPage from "@/pages/super-admin/GymsPage";
import SuperAdminPlansPage from "@/pages/super-admin/PlansPage";
import SuperAdminBillingPage from "@/pages/super-admin/BillingPage";
import SuperAdminRetentionPage from "@/pages/super-admin/RetentionPage";
import SuperAdminEngagementPage from "@/pages/super-admin/EngagementPage";
import SuperAdminEnterpriseAnalyticsPage from "@/pages/super-admin/EnterpriseAnalyticsPage";
import SuperAdminFeatureFlagsPage from "@/pages/super-admin/FeatureFlagsPage";
import SuperAdminMetricsPage from "@/pages/super-admin/PlatformMetricsPage";
import SuperAdminSystemMonitorPage from "@/pages/super-admin/SystemMonitorPage";
import SuperAdminQueueDashboardPage from "@/pages/super-admin/QueueDashboardPage";
import SuperAdminBillingSettingsPage from "@/pages/super-admin/PlatformBillingSettingsPage";
import SuperAdminSettingsPage from "@/pages/super-admin/SettingsPage";

// Gym Admin
import GymAdminDashboardPage from "@/pages/gym-admin/DashboardPage";
import GymAdminAnalyticsPage from "@/pages/gym-admin/AnalyticsPage";
import GymAdminUsersPage from "@/pages/gym-admin/UsersPage";
import GymAdminBranchesPage from "@/pages/gym-admin/BranchesPage";
import GymAdminMembersPage from "@/pages/gym-admin/MembersPage";
import GymAdminMemberProfilePage from "@/pages/gym-admin/MemberProfilePage";
import GymAdminMembershipsPage from "@/pages/gym-admin/MembershipsPage";
import GymAdminAttendancePage from "@/pages/gym-admin/AttendancePage";
import GymAdminPaymentsPage from "@/pages/gym-admin/PaymentsPage";
import GymAdminBillingPage from "@/pages/gym-admin/BillingPage";
import MemberInvoicesPage from "@/pages/member/InvoicesPage";
import GymAdminLeadsPage from "@/pages/gym-admin/LeadsPage";
import GymAdminRetentionPage from "@/pages/gym-admin/RetentionPage";
import GymAdminAutomationPage from "@/pages/gym-admin/AutomationPage";
import GymAdminChallengesPage from "@/pages/gym-admin/ChallengesPage";
import GymAdminRewardsPage from "@/pages/gym-admin/RewardsPage";
import GymAdminLeaderboardPage from "@/pages/gym-admin/LeaderboardPage";
import GymAdminReferralsPage from "@/pages/gym-admin/ReferralsPage";
import GymAdminTrainersPage from "@/pages/gym-admin/TrainersPage";
import GymAdminWorkoutsPage from "@/pages/gym-admin/WorkoutPlansPage";
import GymAdminDietsPage from "@/pages/gym-admin/DietPlansPage";
import GymAdminNotificationsPage from "@/pages/gym-admin/NotificationsPage";
import GymAdminBroadcastPage from "@/pages/gym-admin/BroadcastPage";
import GymAdminAnnouncementsPage from "@/pages/gym-admin/AnnouncementsPage";
import GymAdminCommunicationAnalyticsPage from "@/pages/gym-admin/CommunicationAnalyticsPage";
import ChatThreadsPage from "@/pages/shared/ChatThreadsPage";
import GymAdminAIInsightsPage from "@/pages/gym-admin/AIInsightsPage";
import GymAdminWhiteLabelPage from "@/pages/gym-admin/WhiteLabelPage";
import GymAdminChatPage from "@/pages/gym-admin/AdminChatPage";
import GymAdminReportsPage from "@/pages/gym-admin/ReportsPage";

// Trainer
import TrainerDashboardPage from "@/pages/trainer/DashboardPage";
import TrainerMembersPage from "@/pages/trainer/MyMembersPage";
import TrainerAttendancePage from "@/pages/trainer/AttendancePage";
import TrainerWorkoutsPage from "@/pages/trainer/WorkoutPlansPage";
import TrainerDietsPage from "@/pages/trainer/DietPlansPage";
import TrainerProgressPage from "@/pages/trainer/ProgressPage";
import TrainerRetentionPage from "@/pages/trainer/RetentionPage";
import TrainerEngagementPage from "@/pages/trainer/EngagementPage";
import TrainerChatPage from "@/pages/trainer/ChatPage";

// Member
import MemberLayout from "@/layouts/MemberLayout";
import { MemberExperiencePage } from "@/pages/experience/MemberExperiencePage";
import MemberDashboardPage from "@/pages/member/DashboardPage";
import AttendanceHistoryPage from "@/pages/member/AttendanceHistoryPage";
import MembershipDetailsPage from "@/pages/member/MembershipDetailsPage";
import PaymentHistoryPage from "@/pages/member/PaymentHistoryPage";
import WorkoutPlanPage from "@/pages/member/WorkoutPlanPage";
import DietPlanPage from "@/pages/member/DietPlanPage";
import ProgressPage from "@/pages/member/ProgressPage";
import MemberAchievementsPage from "@/pages/member/AchievementsPage";
import MemberChallengesPage from "@/pages/member/ChallengesPage";
import MemberRewardsPage from "@/pages/member/RewardsPage";
import MemberAnnouncementsPage from "@/pages/member/AnnouncementsPage";
import MemberChatPage from "@/pages/member/ChatPage";
import MemberLeaderboardPage from "@/pages/member/LeaderboardPage";
import MemberGoalsPage from "@/pages/member/GoalsPage";

const router = createBrowserRouter([
  // ── Public routes (redirect to dashboard when already authenticated) ──────
  {
    element: <PublicRoute />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterGymPage /> },
      { path: "/register-gym", element: <RegisterGymPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
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
          { index: true, element: <SuperAdminDashboardPage /> },
          { path: "dashboard", element: <SuperAdminDashboardPage /> },
          { path: "analytics", element: <SuperAdminAnalyticsPage /> },
          { path: "gyms", element: <SuperAdminGymsPage /> },
          { path: "plans", element: <SuperAdminPlansPage /> },
          { path: "billing", element: <SuperAdminBillingPage /> },
          { path: "retention", element: <SuperAdminRetentionPage /> },
          { path: "engagement", element: <SuperAdminEngagementPage /> },
          { path: "enterprise", element: <SuperAdminEnterpriseAnalyticsPage /> },
          { path: "metrics", element: <SuperAdminMetricsPage /> },
          { path: "system", element: <SuperAdminSystemMonitorPage /> },
          { path: "queues", element: <SuperAdminQueueDashboardPage /> },
          { path: "feature-flags", element: <SuperAdminFeatureFlagsPage /> },
          { path: "billing-settings", element: <SuperAdminBillingSettingsPage /> },
          { path: "audit", element: <AuditLogsPage /> },
          { path: "settings", element: <SuperAdminSettingsPage /> },
        ],
      },
    ],
  },

  // ── Gym Admin (Admin, Branch Manager, Receptionist) ───────────────────────
  {
    path: "/gym-admin",
    element: (
      <ProtectedRoute
        allowedRoles={["ADMIN", "GYM_ADMIN", "BRANCH_MANAGER", "RECEPTIONIST"]}
      />
    ),
    children: [
      {
        element: <GymAdminLayout />,
        children: [
          { index: true, element: <GymAdminDashboardPage /> },
          { path: "dashboard", element: <GymAdminDashboardPage /> },
          { path: "analytics", element: <GymAdminAnalyticsPage /> },
          { path: "admins", element: <GymAdminUsersPage /> },
          { path: "users", element: <Navigate to="/gym-admin/admins" replace /> },
          { path: "branches", element: <GymAdminBranchesPage /> },
          { path: "members", element: <GymAdminMembersPage /> },
          { path: "members/:id", element: <GymAdminMemberProfilePage /> },
          { path: "memberships", element: <GymAdminMembershipsPage /> },
          { path: "attendance", element: <GymAdminAttendancePage /> },
          { path: "payments", element: <GymAdminPaymentsPage /> },
          { path: "billing", element: <GymAdminBillingPage /> },
          { path: "leads", element: <GymAdminLeadsPage /> },
          { path: "retention", element: <GymAdminRetentionPage /> },
          { path: "automation", element: <GymAdminAutomationPage /> },
          { path: "challenges", element: <GymAdminChallengesPage /> },
          { path: "rewards", element: <GymAdminRewardsPage /> },
          { path: "leaderboard", element: <GymAdminLeaderboardPage /> },
          { path: "referrals", element: <GymAdminReferralsPage /> },
          { path: "broadcast", element: <GymAdminBroadcastPage /> },
          { path: "announcements", element: <GymAdminAnnouncementsPage /> },
          { path: "communication-analytics", element: <GymAdminCommunicationAnalyticsPage /> },
          { path: "chat", element: <GymAdminChatPage /> },
          { path: "ai-insights", element: <GymAdminAIInsightsPage /> },
          { path: "reports", element: <GymAdminReportsPage /> },
          { path: "white-label", element: <GymAdminWhiteLabelPage /> },
          { path: "trainers", element: <GymAdminTrainersPage /> },
          { path: "workout-plans", element: <GymAdminWorkoutsPage /> },
          { path: "diet-plans", element: <GymAdminDietsPage /> },
          { path: "notifications", element: <GymAdminNotificationsPage /> },
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
          { index: true, element: <TrainerDashboardPage /> },
          { path: "dashboard", element: <TrainerDashboardPage /> },
          { path: "my-members", element: <TrainerMembersPage /> },
          { path: "attendance", element: <TrainerAttendancePage /> },
          { path: "workout-plans", element: <TrainerWorkoutsPage /> },
          { path: "diet-plans", element: <TrainerDietsPage /> },
          { path: "progress", element: <TrainerProgressPage /> },
          { path: "retention", element: <TrainerRetentionPage /> },
          { path: "engagement", element: <TrainerEngagementPage /> },
          { path: "chat", element: <TrainerChatPage /> },
          { path: "chat", element: <ChatThreadsPage /> },
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
          { index: true, element: <MemberDashboardPage /> },
          { path: "experience", element: <MemberExperiencePage /> },
          { path: "dashboard", element: <MemberDashboardPage /> },
          { path: "attendance-history", element: <AttendanceHistoryPage /> },
          { path: "membership-details", element: <MembershipDetailsPage /> },
          { path: "payment-history", element: <PaymentHistoryPage /> },
          { path: "invoices", element: <MemberInvoicesPage /> },
          { path: "workout-plan", element: <WorkoutPlanPage /> },
          { path: "diet-plan", element: <DietPlanPage /> },
          { path: "progress", element: <ProgressPage /> },
          { path: "goals", element: <MemberGoalsPage /> },
          { path: "achievements", element: <MemberAchievementsPage /> },
          { path: "challenges", element: <MemberChallengesPage /> },
          { path: "leaderboard", element: <MemberLeaderboardPage /> },
          { path: "rewards", element: <MemberRewardsPage /> },
          { path: "announcements", element: <MemberAnnouncementsPage /> },
          { path: "chat", element: <MemberChatPage /> },
        ],
      },
    ],
  },

  // ── Shared authenticated routes (any logged-in role) ──────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/profile", element: <ProfilePage /> },
      { path: "/notifications", element: <NotificationsPage /> },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  { path: "*", element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
