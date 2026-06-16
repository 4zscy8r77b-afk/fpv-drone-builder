const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const { z } = require("zod");
const { analyzeBuild } = require("./compatibility");
const { autoBuild } = require("./autobuild");
const { JsonBuildStore } = require("./store");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const components = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "components.json"), "utf8"));
const componentsById = new Map(components.map(component => [Number(component.id), component]));
const buildStore = new JsonBuildStore(path.join(DATA_DIR, "builds.json"));

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SITE_URL = process.env.SITE_URL || "https://buildyourownfpv.com";
const allowedOrigins = String(process.env.ALLOWED_ORIGINS || SITE_URL)
  .split(",")
  .map(value => value.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: null
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  methods: ["GET", "POST"],
  maxAge: 86400
}));
app.use(express.json({ limit: "256kb" }));
app.use("/api", rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(PUBLIC_DIR, { maxAge: "1h", etag: true }));
app.use("/vendor", express.static(path.join(ROOT, "node_modules", "three", "build"), { maxAge: "7d" }));
app.use("/vendor/examples", express.static(path.join(ROOT, "node_modules", "three", "examples", "jsm"), { maxAge: "7d" }));

const buildPayloadSchema = z.object({
  name: z.string().trim().min(1).max(80).default("My FPV Build"),
  goal: z.string().trim().min(1).max(40).default("freestyle35"),
  budget: z.coerce.number().min(0).max(100000).default(0),
  parts: z.record(z.union([z.coerce.number().int().positive(), z.array(z.coerce.number().int().positive()).max(10)])).default({})
});

const analyzeSchema = z.object({
  goal: z.string().trim().max(40).default("freestyle35"),
  budget: z.coerce.number().min(0).max(100000).default(0),
  parts: z.record(z.union([z.coerce.number().int().positive(), z.array(z.coerce.number().int().positive()).max(10)])).default({})
});

function resolveParts(partsObject) {
  const ids = Object.values(partsObject || {}).flat().map(Number).filter(Number.isFinite);
  return ids.map(id => componentsById.get(id)).filter(Boolean);
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: "FPV Drone Builder", version: "2.0.0", components: components.length });
});

app.get("/api/components", (req, res) => {
  const category = String(req.query.category || "").trim();
  const search = String(req.query.search || "").trim().toLowerCase();
  const goal = String(req.query.goal || "").trim();
  let result = components;
  if (category) result = result.filter(part => part.category === category);
  if (goal) result = result.filter(part => (part.tags || []).includes(goal));
  if (search) {
    result = result.filter(part => `${part.brand} ${part.name} ${(part.tags || []).join(" ")} ${JSON.stringify(part.specs || {})}`.toLowerCase().includes(search));
  }
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  res.json({ items: result, total: result.length });
});

app.post("/api/analyze", (req, res, next) => {
  try {
    const payload = analyzeSchema.parse(req.body);
    const parts = resolveParts(payload.parts);
    res.json(analyzeBuild(parts, payload));
  } catch (error) {
    next(error);
  }
});

app.post("/api/autobuild", (req, res, next) => {
  try {
    const payload = z.object({
      goal: z.string().trim().min(1).max(40).default("freestyle35"),
      budget: z.coerce.number().min(0).max(100000).default(650)
    }).parse(req.body);
    res.json(autoBuild(components, payload));
  } catch (error) {
    next(error);
  }
});

app.get("/api/builds/:id", (req, res) => {
  const build = buildStore.get(req.params.id);
  if (!build) return res.status(404).json({ error: "Build not found" });
  return res.json(build);
});

app.post("/api/builds", (req, res, next) => {
  try {
    const payload = buildPayloadSchema.parse(req.body);
    const parts = resolveParts(payload.parts);
    const analysis = analyzeBuild(parts, payload);
    const build = buildStore.create({ ...payload, analysis });
    res.status(201).json(build);
  } catch (error) {
    next(error);
  }
});

app.post("/api/components", (req, res) => {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return res.status(503).json({ error: "Component administration is disabled" });
  if (req.get("x-admin-key") !== adminKey) return res.status(401).json({ error: "Unauthorized" });
  return res.status(501).json({ error: "Use the future admin panel to modify the catalog" });
});

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/privacy.html</loc><priority>0.4</priority></url>
  <url><loc>${SITE_URL}/support.html</loc><priority>0.4</priority></url>
</urlset>`);
});

app.get("*", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));

app.use((error, req, res, next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: "Invalid request", details: error.issues });
  }
  if (error?.message === "Origin is not allowed by CORS") {
    return res.status(403).json({ error: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`FPV Drone Builder 2.0 running on port ${PORT}`));
}

module.exports = { app, components };
