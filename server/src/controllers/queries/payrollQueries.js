import db from "../../config/db.js";
import { getOrCreateEmployeeForUser } from "../queries/employeeQueries.js";
import {
  FISCAL_YEAR,
  NEPAL_TAX_SLABS,
  renderPayslipHtml,
} from "../../services/payrollService.js";
import { htmlToPdfBuffer } from "../../services/htmlPdfService.js";

async function getTaxConfig(req, res) {
  // Build cumulative-threshold view for display purposes
  function buildDisplaySlabs(slabs) {
    let cumulative = 0;
    return slabs.map((s) => {
      const from = cumulative + 1;
      cumulative += s.upto === Number.MAX_SAFE_INTEGER ? 0 : s.upto;
      const to = s.upto === Number.MAX_SAFE_INTEGER ? null : cumulative;
      return {
        from: from === 1 ? 0 : from,
        to,
        rate: s.rate,
        label: to ? `NPR ${from.toLocaleString("en-NP")} – ${to.toLocaleString("en-NP")}` : `Above NPR ${(from - 1).toLocaleString("en-NP")}`,
      };
    });
  }

  return res.json({
    data: {
      editable: false,
      fiscalYear: FISCAL_YEAR,
      slabs: NEPAL_TAX_SLABS,
      display: {
        unmarried: buildDisplaySlabs(NEPAL_TAX_SLABS.unmarried),
        married: buildDisplaySlabs(NEPAL_TAX_SLABS.married),
      },
      provisions: [
        "1% on the first slab is Social Security Tax (SST); exempt for SSF contributors.",
        "Married couples enjoy a higher first-slab threshold (NPR 600,000 vs 500,000).",
        "Resident female employees (sole income from employment) get a 10% tax rebate.",
        "Retirement deduction: SSF cap NPR 500,000; EPF/CIT cap NPR 300,000 (or 1/3 of gross).",
        "Life insurance premium deduction capped at NPR 40,000/year.",
      ],
      note: `Nepali tax slabs are fixed per FY ${FISCAL_YEAR}. Contact admin to update.`,
    },
  });
}

