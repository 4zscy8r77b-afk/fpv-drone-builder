import * as THREE from "/vendor/three.module.js?v=2.3.0";
import { OrbitControls } from "/assets/js/vendor/OrbitControls.js?v=2.3.0";

const container = document.getElementById("three-preview");
const previewBadge = document.querySelector(".preview-badge");

function showUnavailable(message = "Interactive 3D is unavailable in this browser.") {
  if (!container) return;
  container.classList.add("is-unavailable");
  container.replaceChildren();
  const fallback = document.createElement("div");
  fallback.className = "three-fallback";
  fallback.innerHTML = '<span aria-hidden="true">3D</span><strong>Preview unavailable</strong><p></p>';
  fallback.querySelector("p").textContent = `${message} The component list and compatibility analysis still work normally.`;
  container.appendChild(fallback);
  container.setAttribute("aria-label", "3D preview unavailable");
  if (previewBadge) previewBadge.textContent = "3D unavailable";
  window.updateDronePreview = () => {};
}

function createWebGLSurface() {
  if (!window.WebGL2RenderingContext) return null;
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      depth: true,
      failIfMajorPerformanceCaveat: true,
      powerPreference: "high-performance"
    });
    return context ? { canvas, context } : null;
  } catch {
    return null;
  }
}

const webglSurface = container ? createWebGLSurface() : null;

