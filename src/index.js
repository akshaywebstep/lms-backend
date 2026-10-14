const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const { env, connectWithRetry, ping } = require("./config/db");
const { publicUploadPath } = require("./services/upload");
const { fail } = require("./utils/response");

const app = express();
const port = process.env.PORT || env.port || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Static Uploads Delivery
const escapeXml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const sendUpload = (req, res, pathname) => {
  const fullPath = publicUploadPath(pathname);
  if (fullPath && fs.existsSync(fullPath)) {
    const ext = path.extname(fullPath).toLowerCase();
    const types = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".ogg": "video/ogg",
      ".ogv": "video/ogg",
      ".mov": "video/quicktime",
      ".zip": "application/zip",
      ".html": "text/html; charset=utf-8",
    };

    res.setHeader("Content-Type", types[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (ext === ".html" || ext === ".svg") {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      );
    }

    fs.createReadStream(fullPath).pipe(res);
    return true;
  }

  // Graceful fallback for missing image requests (prevents broken 404 image icons)
  const filename = path.basename(pathname);
  const ext = path.extname(filename).toLowerCase();
  const isImage = [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".svg",
    ".jfif",
    ".avif",
  ].includes(ext);

  if (isImage) {
    const cleanLabel =
      decodeURIComponent(filename)
        .replace(/^file_[a-z0-9_-]+-/i, "")
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[-_]+/g, " ")
        .trim() || "LearnFlow Media";

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4f46e5" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#g)" />
      <circle cx="400" cy="180" r="56" fill="rgba(255,255,255,0.18)" />
      <polygon points="388,155 424,180 388,205" fill="#ffffff" />
      <text x="400" y="275" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff" text-anchor="middle">${escapeXml(cleanLabel)}</text>
      <text x="400" y="315" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="14" font-weight="600" fill="rgba(255,255,255,0.8)" text-anchor="middle">LEARNFLOW LMS</text>
    </svg>`;

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.status(200).send(svg);
    return true;
  }

  return false;
};

app.use("/uploads", (req, res) => {
  if (!sendUpload(req, res, `/uploads${req.path}`)) {
    return fail(res, 404, "File not found");
  }
});

// ─── Multipart Form-Data Parser ───────────────────────────────────────────────
const parseMultipart = (buffer, contentType) => {
  const boundaryMatch = contentType.match(
    /boundary=(?:(?:"([^"]+)")|([^;]+))/i,
  );
  if (!boundaryMatch) throw new Error("Multipart boundary missing");

  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const fields = {};
  const files = [];
  let cursor = buffer.indexOf(boundary);

  while (cursor !== -1) {
    cursor += boundary.length;
    if (buffer[cursor] === 45 && buffer[cursor + 1] === 45) break;
    if (buffer[cursor] === 13 && buffer[cursor + 1] === 10) cursor += 2;

    const next = buffer.indexOf(boundary, cursor);
    if (next === -1) break;

    let part = buffer.slice(cursor, next);
    if (
      part.length >= 2 &&
      part[part.length - 2] === 13 &&
      part[part.length - 1] === 10
    ) {
      part = part.slice(0, -2);
    }

    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd !== -1) {
      const headerText = part.slice(0, headerEnd).toString("utf8");
      const body = part.slice(headerEnd + 4);
      const nameMatch = headerText.match(/name="([^"]+)"/i);
      const fileMatch = headerText.match(/filename="([^"]*)"/i);
      const typeMatch = headerText.match(/content-type:\s*([^\r\n]+)/i);
      const name = nameMatch?.[1];

      if (name && fileMatch && fileMatch[1]) {
        files.push({
          fieldName: name,
          originalName: fileMatch[1],
          mimeType: typeMatch?.[1]?.trim() || "",
          buffer: body,
        });
      } else if (name) {
        fields[name] = body.toString("utf8");
      }
    }
    cursor = next;
  }
  return { ...fields, files };
};

// ─── Body Parsers (synconode standard) ─────────────────────────────────────────
app.use(express.raw({ type: "multipart/form-data", limit: "100mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  }),
);

app.use((req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (
    contentType.includes("multipart/form-data") &&
    Buffer.isBuffer(req.body)
  ) {
    try {
      req.body = parseMultipart(req.body, contentType);
    } catch {
      return fail(res, 400, "Invalid multipart request");
    }
  }
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    await ping();
    return res.status(200).json({
      success: true,
      status: "ok",
      database: "mysql+sequelize",
      time: new Date().toISOString(),
    });
  } catch (err) {
    return fail(res, 500, "Database health check failed");
  }
});

// ─── Activity Log Middleware & Main Routes ──────────────────────────────────
const { activityLogMiddleware } = require("./middleware/activityLogMiddleware");
app.use("/api", activityLogMiddleware, require("./routes"));

// ─── 404 & Error Handling ─────────────────────────────────────────────────────
app.use((req, res) => {
  fail(res, 404, `Route not found: ${req.method} ${req.path}`);
});

app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]", err?.stack || err);
  if (res.headersSent) return next(err);
  return fail(res, err.status || 500, err.message || "Internal server error");
});

// ─── Start Server With Retry (synconode pattern) ──────────────────────────────
connectWithRetry().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📡 Database Connected Successfully`);
  });
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

module.exports = app;
