
// image-fetcher.js
// Run: npm install axios cheerio sharp fs-extra
// Then: node image-fetcher.js
//
// This script downloads product images automatically
// into /assets/products and updates components.json

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const components = require("./components.json");

const outDir = path.join(__dirname, "assets/products");

async function ensureDir() {
  await fs.ensureDir(outDir);
}

async function download(url, file) {
  const res = await axios({
    method: "GET",
    url,
    responseType: "arraybuffer",
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  await fs.writeFile(file, res.data);
}

async function findImage(productUrl) {
  const html = await axios.get(productUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const $ = cheerio.load(html.data);

  const og =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content");

  return og;
}

async function run() {
  await ensureDir();

  for (const part of components) {
    try {
      console.log("Fetching:", part.name);

      const image = await findImage(part.officialUrl);

      if (!image) {
        console.log("No image found");
        continue;
      }

      const filename =
        part.imageUrl.split("/").pop();

      const filepath =
        path.join(outDir, filename);

      await download(image, filepath);

      console.log("Saved:", filename);
    } catch (e) {
      console.log("Failed:", part.name);
    }
  }

  console.log("Done.");
}

run();
