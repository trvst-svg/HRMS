import { useState, useCallback } from "react";
import { getAllAttendance } from "../../api/attendanceApi";
import Table from "../../components/ui/Table";
import Card, { CardContent } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";
import { formatDate, formatTime } from "../../utils/helpers";
import { useApi } from "../../hooks/useApi";
import Button from "../../components/ui/Button";
import { RefreshCw } from "lucide-react";

export default function AttendancePage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, loading, execute } = useApi(
    () => getAllAttendance({ from, to }),
    { deps: [] },
  );

  const columns = [
    {
      key: "employee",
      label: "Employee",
      render: (r) =>
        r.employee
          ? `${r.employee.firstName || ""} ${r.employee.lastName || ""}`.trim() ||
            r.employee.email
          : "—",
    },
    { key: "date", label: "Date", render: (r) => formatDate(r.date) },
    { key: "checkIn", label: "Check In", render: (r) => formatTime(r.checkIn) },
    {
      key: "checkOut",
      label: "Check Out",
      render: (r) => formatTime(r.checkOut),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <div className="animate-fade-in">
      <h1
        style={{
          fontSize: "var(--font-size-2xl)",
          fontWeight: 700,
          marginBottom: "var(--space-6)",
        }}
      >
        Attendance Logs
      </h1>
      <Card>
        <CardContent>
          <div
            style={{
              display: "flex",
              gap: "var(--space-3)",
              flexWrap: "wrap",
              marginBottom: "var(--space-4)",
            }}
          >
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{ flex: "0 1 180px" }}
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ flex: "0 1 180px" }}
            />
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={() => execute()}
            >
              Filter
            </Button>
          </div>
        </CardContent>
        {loading ? (
          <PageLoader />
        ) : (
          <Table
            columns={columns}
            data={data || []}
            emptyMessage="No attendance records"
          />
        )}
      </Card>
    </div>
  );
}
