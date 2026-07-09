// backend/src/services/mailService.js
// Small mail helper used by leave/WFH/payroll flows.

import { MAIL_USER, MAIL_APP_PASSWORD, NOTIFY_TO } from "../config/mail.js";

let nodemailer = null;
try {
  // If dependency is not installed yet, backend should still run.
  // Mail will just be skipped with a log.
  nodemailer = require("nodemailer");
} catch (err) {
  console.warn("nodemailer not installed. Run: npm install in backend folder");
}

let transporter = null;
if (nodemailer) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: MAIL_USER,
      pass: MAIL_APP_PASSWORD,
    },
  });
}

async function sendMail({ subject, text, html, to = NOTIFY_TO }) {
  if (!transporter)
    return { ok: false, skipped: true, reason: "transporter-not-ready" };

  try {
    const info = await transporter.sendMail({
      from: `"HRMS Alerts" <${MAIL_USER}>`,
      to,
      subject,
      text: text || "",
      html: html || "",
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error("sendMail error:", err.message || err);
    return { ok: false, error: err.message || "mail-failed" };
  }
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleString("en-NP", {
    timeZone: "Asia/Kathmandu",
  });
}

async function notifyLeaveOrWfhDecision({
  requestType = "Leave",
  status = "Approved",
  employeeName = "Employee",
  employeeEmail = "-",
  fromDate,
  toDate,
  reason = "",
  decidedByRole = "admin",
}) {
  const subject = `[HRMS] ${requestType} ${status} - ${employeeName}`;
  const text =
    `${requestType} request ${status}\n` +
    `Employee: ${employeeName}\n` +
    `Employee Email: ${employeeEmail}\n` +
    `From: ${formatDate(fromDate)}\n` +
    `To: ${formatDate(toDate)}\n` +
    `Reason: ${reason || "-"}\n` +
    `Action By: ${decidedByRole}`;

  const html = `
    <h3>${requestType} Request ${status}</h3>
    <p><b>Employee:</b> ${employeeName}</p>
    <p><b>Email:</b> ${employeeEmail}</p>
    <p><b>From:</b> ${formatDate(fromDate)}</p>
    <p><b>To:</b> ${formatDate(toDate)}</p>
    <p><b>Reason:</b> ${reason || "-"}</p>
    <p><b>Action By:</b> ${decidedByRole}</p>
  `;

  return sendMail({ subject, text, html });
}

async function notifyPayslipDone({
  employeeName = "Employee",
  employeeId = "-",
  employeeEmail = "-",
  month = "-",
  annualSalary = 0,
  grossPay = 0,
  taxDeduction = 0,
  deductions = 0,
  netPay = 0,
  status = "Processed",
}) {
  const subject = `[HRMS] Payslip ${status} - ${employeeName} (${month})`;
  const text =
    `Payslip ${status}\n` +
    `Employee: ${employeeName}\n` +
    `Employee ID: ${employeeId}\n` +
    `Employee Email: ${employeeEmail}\n` +
    `Month: ${month}\n` +
    `Annual Salary: NPR ${Number(annualSalary || 0).toLocaleString("en-NP")}\n` +
    `Gross Pay: NPR ${Number(grossPay || 0).toLocaleString("en-NP")}\n` +
    `Tax: NPR ${Number(taxDeduction || 0).toLocaleString("en-NP")}\n` +
    `Total Deductions: NPR ${Number(deductions || 0).toLocaleString("en-NP")}\n` +
    `Net Pay: NPR ${Number(netPay || 0).toLocaleString("en-NP")}`;

  const html = `
    <h3>Payslip ${status}</h3>
    <p><b>Employee:</b> ${employeeName}</p>
    <p><b>Employee ID:</b> ${employeeId}</p>
    <p><b>Email:</b> ${employeeEmail}</p>
    <p><b>Month:</b> ${month}</p>
    <p><b>Annual Salary:</b> NPR ${Number(annualSalary || 0).toLocaleString("en-NP")}</p>
    <p><b>Gross Pay:</b> NPR ${Number(grossPay || 0).toLocaleString("en-NP")}</p>
    <p><b>Tax:</b> NPR ${Number(taxDeduction || 0).toLocaleString("en-NP")}</p>
    <p><b>Total Deductions:</b> NPR ${Number(deductions || 0).toLocaleString("en-NP")}</p>
    <p><b>Net Pay:</b> NPR ${Number(netPay || 0).toLocaleString("en-NP")}</p>
  `;

  return sendMail({ subject, text, html });
}

async function notifyTerminationAction({
  action = "layoff",
  employeeName = "Employee",
  employeeEmail = "",
  employeeId = "-",
}) {
  // User requested fixed receiver for all fire/layoff emails.
  const fixedTerminationReceiver = "xshuvam7@gmail.com";

  // Simple fixed reasons written clearly for official emails.
  const fireReason =
    "This decision was made after internal policy review and repeated performance concerns.";
  const layoffReason =
    "This decision is due to organizational restructuring and current business needs.";

  const humanAction =
    action === "fire" ? "Termination Notice" : "Layoff Notice";
  const subject = `[HRMS] ${humanAction} - ${employeeName}`;
  const text =
    `${humanAction}\n` +
    `Employee: ${employeeName}\n` +
    `Employee ID: ${employeeId}\n` +
    `Email: ${employeeEmail}\n\n` +
    (action === "fire"
      ? `Your employment has been terminated effective immediately.\nReason: ${fireReason}`
      : `Your employment status has been changed to laid off.\nReason: ${layoffReason}`);

  const html = `
    <h3>${humanAction}</h3>
    <p><b>Employee:</b> ${employeeName}</p>
    <p><b>Employee ID:</b> ${employeeId}</p>
    <p><b>Email:</b> ${employeeEmail}</p>
    <p>${
      action === "fire"
        ? "Your employment has been terminated effective immediately."
        : "Your employment status has been changed to <b>laid off</b>."
    }</p>
    <p><b>Reason:</b> ${action === "fire" ? fireReason : layoffReason}</p>
  `;

  // Always send to fixed HR mailbox, not registration email.
  return sendMail({ subject, text, html, to: fixedTerminationReceiver });
}

async function sendWelcomeCredentialsMail({
  name = "User",
  email = "",
  password = "",
  role = "employee",
}) {
  if (!email) return { ok: false, skipped: true, reason: "missing-email" };

  const roleLabel = String(role || "employee").toLowerCase();
  const subject = `[HRMS] Welcome ${name} - Your ${roleLabel} account is ready`;
  const text =
    `Welcome to HRMS\n` +
    `Name: ${name}\n` +
    `Role: ${roleLabel}\n` +
    `Login Email: ${email}\n` +
    `Temporary Password: ${password}\n\n` +
    `Important:\n` +
    `- Please login and change password after first login.\n` +
    `- OTP will be required during login for your account.`;

  const html = `
    <h3>Welcome to HRMS</h3>
    <p>Hello <b>${name}</b>, your account has been created.</p>
    <p><b>Role:</b> ${roleLabel}</p>
    <p><b>Login Email:</b> ${email}</p>
    <p><b>Temporary Password:</b> ${password}</p>
    <p>Please login and change your password after first login.</p>
    <p><b>Note:</b> OTP is required during login for your account.</p>
  `;

  return sendMail({ subject, text, html, to: email });
}

export { sendMail, notifyLeaveOrWfhDecision, notifyPayslipDone, notifyTerminationAction, sendWelcomeCredentialsMail };
export default { sendMail, notifyLeaveOrWfhDecision, notifyPayslipDone, notifyTerminationAction, sendWelcomeCredentialsMail };
