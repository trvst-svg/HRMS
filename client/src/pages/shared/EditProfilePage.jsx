import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, updateMyProfile } from "../../api/profileApi";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { useApi } from "../../hooks/useApi";
import { Save } from "lucide-react";
import toast from "react-hot-toast";

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { data, loading: fetching } = useApi(getMyProfile);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  if (fetching) return <PageLoader />;
  if (!form && data) {
    const p = data;
    setTimeout(
      () =>
        setForm({
          firstName: p.firstName || p.name?.split(" ")[0] || "",
          lastName: p.lastName || p.name?.split(" ").slice(1).join(" ") || "",
          phone: p.phone || "",
          designation: p.designation || "",
        }),
      0,
    );
    return <PageLoader />;
  }
  if (!form) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName) return toast.error("First name required.");
    setSaving(true);
    try {
      await updateMyProfile(form);
      toast.success("Profile updated!");
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1
        style={{
          fontSize: "var(--font-size-2xl)",
          fontWeight: 700,
          marginBottom: "var(--space-6)",
        }}
      >
        Edit Profile
      </h1>
      <Card style={{ maxWidth: 520 }}>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div className="form-group">
              <label>First Name</label>
              <input
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Designation</label>
              <input
                value={form.designation}
                onChange={(e) =>
                  setForm({ ...form, designation: e.target.value })
                }
              />
            </div>
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <Button type="submit" icon={Save} loading={saving}>
                Save
              </Button>
              <Button variant="ghost" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
