const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

class JsonBuildStore {
  constructor(filePath) {
    this.filePath = filePath;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]\n");
  }

  readAll() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  writeAll(builds) {
    const temp = `${this.filePath}.tmp`;
    fs.writeFileSync(temp, `${JSON.stringify(builds, null, 2)}\n`);
    fs.renameSync(temp, this.filePath);
  }

  list(limit = 30) {
    return this.readAll().slice(0, limit);
  }

  get(id) {
    return this.readAll().find(build => build.id === id) || null;
  }

  create(payload) {
    const builds = this.readAll();
    const build = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    builds.unshift(build);
    this.writeAll(builds.slice(0, 500));
    return build;
  }
}

module.exports = { JsonBuildStore };
