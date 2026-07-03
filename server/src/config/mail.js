// backend/src/config/mail.js
// Gmail SMTP config for app notifications.

const MAIL_USER = process.env.GMAIL_USER || "xshuvam7@gmail.com";
const MAIL_APP_PASSWORD = String(
  process.env.GMAIL_APP_PASSWORD || "pywr nity nief svlo",
).replace(/\s+/g, "");
const NOTIFY_TO = process.env.HR_NOTIFY_EMAIL || "xshuvam7@gmail.com";
const OTP_REQUIRED_EMAIL = String(
  process.env.OTP_REQUIRED_EMAIL || "xshuvam7@gmail.com",
).toLowerCase();

module.exports = {
  MAIL_USER,
  MAIL_APP_PASSWORD,
  NOTIFY_TO,
  OTP_REQUIRED_EMAIL,
};
