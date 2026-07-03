import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { verifyLoginOtp, resendLoginOtp } from "../../api/authApi";
import Button from "../../components/ui/Button";
import { ShieldCheck, KeyRound } from "lucide-react";
import "../auth/LoginPage.css";

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { saveSession, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const email = sessionStorage.getItem("loginOtpEmail") || "";
  const tempToken = sessionStorage.getItem("loginOtpTempToken") || "";

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return setError("Please enter the OTP.");
    setLoading(true);
    setError("");
    try {
      const res = await verifyLoginOtp(email, otp.trim(), tempToken);
      const data = res.data;
      if (data.token && data.user) {
        saveSession(data.token, data.user.role, data.user.email);
        sessionStorage.removeItem("loginOtpEmail");
        sessionStorage.removeItem("loginOtpTempToken");
        navigate(getDashboardPath(data.user.role), { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setMessage("");
    setError("");
    try {
      await resendLoginOtp(email, tempToken);
      setMessage("OTP resent successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__bg" />
      <div className="login-card animate-scale-in">
        <div className="login-card__header">
          <div className="login-card__logo">
            <ShieldCheck size={28} />
          </div>
          <h1>Verify OTP</h1>
          <p>
            Enter the code sent to <strong>{email}</strong>
          </p>
        </div>
        <form onSubmit={handleVerify} className="login-card__form">
          <div className="form-group">
            <label htmlFor="otp-input">One-Time Password</label>
            <div className="input-wrap">
              <KeyRound size={16} className="input-icon" />
              <input
                id="otp-input"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
          </div>
          {error && (
            <div className="login-card__error animate-fade-in">{error}</div>
          )}
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
            Verify & Login
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={handleResend}
            loading={resending}
            disabled={resending}
          >
            Resend OTP
          </Button>
        </form>
      </div>
    </div>
  );
}
