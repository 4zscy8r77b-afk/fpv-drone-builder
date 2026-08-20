const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { version } = require("../package.json");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "public/assets/js/app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "public/index.html"), "utf8");
const workerSource = fs.readFileSync(path.join(root, "public/service-worker.js"), "utf8");

test("browser assets use the current release cache key", () => {
  assert.match(indexSource, new RegExp(`app\\.js\\?v=${version.replaceAll(".", "\\.")}`));
  assert.match(indexSource, new RegExp(`app\\.css\\?v=${version.replaceAll(".", "\\.")}`));
  assert.match(workerSource, new RegExp(`app\\.js\\?v=${version.replaceAll(".", "\\.")}`));
});

test("selected catalog parts can be removed", () => {
  assert.match(appSource, /if \(isSelected\) delete state\.build\[part\.category\]/);
  assert.match(appSource, /data-remove-category=/);
  assert.match(appSource, /aria-pressed="\$\{isSelected\}"/);
});

test("CSV export describes motor sets without multiplying package cost", () => {
  assert.match(appSource, /"Packages to buy", "Items per package", "Package price \(USD\)"/);
  assert.match(appSource, /const itemsPerPackage = category === "motor" \? 4 : 1/);
  assert.doesNotMatch(appSource, /effectivePrice\(part\) \/ Math\.max\(1, quantity\)/);
});

test("catalog errors expose a retry action", () => {
  assert.match(appSource, /id="retryCatalogBtn"/);
  assert.match(appSource, /retryCatalogBtn.*window\.location\.reload/s);
});
