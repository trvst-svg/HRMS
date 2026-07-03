const { Pool, Client } = require("pg");
const fs = require("fs");
const path = require("path");

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/hrms";

const pool = new Pool({
  connectionString,
});

async function ensureDatabaseExists() {
  const baseConnectionString = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/\/([^/]+)$/, "/postgres")
    : "postgresql://postgres:postgres@localhost:5432/postgres";

  const targetDbName = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.match(/\/([^/]+)$/)?.[1] || "hrms"
    : "hrms";

  const client = new Client({ connectionString: baseConnectionString });
  try {
    await client.connect();
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDbName],
    );
    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE ${targetDbName}`);
      console.log(`✅ Created PostgreSQL database: ${targetDbName}`);
    }
  } catch (err) {
    console.error(
      "⚠️ Warning: Failed to check/create PostgreSQL database:",
      err.message,
    );
  } finally {
    await client.end().catch(() => {});
  }
}

const connectDB = async () => {
  try {
    await ensureDatabaseExists();

    const client = await pool.connect();
    console.log("✅ PostgreSQL connected successfully");
    client.release();

    const schemaPath = path.join(__dirname, "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf8");
      await pool.query(sql);
      console.log("✅ PostgreSQL database schema auto-initialized");
    }
  } catch (err) {
    console.error("❌ PostgreSQL connection/schema error:", err.message || err);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  query: (text, params) => pool.query(text, params),
  pool,
};
