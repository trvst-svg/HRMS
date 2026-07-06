import { useState } from "react";
import {
  getAdminRequests,
  approveRequest,
  rejectRequest,
} from "../../api/documentsApi";
import Table from "../../components/ui/Table";
import Card, { CardContent } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";
import { useApi } from "../../hooks/useApi";
import { formatDate } from "../../utils/helpers";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";

export default function HRDocumentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, loading, execute } = useApi(
    () => getAdminRequests({ status: statusFilter }),
    { deps: [statusFilter] },
  );

  const handleApprove = async (id) => {
    try {
      await approveRequest(id);
      toast.success("Approved");
      execute();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };
  const handleReject = async (id) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      await rejectRequest(id, reason);
      toast.success("Rejected");
      execute();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
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
    { key: "type", label: "Document Type" },
    { key: "purpose", label: "Purpose", render: (r) => r.purpose || "—" },
    {
      key: "requestedByRole",
      label: "Role",
      render: (r) => r.requestedByRole || "—",
    },
    {
      key: "createdAt",
      label: "Requested",
      render: (r) => formatDate(r.createdAt),
    },
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
              onClick={() => handleApprove(r._id)}
            />
            <Button
              size="sm"
              variant="danger"
              icon={X}
              onClick={() => handleReject(r._id)}
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
        <h1 className="page-title">Document Requests</h1>
      </div>
      <Card>
        <CardContent>
          <div className="page-filters">
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
        </CardContent>
        {loading ? (
          <PageLoader />
        ) : (
          <Table
            columns={columns}
            data={data || []}
            emptyMessage="No document requests"
          />
        )}
      </Card>
    </div>
  );
}
