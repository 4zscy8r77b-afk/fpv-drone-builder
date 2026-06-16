const REQUIRED_CATEGORIES = ["frame", "motor", "stack", "props", "battery", "vtx", "rx", "antenna"];

function quantityFor(part) {
  if (!part) return 0;
  if (Number.isFinite(Number(part.specs?.qty))) return Number(part.specs.qty);
  // The imported catalog stores motor-set price, weight and thrust at build level.
  return 1;
}

function cellsNumber(value) {
  const match = String(value || "").toLowerCase().match(/(\d+)s/);
  return match ? Number(match[1]) : 0;
}

function categoryMap(parts) {
  const map = {};
  for (const part of parts) {
    if (!part) continue;
    if (part.category === "extras") {
      if (!map.extras) map.extras = [];
      map.extras.push(part);
    } else {
      map[part.category] = part;
    }
  }
  return map;
}

function addIssue(issues, level, code, title, detail, fix = "") {
  issues.push({ level, code, title, detail, fix });
}

function estimateFlightMinutes({ battery, totalWeight, frame }) {
  if (!battery || !totalWeight) return null;
  const cells = cellsNumber(battery.specs?.cells);
  const capacityAh = Number(battery.specs?.capacity || 0) / 1000;
  if (!cells || !capacityAh) return null;

  const frameSize = String(frame?.specs?.size || "5");
  const powerDensity = frameSize === "whoop" ? 0.42
    : Number(frameSize) <= 3 ? 0.34
    : Number(frameSize) <= 3.5 ? 0.42
    : Number(frameSize) <= 5 ? 0.52
    : Number(frameSize) <= 7 ? 0.35
    : 0.28;

  const usableWh = capacityAh * cells * 3.7 * 0.8;
  const cruiseWatts = Math.max(12, totalWeight * powerDensity);
  return Math.max(1.2, Math.min(30, usableWh / cruiseWatts * 60));
}

