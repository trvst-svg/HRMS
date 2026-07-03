const db = require("../../config/db");
const {
  normalizeFilingStatus,
  calculateMonthlyPayrollFromAnnual,
  renderPayslipHtml,
} = require("../../services/payrollService");
const { notifyPayslipDone } = require("../../services/mailService");

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function getEmployeeOr404(employeeId) {
  const idInt = parseInt(employeeId, 10);
  if (isNaN(idInt)) return null;

  const result = await db.query(
    `SELECT e.*, e.annual_salary as "annualSalary", e.base_salary as "baseSalary", e.filing_status as "filingStatus", e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName",
            u.name, u.email, u.role
     FROM employees e
     JOIN users u ON e.user_id = u.id
     WHERE e.id = $1`,
    [idInt],
  );
  const employee = result.rows[0];
  if (employee) {
    employee.id = idInt;
    employee._id = idInt;
  }
  return employee;
}

function getMonthDateRange(month) {
  const safeMonth = String(month || "").trim();
  if (!/^\d{4}-\d{2}$/.test(safeMonth)) {
    const now = new Date();
    return {
      month: now.toISOString().slice(0, 7),
      start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0),
      daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    };
  }

  const [yearStr, monthStr] = safeMonth.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return { month: safeMonth, start, end, daysInMonth };
}

