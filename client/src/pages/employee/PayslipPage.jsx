import { getMyPayrolls, downloadMyPayrollPdf } from "../../api/payrollApi";
import Table from "../../components/ui/Table";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";
import { useApi } from "../../hooks/useApi";
import { formatCurrency, formatMonth } from "../../utils/helpers";
import { Download } from "lucide-react";
import toast from "react-hot-toast";

export default function PayslipPage() {
  const { data, loading } = useApi(getMyPayrolls);

  const handleDownload = async (id) => {
    try {
      const res = await downloadMyPayrollPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${id}.pdf`;
      a.click();
    } catch {
      toast.error("Download failed");
    }
  };

  const columns = [
    { key: "month", label: "Month", render: (r) => formatMonth(r.month) },
    {
      key: "grossPay",
      label: "Gross Pay",
      render: (r) => formatCurrency(r.grossPay),
    },
    {
      key: "deductions",
      label: "Deductions",
      render: (r) => formatCurrency(r.deductions),
    },
    {
      key: "netPay",
      label: "Net Pay",
      render: (r) => formatCurrency(r.netPay),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <Button
          size="sm"
          variant="ghost"
          icon={Download}
          onClick={() => handleDownload(r._id)}
        />
      ),
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
        My Payslips
      </h1>
      <Card>
        {loading ? (
          <PageLoader />
        ) : (
          <Table
            columns={columns}
            data={data || []}
            emptyMessage="No payslips"
          />
        )}
      </Card>
    </div>
  );
}
