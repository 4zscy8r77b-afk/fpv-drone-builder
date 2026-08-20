const test = require("node:test");
const assert = require("node:assert/strict");
const { before, after } = require("node:test");
const { app } = require("../server/index");

let server;
let baseUrl;

before(async () => {
  server = await new Promise(resolve => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

async function request(path, options) {
  return fetch(`${baseUrl}${path}`, options);
}

test("health reports the package version without caching", async () => {
  const response = await request("/api/health");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const body = await response.json();
  assert.equal(body.version, "2.1.0");
  assert.equal(body.components, 131);
});

test("HTML and the service worker are served with revalidation", async () => {
  const page = await request("/");
  const worker = await request("/service-worker.js");
  assert.equal(page.status, 200);
  assert.equal(worker.status, 200);
  assert.match(page.headers.get("cache-control"), /no-cache/);
  assert.match(worker.headers.get("cache-control"), /no-cache/);
});

test("unknown routes return real 404 responses", async () => {
  const missingAsset = await request("/missing-file.js");
  const missingApi = await request("/api/not-found");
  assert.equal(missingAsset.status, 404);
  assert.match(missingAsset.headers.get("content-type"), /text\/plain/);
  assert.equal(missingApi.status, 404);
  assert.deepEqual(await missingApi.json(), { error: "API endpoint not found" });
});

test("malformed JSON is a client error", async () => {
  const response = await request("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad json"
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid JSON body" });
});

test("unknown missions and categories are rejected", async () => {
  const build = await request("/api/autobuild", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal: "not-a-mission", budget: 650 })
  });
  const catalog = await request("/api/components?category=unknown");
  assert.equal(build.status, 400);
  assert.equal(catalog.status, 400);
});

test("catalog goal filters include approved fallback components", async () => {
  const response = await request("/api/components?category=stack&goal=cinewhoop");
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.total > 0);
  assert.ok(body.items.every(part => part.category === "stack"));
});

test("component ids must match their payload category", async () => {
  const response = await request("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal: "freestyle35", parts: { frame: 32 } })
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Component 32 belongs to motor, not frame" });
});

test("unknown part keys are rejected instead of double-counting", async () => {
  const response = await request("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal: "freestyle35", parts: { frame: 7, duplicateFrame: 7 } })
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "Invalid request");
});
