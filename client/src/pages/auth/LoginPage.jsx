import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { login } from "../../api/authApi";
import Button from "../../components/ui/Button";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import "./LoginPage.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { saveSession, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password)
      return setError("Please enter both email and password.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError("Please enter a valid email.");
    if (password.trim().length < 6)
      return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      const data = res.data;

      if (data.requiresOtp) {
        sessionStorage.setItem("loginOtpEmail", data.email);
        sessionStorage.setItem("loginOtpTempToken", data.tempToken);
        navigate("/verify-otp", { replace: true });
        return;
      }

      if (!data.token || !data.user) {
        setError("Invalid login response.");
        return;
      }

      saveSession(data.token, data.user.role, data.user.email);
      navigate(getDashboardPath(data.user.role), { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Check your credentials.",
      );
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
            <img
              src="/nexora-logo.png"
              alt="Nexora"
              style={{ height: 44, objectFit: "contain" }}
            />
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to your Nexora workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="login-card__form">
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <div className="input-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                maxLength={120}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                minLength={6}
                maxLength={64}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-card__error animate-fade-in">{error}</div>
          )}

          <div className="login-card__forgot">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
