import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  changeMyPassword,
  requestChangePasswordOtp,
} from "../../api/profileApi";
import Card, { CardContent } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Lock, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    otp: "",
  });
  const [saving, setSaving] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleRequestOtp = async () => {
    setSending(true);
    try {
      await requestChangePasswordOtp();
      setOtpSent(true);
      toast.success("OTP sent to your email.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.otp)
      return toast.error("All fields required.");
    if (form.newPassword.length < 6)
      return toast.error("New password must be at least 6 characters.");
    setSaving(true);
    try {
      await changeMyPassword(form);
      toast.success("Password changed!");
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
        Change Password
      </h1>
      <Card style={{ maxWidth: 480 }}>
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
              <label>Current Password</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) =>
                  setForm({ ...form, currentPassword: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) =>
                  setForm({ ...form, newPassword: e.target.value })
                }
                minLength={6}
                required
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              icon={Send}
              onClick={handleRequestOtp}
              loading={sending}
              disabled={otpSent}
            >
              {otpSent ? "OTP Sent" : "Send OTP"}
            </Button>
            <div className="form-group">
              <label>OTP</label>
              <input
                type="text"
                value={form.otp}
                onChange={(e) => setForm({ ...form, otp: e.target.value })}
                placeholder="6-digit code"
                maxLength={6}
                required
              />
            </div>
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <Button type="submit" icon={Lock} loading={saving}>
                Change Password
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
