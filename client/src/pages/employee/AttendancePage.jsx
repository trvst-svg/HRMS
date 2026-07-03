import { useState } from "react";
import { checkIn, checkOut, getMyAttendance } from "../../api/attendanceApi";
import Table from "../../components/ui/Table";
import Card, { CardContent } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";
import { useApi } from "../../hooks/useApi";
import { formatDate, formatTime } from "../../utils/helpers";
import { LogIn, LogOut, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function AttendancePage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, loading, execute } = useApi(() => getMyAttendance(from, to), {
    deps: [],
  });

  const handleCheckIn = async () => {
    try {
      await checkIn();
      toast.success("Checked in!");
      execute();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };
  const handleCheckOut = async () => {
    try {
      await checkOut();
      toast.success("Checked out!");
      execute();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const columns = [
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
        My Attendance
      </h1>
      <div
        style={{
          display: "flex",
          gap: "var(--space-3)",
          marginBottom: "var(--space-6)",
          flexWrap: "wrap",
        }}
      >
        <Button icon={LogIn} variant="success" onClick={handleCheckIn}>
          Check In
        </Button>
        <Button icon={LogOut} variant="danger" onClick={handleCheckOut}>
          Check Out
        </Button>
      </div>
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
