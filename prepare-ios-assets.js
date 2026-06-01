const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "www");
const files = [
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "sw.js",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

function copyFile(relativePath) {
  const source = path.join(root, relativePath);
  const target = path.join(outDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  copyFile(file);
}

console.log(`iOS web assets prepared at ${outDir}`);
