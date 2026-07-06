import { useState } from "react";
import {
  getAdminPayrolls,
  createOrUpdatePayroll,
  downloadAdminPayrollPdf,
} from "../../api/payrollApi";
import { getEmployees } from "../../api/employeeApi";
import Table from "../../components/ui/Table";
import Card, { CardContent } from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";
import { useApi } from "../../hooks/useApi";
import { formatCurrency, formatMonth } from "../../utils/helpers";
import { Plus, Download, Search } from "lucide-react";
import toast from "react-hot-toast";

export default function PayrollPage() {
  const [monthFilter, setMonthFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const { data, loading, execute } = useApi(
    () => getAdminPayrolls({ month: monthFilter, search: searchFilter }),
    { deps: [monthFilter, searchFilter] },
  );
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    employee: "",
    month: "",
    otherDeductions: 0,
    otHours: 0,
    includeFestivalBonus: false,
  });
  const [creating, setCreating] = useState(false);
  const [employees, setEmployees] = useState([]);

  const openCreate = async () => {
    try {
      const r = await getEmployees({ limit: 200 });
      setEmployees(r.data.data || []);
    } catch {}
    setShowCreate(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.employee || !form.month)
      return toast.error("Employee and month required.");
    setCreating(true);
    try {
      await createOrUpdatePayroll(form);
      toast.success("Payroll created");
      setShowCreate(false);
      execute();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await downloadAdminPayrollPdf(id);
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
    {
      key: "employee",
      label: "Employee",
      render: (r) =>
        r.employee
          ? `${r.employee.firstName || ""} ${r.employee.lastName || ""}`.trim()
          : "—",
    },
    { key: "month", label: "Month", render: (r) => formatMonth(r.month) },
    {
      key: "grossPay",
      label: "Gross",
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
      <div className="page-header">
        <h1 className="page-title">Payroll</h1>
        <Button icon={Plus} onClick={openCreate}>
          Generate Payroll
        </Button>
      </div>
      <Card>
        <CardContent>
          <div className="page-filters">
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            />
            <div className="page-filters__search">
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                placeholder="Search..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>
        </CardContent>
        {loading ? (
          <PageLoader />
        ) : (
          <Table
            columns={columns}
            data={data || []}
            emptyMessage="No payroll records"
          />
        )}
      </Card>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Generate Payroll"
      >
        <form
          onSubmit={handleCreate}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <div className="form-group">
            <label>Employee</label>
            <select
              value={form.employee}
              onChange={(e) => setForm({ ...form, employee: e.target.value })}
            >
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Month</label>
            <input
              type="month"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Other Deductions (NPR)</label>
            <input
              type="number"
              value={form.otherDeductions}
              onChange={(e) =>
                setForm({ ...form, otherDeductions: Number(e.target.value) })
              }
            />
          </div>
          <div className="form-group">
            <label>Overtime Hours</label>
            <input
              type="number"
              value={form.otHours}
              onChange={(e) =>
                setForm({ ...form, otHours: Number(e.target.value) })
              }
              placeholder="0"
            />
          </div>
          <div
            className="form-group"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <input
              type="checkbox"
              id="includeFestivalBonus"
              checked={form.includeFestivalBonus}
              onChange={(e) =>
                setForm({ ...form, includeFestivalBonus: e.target.checked })
              }
            />
            <label
              htmlFor="includeFestivalBonus"
              style={{
                margin: 0,
                cursor: "pointer",
                fontSize: "var(--font-size-sm)",
                fontWeight: 500,
              }}
            >
              Include Festival Bonus (Dashain Bonus)
            </label>
          </div>
          <Button type="submit" loading={creating}>
            Generate
          </Button>
        </form>
      </Modal>
    </div>
  );
}
