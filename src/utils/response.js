'use strict'

const sendJson = (res, statusCode, payload) => {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload)
  }
  // Native HTTP fallback
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(payload))
}

const ok = (res, payload = {}) => sendJson(res, 200, payload)
const created = (res, payload = {}) => sendJson(res, 201, payload)

const noContent = (res) => {
  if (typeof res.status === 'function' && typeof res.send === 'function') {
    return res.status(204).send()
  }
  res.writeHead(204)
  res.end()
}

const fail = (res, statusCode, message, details) =>
  sendJson(res, statusCode, { success: false, message, ...(details ? { details } : {}) })

module.exports = { sendJson, ok, created, noContent, fail }