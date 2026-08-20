const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const requiredPaths = [
  "server/index.js",
  "server/compatibility.js",
  "server/autobuild.js",
  "server/store.js",
  "data/components.json",
  "data/builds.json",
  "tests/compatibility.test.js",
  "public/index.html",
  "public/assets/css/app.css",
  "public/assets/js/app.js",
  "public/assets/js/three-preview.js",
  "public/assets/js/vendor/OrbitControls.js",
  "public/assets/icon.svg",
  "public/manifest.webmanifest",
  "public/service-worker.js"
];

const missing = requiredPaths.filter(relativePath => !fs.existsSync(path.join(root, relativePath)));

if (missing.length) {
  console.error(`Missing required production files:\n${missing.map(item => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(`Production layout verified (${requiredPaths.length} required paths).`);
