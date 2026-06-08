const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = process.env.SITE_URL || "https://fpv-drone-builder.onrender.com";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname, { maxAge: "1h" }));

let savedBuilds = [];

const components = [
  {id:1,category:"frame",brand:"GEPRC",name:"GEP-CL35 3.5 inch Frame",price:39,weight:75,specs:{frame:3.5,mount:["20x20"],size:"3.5"},tags:["3.5","freestyle","20x20"]},
  {id:2,category:"frame",brand:"AOS",name:"AOS 3.5 V5 Frame",price:54,weight:82,specs:{frame:3.5,mount:["20x20"],size:"3.5"},tags:["3.5","premium","freestyle"]},
  {id:3,category:"frame",brand:"FlyFishRC",name:"Volador VX3.5 Frame",price:45,weight:92,specs:{frame:3.5,mount:["20x20","25.5x25.5"],size:"3.5"},tags:["3.5","strong"]},
  {id:4,category:"frame",brand:"TBS",name:"Source One V5 5 inch Frame",price:33,weight:125,specs:{frame:5,mount:["30x30","20x20"],size:"5"},tags:["5","cheap","freestyle"]},
  {id:5,category:"frame",brand:"ImpulseRC",name:"ApexDC 5 inch Frame",price:99,weight:135,specs:{frame:5,mount:["30x30","20x20"],size:"5"},tags:["5","premium","freestyle"]},
  {id:6,category:"frame",brand:"iFlight",name:"Chimera7 Pro Frame",price:89,weight:220,specs:{frame:7,mount:["30x30","20x20"],size:"7"},tags:["7","longrange","cinematic"]},
  {id:7,category:"frame",brand:"Happymodel",name:"Mobula6 Whoop Frame",price:6,weight:4,specs:{frame:1.2,mount:["25.5x25.5"],size:"whoop"},tags:["tinywhoop","65mm","indoor"]},

  {id:8,category:"motor",brand:"iFlight",name:"XING 1404 4600KV",price:15,weight:9,specs:{kv:4600,amp:14,thrust:360,ideal:["2.5"],qty:4},tags:["2.5","3s","4s"]},
  {id:9,category:"motor",brand:"T-Motor",name:"F1604 3800KV",price:21,weight:12,specs:{kv:3800,amp:19,thrust:560,ideal:["3.5"],qty:4},tags:["3.5","4s","premium"]},
  {id:10,category:"motor",brand:"iFlight",name:"XING2 1804 2450KV",price:22,weight:16,specs:{kv:2450,amp:24,thrust:720,ideal:["3.5"],qty:4},tags:["3.5","4s"]},
  {id:11,category:"motor",brand:"Emax",name:"ECO II 2004 3000KV",price:16,weight:18,specs:{kv:3000,amp:28,thrust:820,ideal:["3.5","4"],qty:4},tags:["3.5","4s","budget"]},
  {id:12,category:"motor",brand:"iFlight",name:"XING2 2207 1750KV",price:24,weight:32,specs:{kv:1750,amp:40,thrust:1550,ideal:["5"],qty:4},tags:["5","6s","freestyle"]},
  {id:13,category:"motor",brand:"T-Motor",name:"F60 Pro V 2207 1950KV",price:29,weight:33,specs:{kv:1950,amp:45,thrust:1650,ideal:["5"],qty:4},tags:["5","6s","premium"]},
  {id:14,category:"motor",brand:"iFlight",name:"XING2 2806.5 1300KV",price:32,weight:50,specs:{kv:1300,amp:50,thrust:2200,ideal:["7"],qty:4},tags:["7","6s","longrange"]},
  {id:15,category:"motor",brand:"Happymodel",name:"EX0802 19000KV",price:12,weight:2,specs:{kv:19000,amp:5,thrust:35,ideal:["whoop"],qty:4},tags:["tinywhoop","1s"]},

  {id:16,category:"stack",brand:"SpeedyBee",name:"F405 Mini 35A 20x20 Stack",price:70,weight:14,specs:{mount:"20x20",esc:35,voltage:["3s","4s","6s"]},tags:["20x20","35A","3.5","4s"]},
  {id:17,category:"stack",brand:"GEPRC",name:"Taker F405 35A AIO",price:62,weight:9,specs:{mount:"25.5x25.5",esc:35,voltage:["2s","3s","4s","6s"]},tags:["AIO","35A","3.5","25.5x25.5"]},
  {id:18,category:"stack",brand:"SpeedyBee",name:"F405 V4 55A 30x30 Stack",price:82,weight:24,specs:{mount:"30x30",esc:55,voltage:["3s","4s","6s"]},tags:["30x30","55A","5","6s"]},
  {id:19,category:"stack",brand:"Foxeer",name:"F722 V4 60A 30x30 Stack",price:130,weight:25,specs:{mount:"30x30",esc:60,voltage:["4s","6s"]},tags:["30x30","60A","premium","6s"]},
  {id:20,category:"stack",brand:"BetaFPV",name:"F4 1S 5A AIO",price:42,weight:4,specs:{mount:"25.5x25.5",esc:5,voltage:["1s"]},tags:["whoop","1s","AIO"]},

  {id:21,category:"props",brand:"Gemfan",name:"Hurricane 3520 3.5 inch Props",price:4,weight:8,specs:{propSize:"3.5"},tags:["3.5"]},
  {id:22,category:"props",brand:"HQProp",name:"T3.5x2x3 Props",price:4.5,weight:8,specs:{propSize:"3.5"},tags:["3.5","smooth"]},
  {id:23,category:"props",brand:"Gemfan",name:"Hurricane 51466 5 inch Props",price:4,weight:16,specs:{propSize:"5"},tags:["5","freestyle"]},
  {id:24,category:"props",brand:"HQProp",name:"DP 7x3.5x3 Props",price:7,weight:28,specs:{propSize:"7"},tags:["7","longrange"]},
  {id:25,category:"props",brand:"Gemfan",name:"31mm 3-blade Whoop Props",price:3,weight:1,specs:{propSize:"whoop"},tags:["whoop"]},

  {id:26,category:"battery",brand:"Tattu",name:"R-Line 850mAh 4S XT30",price:24,weight:105,specs:{cells:"4s",capacity:850,connector:"XT30"},tags:["4s","3.5","XT30"]},
  {id:27,category:"battery",brand:"CNHL",name:"Black 1100mAh 4S XT60",price:20,weight:135,specs:{cells:"4s",capacity:1100,connector:"XT60"},tags:["4s","3.5","XT60"]},
  {id:28,category:"battery",brand:"Tattu",name:"R-Line 1300mAh 6S XT60",price:35,weight:215,specs:{cells:"6s",capacity:1300,connector:"XT60"},tags:["6s","5","XT60"]},
  {id:29,category:"battery",brand:"CNHL",name:"Black 1500mAh 6S XT60",price:29,weight:255,specs:{cells:"6s",capacity:1500,connector:"XT60"},tags:["6s","5","budget"]},
  {id:30,category:"battery",brand:"Auline",name:"Li-ion 6S 4000mAh Pack",price:75,weight:410,specs:{cells:"6s",capacity:4000,connector:"XT60"},tags:["6s","7","longrange"]},
  {id:31,category:"battery",brand:"BetaFPV",name:"1S 300mAh BT2.0",price:6,weight:8,specs:{cells:"1s",capacity:300,connector:"BT2.0"},tags:["1s","whoop"]},

  {id:32,category:"vtx",brand:"Walksnail",name:"Avatar HD Mini 1S Kit",price:90,weight:8,specs:{system:"walksnail"},tags:["digital","light","whoop","3.5"]},
  {id:33,category:"vtx",brand:"Walksnail",name:"Avatar HD Pro Kit",price:130,weight:28,specs:{system:"walksnail"},tags:["digital","3.5","5"]},
  {id:34,category:"vtx",brand:"Walksnail",name:"Moonlight 4K Kit",price:190,weight:45,specs:{system:"walksnail"},tags:["digital","cinematic","4k"]},
  {id:35,category:"vtx",brand:"DJI",name:"DJI O3 Air Unit",price:229,weight:39,specs:{system:"dji"},tags:["digital","5","cinematic"]},
  {id:36,category:"vtx",brand:"RushFPV",name:"Tank Solo Analog VTX + Cam",price:48,weight:13,specs:{system:"analog"},tags:["analog","cheap","light"]},

  {id:37,category:"rx",brand:"RadioMaster",name:"RP1 ELRS 2.4GHz Receiver",price:16,weight:1,specs:{protocol:"ELRS"},tags:["ELRS","2.4","small"]},
  {id:38,category:"rx",brand:"RadioMaster",name:"RP2 ELRS 2.4GHz Receiver",price:17,weight:1,specs:{protocol:"ELRS"},tags:["ELRS","ceramic","small"]},
  {id:39,category:"rx",brand:"HappyModel",name:"EP1 ELRS Receiver",price:14,weight:1,specs:{protocol:"ELRS"},tags:["ELRS","budget"]},
  {id:40,category:"rx",brand:"DJI",name:"DJI Control Link via Air Unit",price:0,weight:0,specs:{protocol:"DJI"},tags:["DJI","no receiver"]},

  {id:41,category:"antenna",brand:"TrueRC",name:"Singularity Stubby 5.8",price:20,weight:5,specs:{gain:1.9},tags:["5.8","digital","analog"]},
  {id:42,category:"antenna",brand:"Lumenier",name:"AXII 2 Long Range",price:25,weight:8,specs:{gain:2.2},tags:["5.8","longrange"]},
  {id:43,category:"antenna",brand:"Walksnail",name:"Avatar Mini Antenna",price:10,weight:2,specs:{gain:1.5},tags:["walksnail","light"]},

  {id:44,category:"extras",brand:"VIFLY",name:"Finder 2 Buzzer",price:15,weight:5,specs:{},tags:["safety","recommended"]},
  {id:45,category:"extras",brand:"HGLRC",name:"M100 Mini GPS",price:18,weight:6,specs:{},tags:["gps","longrange"]},
  {id:46,category:"extras",brand:"Panasonic",name:"Low ESR Capacitor 1000uF",price:3,weight:4,specs:{},tags:["noise","recommended"]},
  {id:47,category:"extras",brand:"GoPro",name:"GoPro Payload Simulation",price:0,weight:155,specs:{},tags:["payload","cinematic"]}
];

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

  if (!frame) issues.push({ level: "warn", text: "Frame is not selected." });
  if (!motor) issues.push({ level: "warn", text: "Motors are not selected." });
  if (!stack) issues.push({ level: "warn", text: "FC/ESC is not selected." });
  if (!props) issues.push({ level: "warn", text: "Props are not selected." });
  if (!battery) issues.push({ level: "warn", text: "Battery is not selected." });

  if (frame && props) {
    if (String(frame.specs.size) !== String(props.specs.propSize)) issues.push({ level: "bad", text: `Props ${props.specs.propSize} do not match frame ${frame.specs.size}.` });
    else issues.push({ level: "good", text: "Prop size matches the frame." });
  }

  if (frame && motor && motor.specs.ideal && !motor.specs.ideal.includes(String(frame.specs.size))) issues.push({ level: "warn", text: `Motors are not ideal for ${frame.specs.size} frame.` });
  else if (frame && motor) issues.push({ level: "good", text: "Motors match the frame class." });

  if (stack && motor && stack.specs.esc < motor.specs.amp * 1.2) issues.push({ level: "bad", text: `ESC ${stack.specs.esc}A is too weak. Better minimum: ${Math.ceil(motor.specs.amp * 1.2)}A.` });
  else if (stack && motor) issues.push({ level: "good", text: "ESC has enough current headroom." });

  if (frame && stack && frame.specs.mount && stack.specs.mount && !frame.specs.mount.includes(stack.specs.mount)) issues.push({ level: "bad", text: `Stack mount ${stack.specs.mount} may not fit the frame.` });
  else if (frame && stack) issues.push({ level: "good", text: "Stack mounting fits the frame." });

  if (stack && battery && stack.specs.voltage && !stack.specs.voltage.includes(battery.specs.cells)) issues.push({ level: "bad", text: `${battery.specs.cells.toUpperCase()} battery is not supported by selected FC/ESC.` });
  else if (stack && battery) issues.push({ level: "good", text: "Battery voltage is compatible with FC/ESC." });

  if (frame && frame.specs.size === "3.5" && vtx && (vtx.name.includes("DJI O3") || vtx.name.includes("Moonlight"))) issues.push({ level: "warn", text: "DJI O3/Moonlight is heavy for 3.5 inch builds." });

  if (budget > 0 && totalPrice > budget) issues.push({ level: "warn", text: `Build is over budget by $${Math.round(totalPrice - budget)}.` });
  else if (budget > 0 && parts.length > 0) issues.push({ level: "good", text: "Build fits the budget." });

  const twr = totalWeight > 0 ? thrust / totalWeight : 0;
  if (thrust > 0 && totalWeight > 0) {
    if (twr >= 5) issues.push({ level: "good", text: "Excellent thrust reserve." });
    else if (twr >= 3.5) issues.push({ level: "warn", text: "Average thrust reserve." });
    else issues.push({ level: "bad", text: "Low thrust reserve." });
  }

  const bad = issues.filter(i => i.level === "bad").length;
  const warn = issues.filter(i => i.level === "warn").length;
  let status = "Build possible";
  let statusLevel = "good";
  if (bad > 0) { status = "Critical issues"; statusLevel = "bad"; }
  else if (warn > 0) { status = "Has warnings"; statusLevel = "warn"; }

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
  let result = components;
  if (category) result = result.filter(p => p.category === category);
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(p => `${p.brand} ${p.name} ${(p.tags || []).join(" ")}`.toLowerCase().includes(q));
  }
  res.json(result);
});

