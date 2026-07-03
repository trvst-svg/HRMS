import { getAnalytics } from "../../api/adminApi";
import StatCard from "../../components/ui/StatCard";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { PageLoader } from "../../components/ui/Spinner";
import { useApi } from "../../hooks/useApi";
import {
  Users,
  CalendarCheck,
  Landmark,
  Clock,
  BarChart2,
  PieChart,
  ShieldAlert,
} from "lucide-react";

function formatCurrency(value) {
  const num = Number(value || 0);
  return `NPR ${num.toLocaleString("en-NP")}`;
}

export default function AnalyticsPage() {
  const { data, loading } = useApi(getAnalytics);
  if (loading) return <PageLoader />;

  const s = data?.data || data || {};
  const departmentStats = s.departmentStats || [];
  const leaveDistribution = s.leaveDistribution || [];
  const maxHeadcount = Math.max(...departmentStats.map((d) => d.headcount), 1);
  const totalLeaves = leaveDistribution.reduce(
    (sum, item) => sum + Number(item.count || 0),
    0,
  );

  return (
    <div
      className="animate-fade-in"
      style={{ paddingBottom: "var(--space-8)" }}
    >
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1
          style={{
            fontSize: "var(--font-size-3xl)",
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: "var(--color-text-primary)",
          }}
        >
          System Analytics
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--font-size-sm)",
            marginTop: "var(--space-1)",
          }}
        >
          Detailed performance insights and resource breakdown.
        </p>
      </div>

      {/* KPI Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        <StatCard
          icon={Users}
          label="Active Employees"
          value={s.activeEmployees ?? 0}
          subtitle={`of ${s.totalEmployees ?? 0} total registered`}
          color="brand"
          delay={0}
        />
        <StatCard
          icon={CalendarCheck}
          label="Attendance Today"
          value={`${s.attendanceRate ?? 0}%`}
          subtitle={`${s.presentToday ?? 0} employees active`}
          color="success"
          delay={80}
        />
        <StatCard
          icon={Landmark}
          label="Estimated Monthly Budget"
          value={formatCurrency(s.totalMonthlyPayroll)}
          subtitle="Base salary liability"
          color="info"
          delay={160}
        />
        <StatCard
          icon={Clock}
          label="Average Team Tenure"
          value={`${s.avgTenureDays ?? 0} Days`}
          subtitle="Active employees tenure"
          color="warning"
          delay={240}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          lg: "3fr 2fr",
          gap: "var(--space-6)",
        }}
        className="analytics-grid"
      >
        {/* Department Breakdown */}
        <Card className="hover-lift" style={{ animationDelay: "300ms" }}>
          <CardHeader
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <BarChart2
              size={18}
              style={{ color: "var(--color-text-secondary)" }}
            />
            <CardTitle>Department Headcount & Salaries</CardTitle>
          </CardHeader>
          <CardContent>
            {departmentStats.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-4)",
                  padding: "var(--space-2) 0",
                }}
              >
                {departmentStats.map((dept, idx) => {
                  const percent = Math.round(
                    (dept.headcount / maxHeadcount) * 100,
                  );
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--space-2)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "var(--font-size-sm)",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {dept.department}
                        </span>
                        <span style={{ color: "var(--color-text-muted)" }}>
                          {dept.headcount}{" "}
                          {dept.headcount === 1 ? "member" : "members"} · Avg:{" "}
                          {formatCurrency(dept.avgSalary)}
                        </span>
                      </div>
                      <div
                        style={{
                          height: "8px",
                          background: "var(--color-bg-tertiary)",
                          borderRadius: "var(--radius-full)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${percent}%`,
                            background: "var(--color-brand)",
                            borderRadius: "var(--radius-full)",
                            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p
                style={{
                  color: "var(--color-text-muted)",
                  padding: "var(--space-4)",
                }}
              >
                No active department data found.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Leave Distribution Matrix */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-6)",
          }}
        >
          <Card className="hover-lift" style={{ animationDelay: "400ms" }}>
            <CardHeader
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              <PieChart
                size={18}
                style={{ color: "var(--color-text-secondary)" }}
              />
              <CardTitle>Leave Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {leaveDistribution.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                  }}
                >
                  {leaveDistribution.map((item, idx) => {
                    const pct = totalLeaves
                      ? Math.round((item.count / totalLeaves) * 100)
                      : 0;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          background: "var(--color-bg-glass)",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "var(--font-size-sm)",
                            fontWeight: 500,
                          }}
                        >
                          {item._id}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-3)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "var(--font-size-xs)",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            {pct}%
                          </span>
                          <span
                            style={{
                              padding: "2px 8px",
                              fontSize: "var(--font-size-xs)",
                              fontWeight: 600,
                              background: "var(--color-bg-tertiary)",
                              borderRadius: "var(--radius-full)",
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {item.count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    padding: "var(--space-4)",
                  }}
                >
                  No leave records found.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="hover-lift" style={{ animationDelay: "500ms" }}>
            <CardHeader
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              <ShieldAlert
                size={18}
                style={{ color: "var(--color-text-secondary)" }}
              />
              <CardTitle>Administrative Alerts</CardTitle>
            </CardHeader>
            <CardContent style={{ fontSize: "var(--font-size-sm)" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                {s.leave?.pending > 0 ? (
                  <div
                    style={{
                      color: "var(--color-warning)",
                      display: "flex",
                      gap: "var(--space-2)",
                    }}
                  >
                    <span>•</span>
                    <span>
                      There are {s.leave.pending} leave requests awaiting
                      decision.
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      color: "var(--color-success)",
                      display: "flex",
                      gap: "var(--space-2)",
                    }}
                  >
                    <span>✓</span>
                    <span>All leave requests are processed.</span>
                  </div>
                )}
                {s.attendanceRate < 80 ? (
                  <div
                    style={{
                      color: "var(--color-danger)",
                      display: "flex",
                      gap: "var(--space-2)",
                    }}
                  >
                    <span>•</span>
                    <span>
                      Attendance is low today ({s.attendanceRate}%). Verify
                      check-in records.
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      color: "var(--color-success)",
                      display: "flex",
                      gap: "var(--space-2)",
                    }}
                  >
                    <span>✓</span>
                    <span>
                      Attendance health is optimal ({s.attendanceRate}%).
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
