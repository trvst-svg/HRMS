import { useState, useEffect, useCallback } from "react";
import {
  getMeetings,
  createMeeting,
  updateMeeting,
  getHrEmployees,
} from "../../api/enterpriseApi";
import { getEmployees } from "../../api/employeeApi";
import { getMyProfile } from "../../api/profileApi";
import { useAuth } from "../../hooks/useAuth";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { StatusBadge } from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";
import {
  Calendar,
  User,
  Clock,
  Edit,
  Plus,
  Search,
  Video,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function MeetingsPage() {
  const { role } = useAuth();
  const [profile, setProfile] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [hrEmployees, setHrEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    type: "Interview",
    employeeId: "",
    candidateName: "",
    conductedBy: "",
    scheduledAt: "",
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  const [showAssign, setShowAssign] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [assignForm, setAssignForm] = useState({ conductedBy: "" });
  const [assigning, setAssigning] = useState(false);

  const isHR =
    role === "admin" ||
    (profile?.department &&
      String(profile.department).trim().toUpperCase() === "HR");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load user profile
      const profRes = await getMyProfile();
      const userProfile = profRes.data.data;
      setProfile(userProfile);

      // 2. Load meetings
      const meetRes = await getMeetings();
      setMeetings(meetRes.data.data || []);

      // 3. Load HR employees and All employees if user is HR/Admin
      const userIsHR =
        role === "admin" ||
        (userProfile?.department &&
          String(userProfile.department).trim().toUpperCase() === "HR");
      if (userIsHR) {
        const [hrRes, empRes] = await Promise.all([
          getHrEmployees(),
          getEmployees({ limit: 500 }),
        ]);
        setHrEmployees(hrRes.data.data || []);
        setAllEmployees(empRes.data.data || []);
      }
    } catch (err) {
      toast.error("Failed to load meetings data.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.title || !createForm.scheduledAt) {
      return toast.error("Title and Scheduled Date/Time are required.");
    }
    setCreating(true);
    try {
      const payload = {
        ...createForm,
        employeeId: createForm.employeeId || null,
        conductedBy: createForm.conductedBy || null,
      };
      await createMeeting(payload);
      toast.success("Meeting scheduled successfully.");
      setShowCreate(false);
      setCreateForm({
        title: "",
        type: "Interview",
        employeeId: "",
        candidateName: "",
        conductedBy: "",
        scheduledAt: "",
        notes: "",
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule meeting.");
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!activeMeeting) return;
    setAssigning(true);
    try {
      await updateMeeting(activeMeeting.id, {
        conductedBy: assignForm.conductedBy || null,
      });
      toast.success("Interviewer/host assigned successfully.");
      setShowAssign(false);
      setActiveMeeting(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign host.");
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateMeeting(id, { status });
      toast.success(`Meeting status updated to ${status}.`);
      loadData();
    } catch (err) {
      toast.error("Failed to update meeting status.");
    }
  };

  // Filter meetings
  const filteredMeetings = meetings.filter((m) => {
    const matchSearch =
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
      `${m.firstName || ""} ${m.lastName || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchType = !typeFilter || m.type === typeFilter;
    const matchStatus = !statusFilter || m.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const columns = [
    {
      key: "title",
      label: "Title & Type",
      render: (m) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
            {m.title}
          </div>
          <span
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-muted)",
              textTransform: "capitalize",
            }}
          >
            {m.type}
          </span>
        </div>
      ),
    },
    {
      key: "participant",
      label: "Participant",
      render: (m) => {
        if (m.employeeId) {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={14} style={{ color: "var(--color-text-muted)" }} />
              <div>
                <div>
                  {m.firstName} {m.lastName}
                </div>
                <span
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {m.employeeId}
                </span>
              </div>
            </div>
          );
        } else {
          return (
            <div>
              <div style={{ fontWeight: 500 }}>
                {m.candidateName || "External Candidate"}
              </div>
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                New Hire Interviewee
              </span>
            </div>
          );
        }
      },
    },
    {
      key: "conductedBy",
      label: "Interviewer / Host",
      render: (m) => {
        if (m.condEmployeeId) {
          return (
            <div>
              <div>
                {m.condFirstName} {m.condLastName}
              </div>
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                HR Department
              </span>
            </div>
          );
        }
        return (
          <span style={{ color: "var(--color-danger)", fontWeight: 500 }}>
            Not Assigned
          </span>
        );
      },
    },
    {
      key: "scheduledAt",
      label: "Scheduled Time",
      render: (m) => {
        const date = new Date(m.scheduledAt);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={14} style={{ color: "var(--color-text-muted)" }} />
            <div>
              <div>{formatDate(m.scheduledAt)}</div>
              <div
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                {date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (m) => <StatusBadge status={m.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (m) => (
        <div style={{ display: "flex", gap: "8px" }}>
          {isHR && (
            <Button
              size="sm"
              variant="secondary"
              icon={Edit}
              onClick={() => {
                setActiveMeeting(m);
                setAssignForm({ conductedBy: m.conducted_by || "" });
                setShowAssign(true);
              }}
            >
              Assign
            </Button>
          )}
          {isHR && m.status === "Scheduled" && (
            <>
              <Button
                size="sm"
                variant="success"
                icon={CheckCircle}
                onClick={() => handleStatusUpdate(m.id, "Completed")}
              >
                Complete
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={XCircle}
                onClick={() => handleStatusUpdate(m.id, "Cancelled")}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700 }}>
            Meetings & Interviews
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Schedule and coordinate new hire interviews, employee reviews, and
            department onboarding sessions.
          </p>
        </div>
        {isHR && (
          <Button icon={Plus} onClick={() => setShowCreate(true)}>
            Schedule Session
          </Button>
        )}
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "var(--space-4)",
            }}
          >
            <div className="form-group">
              <label>Search</label>
              <div style={{ position: "relative" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "14px",
                    color: "var(--color-text-muted)",
                  }}
                />
                <input
                  style={{ paddingLeft: "36px" }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search meeting, candidate, staff..."
                />
              </div>
            </div>
            <div className="form-group">
              <label>Meeting Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Interview">Interview</option>
                <option value="Performance Review">Performance Review</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Meeting">Meeting</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meetings List */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Sessions ({filteredMeetings.length})</CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          <Table columns={columns} data={filteredMeetings} />
        </CardContent>
      </Card>

      {/* Create Meeting Modal */}
      {showCreate && (
        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="Schedule New Meeting / Interview"
          wide
        >
          <form
            onSubmit={handleCreate}
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
                <label>Meeting Title *</label>
                <input
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, title: e.target.value })
                  }
                  placeholder="e.g. Senior Frontend Dev Technical Interview"
                  required
                />
              </div>
              <div className="form-group">
                <label>Meeting Type</label>
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, type: e.target.value })
                  }
                >
                  <option value="Interview">Interview</option>
                  <option value="Performance Review">Performance Review</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Meeting">Meeting</option>
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
                <label>Internal Employee (For Appraisal/Onboarding)</label>
                <select
                  value={createForm.employeeId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, employeeId: e.target.value })
                  }
                >
                  <option value="">
                    Select current employee (optional)...
                  </option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  External Candidate Name (For Recruitment Interviews)
                </label>
                <input
                  value={createForm.candidateName}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      candidateName: e.target.value,
                    })
                  }
                  placeholder="e.g. Alice Smith (Leave blank if employee selected)"
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
                <label>Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  value={createForm.scheduledAt}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      scheduledAt: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Assign HR Conductor / Host</label>
                <select
                  value={createForm.conductedBy}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      conductedBy: e.target.value,
                    })
                  }
                >
                  <option value="">Select HR employee...</option>
                  {hrEmployees.map((hr) => (
                    <option key={hr.id} value={hr.id}>
                      {hr.firstName} {hr.lastName} ({hr.designation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description & Notes</label>
              <textarea
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm({ ...createForm, notes: e.target.value })
                }
                placeholder="Add meeting agenda, video link, or candidate requirements..."
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                marginTop: "var(--space-2)",
              }}
            >
              <Button type="submit" loading={creating}>
                Schedule
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Interviewer Modal */}
      {showAssign && (
        <Modal
          open={showAssign}
          onClose={() => setShowAssign(false)}
          title="Assign Host / Interviewer"
        >
          <form
            onSubmit={handleAssign}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div className="form-group">
              <label>HR Representative</label>
              <select
                value={assignForm.conductedBy}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, conductedBy: e.target.value })
                }
              >
                <option value="">Unassigned (Host yourself)</option>
                {hrEmployees.map((hr) => (
                  <option key={hr.id} value={hr.id}>
                    {hr.firstName} {hr.lastName} ({hr.designation})
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                marginTop: "var(--space-2)",
              }}
            >
              <Button type="submit" loading={assigning}>
                Confirm Assignment
              </Button>
              <Button variant="ghost" onClick={() => setShowAssign(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
