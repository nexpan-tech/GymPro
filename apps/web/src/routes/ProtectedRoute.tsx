import { Navigate, Outlet } from "react-router-dom";

type Props = {
  allowedRoles?: string[];
};

export default function ProtectedRoute({ allowedRoles }: Props) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // NOT LOGGED IN
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ROLE CHECK
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // RENDER CHILD ROUTES
  return <Outlet />;
}