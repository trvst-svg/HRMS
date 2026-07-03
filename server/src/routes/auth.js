const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { OTP_REQUIRED_EMAIL } = require("../config/mail");
const { createAndSendOtp, verifyOtp } = require("../services/otpService");
const {
  loginLimiter,
  loginSlowDown,
  otpLimiter,
  forgotPasswordLimiter,
} = require("../middleware/rateLimiter");

const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;
const OTP_REGEX = /^\d{6}$/;

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/**
 * POST /api/auth/register
 */
// Register is rate-limited and protected with admin auth (only admins create employees/credentials).
router.post("/register", protect, requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required." });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email." });
    }
    if (!PASSWORD_REGEX.test(String(password || ""))) {
      return res.status(400).json({
        message:
          "Password must be 8-64 chars with uppercase, lowercase and number.",
      });
    }

    const existingCheck = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail],
    );
    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, normalizedEmail, hashedPassword, role || "admin"],
    );
    const user = result.rows[0];

    return res.status(201).json({
      message: "User registered",
      user: {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/auth/login
 */
// loginLimiter: max 10 attempts per IP per 15 min → returns 429
// loginSlowDown: progressive +500ms delay starting at attempt 6
router.post("/login", loginLimiter, loginSlowDown, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email." });
    }

    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      normalizedEmail,
    ]);
    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.role === "employee" || user.role === "manager") {
      const empResult = await db.query(
        "SELECT status FROM employees WHERE user_id = $1",
        [user.id],
      );
      const employeeProfile = empResult.rows[0];
      if (
        employeeProfile &&
        ["inactive", "layoff"].includes(employeeProfile.status)
      ) {
        return res.status(403).json({
          message: "Your account is not active. Please contact admin.",
        });
      }
    }

    const needsOtpLogin =
      normalizedEmail === OTP_REQUIRED_EMAIL ||
      Boolean(user.otp_required_for_login);

    if (needsOtpLogin) {
      await createAndSendOtp({
        email: normalizedEmail,
        userId: user.id,
        purpose: "login",
        minutes: 10,
      });

      const tempToken = jwt.sign(
        {
          id: user.id,
          role: user.role,
          email: user.email,
          purpose: "login_otp",
        },
        process.env.JWT_SECRET || "secret123",
        { expiresIn: "10m" },
      );

      return res.json({
        message: "OTP sent to email. Please verify OTP to login.",
        requiresOtp: true,
        email: normalizedEmail,
        tempToken,
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "8h" },
    );

    return res.json({
      message: "Login successful",
      token,
      requiresOtp: false,
      user: {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/auth/verify-login-otp
 */
router.post("/verify-login-otp", otpLimiter, async (req, res) => {
  try {
    const { email, otp, tempToken } = req.body;
    if (!email || !otp || !tempToken) {
      return res
        .status(400)
        .json({ message: "Email, OTP and temp token are required." });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email." });
    }
    if (!OTP_REGEX.test(String(otp || ""))) {
      return res.status(400).json({ message: "OTP must be 6 digits." });
    }

    const userResult = await db.query(
      "SELECT id, otp_required_for_login FROM users WHERE email = $1",
      [normalizedEmail],
    );
    const otpUser = userResult.rows[0];
    const isOtpEnabled =
      normalizedEmail === OTP_REQUIRED_EMAIL ||
      Boolean(otpUser?.otp_required_for_login);
    if (!isOtpEnabled) {
      return res
        .status(400)
        .json({ message: "OTP login is not enabled for this email." });
    }

    const decoded = jwt.verify(
      tempToken,
      process.env.JWT_SECRET || "secret123",
    );
    if (
      decoded?.purpose !== "login_otp" ||
      String(decoded?.email || "").toLowerCase() !== normalizedEmail
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired login session." });
    }

    const fullUserResult = await db.query("SELECT * FROM users WHERE id = $1", [
      decoded.id,
    ]);
    const user = fullUserResult.rows[0];
    if (!user) return res.status(404).json({ message: "User not found." });

    const isValidOtp = await verifyOtp({
      email: normalizedEmail,
      purpose: "login",
      code: otp,
    });
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "8h" },
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("verify-login-otp error:", err);
    return res.status(400).json({ message: "Invalid or expired OTP session." });
  }
});

/**
 * POST /api/auth/request-login-otp
 */
router.post("/request-login-otp", otpLimiter, async (req, res) => {
  try {
    const { email, tempToken } = req.body;
    if (!email || !tempToken) {
      return res
        .status(400)
        .json({ message: "Email and temp token are required." });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email." });
    }

    const userResult = await db.query(
      "SELECT id, otp_required_for_login FROM users WHERE email = $1",
      [normalizedEmail],
    );
    const otpUser = userResult.rows[0];
    const isOtpEnabled =
      normalizedEmail === OTP_REQUIRED_EMAIL ||
      Boolean(otpUser?.otp_required_for_login);
    if (!isOtpEnabled) {
      return res
        .status(400)
        .json({ message: "OTP login is not enabled for this email." });
    }

    const decoded = jwt.verify(
      tempToken,
      process.env.JWT_SECRET || "secret123",
    );
    if (
      decoded?.purpose !== "login_otp" ||
      String(decoded?.email || "").toLowerCase() !== normalizedEmail
    ) {
      return res.status(400).json({ message: "Invalid login session." });
    }

    await createAndSendOtp({
      email: normalizedEmail,
      userId: decoded.id,
      purpose: "login",
      minutes: 10,
    });

    return res.json({ message: "OTP sent again to email." });
  } catch (err) {
    console.error("request-login-otp error:", err);
    return res.status(400).json({ message: "Could not resend OTP." });
  }
});

/**
 * POST /api/auth/forgot-password/request-otp
 */
router.post(
  "/forgot-password/request-otp",
  forgotPasswordLimiter,
  otpLimiter,
  async (req, res) => {
    try {
      const { email } = req.body;
      if (!email)
        return res.status(400).json({ message: "Email is required." });

      const normalizedEmail = normalizeEmail(email);
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ message: "Please enter a valid email." });
      }

      const result = await db.query(
        "SELECT id, email FROM users WHERE email = $1",
        [normalizedEmail],
      );
      const user = result.rows[0];

      if (!user) {
        return res.json({
          message: "If this email exists, OTP has been sent.",
        });
      }

      await createAndSendOtp({
        email: normalizedEmail,
        userId: user.id,
        purpose: "forgot_password",
        minutes: 10,
      });

      return res.json({ message: "If this email exists, OTP has been sent." });
    } catch (err) {
      console.error("forgot-password/request-otp error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },
);

/**
 * POST /api/auth/forgot-password/reset
 */
router.post(
  "/forgot-password/reset",
  forgotPasswordLimiter,
  async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res
          .status(400)
          .json({ message: "Email, OTP and new password are required." });
      }

      const normalizedEmail = normalizeEmail(email);
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ message: "Please enter a valid email." });
      }
      if (!OTP_REGEX.test(String(otp || ""))) {
        return res.status(400).json({ message: "OTP must be 6 digits." });
      }

      const userResult = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [normalizedEmail],
      );
      const user = userResult.rows[0];
      if (!user)
        return res.status(400).json({ message: "Invalid email or OTP." });

      const otpOk = await verifyOtp({
        email: normalizedEmail,
        purpose: "forgot_password",
        code: otp,
      });
      if (!otpOk) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
      }

      if (!PASSWORD_REGEX.test(String(newPassword || ""))) {
        return res.status(400).json({
          message:
            "New password must be 8-64 chars with uppercase, lowercase and number.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(String(newPassword), salt);

      await db.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashedPassword,
        user.id,
      ]);

      return res.json({ message: "Password reset successful. Please login." });
    } catch (err) {
      console.error("forgot-password/reset error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },
);

module.exports = router;
