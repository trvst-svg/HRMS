import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  let userRole = role;
  if (role === "project_manager" || role === "department_head") {
    userRole = "manager";
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to the correct dashboard instead of showing a forbidden page
    if (role === "admin") return <Navigate to="/admin-dashboard" replace />;
    if (role === "manager" || role === "project_manager" || role === "department_head") {
      return <Navigate to="/manager-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
