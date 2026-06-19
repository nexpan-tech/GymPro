import { Navigate } from "react-router-dom";

/**
 * Super-admin "Revenue Analytics" consolidates into Enterprise Analytics, which
 * is backed by SUPER_ADMIN-scoped endpoints (enterpriseService.overview).
 *
 * The previous debug stub here called the gym-admin `/analytics/dashboard`
 * endpoint, which is restricted to ADMIN/RECEPTIONIST/TRAINER and returned 403
 * for a super admin. Redirecting avoids that cross-role call entirely.
 */
export default function AnalyticsPage() {
  return <Navigate to="/super-admin/enterprise" replace />;
}
