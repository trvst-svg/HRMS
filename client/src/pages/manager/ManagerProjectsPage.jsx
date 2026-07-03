import { useState, useEffect } from "react";
import {
  getProjects,
  getProjectDetails,
  updateDocumentation,
  getAvailableEmployees,
  assignMembers,
  createTask,
  requestReport,
  reviewExtension,
  reviewTransfer,
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
  FileText,
  Users,
  Plus,
  Check,
  X,
  PlusCircle,
  HelpCircle,
  Clock,
  Send,
  AlertTriangle,
} from "lucide-react";

export default function ManagerProjectsPage() {
  const [project, setProject] = useState(null);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Layout tabs
  const [activeTab, setActiveTab] = useState("tasks"); // 'tasks' | 'docs' | 'team'

  // Documentation state
  const [docText, setDocText] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);

  // Member assignment state
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [assigningMember, setAssigningMember] = useState(false);

  // Task creation state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPoints, setTaskPoints] = useState(1);
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskStart, setTaskStart] = useState("");
  const [taskEnd, setTaskEnd] = useState("");
  const [creatingTaskState, setCreatingTaskState] = useState(false);

  const loadProject = async () => {
    try {
      setLoading(true);
      const projList = await getProjects();
      const firstProj = projList.data.data?.[0];
      if (firstProj) {
        const details = await getProjectDetails(firstProj.id);
        setProject(details.data.data);
        setDocText(details.data.data.documentation || "");

        const empRes = await getAvailableEmployees();
        setAvailableEmployees(empRes.data.data || []);
      } else {
        setProject(null);
      }
    } catch (err) {
      toast.error("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, []);

  const handleDocSave = async () => {
    if (!project) return;
    try {
      setSavingDoc(true);
      await updateDocumentation(project.id, docText);
      toast.success("Documentation saved successfully.");
    } catch (err) {
      toast.error("Failed to update documentation.");
    } finally {
      setSavingDoc(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!project || !selectedEmpId) return;
    try {
      setAssigningMember(true);
      await assignMembers(project.id, [selectedEmpId]);
      toast.success("Member added to project successfully!");
      setSelectedEmpId("");
      const details = await getProjectDetails(project.id);
      setProject(details.data.data);
      const empRes = await getAvailableEmployees();
      setAvailableEmployees(empRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign member.");
    } finally {
      setAssigningMember(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!project || !taskTitle || !taskAssignee || !taskStart || !taskEnd) {
      toast.error("Please fill in all required task fields.");
      return;
    }
    try {
      setCreatingTaskState(true);
      await createTask(project.id, {
        title: taskTitle,
        description: taskDesc,
        points: taskPoints,
        assignedTo: taskAssignee,
        startDate: taskStart,
        endDate: taskEnd,
      });
      toast.success("Task created and assigned successfully!");
      setTaskTitle("");
      setTaskDesc("");
      setTaskPoints(1);
      setTaskAssignee("");
      setTaskStart("");
      setTaskEnd("");
      const details = await getProjectDetails(project.id);
      setProject(details.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task.");
    } finally {
      setCreatingTaskState(false);
    }
  };

  const handleRequestReport = async (taskId) => {
    try {
      await requestReport(taskId);
      toast.success("Report request sent to employee.");
      const details = await getProjectDetails(project.id);
      setProject(details.data.data);
    } catch (err) {
      toast.error("Failed to request report.");
    }
  };

  const handleReviewExtension = async (taskId, action) => {
    try {
      await reviewExtension(taskId, action);
      toast.success(
        `Extension request ${action === "approve" ? "approved" : "rejected"}.`,
      );
      const details = await getProjectDetails(project.id);
      setProject(details.data.data);
    } catch (err) {
      toast.error("Failed to process extension review.");
    }
  };

  const handleReviewTransfer = async (taskId, action) => {
    try {
      await reviewTransfer(taskId, action);
      toast.success(
        `Transfer request ${action === "approve" ? "approved" : "rejected"}.`,
      );
      const details = await getProjectDetails(project.id);
      setProject(details.data.data);
    } catch (err) {
      toast.error("Failed to process transfer review.");
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
        <h2>No Assigned Projects</h2>
        <p>
          You have not been assigned to any project by the administrator yet.
        </p>
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
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "var(--space-6)",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "var(--space-4)",
        }}
      >
        <div>
          <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: 800 }}>
            {project.name}
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--font-size-sm)",
              marginTop: "4px",
            }}
          >
            Project Manager Workspace · Timeline:{" "}
            <strong>
              {projStartStr} - {projEndStr}
            </strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant={activeTab === "tasks" ? "brand" : "ghost"}
            onClick={() => setActiveTab("tasks")}
          >
            Tasks Kanban
          </Button>
          <Button
            variant={activeTab === "docs" ? "brand" : "ghost"}
            onClick={() => setActiveTab("docs")}
          >
            Documentation
          </Button>
          <Button
            variant={activeTab === "team" ? "brand" : "ghost"}
            onClick={() => setActiveTab("team")}
          >
            Project Team
          </Button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}

      {activeTab === "docs" && (
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <FileText size={18} /> Documentation Wiki
            </CardTitle>
          </CardHeader>
          <CardContent style={{ padding: "var(--space-4)" }}>
            <textarea
              placeholder="Write specifications, architecture guides or workflow requirements..."
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              style={{
                minHeight: "250px",
                marginBottom: "var(--space-4)",
                fontSize: "var(--font-size-base)",
              }}
            />
            <Button
              onClick={handleDocSave}
              variant="brand"
              disabled={savingDoc}
            >
              {savingDoc ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "team" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            lg: "1fr 2fr",
            gap: "var(--space-6)",
          }}
        >
          {/* Add Member Card */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Add Member to Project</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: "var(--space-4)" }}>
              <form
                onSubmit={handleAddMember}
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
                    Available Employees
                  </label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    required
                  >
                    <option value="">Select an employee</option>
                    {availableEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="submit"
                  variant="brand"
                  disabled={assigningMember || !selectedEmpId}
                >
                  Add Member
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Users size={18} /> Current Members (
                {project.members?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: "0" }}>
              {project.members && project.members.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {project.members.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        padding: "12px 20px",
                        borderBottom: "1px solid var(--color-border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <h4 style={{ fontWeight: 700 }}>
                          {member.firstName} {member.lastName}
                        </h4>
                        <p
                          style={{
                            fontSize: "var(--font-size-xs)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {member.designation} · {member.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    padding: "var(--space-4)",
                  }}
                >
                  No members added to this project yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "tasks" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            lg: "1fr 2fr",
            gap: "var(--space-6)",
          }}
        >
          {/* Create Task Form */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Create & Assign Task</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: "var(--space-4)" }}>
              <form
                onSubmit={handleCreateTask}
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
                    Task Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Implement Postgres DB schema"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                  />
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
                    Task Description
                  </label>
                  <textarea
                    placeholder="Deliverables and task requirements..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    style={{ minHeight: "60px" }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "var(--space-3)",
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
                      Story Points *
                    </label>
                    <select
                      value={taskPoints}
                      onChange={(e) => setTaskPoints(e.target.value)}
                      required
                    >
                      <option value="1">1 Point</option>
                      <option value="2">2 Points</option>
                      <option value="3">3 Points</option>
                      <option value="5">5 Points</option>
                      <option value="8">8 Points</option>
                      <option value="13">13 Points</option>
                    </select>
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
                      Assignee *
                    </label>
                    <select
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      required
                    >
                      <option value="">Select Member</option>
                      {project.members?.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "var(--space-3)",
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
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={taskStart}
                      onChange={(e) => setTaskStart(e.target.value)}
                      required
                    />
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
                    <input
                      type="date"
                      value={taskEnd}
                      onChange={(e) => setTaskEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="brand"
                  disabled={creatingTaskState}
                >
                  {creatingTaskState ? "Assigning..." : "Assign Task"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            {project.tasks && project.tasks.length > 0 ? (
              project.tasks.map((task) => (
                <Card
                  key={task.id}
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
                      <CardTitle style={{ fontSize: "var(--font-size-md)" }}>
                        {task.title}
                      </CardTitle>
                      <p
                        style={{
                          fontSize: "var(--font-size-xs)",
                          color: "var(--color-text-muted)",
                          marginTop: "4px",
                        }}
                      >
                        Assignee:{" "}
                        <strong>
                          {task.assignedTo
                            ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                            : "Unassigned"}
                        </strong>{" "}
                        · Points: <strong>{task.points}</strong>
                      </p>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        fontSize: "var(--font-size-xs)",
                        fontWeight: 700,
                        background:
                          task.status === "Done"
                            ? "var(--color-success-ghost)"
                            : "var(--color-brand-ghost)",
                        color:
                          task.status === "Done"
                            ? "var(--color-success)"
                            : "var(--color-text-primary)",
                        borderRadius: "var(--radius-full)",
                      }}
                    >
                      {task.status}
                    </span>
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
                          marginBottom: "12px",
                        }}
                      >
                        {task.description}
                      </p>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-muted)",
                        borderTop: "1px solid var(--color-border)",
                        paddingTop: "12px",
                      }}
                    >
                      <span>
                        Timeline:{" "}
                        {new Date(task.startDate).toLocaleDateString()} -{" "}
                        {new Date(task.endDate).toLocaleDateString()}
                      </span>

                      {/* Actions */}
                      {task.status !== "Done" && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          {!task.progressRequested && !task.progressReport && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRequestReport(task.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Send size={12} /> Request Report
                            </Button>
                          )}
                          {task.progressRequested && (
                            <span
                              style={{
                                color: "var(--color-warning)",
                                fontWeight: 500,
                              }}
                            >
                              Report Pending
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Progress Report Info */}
                    {task.progressReport && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "10px 14px",
                          background: "var(--color-bg-secondary)",
                          borderRadius: "var(--radius-md)",
                          fontSize: "var(--font-size-sm)",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Progress Update:
                        </span>
                        <p style={{ color: "var(--color-text-secondary)" }}>
                          {task.progressReport}
                        </p>
                      </div>
                    )}

                    {/* Review Extensions */}
                    {task.extensionRequested && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "12px",
                          border: "1px solid var(--color-warning)",
                          borderRadius: "var(--radius-md)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "var(--color-bg-secondary)",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              color: "var(--color-warning)",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "var(--font-size-sm)",
                              fontWeight: 700,
                            }}
                          >
                            <AlertTriangle size={14} /> Extension Requested: +
                            {task.extensionDays} Days
                          </span>
                          <p
                            style={{
                              fontSize: "var(--font-size-xs)",
                              color: "var(--color-text-muted)",
                              marginTop: "4px",
                            }}
                          >
                            Reason: "{task.extensionReason}"
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              handleReviewExtension(task.id, "approve")
                            }
                            style={{ padding: "6px" }}
                          >
                            <Check size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              handleReviewExtension(task.id, "reject")
                            }
                            style={{ padding: "6px" }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Review Transfers */}
                    {task.transferRequested && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "12px",
                          border: "1px solid var(--color-danger)",
                          borderRadius: "var(--radius-md)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "var(--color-bg-secondary)",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              color: "var(--color-danger)",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "var(--font-size-sm)",
                              fontWeight: 700,
                            }}
                          >
                            <AlertTriangle size={14} /> Transfer Task Requested
                          </span>
                          <p
                            style={{
                              fontSize: "var(--font-size-xs)",
                              color: "var(--color-text-muted)",
                              marginTop: "4px",
                            }}
                          >
                            Reason: "{task.transferReason}"
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              handleReviewTransfer(task.id, "approve")
                            }
                            style={{ padding: "6px" }}
                          >
                            <Check size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              handleReviewTransfer(task.id, "reject")
                            }
                            style={{ padding: "6px" }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-12)",
                  color: "var(--color-text-muted)",
                  background: "var(--color-bg-secondary)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <Clock size={24} />
                <p>No tasks created for this project yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
