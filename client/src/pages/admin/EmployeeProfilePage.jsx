import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getEmployeeProfile, updateEmployee } from "../../api/employeeApi";
import { getDepartments } from "../../api/adminApi";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { Edit } from "lucide-react";
import { formatDate, formatCurrency } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    getEmployeeProfile(id)
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => {
    setEditForm({
      name: data.name,
      email: data.email,
      phone: data.phone,
      department: data.department === "Unassigned" ? "" : data.department,
      designation: data.designation === "N/A" ? "" : data.designation,
      status: data.status,
      role: data.role,
      annualSalary: data.salary?.annualSalary || "",
      filingStatus: data.salary?.filingStatus || "unmarried",
      gender: data.salary?.gender || "male",
      ssfContributor: data.salary?.ssfContributor || false,
      citContribution: data.salary?.citContribution || "",
      insurancePremium: data.salary?.insurancePremium || "",
    });
    getDepartments()
      .then((r) => setDepartments(r.data.data || []))
      .catch(() => {});
    setShowEdit(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.email)
      return toast.error("Name and email are required.");
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        annualSalary: Number(editForm.annualSalary) || 0,
        citContribution: Number(editForm.citContribution) || 0,
        insurancePremium: Number(editForm.insurancePremium) || 0,
      };
      await updateEmployee(id, payload);
      toast.success("Employee updated successfully!");
      setShowEdit(false);
      // Reload data
      const r = await getEmployeeProfile(id);
      setData(r.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update employee.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!data)
    return (
      <p
        style={{ color: "var(--color-text-muted)", padding: "var(--space-8)" }}
      >
        Employee not found.
      </p>
    );

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
          {data.name}
        </h1>
        <Button icon={Edit} onClick={openEdit}>
          Edit Employee
        </Button>
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
            <Info label="Employee ID" value={data.employeeId} />
            <Info label="Email" value={data.email} />
            <Info label="Phone" value={data.phone || "—"} />
            <Info
              label="Gender"
              value={
                data.salary?.gender
                  ? data.salary.gender.charAt(0).toUpperCase() +
                    data.salary.gender.slice(1)
                  : "—"
              }
            />
            <Info label="Department" value={data.department || "—"} />
            <Info label="Designation" value={data.designation || "—"} />
            <Info label="Status" value={<StatusBadge status={data.status} />} />
            <Info label="Joined" value={formatDate(data.joinDate)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Salary & Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <Info
              label="Annual Salary"
              value={formatCurrency(data.salary?.annualSalary)}
            />
            <Info
              label="Monthly (Pre-Tax)"
              value={formatCurrency(data.salary?.monthlyBeforeTax)}
            />
            <Info
              label="Filing Status"
              value={
                data.salary?.filingStatus
                  ? data.salary.filingStatus.charAt(0).toUpperCase() +
                    data.salary.filingStatus.slice(1)
                  : "—"
              }
            />
            <Info
              label="SSF Contributor"
              value={data.salary?.ssfContributor ? "Yes (Waives 1% SST)" : "No"}
            />
            <Info
              label="Monthly CIT"
              value={formatCurrency(data.salary?.citContribution)}
            />
            <Info
              label="Annual Life Insurance"
              value={formatCurrency(data.salary?.insurancePremium)}
            />
            <Info
              label="Leave Allowance"
              value={`${data.leave?.annualAllowance ?? 0} days`}
            />
            <Info label="Leave Used" value={`${data.leave?.used ?? 0} days`} />
            <Info
              label="Leave Remaining"
              value={`${data.leave?.remaining ?? 0} days`}
            />
          </CardContent>
        </Card>
      </div>

      {editForm && (
        <Modal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          title="Edit Employee Details"
          wide
        >
          <form
            onSubmit={handleSave}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div className="form-group">
                <label>Phone</label>
                <input
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value })
                  }
                >
                  <option value="employee">Employee</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="department_head">Department Head</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div className="form-group">
                <label>Department</label>
                <select
                  value={editForm.department}
                  onChange={(e) =>
                    setEditForm({ ...editForm, department: e.target.value })
                  }
                >
                  <option value="">Select...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Position</label>
                <input
                  value={editForm.designation}
                  onChange={(e) =>
                    setEditForm({ ...editForm, designation: e.target.value })
                  }
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div className="form-group">
                <label>Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="layoff">Layoff</option>
                </select>
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(e) =>
                    setEditForm({ ...editForm, gender: e.target.value })
                  }
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div className="form-group">
                <label>Annual Salary (NPR)</label>
                <input
                  type="number"
                  value={editForm.annualSalary}
                  onChange={(e) =>
                    setEditForm({ ...editForm, annualSalary: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Filing Status</label>
                <select
                  value={editForm.filingStatus}
                  onChange={(e) =>
                    setEditForm({ ...editForm, filingStatus: e.target.value })
                  }
                >
                  <option value="unmarried">Unmarried</option>
                  <option value="married">Married</option>
                </select>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div
                className="form-group"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  marginTop: "24px",
                }}
              >
                <input
                  type="checkbox"
                  id="editSsfContributor"
                  checked={editForm.ssfContributor}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      ssfContributor: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="editSsfContributor"
                  style={{
                    margin: 0,
                    cursor: "pointer",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 500,
                  }}
                >
                  SSF Contributor (Waives 1% SST)
                </label>
              </div>
              <div className="form-group">
                <label>Monthly CIT Contribution (NPR)</label>
                <input
                  type="number"
                  value={editForm.citContribution}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      citContribution: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div className="form-group">
                <label>Annual Life Insurance Premium (NPR)</label>
                <input
                  type="number"
                  value={editForm.insurancePremium}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      insurancePremium: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                marginTop: "var(--space-2)",
              }}
            >
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
              <Button variant="ghost" onClick={() => setShowEdit(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
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
        {value}
      </span>
    </div>
  );
}
