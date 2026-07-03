import { useState, useEffect } from "react";
import {
  getAllReviews,
  getMyReviews,
  createReviewCycle,
  submitSelfReview,
  submitManagerReview,
} from "../../api/enterpriseApi";
import { getEmployees } from "../../api/employeeApi";
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
import { Plus, Search, Award, Star, FileEdit } from "lucide-react";
import toast from "react-hot-toast";

export default function AppraisalsPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create cycle modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    employeeId: "",
    reviewCycle: "2026-H1",
  });
  const [creating, setCreating] = useState(false);

  // Self review modal state
  const [showSelf, setShowSelf] = useState(false);
  const [activeSelfReview, setActiveSelfReview] = useState(null);
  const [selfForm, setSelfForm] = useState({ selfRating: 3, selfFeedback: "" });
  const [submittingSelf, setSubmittingSelf] = useState(false);

  // Manager review modal state
  const [showManager, setShowManager] = useState(false);
  const [activeManagerReview, setActiveManagerReview] = useState(null);
  const [managerForm, setManagerForm] = useState({
    managerRating: 3,
    managerFeedback: "",
    overallRating: 3,
  });
  const [submittingManager, setSubmittingManager] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = isAdmin ? await getAllReviews() : await getMyReviews();
      setData(res.data.data || []);

      if (isAdmin) {
        const empRes = await getEmployees({ limit: 500 });
        setEmployees(empRes.data.data || []);
      }
    } catch {
      toast.error("Failed to load appraisals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    if (!createForm.employeeId || !createForm.reviewCycle) {
      return toast.error("Employee and review cycle are required.");
    }
    setCreating(true);
    try {
      await createReviewCycle(createForm);
      toast.success("Appraisal cycle initialized.");
      setShowCreate(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initialize cycle.");
    } finally {
      setCreating(false);
    }
  };

  const handleSelfSubmit = async (e) => {
    e.preventDefault();
    setSubmittingSelf(true);
    try {
      await submitSelfReview(activeSelfReview.id, selfForm);
      toast.success("Self appraisal submitted.");
      setShowSelf(false);
      setActiveSelfReview(null);
      setSelfForm({ selfRating: 3, selfFeedback: "" });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed.");
    } finally {
      setSubmittingSelf(false);
    }
  };

  const handleManagerSubmit = async (e) => {
    e.preventDefault();
    setSubmittingManager(true);
    try {
      await submitManagerReview(activeManagerReview.id, managerForm);
      toast.success("Appraisal completed successfully.");
      setShowManager(false);
      setActiveManagerReview(null);
      setManagerForm({
        managerRating: 3,
        managerFeedback: "",
        overallRating: 3,
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete review.");
    } finally {
      setSubmittingManager(false);
    }
  };

  const openSelfModal = (review) => {
    setActiveSelfReview(review);
    setSelfForm({
      selfRating: review.selfRating || 3,
      selfFeedback: review.selfFeedback || "",
    });
    setShowSelf(true);
  };

  const openManagerModal = (review) => {
    setActiveManagerReview(review);
    setManagerForm({
      managerRating: review.managerRating || 3,
      managerFeedback: review.managerFeedback || "",
      overallRating: review.overallRating || 3,
    });
    setShowManager(true);
  };

  const filteredData = data.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.reviewCycle?.toLowerCase().includes(term) ||
      item.employeeId?.toLowerCase().includes(term) ||
      item.firstName?.toLowerCase().includes(term) ||
      item.lastName?.toLowerCase().includes(term)
    );
  });

  const columns = [
    ...(isAdmin
      ? [
          {
            key: "employee",
            label: "Employee",
            render: (r) =>
              `${r.firstName || ""} ${r.lastName || ""} (${r.employeeId || ""})`,
          },
        ]
      : []),
    { key: "reviewCycle", label: "Cycle" },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "selfRating",
      label: "Self Rating",
      render: (r) => (r.selfRating ? `${r.selfRating} / 5` : "—"),
    },
    {
      key: "managerRating",
      label: "Mgr Rating",
      render: (r) => (r.managerRating ? `${r.managerRating} / 5` : "—"),
    },
    {
      key: "overallRating",
      label: "Overall",
      render: (r) =>
        r.overallRating ? (
          <strong style={{ color: "var(--color-primary)" }}>
            {r.overallRating} / 5
          </strong>
        ) : (
          "—"
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => {
        if (!isAdmin && r.status === "Pending Self") {
          return (
            <Button size="sm" icon={FileEdit} onClick={() => openSelfModal(r)}>
              Write Self Appraisal
            </Button>
          );
        }
        if (isAdmin && r.status === "Pending Manager") {
          return (
            <Button size="sm" icon={Award} onClick={() => openManagerModal(r)}>
              Evaluate & Complete
            </Button>
          );
        }
        return "—";
      },
    },
  ];

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
          Performance Appraisals
        </h1>
        {isAdmin && (
          <Button icon={Plus} onClick={() => setShowCreate(true)}>
            Initialize Review
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <div
            style={{
              display: "flex",
              gap: "var(--space-3)",
              flexWrap: "wrap",
              marginBottom: "var(--space-4)",
            }}
          >
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                }}
              />
              <input
                placeholder="Search reviews by cycle or employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            data={filteredData}
            emptyMessage="No appraisals found."
          />
        )}
      </Card>

      {/* Initialize review cycle */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Initialize Performance Appraisal"
      >
        <form
          onSubmit={handleCreateCycle}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <div className="form-group">
            <label>Employee</label>
            <select
              value={createForm.employeeId}
              onChange={(e) =>
                setCreateForm({ ...createForm, employeeId: e.target.value })
              }
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
            <label>Review Cycle Name</label>
            <input
              value={createForm.reviewCycle}
              onChange={(e) =>
                setCreateForm({ ...createForm, reviewCycle: e.target.value })
              }
              placeholder="e.g., 2026-H1"
              required
            />
          </div>
          <Button type="submit" loading={creating}>
            Initialize Review
          </Button>
        </form>
      </Modal>

      {/* Self Appraisal modal */}
      {activeSelfReview && (
        <Modal
          open={showSelf}
          onClose={() => setShowSelf(false)}
          title={`Self Appraisal: ${activeSelfReview.reviewCycle}`}
        >
          <form
            onSubmit={handleSelfSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div className="form-group">
              <label>Self Rating (1 to 5) *</label>
              <select
                value={selfForm.selfRating}
                onChange={(e) =>
                  setSelfForm({
                    ...selfForm,
                    selfRating: Number(e.target.value),
                  })
                }
              >
                <option value="1">1 - Unsatisfactory</option>
                <option value="2">2 - Needs Improvement</option>
                <option value="3">3 - Meets Expectations</option>
                <option value="4">4 - Exceeds Expectations</option>
                <option value="5">5 - Outstanding</option>
              </select>
            </div>
            <div className="form-group">
              <label>Self Feedback / Accomplishments *</label>
              <textarea
                value={selfForm.selfFeedback}
                onChange={(e) =>
                  setSelfForm({ ...selfForm, selfFeedback: e.target.value })
                }
                placeholder="Detail your accomplishments and challenges during this cycle"
                required
              />
            </div>
            <Button type="submit" loading={submittingSelf}>
              Submit Appraisal
            </Button>
          </form>
        </Modal>
      )}

      {/* Manager Evaluation modal */}
      {activeManagerReview && (
        <Modal
          open={showManager}
          onClose={() => setShowManager(false)}
          title={`Manager Evaluation: ${activeManagerReview.firstName} ${activeManagerReview.lastName}`}
        >
          <form
            onSubmit={handleManagerSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div
              style={{
                padding: "var(--space-3)",
                background: "var(--color-bg-subtle)",
                borderRadius: "var(--border-radius-md)",
                marginBottom: "var(--space-2)",
              }}
            >
              <h4
                style={{
                  margin: "0 0 var(--space-1) 0",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 600,
                }}
              >
                Employee Self Evaluation:
              </h4>
              <p
                style={{
                  margin: "0 0 var(--space-2) 0",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                "{activeManagerReview.selfFeedback}"
              </p>
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Self Rating: {activeManagerReview.selfRating} / 5
              </span>
            </div>
            <div className="form-group">
              <label>Manager Rating (1 to 5) *</label>
              <select
                value={managerForm.managerRating}
                onChange={(e) =>
                  setManagerForm({
                    ...managerForm,
                    managerRating: Number(e.target.value),
                  })
                }
              >
                <option value="1">1 - Unsatisfactory</option>
                <option value="2">2 - Needs Improvement</option>
                <option value="3">3 - Meets Expectations</option>
                <option value="4">4 - Exceeds Expectations</option>
                <option value="5">5 - Outstanding</option>
              </select>
            </div>
            <div className="form-group">
              <label>Overall Score (Combined Rating) *</label>
              <select
                value={managerForm.overallRating}
                onChange={(e) =>
                  setManagerForm({
                    ...managerForm,
                    overallRating: Number(e.target.value),
                  })
                }
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div className="form-group">
              <label>Manager Remarks & Growth Feedback *</label>
              <textarea
                value={managerForm.managerFeedback}
                onChange={(e) =>
                  setManagerForm({
                    ...managerForm,
                    managerFeedback: e.target.value,
                  })
                }
                placeholder="Provide performance remarks and constructive growth steps"
                required
              />
            </div>
            <Button type="submit" loading={submittingManager}>
              Complete Evaluation
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
