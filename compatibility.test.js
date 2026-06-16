const test = require("node:test");
const assert = require("node:assert/strict");
const components = require("../data/components.json");
const { analyzeBuild, quantityFor } = require("../server/compatibility");
const { autoBuild } = require("../server/autobuild");

function first(category, goal) {
  return components.find(part => part.category === category && (part.tags || []).includes(goal));
}

test("motor-set totals are not multiplied twice", () => {
  const motor = first("motor", "freestyle35");
  assert.equal(quantityFor(motor), 1);
  const analysis = analyzeBuild([motor], { goal: "freestyle35", budget: 1000 });
  assert.equal(analysis.totals.price, Number(motor.price.toFixed(2)));
  assert.equal(analysis.totals.weight, Math.round(motor.weight));
});

test("frame and prop mismatch is a blocking issue", () => {
  const frame = components.find(part => part.category === "frame" && part.specs.size === "3.5");
  const props = components.find(part => part.category === "props" && part.specs.propSize === "5");
  const analysis = analyzeBuild([frame, props], { goal: "freestyle35" });
  assert.ok(analysis.issues.some(issue => issue.code === "frame_prop_size" && issue.level === "bad"));
});

test("autobuild returns all required categories", () => {
  const result = autoBuild(components, { goal: "freestyle35", budget: 700 });
  for (const category of ["frame", "motor", "stack", "props", "battery", "vtx", "rx", "antenna"]) {
    assert.ok(result.build[category], `missing ${category}`);
  }
  assert.ok(result.analysis.compatibilityScore >= 0 && result.analysis.compatibilityScore <= 100);
});

test("unsupported battery voltage is detected", () => {
  const stack = components.find(part => part.category === "stack" && Array.isArray(part.specs.voltage) && part.specs.voltage.length === 1 && part.specs.voltage[0] === "1s");
  const battery = components.find(part => part.category === "battery" && part.specs.cells === "6s");
  const analysis = analyzeBuild([stack, battery]);
  assert.ok(analysis.issues.some(issue => issue.code === "battery_voltage" && issue.level === "bad"));
});
