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
      <div className="page-header">
        <h1 className="page-title">Attendance Logs</h1>
      </div>
      <Card>
        <CardContent>
          <div className="page-filters">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
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
