import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getAvatar } from "../../utils/avatar";
import { getMyProfile } from "../../api/profileApi";
import { getInitials } from "../../utils/helpers";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  Calendar,
  Megaphone,
  BarChart3,
  Building2,
  FileText,
  UserCircle,
  Clock,
  Briefcase,
  Receipt,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  FolderOpen,
  Sun,
  Moon,
  Award,
  Laptop,
  X,
} from "lucide-react";
import "./Sidebar.css";

const adminMenu = [
  { label: "Dashboard", path: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Employees", path: "/employees", icon: Users },
  { label: "Register Employee", path: "/register-employee", icon: UserPlus },
  { label: "Departments", path: "/departments", icon: Building2 },
  { label: "Attendance Logs", path: "/attendance", icon: CalendarCheck },
  { label: "Leave Approvals", path: "/leave-approvals", icon: ClipboardList },
  { label: "Payroll", path: "/payroll", icon: CreditCard },
  { label: "Holidays", path: "/holidays", icon: Calendar },
  { label: "Announcements", path: "/announcements", icon: Megaphone },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Document Requests", path: "/hr-documents", icon: FileText },
  { label: "Projects & Tasks", path: "/admin-projects", icon: Briefcase },
  { label: "Expenses", path: "/expenses", icon: Receipt },
  { label: "Assets", path: "/assets", icon: Laptop },
  { label: "Performance", path: "/appraisals", icon: Award },
  { label: "HR Scheduler", path: "/meetings", icon: Calendar },
  { label: "Toolbox", path: "/workspace", icon: Award },
  { label: "Profile", path: "/admin-profile", icon: UserCircle },
];

const managerMenu = [
  { label: "Dashboard", path: "/manager-dashboard", icon: LayoutDashboard },
  { label: "My Attendance", path: "/manager-attendance", icon: Clock },
  { label: "My Leave & WFH", path: "/manager-leave", icon: Briefcase },
  { label: "My Payslips", path: "/manager-payslip", icon: Receipt },
  { label: "My Documents", path: "/manager-documents", icon: FolderOpen },
  { divider: true, label: "Team Management" },
  { label: "Team Members", path: "/employees", icon: Users },
  { label: "Projects & Tasks", path: "/manager-projects", icon: Briefcase },
  { label: "Attendance Logs", path: "/attendance", icon: CalendarCheck },
  { label: "Leave Approvals", path: "/leave-approvals", icon: ClipboardList },
  { label: "Expenses", path: "/expenses", icon: Receipt },
  { label: "Assets", path: "/assets", icon: Laptop },
  { label: "Performance", path: "/appraisals", icon: Award },
  { label: "Holidays", path: "/holidays", icon: Calendar },
  { label: "Announcements", path: "/announcements", icon: Megaphone },
  { label: "HR Scheduler", path: "/meetings", icon: Calendar },
  { label: "Toolbox", path: "/workspace", icon: Award },
  { label: "Profile", path: "/admin-profile", icon: UserCircle },
];

const employeeMenu = [
  { label: "Dashboard", path: "/dashboard", icon: Home },
  { label: "Attendance", path: "/employee-attendance", icon: Clock },
  { label: "Leave & WFH", path: "/employee-leave", icon: Briefcase },
  { label: "Payslips", path: "/employee-payslip", icon: Receipt },
  { label: "Documents", path: "/employee-documents", icon: FolderOpen },
  { label: "Projects & Tasks", path: "/employee-projects", icon: Briefcase },
  { label: "Expenses", path: "/expenses", icon: Receipt },
  { label: "Assets", path: "/assets", icon: Laptop },
  { label: "Performance", path: "/appraisals", icon: Award },
  { label: "Holidays", path: "/employee-holidays", icon: Calendar },
  { label: "Notifications", path: "/employee-notifications", icon: Bell },
  { label: "Meetings & Reviews", path: "/meetings", icon: Calendar },
  { label: "Toolbox", path: "/workspace", icon: Award },
  { label: "Profile", path: "/employee-profile", icon: UserCircle },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { role, email, clearSession } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [theme, setTheme] = useState(
    localStorage.getItem("hrms-theme") || "light",
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("hrms-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const menu =
    role === "admin"
      ? adminMenu
      : role === "manager"
        ? managerMenu
        : employeeMenu;
  const roleName =
    role === "admin" ? "Admin" : role === "manager" ? "Manager" : "Employee";
  const initials = getInitials(email?.split("@")[0] || "User");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyProfile();
        if (res.data?.data?.avatar) {
          setAvatarUrl(res.data.data.avatar);
        } else {
          setAvatarUrl(null);
        }
      } catch (err) {
        console.error("Failed to load profile avatar for sidebar:", err);
      }
    };
    load();
    window.addEventListener("hrms-avatar-updated", load);
    return () => window.removeEventListener("hrms-avatar-updated", load);
  }, [role, email]);

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "sidebar--open" : ""}`}>
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <img
            src="/nexora-icon.png"
            alt="Nexora"
            style={{
              width: 26,
              height: 26,
              objectFit: "contain",
              borderRadius: 4,
            }}
          />
        </div>
        {!collapsed && <span className="sidebar__brand-text">Nexora</span>}
        <button
          className="sidebar__toggle"
          onClick={() => {
            if (isMobile) {
              setMobileOpen && setMobileOpen(false);
            } else {
              setCollapsed(!collapsed);
            }
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isMobile ? (
            <X size={18} />
          ) : collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar__nav">
        {menu.map((item, i) =>
          item.divider ? (
            !collapsed && (
              <div key={i} className="sidebar__divider">
                <span>{item.label}</span>
              </div>
            )
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
              }
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen && setMobileOpen(false)}
            >
              <item.icon size={18} className="sidebar__link-icon" />
              {!collapsed && (
                <span className="sidebar__link-label">{item.label}</span>
              )}
            </NavLink>
          ),
        )}
      </nav>

      {/* User footer */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          {!collapsed && (
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{email?.split("@")[0]}</span>
              <span className="sidebar__user-role">{roleName}</span>
            </div>
          )}
        </div>
        <button
          className="sidebar__theme-toggle"
          onClick={toggleTheme}
          title={
            theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"
          }
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          {!collapsed && (
            <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          )}
        </button>
        <button
          className="sidebar__logout"
          onClick={() => {
            setMobileOpen && setMobileOpen(false);
            handleLogout();
          }}
          title="Logout"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
