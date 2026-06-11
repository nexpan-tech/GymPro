import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { hasRole, getRoleDashboard } from "@/lib/permissions";
import type { UserRole } from "@/types/user.types";

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-(--text-primary)">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(user.role, allowedRoles)) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  return <Outlet />;
}