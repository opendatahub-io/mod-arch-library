#!/usr/bin/env node
/**
 * Linter for mod-arch-installer flavor overlay files.
 *
 * This script runs ESLint and Prettier on the overlay files in the specified flavor directory
 * using the same rules as mod-arch-starter's frontend.
 *
 * Usage:
 *   node scripts/lint-flavor.mjs [flavor] [--fix]
 *
 * Arguments:
 *   flavor - The flavor to lint (default: 'default')
 *   --fix  - Automatically fix problems where possible
 *
 * Examples:
 *   node scripts/lint-flavor.mjs             # Lints the default flavor
 *   node scripts/lint-flavor.mjs --fix       # Lints and fixes the default flavor
 *   node scripts/lint-flavor.mjs kubeflow    # Lints the kubeflow flavor
 */

import { readdir, stat, readFile, writeFile, cp, rm, mkdir } from 'node:fs/promises';
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
const starterFrontendRoot = path.join(repoRoot, 'mod-arch-starter', 'frontend');
const lintWorkDir = path.join(installerRoot, '.lint-workdir');

// Parse arguments
const args = process.argv.slice(2);
const fixFlag = args.includes('--fix');
const flavorArg = args.find((arg) => !arg.startsWith('--')) || 'default';

// Directories to skip when finding lintable files
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'cypress']);

// Files to skip when copying from root/ folder (to avoid conflicts with starter's package.json)
const SKIP_ROOT_FILES = new Set(['package.json', 'tsconfig.json', '.eslintrc.js']);

/**
 * Recursively finds all TypeScript/JavaScript files in a directory.
 * @param {string} dir - Directory to search
 * @param {string[]} files - Accumulated files array
 * @returns {Promise<string[]>}
 */
async function findLintableFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip directories that shouldn't be linted
      if (!SKIP_DIRS.has(entry.name)) {
        await findLintableFiles(fullPath, files);
      }
    } else if (/\.(ts|tsx|js|jsx|md)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Filters out files that contain @ts-nocheck at the start.
 * These are overlay template files that rely on path aliases configured in the target project.
 * @param {string[]} files - Array of file paths
 * @returns {Promise<string[]>}
 */
async function filterTsNocheckFiles(files) {
  const filtered = [];

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8');
    const firstLine = content.split('\n')[0];
    if (!firstLine.includes('@ts-nocheck')) {
      filtered.push(filePath);
    }
  }

  return filtered;
}

/**
 * Recursively copies files from source to destination.
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 * @param {Set<string>} [skipFiles] - Set of filenames to skip
 */
async function copyRecursive(src, dest, skipFiles = new Set()) {
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', '.git', 'jest-coverage'].includes(entry.name)) {
        await mkdir(destPath, { recursive: true });
        await copyRecursive(srcPath, destPath, skipFiles);
      }
    } else if (!skipFiles.has(entry.name)) {
      await cp(srcPath, destPath, { force: true });
    }
  }
}

/**
 * Copies fixed files back to the flavor directory.
 * @param {string} flavorPath - Original flavor path
 * @param {string} workDir - Working directory with fixed files
 */
async function copyFixedFilesBack(flavorPath, workDir) {
  const flavorFiles = await findLintableFiles(flavorPath);

  for (const originalFile of flavorFiles) {
    const relativePath = path.relative(flavorPath, originalFile);
    const fixedFile = path.join(workDir, relativePath);

    try {
      await stat(fixedFile);
      const fixedContent = await readFile(fixedFile, 'utf-8');
      await writeFile(originalFile, fixedContent);
    } catch (error) {
      // File doesn't exist in workdir, skip
    }
  }
}

/**
 * Runs ESLint on the specified files.
 * @param {string} dir - Directory to run ESLint in
 * @param {string[]} files - Files to lint
 * @param {boolean} fix - Whether to auto-fix issues
 * @returns {Promise<number>}
 */
