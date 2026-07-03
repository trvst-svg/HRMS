const db = require("../config/db");
const { sendMail } = require("./mailService");

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createAndSendOtp({
  email,
  userId = null,
  purpose = "login",
  minutes = 10,
}) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalizedEmail) throw new Error("Email is required for OTP");

  const code = generateCode();
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  // Mark old OTPs as used to keep latest one only
  await db.query(
    "UPDATE otps SET is_used = TRUE WHERE email = $1 AND purpose = $2 AND is_used = FALSE",
    [normalizedEmail, purpose],
  );

  await db.query(
    "INSERT INTO otps (email, user_id, code, purpose, is_used, expires_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [normalizedEmail, userId, code, purpose, false, expiresAt],
  );

  await sendMail({
    to: normalizedEmail,
    subject: `[HRMS] OTP for ${purpose}`,
    text: `Your OTP is ${code}. It will expire in ${minutes} minutes.`,
    html: `<p>Your OTP is <b>${code}</b>.</p><p>This OTP expires in ${minutes} minutes.</p>`,
  });

  return { ok: true, expiresAt };
}

async function verifyOtp({ email, purpose = "login", code }) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const normalizedCode = String(code || "").trim();
  if (!normalizedEmail || !normalizedCode) return false;

  const result = await db.query(
    "SELECT * FROM otps WHERE email = $1 AND purpose = $2 AND code = $3 AND is_used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
    [normalizedEmail, purpose, normalizedCode],
  );
  const otpRow = result.rows[0];

  if (!otpRow) return false;

  await db.query("UPDATE otps SET is_used = TRUE WHERE id = $1", [otpRow.id]);
  return true;
}

module.exports = {
  createAndSendOtp,
  verifyOtp,
};
