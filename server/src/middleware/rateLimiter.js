/**
 * rateLimiter.js
 * Provides rate-limiting and progressive slow-down middleware to protect
 * authentication endpoints from brute-force and credential-stuffing attacks,
 * and to give every API route a reasonable general limit.
 */

const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");

// ─────────────────────────────────────────────────────────────────────────────
// Helper: standardised 429 response
// ─────────────────────────────────────────────────────────────────────────────
function rateLimitHandler(req, res) {
  return res.status(429).json({
    message: "Too many requests. Please wait a moment and try again.",
    retryAfter: res.getHeader("Retry-After"),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Login limiter — 10 attempts per 15 minutes per IP
// After this fires the account is NOT locked; only the IP is throttled.
// This prevents enumeration while not locking out legitimate users on shared IPs.
// ─────────────────────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true, // Return `RateLimit-*` headers
  legacyHeaders: false,
  message:
    "Too many login attempts. Please wait 15 minutes before trying again.",
  handler: rateLimitHandler,
  skipSuccessfulRequests: false, // Count all attempts, not just failures
});

// ─────────────────────────────────────────────────────────────────────────────
// Login slow-down — starts adding delay after the 5th attempt in 15 min
// This does NOT block the request; it delays the response by 500 ms per extra
// attempt, making automated credential-stuffing attacks painfully slow.
// ─────────────────────────────────────────────────────────────────────────────
const loginSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 5, // Begin delaying after 5 requests
  delayMs: (hits) => (hits - 5) * 500, // +500 ms per extra hit (attempt 6 → 500ms, 7 → 1000ms, …)
  maxDelayMs: 10000, // Cap at 10 seconds per response
});

// ─────────────────────────────────────────────────────────────────────────────
// OTP limiter — 6 attempts per 10 minutes per IP
// Covers: verify-login-otp, request-login-otp, forgot-password OTP endpoints
// ─────────────────────────────────────────────────────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many OTP attempts. Please wait 10 minutes before trying again.",
  handler: rateLimitHandler,
});

// ─────────────────────────────────────────────────────────────────────────────
// Forgot-password limiter — 5 requests per 60 minutes per IP
// This endpoint triggers email sends; abuse would spam inboxes.
// ─────────────────────────────────────────────────────────────────────────────
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many password-reset requests. Please try again in 1 hour.",
  handler: rateLimitHandler,
});

// ─────────────────────────────────────────────────────────────────────────────
// General API limiter — 120 requests per minute per IP
// Applied to all /api/* routes as a blanket DoS guard.
// ─────────────────────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests. Please slow down.",
  handler: rateLimitHandler,
  // Skip static/health-check routes so monitoring tools are never blocked
  skip: (req) => req.path === "/" || req.path === "/health",
});

module.exports = {
  loginLimiter,
  loginSlowDown,
  otpLimiter,
  forgotPasswordLimiter,
  apiLimiter,
};
