import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createEmployee } from "../../api/employeeApi";
import { getDepartments } from "../../api/adminApi";
import Button from "../../components/ui/Button";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterEmployeePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "employee",
    department: "",
    position: "",
    annualSalary: "",
    filingStatus: "unmarried",
    gender: "male",
    ssfContributor: false,
    citContribution: "",
    insurancePremium: "",
  });
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    getDepartments()
      .then((r) => setDepartments(r.data.data || []))
      .catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password)
      return toast.error("Name, email, and password are required.");
    setLoading(true);
    try {
      await createEmployee({
        ...form,
        annualSalary: Number(form.annualSalary) || 0,
        citContribution: Number(form.citContribution) || 0,
        insurancePremium: Number(form.insurancePremium) || 0,
      });
      toast.success("Employee registered successfully!");
      navigate("/employees");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1
        style={{
          fontSize: "var(--font-size-2xl)",
          fontWeight: 700,
          marginBottom: "var(--space-6)",
        }}
      >
        Register Employee
      </h1>
      <Card style={{ maxWidth: 640 }}>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div className="form-group">
              <label>Full Name *</label>
              <input
                value={form.name}
                onChange={set("name")}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="john@company.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
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
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="Phone number"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={set("role")}>
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
                <select value={form.department} onChange={set("department")}>
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
                  value={form.position}
                  onChange={set("position")}
                  placeholder="Software Engineer"
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
                <label>Annual Salary (NPR)</label>
                <input
                  type="number"
                  value={form.annualSalary}
                  onChange={set("annualSalary")}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Filing Status</label>
                <select
                  value={form.filingStatus}
                  onChange={set("filingStatus")}
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
              <div className="form-group">
                <label>Gender</label>
                <select value={form.gender} onChange={set("gender")}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
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
                  id="ssfContributor"
                  checked={form.ssfContributor}
                  onChange={(e) =>
                    setForm({ ...form, ssfContributor: e.target.checked })
                  }
                />
                <label
                  htmlFor="ssfContributor"
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
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-4)",
              }}
            >
              <div className="form-group">
                <label>Monthly CIT Contribution (NPR)</label>
                <input
                  type="number"
                  value={form.citContribution}
                  onChange={set("citContribution")}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Annual Life Insurance Premium (NPR)</label>
                <input
                  type="number"
                  value={form.insurancePremium}
                  onChange={set("insurancePremium")}
                  placeholder="0"
                />
              </div>
            </div>
            <Button type="submit" icon={UserPlus} loading={loading} size="lg">
              Register Employee
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
