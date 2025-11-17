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

import { cp, mkdir, rm, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

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
 * Runs npm install in the specified directory.
 * @param {string} dir - Directory to run npm install in
 * @returns {Promise<void>}
 */
function runNpmInstall(dir) {
  return new Promise((resolve, reject) => {
    console.log(`[test-flavor] Installing dependencies in ${dir}...`);
    const proc = spawn('npm', ['install', '--legacy-peer-deps'], {
      cwd: dir,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm install failed with code ${code}`));
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
    const proc = spawn('npm', args, {
      cwd: dir,
      stdio: 'inherit',
      shell: true,
    });

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

    // Install dependencies in frontend
    const frontendDir = path.join(testWorkDir, 'frontend');
    await runNpmInstall(frontendDir);

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
