const db = require("../../config/db");
const { getOrCreateEmployeeForUser } = require("./employeeQueries");
const { htmlToPdfBuffer } = require("../../services/htmlPdfService");

async function getMyDocumentRequests(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const result = await db.query(
      `SELECT id AS _id, id, requested_by_role as "requestedByRole", type, purpose, status, reviewed_by as "reviewedBy", reviewed_at as "reviewedAt", rejection_reason as "rejectionReason", generated_html as "generatedHtml", created_at as "createdAt", updated_at as "updatedAt"
       FROM document_requests 
       WHERE employee_id = $1 
       ORDER BY created_at DESC`,
      [employee.id],
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getMyDocumentRequests error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getAdminDocumentRequests(req, res) {
  try {
    const { status = "", role = "", search = "" } = req.query;

    let queryStr = `
      SELECT dr.id AS _id, dr.id, dr.requested_by_role as "requestedByRole", dr.type, dr.purpose, dr.status, dr.reviewed_by as "reviewedBy", dr.reviewed_at as "reviewedAt", dr.rejection_reason as "rejectionReason", dr.generated_html as "generatedHtml", dr.created_at as "createdAt", dr.updated_at as "updatedAt",
             e.id as emp_id, e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName", e.email, e.department, e.designation, e.annual_salary as "annualSalary"
      FROM document_requests dr
      JOIN employees e ON dr.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      queryStr += ` AND dr.status = $${params.length}`;
    }

    if (role && ["employee", "manager"].includes(String(role))) {
      params.push(role);
      queryStr += ` AND dr.requested_by_role = $${params.length}`;
    }

    if (search && String(search).trim()) {
      params.push(`%${String(search).trim()}%`);
      queryStr += ` AND (e.employee_id ILIKE $${params.length} OR e.first_name ILIKE $${params.length} OR e.last_name ILIKE $${params.length} OR e.email ILIKE $${params.length})`;
    }

    queryStr += " ORDER BY dr.created_at DESC";
    const result = await db.query(queryStr, params);

    const data = result.rows.map((row) => ({
      _id: row._id,
      id: row.id,
      requestedByRole: row.requestedByRole,
      type: row.type,
      purpose: row.purpose,
      status: row.status,
      reviewedBy: row.reviewedBy,
      reviewedAt: row.reviewedAt,
      rejectionReason: row.rejectionReason,
      generatedHtml: row.generatedHtml,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      employee: {
        _id: row.emp_id,
        id: row.emp_id,
        employeeId: row.employeeId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        department: row.department,
        designation: row.designation,
        annualSalary: Number(row.annualSalary),
      },
    }));

    return res.json({ data });
  } catch (err) {
    console.error("getAdminDocumentRequests error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getApprovedDocumentHtml(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) return res.status(400).json({ message: "Invalid ID." });

    const result = await db.query(
      "SELECT * FROM document_requests WHERE id = $1",
      [idInt],
    );
    const doc = result.rows[0];
    if (!doc) return res.status(404).json({ message: "Request not found." });
    if (doc.status !== "Approved" || !doc.generated_html) {
      return res
        .status(400)
        .json({ message: "Document is not generated yet." });
    }
    return res.json({ data: { html: doc.generated_html, type: doc.type } });
  } catch (err) {
    console.error("getApprovedDocumentHtml error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getMyApprovedDocumentHtml(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) return res.status(400).json({ message: "Invalid ID." });

    const employee = await getOrCreateEmployeeForUser(req.user);
    const result = await db.query(
      "SELECT * FROM document_requests WHERE id = $1 AND employee_id = $2",
      [idInt, employee.id],
    );
    const doc = result.rows[0];
    if (!doc) return res.status(404).json({ message: "Request not found." });
    if (doc.status !== "Approved" || !doc.generated_html) {
      return res
        .status(400)
        .json({ message: "Document is not generated yet." });
    }
    return res.json({ data: { html: doc.generated_html, type: doc.type } });
  } catch (err) {
    console.error("getMyApprovedDocumentHtml error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function downloadApprovedDocumentPdf(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) return res.status(400).json({ message: "Invalid ID." });

    const result = await db.query(
      `SELECT dr.*, dr.generated_html as "generatedHtml",
              e.employee_id as "employeeId", e.first_name as "firstName", e.last_name as "lastName"
       FROM document_requests dr
       JOIN employees e ON dr.employee_id = e.id
       WHERE dr.id = $1`,
      [idInt],
    );
    const doc = result.rows[0];
    if (!doc) return res.status(404).json({ message: "Request not found." });
    if (doc.status !== "Approved" || !doc.generatedHtml) {
      return res
        .status(400)
        .json({ message: "Document is not generated yet." });
    }

    const pdf = await htmlToPdfBuffer(doc.generatedHtml);
    const safeType = String(doc.type || "Document").replace(
      /[^a-zA-Z0-9]+/g,
      "-",
    );
    const filename = `${safeType}-${doc.employeeId || "EMP"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (err) {
    console.error("downloadApprovedDocumentPdf error:", err);
    return res.status(500).json({ message: "Failed to generate PDF." });
  }
}

async function downloadMyApprovedDocumentPdf(req, res) {
  try {
    const { id } = req.params;
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) return res.status(400).json({ message: "Invalid ID." });

    const employee = await getOrCreateEmployeeForUser(req.user);
    const result = await db.query(
      `SELECT dr.*, dr.generated_html as "generatedHtml"
       FROM document_requests dr
       WHERE dr.id = $1 AND dr.employee_id = $2`,
      [idInt, employee.id],
    );
    const doc = result.rows[0];
    if (!doc) return res.status(404).json({ message: "Request not found." });
    if (doc.status !== "Approved" || !doc.generatedHtml) {
      return res
        .status(400)
        .json({ message: "Document is not generated yet." });
    }

    const pdf = await htmlToPdfBuffer(doc.generatedHtml);
    const safeType = String(doc.type || "Document").replace(
      /[^a-zA-Z0-9]+/g,
      "-",
    );
    const filename = `${safeType}-${employee.employee_id || "EMP"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (err) {
    console.error("downloadMyApprovedDocumentPdf error:", err);
    return res.status(500).json({ message: "Failed to generate PDF." });
  }
}

module.exports = {
  getMyDocumentRequests,
  getAdminDocumentRequests,
  getApprovedDocumentHtml,
  getMyApprovedDocumentHtml,
  downloadApprovedDocumentPdf,
  downloadMyApprovedDocumentPdf,
};