app.post("/api/components", (req, res) => {
  const { category, brand, name, price = 0, weight = 0, specs = {}, tags = [] } = req.body;
  if (!category || !brand || !name) return res.status(400).json({ error: "category, brand and name are required" });
  const part = { id: components.length + 1, category, brand, name, price: Number(price), weight: Number(weight), specs, tags };
  components.push(part);
  res.status(201).json(part);
});

app.post("/api/analyze", (req, res) => {
  const { parts = {}, budget = 0 } = req.body;
  const ids = [];
  for (const value of Object.values(parts)) Array.isArray(value) ? ids.push(...value) : value && ids.push(value);
  const selected = components.filter(p => ids.map(Number).includes(Number(p.id)));
  res.json(analyzeParts(selected, Number(budget)));
});

app.get("/api/builds", (req, res) => res.json(savedBuilds));

app.post("/api/builds", (req, res) => {
  const { name = "My FPV Build", parts = {}, budget = 0 } = req.body;
  const ids = [];
  for (const value of Object.values(parts)) Array.isArray(value) ? ids.push(...value) : value && ids.push(value);
  const selected = components.filter(p => ids.map(Number).includes(Number(p.id)));
  const analysis = analyzeParts(selected, Number(budget));
  const build = { id: Date.now(), name, parts, budget, analysis, created_at: new Date().toISOString() };
  savedBuilds.unshift(build);
  res.status(201).json(build);
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

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, () => console.log(`FPV Drone Builder running on port ${PORT}`));
