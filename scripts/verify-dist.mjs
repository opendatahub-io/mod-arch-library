#!/usr/bin/env node
/**
 * Pre-publish verification: checks that dist/ output is clean before publishing.
 *
 * Catches two classes of problems:
 *  1. Unresolved ~/xxx path aliases that tsc-alias failed to convert
 *  2. Test/config files that leaked into dist/ (should be excluded by tsconfig.build.json)
 *
 * Usage: node scripts/verify-dist.mjs
 * Exit code 0 = clean, 1 = problems found
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const rootPkg = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
);
const workspaces = rootPkg.workspaces;

// Regex matching unresolved ~/ imports:
//   import ... from '~/...'
//   import '~/...'
//   require('~/...')
//   export ... from '~/...'
const unresolvedAliasRe = /(?:from\s+|import\s+|require\(\s*|export\s+.*from\s+)['"]~\//;

// Files/dirs that should NOT exist inside dist/
const forbiddenInDist = ["__tests__", "jest.config.js", "jest.config.d.ts"];

let hasErrors = false;

function error(msg) {
  console.error(`  ERROR: ${msg}`);
  hasErrors = true;
}

function walkFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

for (const ws of workspaces) {
  const distDir = path.join(rootDir, ws, "dist");
  if (!fs.existsSync(distDir)) {
    console.log(`[${ws}] dist/ not found — skipping`);
    continue;
  }

  console.log(`[${ws}] Checking dist/...`);

  // Check 1: unresolved ~/ aliases in .js and .d.ts files
  const sourceFiles = walkFiles(distDir, [".js", ".d.ts"]);
  for (const filePath of sourceFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (unresolvedAliasRe.test(lines[i])) {
        const relPath = path.relative(rootDir, filePath);
        error(`${relPath}:${i + 1} — unresolved ~/ alias: ${lines[i].trim()}`);
      }
    }
  }

  // Check 2: forbidden files/dirs in dist/
  for (const forbidden of forbiddenInDist) {
    const check = path.join(distDir, forbidden);
    if (fs.existsSync(check)) {
      const relPath = path.relative(rootDir, check);
      error(`${relPath} — test/config file leaked into dist/`);
    }
    // Also check recursively for __tests__ dirs
    if (forbidden === "__tests__") {
      for (const filePath of sourceFiles) {
        if (filePath.includes(`${path.sep}__tests__${path.sep}`)) {
          const relPath = path.relative(rootDir, filePath);
          error(`${relPath} — test file leaked into dist/`);
          break; // one error per workspace is enough
        }
      }
    }
  }
}

if (hasErrors) {
  console.error("\nDist verification FAILED — fix the issues above before publishing.");
  process.exit(1);
} else {
  console.log("\nDist verification passed.");
}
