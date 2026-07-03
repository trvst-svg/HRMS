import { useState } from "react";
import { getHolidays, createHoliday, deleteHoliday } from "../../api/adminApi";
import { useAuth } from "../../hooks/useAuth";
import Table from "../../components/ui/Table";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";
import { useApi } from "../../hooks/useApi";
import { formatDate } from "../../utils/helpers";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function HolidaysPage() {
  const { role } = useAuth();
  const { data, loading, execute } = useApi(getHolidays);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    type: "Public",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate)
      return toast.error("Name and date required.");
    setSaving(true);
    try {
      await createHoliday({ ...form, endDate: form.endDate || form.startDate });
      toast.success("Holiday added");
      setShow(false);
      execute();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this holiday?")) return;
    try {
      await deleteHoliday(id);
      toast.success("Deleted");
      execute();
    } catch {
      toast.error("Failed");
    }
  };

  const columns = [
    { key: "name", label: "Holiday" },
    {
      key: "startDate",
      label: "Start",
      render: (r) => formatDate(r.startDate || r.date),
    },
    {
      key: "endDate",
      label: "End",
      render: (r) => formatDate(r.endDate || r.startDate || r.date),
    },
    {
      key: "type",
      label: "Type",
      render: (r) => <Badge variant="brand">{r.type}</Badge>,
    },
    {
      key: "description",
      label: "Description",
      render: (r) => r.description || "—",
    },
    ...(role === "admin"
      ? [
          {
            key: "actions",
            label: "",
            render: (r) => (
              <Button
                size="sm"
                variant="ghost"
                icon={Trash2}
                onClick={() => handleDelete(r._id)}
              />
            ),
          },
        ]
      : []),
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
          Holidays
        </h1>
        {role === "admin" && (
          <Button icon={Plus} onClick={() => setShow(true)}>
            Add Holiday
          </Button>
        )}
      </div>
      <Card>
        {loading ? (
          <PageLoader />
        ) : (
          <Table
            columns={columns}
            data={data || []}
            emptyMessage="No holidays"
          />
        )}
      </Card>
      <Modal open={show} onClose={() => setShow(false)} title="Add Holiday">
        <form
          onSubmit={handleCreate}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <div className="form-group">
            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              <label>Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option>Public</option>
              <option>Company</option>
              <option>Optional</option>
              <option>Festival</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
            />
          </div>
          <Button type="submit" loading={saving}>
            Save Holiday
          </Button>
        </form>
      </Modal>
    </div>
  );
}