if (container && !webglSurface) {
  showUnavailable("WebGL 2 could not be started.");
} else if (container) {
  try {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070a0f, 0.032);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(6.4, 4.6, 7.8);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    canvas: webglSurface.canvas,
    context: webglSurface.context,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  container.replaceChildren(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.minDistance = 4.4;
  controls.maxDistance = 13;
  controls.maxPolarAngle = Math.PI * 0.72;
  controls.target.set(0, 0.3, 0);
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.55;

  scene.add(new THREE.HemisphereLight(0xd8efff, 0x111915, 2.35));
  const key = new THREE.DirectionalLight(0xffffff, 4.2);
  key.position.set(5, 10, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x72f3ca, 2.8);
  rim.position.set(-6, 3, -5);
  scene.add(rim);

  const warm = new THREE.PointLight(0xffb36b, 24, 16, 2);
  warm.position.set(3, 1.5, -2);
  scene.add(warm);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(8, 96),
    new THREE.MeshStandardMaterial({ color: 0x0c121a, roughness: 0.92, metalness: 0.05, transparent: true, opacity: 0.88 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.35;
  floor.receiveShadow = true;
  scene.add(floor);

  const floorRing = new THREE.Mesh(
    new THREE.RingGeometry(2.7, 2.73, 96),
    new THREE.MeshBasicMaterial({ color: 0x68e3b8, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
  );
  floorRing.rotation.x = -Math.PI / 2;
  floorRing.position.y = -1.32;
  scene.add(floorRing);

  const materials = {
    carbon: new THREE.MeshPhysicalMaterial({ color: 0x0c1117, metalness: 0.52, roughness: 0.38, clearcoat: 0.48, clearcoatRoughness: 0.32 }),
    carbonEdge: new THREE.MeshStandardMaterial({ color: 0x27333e, metalness: 0.72, roughness: 0.24 }),
    accent: new THREE.MeshStandardMaterial({ color: 0x62e5b8, metalness: 0.35, roughness: 0.3, emissive: 0x0c3829, emissiveIntensity: 0.3 }),
    motor: new THREE.MeshStandardMaterial({ color: 0x202a35, metalness: 0.92, roughness: 0.18 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb96d27, metalness: 0.8, roughness: 0.25 }),
    prop: new THREE.MeshPhysicalMaterial({ color: 0x9effdc, transparent: true, opacity: 0.7, roughness: 0.2, metalness: 0.02, side: THREE.DoubleSide, depthWrite: false }),
    lens: new THREE.MeshPhysicalMaterial({ color: 0x020609, metalness: 0.78, roughness: 0.06, clearcoat: 1 }),
    battery: new THREE.MeshStandardMaterial({ color: 0x1c2632, metalness: 0.25, roughness: 0.46 }),
    strap: new THREE.MeshStandardMaterial({ color: 0x0b0f14, roughness: 0.9 }),
    red: new THREE.MeshStandardMaterial({ color: 0xe85e68, metalness: 0.2, roughness: 0.42 }),
    duct: new THREE.MeshStandardMaterial({ color: 0x151e27, metalness: 0.25, roughness: 0.48 }),
    pcb: new THREE.MeshStandardMaterial({ color: 0x174c3b, metalness: 0.18, roughness: 0.52 }),
    silver: new THREE.MeshStandardMaterial({ color: 0x9aa9b7, metalness: 0.92, roughness: 0.19 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xf1b52d, metalness: 0.15, roughness: 0.42 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.96 })
  };

  let drone = null;
  let animatedProps = [];

  function box(width, height, depth, material, radius = 0) {
    const geometry = new THREE.BoxGeometry(width, height, depth, 2, 1, 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function plateShape(width, depth, cut = 0.22, waist = 0.12) {
    const shape = new THREE.Shape();
    const x = width / 2;
    const z = depth / 2;
    shape.moveTo(-x + cut, -z);
    shape.lineTo(x - cut, -z);
    shape.quadraticCurveTo(x, -z, x, -z + cut);
    shape.lineTo(x - waist, z - cut);
    shape.quadraticCurveTo(x - waist, z, x - waist - cut, z);
    shape.lineTo(-x + waist + cut, z);
    shape.quadraticCurveTo(-x + waist, z, -x + waist, z - cut);
    shape.lineTo(-x, -z + cut);
    shape.quadraticCurveTo(-x, -z, -x + cut, -z);
    return shape;
  }

  function carbonPlate(width, depth, thickness, material = materials.carbon) {
    const geometry = new THREE.ExtrudeGeometry(plateShape(width, depth), {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.025,
      bevelThickness: 0.018,
      curveSegments: 10
    });
    geometry.center();
    geometry.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function bolt(radius = 0.045, height = 0.035) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 16), materials.silver);
    mesh.castShadow = true;
    return mesh;
  }

  function armMesh(start, end, width, thickness) {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const length = a.distanceTo(b);
    const mesh = box(width, thickness, length, materials.carbon);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    return mesh;
  }

  function cylinderBetween(start, end, radius, material, segments = 20) {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const direction = b.clone().sub(a);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), segments), material);
    mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.castShadow = true;
    return mesh;
  }

  function makeMotor(scale) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.235 * scale, 0.235 * scale, 0.055 * scale, 32), materials.carbonEdge);
    base.position.y = 0.025 * scale;
    base.castShadow = true;
    group.add(base);
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.185 * scale, 0.215 * scale, 0.27 * scale, 40), materials.motor);
    bell.castShadow = true;
    bell.position.y = 0.12 * scale;
    group.add(bell);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * scale, 0.14 * scale, 0.055 * scale, 28), materials.accent);
    cap.position.y = 0.29 * scale;
    group.add(cap);
    const copper = new THREE.Mesh(new THREE.TorusGeometry(0.145 * scale, 0.025 * scale, 10, 32), materials.copper);
    copper.rotation.x = Math.PI / 2;
    copper.position.y = 0.13 * scale;
    group.add(copper);
    for (let index = 0; index < 6; index += 1) {
      const vent = box(0.025 * scale, 0.13 * scale, 0.055 * scale, materials.carbon);
      vent.position.set(Math.cos(index * Math.PI / 3) * 0.19 * scale, 0.15 * scale, Math.sin(index * Math.PI / 3) * 0.19 * scale);
      vent.rotation.y = -index * Math.PI / 3;
      group.add(vent);
    }
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.027 * scale, 0.027 * scale, 0.15 * scale, 16), materials.silver);
    shaft.position.y = 0.37 * scale;
    group.add(shaft);
    return group;
  }

  function makeProp(radius, clockwise) {
    const group = new THREE.Group();
    for (let index = 0; index < 3; index += 1) {
      const shape = new THREE.Shape();
      shape.moveTo(radius * 0.08, -radius * 0.045);
      shape.bezierCurveTo(radius * 0.28, -radius * 0.1, radius * 0.72, -radius * 0.12, radius * 0.92, -radius * 0.025);
      shape.bezierCurveTo(radius * 0.73, radius * 0.09, radius * 0.28, radius * 0.075, radius * 0.08, radius * 0.035);
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.018, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.006, bevelSegments: 1, curveSegments: 12 });
      geometry.rotateX(-Math.PI / 2);
      const blade = new THREE.Mesh(geometry, materials.prop);
      blade.rotation.x = clockwise ? 0.08 : -0.08;
      blade.rotation.y = clockwise ? 0.09 : -0.09;
      const pivot = new THREE.Group();
      pivot.rotation.y = index * Math.PI * 2 / 3;
      pivot.add(blade);
      group.add(pivot);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.095, radius * 0.11, 0.075, 24), materials.motor);
    group.add(hub);
    group.userData.spinDirection = clockwise ? 1 : -1;
    animatedProps.push(group);
    return group;
  }

  function configuration(goal, parts) {
    const frame = parts.find(part => part.category === "frame");
    const battery = parts.find(part => part.category === "battery");
    const vtx = parts.find(part => part.category === "vtx");
    const extras = parts.filter(part => part.category === "extras");
    const sizeValue = frame?.specs?.size ?? ({ tinywhoop: "whoop", toothpick: "3", freestyle35: "3.5", freestyle5: "5", racing5: "5", cinewhoop: "3.5", cinematic: "5", longrange: "7", heavylift: "10" }[goal] || "3.5");
    const numericSize = sizeValue === "whoop" ? 1.7 : Number(sizeValue) || 3.5;
    const normalized = THREE.MathUtils.clamp(numericSize / 5, 0.45, 1.55);
    const capacity = Number(battery?.specs?.capacity || 850);
    return {
      sizeValue,
      body: THREE.MathUtils.lerp(0.82, 1.42, normalized / 1.55),
      arm: THREE.MathUtils.lerp(1.18, 2.35, normalized / 1.55),
      prop: THREE.MathUtils.lerp(0.47, 1.03, normalized / 1.55),
      motor: THREE.MathUtils.lerp(0.72, 1.25, normalized / 1.55),
      battery: THREE.MathUtils.clamp(0.72 + capacity / 4200, 0.76, 1.48),
      ducts: sizeValue === "whoop" || goal === "cinewhoop",
      long: goal === "longrange" || numericSize >= 7,
      payload: goal === "cinematic" || goal === "heavylift" || extras.some(part => /gopro|camera|payload/i.test(`${part.name} ${(part.tags || []).join(" ")}`)),
      digital: Boolean(vtx && !/analog/i.test(vtx.specs?.system || vtx.name)),
      heavy: goal === "heavylift"
    };
  }

  function buildDrone(goal = "freestyle35", parts = []) {
    if (drone) {
      scene.remove(drone);
      drone.traverse(object => {
        if (object.geometry) object.geometry.dispose();
      });
    }
    animatedProps = [];
    drone = new THREE.Group();
    const config = configuration(goal, parts);

    const armPositions = [
      [config.arm, 0, config.arm * 0.8],
      [-config.arm, 0, config.arm * 0.8],
      [config.arm, 0, -config.arm * (config.long ? 1.05 : 0.8)],
      [-config.arm, 0, -config.arm * (config.long ? 1.05 : 0.8)]
    ];

    for (const [x, y, z] of armPositions) {
      const start = [Math.sign(x) * config.body * 0.22, 0, Math.sign(z) * config.body * 0.2];
      drone.add(armMesh(start, [x, y, z], config.heavy ? 0.28 : 0.2, config.heavy ? 0.105 : 0.075));
    }

    const lower = carbonPlate(config.body * 1.5, config.body * 1.16, 0.09);
    lower.position.y = 0.02;
    drone.add(lower);
    const upper = carbonPlate(config.body * 1.28, config.body * 0.94, 0.075, materials.carbonEdge);
    upper.position.y = 0.48;
    drone.add(upper);

    const standoffPoints = [
      [-config.body * 0.48, -config.body * 0.32],
      [config.body * 0.48, -config.body * 0.32],
      [-config.body * 0.42, config.body * 0.31],
      [config.body * 0.42, config.body * 0.31]
    ];
    standoffPoints.forEach(([x, z]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.44, 16), materials.accent);
      post.position.set(x, 0.25, z);
      post.castShadow = true;
      drone.add(post);
      const topBolt = bolt();
      topBolt.position.set(x, 0.54, z);
      drone.add(topBolt);
    });

    const stack = new THREE.Group();
    const boards = [0.15, 0.28, 0.4];
    boards.forEach((height, index) => {
      const board = box(config.body * 0.72, 0.045, config.body * 0.67, index === 1 ? materials.pcb : materials.carbonEdge);
      board.position.y = height;
      stack.add(board);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
        const pad = bolt(0.025, 0.018);
        pad.position.set(sx * config.body * 0.28, height + 0.03, sz * config.body * 0.25);
        stack.add(pad);
      });
    });
    drone.add(stack);

    const batteryGroup = new THREE.Group();
    const batteryPack = box(config.body * 0.98 * config.battery, 0.31 * config.battery, config.body * 0.55 * config.battery, materials.battery);
    batteryPack.position.y = 0.72 + 0.05 * config.battery;
    batteryGroup.add(batteryPack);
    const batteryLabel = box(config.body * 0.55 * config.battery, 0.012, config.body * 0.27 * config.battery, materials.yellow);
    batteryLabel.position.y = 0.17 * config.battery;
    batteryGroup.add(batteryLabel);
    const strap = box(config.body * 1.08 * config.battery, 0.045, 0.14, materials.strap);
    strap.position.y = 0.9 + 0.08 * config.battery;
    batteryGroup.add(strap);
    batteryGroup.position.z = -config.body * 0.12;
    drone.add(batteryGroup);

    const powerLead = new THREE.CatmullRomCurve3([
      new THREE.Vector3(config.body * 0.35, 0.42, -config.body * 0.28),
      new THREE.Vector3(config.body * 0.62, 0.64, -config.body * 0.46),
      new THREE.Vector3(config.body * 0.78, 0.75, -config.body * 0.25)
    ]);
    const leadMesh = new THREE.Mesh(new THREE.TubeGeometry(powerLead, 20, 0.025, 8, false), materials.red);
    leadMesh.castShadow = true;
    drone.add(leadMesh);
    const connector = box(0.18, 0.12, 0.24, materials.yellow);
    connector.position.set(config.body * 0.8, 0.75, -config.body * 0.2);
    connector.rotation.z = -0.28;
    drone.add(connector);

    const camera = new THREE.Group();
    const cameraBody = box(config.digital ? 0.62 : 0.48, config.digital ? 0.42 : 0.34, 0.4, materials.carbonEdge);
    camera.add(cameraBody);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 32), materials.lens);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.25;
    camera.add(lens);
    const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.018, 10, 32), materials.silver);
    lensRing.position.z = 0.315;
    camera.add(lensRing);
    const cameraGuardLeft = box(0.07, 0.5, 0.48, materials.carbon);
    cameraGuardLeft.position.x = -0.36;
    camera.add(cameraGuardLeft);
    const cameraGuardRight = cameraGuardLeft.clone();
    cameraGuardRight.position.x = 0.36;
    camera.add(cameraGuardRight);
    camera.position.set(0, 0.29, config.body * 0.66);
    camera.rotation.x = -0.12;
    drone.add(camera);

    if (config.payload) {
      const mount = box(0.72, 0.12, 0.55, materials.accent);
      mount.position.set(0, 0.86, config.body * 0.3);
      drone.add(mount);
      const actionCamera = box(0.82, 0.58, 0.48, materials.carbonEdge);
      actionCamera.position.set(0, 1.18, config.body * 0.31);
      actionCamera.rotation.x = -0.12;
      drone.add(actionCamera);
      const actionLens = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.11, 32), materials.lens);
      actionLens.rotation.x = Math.PI / 2;
      actionLens.position.set(0.2, 1.2, config.body * 0.58);
      drone.add(actionLens);
    }

    armPositions.forEach(([x, y, z], index) => {
      const motor = makeMotor(config.motor);
      motor.position.set(x, 0.06, z);
      drone.add(motor);
      const prop = makeProp(config.prop, index % 2 === 0);
      prop.position.set(x, 0.39 * config.motor, z);
      drone.add(prop);

      const motorPad = new THREE.Mesh(new THREE.CylinderGeometry(config.motor * 0.29, config.motor * 0.29, 0.065, 32), materials.carbon);
      motorPad.position.set(x, 0.015, z);
      motorPad.castShadow = true;
      drone.add(motorPad);

      const wireEnd = new THREE.Vector3(x - Math.sign(x) * 0.26, 0.085, z - Math.sign(z) * 0.2);
      [-0.026, 0, 0.026].forEach((offset, wireIndex) => {
        const wireStart = new THREE.Vector3(Math.sign(x) * config.body * 0.28 + offset, 0.09, Math.sign(z) * config.body * 0.24);
        const wireCurve = new THREE.LineCurve3(wireStart, wireEnd.clone().add(new THREE.Vector3(offset * 2, wireIndex * 0.008, 0)));
        const wireMaterial = wireIndex === 0 ? materials.red : wireIndex === 1 ? materials.yellow : materials.rubber;
        drone.add(new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 8, 0.009, 6, false), wireMaterial));
      });

      if (config.ducts) {
        const duct = new THREE.Mesh(new THREE.TorusGeometry(config.prop * 1.04, 0.075, 16, 72), materials.duct);
        duct.rotation.x = Math.PI / 2;
        duct.position.set(x, 0.29, z);
        duct.castShadow = true;
        drone.add(duct);
      }
    });

    const antennaStart = [config.body * 0.28, 0.55, -config.body * 0.53];
    const antennaEnd = [config.body * 0.72, config.long ? 1.65 : 1.2, -config.body * (config.long ? 1.32 : 0.94)];
    drone.add(cylinderBetween(antennaStart, antennaEnd, 0.018, materials.red, 12));
    if (config.long || config.heavy) {
      drone.add(cylinderBetween([-antennaStart[0], antennaStart[1], antennaStart[2]], [-antennaEnd[0], antennaEnd[1], antennaEnd[2]], 0.018, materials.red, 12));
    }

    drone.rotation.x = -0.12;
    drone.rotation.z = -0.025;
    drone.position.y = -0.1;
    scene.add(drone);

    const overallScale = config.heavy ? 0.72 : config.long ? 0.82 : config.sizeValue === "whoop" ? 1.36 : 1;
    drone.scale.setScalar(overallScale);
    controls.target.set(0, 0.22, 0);
    controls.update();
  }

  window.updateDronePreview = (goal, parts = []) => {
    try {
      buildDrone(goal, parts);
    } catch {
      showUnavailable("The 3D scene could not be updated.");
    }
  };
  buildDrone(window.activeGoal || "freestyle35", window.selectedFpvParts || []);

  const clock = new THREE.Clock();
  let animationFrame = null;
  let previewIsVisible = true;

  function animate() {
    animationFrame = null;
    const delta = Math.min(clock.getDelta(), 0.05);
    if (!reduceMotion) {
      animatedProps.forEach(prop => {
        prop.rotation.y += delta * 5.5 * prop.userData.spinDirection;
      });
    }
    controls.update();
    try {
      renderer.render(scene, camera);
    } catch {
      showUnavailable("The 3D renderer stopped unexpectedly.");
      return;
    }
    syncAnimation();
  }

  function syncAnimation() {
    const shouldRun = previewIsVisible && !document.hidden && !container.classList.contains("is-unavailable");
    if (shouldRun && animationFrame === null) {
      clock.getDelta();
      animationFrame = requestAnimationFrame(animate);
    } else if (!shouldRun && animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(entries => {
      previewIsVisible = Boolean(entries[0]?.isIntersecting);
      syncAnimation();
    }, { rootMargin: "160px" });
    visibilityObserver.observe(container);
  }
  document.addEventListener("visibilitychange", syncAnimation);
  renderer.domElement.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    showUnavailable("The WebGL context was lost.");
  }, { once: true });
  syncAnimation();

  function resizePreview(width = container.clientWidth, height = container.clientHeight) {
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) resizePreview(entry.contentRect.width, entry.contentRect.height);
    });
    resizeObserver.observe(container);
  } else {
    window.addEventListener("resize", () => resizePreview(), { passive: true });
  }
  } catch {
    showUnavailable("The 3D renderer could not be initialized.");
  }
}
