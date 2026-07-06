import { useState, useEffect } from "react";
import {
  getProjects,
  createProject,
  getAvailableManagers,
} from "../../api/projectsApi";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import toast from "react-hot-toast";
import {
  Briefcase,
  Calendar,
  User,
  AlignLeft,
  AlertCircle,
} from "lucide-react";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projRes, mgrRes] = await Promise.all([
        getProjects(),
        getAvailableManagers(),
      ]);
      setProjects(projRes.data.data || []);
      setManagers(mgrRes.data.data || []);
    } catch (err) {
      toast.error("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !managerId || !startDate || !endDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      setSubmitting(true);
      await createProject({ name, description, managerId, startDate, endDate });
      toast.success("Project created successfully!");
      setName("");
      setDescription("");
      setManagerId("");
      setStartDate("");
      setEndDate("");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div
      className="animate-fade-in"
      style={{ paddingBottom: "var(--space-8)" }}
    >
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1
          style={{
            fontSize: "var(--font-size-3xl)",
            fontWeight: 800,
            color: "var(--color-text-primary)",
          }}
        >
          Project Control Center
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--font-size-sm)",
            marginTop: "var(--space-1)",
          }}
        >
          Create and monitor active JIRA-like projects and manage managers.
        </p>
      </div>

      <div className="analytics-grid grid-responsive-1-2">
        {/* Project Creation Form */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: "var(--space-4)" }}>
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Project Name *
                </label>
                <div style={{ position: "relative" }}>
                  <Briefcase
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "14px",
                      color: "var(--color-text-muted)",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="e.g. HRMS Redesign"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: "36px" }}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Description
                </label>
                <div style={{ position: "relative" }}>
                  <AlignLeft
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "14px",
                      color: "var(--color-text-muted)",
                    }}
                  />
                  <textarea
                    placeholder="Project scope and goals..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ paddingLeft: "36px", minHeight: "80px" }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Assign Project Manager *
                </label>
                <div style={{ position: "relative" }}>
                  <User
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "14px",
                      color: "var(--color-text-muted)",
                    }}
                  />
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    style={{ paddingLeft: "36px" }}
                    required
                  >
                    <option value="">Select a Manager</option>
                    {managers.map((mgr) => (
                      <option key={mgr.id} value={mgr.id}>
                        {mgr.firstName} {mgr.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: 600,
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    Start Date *
                  </label>
                  <div style={{ position: "relative" }}>
                    <Calendar
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "14px",
                        color: "var(--color-text-muted)",
                      }}
                    />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ paddingLeft: "36px" }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: 600,
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    End Date *
                  </label>
                  <div style={{ position: "relative" }}>
                    <Calendar
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "14px",
                        color: "var(--color-text-muted)",
                      }}
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{ paddingLeft: "36px" }}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="brand"
                disabled={submitting}
                style={{ marginTop: "var(--space-2)" }}
              >
                {submitting ? "Creating Project..." : "Create Project"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Projects List */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: "0" }}>
            {projects.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid var(--color-border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: "var(--font-size-md)",
                          fontWeight: 700,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {proj.name}
                      </h3>
                      {proj.description && (
                        <p
                          style={{
                            fontSize: "var(--font-size-sm)",
                            color: "var(--color-text-muted)",
                            marginTop: "4px",
                          }}
                        >
                          {proj.description}
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: "var(--space-4)",
                          marginTop: "8px",
                          fontSize: "var(--font-size-xs)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <User size={12} /> Manager:{" "}
                          {proj.mgrFirstName
                            ? `${proj.mgrFirstName} ${proj.mgrLastName}`
                            : "Unassigned"}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Calendar size={12} /> Timeline:{" "}
                          {new Date(proj.startDate).toLocaleDateString()} -{" "}
                          {new Date(proj.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-8)",
                  color: "var(--color-text-muted)",
                }}
              >
                <AlertCircle size={24} />
                <p>No projects registered in the workspace.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
