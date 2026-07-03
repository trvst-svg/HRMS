import { useState, useEffect } from "react";
import {
  getProjects,
  getMyActiveTask,
  submitReport,
  requestExtension,
  requestTransfer,
  updateTaskStatus,
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
  CheckCircle,
  FileText,
  Clock,
  Send,
  Calendar,
  Layers,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

export default function EmployeeProjectsPage() {
  const [project, setProject] = useState(null);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Submissions State
  const [progressText, setProgressText] = useState("");
  const [submittingProgress, setSubmittingProgress] = useState(false);

  const [extDays, setExtDays] = useState("");
  const [extReason, setExtReason] = useState("");
  const [submittingExt, setSubmittingExt] = useState(false);

  const [transferReason, setTransferReason] = useState("");
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const projList = await getProjects();
      setProject(projList.data.data?.[0] || null);

      const activeTaskRes = await getMyActiveTask();
      setTask(activeTaskRes.data.data || null);
    } catch (err) {
      toast.error("Failed to load project or task details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (newStatus) => {
    if (!task) return;
    try {
      await updateTaskStatus(task.id, newStatus);
      toast.success("Task status updated successfully!");
      loadData();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!task || !progressText) return;
    try {
      setSubmittingProgress(true);
      await submitReport(task.id, progressText);
      toast.success("Progress report submitted successfully!");
      setProgressText("");
      loadData();
    } catch (err) {
      toast.error("Failed to submit progress report.");
    } finally {
      setSubmittingProgress(false);
    }
  };

  const handleExtensionSubmit = async (e) => {
    e.preventDefault();
    if (!task || !extDays || !extReason) return;
    try {
      setSubmittingExt(true);
      await requestExtension(task.id, extDays, extReason);
      toast.success("Extension request submitted successfully.");
      setExtDays("");
      setExtReason("");
      loadData();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to request extension.",
      );
    } finally {
      setSubmittingExt(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!task || !transferReason) return;
    try {
      setSubmittingTransfer(true);
      await requestTransfer(task.id, transferReason);
      toast.success("Transfer request submitted successfully.");
      setTransferReason("");
      loadData();
    } catch (err) {
      toast.error("Failed to submit transfer request.");
    } finally {
      setSubmittingTransfer(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!project) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: "var(--space-4)",
          color: "var(--color-text-muted)",
        }}
      >
        <HelpCircle size={48} />
        <h2>No Active Projects</h2>
        <p>You are not currently assigned to any active project team.</p>
      </div>
    );
  }

  const projStartStr = new Date(project.startDate).toLocaleDateString();
  const projEndStr = new Date(project.endDate).toLocaleDateString();

  return (
    <div
      className="animate-fade-in"
      style={{ paddingBottom: "var(--space-8)" }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "var(--space-6)",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "var(--space-4)",
        }}
      >
        <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: 800 }}>
          Project: {project.name}
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--font-size-sm)",
            marginTop: "4px",
          }}
        >
          Project Manager:{" "}
          <strong>
            {project.mgrFirstName} {project.mgrLastName}
          </strong>{" "}
          · Project Timeline:{" "}
          <strong>
            {projStartStr} - {projEndStr}
          </strong>
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          lg: "2fr 1fr",
          gap: "var(--space-6)",
        }}
        className="analytics-grid"
      >
        {/* Active Task / Workspace */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-6)",
          }}
        >
          {task ? (
            <Card
              className="hover-lift"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <CardHeader
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Active Task
                  </span>
                  <CardTitle style={{ marginTop: "4px" }}>
                    {task.title}
                  </CardTitle>
                </div>

                {/* Status Dropdown */}
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{
                    width: "auto",
                    minHeight: "36px",
                    padding: "6px 12px",
                    background: "var(--color-bg-secondary)",
                    fontWeight: 700,
                  }}
                >
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </CardHeader>
              <CardContent
                style={{
                  padding: "0 var(--space-4) var(--space-4) var(--space-4)",
                }}
              >
                {task.description && (
                  <p
                    style={{
                      fontSize: "var(--font-size-sm)",
                      color: "var(--color-text-secondary)",
                      marginBottom: "16px",
                    }}
                  >
                    {task.description}
                  </p>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "var(--space-4)",
                    fontSize: "var(--font-size-sm)",
                    borderTop: "1px solid var(--color-border)",
                    borderBottom: "1px solid var(--color-border)",
                    padding: "12px 0",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Layers
                      size={16}
                      style={{ color: "var(--color-text-muted)" }}
                    />
                    <span>
                      Story Points: <strong>{task.points}</strong>
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Calendar
                      size={16}
                      style={{ color: "var(--color-text-muted)" }}
                    />
                    <span>
                      Deadline: {new Date(task.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Progress Request Banner */}
                {task.progressRequested && (
                  <div
                    style={{
                      border: "1px solid var(--color-warning)",
                      padding: "16px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-bg-secondary)",
                      marginBottom: "16px",
                    }}
                  >
                    <h4
                      style={{
                        color: "var(--color-warning)",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "var(--font-size-sm)",
                      }}
                    >
                      <Clock size={16} /> Progress Report Required
                    </h4>
                    <p
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-muted)",
                        marginTop: "4px",
                        marginBottom: "12px",
                      }}
                    >
                      Your manager has requested a status update report for this
                      task.
                    </p>
                    <form
                      onSubmit={handleReportSubmit}
                      style={{ display: "flex", gap: "8px" }}
                    >
                      <input
                        type="text"
                        placeholder="Write a brief progress report..."
                        value={progressText}
                        onChange={(e) => setProgressText(e.target.value)}
                        required
                      />
                      <Button
                        type="submit"
                        variant="brand"
                        disabled={submittingProgress}
                        style={{
                          minHeight: "44px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Send size={14} /> Submit
                      </Button>
                    </form>
                  </div>
                )}

                {/* Actions Panel */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "var(--space-4)",
                  }}
                >
                  {/* Extension form */}
                  <form
                    onSubmit={handleExtensionSubmit}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-3)",
                      padding: "14px",
                      background: "var(--color-bg-glass)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--font-size-xs)",
                        fontWeight: 700,
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Request Extension
                    </span>
                    <input
                      type="number"
                      placeholder="Extra days (e.g. 3)"
                      value={extDays}
                      onChange={(e) => setExtDays(e.target.value)}
                      disabled={task.extensionRequested}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Reason for extension..."
                      value={extReason}
                      onChange={(e) => setExtReason(e.target.value)}
                      disabled={task.extensionRequested}
                      required
                    />
                    <Button
                      type="submit"
                      variant="ghost"
                      disabled={submittingExt || task.extensionRequested}
                    >
                      {task.extensionRequested
                        ? "Extension Pending"
                        : "Submit Extension"}
                    </Button>
                  </form>

                  {/* Transfer form */}
                  <form
                    onSubmit={handleTransferSubmit}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-3)",
                      padding: "14px",
                      background: "var(--color-bg-glass)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--font-size-xs)",
                        fontWeight: 700,
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Request Task Transfer
                    </span>
                    <input
                      type="text"
                      placeholder="Reason for task transfer..."
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      disabled={task.transferRequested}
                      required
                    />
                    <div style={{ flexGrow: 1 }} />
                    <Button
                      type="submit"
                      variant="ghost"
                      disabled={submittingTransfer || task.transferRequested}
                    >
                      {task.transferRequested
                        ? "Transfer Pending"
                        : "Submit Transfer"}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "30vh",
                gap: "var(--space-2)",
                color: "var(--color-text-muted)",
                background: "var(--color-bg-secondary)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
              }}
            >
              <CheckCircle size={32} />
              <h3>All Caught Up!</h3>
              <p>You have no active tasks assigned at the moment.</p>
            </div>
          )}

          {/* Project Wiki / documentation read-only */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FileText size={18} /> Project Specifications Wiki
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: "var(--space-4)" }}>
              {project.documentation ? (
                <div
                  style={{
                    padding: "16px",
                    background: "var(--color-bg-secondary)",
                    borderRadius: "var(--radius-md)",
                    whiteSpace: "pre-wrap",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-secondary)",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {project.documentation}
                </div>
              ) : (
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "var(--font-size-sm)",
                  }}
                >
                  No specifications or wiki written by the manager yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <TrendingUp size={16} /> Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Completing tasks earns points towards your developer performance
                logs.
              </p>
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "12px",
                }}
              >
                <span style={{ fontSize: "var(--font-size-sm)" }}>
                  Active Task Weight:
                </span>
                <span style={{ fontWeight: 800 }}>
                  {task ? `${task.points} Story Points` : "0 points"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
