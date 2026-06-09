import {
  createBrowserRouter,
  RouterProvider,
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
import GymAdminTrainersPage from "@/pages/gym-admin/TrainersPage";
import GymAdminWorkoutsPage from "@/pages/gym-admin/WorkoutPlansPage";
import GymAdminDietsPage from "@/pages/gym-admin/DietPlansPage";
import GymAdminNotificationsPage from "@/pages/gym-admin/NotificationsPage";
import GymAdminSettingsPage from "@/pages/gym-admin/SettingsPage";

// Trainer
import TrainerDashboardPage from "@/pages/trainer/DashboardPage";
import TrainerMembersPage from "@/pages/trainer/MyMembersPage";
import TrainerAttendancePage from "@/pages/trainer/AttendancePage";
import TrainerWorkoutsPage from "@/pages/trainer/WorkoutPlansPage";
import TrainerDietsPage from "@/pages/trainer/DietPlansPage";
import TrainerProgressPage from "@/pages/trainer/ProgressPage";

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
          { path: "users", element: <GymAdminUsersPage /> },
          { path: "branches", element: <GymAdminBranchesPage /> },
          { path: "members", element: <GymAdminMembersPage /> },
          { path: "members/:id", element: <GymAdminMemberProfilePage /> },
          { path: "memberships", element: <GymAdminMembershipsPage /> },
          { path: "attendance", element: <GymAdminAttendancePage /> },
          { path: "payments", element: <GymAdminPaymentsPage /> },
          { path: "billing", element: <GymAdminBillingPage /> },
          { path: "trainers", element: <GymAdminTrainersPage /> },
          { path: "workout-plans", element: <GymAdminWorkoutsPage /> },
          { path: "diet-plans", element: <GymAdminDietsPage /> },
          { path: "audit", element: <AuditLogsPage /> },
          { path: "notifications", element: <GymAdminNotificationsPage /> },
          { path: "settings", element: <GymAdminSettingsPage /> },
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