function runEslint(dir, files, fix = false) {
  // Filter out markdown files - ESLint TypeScript parser can't handle them
  const jsFiles = files.filter(f => !f.endsWith('.md'));
  
  if (jsFiles.length === 0) {
    console.log('[lint-flavor] No JS/TS files to lint with ESLint');
    return Promise.resolve(0);
  }
  
  return new Promise((resolve, reject) => {
    console.log(`[lint-flavor] Running ESLint on ${jsFiles.length} files...`);
    // Run ESLint via pnpm exec to only lint the specified files
    // Use --no-ignore to lint config files that would otherwise be ignored
    const args = [
      'exec',
      'eslint',
      '--max-warnings', '0',
      '--no-ignore',
      ...(fix ? ['--fix'] : []),
      ...jsFiles
    ];

    const proc = spawnPnpm(args, dir);

    proc.on('close', (code) => {
      resolve(code);
    });

    proc.on('error', reject);
  });
}

/**
 * Runs Prettier on the specified files.
 * @param {string} dir - Directory to run Prettier in
 * @param {string[]} files - Files to format
 * @param {boolean} fix - Whether to write fixes (--write) or just check (--check)
 * @returns {Promise<number>}
 */
function runPrettier(dir, files, fix = false) {
  return new Promise((resolve, reject) => {
    console.log(`[lint-flavor] Running Prettier on ${files.length} files...`);
    const args = [
      'exec',
      'prettier',
      ...(fix ? ['--write'] : ['--check']),
      ...files
    ];

    const proc = spawnPnpm(args, dir);

    proc.on('close', (code) => {
      resolve(code);
    });

    proc.on('error', reject);
  });
}

/**
 * Runs pnpm install in the specified directory.
 * @param {string} dir - Directory to run pnpm install in
 * @returns {Promise<void>}
 */
