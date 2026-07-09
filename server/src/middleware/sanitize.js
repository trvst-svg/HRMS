/**
 * sanitize.js
 * Defense-in-depth input sanitization middleware.
 *
 * While all DB queries use parameterized placeholders (no raw string
 * interpolation), this layer strips payloads that look like SQL injection
 * attempts before they ever reach a controller.  It also removes null-bytes
 * that are sometimes used to bypass input-length checks.
 *
 * Applied globally in app.js right after the body-parser.
 */

// Common SQL injection fingerprints we want to outright reject.
// These patterns only appear in attack payloads, never in legitimate HR data.
const SQLI_PATTERNS = [
  /;\s*--/i, // statement terminator + comment (classic SQLi close)
  /'\s*OR\s+'?\d/i, // ' OR '1'='1 style
  /'\s*AND\s+'?\d/i, // ' AND '1'='1 style
  /UNION\s+(?:ALL\s+)?SELECT/i, // UNION SELECT injection
  /xp_\w+/i, // SQL Server stored proc calls
  /EXEC\s*\(/i, // EXEC( injection
  /SLEEP\s*\(/i, // time-based blind SQLi
  /WAITFOR\s+DELAY/i, // SQL Server delay injection
  /\bDROP\s+TABLE\b/i, // destructive DDL in input
  /\bTRUNCATE\s+TABLE\b/i,
  /\bINSERT\s+INTO\b/i, // DML attempts embedded in values
  /\bDELETE\s+FROM\b/i,
];

// Null-byte used to bypass string-length checks or confuse C-string parsers.
const NULL_BYTE = /\0/g;

/**
 * Recursively sanitize a value.
 * - Strings: strip null-bytes, check for SQLi fingerprints
 * - Objects/Arrays: recurse into each property/element
 * - Everything else: pass through unchanged
 *
 * Returns { clean, blocked } where `blocked` is true if a threat was found.
 */
function sanitizeValue(value, path = "") {
  if (typeof value === "string") {
    // Strip null bytes first
    const cleaned = value.replace(NULL_BYTE, "");

    // Check for injection fingerprints
    for (const pattern of SQLI_PATTERNS) {
      if (pattern.test(cleaned)) {
        return {
          clean: cleaned,
          blocked: true,
          reason: `Suspicious pattern in field '${path}'`,
        };
      }
    }

    return { clean: cleaned, blocked: false };
  }

  if (Array.isArray(value)) {
    const cleanArr = [];
    for (let i = 0; i < value.length; i++) {
      const result = sanitizeValue(value[i], `${path}[${i}]`);
      if (result.blocked) return result;
      cleanArr.push(result.clean);
    }
    return { clean: cleanArr, blocked: false };
  }

  if (value !== null && typeof value === "object") {
    const cleanObj = {};
    for (const [key, val] of Object.entries(value)) {
      const result = sanitizeValue(val, path ? `${path}.${key}` : key);
      if (result.blocked) return result;
      cleanObj[key] = result.clean;
    }
    return { clean: cleanObj, blocked: false };
  }

  // Numbers, booleans, null → untouched
  return { clean: value, blocked: false };
}

/**
 * Express middleware.
 * Sanitizes req.body, req.query, and req.params in place.
 */
function sanitize(req, res, next) {
  try {
    // Sanitize body
    if (req.body && typeof req.body === "object") {
      const result = sanitizeValue(req.body, "body");
      if (result.blocked) {
        return res
          .status(400)
          .json({
            message: "Request contains invalid characters or patterns.",
          });
      }
      req.body = result.clean;
    }

    // Sanitize query params
    if (req.query && typeof req.query === "object") {
      const result = sanitizeValue(req.query, "query");
      if (result.blocked) {
        return res
          .status(400)
          .json({
            message: "Request contains invalid characters or patterns.",
          });
      }
      req.query = result.clean;
    }

    // Sanitize route params
    if (req.params && typeof req.params === "object") {
      const result = sanitizeValue(req.params, "params");
      if (result.blocked) {
        return res
          .status(400)
          .json({
            message: "Request contains invalid characters or patterns.",
          });
      }
      req.params = result.clean;
    }

    next();
  } catch (err) {
    // Never crash the app due to a sanitization bug
    console.error("sanitize middleware error:", err);
    next();
  }
}

export default sanitize;
