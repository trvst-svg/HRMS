import db from "../../config/db.js";
import bcrypt from "bcryptjs";
import { getOrCreateEmployeeForUser } from "../queries/employeeQueries.js";
import { createAndSendOtp, verifyOtp } from "../../services/otpService.js";

const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,79}$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;
const OTP_REGEX = /^\d{6}$/;

async function updateMyProfile(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const {
      firstName = "",
      lastName = "",
      phone = "",
      designation = "",
    } = req.body;

    const cleanFirstName = String(firstName || "").trim();
    const cleanLastName = String(lastName || "").trim();
    const cleanPhone = String(phone || "").trim();
    const cleanDesignation = String(designation || "").trim();

    if (!cleanFirstName) {
      return res.status(400).json({ message: "First name is required." });
    }
    if (!NAME_REGEX.test(cleanFirstName)) {
      return res.status(400).json({ message: "First name is invalid." });
    }
    if (cleanLastName && !NAME_REGEX.test(cleanLastName)) {
      return res.status(400).json({ message: "Last name is invalid." });
    }
    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({ message: "Phone number is invalid." });
    }
    if (cleanDesignation.length > 100) {
      return res.status(400).json({ message: "Designation is too long." });
    }

    await db.query(
      "UPDATE employees SET first_name = $1, last_name = $2, phone = $3, designation = $4 WHERE id = $5",
      [
        cleanFirstName,
        cleanLastName,
        cleanPhone,
        cleanDesignation,
        employee.id,
      ],
    );

    const fullName = `${cleanFirstName} ${cleanLastName}`.trim();
    if (fullName) {
      await db.query("UPDATE users SET name = $1 WHERE id = $2", [
        fullName,
        req.user.id,
      ]);
    }

    if (req.file) {
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      await db.query("UPDATE users SET avatar = $1 WHERE id = $2", [
        avatarPath,
        req.user.id,
      ]);
    }

    return res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("updateMyProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function changeMyPassword(req, res) {
  try {
    const { currentPassword = "", newPassword = "", otp = "" } = req.body;
    if (!currentPassword || !newPassword || !otp) {
      return res
        .status(400)
        .json({
          message: "Current password, new password and OTP are required.",
        });
    }
    if (!PASSWORD_REGEX.test(String(newPassword || ""))) {
      return res.status(400).json({
        message:
          "New password must be 8-64 chars with uppercase, lowercase and number.",
      });
    }
    if (!OTP_REGEX.test(String(otp || ""))) {
      return res.status(400).json({ message: "OTP must be 6 digits." });
    }

    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [
      req.user.id,
    ]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });

    const otpOk = await verifyOtp({
      email: String(user.email || "").toLowerCase(),
      purpose: "change_password",
      code: otp,
    });
    if (!otpOk) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedPassword,
      user.id,
    ]);

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("changeMyPassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function requestChangePasswordOtp(req, res) {
  try {
    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [
      req.user.id,
    ]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    await createAndSendOtp({
      email: String(user.email || "").toLowerCase(),
      userId: user.id,
      purpose: "change_password",
      minutes: 10,
    });

    return res.json({ message: "OTP sent to your email." });
  } catch (err) {
    console.error("requestChangePasswordOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export { updateMyProfile, changeMyPassword, requestChangePasswordOtp };
export default { updateMyProfile, changeMyPassword, requestChangePasswordOtp };
