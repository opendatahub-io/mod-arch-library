#!/usr/bin/env node
/**
 * Semantic-release prepare: set version in root + all workspace package.json files.
 *
 * Why this script instead of @semantic-release/npm or "npm version":
 * - @semantic-release/npm only updates one pkgRoot; we publish multiple workspaces
 *   with one version (npm publish --workspaces), so we must set version in every
 *   package.json.
 * - "npm version --workspaces" can trigger resolution that fetches the placeholder
 *   version from the registry and errors with ETARGET.
 *
 * Usage: node scripts/release-set-version.mjs <version>
 * Example: node scripts/release-set-version.mjs 1.10.0
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(-.+)?$/.test(version)) {
  console.error("Usage: node scripts/release-set-version.mjs <version>");
  process.exit(1);
}

const rootPkgPath = path.join(rootDir, "package.json");
if (!fs.existsSync(rootPkgPath)) {
  console.error("Root package.json not found: %s", rootPkgPath);
  process.exit(1);
}
let rootPkg;
try {
  rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
} catch (err) {
  console.error("Invalid root package.json: %s", err.message);
  process.exit(1);
}
const workspaces = rootPkg.workspaces;
if (!Array.isArray(workspaces) || workspaces.length === 0) {
  console.error("Root package.json must have a non-empty \"workspaces\" array");
  process.exit(1);
}

const packagePaths = [
  "package.json",
  ...workspaces.map((w) => path.join(w, "package.json")),
];

const validated = [];
for (const relPath of packagePaths) {
  const absPath = path.resolve(rootDir, relPath);
  if (!fs.existsSync(absPath)) {
    console.error("Missing package.json: %s", absPath);
    process.exit(1);
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(absPath, "utf8"));
  } catch (err) {
    console.error("Invalid JSON in %s: %s", absPath, err.message);
    process.exit(1);
  }
  validated.push({ absPath, relPath, pkg });
}

for (const { absPath, relPath, pkg } of validated) {
  pkg.version = version;
  fs.writeFileSync(absPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("%s -> %s", relPath, version);
}
