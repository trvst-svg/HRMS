import { useState } from "react";
import {
  getAllLeaveRequests,
  approveLeave,
  rejectLeave,
  getAllWfhRequests,
  approveWfh,
  rejectWfh,
} from "../../api/leaveApi";
import Table from "../../components/ui/Table";
import Card, { CardContent } from "../../components/ui/Card";
import Tabs from "../../components/ui/Tabs";
import { StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { useApi } from "../../hooks/useApi";
import { formatDate } from "../../utils/helpers";
import { Check, X, Briefcase, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export default function LeaveApprovalsPage() {
  const [tab, setTab] = useState("leave");
  const [statusFilter, setStatusFilter] = useState("");
  const leave = useApi(() => getAllLeaveRequests({ status: statusFilter }), {
    deps: [statusFilter, tab],
  });
  const wfh = useApi(() => getAllWfhRequests({ status: statusFilter }), {
    deps: [statusFilter, tab],
  });
  const active = tab === "leave" ? leave : wfh;

  const handleAction = async (id, action) => {
    try {
      if (tab === "leave") {
        action === "approve" ? await approveLeave(id) : await rejectLeave(id);
      } else {
        action === "approve" ? await approveWfh(id) : await rejectWfh(id);
      }
      toast.success(`Request ${action}d`);
      active.execute();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const columns = [
    {
      key: "employee",
      label: "Employee",
      render: (r) =>
        r.employee
          ? `${r.employee.firstName || ""} ${r.employee.lastName || ""}`.trim()
          : "—",
    },
    {
      key: "type",
      label: "Type",
      render: (r) => r.type || (tab === "wfh" ? "WFH" : "—"),
    },
    { key: "from", label: "From", render: (r) => formatDate(r.from) },
    { key: "to", label: "To", render: (r) => formatDate(r.to) },
    { key: "reason", label: "Reason", render: (r) => r.reason || "—" },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) =>
        r.status === "Pending" ? (
          <div style={{ display: "flex", gap: 4 }}>
            <Button
              size="sm"
              variant="success"
              icon={Check}
              onClick={() => handleAction(r._id, "approve")}
            />
            <Button
              size="sm"
              variant="danger"
              icon={X}
              onClick={() => handleAction(r._id, "reject")}
            />
          </div>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Leave Approvals</h1>
      </div>
      <div className="page-filters">
        <Tabs
          tabs={[
            { value: "leave", label: "Leave", icon: Calendar },
            { value: "wfh", label: "WFH", icon: Briefcase },
          ]}
          activeTab={tab}
          onChange={setTab}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
      <Card>
        {active.loading ? (
          <PageLoader />
        ) : (
          <Table
            columns={columns}
            data={active.data || []}
            emptyMessage="No requests"
          />
        )}
      </Card>
    </div>
  );
}
