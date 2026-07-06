import { useState } from "react";
import {
  createLeave,
  getMyLeaveRequests,
  createWfh,
  getMyWfhRequests,
} from "../../api/leaveApi";
import Table from "../../components/ui/Table";
import Card, { CardContent } from "../../components/ui/Card";
import Tabs from "../../components/ui/Tabs";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";
import { useApi } from "../../hooks/useApi";
import { formatDate } from "../../utils/helpers";
import { Plus, Calendar, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

export default function LeavePage() {
  const [tab, setTab] = useState("leave");
  const leave = useApi(() => getMyLeaveRequests(), { deps: [tab] });
  const wfh = useApi(() => getMyWfhRequests(), { deps: [tab] });
  const active = tab === "leave" ? leave : wfh;
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    from: "",
    to: "",
    type: "Annual",
    reason: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.from) return toast.error("Start date required.");
    setSaving(true);
    try {
      if (tab === "leave") await createLeave(form);
      else
        await createWfh({ from: form.from, to: form.to, reason: form.reason });
      toast.success("Request submitted!");
      setShow(false);
      active.execute();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    ...(tab === "leave"
      ? [{ key: "type", label: "Type", render: (r) => r.type || "—" }]
      : []),
    { key: "from", label: "From", render: (r) => formatDate(r.from) },
    { key: "to", label: "To", render: (r) => formatDate(r.to) },
    { key: "reason", label: "Reason", render: (r) => r.reason || "—" },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
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
          Leave & WFH
        </h1>
        <Button icon={Plus} onClick={() => setShow(true)}>
          New Request
        </Button>
      </div>
      <Tabs
        tabs={[
          { value: "leave", label: "Leave", icon: Calendar },
          { value: "wfh", label: "WFH", icon: Briefcase },
        ]}
        activeTab={tab}
        onChange={setTab}
      />
      <Card style={{ marginTop: "var(--space-4)" }}>
        {active.loading ? (
          <PageLoader />
        ) : (
          <Table
            columns={columns}
            data={active.data || []}
            emptyMessage="No requests"
          />
        )}
      </Card>
      <Modal
        open={show}
        onClose={() => setShow(false)}
        title={tab === "leave" ? "Apply for Leave" : "Apply for WFH"}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          {tab === "leave" && (
            <div className="form-group">
              <label>Leave Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option>Annual</option>
                <option>Sick</option>
                <option>Casual</option>
                <option>Other</option>
              </select>
            </div>
          )}
          <div className="form-grid">
            <div className="form-group">
              <label>From</label>
              <input
                type="date"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>To</label>
              <input
                type="date"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={2}
            />
          </div>
          <Button type="submit" loading={saving}>
            Submit Request
          </Button>
        </form>
      </Modal>
    </div>
  );
}
