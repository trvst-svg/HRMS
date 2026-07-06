import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  if (!token) return false;
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return payload.exp > Math.floor(Date.now() / 1000);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem("token"));
  const [role, setRole] = useState(() => sessionStorage.getItem("role"));
  const [email, setEmail] = useState(() => sessionStorage.getItem("email"));
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    isTokenValid(sessionStorage.getItem("token")),
  );

  // Check token validity on mount and periodically
  useEffect(() => {
    const check = () => {
      const t = sessionStorage.getItem("token");
      if (t && !isTokenValid(t)) {
        clearSession();
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const saveSession = useCallback((newToken, newRole, newEmail) => {
    sessionStorage.setItem("token", newToken);
    sessionStorage.setItem("role", newRole);
    sessionStorage.setItem("email", newEmail);
    setToken(newToken);
    setRole(newRole);
    setEmail(newEmail);
    setIsAuthenticated(true);
  }, []);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("email");
    setToken(null);
    setRole(null);
    setEmail(null);
    setIsAuthenticated(false);
  }, []);

  const getDashboardPath = useCallback(
    (userRole) => {
      const r = userRole || role;
      if (r === "admin") return "/admin-dashboard";
      const isManager = r === "manager" || r === "project_manager" || r === "department_head";
      if (isManager) return "/manager-dashboard";
      return "/dashboard";
    },
    [role],
  );

  const value = {
    token,
    role,
    email,
    isAuthenticated,
    saveSession,
    clearSession,
    getDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
