const db = require("../../config/db");
const { getOrCreateEmployeeForUser } = require("../queries/employeeQueries");
const { renderDocumentHtml } = require("../../services/pdfService");

const allowedTypes = [
  "Experience Letter",
  "Salary Certificate",
  "Employment Verification",
  "No Objection Certificate",
];

function formatCurrency(value) {
  const num = Number(value || 0);
  return `NPR ${num.toLocaleString("en-NP")}`;
}

async function createMyDocumentRequest(req, res) {
  try {
    const { type, purpose = "" } = req.body;
    if (!allowedTypes.includes(String(type))) {
      return res.status(400).json({ message: "Invalid document type." });
    }

    const employee = await getOrCreateEmployeeForUser(req.user);
    const result = await db.query(
      `INSERT INTO document_requests (employee_id, requested_by_role, type, purpose, status)
       VALUES ($1, $2, $3, $4, 'Pending')
       RETURNING id AS _id, id, requested_by_role as "requestedByRole", type, purpose, status`,
      [
        employee.id,
        req.user.role === "manager" ? "manager" : "employee",
        type,
        String(purpose).trim(),
      ],
    );

    return res
      .status(201)
      .json({ message: "Document request submitted", data: result.rows[0] });
  } catch (err) {
    console.error("createMyDocumentRequest error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function approveDocumentRequest(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) return res.status(400).json({ message: "Invalid ID." });

    const result = await db.query(
      `SELECT dr.*,
              e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.department, e.designation, e.annual_salary as "annualSalary"
       FROM document_requests dr
       JOIN employees e ON dr.employee_id = e.id
       WHERE dr.id = $1`,
      [idInt],
    );
    const requestDoc = result.rows[0];
    if (!requestDoc)
      return res.status(404).json({ message: "Request not found." });

    const payload = {
      issueDate: new Date().toLocaleDateString("en-GB"),
      employeeName:
        `${requestDoc.firstName || ""} ${requestDoc.lastName || ""}`.trim(),
      employeeId: requestDoc.employeeId || "",
      designation: requestDoc.designation || "Employee",
      department: requestDoc.department || "N/A",
      purpose: requestDoc.purpose || "Official purpose",
      salary: formatCurrency(requestDoc.annualSalary),
    };

    const html = renderDocumentHtml(requestDoc.type, payload);

    const updateResult = await db.query(
      `UPDATE document_requests 
       SET status = 'Approved', generated_html = $1, reviewed_by = $2, reviewed_at = $3, rejection_reason = ''
       WHERE id = $4
       RETURNING id AS _id, id, requested_by_role as "requestedByRole", type, purpose, status, reviewed_by as "reviewedBy", reviewed_at as "reviewedAt", rejection_reason as "rejectionReason"`,
      [html, req.user.id, new Date(), idInt],
    );

    const updatedDoc = updateResult.rows[0];
    updatedDoc.employee = {
      _id: requestDoc.emp_id,
      id: requestDoc.emp_id,
      employeeId: requestDoc.employeeId,
      firstName: requestDoc.firstName,
      lastName: requestDoc.lastName,
      email: requestDoc.email,
      department: requestDoc.department,
      designation: requestDoc.designation,
      annualSalary: Number(requestDoc.annualSalary),
    };

    return res.json({ message: "Document request approved", data: updatedDoc });
  } catch (err) {
    console.error("approveDocumentRequest error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function rejectDocumentRequest(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) return res.status(400).json({ message: "Invalid ID." });

    const { reason = "" } = req.body;

    const result = await db.query(
      `SELECT dr.*,
              e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.department, e.designation, e.annual_salary as "annualSalary"
       FROM document_requests dr
       JOIN employees e ON dr.employee_id = e.id
       WHERE dr.id = $1`,
      [idInt],
    );
    const requestDoc = result.rows[0];
    if (!requestDoc)
      return res.status(404).json({ message: "Request not found." });

    const updateResult = await db.query(
      `UPDATE document_requests 
       SET status = 'Rejected', reviewed_by = $1, reviewed_at = $2, rejection_reason = $3, generated_html = ''
       WHERE id = $4
       RETURNING id AS _id, id, requested_by_role as "requestedByRole", type, purpose, status, reviewed_by as "reviewedBy", reviewed_at as "reviewedAt", rejection_reason as "rejectionReason"`,
      [req.user.id, new Date(), String(reason).trim(), idInt],
    );

    const updatedDoc = updateResult.rows[0];
    updatedDoc.employee = {
      _id: requestDoc.emp_id,
      id: requestDoc.emp_id,
      employeeId: requestDoc.employeeId,
      firstName: requestDoc.firstName,
      lastName: requestDoc.lastName,
      email: requestDoc.email,
      department: requestDoc.department,
      designation: requestDoc.designation,
      annualSalary: Number(requestDoc.annualSalary),
    };

    return res.json({ message: "Document request rejected", data: updatedDoc });
  } catch (err) {
    console.error("rejectDocumentRequest error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createMyDocumentRequest,
  approveDocumentRequest,
  rejectDocumentRequest,
};
