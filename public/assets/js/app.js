(() => {
  "use strict";

  const CATEGORY_INFO = {
    frame: { label: "Frame", plural: "Frames", desc: "The airframe defines propeller size, mounting space, durability and the entire weight class." },
    motor: { label: "Motors", plural: "Motors", desc: "Four motors generate thrust. KV, stator size, current draw and battery voltage must work together." },
    stack: { label: "FC / ESC", plural: "FC / ESC", desc: "The flight controller runs the aircraft; the ESC delivers power to all four motors." },
    props: { label: "Propellers", plural: "Propellers", desc: "Prop diameter must match the frame. Pitch and blade count change grip, efficiency and current draw." },
    battery: { label: "Battery", plural: "Batteries", desc: "Cell count controls voltage. Capacity adds flight time, but also adds weight and changes handling." },
    vtx: { label: "Video system", plural: "Video", desc: "The camera and transmitter create the live FPV feed. Digital systems add image quality and weight." },
    rx: { label: "Receiver", plural: "Receivers", desc: "The receiver must match your radio protocol. ExpressLRS is the most common modern choice." },
    antenna: { label: "Antenna", plural: "Antennas", desc: "The correct antenna frequency, connector and polarization are essential for a reliable video link." },
    extras: { label: "Extra", plural: "Extras", desc: "GPS, buzzers, capacitors, action cameras and BECs add capability, safety or electrical stability." }
  };

  const BUILD_INFO = {
    tinywhoop: {
      title: "Tinywhoop", skill: "Beginner", image: "/assets/builds/tinywhoop.jpg",
      desc: "A compact, protected indoor platform designed for frequent practice and low-consequence crashes.",
      pros: ["Safe indoor practice", "Low repair cost", "Portable and quiet"],
      best: ["First acro practice", "Small indoor spaces"]
    },
    toothpick: {
      title: "Toothpick", skill: "Beginner+", image: "/assets/builds/toothpick.jpg",
      desc: "An efficient lightweight outdoor build with more speed than a whoop and less risk than a full 5-inch quad.",
      pros: ["Light and efficient", "Lower noise", "Affordable batteries"],
      best: ["Parks", "Small fields"]
    },
    freestyle35: {
      title: "3.5\" Freestyle", skill: "Beginner / Intermediate", image: "/assets/builds/freestyle35.jpg",
      desc: "A compact outdoor freestyle platform that delivers real performance while keeping weight and repair costs controlled.",
      pros: ["Strong first outdoor build", "Compact batteries", "Real freestyle handling"],
      best: ["Learning acro", "Park freestyle"]
    },
    freestyle5: {
      title: "5\" Freestyle", skill: "Intermediate", image: "/assets/builds/freestyle5inch.jpg",
      desc: "The classic high-performance FPV format with a huge parts ecosystem and enough power for aggressive flying.",
      pros: ["High power", "Durable ecosystem", "Easy parts availability"],
      best: ["Freestyle", "Open fields"]
    },
    racing5: {
      title: "5\" Racing", skill: "Advanced", image: "/assets/builds/racing5inch.jpg",
      desc: "A lightweight, low-latency configuration prioritizing acceleration, sharp response and gate performance.",
      pros: ["Fast acceleration", "Sharp control", "Low-latency focus"],
      best: ["Race tracks", "Gate training"]
    },
    cinewhoop: {
      title: "Cinewhoop", skill: "Intermediate", image: "/assets/builds/cinewhoop.jpg",
      desc: "A ducted platform for controlled cinematic movement close to people, structures and indoor environments.",
      pros: ["Protected propellers", "Predictable proximity flying", "Smooth footage"],
      best: ["Indoor filming", "Close-range cinematic work"]
    },
    cinematic: {
      title: "Cinematic 5\"", skill: "Intermediate / Advanced", image: "/assets/builds/cinematic.jpg",
      desc: "A powerful camera-carrying build for dynamic action footage where speed, stability and payload matter.",
      pros: ["Action-camera payload", "Power in wind", "Dynamic footage"],
      best: ["Mountains", "Vehicles and action sports"]
    },
    longrange: {
      title: "7\" Long Range", skill: "Advanced", image: "/assets/builds/longrange.jpg",
      desc: "An efficient cruiser optimized for stable flight, GPS support and longer missions away from the pilot.",
      pros: ["Extended endurance", "Stable cruising", "Room for GPS and antennas"],
      best: ["Exploration", "Long scenic routes"]
    },
    heavylift: {
      title: "Heavy Lift", skill: "Professional", image: "/assets/builds/heavylift.jpg",
      desc: "A large platform designed for professional payloads, redundant planning and carefully validated power systems.",
      pros: ["Large payload capacity", "Stable camera platform", "Professional flexibility"],
      best: ["Cinema payloads", "Specialized professional work"]
    }
  };

  const CATEGORIES = ["frame", "motor", "stack", "props", "battery", "vtx", "rx", "antenna", "extras"];
  const REQUIRED_CATEGORIES = CATEGORIES.filter(category => category !== "extras");
  const GOAL_FALLBACKS = {
    cinematic: ["freestyle5"],
    cinewhoop: ["freestyle35"],
    toothpick: ["freestyle35"]
  };
  const STORAGE_KEY = "fpv-working-state-v3";
  const LEGACY_STORAGE_KEY = "fpv-working-build-v2";
  const DEFAULT_BUDGET = 650;
  const UI_VERSION = "2.2.0";
  const storedState = loadStoredState();
  const state = {
    components: [],
    currentCategory: "frame",
    activeGoal: storedState.goal,
    budget: storedState.budget,
    page: 1,
    perPage: 6,
    build: storedState.build,
    analysis: null,
    analyzeSequence: 0
  };

  function $(id) { return document.getElementById(id); }

  function normalizeBudget(value, fallback = DEFAULT_BUDGET) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(100000, Math.max(0, Math.round(number)));
  }

  function normalizeBuild(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const build = {};
    for (const category of CATEGORIES) {
      const rawId = Array.isArray(value[category]) ? value[category][0] : value[category];
      const id = Number(rawId);
      if (Number.isInteger(id) && id > 0) build[category] = id;
    }
    return build;
  }

  function loadStoredState() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (value && typeof value === "object") {
        return {
          goal: BUILD_INFO[value.goal] ? value.goal : "freestyle35",
          budget: normalizeBudget(value.budget),
          build: normalizeBuild(value.build)
        };
      }

      const legacyBuild = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "{}");
      return { goal: "freestyle35", budget: DEFAULT_BUDGET, build: normalizeBuild(legacyBuild) };
    } catch {
      return { goal: "freestyle35", budget: DEFAULT_BUDGET, build: {} };
    }
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ goal: state.activeGoal, budget: state.budget, build: state.build }));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in private or locked-down browsing modes.
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function money(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value || 0));
  }

  function quantityFor(part) {
    const explicit = Number(part?.specs?.qty);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    return 1;
  }

  function purchaseQuantityFor(part) {
    return part?.category === "motor" ? 4 : quantityFor(part);
  }

  function effectivePrice(part) {
    return Number(part?.price || 0) * quantityFor(part);
  }

  function byId(id) {
    return state.components.find(part => Number(part.id) === Number(id));
  }

  function selected(category) {
    const id = state.build[category];
    return id ? byId(id) : null;
  }

  function selectedParts() {
    return Object.values(state.build).flat().map(byId).filter(Boolean);
  }

  function matchesGoal(part, goal = state.activeGoal) {
    const tags = part?.tags || [];
    return tags.includes(goal) || (GOAL_FALLBACKS[goal] || []).some(tag => tags.includes(tag));
  }

  function missionCompatible(part) {
    if (!$("compatibleOnly")?.checked) return true;
    return matchesGoal(part);
  }

  function currentBudget() {
    return normalizeBudget($("budget")?.value, state.budget);
  }

  function safeExternalUrl(value) {
    if (!value) return "#";
    try {
      const url = new URL(String(value), window.location.origin);
      if (url.protocol === "http:" || url.protocol === "https:") return url.href;
    } catch {
      // Fall through to a non-navigating link.
    }
    return "#";
  }

  function recommendedScore(part) {
    let score = (part.tags || []).includes(state.activeGoal) ? 100 : 0;
    if (state.activeGoal === "cinematic" && (part.tags || []).includes("freestyle5")) score += 28;
    score += Math.max(0, 30 - effectivePrice(part) * 0.05);
    score += Math.max(0, 12 - Number(part.weight || 0) * 0.02);
    if (/speedybee|t-motor|iflight|geprc|radiomaster|tattu|gemfan|hqprop|dji|walksnail/i.test(`${part.brand} ${part.name}`)) score += 7;
    return score;
  }

  async function api(path, options = {}) {
    const headers = { Accept: "application/json", ...(options.headers || {}) };
    if (options.body) headers["Content-Type"] = "application/json";
    const response = await fetch(path, {
      ...options,
      headers
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
    return data;
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function renderLoading() {
    $("parts").setAttribute("aria-busy", "true");
    $("parts").innerHTML = Array.from({ length: 4 }, () => '<div class="loading-card"></div>').join("");
  }

  function applyUrlState() {
    const params = new URLSearchParams(window.location.search);
    const goal = params.get("goal");
    if (goal && BUILD_INFO[goal]) state.activeGoal = goal;
    if (params.has("build")) {
      try {
        state.build = normalizeBuild(JSON.parse(params.get("build") || "{}"));
      } catch {
        state.build = {};
      }
      state.budget = params.has("budget") ? normalizeBudget(params.get("budget")) : DEFAULT_BUDGET;
    } else if (params.has("budget")) {
      state.budget = normalizeBudget(params.get("budget"));
    } else if (goal && !params.has("saved")) {
      state.build = {};
    }
    if (params.has("saved") && !params.has("build")) {
      state.build = {};
      if (!params.has("budget")) state.budget = DEFAULT_BUDGET;
    }
    return params.get("saved");
  }

  async function loadSavedState(id) {
    if (!id || id.length > 100) throw new Error("Invalid saved build link");
    const saved = await api(`/api/builds/${encodeURIComponent(id)}`);
    if (BUILD_INFO[saved.goal]) state.activeGoal = saved.goal;
    state.budget = normalizeBudget(saved.budget);
    state.build = normalizeBuild(saved.parts);
  }

  async function init() {
    const savedId = applyUrlState();
    renderLoading();
    wireStaticEvents();
    renderMissionCards();
    renderGoalOptions();
    $("budget").value = String(state.budget);

    const [catalogResult, savedResult] = await Promise.allSettled([
      api("/api/components"),
      savedId ? loadSavedState(savedId) : Promise.resolve()
    ]);

    if (savedResult.status === "rejected" && !new URLSearchParams(window.location.search).has("build")) {
      showToast(savedResult.reason?.message || "Saved build could not be loaded");
    }

    if (savedResult.status === "fulfilled" && savedId) {
      renderMissionCards();
      renderGoalOptions();
      $("budget").value = String(state.budget);
    }

    if (catalogResult.status === "rejected") {
      const error = catalogResult.reason;
      $("parts").setAttribute("aria-busy", "false");
      $("parts").innerHTML = `<div class="empty-state"><div><strong>Catalog unavailable</strong><span>${escapeHtml(error.message)}</span><button class="button button-secondary retry-button" id="retryCatalogBtn" type="button">Try again</button></div></div>`;
      $("retryCatalogBtn").addEventListener("click", () => window.location.reload());
      showToast("Catalog could not be loaded");
      return;
    }

    const catalog = catalogResult.value;
    state.components = catalog.items || [];
    $("parts").setAttribute("aria-busy", "false");
    $("componentMetric").textContent = String(catalog.total || state.components.length);

    pruneInvalidSelection();
    persistState();
    renderAll();
    await analyze();

    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register(`/service-worker.js?v=${UI_VERSION}`).catch(() => {});
    }
  }

  function pruneInvalidSelection() {
    const valid = {};
    for (const category of CATEGORIES) {
      const part = byId(state.build[category]);
      if (part?.category === category) valid[category] = part.id;
    }
    state.build = valid;
  }

  function pruneMissionSelection(goal) {
    if (!state.components.length) {
      const removed = Object.keys(state.build).length;
      state.build = {};
      return removed;
    }
    let removed = 0;
    for (const category of CATEGORIES) {
      const part = selected(category);
      if (part && !matchesGoal(part, goal)) {
        delete state.build[category];
        removed += 1;
      }
    }
    return removed;
  }

  function wireStaticEvents() {
    $("goal").addEventListener("change", event => setGoal(event.target.value, false));
    const analyzeBudget = debounce(analyze, 220);
    $("budget").addEventListener("input", () => {
      state.budget = currentBudget();
      persistState();
      analyzeBudget();
    });
    $("budget").addEventListener("change", () => {
      state.budget = currentBudget();
      $("budget").value = String(state.budget);
      persistState();
    });
    $("sort").addEventListener("change", () => { state.page = 1; renderParts(); });
    $("compatibleOnly").addEventListener("change", () => { state.page = 1; renderParts(); });
    $("search").addEventListener("input", debounce(() => { state.page = 1; renderParts(); }, 120));
    $("autoBuildBtn").addEventListener("click", autoBuild);
    $("clearBtn").addEventListener("click", clearBuild);
    $("shareBtn").addEventListener("click", copyShareLink);
    $("saveBtn").addEventListener("click", saveBuild);
    $("exportBtn").addEventListener("click", exportBuild);
  }

  function renderMissionCards() {
    const missions = Object.entries(BUILD_INFO);
    $("presetGrid").innerHTML = missions.map(([id, mission], index) => `
      <button class="mission-card ${id === state.activeGoal ? "active" : ""}" type="button" data-mission="${id}" aria-pressed="${id === state.activeGoal}" style="--mission-image:url('${mission.image}')">
        <span class="mission-top"><span class="mission-index">${String(index + 1).padStart(2, "0")}</span><span class="mission-skill">${escapeHtml(mission.skill)}</span></span>
        <span><span class="mission-title">${escapeHtml(mission.title)}</span><span class="mission-description">${escapeHtml(mission.desc)}</span></span>
      </button>
    `).join("");

    $("presetGrid").querySelectorAll("[data-mission]").forEach(button => {
      button.addEventListener("click", () => setGoal(button.dataset.mission, true));
    });
  }

  function renderGoalOptions() {
    $("goal").innerHTML = Object.entries(BUILD_INFO).map(([id, mission]) => `<option value="${id}">${escapeHtml(mission.title)}</option>`).join("");
    $("goal").value = state.activeGoal;
  }

  function setGoal(goal, scroll) {
    if (!BUILD_INFO[goal]) return;
    const changed = goal !== state.activeGoal;
    state.activeGoal = goal;
    const removed = changed ? pruneMissionSelection(goal) : 0;
    state.analysis = null;
    state.page = 1;
    $("goal").value = goal;
    persistState();
    renderMissionCards();
    renderAll();
    analyze();
    if (removed) showToast(`${removed} incompatible ${removed === 1 ? "part was" : "parts were"} removed`);
    if (scroll) $("builder").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderAll() {
    renderTabs();
    renderParts();
    renderBuildList();
    renderProgress();
    updateMissionLabels();
    updateThreePreview();
    renderAnalysis(state.analysis);
  }

  function updateMissionLabels() {
    const mission = BUILD_INFO[state.activeGoal];
    $("toolbarMission").textContent = mission.title;
    $("heroMission").textContent = mission.title;
    $("previewTitle").textContent = mission.title;
    $("heroImage").src = mission.image;
    $("heroImage").alt = `${mission.title} FPV drone in flight`;
  }

  function renderProgress() {
    const completed = REQUIRED_CATEGORIES.filter(category => selected(category)).length;
    const percent = completed / REQUIRED_CATEGORIES.length * 100;
    $("progressText").textContent = `${completed} / ${REQUIRED_CATEGORIES.length}`;
    $("progressFill").style.width = `${percent}%`;
  }

  function renderTabs() {
    $("parts").setAttribute("aria-labelledby", `tab-${state.currentCategory}`);
    $("tabs").innerHTML = CATEGORIES.map(category => {
      const info = CATEGORY_INFO[category];
      const isDone = Boolean(selected(category));
      const active = category === state.currentCategory;
      return `<button class="tab ${active ? "active" : ""}" id="tab-${category}" type="button" role="tab" aria-selected="${active}" aria-controls="parts" tabindex="${active ? "0" : "-1"}" data-category="${category}">${isDone ? '<span class="tab-check">✓</span>' : ""}${escapeHtml(info.plural)}</button>`;
    }).join("");

    $("tabs").querySelectorAll("[data-category]").forEach(button => {
      button.addEventListener("click", () => {
        state.currentCategory = button.dataset.category;
        state.page = 1;
        $("search").value = "";
        renderTabs();
        renderParts();
      });
      button.addEventListener("keydown", event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const current = CATEGORIES.indexOf(button.dataset.category);
        const next = event.key === 'Home' ? 0
          : event.key === 'End' ? CATEGORIES.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + CATEGORIES.length) % CATEGORIES.length;
        state.currentCategory = CATEGORIES[next];
        state.page = 1;
        $("search").value = "";
        renderTabs();
        renderParts();
        $(`tab-${state.currentCategory}`)?.focus();
      });
    });

    const info = CATEGORY_INFO[state.currentCategory];
    $("catInfo").innerHTML = `<strong>${escapeHtml(info.label)}.</strong> ${escapeHtml(info.desc)}`;
  }

  function filteredParts() {
    const query = ($("search").value || "").trim().toLowerCase();
    const sort = $("sort").value;
    const parts = state.components.filter(part => {
      if (part.category !== state.currentCategory || !missionCompatible(part)) return false;
      const searchable = `${part.brand} ${part.name} ${(part.tags || []).join(" ")} ${JSON.stringify(part.specs || {})}`.toLowerCase();
      return !query || searchable.includes(query);
    });

    parts.sort((a, b) => {
      if (sort === "priceAsc") return effectivePrice(a) - effectivePrice(b);
      if (sort === "priceDesc") return effectivePrice(b) - effectivePrice(a);
      if (sort === "weightAsc") return Number(a.weight || 0) - Number(b.weight || 0);
      return recommendedScore(b) - recommendedScore(a);
    });
    return parts;
  }

  function specsChips(part) {
    const specs = part.specs || {};
    const values = [];
    if (part.category === "motor") values.push("4 required");
    if (part.weight) values.push(`${part.weight}g${part.category === "motor" ? " / set" : ""}`);
    if (specs.esc) values.push(`${specs.esc}A ESC`);
    if (specs.kv) values.push(`${specs.kv}KV`);
    if (specs.cells) values.push(String(specs.cells).toUpperCase());
    if (specs.capacity) values.push(`${specs.capacity}mAh`);
    if (specs.system) values.push(String(specs.system).toUpperCase());
    if (specs.res) values.push(specs.res);
    if (specs.protocol) values.push(specs.protocol);
    if (specs.propSize) values.push(`${specs.propSize}\" class`);
    return values.slice(0, 5).map(value => `<span class="chip">${escapeHtml(value)}</span>`).join("");
  }

  function renderParts() {
    if (!state.components.length) return;
    const parts = filteredParts();
    const pages = Math.max(1, Math.ceil(parts.length / state.perPage));
    state.page = Math.min(state.page, pages);
    const visible = parts.slice((state.page - 1) * state.perPage, state.page * state.perPage);
    const mission = BUILD_INFO[state.activeGoal];
    $("partsCount").textContent = `${parts.length} options for ${mission.title}`;

    if (!visible.length) {
      $("parts").innerHTML = '<div class="empty-state"><div><strong>No matching components</strong><span>Clear search or disable the mission-only filter.</span></div></div>';
    } else {
      $("parts").innerHTML = visible.map(part => {
        const isSelected = Number(state.build[part.category]) === Number(part.id);
        const quantity = purchaseQuantityFor(part);
        const priceLabel = part.category === "motor" ? `${money(effectivePrice(part))} / set` : quantity > 1 ? `${money(effectivePrice(part))} total` : money(part.price);
        const imageUrl = safeExternalUrl(part.imageUrl);
        const sourceUrl = safeExternalUrl(part.officialUrl || part.url);
        const sourceAction = sourceUrl === "#"
          ? '<span class="button button-secondary button-disabled" aria-disabled="true">No source</span>'
          : `<a class="button button-secondary" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Source ↗</a>`;
        return `
          <article class="part-card ${isSelected ? "selected" : ""}" aria-label="${escapeHtml(`${part.brand} ${part.name}`)}">
            <div class="part-media">
              <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(`${part.brand} ${part.name}`)}" loading="lazy" referrerpolicy="no-referrer" data-image-fallback>
              <div class="part-fallback"><div><strong>${escapeHtml(CATEGORY_INFO[part.category].label)}</strong><span>${escapeHtml(part.brand)}</span></div></div>
            </div>
            <div class="part-head">
              <div><div class="part-name">${escapeHtml(part.name)}</div><div class="part-brand">${escapeHtml(part.brand)}</div></div>
              <div class="part-price">${escapeHtml(priceLabel)}</div>
            </div>
            <div class="chips">${specsChips(part)}</div>
            <div class="part-actions">
              ${sourceAction}
              <button class="button ${isSelected ? "button-primary" : "button-secondary"}" type="button" data-select-part="${part.id}" aria-pressed="${isSelected}">${isSelected ? "Remove" : "Select"}</button>
            </div>
          </article>
        `;
      }).join("");
    }

    wireImageFallbacks($("parts"));
    $("parts").querySelectorAll("[data-select-part]").forEach(button => {
      button.addEventListener("click", () => pickPart(Number(button.dataset.selectPart)));
    });

    $("pagination").innerHTML = pages > 1
      ? `<button type="button" data-page="prev" ${state.page === 1 ? "disabled" : ""}>← Previous</button><span>Page ${state.page} of ${pages}</span><button type="button" data-page="next" ${state.page === pages ? "disabled" : ""}>Next →</button>`
      : "";

    $("pagination").querySelectorAll("[data-page]").forEach(button => {
      button.addEventListener("click", () => {
        state.page += button.dataset.page === "next" ? 1 : -1;
        renderParts();
      });
    });
  }

  function wireImageFallbacks(root) {
    root.querySelectorAll("[data-image-fallback]").forEach(image => {
      const markBroken = () => image.classList.add("is-broken");
      image.addEventListener("error", markBroken, { once: true });
      if (image.complete && image.naturalWidth === 0) markBroken();
    });
  }

  function pickPart(id) {
    const part = byId(id);
    if (!part) return;
    const isSelected = Number(state.build[part.category]) === Number(id);
    if (isSelected) delete state.build[part.category];
    else state.build[part.category] = id;
    state.analysis = null;
    persistState();
    renderAll();
    analyze();
    showToast(`${part.brand} ${part.name} ${isSelected ? "removed" : "added"}`);
  }

  async function autoBuild() {
    const button = $("autoBuildBtn");
    const original = button.innerHTML;
    const requestGoal = state.activeGoal;
    const requestBudget = currentBudget();
    const sequence = ++state.analyzeSequence;
    button.disabled = true;
    button.textContent = "Engineering build…";
    try {
      const result = await api("/api/autobuild", {
        method: "POST",
        body: JSON.stringify({ goal: requestGoal, budget: requestBudget })
      });
      if (sequence !== state.analyzeSequence || requestGoal !== state.activeGoal) return;
      state.build = result.build || {};
      state.analysis = result.analysis;
      state.budget = requestBudget;
      persistState();
      state.currentCategory = "frame";
      renderAll();
      showToast("Smart build generated");
      $("preview").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  }

  function clearBuild() {
    state.analyzeSequence += 1;
    state.build = {};
    state.analysis = null;
    persistState();
    renderAll();
    analyze();
    showToast("Build cleared");
  }

  async function analyze() {
    if (!state.components.length) return;
    const sequence = ++state.analyzeSequence;
    try {
      const analysis = await api("/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          goal: state.activeGoal,
          budget: currentBudget(),
          parts: state.build
        })
      });
      if (sequence !== state.analyzeSequence) return;
      state.analysis = analysis;
      renderAnalysis(analysis);
    } catch (error) {
      if (sequence === state.analyzeSequence) {
        $("statusText").textContent = "Analysis unavailable";
        $("issueCount").textContent = "Error";
        $("issues").innerHTML = `<div class="issue bad"><div class="issue-head"><span class="issue-dot"></span><div><strong>Build could not be analyzed</strong><p>${escapeHtml(error.message)}</p></div></div></div>`;
        showToast(error.message);
      }
    }
  }

  function renderAnalysis(analysis) {
    if (!analysis) {
      $("scoreValue").textContent = "—";
      $("scoreRing").style.setProperty("--score", 0);
      $("scoreRing").setAttribute("aria-label", "Compatibility analysis pending");
      $("statusText").textContent = "Analysis pending";
      $("heroScore").textContent = "—";
      $("heroPrice").textContent = selectedParts().length ? "Updating…" : money(0);
      $("metrics").innerHTML = '<div class="metric"><span>Build analysis</span><strong>Updating…</strong></div>';
      $("issueCount").textContent = "Pending";
      $("issues").innerHTML = '<div class="issue pending"><div class="issue-head"><span class="issue-dot"></span><div><strong>Checking this configuration</strong><p>Results will appear after the selected parts are analyzed.</p></div></div></div>';
      updateProfile();
      return;
    }

    const score = Number(analysis?.compatibilityScore || 0);
    $("scoreValue").textContent = String(score);
    $("scoreRing").style.setProperty("--score", score);
    $("scoreRing").setAttribute("aria-label", `Compatibility score ${score} out of 100`);
    $("statusText").textContent = analysis?.status || "Select parts to begin";
    $("heroScore").textContent = `${score}/100`;
    $("heroPrice").textContent = money(analysis?.totals?.price || 0);

    const totals = analysis?.totals || {};
    $("metrics").innerHTML = [
      ["Total parts cost", money(totals.price || 0)],
      ["Estimated all-up weight", totals.weight ? `${totals.weight} g` : "—"],
      ["Combined static thrust", totals.thrust ? `${totals.thrust} g` : "—"],
      ["Thrust-to-weight", totals.thrustToWeight ? `${totals.thrustToWeight}:1` : "—"],
      ["Estimated flight time", totals.estimatedFlightMinutes ? `${totals.estimatedFlightMinutes} min` : "—"]
    ].map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join("");

    const actionable = (analysis?.issues || []).filter(issue => issue.level !== "good");
    $("issueCount").textContent = `${actionable.length} ${actionable.length === 1 ? "issue" : "issues"}`;
    $("issues").innerHTML = actionable.length
      ? actionable.map(issue => `<div class="issue ${escapeHtml(issue.level)}"><div class="issue-head"><span class="issue-dot"></span><div><strong>${escapeHtml(issue.title)}</strong><p>${escapeHtml(issue.detail)}</p></div></div></div>`).join("")
      : '<div class="issue good"><div class="issue-head"><span class="issue-dot"></span><div><strong>No blocking issues found</strong><p>Verify manufacturer specifications before ordering and flying.</p></div></div></div>';
    updateProfile();
  }

  function renderBuildList() {
    $("buildList").innerHTML = CATEGORIES.map(category => {
      const info = CATEGORY_INFO[category];
      const part = selected(category);
      const fallback = escapeHtml(info.label.slice(0, 2).toUpperCase());
      return `
        <div class="build-item">
          <div class="build-thumb">${part ? `<img src="${escapeHtml(safeExternalUrl(part.imageUrl))}" alt="" referrerpolicy="no-referrer" data-image-fallback><span>${fallback}</span>` : `<span class="is-visible">${fallback}</span>`}</div>
          <div><b>${escapeHtml(info.label)}${category === "extras" ? " (optional)" : ""}</b><small>${part ? escapeHtml(`${part.brand} ${part.name}`) : "Not selected"}</small></div>
          <strong>${part ? money(effectivePrice(part)) : "—"}</strong>
          ${part ? `<button class="remove-part" type="button" data-remove-category="${category}" aria-label="Remove ${escapeHtml(info.label)}">×</button>` : ""}
        </div>
      `;
    }).join("");
    wireImageFallbacks($("buildList"));
    $("buildList").querySelectorAll("[data-remove-category]").forEach(button => {
      button.addEventListener("click", () => {
        const category = button.dataset.removeCategory;
        const part = selected(category);
        if (part) pickPart(part.id);
      });
    });
  }

  function updateProfile() {
    const mission = BUILD_INFO[state.activeGoal];
    const analysis = state.analysis;
    const completed = REQUIRED_CATEGORIES.filter(category => selected(category)).length;
    $("profile").innerHTML = `
      <p class="profile-copy">${escapeHtml(mission.desc)}</p>
      <div class="profile-grid">
        <div class="profile-stat"><span>Skill level</span><strong>${escapeHtml(mission.skill)}</strong></div>
        <div class="profile-stat"><span>Required parts</span><strong>${completed} / ${REQUIRED_CATEGORIES.length}</strong></div>
        <div class="profile-stat"><span>Compatibility</span><strong>${analysis ? `${analysis.compatibilityScore}/100` : "Pending"}</strong></div>
        <div class="profile-stat"><span>Flight estimate</span><strong>${analysis?.totals?.estimatedFlightMinutes ? `${analysis.totals.estimatedFlightMinutes} min` : "Pending"}</strong></div>
      </div>
      <div class="profile-list"><h4>Best suited for</h4>${mission.best.map(item => `<div>${escapeHtml(item)}</div>`).join("")}</div>
      <div class="profile-list"><h4>Why pilots choose it</h4>${mission.pros.map(item => `<div>${escapeHtml(item)}</div>`).join("")}</div>
    `;
  }

  function updateThreePreview() {
    const parts = selectedParts();
    window.selectedFpvParts = parts;
    window.activeGoal = state.activeGoal;
    if (typeof window.updateDronePreview === "function") {
      window.updateDronePreview(state.activeGoal, parts);
    }
  }

  async function copyShareLink() {
    const params = new URLSearchParams({ goal: state.activeGoal, budget: String(currentBudget()), build: JSON.stringify(state.build) });
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    showToast(await copyText(url) ? "Share link copied" : "Copy unavailable in this browser");
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      try {
        return document.execCommand("copy");
      } catch {
        return false;
      } finally {
        input.remove();
      }
    }
  }

  async function saveBuild() {
    if (!selectedParts().length) {
      showToast("Select components before saving");
      return;
    }
    const defaultName = `${BUILD_INFO[state.activeGoal].title} build`;
    const name = window.prompt("Build name", defaultName);
    if (!name) return;
    try {
      const saved = await api("/api/builds", {
        method: "POST",
        body: JSON.stringify({ name, goal: state.activeGoal, budget: currentBudget(), parts: state.build })
      });
      const params = new URLSearchParams({ saved: saved.id, goal: state.activeGoal, budget: String(currentBudget()), build: JSON.stringify(state.build) });
      const url = `${window.location.origin}/?${params}`;
      showToast(await copyText(url) ? "Build saved and link copied" : "Build saved; use Copy share link to share it");
    } catch (error) {
      showToast(error.message);
    }
  }

  function exportBuild() {
    const parts = selectedParts();
    if (!parts.length) {
      showToast("Select components before exporting");
      return;
    }

    const rows = [["Category", "Brand", "Component", "Packages to buy", "Items per package", "Package price (USD)", "Line total (USD)", "Catalog weight (g)", "Source"]];
    for (const category of CATEGORIES) {
      const part = selected(category);
      if (!part) continue;
      const packageQuantity = quantityFor(part);
      const itemsPerPackage = category === "motor" ? 4 : 1;
      rows.push([
        CATEGORY_INFO[category].label,
        part.brand,
        part.name,
        packageQuantity,
        itemsPerPackage,
        Number(part.price || 0).toFixed(2),
        effectivePrice(part).toFixed(2),
        Number(part.weight || 0),
        part.officialUrl || part.url || ""
      ]);
    }
    rows.push([]);
    rows.push(["Mission", BUILD_INFO[state.activeGoal].title]);
    rows.push(["Compatibility score", state.analysis?.compatibilityScore ?? ""]);
    rows.push(["Estimated total", state.analysis?.totals?.price ?? ""]);

    const csv = rows.map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `fpv-${state.activeGoal}-build.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
    showToast("Parts list exported");
  }

  function debounce(fn, wait) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  document.addEventListener("DOMContentLoaded", init);
})();
