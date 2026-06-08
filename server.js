const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = process.env.SITE_URL || "https://fpv-drone-builder.onrender.com";

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "fpv_builder.sqlite");

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "..", "public"), {
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
}));

const db = new sqlite3.Database(dbPath);

const seedParts = [
  {category:"frame",brand:"GEPRC",name:"GEP-CL35 3.5 inch Frame",price:39,weight:75,specs:{frame:3.5,mount:["20x20"],size:"3.5"},tags:["3.5","freestyle","20x20"]},
  {category:"frame",brand:"AOS",name:"AOS 3.5 V5 Frame",price:54,weight:82,specs:{frame:3.5,mount:["20x20"],size:"3.5"},tags:["3.5","premium","freestyle"]},
  {category:"frame",brand:"FlyFishRC",name:"Volador VX3.5 Frame",price:45,weight:92,specs:{frame:3.5,mount:["20x20","25.5x25.5"],size:"3.5"},tags:["3.5","strong"]},
  {category:"frame",brand:"TBS",name:"Source One V5 5 inch Frame",price:33,weight:125,specs:{frame:5,mount:["30x30","20x20"],size:"5"},tags:["5","cheap","freestyle"]},
  {category:"frame",brand:"ImpulseRC",name:"ApexDC 5 inch Frame",price:99,weight:135,specs:{frame:5,mount:["30x30","20x20"],size:"5"},tags:["5","premium","freestyle"]},
  {category:"frame",brand:"iFlight",name:"Chimera7 Pro Frame",price:89,weight:220,specs:{frame:7,mount:["30x30","20x20"],size:"7"},tags:["7","longrange","cinematic"]},
  {category:"frame",brand:"Happymodel",name:"Mobula6 Whoop Frame",price:6,weight:4,specs:{frame:1.2,mount:["25.5x25.5"],size:"whoop"},tags:["tinywhoop","65mm","indoor"]},

  {category:"motor",brand:"iFlight",name:"XING 1404 4600KV",price:15,weight:9,specs:{kv:4600,amp:14,thrust:360,ideal:["2.5"],qty:4},tags:["2.5","3s","4s"]},
  {category:"motor",brand:"T-Motor",name:"F1604 3800KV",price:21,weight:12,specs:{kv:3800,amp:19,thrust:560,ideal:["3.5"],qty:4},tags:["3.5","4s","premium"]},
  {category:"motor",brand:"iFlight",name:"XING2 1804 2450KV",price:22,weight:16,specs:{kv:2450,amp:24,thrust:720,ideal:["3.5"],qty:4},tags:["3.5","4s"]},
  {category:"motor",brand:"Emax",name:"ECO II 2004 3000KV",price:16,weight:18,specs:{kv:3000,amp:28,thrust:820,ideal:["3.5","4"],qty:4},tags:["3.5","4s","budget"]},
  {category:"motor",brand:"iFlight",name:"XING2 2207 1750KV",price:24,weight:32,specs:{kv:1750,amp:40,thrust:1550,ideal:["5"],qty:4},tags:["5","6s","freestyle"]},
  {category:"motor",brand:"T-Motor",name:"F60 Pro V 2207 1950KV",price:29,weight:33,specs:{kv:1950,amp:45,thrust:1650,ideal:["5"],qty:4},tags:["5","6s","premium"]},
  {category:"motor",brand:"iFlight",name:"XING2 2806.5 1300KV",price:32,weight:50,specs:{kv:1300,amp:50,thrust:2200,ideal:["7"],qty:4},tags:["7","6s","longrange"]},
  {category:"motor",brand:"Happymodel",name:"EX0802 19000KV",price:12,weight:2,specs:{kv:19000,amp:5,thrust:35,ideal:["whoop"],qty:4},tags:["tinywhoop","1s"]},

  {category:"stack",brand:"SpeedyBee",name:"F405 Mini 35A 20x20 Stack",price:70,weight:14,specs:{mount:"20x20",esc:35,voltage:["3s","4s","6s"]},tags:["20x20","35A","3.5","4s"]},
  {category:"stack",brand:"GEPRC",name:"Taker F405 35A AIO",price:62,weight:9,specs:{mount:"25.5x25.5",esc:35,voltage:["2s","3s","4s","6s"]},tags:["AIO","35A","3.5","25.5x25.5"]},
  {category:"stack",brand:"SpeedyBee",name:"F405 V4 55A 30x30 Stack",price:82,weight:24,specs:{mount:"30x30",esc:55,voltage:["3s","4s","6s"]},tags:["30x30","55A","5","6s"]},
  {category:"stack",brand:"Foxeer",name:"F722 V4 60A 30x30 Stack",price:130,weight:25,specs:{mount:"30x30",esc:60,voltage:["4s","6s"]},tags:["30x30","60A","premium","6s"]},
  {category:"stack",brand:"BetaFPV",name:"F4 1S 5A AIO",price:42,weight:4,specs:{mount:"25.5x25.5",esc:5,voltage:["1s"]},tags:["whoop","1s","AIO"]},

  {category:"props",brand:"Gemfan",name:"Hurricane 3520 3.5 inch Props",price:4,weight:8,specs:{propSize:"3.5"},tags:["3.5"]},
  {category:"props",brand:"HQProp",name:"T3.5x2x3 Props",price:4.5,weight:8,specs:{propSize:"3.5"},tags:["3.5","smooth"]},
  {category:"props",brand:"Gemfan",name:"Hurricane 51466 5 inch Props",price:4,weight:16,specs:{propSize:"5"},tags:["5","freestyle"]},
  {category:"props",brand:"HQProp",name:"DP 7x3.5x3 Props",price:7,weight:28,specs:{propSize:"7"},tags:["7","longrange"]},
  {category:"props",brand:"Gemfan",name:"31mm 3-blade Whoop Props",price:3,weight:1,specs:{propSize:"whoop"},tags:["whoop"]},

  {category:"battery",brand:"Tattu",name:"R-Line 850mAh 4S XT30",price:24,weight:105,specs:{cells:"4s",capacity:850,connector:"XT30"},tags:["4s","3.5","XT30"]},
  {category:"battery",brand:"CNHL",name:"Black 1100mAh 4S XT60",price:20,weight:135,specs:{cells:"4s",capacity:1100,connector:"XT60"},tags:["4s","3.5","XT60"]},
  {category:"battery",brand:"Tattu",name:"R-Line 1300mAh 6S XT60",price:35,weight:215,specs:{cells:"6s",capacity:1300,connector:"XT60"},tags:["6s","5","XT60"]},
  {category:"battery",brand:"CNHL",name:"Black 1500mAh 6S XT60",price:29,weight:255,specs:{cells:"6s",capacity:1500,connector:"XT60"},tags:["6s","5","budget"]},
  {category:"battery",brand:"Auline",name:"Li-ion 6S 4000mAh Pack",price:75,weight:410,specs:{cells:"6s",capacity:4000,connector:"XT60"},tags:["6s","7","longrange"]},
  {category:"battery",brand:"BetaFPV",name:"1S 300mAh BT2.0",price:6,weight:8,specs:{cells:"1s",capacity:300,connector:"BT2.0"},tags:["1s","whoop"]},

  {category:"vtx",brand:"Walksnail",name:"Avatar HD Mini 1S Kit",price:90,weight:8,specs:{system:"walksnail"},tags:["digital","light","whoop","3.5"]},
  {category:"vtx",brand:"Walksnail",name:"Avatar HD Pro Kit",price:130,weight:28,specs:{system:"walksnail"},tags:["digital","3.5","5"]},
  {category:"vtx",brand:"Walksnail",name:"Moonlight 4K Kit",price:190,weight:45,specs:{system:"walksnail"},tags:["digital","cinematic","4k"]},
  {category:"vtx",brand:"DJI",name:"DJI O3 Air Unit",price:229,weight:39,specs:{system:"dji"},tags:["digital","5","cinematic"]},
  {category:"vtx",brand:"RushFPV",name:"Tank Solo Analog VTX + Cam",price:48,weight:13,specs:{system:"analog"},tags:["analog","cheap","light"]},

  {category:"rx",brand:"RadioMaster",name:"RP1 ELRS 2.4GHz Receiver",price:16,weight:1,specs:{protocol:"ELRS"},tags:["ELRS","2.4","small"]},
  {category:"rx",brand:"RadioMaster",name:"RP2 ELRS 2.4GHz Receiver",price:17,weight:1,specs:{protocol:"ELRS"},tags:["ELRS","ceramic","small"]},
  {category:"rx",brand:"HappyModel",name:"EP1 ELRS Receiver",price:14,weight:1,specs:{protocol:"ELRS"},tags:["ELRS","budget"]},
  {category:"rx",brand:"DJI",name:"DJI Control Link via Air Unit",price:0,weight:0,specs:{protocol:"DJI"},tags:["DJI","no receiver"]},

  {category:"antenna",brand:"TrueRC",name:"Singularity Stubby 5.8",price:20,weight:5,specs:{gain:1.9},tags:["5.8","digital","analog"]},
  {category:"antenna",brand:"Lumenier",name:"AXII 2 Long Range",price:25,weight:8,specs:{gain:2.2},tags:["5.8","longrange"]},
  {category:"antenna",brand:"Walksnail",name:"Avatar Mini Antenna",price:10,weight:2,specs:{gain:1.5},tags:["walksnail","light"]},

  {category:"extras",brand:"VIFLY",name:"Finder 2 Buzzer",price:15,weight:5,specs:{},tags:["safety","recommended"]},
  {category:"extras",brand:"HGLRC",name:"M100 Mini GPS",price:18,weight:6,specs:{},tags:["gps","longrange"]},
  {category:"extras",brand:"Panasonic",name:"Low ESR Capacitor 1000uF",price:3,weight:4,specs:{},tags:["noise","recommended"]},
  {category:"extras",brand:"GoPro",name:"GoPro Payload Simulation",price:0,weight:155,specs:{},tags:["payload","cinematic"]}
];

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    weight REAL NOT NULL DEFAULT 0,
    specs TEXT NOT NULL DEFAULT '{}',
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS builds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parts TEXT NOT NULL,
    budget REAL DEFAULT 0,
    analysis TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  db.get("SELECT COUNT(*) AS count FROM components", (err, row) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      const stmt = db.prepare(`INSERT INTO components (category, brand, name, price, weight, specs, tags) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      seedParts.forEach(p => stmt.run(p.category, p.brand, p.name, p.price, p.weight, JSON.stringify(p.specs || {}), JSON.stringify(p.tags || [])));
      stmt.end();
      console.log("Seeded components database");
    }
  });
});

function parsePart(row) {
  return { ...row, specs: JSON.parse(row.specs || "{}"), tags: JSON.parse(row.tags || "[]") };
}

function getComponentsByIds(ids) {
  return new Promise((resolve, reject) => {
    const flat = ids.filter(Boolean);
    if (flat.length === 0) return resolve([]);
    const placeholders = flat.map(() => "?").join(",");
    db.all(`SELECT * FROM components WHERE id IN (${placeholders})`, flat, (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(parsePart));
    });
  });
}

function analyzeParts(parts, budget = 0) {
  const byCategory = {};
  for (const p of parts) {
    if (p.category === "extras") {
      if (!byCategory.extras) byCategory.extras = [];
      byCategory.extras.push(p);
    } else byCategory[p.category] = p;
  }

  let totalPrice = 0, totalWeight = 0, thrust = 0;
  const issues = [];

  for (const p of parts) {
    const qty = p.specs.qty || 1;
    totalPrice += p.price * qty;
    totalWeight += p.weight * qty;
    if (p.specs.thrust) thrust += p.specs.thrust * qty;
  }

  const frame = byCategory.frame;
  const motor = byCategory.motor;
  const stack = byCategory.stack;
  const props = byCategory.props;
  const battery = byCategory.battery;
  const vtx = byCategory.vtx;

  if (!frame) issues.push({ level: "warn", text: "Рама не выбрана." });
  if (!motor) issues.push({ level: "warn", text: "Моторы не выбраны." });
  if (!stack) issues.push({ level: "warn", text: "FC/ESC не выбран." });
  if (!props) issues.push({ level: "warn", text: "Пропеллеры не выбраны." });
  if (!battery) issues.push({ level: "warn", text: "Батарея не выбрана." });

  if (frame && props) {
    if (String(frame.specs.size) !== String(props.specs.propSize)) issues.push({ level: "bad", text: `Пропеллеры ${props.specs.propSize} не подходят к раме ${frame.specs.size}.` });
    else issues.push({ level: "good", text: "Размер пропеллеров подходит к раме." });
  }

  if (frame && motor && motor.specs.ideal && !motor.specs.ideal.includes(String(frame.specs.size))) issues.push({ level: "warn", text: `Моторы не идеальны для рамы ${frame.specs.size}.` });
  else if (frame && motor) issues.push({ level: "good", text: "Моторы подходят под класс рамы." });

  if (stack && motor && stack.specs.esc < motor.specs.amp * 1.2) issues.push({ level: "bad", text: `ESC ${stack.specs.esc}A слабоват. Лучше минимум ${Math.ceil(motor.specs.amp * 1.2)}A.` });
  else if (stack && motor) issues.push({ level: "good", text: "ESC имеет нормальный запас по току." });

  if (frame && stack && frame.specs.mount && stack.specs.mount && !frame.specs.mount.includes(stack.specs.mount)) issues.push({ level: "bad", text: `Крепление ${stack.specs.mount} может не подойти к раме. У рамы: ${frame.specs.mount.join(", ")}.` });
  else if (frame && stack) issues.push({ level: "good", text: "Крепление FC/ESC подходит к раме." });

  if (stack && battery && stack.specs.voltage && !stack.specs.voltage.includes(battery.specs.cells)) issues.push({ level: "bad", text: `${battery.specs.cells.toUpperCase()} батарея не поддерживается выбранным стеком.` });
  else if (stack && battery) issues.push({ level: "good", text: "Батарея подходит по напряжению к FC/ESC." });

  if (frame && frame.specs.size === "3.5" && vtx && (vtx.name.includes("DJI O3") || vtx.name.includes("Moonlight"))) issues.push({ level: "warn", text: "Для 3.5 inch DJI O3/Moonlight тяжеловаты. Полетит, но дрон будет менее резким." });

  if (budget > 0 && totalPrice > budget) issues.push({ level: "warn", text: `Сборка дороже бюджета на $${Math.round(totalPrice - budget)}.` });
  else if (budget > 0 && parts.length > 0) issues.push({ level: "good", text: "Сборка помещается в бюджет." });

  const twr = totalWeight > 0 ? thrust / totalWeight : 0;
  if (thrust > 0 && totalWeight > 0) {
    if (twr >= 5) issues.push({ level: "good", text: "Запас тяги отличный." });
    else if (twr >= 3.5) issues.push({ level: "warn", text: "Запас тяги средний." });
    else issues.push({ level: "bad", text: "Запас тяги низкий." });
  }

  const bad = issues.filter(i => i.level === "bad").length;
  const warn = issues.filter(i => i.level === "warn").length;
  let status = "Сборка возможна";
  let statusLevel = "good";
  if (bad > 0) { status = "Есть критичные проблемы"; statusLevel = "bad"; }
  else if (warn > 0) { status = "Есть нюансы"; statusLevel = "warn"; }

  let flightTime = null;
  if (battery && motor && totalWeight > 0) {
    const cap = battery.specs.capacity || 0;
    const base = cap / Math.max(1, totalWeight) * 2.3;
    flightTime = Math.max(1.5, Math.min(18, base * (battery.specs.cells === "6s" ? 1.15 : 1)));
  }

  return {
    status,
    statusLevel,
    totalPrice: Math.round(totalPrice * 100) / 100,
    totalWeight: Math.round(totalWeight),
    thrust: Math.round(thrust),
    thrustToWeight: twr ? Number(twr.toFixed(2)) : 0,
    estimatedFlightMinutes: flightTime ? Number(flightTime.toFixed(1)) : null,
    issues
  };
}

app.get("/api/health", (req, res) => res.json({ ok: true, app: "FPV Drone Builder" }));

app.get("/api/components", (req, res) => {
  const { category, search } = req.query;
  const where = [];
  const params = [];
  if (category) { where.push("category = ?"); params.push(category); }
  if (search) {
    where.push("(LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(tags) LIKE ?)");
    const q = `%${String(search).toLowerCase()}%`;
    params.push(q, q, q);
  }
  const sql = `SELECT * FROM components ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY category, price ASC`;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(parsePart));
  });
});

app.post("/api/components", (req, res) => {
  const { category, brand, name, price = 0, weight = 0, specs = {}, tags = [] } = req.body;
  if (!category || !brand || !name) return res.status(400).json({ error: "category, brand and name are required" });

  db.run(
    `INSERT INTO components (category, brand, name, price, weight, specs, tags) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [category, brand, name, Number(price), Number(weight), JSON.stringify(specs), JSON.stringify(tags)],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get("SELECT * FROM components WHERE id = ?", [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json(parsePart(row));
      });
    }
  );
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { parts = {}, budget = 0 } = req.body;
    const ids = [];
    for (const value of Object.values(parts)) Array.isArray(value) ? ids.push(...value) : value && ids.push(value);
    const dbParts = await getComponentsByIds(ids);
    res.json(analyzeParts(dbParts, Number(budget)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/builds", (req, res) => {
  db.all("SELECT * FROM builds ORDER BY id DESC LIMIT 50", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({ ...r, parts: JSON.parse(r.parts || "{}"), analysis: r.analysis ? JSON.parse(r.analysis) : null })));
  });
});

app.post("/api/builds", async (req, res) => {
  try {
    const { name = "My FPV Build", parts = {}, budget = 0 } = req.body;
    const ids = [];
    for (const value of Object.values(parts)) Array.isArray(value) ? ids.push(...value) : value && ids.push(value);
    const dbParts = await getComponentsByIds(ids);
    const analysis = analyzeParts(dbParts, Number(budget));

    db.run(
      `INSERT INTO builds (name, parts, budget, analysis) VALUES (?, ?, ?, ?)`,
      [name, JSON.stringify(parts), Number(budget), JSON.stringify(analysis)],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, name, parts, budget, analysis });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/builds/:id", (req, res) => {
  db.run("DELETE FROM builds WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, deleted: this.changes });
  });
});

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/privacy.html</loc><priority>0.4</priority></url>
  <url><loc>${SITE_URL}/support.html</loc><priority>0.4</priority></url>
</urlset>`);
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "index.html")));

app.listen(PORT, () => console.log(`FPV Drone Builder running on http://localhost:${PORT}`));