function countWorkingDays(start, end) {
  let count = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

async function getAttendanceSummary(employeeId, month) {
  const { start, end, daysInMonth } = getMonthDateRange(month);
  const workingDaysInMonth = countWorkingDays(start, end);

  const result = await db.query(
    "SELECT status, COUNT(*)::int as count FROM attendance WHERE employee_id = $1 AND date >= $2 AND date < $3 GROUP BY status",
    [employeeId, start, end],
  );
  const stats = result.rows;

  const summary = {
    daysInMonth: workingDaysInMonth || daysInMonth,
    presentDays: 0,
    halfDayPresentDays: 0,
    absentDays: 0,
    leaveDays: 0,
    wfhDays: 0,
  };

  stats.forEach((row) => {
    if (row.status === "Present") summary.presentDays = row.count;
    if (row.status === "Half Day Present")
      summary.halfDayPresentDays = row.count;
    if (row.status === "Absent") summary.absentDays = row.count;
    if (row.status === "Leave") summary.leaveDays = row.count;
    if (row.status === "WFH") summary.wfhDays = row.count;
  });

  const explicitAbsent = summary.absentDays;
  const recordedDays =
    summary.presentDays +
    summary.halfDayPresentDays +
    summary.leaveDays +
    summary.wfhDays +
    explicitAbsent;
  const inferredAbsentDays = Math.max(0, summary.daysInMonth - recordedDays);
  summary.absentDays = explicitAbsent + inferredAbsentDays;

  return summary;
}

async function buildPayrollFromEmployee(
  employee,
  month,
  filingStatus,
  otherDeductions,
  status,
  otHours = 0,
  includeFestivalBonus = false,
  reimbursement = 0,
) {
  const annualSalaryFromProfile =
    Number(employee.annualSalary || 0) ||
    Math.round(Number(employee.baseSalary || 0) * 12);
  const computed = calculateMonthlyPayrollFromAnnual({
    annualSalary: annualSalaryFromProfile,
    filingStatus: filingStatus || employee.filingStatus || "unmarried",
    otherDeductions,
    gender: employee.gender || "male",
    ssfContributor: Boolean(employee.ssf_contributor),
    citContribution: Number(employee.cit_contribution || 0),
    insurancePremium: Number(employee.insurance_premium || 0),
    otHours,
    includeFestivalBonus,
    reimbursement,
  });
  const attendance = await getAttendanceSummary(employee.id, month);

  const perDaySalary =
    attendance.daysInMonth > 0
      ? Math.round(computed.grossPay / attendance.daysInMonth)
      : 0;
  const attendanceDeduction = Math.max(
    0,
    Math.round(
      perDaySalary *
        (attendance.absentDays + attendance.halfDayPresentDays * 0.5),
    ),
  );

  const otPay = computed.otPay || 0;
  const festivalBonus = computed.festivalBonus || 0;
  const totalDeductions = computed.deductions + attendanceDeduction;
  const netPay = Math.max(
    0,
    computed.grossPay + otPay + festivalBonus + reimbursement - totalDeductions,
  );

  const row = {
    employee_id: employee.id,
    employee: employee.id,
    month,
    annualSalary: computed.annualSalary,
    basic: computed.basic,
    allowance: computed.allowance,
    grossPay: computed.grossPay,
    filingStatus: computed.filingStatus,
    taxDeduction: computed.taxDeduction,
    otherDeductions: computed.otherDeductions,
    attendanceDaysInMonth: attendance.daysInMonth,
    presentDays: attendance.presentDays,
    halfDayPresentDays: attendance.halfDayPresentDays,
    absentDays: attendance.absentDays,
    leaveDays: attendance.leaveDays,
    wfhDays: attendance.wfhDays,
    perDaySalary,
    attendanceDeduction,
    deductions: totalDeductions,
    netPay,
    otHours: computed.otHours,
    otPay: computed.otPay,
    festivalBonus: computed.festivalBonus,
    reimbursement: computed.reimbursement,
    employerSsf: computed.employerSsf,
    taxMeta: computed.taxMeta,
    status: status || "Processed",
  };

  // Mock _id for template support
  employee._id = employee.id;

  row.payslipHtml = renderPayslipHtml({
    employee,
    payroll: row,
    month,
  });

  return row;
}

async function calculatePayroll(req, res) {
  try {
    const {
      employee: employeeId,
      month,
      filingStatus,
      otherDeductions = 0,
      otHours = 0,
      includeFestivalBonus = false,
    } = req.body;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee is required." });
    }

    const employee = await getEmployeeOr404(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found." });
    const annualSalary =
      Number(employee.annualSalary || 0) ||
      Math.round(Number(employee.baseSalary || 0) * 12);
    if (!annualSalary) {
      return res
        .status(400)
        .json({
          message:
            "Annual salary is missing for this employee. Update employee profile first.",
        });
    }

    const previewMonth =
      String(month || "").trim() || new Date().toISOString().slice(0, 7);
    const safeFiling = filingStatus
      ? normalizeFilingStatus(filingStatus)
      : employee.filingStatus || "unmarried";

    // Fetch approved expense reimbursement sum
    const expRes = await db.query(
      `SELECT SUM(amount)::numeric as total 
       FROM expense_claims 
       WHERE employee_id = $1 AND month = $2 AND status = 'Approved'`,
      [employee.id, previewMonth],
    );
    const reimbursement = Number(expRes.rows[0]?.total || 0);

    const payload = await buildPayrollFromEmployee(
      employee,
      previewMonth,
      safeFiling,
      Math.max(0, toNumber(otherDeductions, 0)),
      "Processed",
      Number(otHours || 0),
      Boolean(includeFestivalBonus),
      reimbursement,
    );

    return res.json({ data: payload });
  } catch (err) {
    console.error("calculatePayroll error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function createPayroll(req, res) {
  try {
    const {
      employee: employeeId,
      month,
      otherDeductions = 0,
      filingStatus,
      status = "Processed",
      otHours = 0,
      includeFestivalBonus = false,
    } = req.body;

    if (!employeeId || !month) {
      return res
        .status(400)
        .json({ message: "Employee and month are required." });
    }

    const employee = await getEmployeeOr404(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found." });
    const annualSalary =
      Number(employee.annualSalary || 0) ||
      Math.round(Number(employee.baseSalary || 0) * 12);
    if (!annualSalary) {
      return res
        .status(400)
        .json({
          message:
            "Annual salary is missing for this employee. Update employee profile first.",
        });
    }

    const targetMonth = String(month).trim();
    const safeFiling = filingStatus
      ? normalizeFilingStatus(filingStatus)
      : employee.filingStatus || "unmarried";

    // Fetch approved expense reimbursement sum
    const expRes = await db.query(
      `SELECT SUM(amount)::numeric as total 
       FROM expense_claims 
       WHERE employee_id = $1 AND month = $2 AND status = 'Approved'`,
      [employee.id, targetMonth],
    );
    const reimbursement = Number(expRes.rows[0]?.total || 0);

    const row = await buildPayrollFromEmployee(
      employee,
      targetMonth,
      safeFiling,
      Math.max(0, toNumber(otherDeductions, 0)),
      status,
      Number(otHours || 0),
      Boolean(includeFestivalBonus),
      reimbursement,
    );

    const upsertResult = await db.query(
      `INSERT INTO payrolls (employee_id, month, annual_salary, basic, allowance, deductions, tax_deduction, other_deductions, attendance_days_in_month, present_days, half_day_present_days, absent_days, leave_days, wfh_days, per_day_salary, attendance_deduction, gross_pay, filing_status, tax_meta, net_pay, status, payslip_html, ot_hours, ot_pay, festival_bonus, reimbursement, employer_ssf)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
       ON CONFLICT (employee_id, month) 
       DO UPDATE SET 
         annual_salary = EXCLUDED.annual_salary,
         basic = EXCLUDED.basic,
         allowance = EXCLUDED.allowance,
         deductions = EXCLUDED.deductions,
         tax_deduction = EXCLUDED.tax_deduction,
         other_deductions = EXCLUDED.other_deductions,
         attendance_days_in_month = EXCLUDED.attendance_days_in_month,
         present_days = EXCLUDED.present_days,
         half_day_present_days = EXCLUDED.half_day_present_days,
         absent_days = EXCLUDED.absent_days,
         leave_days = EXCLUDED.leave_days,
         wfh_days = EXCLUDED.wfh_days,
         per_day_salary = EXCLUDED.per_day_salary,
         attendance_deduction = EXCLUDED.attendance_deduction,
         gross_pay = EXCLUDED.gross_pay,
         filing_status = EXCLUDED.filing_status,
         tax_meta = EXCLUDED.tax_meta,
         net_pay = EXCLUDED.net_pay,
         status = EXCLUDED.status,
         payslip_html = EXCLUDED.payslip_html,
         ot_hours = EXCLUDED.ot_hours,
         ot_pay = EXCLUDED.ot_pay,
         festival_bonus = EXCLUDED.festival_bonus,
         reimbursement = EXCLUDED.reimbursement,
         employer_ssf = EXCLUDED.employer_ssf
       RETURNING id AS _id, *`,
      [
        row.employee_id,
        row.month,
        row.annualSalary,
        row.basic,
        row.allowance,
        row.deductions,
        row.taxDeduction,
        row.otherDeductions,
        row.attendanceDaysInMonth,
        row.presentDays,
        row.halfDayPresentDays,
        row.absentDays,
        row.leaveDays,
        row.wfhDays,
        row.perDaySalary,
        row.attendanceDeduction,
        row.grossPay,
        row.filingStatus,
        JSON.stringify(row.taxMeta),
        row.netPay,
        row.status,
        row.payslipHtml,
        row.otHours,
        row.otPay,
        row.festivalBonus,
        row.reimbursement,
        row.employerSsf,
      ],
    );

    const savedPayroll = upsertResult.rows[0];

    await notifyPayslipDone({
      employeeName:
        `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
        employee.email ||
        "Employee",
      employeeId: employee.employeeId || "-",
      employeeEmail: employee.email || "-",
      month: row.month,
      annualSalary: row.annualSalary,
      grossPay: row.grossPay,
      taxDeduction: row.taxDeduction,
      deductions: row.deductions,
      netPay: row.netPay,
      status: row.status,
    });

    savedPayroll.employee = {
      _id: employee.id,
      id: employee.id,
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
    };

    return res
      .status(201)
      .json({ message: "Payslip saved successfully", data: savedPayroll });
  } catch (err) {
    console.error("createPayroll error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  calculatePayroll,
  createPayroll,
};
