import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployeeDashboardSummary } from "../../api/dashboardApi";
import { useAuth } from "../../hooks/useAuth";
import { getAvatar } from "../../utils/avatar";
import StatCard from "../../components/ui/StatCard";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { PageLoader } from "../../components/ui/Spinner";
import {
  Calendar,
  CalendarCheck,
  Clock,
  Briefcase,
  Receipt,
  FileText,
  Bell,
  UserCircle,
  FolderOpen,
} from "lucide-react";
import { formatDate } from "../../utils/helpers";
import "../admin/DashboardPage.css";

export default function DashboardPage() {
  const { email } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await getEmployeeDashboardSummary();
      setData(res.data.data || res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const id = setInterval(load, 30000);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", load);
    };
  }, []);

  if (loading && !data) return <PageLoader />;
  const s = data?.stats || {};
  const att = data?.todayAttendance || {};
  const profile = data?.userProfile || {};

  const quickActions = [
    { label: "Attendance", icon: Clock, path: "/employee-attendance" },
    { label: "Leave & WFH", icon: Briefcase, path: "/employee-leave" },
    { label: "Payslips", icon: Receipt, path: "/employee-payslip" },
    { label: "Documents", icon: FolderOpen, path: "/employee-documents" },
    { label: "Holidays", icon: Calendar, path: "/employee-holidays" },
    { label: "Notifications", icon: Bell, path: "/employee-notifications" },
    { label: "Profile", icon: UserCircle, path: "/employee-profile" },
  ];

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-page__header">
        <div>
          <h1>Welcome back, {profile.name || email?.split("@")[0]}</h1>
          <p className="dashboard-page__subtitle">
            {profile.position || "Employee"}
          </p>
        </div>
      </div>

      <div className="dashboard-page__stats">
        <StatCard
          icon={Calendar}
          label="Leave Balance"
          value={`${s.leaveBalance ?? 0} days`}
          color="brand"
          delay={0}
        />
        <StatCard
          icon={CalendarCheck}
          label="Attendance"
          value={`${s.attendance ?? 0} days`}
          subtitle="This month"
          color="success"
          delay={80}
        />
        <StatCard
          icon={Clock}
          label="Today's Status"
          value={att.status || "Not Checked In"}
          subtitle={att.time ? new Date(att.time).toLocaleTimeString() : "--"}
          color="warning"
          delay={160}
        />
      </div>

      <Card
        className="animate-fade-in-up delay-3"
        style={{ marginBottom: "var(--space-6)" }}
      >
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "var(--space-3)",
            }}
          >
            {quickActions.map((a) => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "var(--space-4)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--color-bg-glass)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-secondary)",
                  fontSize: "var(--font-size-xs)",
                  fontWeight: 500,
                  transition: "all var(--transition-fast)",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background =
                    "var(--color-bg-glass-hover)";
                  e.currentTarget.style.borderColor = "var(--color-brand)";
                  e.currentTarget.style.color = "var(--color-brand-light)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "var(--color-bg-glass)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                <a.icon size={22} />
                {a.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {data?.announcements?.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {data.announcements.map((a) => (
            <Card key={a.id} hover className="animate-fade-in-up">
              <CardHeader>
                <CardTitle>{a.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-secondary)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  {a.content}
                </p>
                <span
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {formatDate(a.createdAt)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
