'use strict'

const mysql = require('mysql2/promise')
const env = require('./config')

// ─── Connection Pool ──────────────────────────────────────────────────────────

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  charset: 'utf8mb4',
  timezone: '+00:00',
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10_000,
  decimalNumbers: true,
  supportBigNumbers: true,
})

// ─── Query Helpers ────────────────────────────────────────────────────────────

// Run a query and return all rows
const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params)
  return rows
}

// Run a query and return the first row (or null)
const first = async (sql, params = []) => {
  const rows = await query(sql, params)
  return rows[0] ?? null
}

// ─── Transaction ──────────────────────────────────────────────────────────────

// Wrap multiple queries in a transaction — auto commits or rolls back
const withTransaction = async (callback) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await callback(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────

// Verify DB is reachable (used at server startup)
const ping = async () => {
  await query('SELECT 1')
  return true
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

// Close pool cleanly when server shuts down
const closePool = async () => {
  await pool.end()
  console.log('[DB] Pool closed.')
}

process.once('SIGINT', () => closePool().finally(() => process.exit(0)))
process.once('SIGTERM', () => closePool().finally(() => process.exit(0)))

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { pool, query, first, withTransaction, ping, closePool }