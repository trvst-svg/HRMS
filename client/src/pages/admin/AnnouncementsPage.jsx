import { useState } from "react";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../../api/adminApi";
import { useAuth } from "../../hooks/useAuth";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { useApi } from "../../hooks/useApi";
import { formatDate } from "../../utils/helpers";
import { Plus, Trash2, Megaphone } from "lucide-react";
import toast from "react-hot-toast";

export default function AnnouncementsPage() {
  const { role } = useAuth();
  const { data, loading, execute } = useApi(getAnnouncements);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "General",
    audience: "All",
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content)
      return toast.error("Title and content required.");
    setSaving(true);
    try {
      await createAnnouncement(form);
      toast.success("Announcement created");
      setShow(false);
      setForm({ title: "", content: "", type: "General", audience: "All" });
      execute();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      toast.success("Deleted");
      execute();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">
          Announcements
        </h1>
        <Button icon={Plus} onClick={() => setShow(true)}>
          New Announcement
        </Button>
      </div>
      {loading ? (
        <PageLoader />
      ) : !data?.length ? (
        <EmptyState icon={Megaphone} title="No announcements yet" />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {data.map((a) => (
            <Card key={a._id} hover className="animate-fade-in-up">
              <CardHeader>
                <CardTitle>{a.title}</CardTitle>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <Badge variant="brand">{a.type}</Badge>
                  {role === "admin" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      onClick={() => handleDelete(a._id)}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p
                  style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-secondary)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  {a.content}
                </p>
                <span
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {formatDate(a.createdAt)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Modal
        open={show}
        onClose={() => setShow(false)}
        title="New Announcement"
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
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={3}
              required
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option>General</option>
                <option>HR</option>
                <option>Holiday</option>
                <option>System</option>
              </select>
            </div>
            <div className="form-group">
              <label>Audience</label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
              >
                <option>All</option>
                <option>Employees</option>
                <option>Admins</option>
              </select>
            </div>
          </div>
          <Button type="submit" loading={saving}>
            Publish
          </Button>
        </form>
      </Modal>
    </div>
  );
}