async function getAdminPayrolls(req, res) {
  try {
    const { month = "", search = "" } = req.query;

    let queryStr = `
      SELECT p.id AS _id, p.id, p.month, p.annual_salary as "annualSalary", p.basic, p.allowance, p.deductions, p.tax_deduction as "taxDeduction", p.other_deductions as "otherDeductions", p.attendance_days_in_month as "attendanceDaysInMonth", p.present_days as "presentDays", p.half_day_present_days as "halfDayPresentDays", p.absent_days as "absentDays", p.leave_days as "leaveDays", p.wfh_days as "wfhDays", p.per_day_salary as "perDaySalary", p.attendance_deduction as "attendanceDeduction", p.gross_pay as "grossPay", p.filing_status as "filingStatus", p.tax_meta as "taxMeta", p.net_pay as "netPay", p.status, p.generated_at as "generatedAt",
             e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email
      FROM payrolls p
      JOIN employees e ON p.employee_id = e.id
    `;
    const params = [];

    if (month && String(month).trim()) {
      params.push(String(month).trim());
      queryStr += ` WHERE p.month = $${params.length}`;
    }

    if (search && String(search).trim()) {
      params.push(`%${String(search).trim()}%`);
      queryStr += params.length === 1 ? " WHERE" : " AND";
      queryStr += ` (e.employee_id ILIKE $${params.length} OR e.first_name ILIKE $${params.length} OR e.last_name ILIKE $${params.length} OR e.email ILIKE $${params.length})`;
    }

    queryStr += " ORDER BY p.month DESC, p.created_at DESC";
    const result = await db.query(queryStr, params);

    const mapped = result.rows.map((row) => ({
      _id: row._id,
      id: row.id,
      month: row.month,
      annualSalary: Number(row.annualSalary),
      basic: Number(row.basic),
      allowance: Number(row.allowance),
      deductions: Number(row.deductions),
      taxDeduction: Number(row.taxDeduction),
      otherDeductions: Number(row.otherDeductions),
      attendanceDaysInMonth: row.attendanceDaysInMonth,
      presentDays: row.presentDays,
      halfDayPresentDays: row.halfDayPresentDays,
      absentDays: row.absentDays,
      leaveDays: row.leaveDays,
      wfhDays: row.wfhDays,
      perDaySalary: Number(row.perDaySalary),
      attendanceDeduction: Number(row.attendanceDeduction),
      grossPay: Number(row.grossPay),
      filingStatus: row.filingStatus,
      taxMeta:
        typeof row.taxMeta === "string" ? JSON.parse(row.taxMeta) : row.taxMeta,
      netPay: Number(row.netPay),
      status: row.status,
      generatedAt: row.generatedAt,
      employee: {
        _id: row.emp_id,
        id: row.emp_id,
        employeeId: row.employeeId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
      },
    }));

    return res.json({ data: mapped });
  } catch (err) {
    console.error("getAdminPayrolls error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getMyPayrolls(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const result = await db.query(
      `SELECT id AS _id, id, month, annual_salary as "annualSalary", basic, allowance, deductions, tax_deduction as "taxDeduction", other_deductions as "otherDeductions", attendance_days_in_month as "attendanceDaysInMonth", present_days as "presentDays", half_day_present_days as "halfDayPresentDays", absent_days as "absentDays", leave_days as "leaveDays", wfh_days as "wfhDays", per_day_salary as "perDaySalary", attendance_deduction as "attendanceDeduction", gross_pay as "grossPay", filing_status as "filingStatus", tax_meta as "taxMeta", net_pay as "netPay", status, generated_at as "generatedAt"
       FROM payrolls 
       WHERE employee_id = $1 
       ORDER BY month DESC, created_at DESC`,
      [employee.id],
    );

    const mapped = result.rows.map((row) => ({
      ...row,
      annualSalary: Number(row.annualSalary),
      basic: Number(row.basic),
      allowance: Number(row.allowance),
      deductions: Number(row.deductions),
      taxDeduction: Number(row.taxDeduction),
      otherDeductions: Number(row.otherDeductions),
      perDaySalary: Number(row.perDaySalary),
      attendanceDeduction: Number(row.attendanceDeduction),
      grossPay: Number(row.grossPay),
      netPay: Number(row.netPay),
      taxMeta:
        typeof row.taxMeta === "string" ? JSON.parse(row.taxMeta) : row.taxMeta,
    }));

    return res.json({ data: mapped });
  } catch (err) {
    console.error("getMyPayrolls error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getAdminPayrollHtml(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid payroll id." });

    const result = await db.query(
      `SELECT p.*,
              e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.department, e.designation
       FROM payrolls p
       JOIN employees e ON p.employee_id = e.id
       WHERE p.id = $1`,
      [idInt],
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: "Payslip not found." });

    let html = row.payslip_html || "";
    if (!html) {
      const employee = {
        id: row.emp_id,
        _id: row.emp_id,
        employeeId: row.employeeId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        department: row.department,
        designation: row.designation,
      };

      const payrollData = {
        ...row,
        annualSalary: Number(row.annual_salary),
        basic: Number(row.basic),
        allowance: Number(row.allowance),
        deductions: Number(row.deductions),
        taxDeduction: Number(row.tax_deduction),
        otherDeductions: Number(row.other_deductions),
        grossPay: Number(row.gross_pay),
        netPay: Number(row.net_pay),
        perDaySalary: Number(row.per_day_salary),
        attendanceDeduction: Number(row.attendance_deduction),
        attendanceDaysInMonth: row.attendance_days_in_month,
        presentDays: row.present_days,
        halfDayPresentDays: row.half_day_present_days,
        absentDays: row.absent_days,
        leaveDays: row.leave_days,
        wfhDays: row.wfh_days,
      };

      html = renderPayslipHtml({
        employee,
        payroll: payrollData,
        month: row.month,
      });

      await db.query("UPDATE payrolls SET payslip_html = $1 WHERE id = $2", [
        html,
        idInt,
      ]);
    }

    return res.json({ data: { html, month: row.month } });
  } catch (err) {
    console.error("getAdminPayrollHtml error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getMyPayrollHtml(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid payroll id." });

    const employee = await getOrCreateEmployeeForUser(req.user);
    const result = await db.query(
      `SELECT p.*,
              e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.department, e.designation
       FROM payrolls p
       JOIN employees e ON p.employee_id = e.id
       WHERE p.id = $1 AND p.employee_id = $2`,
      [idInt, employee.id],
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: "Payslip not found." });

    let html = row.payslip_html || "";
    if (!html) {
      const payrollData = {
        ...row,
        annualSalary: Number(row.annual_salary),
        basic: Number(row.basic),
        allowance: Number(row.allowance),
        deductions: Number(row.deductions),
        taxDeduction: Number(row.tax_ded_duction),
        otherDeductions: Number(row.other_deductions),
        grossPay: Number(row.gross_pay),
        netPay: Number(row.net_pay),
        perDaySalary: Number(row.per_day_salary),
        attendanceDeduction: Number(row.attendance_deduction),
        attendanceDaysInMonth: row.attendance_days_in_month,
        presentDays: row.present_days,
        halfDayPresentDays: row.half_day_present_days,
        absentDays: row.absent_days,
        leaveDays: row.leave_days,
        wfhDays: row.wfh_days,
      };

      html = renderPayslipHtml({
        employee,
        payroll: payrollData,
        month: row.month,
      });

      await db.query("UPDATE payrolls SET payslip_html = $1 WHERE id = $2", [
        html,
        idInt,
      ]);
    }

    return res.json({ data: { html, month: row.month } });
  } catch (err) {
    console.error("getMyPayrollHtml error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function downloadAdminPayrollPdf(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid payroll id." });

    const result = await db.query(
      `SELECT p.*,
              e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.department, e.designation
       FROM payrolls p
       JOIN employees e ON p.employee_id = e.id
       WHERE p.id = $1`,
      [idInt],
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: "Payslip not found." });

    let html = row.payslip_html || "";
    if (!html) {
      const employee = {
        id: row.emp_id,
        _id: row.emp_id,
        employeeId: row.employeeId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        department: row.department,
        designation: row.designation,
      };

      const payrollData = {
        ...row,
        annualSalary: Number(row.annual_salary),
        basic: Number(row.basic),
        allowance: Number(row.allowance),
        deductions: Number(row.deductions),
        taxDeduction: Number(row.tax_deduction),
        otherDeductions: Number(row.other_deductions),
        grossPay: Number(row.gross_pay),
        netPay: Number(row.net_pay),
        perDaySalary: Number(row.per_day_salary),
        attendanceDeduction: Number(row.attendance_deduction),
        attendanceDaysInMonth: row.attendance_days_in_month,
        presentDays: row.present_days,
        halfDayPresentDays: row.half_day_present_days,
        absentDays: row.absent_days,
        leaveDays: row.leave_days,
        wfhDays: row.wfh_days,
      };

      html = renderPayslipHtml({
        employee,
        payroll: payrollData,
        month: row.month,
      });

      await db.query("UPDATE payrolls SET payslip_html = $1 WHERE id = $2", [
        html,
        idInt,
      ]);
    }

    const pdf = await htmlToPdfBuffer(html);
    const filename = `payslip-${row.employeeId || "EMP"}-${row.month || "month"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (err) {
    console.error("downloadAdminPayrollPdf error:", err);
    return res.status(500).json({ message: "Failed to generate PDF." });
  }
}

async function downloadMyPayrollPdf(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid payroll id." });

    const employee = await getOrCreateEmployeeForUser(req.user);
    const result = await db.query(
      `SELECT p.*,
              e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.department, e.designation
       FROM payrolls p
       JOIN employees e ON p.employee_id = e.id
       WHERE p.id = $1 AND p.employee_id = $2`,
      [idInt, employee.id],
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: "Payslip not found." });

    let html = row.payslip_html || "";
    if (!html) {
      const payrollData = {
        ...row,
        annualSalary: Number(row.annual_salary),
        basic: Number(row.basic),
        allowance: Number(row.allowance),
        deductions: Number(row.deductions),
        taxDeduction: Number(row.tax_deduction),
        otherDeductions: Number(row.other_deductions),
        grossPay: Number(row.gross_pay),
        netPay: Number(row.net_pay),
        perDaySalary: Number(row.per_day_salary),
        attendanceDeduction: Number(row.attendance_deduction),
        attendanceDaysInMonth: row.attendance_days_in_month,
        presentDays: row.present_days,
        halfDayPresentDays: row.half_day_present_days,
        absentDays: row.absent_days,
        leaveDays: row.leave_days,
        wfhDays: row.wfh_days,
      };

      html = renderPayslipHtml({
        employee,
        payroll: payrollData,
        month: row.month,
      });

      await db.query("UPDATE payrolls SET payslip_html = $1 WHERE id = $2", [
        html,
        idInt,
      ]);
    }

    const pdf = await htmlToPdfBuffer(html);
    const filename = `payslip-${employee.employeeId || "EMP"}-${row.month || "month"}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (err) {
    console.error("downloadMyPayrollPdf error:", err);
    return res.status(500).json({ message: "Failed to generate PDF." });
  }
}

export { getTaxConfig, getAdminPayrolls, getMyPayrolls, getAdminPayrollHtml, getMyPayrollHtml, downloadAdminPayrollPdf, downloadMyPayrollPdf };
export default { getTaxConfig, getAdminPayrolls, getMyPayrolls, getAdminPayrollHtml, getMyPayrollHtml, downloadAdminPayrollPdf, downloadMyPayrollPdf };
