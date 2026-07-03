import { useState, useEffect } from "react";
import {
  getAllAssets,
  getMyAssets,
  createAsset,
  updateAsset,
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
import { Plus, Search, Laptop, Monitor, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/helpers";

export default function AssetsPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    serialNumber: "",
    category: "Hardware",
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  // Assign modal state
  const [showAssign, setShowAssign] = useState(false);
  const [assigningAsset, setAssigningAsset] = useState(null);
  const [assignForm, setAssignForm] = useState({
    assignedTo: "",
    status: "Assigned",
    notes: "",
  });
  const [assigning, setAssigning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = isAdmin ? await getAllAssets() : await getMyAssets();
      setData(res.data.data || []);

      if (isAdmin) {
        const empRes = await getEmployees({ limit: 500 });
        setEmployees(empRes.data.data || []);
      }
    } catch {
      toast.error("Failed to load assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.serialNumber) {
      return toast.error("Name and serial number are required.");
    }
    setCreating(true);
    try {
      await createAsset(createForm);
      toast.success("Asset added successfully.");
      setShowCreate(false);
      setCreateForm({
        name: "",
        serialNumber: "",
        category: "Hardware",
        notes: "",
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add asset.");
    } finally {
      setCreating(false);
    }
  };

  const handleAssignAsset = async (e) => {
    e.preventDefault();
    setAssigning(true);
    try {
      const payload = {
        assignedTo: assignForm.assignedTo || null,
        status: assignForm.assignedTo ? "Assigned" : "Available",
        notes: assignForm.notes,
      };
      await updateAsset(assigningAsset.id, payload);
      toast.success("Asset assignment updated.");
      setShowAssign(false);
      setAssigningAsset(null);
      setAssignForm({ assignedTo: "", status: "Assigned", notes: "" });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment failed.");
    } finally {
      setAssigning(false);
    }
  };

  const openAssignModal = (asset) => {
    setAssigningAsset(asset);
    setAssignForm({
      assignedTo: asset.assigned_to || "",
      status: asset.status || "Assigned",
      notes: asset.notes || "",
    });
    setShowAssign(true);
  };

  const filteredData = data.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(term) ||
      item.serialNumber?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term) ||
      item.employeeId?.toLowerCase().includes(term) ||
      item.firstName?.toLowerCase().includes(term) ||
      item.lastName?.toLowerCase().includes(term)
    );
  });

  const columns = [
    { key: "name", label: "Asset Name" },
    { key: "serialNumber", label: "Serial Number" },
    { key: "category", label: "Category" },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    ...(isAdmin
      ? [
          {
            key: "assignedTo",
            label: "Assigned To",
            render: (r) =>
              r.assigned_to
                ? `${r.firstName || ""} ${r.lastName || ""} (${r.employeeId || ""})`
                : "—",
          },
          {
            key: "actions",
            label: "Actions",
            render: (r) => (
              <Button
                size="sm"
                variant="ghost"
                icon={UserCheck}
                onClick={() => openAssignModal(r)}
                title="Assign / Release Asset"
              />
            ),
          },
        ]
      : [
          {
            key: "assignedAt",
            label: "Assigned Date",
            render: (r) => (r.assignedAt ? formatDate(r.assignedAt) : "—"),
          },
        ]),
    { key: "notes", label: "Notes", render: (r) => r.notes || "—" },
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
          Company Assets
        </h1>
        {isAdmin && (
          <Button icon={Plus} onClick={() => setShowCreate(true)}>
            Add Asset
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
                placeholder="Search assets by name or serial number..."
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
            emptyMessage="No assets registered."
          />
        )}
      </Card>

      {/* Add Asset Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add Asset"
      >
        <form
          onSubmit={handleCreateAsset}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <div className="form-group">
            <label>Asset Name *</label>
            <input
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              placeholder="MacBook Pro 16"
              required
            />
          </div>
          <div className="form-group">
            <label>Serial Number *</label>
            <input
              value={createForm.serialNumber}
              onChange={(e) =>
                setCreateForm({ ...createForm, serialNumber: e.target.value })
              }
              placeholder="C02ZX123LVDD"
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={createForm.category}
              onChange={(e) =>
                setCreateForm({ ...createForm, category: e.target.value })
              }
            >
              <option value="Laptop">Laptop</option>
              <option value="Monitor">Monitor</option>
              <option value="Peripherals">Keyboard/Mouse/Accessory</option>
              <option value="Mobile">Mobile/Tablet</option>
              <option value="Software">Software License</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={createForm.notes}
              onChange={(e) =>
                setCreateForm({ ...createForm, notes: e.target.value })
              }
              placeholder="Configuration details or asset condition"
            />
          </div>
          <Button type="submit" loading={creating}>
            Add Asset
          </Button>
        </form>
      </Modal>

      {/* Assign Asset Modal */}
      {assigningAsset && (
        <Modal
          open={showAssign}
          onClose={() => setShowAssign(false)}
          title={`Assign / Release: ${assigningAsset.name}`}
        >
          <form
            onSubmit={handleAssignAsset}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div className="form-group">
              <label>Assign to Employee</label>
              <select
                value={assignForm.assignedTo}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, assignedTo: e.target.value })
                }
              >
                <option value="">Unassigned (Available)</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Notes / Remarks</label>
              <textarea
                value={assignForm.notes}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, notes: e.target.value })
                }
                placeholder="Condition during handover"
              />
            </div>
            <Button type="submit" loading={assigning}>
              Save Assignment
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
