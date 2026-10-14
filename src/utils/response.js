
exports.sendJson = (res, statusCode, payload) => {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload)
  }
  // Native HTTP fallback
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(payload))
}

exports.ok = (res, data = {}, message = 'Operation completed successfully.') => {
  if (data && typeof data === 'object' && 'status' in data && 'data' in data) {
    return exports.sendJson(res, 200, data)
  }
  return exports.sendJson(res, 200, {
    status: true,
    message: typeof message === 'string' ? message : 'Operation completed successfully.',
    data: data !== undefined ? data : null,
  })
}

exports.created = (res, data = {}, message = 'Resource created successfully.') => {
  if (data && typeof data === 'object' && 'status' in data && 'data' in data) {
    return exports.sendJson(res, 201, data)
  }
  return exports.sendJson(res, 201, {
    status: true,
    message: typeof message === 'string' ? message : 'Resource created successfully.',
    data: data !== undefined ? data : null,
  })
}

exports.noContent = (res) => {
  if (typeof res.status === 'function' && typeof res.send === 'function') {
    return res.status(204).send()
  }
  res.writeHead(204)
  res.end()
}

exports.fail = (res, statusCode = 400, message = 'Something went wrong.', details = null) => {
  return exports.sendJson(res, statusCode, {
    status: false,
    success: false,
    message: typeof message === 'string' ? message : 'An error occurred.',
    data: details || null,
    ...(details ? { details } : {}),
  })
}