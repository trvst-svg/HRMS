import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to the correct dashboard instead of showing a forbidden page
    if (role === "admin") return <Navigate to="/admin-dashboard" replace />;
    if (role === "manager") return <Navigate to="/manager-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
