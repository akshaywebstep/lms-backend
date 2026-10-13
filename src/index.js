'use strict'

const fs = require('fs')
const path = require('path')
const http = require('http')
const express = require('express')
const cors = require('cors')

const { env, ping } = require('./config/db')
const { registerRoutes } = require('./routes')
const { publicUploadPath } = require('./services/upload')
const { fail } = require('./utils/response')

const app = express()

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (env.allowedOrigins.includes(origin)) return callback(null, true)
    try {
      const parsed = new URL(origin)
      if (['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
        return callback(null, true)
      }
    } catch {}
    return callback(null, true) // Permissive fallback for custom domain/demo links
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})

// Static file uploads server
const sendUpload = (req, res, pathname) => {
  const fullPath = publicUploadPath(pathname)
  if (!fullPath || !fs.existsSync(fullPath)) return false

  const ext = path.extname(fullPath).toLowerCase()
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.ogv': 'video/ogg',
    '.mov': 'video/quicktime',
    '.zip': 'application/zip',
    '.html': 'text/html; charset=utf-8',
  }

  res.setHeader('Content-Type', types[ext] || 'application/octet-stream')
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  if (ext === '.html' || ext === '.svg') {
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
  }

  fs.createReadStream(fullPath).pipe(res)
  return true
}

app.use('/uploads', (req, res) => {
  if (!sendUpload(req, res, `/uploads${req.path}`)) {
    return fail(res, 404, 'File not found')
  }
})

// ─── Multipart Form-Data & Body Parsers ───────────────────────────────────────

const parseMultipart = (buffer, contentType) => {
  const boundaryMatch = contentType.match(/boundary=(?:(?:"([^"]+)")|([^;]+))/i)
  if (!boundaryMatch) throw new Error('Multipart boundary missing')

  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`)
  const fields = {}
  const files = []
  let cursor = buffer.indexOf(boundary)

  while (cursor !== -1) {
    cursor += boundary.length
    if (buffer[cursor] === 45 && buffer[cursor + 1] === 45) break
    if (buffer[cursor] === 13 && buffer[cursor + 1] === 10) cursor += 2

    const next = buffer.indexOf(boundary, cursor)
    if (next === -1) break

    let part = buffer.slice(cursor, next)
    if (part.length >= 2 && part[part.length - 2] === 13 && part[part.length - 1] === 10) {
      part = part.slice(0, -2)
    }

    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
    if (headerEnd !== -1) {
      const headerText = part.slice(0, headerEnd).toString('utf8')
      const body = part.slice(headerEnd + 4)
      const nameMatch = headerText.match(/name="([^"]+)"/i)
      const fileMatch = headerText.match(/filename="([^"]*)"/i)
      const typeMatch = headerText.match(/content-type:\s*([^\r\n]+)/i)
      const name = nameMatch?.[1]

      if (name && fileMatch && fileMatch[1]) {
        files.push({
          fieldName: name,
          originalName: fileMatch[1],
          mimeType: typeMatch?.[1]?.trim() || '',
          buffer: body,
        })
      } else if (name) {
        fields[name] = body.toString('utf8')
      }
    }
    cursor = next
  }
  return { ...fields, files }
}

// Raw body capture for multipart, json, urlencoded
app.use(express.raw({ type: 'multipart/form-data', limit: '100mb' }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Format req.body uniformly
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || ''
  if (contentType.includes('multipart/form-data') && Buffer.isBuffer(req.body)) {
    try {
      req.body = parseMultipart(req.body, contentType)
    } catch (e) {
      return fail(res, 400, 'Invalid multipart request')
    }
  }
  next()
})

// ─── Health Check Endpoint ────────────────────────────────────────────────────

app.get('/api/health', async (req, res) => {
  try {
    await ping()
    return res.status(200).json({
      success: true,
      status: 'ok',
      database: 'mysql+sequelize',
      time: new Date().toISOString(),
    })
  } catch (err) {
    return fail(res, 500, 'Database health check failed')
  }
})

// ─── Express Router Adapter for existing route handlers ───────────────────────

const router = express.Router()

const adapter = (method, pattern, handlers) => {
  const m = method.toLowerCase()
  const list = Array.isArray(handlers) ? handlers : [handlers]

  // Express pattern support (:id works natively)
  const expressHandlers = list.map((fn) => async (req, res, next) => {
    // URLSearchParams shim for existing ctx.query.get('key')
    const searchParams = new URLSearchParams()
    for (const [k, v] of Object.entries(req.query || {})) {
      if (Array.isArray(v)) v.forEach((val) => searchParams.append(k, val))
      else if (v !== undefined) searchParams.set(k, String(v))
    }

    const ctx = {
      req,
      res,
      params: req.params,
      query: searchParams,
      body: req.body,
      user: req.user,
      tokenPayload: req.tokenPayload,
      env,
    }

    try {
      // If handler takes 2 params (middleware style fn(ctx, next))
      if (fn.length >= 2) {
        return await fn(ctx, next)
      }
      return await fn(ctx)
    } catch (err) {
      next(err)
    }
  })

  if (typeof router[m] === 'function') {
    router[m](pattern, ...expressHandlers)
  }
}

// Register all modular routes
registerRoutes(adapter)
app.use(router)

// ─── Global 404 & Error Handling ──────────────────────────────────────────────

app.use((req, res) => {
  fail(res, 404, `Route not found: ${req.method} ${req.path}`)
})

app.use((err, req, res, next) => {
  console.error('[EXPRESS ERROR]', err?.stack || err)
  if (res.headersSent) return next(err)

  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    return fail(res, 500, 'MySQL access denied. Check DB_USER and DB_PASSWORD.')
  }
  if (err.code === 'ER_BAD_DB_ERROR') {
    return fail(res, 500, 'MySQL database not found. Check DB_NAME.')
  }
  if (err.code === 'ECONNREFUSED') {
    return fail(res, 500, 'MySQL connection refused. Check DB_HOST and DB_PORT.')
  }

  return fail(res, 500, 'Internal server error', process.env.NODE_ENV !== 'production' ? err.message : undefined)
})

// ─── Start Server ─────────────────────────────────────────────────────────────

const startServer = () => {
  const port = Number(process.env.PORT || env.port || 5000)
  const server = http.createServer(app)

  server.listen(port, '0.0.0.0', async () => {
    console.log(`LMS Express backend running on port ${port}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)

    try {
      await ping()
      console.log(`MySQL & Sequelize connected: ${env.db.database}@${env.db.host}:${env.db.port}`)
    } catch (error) {
      console.error('Backend started but MySQL/Sequelize connection failed:', error?.message || error)
    }
  })

  return server
}

// Process-level error handling
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error?.stack || error)
})

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason?.stack || reason)
})

startServer()

module.exports = app