#!/usr/bin/env node
/**
 * Semantic-release prepare: set version in root + all workspace package.json files.
 *
 * Why this script instead of @semantic-release/npm or "npm version":
 * - @semantic-release/npm only updates one pkgRoot; we publish multiple workspaces
 *   with one version (npm publish --workspaces), so we must set version in every
 *   package.json.
 * - "npm version --workspaces" triggers lockfile resolution that tries to fetch
 *   workspace packages (e.g. mod-arch-core@0.0.0-semantically-released) from the
 *   registry and fails with ETARGET.
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

const packagePaths = [
  "package.json",
  "mod-arch-core/package.json",
  "mod-arch-shared/package.json",
  "mod-arch-kubeflow/package.json",
  "mod-arch-installer/package.json",
];

for (const relPath of packagePaths) {
  const absPath = path.join(rootDir, relPath);
  const pkg = JSON.parse(fs.readFileSync(absPath, "utf8"));
  pkg.version = version;
  fs.writeFileSync(absPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("%s -> %s", relPath, version);
}
