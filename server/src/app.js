// backend/src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { connectDB } = require("./config/db");

const authRoute = require("./routes/auth");
const adminRoute = require("./routes/admin");
const managerRoute = require("./routes/manager");
const employeeRoute = require("./routes/employee");
const departmentRoutes = require("./routes/departmentRoutes");
const projectRoutes = require("./routes/projectRoutes");
const saasRoutes = require("./routes/saasRoutes");
const enterpriseRoutes = require("./routes/enterpriseRoutes");
const { protect, requireRole } = require("./middleware/auth");
const sanitize = require("./middleware/sanitize");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

// Connect DB
connectDB();

// ─────────────────────────────────────────────────────────────────────────────
// 1. Security headers — must be first, before any other middleware
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  helmet({
    // Content-Security-Policy in report-only so it never breaks the UI.
    // Tighten this once you know your exact CDN / font domains.
    contentSecurityPolicy: false, // disabled for dev; enable + configure for prod
    crossOriginEmbedderPolicy: false, // required for some browser APIs
    // Everything else helmet ships with stays ON:
    // X-Frame-Options: SAMEORIGIN
    // X-Content-Type-Options: nosniff
    // X-DNS-Prefetch-Control: off
    // Referrer-Policy: no-referrer
    // X-Download-Options: noopen
    // X-Permitted-Cross-Domain-Policies: none
    // Strict-Transport-Security (HSTS): max-age=15552000
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Body parser — limit size to prevent JSON-bomb / large-payload DoS
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

// ─────────────────────────────────────────────────────────────────────────────
// 3. Disable caching for all API responses + etag (prevent 304 caching issues)
// ─────────────────────────────────────────────────────────────────────────────
app.disable("etag");
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. CORS — allow configured origins only
// ─────────────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:58831",
  "http://127.0.0.1:4200",
  "http://127.0.0.1:58831",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser tools (no Origin header — e.g. Postman, curl)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // allow any localhost port for local development or ngrok tunnels
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.endsWith(".ngrok-free.dev")
      ) {
        return cb(null, true);
      }
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

// Handle preflight requests for all routes
app.options(/.*/, cors());

// ─────────────────────────────────────────────────────────────────────────────
// 5. Global input sanitization — strips null-bytes and SQLi fingerprints
//    from req.body, req.query, req.params before any controller sees them
// ─────────────────────────────────────────────────────────────────────────────
app.use(sanitize);

// ─────────────────────────────────────────────────────────────────────────────
// 6. General API rate limiter — 120 req/min per IP across all /api/* routes
// ─────────────────────────────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// 7. Routes
//    Auth routes have their own granular per-endpoint limiters applied inside
//    the auth router itself (loginLimiter, otpLimiter, forgotPasswordLimiter)
// ─────────────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/manager", managerRoute);
app.use("/api/employee", employeeRoute);
app.use("/api/projects", projectRoutes);
app.use("/api/saas", saasRoutes);
app.use("/api/enterprise", enterpriseRoutes);

// Department endpoints (dual-mount to avoid route mismatch issues)
app.use(
  "/api/admin/departments",
  protect,
  requireRole("admin"),
  departmentRoutes,
);
app.use("/api/departments", protect, requireRole("admin"), departmentRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// 8. Misc
// ─────────────────────────────────────────────────────────────────────────────
// Health check (excluded from rate limiter via skip function in rateLimiter.js)
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/", (req, res) => res.send("HRMS Backend is running"));

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler — never expose stack traces in production
app.use((err, req, res, _next) => {
  const isDev = process.env.NODE_ENV !== "production";
  console.error("Unhandled error:", err);
  return res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(isDev && { stack: err.stack }),
  });
});

module.exports = app;
