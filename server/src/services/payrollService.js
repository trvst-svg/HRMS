// services/payrollService.js
// Simple payroll helpers used by payroll controller.

import fs from "fs";
import path from "path";

// ESM __dirname equivalent
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// ---------------------------------------------------------------------------
// Nepal Income Tax Slabs — FY 2082/83 (2025/26)
// Source: Income Tax Act, 2058 (2002), as amended by Finance Act 2082
// Administered by the Inland Revenue Department (IRD), https://ird.gov.np
//
// These are progressive slabs: each rate applies only to the income that
// falls within that band.  The "upto" value is the WIDTH of each band
// (not a cumulative threshold).
//
// Key provisions reflected in the payroll calculation:
//   1. Social Security Tax (SST) — The 1% rate on the first slab is the
//      SST.  If the employee contributes to SSF, this slab is taxed at 0%.
//   2. Married couples — First slab is NPR 600,000 (vs 500,000 for singles).
//   3. Female rebate — Resident female employees whose sole income source
//      is employment get a 10% rebate on total tax liability.
//   4. Retirement deduction cap — SSF contributors: min(actual, 1/3 gross,
//      NPR 500,000).  Non-SSF (EPF/CIT): min(actual, 1/3 gross, NPR 300,000).
//   5. Life insurance premium deduction capped at NPR 40,000/year.
//   6. Non-residents are taxed at a flat 25% (not handled here; this module
//      covers resident employees only).
//
// Admin cannot edit these from the UI.  To update for a new fiscal year,
// change the slab table below and bump FISCAL_YEAR.
// ---------------------------------------------------------------------------
const FISCAL_YEAR = "2082/83";

const NEPAL_TAX_SLABS = {
  unmarried: [
    { upto: 500000, rate: 1 },   // NPR 0 – 500,000        (SST)
    { upto: 200000, rate: 10 },  // NPR 500,001 – 700,000
    { upto: 300000, rate: 20 },  // NPR 700,001 – 1,000,000
    { upto: 1000000, rate: 30 }, // NPR 1,000,001 – 2,000,000
    { upto: 3000000, rate: 36 }, // NPR 2,000,001 – 5,000,000
    { upto: Number.MAX_SAFE_INTEGER, rate: 39 }, // Above NPR 5,000,000
  ],
  married: [
    { upto: 600000, rate: 1 },   // NPR 0 – 600,000        (SST)
    { upto: 200000, rate: 10 },  // NPR 600,001 – 800,000
    { upto: 300000, rate: 20 },  // NPR 800,001 – 1,100,000
    { upto: 900000, rate: 30 },  // NPR 1,100,001 – 2,000,000
    { upto: 3000000, rate: 36 }, // NPR 2,000,001 – 5,000,000
    { upto: Number.MAX_SAFE_INTEGER, rate: 39 }, // Above NPR 5,000,000
  ],
};

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Filing status only supports the two values used by the tax slab table.
function normalizeFilingStatus(v) {
  return String(v) === "married" ? "married" : "unmarried";
}

// Walk through the slab table and accumulate tax one slab at a time.
// Uses the single NEPAL_TAX_SLABS constant so there is only one place to
// update when rates change for a new fiscal year.
function calculateAnnualTax(
  taxableIncome,
  filingStatus = "unmarried",
  ssfContributor = false,
) {
  const normalizedStatus = normalizeFilingStatus(filingStatus);
  const baseSlabs = NEPAL_TAX_SLABS[normalizedStatus];

  // SSF contributors are exempt from the 1% Social Security Tax on the
  // first slab, so override that rate to 0%.
  const slabs = baseSlabs.map((slab, idx) =>
    idx === 0 && ssfContributor ? { ...slab, rate: 0 } : slab,
  );

  let remaining = Math.max(0, toNumber(taxableIncome, 0));
  let tax = 0;

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const taxablePart = Math.min(remaining, slab.upto);
    tax += taxablePart * (slab.rate / 100);
    remaining -= taxablePart;
  }

  return Math.round(tax);
}

