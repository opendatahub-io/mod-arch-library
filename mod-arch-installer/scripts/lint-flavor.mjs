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
    // Run ESLint directly with npx to only lint the specified files
    // Use --no-ignore to lint config files that would otherwise be ignored
    const args = [
      'eslint',
      '--ext', '.js,.ts,.jsx,.tsx',
      '--max-warnings', '0',
      '--no-ignore',
      ...(fix ? ['--fix'] : []),
      ...jsFiles
    ];

    const proc = spawn('npx', args, {
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
      'prettier',
      ...(fix ? ['--write'] : ['--check']),
      ...files
    ];

    const proc = spawn('npx', args, {
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
 * Runs npm install in the specified directory.
 * @param {string} dir - Directory to run npm install in
 * @returns {Promise<void>}
 */
function runNpmInstall(dir) {
  return new Promise((resolve, reject) => {
    console.log(`[lint-flavor] Installing dependencies in ${dir}...`);
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

    // Install dependencies
    await runNpmInstall(lintWorkDir);

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

    // Run Prettier first
    const prettierExitCode = await runPrettier(lintWorkDir, workdirFiles, fixFlag);

    // Run ESLint
    const eslintExitCode = await runEslint(lintWorkDir, workdirFiles, fixFlag);

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
