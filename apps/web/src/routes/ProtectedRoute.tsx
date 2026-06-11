import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { hasRole, getRoleDashboard } from "@/lib/permissions";
import type { UserRole } from "@/types/user.types";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  /** When provided, only users with one of these roles can access the route. */
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps = {}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-(--text-secondary)">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role guard — if allowedRoles is specified, check membership
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(user.role as UserRole, allowedRoles)) {
      return <Navigate to={getRoleDashboard(user.role as UserRole)} replace />;
    }
  }

  return <Outlet />;
}