// Convert annual salary into the recurring monthly payroll numbers that the
// controller later adjusts with attendance-based deductions.
function calculateMonthlyPayrollFromAnnual({
  annualSalary = 0,
  filingStatus = "unmarried",
  otherDeductions = 0,
  gender = "male",
  ssfContributor = false,
  citContribution = 0,
  insurancePremium = 0,
  otHours = 0,
  includeFestivalBonus = false,
  reimbursement = 0,
}) {
  const safeAnnualSalary = Math.max(0, toNumber(annualSalary, 0));
  const safeFilingStatus = normalizeFilingStatus(filingStatus);
  const safeOtherDeductions = Math.max(0, toNumber(otherDeductions, 0));
  const safeCitContribution = Math.max(0, toNumber(citContribution, 0));
  const safeInsurancePremium = Math.max(0, toNumber(insurancePremium, 0));
  const safeOtHours = Math.max(0, toNumber(otHours, 0));
  const safeReimbursement = Math.max(0, toNumber(reimbursement, 0));

  const grossPay = Math.round(safeAnnualSalary / 12);
  const basicMonthly = Math.round(grossPay * 0.6);

  // 1. Overtime Calculation (1.5x basic hourly rate, assuming 26 days of 8 hours)
  const hourlyBasic = basicMonthly / (26 * 8);
  const otPay = safeOtHours * 1.5 * hourlyBasic;

  // 2. Festival Bonus (Dashain Bonus = 1 month of basic salary)
  const festivalBonus = includeFestivalBonus ? basicMonthly : 0;

  // Total Projected Annual Gross for tax calculations
  const projectedAnnualGross = safeAnnualSalary + otPay * 12 + festivalBonus;

  // Basic salary is assumed to be 60% of total salary in Nepali standard practice,
  // and 40% is allowance.
  const annualBasicSalary = safeAnnualSalary * 0.6;
  const annualSsf = ssfContributor ? annualBasicSalary * 0.11 : 0;
  const annualCit = safeCitContribution * 12;

  // combined retirement deduction limit:
  // for SSF contributors, the maximum is Rs. 500,000 or 1/3 of total taxable income.
  // for non-SSF (EPF/CIT), the maximum is Rs. 300,000 or 1/3 of total taxable income.
  const maxRetirementLimit = ssfContributor ? 500000 : 300000;
  const actualRetirementDeduction = annualSsf + annualCit;
  const annualRetirementDeduction = Math.min(
    projectedAnnualGross / 3,
    maxRetirementLimit,
    actualRetirementDeduction,
  );

  // Life insurance premium deduction limit is Rs. 40,000 per year.
  const annualInsuranceDeduction = Math.min(40000, safeInsurancePremium);

  // Taxable Income
  const taxableIncome = Math.max(
    0,
    projectedAnnualGross - annualRetirementDeduction - annualInsuranceDeduction,
  );

  // Calculate annual tax
  let annualTax = calculateAnnualTax(
    taxableIncome,
    safeFilingStatus,
    ssfContributor,
  );

  // Female rebate of 10% on tax liability if only source of income is employment and gender is female
  if (String(gender).toLowerCase() === "female") {
    annualTax = Math.round(annualTax * 0.9);
  }

  const monthlyTax = Math.round(annualTax / 12);
  const monthlySsf = Math.round(ssfContributor ? basicMonthly * 0.11 : 0);
  const monthlyCit = Math.round(safeCitContribution);

  // Employer matching SSF (20% of basic monthly)
  const employerSsf = Math.round(ssfContributor ? basicMonthly * 0.2 : 0);

  const deductions = monthlyTax + monthlySsf + monthlyCit + safeOtherDeductions;
  const netPay = Math.max(
    0,
    grossPay +
      Math.round(otPay) +
      Math.round(festivalBonus) +
      safeReimbursement -
      deductions,
  );

  return {
    annualSalary: safeAnnualSalary,
    filingStatus: safeFilingStatus,
    grossPay,
    basic: basicMonthly,
    allowance: Math.round(grossPay * 0.4),
    taxDeduction: monthlyTax,
    otherDeductions: safeOtherDeductions,
    deductions,
    netPay,
    otHours: safeOtHours,
    otPay: Math.round(otPay),
    festivalBonus: Math.round(festivalBonus),
    reimbursement: safeReimbursement,
    employerSsf,
    taxMeta: {
      annualTaxableIncome: taxableIncome,
      annualTax,
      monthlyTax,
      monthlySsf,
      monthlyCit,
      annualSsf,
      annualCit,
      retirementDeduction: annualRetirementDeduction,
      insuranceDeduction: annualInsuranceDeduction,
      gender,
      ssfContributor,
      employerSsf,
      otHours: safeOtHours,
      otPay: Math.round(otPay),
      festivalBonus: Math.round(festivalBonus),
      reimbursement: safeReimbursement,
    },
  };
}

