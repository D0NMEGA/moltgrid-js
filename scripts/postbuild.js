// Post-build: rename CJS outputs from .js to .cjs and fix require paths
import { readdirSync, renameSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join } from "path";

const cjsDir = join(import.meta.dirname, "..", "dist", "cjs");
const distDir = join(import.meta.dirname, "..", "dist");

for (const file of readdirSync(cjsDir)) {
  if (!file.endsWith(".js")) continue;
  let content = readFileSync(join(cjsDir, file), "utf8");
  // Fix require("./foo.js") → require("./foo.cjs")
  content = content.replace(/require\("\.\/(\w+)\.js"\)/g, 'require("./$1.cjs")');
  const newName = file.replace(/\.js$/, ".cjs");
  writeFileSync(join(distDir, newName), content);
}

// Also create .d.cts for the index
const dts = readFileSync(join(distDir, "index.d.ts"), "utf8");
writeFileSync(join(distDir, "index.d.cts"), dts);

// Clean up temp cjs dir
rmSync(cjsDir, { recursive: true, force: true });
