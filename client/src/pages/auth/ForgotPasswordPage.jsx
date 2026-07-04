import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  requestForgotPasswordOtp,
  resetForgotPassword,
} from "../../api/authApi";
import Button from "../../components/ui/Button";
import { KeyRound, Mail, Lock, ArrowLeft } from "lucide-react";
import "../auth/LoginPage.css";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1=email, 2=otp+newPass
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError("Please enter your email.");
    setLoading(true);
    setError("");
    try {
      await requestForgotPasswordOtp(email.trim());
      setStep(2);
      setMessage("Please enter your new password.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPassword.trim())
      return setError("Please fill all fields.");
    if (newPassword.trim().length < 6)
      return setError("Password must be at least 6 characters.");
    setLoading(true);
    setError("");
    try {
      await resetForgotPassword({
        email: email.trim(),
        otp: "000000",
        newPassword: newPassword.trim(),
      });
      setMessage("Password reset successfully!");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__bg" />
      <div className="login-card animate-scale-in">
        <div className="login-card__header">
          <div className="login-card__logo">
            <KeyRound size={28} />
          </div>
          <h1>{step === 1 ? "Forgot Password" : "Reset Password"}</h1>
          <p>
            {step === 1
              ? "Enter your email to request a password reset"
              : "Enter your new password below"}
          </p>
        </div>
        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="login-card__form">
            <div className="form-group">
              <label htmlFor="fp-email">Email</label>
              <div className="input-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  id="fp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            </div>
            {error && <div className="login-card__error">{error}</div>}
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Request Reset
            </Button>
            <Link
              to="/login"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--color-text-muted)",
                fontSize: "var(--font-size-sm)",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </form>
        ) : (
          <form onSubmit={handleReset} className="login-card__form">
            <div className="form-group">
              <label>New Password</label>
              <div className="input-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  minLength={6}
                />
              </div>
            </div>
            {error && <div className="login-card__error">{error}</div>}
            {message && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-success-ghost)",
                  color: "var(--color-success-light)",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                {message}
              </div>
            )}
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Reset Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