// Keep currency formatting in one helper so every payslip uses the same style.
function formatCurrency(value) {
  return `NPR ${Math.round(toNumber(value, 0)).toLocaleString("en-NP")}`;
}

function replacePlaceholders(template, payload) {
  let output = template;
  Object.keys(payload).forEach((key) => {
    const rawValue =
      payload[key] === undefined || payload[key] === null
        ? ""
        : String(payload[key]);
    const safeValue = rawValue.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    output = output.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), safeValue);
  });
  return output;
}

// Fill the HTML payslip template with the calculated payroll values.
function renderPayslipHtml({ employee, payroll, month }) {
  const templatePath = path.join(__dirname, "..", "templates", "payslip.html");
  const template = fs.readFileSync(templatePath, "utf8");

  const employeeName =
    `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
    employee.email ||
    "Employee";
  const payload = {
    month: month || payroll.month || "-",
    generatedDate: new Date().toLocaleDateString("en-GB"),
    employeeName,
    employeeId: employee.employeeId || "-",
    department: employee.department || "N/A",
    designation: employee.designation || "Employee",
    annualSalary: formatCurrency(payroll.annualSalary),
    monthlyGross: formatCurrency(payroll.grossPay),
    otHours: Number(payroll.otHours || 0),
    otPay: formatCurrency(payroll.otPay || 0),
    festivalBonus: formatCurrency(payroll.festivalBonus || 0),
    ssfDeduction: formatCurrency(payroll.taxMeta?.monthlySsf || 0),
    citDeduction: formatCurrency(payroll.taxMeta?.monthlyCit || 0),
    taxDeduction: formatCurrency(payroll.taxDeduction),
    otherDeductions: formatCurrency(payroll.otherDeductions),
    reimbursement: formatCurrency(payroll.reimbursement || 0),
    attendanceDeduction: formatCurrency(payroll.attendanceDeduction || 0),
    totalDeductions: formatCurrency(payroll.deductions),
    netPay: formatCurrency(payroll.netPay),
    filingStatus: payroll.filingStatus,
    annualTax: formatCurrency(payroll.taxMeta?.annualTax || 0),
    employerSsf: formatCurrency(
      payroll.employerSsf || payroll.taxMeta?.employerSsf || 0,
    ),
    status: payroll.status || "Processed",
    daysInMonth: Number(payroll.attendanceDaysInMonth || 0),
    presentDays: Number(payroll.presentDays || 0),
    absentDays: Number(payroll.absentDays || 0),
    leaveDays: Number(payroll.leaveDays || 0),
    wfhDays: Number(payroll.wfhDays || 0),
    perDaySalary: formatCurrency(payroll.perDaySalary || 0),
  };

  return replacePlaceholders(template, payload);
}

export { FISCAL_YEAR, NEPAL_TAX_SLABS, normalizeFilingStatus, calculateAnnualTax, calculateMonthlyPayrollFromAnnual, renderPayslipHtml };
export default { FISCAL_YEAR, NEPAL_TAX_SLABS, normalizeFilingStatus, calculateAnnualTax, calculateMonthlyPayrollFromAnnual, renderPayslipHtml };