function runInstall(dir) {
  return new Promise((resolve, reject) => {
    console.log(`[lint-flavor] Installing dependencies in ${dir}...`);
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
 * Reproduce the shipped federated (default) layout for install. The installer removes
 * frontend/pnpm-workspace.yaml from a default module (it joins the odh-dashboard workspace),
 * so a standalone frontend install would fail with ERR_PNPM_IGNORED_BUILDS. Mirror that by
 * turning the work directory into a synthetic host workspace root: carry the base starter's
 * pnpm settings (allowBuilds/overrides/hoisting) there with the frontend as the only member,
 * and ensure the frontend itself has no workspace file. Returns the directory to install from.
 * @param {string} rootDir - The lint work directory (parent of frontend)
 * @param {string} baseFrontendDir - Base starter frontend (source of the pnpm settings)
 * @returns {Promise<string>} Directory to run install from
 */
async function mirrorFederatedWorkspaceRoot(rootDir, baseFrontendDir) {
  const frontendDir = path.join(rootDir, 'frontend');
  // Frontend must not carry its own workspace file (matches shipped output).
  await rm(path.join(frontendDir, 'pnpm-workspace.yaml'), { force: true });
  // Carry the base pnpm settings to the root, pointing at the frontend member instead of '.'.
  const baseWorkspace = await readFile(path.join(baseFrontendDir, 'pnpm-workspace.yaml'), 'utf8');
  const rootWorkspace = baseWorkspace.replace(/-\s*'\.'/, "- 'frontend'");
  await writeFile(path.join(rootDir, 'pnpm-workspace.yaml'), rootWorkspace);
  // Replace the base frontend's package.json (copied to the root) with a minimal workspace root,
  // so pnpm installs only the frontend member. Carry packageManager so the pinned pnpm is used.
  const frontendPkg = JSON.parse(await readFile(path.join(frontendDir, 'package.json'), 'utf8'));
  const rootPkg = {
    name: 'harness-workspace-root',
    version: '0.0.0',
    private: true,
    ...(frontendPkg.packageManager ? { packageManager: frontendPkg.packageManager } : {}),
  };
  await writeFile(path.join(rootDir, 'package.json'), `${JSON.stringify(rootPkg, null, 2)}\n`);
  return rootDir;
}

/**
 * Main function to lint a flavor.
 */
async function lintFlavor() {
  const flavorPath = path.join(flavorsRoot, flavorArg);

  // Validate flavor exists
  try {
    const flavorStat = await stat(flavorPath);
    if (!flavorStat.isDirectory()) {
      throw new Error(`Flavor '${flavorArg}' is not a directory.`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`[lint-flavor] Flavor '${flavorArg}' not found in ${flavorsRoot}`);
      const availableFlavors = await readdir(flavorsRoot);
      console.error(`[lint-flavor] Available flavors: ${availableFlavors.join(', ')}`);
      process.exit(1);
    }
    throw error;
  }

  // Find lintable files in all flavor directories
  let flavorFiles = [];
  try {
    flavorFiles = await findLintableFiles(flavorPath);
    // Filter out files with @ts-nocheck (overlay template files)
    flavorFiles = await filterTsNocheckFiles(flavorFiles);
    // Filter out files from root/ that are skipped during copy
    flavorFiles = flavorFiles.filter((f) => {
      const relativePath = path.relative(flavorPath, f);
      if (relativePath.startsWith('root/') || relativePath.startsWith('root\\')) {
        const fileName = path.basename(f);
        return !SKIP_ROOT_FILES.has(fileName);
      }
      return true;
    });
    // Skip the ESLint config itself: it is not application source, and the project's
    // own `test:lint` glob (`./*.js`) never matches the dotfile `.eslintrc.js` either.
    // Linting it with the TypeScript project parser fails since it is not a project file.
    flavorFiles = flavorFiles.filter((f) => path.basename(f) !== '.eslintrc.js');
    // For the default flavor, skip sources the installer removes (removeDefaultFolders):
    // the standalone chrome is dropped for federated modules, so it never ships.
    if (flavorArg === 'default') {
      const standaloneDir = path.join('frontend', 'src', 'app', 'standalone');
      flavorFiles = flavorFiles.filter(
        (f) => !path.relative(flavorPath, f).startsWith(standaloneDir),
      );
    }
  } catch (error) {
    console.error(`[lint-flavor] Error scanning flavor '${flavorArg}': ${error.message}`);
    process.exit(1);
  }

  if (flavorFiles.length === 0) {
    console.log(`[lint-flavor] No lintable files found in flavor '${flavorArg}'`);
    process.exit(0);
  }

  console.log(`[lint-flavor] Linting flavor: ${flavorArg}`);
  console.log(`[lint-flavor] Found ${flavorFiles.length} files to lint (excluding @ts-nocheck files)`);

  // Create work directory with starter frontend as base
  console.log('[lint-flavor] Setting up lint environment...');
  await rm(lintWorkDir, { recursive: true, force: true });
  await mkdir(lintWorkDir, { recursive: true });

  try {
    // Copy starter frontend (for eslint config, prettier config, and dependencies)
    await copyRecursive(starterFrontendRoot, lintWorkDir);

    // Copy all flavor files on top (frontend/, root/, docs/, etc.)
    const flavorSubdirs = await readdir(flavorPath, { withFileTypes: true });
    for (const entry of flavorSubdirs) {
      if (entry.isDirectory()) {
        const srcDir = path.join(flavorPath, entry.name);
        // For 'root' folder, copy to workdir root; for others, copy to their respective paths
        const destDir = entry.name === 'root' ? lintWorkDir : path.join(lintWorkDir, entry.name);
        await mkdir(destDir, { recursive: true });
        // Skip certain files when copying from root/ to avoid conflicts
        const skipFiles = entry.name === 'root' ? SKIP_ROOT_FILES : new Set();
        await copyRecursive(srcDir, destDir, skipFiles);
      }
    }

    // The base starter ships an ESLint 9 flat config at the workdir root. Remove it so ESLint,
    // run from the flavor frontend, resolves the flavor's own config (the default flavor's
    // .eslintrc.js) instead of walking up to a flat config whose plugins live only in the base.
    await rm(path.join(lintWorkDir, 'eslint.config.mjs'), { force: true });

    // Install dependencies in the flavor frontend. Its overlay package.json pins the flavor's
    // own toolchain (e.g. the default flavor uses ESLint 8 legacy config), which can differ from
    // the base starter copied at the workdir root, so we install and lint from here.
    const frontendWorkDir = path.join(lintWorkDir, 'frontend');
    // For the default flavor, mirror shipped output: the frontend ships without
    // pnpm-workspace.yaml (federated modules join odh's root workspace), so reproduce that host
    // workspace at a synthetic root and install from there. Other flavors keep a per-frontend
    // workspace file and install in place.
    let installDir = frontendWorkDir;
    if (flavorArg === 'default') {
      installDir = await mirrorFederatedWorkspaceRoot(lintWorkDir, starterFrontendRoot);
    } else {
      await cp(
        path.join(starterFrontendRoot, 'pnpm-workspace.yaml'),
        path.join(frontendWorkDir, 'pnpm-workspace.yaml'),
        { force: true },
      );
    }
    await runInstall(installDir);

    // Get paths of flavor files mapped to work directory
    const workdirFiles = flavorFiles.map((f) => {
      const relativePath = path.relative(flavorPath, f);
      // Handle 'root' folder mapping - files in root/ should map to workdir root
      if (relativePath.startsWith('root/') || relativePath.startsWith('root\\')) {
        const rootRelative = relativePath.replace(/^root[/\\]/, '');
        return path.join(lintWorkDir, rootRelative);
      }
      return path.join(lintWorkDir, relativePath);
    });

    // ESLint/Prettier run from frontendWorkDir (defined above) so the frontend's own tsconfig
    // (which defines the `~` path alias) and eslintrc are the nearest configs. Running from the
    // module root would resolve `~` against the base copy at the workdir root and misreport
    // intra-package alias imports as extraneous dependencies.

    // Run Prettier first
    const prettierExitCode = await runPrettier(frontendWorkDir, workdirFiles, fixFlag);

    // Run ESLint
    const eslintExitCode = await runEslint(frontendWorkDir, workdirFiles, fixFlag);

    // Combined exit code (fail if either failed)
    const exitCode = prettierExitCode !== 0 ? prettierExitCode : eslintExitCode;

    // If fixing, copy the fixed files back to the flavor
    if (fixFlag) {
      console.log('[lint-flavor] Copying fixed files back to flavor...');
      for (const originalFile of flavorFiles) {
        const relativePath = path.relative(flavorPath, originalFile);
        let workdirFile;
        if (relativePath.startsWith('root/') || relativePath.startsWith('root\\')) {
          const rootRelative = relativePath.replace(/^root[/\\]/, '');
          workdirFile = path.join(lintWorkDir, rootRelative);
        } else {
          workdirFile = path.join(lintWorkDir, relativePath);
        }

        try {
          await stat(workdirFile);
          const fixedContent = await readFile(workdirFile, 'utf-8');
          await writeFile(originalFile, fixedContent);
        } catch (error) {
          // File doesn't exist in workdir, skip
        }
      }
    }

    if (exitCode === 0) {
      console.log('[lint-flavor] ✅ Linting and formatting passed!');
    } else {
      console.log(`[lint-flavor] ❌ Linting/formatting failed with exit code ${exitCode}`);
    }

    process.exit(exitCode);
  } finally {
    // Cleanup
    console.log('[lint-flavor] Cleaning up work directory...');
    await rm(lintWorkDir, { recursive: true, force: true });
  }
}

lintFlavor().catch((error) => {
  console.error('[lint-flavor] Error:', error.message);
  process.exit(1);
});
