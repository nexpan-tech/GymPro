import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { hasRole } from "@/lib/permissions";
import type { UserRole } from "@/types/user.types";

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export default function RoleRoute({
  allowedRoles,
}: RoleRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user || !hasRole(user.role, allowedRoles)) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}