function analyzeBuild(parts, options = {}) {
  const budget = Number(options.budget || 0);
  const goal = String(options.goal || "");
  const map = categoryMap(parts);
  const issues = [];

  let totalPrice = 0;
  let totalWeight = 0;
  let totalThrust = 0;

  for (const part of parts) {
    const qty = quantityFor(part);
    totalPrice += Number(part.price || 0) * qty;
    totalWeight += Number(part.weight || 0) * qty;
    totalThrust += Number(part.specs?.thrust || 0) * qty;
  }

  for (const category of REQUIRED_CATEGORIES) {
    if (!map[category]) {
      addIssue(
        issues,
        "missing",
        `missing_${category}`,
        `${category.toUpperCase()} not selected`,
        "This category is required for a complete build.",
        `Select a compatible ${category}.`
      );
    }
  }

  const frame = map.frame;
  const motor = map.motor;
  const stack = map.stack;
  const props = map.props;
  const battery = map.battery;
  const vtx = map.vtx;
  const antenna = map.antenna;

  if (frame && props) {
    const frameSize = String(frame.specs?.size || "");
    const propSize = String(props.specs?.propSize || "");
    if (frameSize !== propSize) {
      addIssue(issues, "bad", "frame_prop_size", "Propeller size mismatch", `${propSize || "Unknown"} props do not match a ${frameSize || "unknown"} frame.`, "Choose props with the same size class as the frame.");
    } else {
      addIssue(issues, "good", "frame_prop_size", "Frame and props match", `${propSize} propellers fit the selected frame class.`);
    }
  }

  if (frame && motor) {
    const frameSize = String(frame.specs?.size || "");
    const goalMatch = (motor.tags || []).includes(goal);
    const sizeTagMatch = (motor.tags || []).some(tag => tag === frameSize || tag.includes(frameSize));
    if (!goalMatch && !sizeTagMatch) {
      addIssue(issues, "warn", "motor_frame_class", "Motor class may be unsuitable", `${motor.name} is not tagged for the selected mission or frame class.`, "Choose a motor recommended for this mission.");
    } else {
      addIssue(issues, "good", "motor_frame_class", "Motor class is appropriate", "Motor size and intended use align with the selected mission.");
    }
  }

  if (stack && motor) {
    const esc = Number(stack.specs?.esc || 0);
    const motorAmp = Number(motor.specs?.amp || 0);
    const recommended = Math.ceil(motorAmp * 1.25);
    if (esc && motorAmp && esc < recommended) {
      addIssue(issues, "bad", "esc_headroom", "ESC current headroom is too low", `${stack.name} is rated at ${esc}A; these motors need about ${recommended}A of headroom.`, `Use an ESC rated for at least ${recommended}A.`);
    } else if (esc && motorAmp) {
      addIssue(issues, "good", "esc_headroom", "ESC current headroom is sufficient", `${esc}A ESC rating provides suitable headroom.`);
    }
  }

  if (stack && battery) {
    const supported = Array.isArray(stack.specs?.voltage) ? stack.specs.voltage.map(v => String(v).toLowerCase()) : [];
    const cells = String(battery.specs?.cells || "").toLowerCase();
    if (supported.length && cells && !supported.includes(cells)) {
      addIssue(issues, "bad", "battery_voltage", "Battery voltage is unsupported", `${battery.name} uses ${cells.toUpperCase()}, but the selected FC/ESC supports ${supported.map(v => v.toUpperCase()).join(", ")}.`, "Choose a supported battery or a different FC/ESC stack.");
    } else if (supported.length && cells) {
      addIssue(issues, "good", "battery_voltage", "Battery voltage is supported", `${cells.toUpperCase()} is supported by the selected FC/ESC.`);
    }
  }

  if (motor && battery) {
    const kv = Number(motor.specs?.kv || 0);
    const cells = cellsNumber(battery.specs?.cells);
    const electricalSpeed = kv * cells;
    if (kv && cells) {
      if (electricalSpeed > 38000) {
        addIssue(issues, "warn", "kv_voltage", "High KV and voltage combination", `${kv}KV on ${cells}S is an aggressive setup that may overheat motors or ESCs.`, "Verify the motor manufacturer's recommended cell count.");
      } else if (electricalSpeed < 6500 && String(frame?.specs?.size || "") !== "10") {
        addIssue(issues, "warn", "kv_voltage", "Low KV and voltage combination", "The selected motor and battery may feel underpowered for this frame.", "Consider a higher-KV motor or higher supported cell count.");
      } else {
        addIssue(issues, "good", "kv_voltage", "Motor KV and voltage are plausible", "The KV and battery cell count fall within a reasonable range.");
      }
    }
  }

  if (frame && vtx) {
    const frameSize = String(frame.specs?.size || "");
    const isHeavyDigital = /O3|O4|Moonlight/i.test(vtx.name);
    if ((frameSize === "whoop" || Number(frameSize) <= 3.5) && isHeavyDigital) {
      addIssue(issues, "warn", "vtx_weight", "Video system is heavy for this frame", `${vtx.name} can make a small build difficult to tune and protect.`, "Prefer a lighter video unit or confirm the frame is designed for it.");
    }
  }

  if (vtx && antenna) {
    const antennaFreq = String(antenna.specs?.freq || "").toLowerCase();
    if (antennaFreq && !antennaFreq.includes("5.8")) {
      addIssue(issues, "warn", "antenna_frequency", "Antenna frequency needs verification", `${antenna.name} does not clearly indicate 5.8GHz video compatibility.`, "Verify antenna frequency and connector type.");
    }
  }

  if (budget > 0) {
    if (totalPrice > budget) {
      addIssue(issues, "warn", "budget", "Build exceeds budget", `Estimated parts cost is $${totalPrice.toFixed(0)}, which is $${(totalPrice - budget).toFixed(0)} over budget.`, "Replace one or more premium parts with value alternatives.");
    } else if (parts.length) {
      addIssue(issues, "good", "budget", "Build fits the budget", `$${(budget - totalPrice).toFixed(0)} remains in the stated budget.`);
    }
  }

  const thrustToWeight = totalWeight > 0 ? totalThrust / totalWeight : 0;
  if (totalThrust && totalWeight) {
    if (thrustToWeight < 2.5) {
      addIssue(issues, "bad", "thrust_weight", "Insufficient thrust reserve", `${thrustToWeight.toFixed(1)}:1 thrust-to-weight may produce poor control authority.`, "Use stronger motors, lighter parts, or a smaller battery.");
    } else if (thrustToWeight < 4) {
      addIssue(issues, "warn", "thrust_weight", "Moderate thrust reserve", `${thrustToWeight.toFixed(1)}:1 is flyable but not ideal for aggressive freestyle.`, "Reduce weight or use a higher-thrust motor for more performance.");
    } else {
      addIssue(issues, "good", "thrust_weight", "Strong thrust reserve", `${thrustToWeight.toFixed(1)}:1 provides good control authority.`);
    }
  }

  const badCount = issues.filter(issue => issue.level === "bad").length;
  const warnCount = issues.filter(issue => issue.level === "warn").length;
  const missingCount = issues.filter(issue => issue.level === "missing").length;
  const goodCount = issues.filter(issue => issue.level === "good").length;

  const score = Math.max(0, Math.min(100, Math.round(100 - badCount * 18 - warnCount * 7 - missingCount * 10)));
  const statusLevel = badCount ? "bad" : warnCount || missingCount ? "warn" : "good";
  const status = badCount ? "Critical incompatibilities" : missingCount ? "Build incomplete" : warnCount ? "Build has warnings" : "Build ready";

  return {
    status,
    statusLevel,
    compatibilityScore: score,
    counts: { bad: badCount, warn: warnCount, missing: missingCount, good: goodCount },
    totals: {
      price: Number(totalPrice.toFixed(2)),
      weight: Math.round(totalWeight),
      thrust: Math.round(totalThrust),
      thrustToWeight: Number(thrustToWeight.toFixed(2)),
      estimatedFlightMinutes: (() => {
        const value = estimateFlightMinutes({ battery, totalWeight, frame });
        return value == null ? null : Number(value.toFixed(1));
      })()
    },
    issues
  };
}

module.exports = {
  REQUIRED_CATEGORIES,
  analyzeBuild,
  categoryMap,
  quantityFor
};
