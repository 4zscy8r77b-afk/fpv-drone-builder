const { analyzeBuild, matchesGoal, REQUIRED_CATEGORIES, quantityFor } = require("./compatibility");

const CATEGORY_BUDGET_SHARE = {
  frame: 0.12,
  motor: 0.18,
  stack: 0.18,
  props: 0.02,
  battery: 0.08,
  vtx: 0.27,
  rx: 0.05,
  antenna: 0.04,
  extras: 0.06
};

function goalRelevance(part, goal) {
  const tags = part.tags || [];
  let score = tags.includes(goal) ? 42 : 0;
  if (goal === "cinematic" && tags.includes("freestyle5")) score += 12;
  if (goal === "cinewhoop" && tags.includes("freestyle35")) score += 8;
  if (goal === "toothpick" && tags.includes("freestyle35")) score += 4;
  return score;
}

function priceScore(part, budget, category) {
  if (!budget) return 12;
  const target = budget * (CATEGORY_BUDGET_SHARE[category] || 0.1);
  const effectivePrice = Number(part.price || 0) * quantityFor(part);
  if (!target) return 0;
  const ratio = effectivePrice / target;
  if (ratio <= 0.8) return 16;
  if (ratio <= 1.1) return 12;
  if (ratio <= 1.4) return 4;
  return -10;
}

function partQualityScore(part) {
  const name = `${part.brand} ${part.name}`.toLowerCase();
  let score = 0;
  if (/speedybee|t-motor|iflight|geprc|radiomaster|tattu|gemfan|hqprop|dji|walksnail/.test(name)) score += 4;
  if (/\b(?:premium|pro|v2|v3|v4)\b/.test(name)) score += 2;
  return score;
}

function candidateScore(part, selected, goal, budget) {
  let score = goalRelevance(part, goal) + priceScore(part, budget, part.category) + partQualityScore(part);
  score -= Number(part.weight || 0) * (part.category === "frame" ? 0.03 : 0.01);

  const trialParts = [...Object.values(selected).flat().filter(Boolean), part];
  const analysis = analyzeBuild(trialParts, { goal, budget });
  score += analysis.compatibilityScore * 0.35;
  score -= analysis.counts.bad * 30;
  score -= analysis.counts.warn * 4;
  return score;
}

function autoBuild(components, options = {}) {
  const goal = String(options.goal || "freestyle35");
  const budget = Number(options.budget || 0);
  const selected = {};

  for (const category of REQUIRED_CATEGORIES) {
    const candidates = components.filter(part => part.category === category && matchesGoal(part, goal));
    const fallback = candidates.length ? candidates : components.filter(part => part.category === category);
    const ranked = fallback
      .map(part => ({ part, score: candidateScore(part, selected, goal, budget) }))
      .sort((a, b) => b.score - a.score || Number(a.part.price) - Number(b.part.price));

    if (ranked[0]) selected[category] = ranked[0].part;
  }

  for (let pass = 0; pass < 2; pass += 1) {
    for (const category of REQUIRED_CATEGORIES) {
      const missionCandidates = components.filter(part => part.category === category && matchesGoal(part, goal));
      const candidates = missionCandidates.length
        ? missionCandidates
        : components.filter(part => part.category === category);
      let best = selected[category];
      let bestScore = -Infinity;
      for (const candidate of candidates) {
        const trial = { ...selected, [category]: candidate };
        const trialParts = Object.values(trial).flat().filter(Boolean);
        const analysis = analyzeBuild(trialParts, { goal, budget });
        const total = analysis.compatibilityScore * 2
          - analysis.counts.bad * 45
          - analysis.counts.warn * 8
          + goalRelevance(candidate, goal)
          + priceScore(candidate, budget, category);
        if (total > bestScore) {
          bestScore = total;
          best = candidate;
        }
      }
      if (best) selected[category] = best;
    }
  }

  const optionalCandidates = components
    .filter(part => part.category === "extras" && matchesGoal(part, goal))
    .map(part => ({
      part,
      score: candidateScore(part, selected, goal, budget),
      total: analyzeBuild([...Object.values(selected), part], { goal, budget }).totals.price
    }))
    .filter(candidate => !budget || candidate.total <= budget)
    .sort((a, b) => b.score - a.score || Number(a.part.price) - Number(b.part.price));

  if (optionalCandidates[0]) selected.extras = optionalCandidates[0].part;

  const parts = Object.values(selected).flat().filter(Boolean);
  const analysis = analyzeBuild(parts, { goal, budget });
  const build = Object.fromEntries(Object.entries(selected).map(([category, part]) => [category, part.id]));

  return { build, parts, analysis };
}

module.exports = { autoBuild };
