import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function PublicRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (isAuthenticated && user) {
    switch (user.role) {
      case "SUPER_ADMIN":
        return (
          <Navigate to="/super-admin/dashboard" replace />
        );
      case "GYM_ADMIN":
        return (
          <Navigate to="/gym-admin/dashboard" replace />
        );
      case "TRAINER":
        return <Navigate to="/trainer/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}