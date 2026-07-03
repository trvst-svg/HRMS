const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:admin@localhost:5432/hrms";

async function initDatabase() {
  const baseConnectionString = connectionString.replace(
    /\/([^/]+)$/,
    "/postgres",
  );
  const targetDbName = connectionString.match(/\/([^/]+)$/)?.[1] || "hrms";

  console.log(
    `🔍 Connecting to PostgreSQL to check database "${targetDbName}"...`,
  );
  const client = new Client({ connectionString: baseConnectionString });

  try {
    await client.connect();
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDbName],
    );

    if (res.rows.length === 0) {
      console.log(`🆕 Database "${targetDbName}" not found. Creating...`);
      await client.query(`CREATE DATABASE ${targetDbName}`);
      console.log(`✅ Database "${targetDbName}" created successfully.`);
    } else {
      console.log(`ℹ️ Database "${targetDbName}" already exists.`);
    }
  } catch (err) {
    console.error("❌ Error checking/creating database:", err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }

  // Connect to target database and run schema.sql
  console.log(
    `⚙️  Connecting to database "${targetDbName}" to run schema initialization...`,
  );
  const targetClient = new Client({ connectionString });
  try {
    await targetClient.connect();
    const schemaPath = path.join(__dirname, "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf8");
      await targetClient.query(sql);
      console.log(
        "✅ Database schema tables and indexes successfully initialized.",
      );
    } else {
      console.warn("⚠️  schema.sql file not found in src/config/");
    }

    // Seed default admin if table is empty
    console.log("🌱 Checking for existing users...");
    const userCheck = await targetClient.query(
      "SELECT count(*)::int as count FROM users",
    );
    if (userCheck.rows[0].count === 0) {
      console.log("🌱 Seeding default admin user...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin123", salt);
      await targetClient.query(
        `INSERT INTO users (name, email, password, role, otp_required_for_login) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          "System Administrator",
          "admin@hrms.com",
          hashedPassword,
          "admin",
          false,
        ],
      );
      console.log("✅ Default admin user created:");
      console.log("   📧 Email: admin@hrms.com");
      console.log("   🔑 Password: Admin123");
    } else {
      console.log("ℹ️ Users already exist. Skipping seed.");
    }
  } catch (err) {
    console.error("❌ Error during schema run or seeding:", err.message);
    process.exit(1);
  } finally {
    await targetClient.end().catch(() => {});
  }

  console.log("🏁 Database setup complete!");
}

initDatabase();
