import { useState } from "react";
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
} from "../../api/adminApi";
import Table from "../../components/ui/Table";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { useApi } from "../../hooks/useApi";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DepartmentsPage() {
  const { data, loading, execute } = useApi(getDepartments);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createDepartment({ name: name.trim() });
      toast.success("Department created");
      setShow(false);
      setName("");
      execute();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this department?")) return;
    try {
      await deleteDepartment(id);
      toast.success("Deleted");
      execute();
    } catch {
      toast.error("Failed");
    }
  };

  const columns = [
    { key: "name", label: "Department Name" },
    {
      key: "actions",
      label: "",
      width: "80px",
      render: (r) => (
        <Button
          size="sm"
          variant="ghost"
          icon={Trash2}
          onClick={() => handleDelete(r._id)}
        />
      ),
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
          Departments
        </h1>
        <Button icon={Plus} onClick={() => setShow(true)}>
          Add Department
        </Button>
      </div>
      <Card style={{ maxWidth: 600 }}>
        {loading ? (
          <PageLoader />
        ) : (
          <Table
            columns={columns}
            data={data || []}
            emptyMessage="No departments"
          />
        )}
      </Card>
      <Modal open={show} onClose={() => setShow(false)} title="Add Department">
        <form
          onSubmit={handleCreate}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <div className="form-group">
            <label>Department Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering"
              required
            />
          </div>
          <Button type="submit" loading={saving}>
            Create
          </Button>
        </form>
      </Modal>
    </div>
  );
}
