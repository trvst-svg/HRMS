import { useState, useEffect } from "react";
import {
  getMyExpenses,
  getAllExpenses,
  submitExpenseClaim,
  reviewExpense,
} from "../../api/enterpriseApi";
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
import { Plus, Check, X, Search, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency, formatMonth } from "../../utils/helpers";

export default function ExpensesPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: "",
    amount: "",
    category: "Travel",
    description: "",
    month: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = isAdmin ? await getAllExpenses() : await getMyExpenses();
      setData(res.data.data || []);
    } catch {
      toast.error("Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!submitForm.title || !submitForm.amount || !submitForm.month) {
      return toast.error("Please fill in title, amount, and billing month.");
    }
    setSubmitting(true);
    try {
      await submitExpenseClaim({
        ...submitForm,
        amount: Number(submitForm.amount),
      });
      toast.success("Expense claim submitted successfully.");
      setShowSubmit(false);
      setSubmitForm({
        title: "",
        amount: "",
        category: "Travel",
        description: "",
        month: "",
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id, status, reason = "") => {
    try {
      await reviewExpense(id, { status, rejectionReason: reason });
      toast.success(`Claim ${status.toLowerCase()} successfully.`);
      loadData();
      setShowRejectModal(false);
      setRejectionReason("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Review action failed.");
    }
  };

  const openRejectModal = (id) => {
    setRejectingId(id);
    setShowRejectModal(true);
  };

  const filteredData = data.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term) ||
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
    { key: "title", label: "Title" },
    { key: "category", label: "Category" },
    { key: "month", label: "Month", render: (r) => formatMonth(r.month) },
    { key: "amount", label: "Amount", render: (r) => formatCurrency(r.amount) },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "description",
      label: "Description",
      render: (r) => r.description || "—",
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => {
        if (isAdmin && r.status === "Pending") {
          return (
            <div style={{ display: "flex", gap: 6 }}>
              <Button
                size="sm"
                variant="ghost"
                icon={Check}
                onClick={() => handleReview(r.id, "Approved")}
                style={{ color: "var(--color-success)" }}
              />
              <Button
                size="sm"
                variant="ghost"
                icon={X}
                onClick={() => openRejectModal(r.id)}
                style={{ color: "var(--color-danger)" }}
              />
            </div>
          );
        }
        if (r.status === "Rejected") {
          return (
            <span
              style={{ fontSize: "11px", color: "var(--color-text-muted)" }}
            >
              Reason: {r.rejection_reason || "N/A"}
            </span>
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
          Expense Claims
        </h1>
        {!isAdmin && (
          <Button icon={Plus} onClick={() => setShowSubmit(true)}>
            New Expense Claim
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
                placeholder="Search expenses..."
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
            emptyMessage="No expense claims found."
          />
        )}
      </Card>

      <Modal
        open={showSubmit}
        onClose={() => setShowSubmit(false)}
        title="Submit Expense Claim"
      >
        <form
          onSubmit={handleSubmitClaim}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <div className="form-group">
            <label>Claim Title *</label>
            <input
              value={submitForm.title}
              onChange={(e) =>
                setSubmitForm({ ...submitForm, title: e.target.value })
              }
              placeholder="Internet Bill May"
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
              <label>Amount (NPR) *</label>
              <input
                type="number"
                value={submitForm.amount}
                onChange={(e) =>
                  setSubmitForm({ ...submitForm, amount: e.target.value })
                }
                placeholder="1500"
                required
              />
            </div>
            <div className="form-group">
              <label>Month (For Reimbursement) *</label>
              <input
                type="month"
                value={submitForm.month}
                onChange={(e) =>
                  setSubmitForm({ ...submitForm, month: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={submitForm.category}
              onChange={(e) =>
                setSubmitForm({ ...submitForm, category: e.target.value })
              }
            >
              <option value="Travel">Travel</option>
              <option value="Internet">Internet/Telecom</option>
              <option value="Food">Food/Dining</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Utility">Utility</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description / Notes</label>
            <textarea
              value={submitForm.description}
              onChange={(e) =>
                setSubmitForm({ ...submitForm, description: e.target.value })
              }
              placeholder="Brief details about the expense"
            />
          </div>
          <Button type="submit" loading={submitting}>
            Submit Claim
          </Button>
        </form>
      </Modal>

      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Expense Claim"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <div className="form-group">
            <label>Reason for Rejection *</label>
            <input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Incorrect receipt or details"
            />
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <Button
              onClick={() =>
                handleReview(rejectingId, "Rejected", rejectionReason)
              }
              disabled={!rejectionReason}
            >
              Confirm Reject
            </Button>
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
