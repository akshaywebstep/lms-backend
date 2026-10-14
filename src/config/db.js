const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");

// ─── Load .env ────────────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, "..", "..", ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed
      .slice(i + 1)
      .trim()
      .replace(/^[\"']|[\"']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const env = {
  port: Number(process.env.PORT || 5000),
  appUrl: process.env.APP_URL || "http://localhost:5173",
  appName: process.env.APP_NAME || "LearnFlow",
  publicUrl:
    process.env.BACKEND_PUBLIC_URL ||
    `http://localhost:${process.env.PORT || 5000}`,
  paymentProvider: process.env.PAYMENT_PROVIDER || "demo",
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-this-secret",
  accessTtlMs: 2 * 60 * 60 * 1000,
  refreshTtlMs: 7 * 24 * 60 * 60 * 1000,
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS ||
    process.env.APP_URL ||
    "http://localhost:5173"
  )
    .split(",")
    .map((o) => o.trim()),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "lms_db",
  },
  stripe: { secretKey: process.env.STRIPE_SECRET_KEY || "" },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  },
};

// ─── Sequelize Instance ───────────────────────────────────────────────────────
const sequelize = new Sequelize(env.db.database, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: "mysql",
  logging: false,
  timezone: "+00:00",
  dialectOptions: {
    charset: "utf8mb4",
    decimalNumbers: true,
    supportBigNumbers: true,
  },
  pool: {
    max: 15,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// ─── Raw Pool for Direct High-Speed Queries ───────────────────────────────────
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  charset: "utf8mb4",
  timezone: "+00:00",
  waitForConnections: true,
  connectionLimit: 15,
  connectTimeout: 10_000,
  decimalNumbers: true,
  supportBigNumbers: true,
});

const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const first = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] ?? null;
};

const withTransaction = async (callback) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ─── Connect With Retry (synconode style) ──────────────────────────────────────
async function connectWithRetry(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      await query("SELECT 1");
      // console.log(' Database connected successfully (Sequelize & MySQL).')
      return;
    } catch (err) {
      console.error(
        ` DB connection failed [${i + 1}/${retries}]:`,
        err.message,
      );
      if (i < retries - 1) {
        console.log(` Retrying in ${delay / 1000} seconds...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error(" All DB connection attempts failed.");
        process.exit(1);
      }
    }
  }
}

const ping = async () => {
  await sequelize.authenticate();
  await query("SELECT 1");
  return true;
};

module.exports = {
  env,
  sequelize,
  pool,
  query,
  first,
  withTransaction,
  connectWithRetry,
  ping,
};
