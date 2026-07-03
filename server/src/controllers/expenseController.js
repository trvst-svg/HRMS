const db = require("../config/db");
const { getOrCreateEmployeeForUser } = require("./queries/employeeQueries");

async function createExpenseClaim(req, res) {
  try {
    const {
      title,
      amount,
      category,
      description = "",
      receiptUrl = "",
      month,
    } = req.body;
    if (!title || !amount || !category) {
      return res
        .status(400)
        .json({ message: "Title, amount, and category are required." });
    }

    const employee = await getOrCreateEmployeeForUser(req.user);
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const result = await db.query(
      `INSERT INTO expense_claims (employee_id, title, amount, category, description, receipt_url, status, month)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending', $7)
       RETURNING *`,
      [
        employee.id,
        title,
        Number(amount),
        category,
        description,
        receiptUrl,
        targetMonth,
      ],
    );

    return res
      .status(201)
      .json({ message: "Expense claim submitted.", data: result.rows[0] });
  } catch (err) {
    console.error("createExpenseClaim error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getMyExpenseClaims(req, res) {
  try {
    const employee = await getOrCreateEmployeeForUser(req.user);
    const result = await db.query(
      "SELECT * FROM expense_claims WHERE employee_id = $1 ORDER BY created_at DESC",
      [employee.id],
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getMyExpenseClaims error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getAllExpenseClaims(req, res) {
  try {
    const result = await db.query(
      `SELECT ec.*, 
              e.first_name as "firstName", e.last_name as "lastName", e.employee_id as "employeeId", e.email
       FROM expense_claims ec
       JOIN employees e ON ec.employee_id = e.id
       ORDER BY ec.created_at DESC`,
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error("getAllExpenseClaims error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function reviewExpenseClaim(req, res) {
  try {
    const { id } = req.params;
    const { status, rejectionReason = "" } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be Approved or Rejected." });
    }

    const claimId = parseInt(id, 10);
    if (isNaN(claimId))
      return res.status(400).json({ message: "Invalid claim id." });

    const check = await db.query("SELECT * FROM expense_claims WHERE id = $1", [
      claimId,
    ]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Expense claim not found." });
    }

    const result = await db.query(
      `UPDATE expense_claims 
       SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP 
       WHERE id = $4
       RETURNING *`,
      [status, rejectionReason, req.user.id, claimId],
    );

    return res.json({
      message: `Expense claim ${status.toLowerCase()}.`,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("reviewExpenseClaim error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createExpenseClaim,
  getMyExpenseClaims,
  getAllExpenseClaims,
  reviewExpenseClaim,
};
