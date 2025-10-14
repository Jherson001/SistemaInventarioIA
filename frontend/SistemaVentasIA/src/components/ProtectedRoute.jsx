import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function ProtectedRoute({ roles }) {
  const { token, user } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0) {
    const has = user?.roles?.some(r => roles.includes(r));
    if (!has) return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
