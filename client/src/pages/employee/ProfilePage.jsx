import { getMyProfile } from "../../api/profileApi";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { PageLoader } from "../../components/ui/Spinner";
import Button from "../../components/ui/Button";
import { useApi } from "../../hooks/useApi";
import { formatDate, formatCurrency } from "../../utils/helpers";
import { useNavigate } from "react-router-dom";
import { Edit, Lock } from "lucide-react";

export default function ProfilePage() {
  const { data, loading } = useApi(getMyProfile);
  const navigate = useNavigate();
  if (loading) return <PageLoader />;
  const p = data || {};

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-6)",
        }}
      >
        <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700 }}>
          My Profile
        </h1>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <Button
            variant="secondary"
            icon={Edit}
            onClick={() => navigate("/edit-profile")}
          >
            Edit Profile
          </Button>
          <Button
            variant="secondary"
            icon={Lock}
            onClick={() => navigate("/change-password")}
          >
            Change Password
          </Button>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Personal Info</CardTitle>
          </CardHeader>
          <CardContent>
            <Info
              label="Name"
              value={
                p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim()
              }
            />
            <Info label="Email" value={p.email} />
            <Info label="Employee ID" value={p.employeeId} />
            <Info label="Department" value={p.department || "—"} />
            <Info label="Designation" value={p.designation || "—"} />
            <Info label="Phone" value={p.phone || "—"} />
            <Info label="Joined" value={formatDate(p.joinDate)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compensation & Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <Info
              label="Annual Salary"
              value={formatCurrency(p.salary?.annualSalary)}
            />
            <Info
              label="Monthly (Pre-Tax)"
              value={formatCurrency(p.salary?.monthlyBeforeTax)}
            />
            <Info
              label="Leave Allowance"
              value={`${p.leave?.annualAllowance ?? 0} days`}
            />
            <Info label="Leave Used" value={`${p.leave?.used ?? 0} days`} />
            <Info
              label="Leave Remaining"
              value={`${p.leave?.remaining ?? 0} days`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid var(--color-border)",
        fontSize: "var(--font-size-sm)",
      }}
    >
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
        {value || "—"}
      </span>
    </div>
  );
}
