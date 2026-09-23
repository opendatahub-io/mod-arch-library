#!/usr/bin/env node
import { cp, mkdir, readdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const installerRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(installerRoot, '..');
const starterRoot = path.join(repoRoot, 'mod-arch-starter');
const templatesRoot = path.join(installerRoot, 'templates');
const targetRoot = path.join(templatesRoot, 'mod-arch-starter');

const IGNORE_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', 'jest-coverage']);

async function ensureStarterExists() {
  try {
    const starterStat = await stat(starterRoot);
    if (!starterStat.isDirectory()) {
      throw new Error('mod-arch-starter is not a directory.');
    }
  } catch (error) {
    console.error('[mod-arch-installer] Unable to find mod-arch-starter directory.');
    throw error;
  }
}

function shouldCopy(src) {
  const relative = path.relative(starterRoot, src);
  if (!relative || relative.startsWith('..')) {
    return false;
  }

  const segments = relative.split(path.sep);
  if (relative.startsWith(path.join('bff', 'bin'))) {
    return false;
  }
  // Never bundle lockfiles: the scaffold regenerates them with `pnpm install`, and the
  // installer strips deps per flavor (a shipped lockfile would immediately be stale).
  const base = segments[segments.length - 1];
  if (base === 'package-lock.json' || base === 'pnpm-lock.yaml') {
    return false;
  }
  return !segments.some((segment) => IGNORE_DIRS.has(segment));
}

// npm strips dotfiles like .gitignore from published tarballs, so we bundle them under a
// dot-less name and the installer restores the dot on scaffold. (pnpm settings live in
// pnpm-workspace.yaml, which is not a dotfile and ships as-is.)
const DOTFILE_RENAMES = new Map([['.gitignore', 'gitignore']]);

async function renameDotfiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await renameDotfiles(fullPath);
    } else if (DOTFILE_RENAMES.has(entry.name)) {
      const newPath = path.join(dir, DOTFILE_RENAMES.get(entry.name));
      await rename(fullPath, newPath);
    }
  }
}

async function syncTemplates() {
  await ensureStarterExists();
  await mkdir(templatesRoot, { recursive: true });
  await rm(targetRoot, { recursive: true, force: true });

  await cp(starterRoot, targetRoot, {
    recursive: true,
    force: true,
    filter: (src) => {
      // Always include the root directory itself
      if (src === starterRoot) {
        return true;
      }
      return shouldCopy(src);
    },
  });

  await renameDotfiles(targetRoot);

  console.log('[mod-arch-installer] Templates synced from mod-arch-starter.');
}

syncTemplates().catch((error) => {
  console.error('[mod-arch-installer] Failed to sync templates:', error);
  process.exit(1);
});
