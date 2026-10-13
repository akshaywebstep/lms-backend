'use strict'

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs')

const { env, connectWithRetry, ping } = require('./config/db')
const { publicUploadPath } = require('./services/upload')
const { fail } = require('./utils/response')

const app = express()
const port = process.env.PORT || env.port || 5000

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => callback(null, true),
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

// Static Uploads Delivery
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

// ─── Multipart Form-Data Parser ───────────────────────────────────────────────
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

// ─── Body Parsers (synconode standard) ─────────────────────────────────────────
app.use(express.raw({ type: 'multipart/form-data', limit: '100mb' }))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }))

app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || ''
  if (contentType.includes('multipart/form-data') && Buffer.isBuffer(req.body)) {
    try {
      req.body = parseMultipart(req.body, contentType)
    } catch {
      return fail(res, 400, 'Invalid multipart request')
    }
  }
  next()
})

// ─── Health Check ─────────────────────────────────────────────────────────────
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

// ─── Mount Main Routes (synconode pattern) ─────────────────────────────────────
app.use('/api', require('./routes'))

// ─── 404 & Error Handling ─────────────────────────────────────────────────────
app.use((req, res) => {
  fail(res, 404, `Route not found: ${req.method} ${req.path}`)
})

app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err?.stack || err)
  if (res.headersSent) return next(err)
  return fail(res, 500, 'Internal server error', process.env.NODE_ENV !== 'production' ? err.message : undefined)
})

// ─── Start Server With Retry (synconode pattern) ──────────────────────────────
connectWithRetry().then(() => {
  app.listen(port, () => {
    console.log(`🚀 LMS Server running on http://localhost:${port}`)
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})

module.exports = app