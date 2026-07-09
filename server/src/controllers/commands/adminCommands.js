import db from "../../config/db.js";
import bcrypt from "bcryptjs";
import {
  notifyTerminationAction,
  sendWelcomeCredentialsMail,
} from "../../services/mailService.js";

const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,79}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

function splitName(fullName = "") {
  const trimmed = String(fullName).trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

function normalizeRole(inputRole = "employee") {
  return String(inputRole || "employee")
    .trim()
    .toLowerCase();
}

function validateName(name) {
  const value = String(name || "").trim();
  if (!value) return "Name is required.";
  if (!NAME_REGEX.test(value))
    return "Name is invalid. Use letters and spaces only.";
  return "";
}

function validateEmail(email) {
  const value = String(email || "")
    .trim()
    .toLowerCase();
  if (!value) return "Email is required.";
  if (!EMAIL_REGEX.test(value)) return "Please enter a valid email.";
  return "";
}

function validatePassword(password) {
  const value = String(password || "");
  if (!value) return "Password is required.";
  if (!PASSWORD_REGEX.test(value)) {
    return "Password must be 8+ chars with uppercase, lowercase and number.";
  }
  return "";
}

function validatePhone(phone) {
  const value = String(phone || "").trim();
  if (!value) return "";
  if (!PHONE_REGEX.test(value)) return "Phone number is invalid.";
  return "";
}

function validateAnnualSalary(annualSalary) {
  const n = Number(annualSalary);
  if (!Number.isFinite(n) || n <= 0)
    return "Annual salary must be greater than 0.";
  if (n > 10000000) return "Annual salary is too large.";
  return "";
}

async function findDepartmentManager(department, excludeEmployeeId = null) {
  const dept = String(department || "").trim();
  if (!dept) return null;

  let query = `
    SELECT e.id, e.first_name as "firstName", e.last_name as "lastName", e.email, e.employee_id as "employeeId"
    FROM employees e
    JOIN users u ON e.user_id = u.id
    WHERE e.department = $1 AND u.role = 'manager' AND e.status != 'layoff'
  `;
  const params = [dept];
  if (excludeEmployeeId) {
    params.push(excludeEmployeeId);
    query += ` AND e.id != $2`;
  }

  const result = await db.query(query, params);
  return result.rows[0];
}

async function createEmployee(req, res) {
  try {
    const {
      name,
      email,
      password,
      phone = "",
      department,
      position,
      role = "employee",
      annualSalary = 0,
      filingStatus = "unmarried",
      gender = "male",
      ssfContributor = false,
      citContribution = 0,
      insurancePremium = 0,
    } = req.body;
    const normalizedRole = normalizeRole(role);
    const safeAnnualSalary = Math.max(0, Number(annualSalary) || 0);
    const safeFilingStatus =
      String(filingStatus) === "married" ? "married" : "unmarried";
    const safeGender = String(gender || "male").toLowerCase();
    const safeSsfContributor = Boolean(ssfContributor);
    const safeCitContribution = Math.max(0, Number(citContribution) || 0);
    const safeInsurancePremium = Math.max(0, Number(insurancePremium) || 0);

    const nameError = validateName(name);
    if (nameError) return res.status(400).json({ message: nameError });
    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ message: emailError });
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });
    const phoneError = validatePhone(phone);
    if (phoneError) return res.status(400).json({ message: phoneError });
    const salaryError = validateAnnualSalary(annualSalary);
    if (salaryError) return res.status(400).json({ message: salaryError });

    if (
      ![
        "employee",
        "manager",
        "project_manager",
        "department_head",
        "admin",
      ].includes(normalizedRole)
    ) {
      return res
        .status(400)
        .json({
          message:
            "Role must be employee, manager, project_manager, department_head, or admin.",
        });
    }
    if (
      ["manager", "project_manager", "department_head"].includes(
        normalizedRole,
      ) &&
      !String(department || "").trim()
    ) {
      return res
        .status(400)
        .json({ message: "Department is required for manager roles." });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existingResult = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail],
    );
    if (existingResult.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "A user with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const avatarPath = req.file ? `/uploads/avatars/${req.file.filename}` : null;

    const userResult = await db.query(
      "INSERT INTO users (name, email, password, role, avatar, otp_required_for_login) VALUES ($1, $2, $3, $4, $5, false) RETURNING *",
      [name, normalizedEmail, hashedPassword, normalizedRole, avatarPath],
    );
    const user = userResult.rows[0];

    const { firstName, lastName } = splitName(name);
    const employeeId = `EMP-${Date.now()}`;

    const empResult = await db.query(
      `INSERT INTO employees (user_id, employee_id, first_name, last_name, email, phone, department, designation, status, annual_salary, filing_status, base_salary, gender, ssf_contributor, cit_contribution, insurance_premium)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11, $12, $13, $14, $15)
       RETURNING id AS _id, id, employee_id as "employeeId", first_name as "firstName", last_name as "lastName", email, phone, department, designation, status, annual_salary as "annualSalary", filing_status as "filingStatus", base_salary as "baseSalary", gender, ssf_contributor as "ssfContributor", cit_contribution as "citContribution", insurance_premium as "insurancePremium"`,
      [
        user.id,
        employeeId,
        firstName || name,
        lastName,
        normalizedEmail,
        String(phone || "").trim(),
        department || "",
        position || (normalizedRole === "manager" ? "Manager" : ""),
        safeAnnualSalary,
        safeFilingStatus,
        Math.round(safeAnnualSalary / 12),
        safeGender,
        safeSsfContributor,
        safeCitContribution,
        safeInsurancePremium,
      ],
    );
    const employee = empResult.rows[0];

    try {
      await sendWelcomeCredentialsMail({
        name,
        email: normalizedEmail,
        password,
        role: normalizedRole,
      });
    } catch (mailErr) {
      console.error("welcome mail error:", mailErr?.message || mailErr);
    }

    return res.status(201).json({
      message: "Employee registered successfully",
      user: {
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      employee,
    });
  } catch (err) {
    console.error("createEmployee error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateEmployee(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid employee id" });

    const empResult = await db.query("SELECT * FROM employees WHERE id = $1", [
      idInt,
    ]);
    const employee = empResult.rows[0];
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [
      employee.user_id,
    ]);
    const userObj = userResult.rows[0];

    const {
      name,
      email,
      department,
      designation,
      status,
      phone,
      annualSalary,
      filingStatus,
      role,
      gender,
      ssfContributor,
      citContribution,
      insurancePremium,
    } = req.body;

    let updatedName = userObj.name;
    let updatedFirstName = employee.first_name;
    let updatedLastName = employee.last_name;
    if (name !== undefined) {
      const nameError = validateName(name);
      if (nameError) return res.status(400).json({ message: nameError });
      const { firstName, lastName } = splitName(name);
      updatedFirstName = firstName || employee.first_name;
      updatedLastName = lastName;
      updatedName = String(name).trim();
    }

    let updatedEmail = employee.email;
    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const emailError = validateEmail(normalizedEmail);
      if (emailError) return res.status(400).json({ message: emailError });

      const emailCheck = await db.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [normalizedEmail, userObj.id],
      );
      if (emailCheck.rows.length > 0) {
        return res
          .status(409)
          .json({ message: "A user with this email already exists." });
      }
      updatedEmail = normalizedEmail;
    }

    let updatedDepartment =
      department !== undefined
        ? String(department).trim()
        : employee.department;
    let updatedDesignation =
      designation !== undefined
        ? String(designation).trim()
        : employee.designation;

    let updatedPhone = employee.phone;
    if (phone !== undefined) {
      const phoneError = validatePhone(phone);
      if (phoneError) return res.status(400).json({ message: phoneError });
      updatedPhone = String(phone).trim();
    }

    let updatedAnnualSalary = Number(employee.annual_salary);
    let updatedBaseSalary = Number(employee.base_salary);
    if (annualSalary !== undefined) {
      const salaryError = validateAnnualSalary(annualSalary);
      if (salaryError) return res.status(400).json({ message: salaryError });
      updatedAnnualSalary = Math.max(0, Number(annualSalary) || 0);
      updatedBaseSalary = Math.round(updatedAnnualSalary / 12);
    }

    let updatedFilingStatus =
      filingStatus !== undefined
        ? String(filingStatus) === "married"
          ? "married"
          : "unmarried"
        : employee.filing_status;
    let updatedGender =
      gender !== undefined
        ? String(gender).trim().toLowerCase()
        : employee.gender;
    let updatedSsfContributor =
      ssfContributor !== undefined
        ? Boolean(ssfContributor)
        : employee.ssf_contributor;
    let updatedCitContribution =
      citContribution !== undefined
        ? Math.max(0, Number(citContribution) || 0)
        : Number(employee.cit_contribution || 0);
    let updatedInsurancePremium =
      insurancePremium !== undefined
        ? Math.max(0, Number(insurancePremium) || 0)
        : Number(employee.insurance_premium || 0);

    let updatedStatus = employee.status;
    if (status !== undefined) {
      if (!["active", "inactive", "layoff"].includes(String(status))) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      updatedStatus = status;
    }

    let updatedRole = userObj.role;
    if (role !== undefined) {
      const normalizedRole = normalizeRole(role);
      if (
        ![
          "employee",
          "manager",
          "project_manager",
          "department_head",
          "admin",
        ].includes(normalizedRole)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Role must be employee, manager, project_manager, department_head, or admin.",
          });
      }
      updatedRole = normalizedRole;
    }

    if (
      ["manager", "project_manager", "department_head"].includes(updatedRole) &&
      !updatedDepartment
    ) {
      return res
        .status(400)
        .json({ message: "Manager roles must have a department." });
    }

    // Update employees table
    await db.query(
      `UPDATE employees 
       SET first_name = $1, last_name = $2, email = $3, department = $4, designation = $5, status = $6, phone = $7, annual_salary = $8, filing_status = $9, base_salary = $10, gender = $11, ssf_contributor = $12, cit_contribution = $13, insurance_premium = $14 
       WHERE id = $15`,
      [
        updatedFirstName,
        updatedLastName,
        updatedEmail,
        updatedDepartment,
        updatedDesignation,
        updatedStatus,
        updatedPhone,
        updatedAnnualSalary,
        updatedFilingStatus,
        updatedBaseSalary,
        updatedGender,
        updatedSsfContributor,
        updatedCitContribution,
        updatedInsurancePremium,
        idInt,
      ],
    );

    // Update users table
    await db.query(
      "UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4",
      [updatedName, updatedEmail, updatedRole, userObj.id],
    );

    // Reload
    const reloadedResult = await db.query(
      `SELECT e.id as _id, e.id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.phone, e.department, e.designation, e.join_date as "joinDate", e.status, e.annual_salary as "annualSalary", e.filing_status as "filingStatus", e.base_salary as "baseSalary", e.gender, e.ssf_contributor as "ssfContributor", e.cit_contribution as "citContribution", e.insurance_premium as "insurancePremium",
              u.name as u_name, u.email as u_email, u.role as u_role
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = $1`,
      [idInt],
    );
    const updatedEmployee = reloadedResult.rows[0];
    updatedEmployee.user = {
      _id: userObj.id,
      id: userObj.id,
      name: updatedEmployee.u_name,
      email: updatedEmployee.u_email,
      role: updatedEmployee.u_role,
    };

    return res.json({
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (err) {
    console.error("updateEmployee error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteEmployee(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    if (isNaN(idInt))
      return res.status(400).json({ message: "Invalid employee id" });

    const empResult = await db.query(
      "SELECT e.*, u.role FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = $1",
      [idInt]
    );
    const employee = empResult.rows[0];
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    if (employee.role === "admin") {
      return res
        .status(403)
        .json({ message: "Action not allowed. Admin accounts cannot be deleted or laid off." });
    }

    const action = String(req.body?.action || req.query?.action || "")
      .trim()
      .toLowerCase();
    if (!["layoff", "fire"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Action is required: layoff or fire." });
    }

    const fullName =
      `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
      employee.email;
    const empEmail = employee.email || "";

    if (action === "layoff") {
      await db.query("UPDATE employees SET status = 'layoff' WHERE id = $1", [
        idInt,
      ]);

      if (empEmail) {
        await notifyTerminationAction({
          action: "layoff",
          employeeName: fullName,
          employeeEmail: empEmail,
          employeeId: employee.employee_id || "-",
        });
      }

      return res.json({ message: "Employee marked as laid off." });
    }

    // Fire -> Delete everything. Thanks to cascade we just delete the user row!
    await db.query("DELETE FROM users WHERE id = $1", [employee.user_id]);

    if (empEmail) {
      await notifyTerminationAction({
        action: "fire",
        employeeName: fullName,
        employeeEmail: empEmail,
        employeeId: employee.employee_id || "-",
      });
    }

    return res.json({ message: "Employee fired and deleted successfully." });
  } catch (err) {
    console.error("deleteEmployee error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export { createEmployee, updateEmployee, deleteEmployee };
export default { createEmployee, updateEmployee, deleteEmployee };
