import jwt from "jsonwebtoken";
import db from "../config/db.js";

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const cleanToken = String(token).trim().replace(/^"|"$/g, "");

    const decoded = jwt.verify(
      cleanToken,
      process.env.JWT_SECRET || "secret123",
    );

    const { rows } = await db.query(
      "SELECT id, name, email, role, avatar, password FROM users WHERE id = $1",
      [decoded.id],
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach _id so existing middleware and handlers that use req.user._id still function correctly
    user._id = user.id;
    delete user.password; // Do not send password around

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Token is not valid" });
  }
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };

const requireHRorAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }
    if (req.user.role === "admin") {
      return next();
    }

    const { rows } = await db.query(
      "SELECT department FROM employees WHERE user_id = $1 LIMIT 1",
      [req.user.id],
    );
    const dept = rows[0]?.department;
    if (dept && String(dept).trim().toUpperCase() === "HR") {
      return next();
    }

    return res
      .status(403)
      .json({ message: "Forbidden: Admin or HR access required" });
  } catch (err) {
    console.error("requireHRorAdmin error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const requireManagerOrHRorAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }
    if (req.user.role === "admin" || req.user.role === "manager") {
      return next();
    }

    const { rows } = await db.query(
      "SELECT department FROM employees WHERE user_id = $1 LIMIT 1",
      [req.user.id],
    );
    const dept = rows[0]?.department;
    if (dept && String(dept).trim().toUpperCase() === "HR") {
      return next();
    }

    return res
      .status(403)
      .json({ message: "Forbidden: Admin, Manager or HR access required" });
  } catch (err) {
    console.error("requireManagerOrHRorAdmin error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export { protect, requireRole, requireHRorAdmin, requireManagerOrHRorAdmin };
export default { protect, requireRole, requireHRorAdmin, requireManagerOrHRorAdmin };
