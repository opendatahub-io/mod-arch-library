#!/usr/bin/env node
/**
 * Test runner for mod-arch-installer flavor overlays.
 *
 * This script runs tests on the overlay files in the specified flavor directory.
 * It creates a temporary merged project by combining the base templates with
 * flavor-specific overrides, then runs Jest tests on the result.
 *
 * Usage:
 *   node scripts/test-flavor.mjs [flavor]
 *
 * Arguments:
 *   flavor - The flavor to test (default: 'default')
 *
 * Examples:
 *   node scripts/test-flavor.mjs           # Tests the default flavor
 *   node scripts/test-flavor.mjs kubeflow  # Tests the kubeflow flavor
 */

import { cp, mkdir, rm, readdir, stat, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

/**
 * Resolve the pinned pnpm spec (e.g. "pnpm@11.22.0") from the nearest package.json's
 * `packageManager` field, falling back to the version the templates pin.
 * @param {string} cwd - Directory whose package.json declares the pinned pnpm version
 * @returns {string}
 */
function pinnedPnpmSpec(cwd) {
  try {
    const pkg = JSON.parse(readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    if (typeof pkg.packageManager === 'string' && pkg.packageManager.startsWith('pnpm@')) {
      return pkg.packageManager;
    }
  } catch {
    // fall through to the default spec
  }
  return 'pnpm@11.22.0';
}

/**
 * Run pnpm via `npx`, which ships with npm and is therefore available in every environment
 * that has Node (unlike Corepack or a global pnpm — the required Prow unit-tests image has
 * neither, so `corepack`/`pnpm` fail with exit 127). npx runs the exact pinned version.
 * @param {string[]} args - Arguments to pass to pnpm
 * @param {string} cwd - Working directory
 * @returns {import('node:child_process').ChildProcess}
 */
function spawnPnpm(args, cwd) {
  return spawn('npx', ['--yes', pinnedPnpmSpec(cwd), ...args], {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, COREPACK_ENABLE_DOWNLOAD_PROMPT: '0' },
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const installerRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(installerRoot, '..');
const flavorsRoot = path.join(installerRoot, 'flavors');
const templatesRoot = path.join(installerRoot, 'templates', 'mod-arch-starter');
const testWorkDir = path.join(installerRoot, '.test-workdir');

const flavorArg = process.argv[2] || 'default';

/**
 * Recursively copies files from source to destination.
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
async function copyRecursive(src, dest) {
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await mkdir(destPath, { recursive: true });
      await copyRecursive(srcPath, destPath);
    } else {
      await cp(srcPath, destPath, { force: true });
    }
  }
}

/**
 * Applies flavor overlays on top of the base template.
 * @param {string} flavorPath - Path to the flavor directory
 * @param {string} workDir - Working directory for the merged project
 */
async function applyFlavorOverlays(flavorPath, workDir) {
  const entries = await readdir(flavorPath, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(flavorPath, entry.name);
    const destPath = path.join(workDir, entry.name);

    if (entry.isDirectory()) {
      await mkdir(destPath, { recursive: true });
      await copyRecursive(srcPath, destPath);
    } else {
      await cp(srcPath, destPath, { force: true });
    }
  }
}

/**
 * Mirrors the installer's removeDefaultFolders() for the default flavor so the merged
 * workdir matches the real installer output. Removes the base ESLint 9 flat config the
 * overlay supersedes (.eslintrc.js) and the standalone/shared sources that are dropped
 * for federated modules (and depend on mod-arch-shared, which the default overlay no
 * longer lists as a dependency). Base and default both use rspack, so the rspack.*.js
 * overlay files simply overwrite the base ones - no config cleanup needed there.
 * @param {string} frontendDir - The merged frontend directory
 */
async function removeDefaultBaseConfigs(frontendDir) {
  const leftovers = [
    path.join(frontendDir, 'eslint.config.mjs'),
    path.join(frontendDir, 'src', 'shared'),
    path.join(frontendDir, 'src', 'app', 'standalone'),
    path.join(frontendDir, 'src', 'app', 'pages', 'SettingsMainPage.tsx'),
  ];
  for (const file of leftovers) {
    await rm(file, { recursive: true, force: true });
  }
}

/**
 * Reproduce the shipped federated (default) layout for install. The installer removes
 * frontend/pnpm-workspace.yaml from a default module (it joins the odh-dashboard workspace,
 * so a per-module workspace file would nest), which means a standalone frontend install would
 * fail with ERR_PNPM_IGNORED_BUILDS. To validate exactly what ships, remove that file and
 * recreate the host workspace: a minimal root carrying the same pnpm settings
 * (allowBuilds/overrides/hoisting) with the frontend as its only member. Returns the directory
 * pnpm install should run from.
 * @param {string} workDir - The merged work directory (parent of frontend)
 * @returns {Promise<string>} Directory to run install from
 */
async function mirrorFederatedWorkspaceRoot(workDir) {
  const frontendDir = path.join(workDir, 'frontend');
  const frontendWorkspaceFile = path.join(frontendDir, 'pnpm-workspace.yaml');
  // Carry the base starter's pnpm settings up to the synthetic root, pointing at the frontend
  // member instead of '.', then drop the per-module file so the frontend matches shipped output.
  const baseWorkspace = await readFile(frontendWorkspaceFile, 'utf8');
  await rm(frontendWorkspaceFile, { force: true });
  const rootWorkspace = baseWorkspace.replace(/-\s*'\.'/, "- 'frontend'");
  await writeFile(path.join(workDir, 'pnpm-workspace.yaml'), rootWorkspace);
  // pnpm needs a root package.json; carry packageManager so the pinned pnpm version is used.
  const frontendPkg = JSON.parse(await readFile(path.join(frontendDir, 'package.json'), 'utf8'));
  const rootPkg = {
    name: 'harness-workspace-root',
    version: '0.0.0',
    private: true,
    ...(frontendPkg.packageManager ? { packageManager: frontendPkg.packageManager } : {}),
  };
  await writeFile(path.join(workDir, 'package.json'), `${JSON.stringify(rootPkg, null, 2)}\n`);
  return workDir;
}

/**
 * Runs pnpm install in the specified directory.
 * @param {string} dir - Directory to run pnpm install in
 * @returns {Promise<void>}
 */
function runInstall(dir) {
  return new Promise((resolve, reject) => {
    console.log(`[test-flavor] Installing dependencies in ${dir}...`);
    const proc = spawnPnpm(['install'], dir);

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pnpm install failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * Runs Jest tests in the specified directory.
 * @param {string} dir - Directory to run tests in
 * @param {string[]} extraArgs - Additional arguments to pass to Jest
 * @returns {Promise<number>}
 */
function runLint(dir, extraArgs = []) {
  return new Promise((resolve, reject) => {
    console.log(`[test-flavor] Running lint in ${dir}...`);
    // Only run test:lint, skip type-check and unit tests since they require external dependencies
    const args = ['run', 'test:lint', ...extraArgs];
    const proc = spawnPnpm(args, dir);

    proc.on('close', (code) => {
      resolve(code);
    });

    proc.on('error', reject);
  });
}

/**
 * Main function to test a flavor.
 */
async function testFlavor() {
  const flavorPath = path.join(flavorsRoot, flavorArg);

  // Validate flavor exists
  try {
    const flavorStat = await stat(flavorPath);
    if (!flavorStat.isDirectory()) {
      throw new Error(`Flavor '${flavorArg}' is not a directory.`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`[test-flavor] Flavor '${flavorArg}' not found in ${flavorsRoot}`);
      const availableFlavors = await readdir(flavorsRoot);
      console.error(`[test-flavor] Available flavors: ${availableFlavors.join(', ')}`);
      process.exit(1);
    }
    throw error;
  }

  // Validate templates exist
  try {
    await stat(templatesRoot);
  } catch (error) {
    console.error('[test-flavor] Templates not found. Run "npm run sync-templates" first.');
    process.exit(1);
  }

  console.log(`[test-flavor] Testing flavor: ${flavorArg}`);
  console.log(`[test-flavor] Creating temporary work directory...`);

  // Clean and create work directory
  await rm(testWorkDir, { recursive: true, force: true });
  await mkdir(testWorkDir, { recursive: true });

  try {
    // Copy base templates
    console.log('[test-flavor] Copying base templates...');
    await copyRecursive(templatesRoot, testWorkDir);

    // Apply flavor overlays
    console.log('[test-flavor] Applying flavor overlays...');
    await applyFlavorOverlays(flavorPath, testWorkDir);

    const frontendDir = path.join(testWorkDir, 'frontend');

    // For the default flavor, remove base starter build/lint configs that the overlay
    // replaces (webpack -> rspack, ESLint 9 flat -> ESLint 8 legacy). This mirrors the
    // installer's removeDefaultFolders() so the harness validates exactly what ships.
    // The default flavor also ships without frontend/pnpm-workspace.yaml, so reproduce the
    // odh-dashboard host workspace (settings at a synthetic root) and install from there.
    // The kubeflow/base flavor keeps its per-frontend pnpm-workspace.yaml and installs in place.
    let installDir = frontendDir;
    if (flavorArg === 'default') {
      await removeDefaultBaseConfigs(frontendDir);
      installDir = await mirrorFederatedWorkspaceRoot(testWorkDir);
    }

    // Install dependencies (from the synthetic workspace root for the default flavor, else the
    // frontend). pnpm honors the allowBuilds/overrides/hoisting settings from the workspace root.
    await runInstall(installDir);

    // Run lint only (skip type-check and unit tests since they require external dependencies)
    const lintExtraArgs = process.argv.slice(3);
    const lintExitCode = await runLint(frontendDir, lintExtraArgs);

    if (lintExitCode === 0) {
      console.log('[test-flavor] ✅ Lint passed!');
    } else {
      console.log(`[test-flavor] ❌ Lint failed with exit code ${lintExitCode}`);
    }

    process.exit(lintExitCode);
  } finally {
    // Cleanup
    console.log('[test-flavor] Cleaning up work directory...');
    await rm(testWorkDir, { recursive: true, force: true });
  }
}

testFlavor().catch((error) => {
  console.error('[test-flavor] Error:', error.message);
  process.exit(1);
});
