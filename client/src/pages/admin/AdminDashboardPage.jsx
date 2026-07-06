import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getDashboardSummary } from "../../api/adminApi";
import StatCard from "../../components/ui/StatCard";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { PageLoader } from "../../components/ui/Spinner";
import {
  Users,
  CalendarCheck,
  ClipboardList,
  CheckCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { formatDate } from "../../utils/helpers";
import "./DashboardPage.css";

export default function AdminDashboardPage() {
  const { role, email } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isManager =
    role === "manager" ||
    role === "project_manager" ||
    role === "department_head";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDashboardSummary();
      setData(res.data.data || res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const id = setInterval(load, 30000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (loading && !data) return <PageLoader />;

  const s = data || {};

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-page__header">
        <div>
          <h1>{isManager ? "Manager Center" : "Control Center"}</h1>
          <p className="dashboard-page__subtitle">{email}</p>
        </div>
      </div>

      {error && <div className="dashboard-page__error">{error}</div>}

      <div className="dashboard-page__stats">
        <StatCard
          icon={Users}
          label="Total Employees"
          value={s.totalEmployees ?? 0}
          color="brand"
          delay={0}
        />
        <StatCard
          icon={CalendarCheck}
          label="Present Today"
          value={s.presentToday ?? 0}
          subtitle={`${s.attendanceRate ?? 0}% attendance`}
          color="success"
          delay={80}
        />
        <StatCard
          icon={ClipboardList}
          label="Pending Leaves"
          value={s.pendingLeaves ?? 0}
          subtitle="Awaiting approval"
          color="warning"
          delay={160}
        />
        <StatCard
          icon={CheckCircle}
          label="Approved Leaves"
          value={s.approvedLeaves ?? 0}
          subtitle="This month"
          color="info"
          delay={240}
        />
      </div>

      <div className="dashboard-page__grid">
        <Card className="animate-fade-in-up delay-3">
          <CardHeader>
            <CardTitle>
              {isManager ? "Recent Team Members" : "Recent Employees"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {s.recentEmployees?.length > 0 ? (
              <div className="recent-list">
                {s.recentEmployees.map((emp) => (
                  <div
                    key={emp._id}
                    className="recent-item"
                    onClick={() =>
                      !isManager &&
                      navigate(`/admin-employee-profile/${emp._id}`)
                    }
                  >
                    <div className="recent-item__avatar">
                      {emp.firstName?.[0]?.toUpperCase() || "E"}
                    </div>
                    <div className="recent-item__info">
                      <span className="recent-item__name">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span className="recent-item__meta">
                        {emp.employeeId} · {emp.email}
                      </span>
                    </div>
                    <span className="recent-item__dept">
                      {emp.department || "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  color: "var(--color-text-muted)",
                  padding: "var(--space-4)",
                }}
              >
                No employee records found.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="dashboard-page__side">
          <Card className="animate-fade-in-up delay-4">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="quick-stat">
                <TrendingUp size={16} />
                <span>Attendance Rate</span>
                <strong>{s.attendanceRate ?? 0}%</strong>
              </div>
              <div className="quick-stat">
                <CheckCircle size={16} />
                <span>Leave Approval Rate</span>
                <strong>{s.leaveApprovalRate ?? 0}%</strong>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in-up delay-5">
            <CardHeader>
              <CardTitle>System Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="quick-stat">
                <Clock size={16} />
                <span>Last Sync</span>
                <strong>
                  {s.generatedAt
                    ? formatDate(s.generatedAt, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </strong>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
