import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MembersPage from "./pages/MembersPage";
import MembershipsPage from "./pages/MembershipsPage";
import AttendancePage from "./pages/AttendancePage";
import DietPlansPage from "./pages/DietPlansPage";
import WorkoutPlansPage from "./pages/WorkoutPlansPage";
import NotificationsPage from "./pages/NotificationsPage";

import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/Layout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route path="/login" element={<LoginPage />} />

        {/* PROTECTED APP SHELL */}
        <Route element={<ProtectedRoute />}>
          
          {/* LAYOUT WRAPPER */}
          <Route element={<Layout />}>

            {/* DASHBOARD */}
            <Route index element={<DashboardPage />} />

            {/* ADMIN / STAFF */}
            <Route path="members" element={<MembersPage />} />
            <Route path="memberships" element={<MembershipsPage />} />

            {/* ATTENDANCE */}
            <Route path="attendance" element={<AttendancePage />} />

            {/* TRAINER */}
            <Route path="diet-plans" element={<DietPlansPage />} />
            <Route path="workout-plans" element={<WorkoutPlansPage />} />

            {/* ALL ROLES */}
            <Route path="notifications" element={<NotificationsPage />} />

          </Route>
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}