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

test("autobuild avoids blocking incompatibilities for every mission", () => {
  const goals = ["tinywhoop", "toothpick", "freestyle35", "freestyle5", "racing5", "cinewhoop", "cinematic", "longrange", "heavylift"];
  const required = ["frame", "motor", "stack", "props", "battery", "vtx", "rx", "antenna"];

  for (const goal of goals) {
    const result = autoBuild(components, { goal, budget: 650 });
    for (const category of required) {
      assert.ok(result.build[category], `${goal} is missing ${category}`);
    }
    assert.equal(result.analysis.counts.bad, 0, `${goal} has a blocking incompatibility`);
    assert.equal(result.analysis.counts.missing, 0, `${goal} is incomplete`);
  }
});

test("an ESC matching estimated motor current is a warning, not a blocker", () => {
  const motor = first("motor", "tinywhoop");
  const stack = first("stack", "tinywhoop");
  const analysis = analyzeBuild([motor, stack], { goal: "tinywhoop" });
  const issue = analysis.issues.find(item => item.code === "esc_headroom");
  assert.equal(issue.level, "warn");
});

test("unsupported battery voltage is detected", () => {
  const stack = components.find(part => part.category === "stack" && Array.isArray(part.specs.voltage) && part.specs.voltage.length === 1 && part.specs.voltage[0] === "1s");
  const battery = components.find(part => part.category === "battery" && part.specs.cells === "6s");
  const analysis = analyzeBuild([stack, battery]);
  assert.ok(analysis.issues.some(issue => issue.code === "battery_voltage" && issue.level === "bad"));
});

test("duplicate component ids are counted once", () => {
  const motor = first("motor", "freestyle35");
  const analysis = analyzeBuild([motor, motor], { goal: "freestyle35" });
  assert.equal(analysis.totals.price, motor.price);
  assert.equal(analysis.totals.thrust, motor.specs.thrust);
});

test("parts outside the selected mission are reported", () => {
  const frame = first("frame", "tinywhoop");
  const analysis = analyzeBuild([frame], { goal: "heavylift" });
  assert.ok(analysis.issues.some(issue => issue.code === "mission_fit" && issue.level === "warn"));
});

test("approved mission fallbacks do not create a mission warning", () => {
  const stack = first("stack", "freestyle35");
  const analysis = analyzeBuild([stack], { goal: "cinewhoop" });
  assert.ok(analysis.issues.some(issue => issue.code === "mission_fit" && issue.level === "good"));
});

test("two-prop heavy-lift packs are purchased twice", () => {
  const props = first("props", "heavylift");
  assert.equal(quantityFor(props), 2);
  const analysis = analyzeBuild([props], { goal: "heavylift" });
  assert.equal(analysis.totals.price, props.price * 2);
  assert.equal(analysis.totals.weight, props.weight * 2);
});

test("autobuild omits optional extras when they do not fit the budget", () => {
  const result = autoBuild(components, { goal: "heavylift", budget: 650 });
  assert.equal(result.build.extras, undefined);
  assert.equal(result.parts.some(part => part.category === "extras"), false);
});

test("thrust reserve guidance follows the selected mission", () => {
  const result = autoBuild(components, { goal: "heavylift", budget: 0 });
  const issue = result.analysis.issues.find(item => item.code === "thrust_weight");
  assert.equal(issue.level, "good");
  assert.match(issue.detail, /selected mission/);
});
