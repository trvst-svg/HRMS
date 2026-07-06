import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployees, deleteEmployee } from "../../api/employeeApi";
import { getDepartments } from "../../api/adminApi";
import { useAuth } from "../../hooks/useAuth";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { PageLoader } from "../../components/ui/Spinner";
import { UserPlus, Search, Trash2, Edit, Eye, UserX } from "lucide-react";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function EmployeesPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [departments, setDepartments] = useState([]);

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await getEmployees({
          search,
          status: statusFilter,
          role: roleFilter,
          department: deptFilter,
          page,
          limit: 20,
        });
        setEmployees(res.data.data || []);
        setPagination(
          res.data.pagination || { page, pages: 1, total: 0, limit: 20 },
        );
      } catch {
        toast.error("Failed to load employees");
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, roleFilter, deptFilter],
  );

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    getDepartments()
      .then((r) => setDepartments(r.data.data || []))
      .catch(() => {});
  }, []);

  const handleDelete = async (id, action) => {
    const actionWord = action === "layoff" ? "lay off" : "fire";
    if (!confirm(`Are you sure you want to ${actionWord} this employee?`)) return;
    try {
      await deleteEmployee(id, action);
      toast.success(`Employee ${action === "layoff" ? "laid off" : "fired and removed"}`);
      load(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const columns = [
    { key: "employeeId", label: "ID" },
    {
      key: "name",
      label: "Name",
      render: (r) => `${r.firstName} ${r.lastName}`,
    },
    { key: "email", label: "Email" },
    {
      key: "department",
      label: "Department",
      render: (r) => r.department || "—",
    },
    {
      key: "designation",
      label: "Designation",
      render: (r) => r.designation || "—",
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "joinDate",
      label: "Joined",
      render: (r) => formatDate(r.joinDate || r.createdAt),
    },
    ...(role === "admin"
      ? [
          {
            key: "actions",
            label: "Actions",
            render: (r) => (
              <div style={{ display: "flex", gap: 4 }}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/admin-employee-profile/${r._id}`)}
                  icon={Eye}
                  title="View Profile"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(r._id, "layoff")}
                  icon={Trash2}
                  title="Layoff Employee"
                  style={{ color: "var(--color-warning)" }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(r._id, "fire")}
                  icon={UserX}
                  title="Fire Employee"
                  style={{ color: "var(--color-danger)" }}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Employees</h1>
        {role === "admin" && (
          <Button
            icon={UserPlus}
            onClick={() => navigate("/register-employee")}
          >
            Add Employee
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <div className="page-filters">
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
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="layoff">Layoff</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        {loading ? (
          <PageLoader />
        ) : (
          <Table
            columns={columns}
            data={employees}
            pagination={pagination}
            onPageChange={(p) => load(p)}
            emptyMessage="No employees found"
          />
        )}
      </Card>
    </div>
  );
}
