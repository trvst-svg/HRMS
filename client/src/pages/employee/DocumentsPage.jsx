import { useState } from "react";
import {
  createMyRequest,
  getMyRequests,
  downloadMyApprovedDocument,
} from "../../api/documentsApi";
import Table from "../../components/ui/Table";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";
import { useApi } from "../../hooks/useApi";
import { formatDate } from "../../utils/helpers";
import { Plus, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function DocumentsPage() {
  const { data, loading, execute } = useApi(getMyRequests);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ type: "Experience Letter", purpose: "" });
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createMyRequest(form);
      toast.success("Request submitted");
      setShow(false);
      execute();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await downloadMyApprovedDocument(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `document-${id}.pdf`;
      a.click();
    } catch {
      toast.error("Download failed");
    }
  };

  const columns = [
    { key: "type", label: "Document Type" },
    { key: "purpose", label: "Purpose", render: (r) => r.purpose || "—" },
    {
      key: "createdAt",
      label: "Requested",
      render: (r) => formatDate(r.createdAt),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (r) =>
        r.status === "Approved" ? (
          <Button
            size="sm"
            variant="ghost"
            icon={Download}
            onClick={() => handleDownload(r._id)}
          />
        ) : null,
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
          My Documents
        </h1>
        <Button icon={Plus} onClick={() => setShow(true)}>
          Request Document
        </Button>
      </div>
      <Card>
        {loading ? (
          <PageLoader />
        ) : (
          <Table
            columns={columns}
            data={data || []}
            emptyMessage="No document requests"
          />
        )}
      </Card>
      <Modal
        open={show}
        onClose={() => setShow(false)}
        title="Request Document"
      >
        <form
          onSubmit={handleCreate}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <div className="form-group">
            <label>Document Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option>Experience Letter</option>
              <option>Salary Certificate</option>
              <option>Employment Verification</option>
              <option>No Objection Certificate</option>
            </select>
          </div>
          <div className="form-group">
            <label>Purpose</label>
            <textarea
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              rows={2}
              placeholder="Optional purpose..."
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
