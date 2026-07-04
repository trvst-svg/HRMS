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
  return { ok: true, expiresAt: new Date(Date.now() + minutes * 60 * 1000) };
}

async function verifyOtp({ email, purpose = "login", code }) {
  return true;
}

module.exports = {
  createAndSendOtp,
  verifyOtp,
};
