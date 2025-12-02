import { mkdir, readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyDirectory, ensureEmptyDirectory, fileExists, readJSON, writeJSON } from './utils/filesystem.js';
import { logger } from './utils/logger.js';
import { runCommand } from './utils/runCommand.js';
import type { InstallOptions, StarterFlavor } from './types.js';

const TEMPLATE_ROOT = path.resolve(fileURLToPath(new URL('../templates/mod-arch-starter', import.meta.url)));
const FLAVOR_ROOT = path.resolve(fileURLToPath(new URL('../flavors', import.meta.url)));
const FRONTEND_DIR = 'frontend';
const MANIFESTS_DIR = 'manifests';
const ROOT_OVERLAY_DIR = 'root';

async function copyBaseTemplate(targetDir: string) {
  await ensureEmptyDirectory(targetDir);
  await copyDirectory(TEMPLATE_ROOT, targetDir);
}

async function applyRootOverlay(flavor: StarterFlavor, targetDir: string) {
  if (flavor !== 'default') {
    return;
  }

  const overlayDir = path.join(FLAVOR_ROOT, flavor, ROOT_OVERLAY_DIR);
  const hasOverlay = await fileExists(overlayDir);
  if (!hasOverlay) {
    logger.warn(`No root overlay files found for flavor "${flavor}" at ${overlayDir}.`);
    return;
  }

  await copyDirectory(overlayDir, targetDir);
}

async function removeDefaultManifests(flavor: StarterFlavor, targetDir: string) {
  if (flavor !== 'default') {
    return;
  }

  const manifestsPath = path.join(targetDir, MANIFESTS_DIR);
  const hasManifests = await fileExists(manifestsPath);
  if (!hasManifests) {
    return;
  }

  await rm(manifestsPath, { recursive: true, force: true });
}

async function removeDefaultFolders(flavor: StarterFlavor, targetDir: string) {
  if (flavor !== 'default') {
    return;
  }

  // Remove shared folder - components now come from @odh-dashboard/internal
  const sharedPath = path.join(targetDir, FRONTEND_DIR, 'src', 'shared');
  const hasShared = await fileExists(sharedPath);
  if (hasShared) {
    await rm(sharedPath, { recursive: true, force: true });
  }

  // Remove standalone folder - not needed for federated mode
  const standalonePath = path.join(targetDir, FRONTEND_DIR, 'src', 'app', 'standalone');
  const hasStandalone = await fileExists(standalonePath);
  if (hasStandalone) {
    await rm(standalonePath, { recursive: true, force: true });
  }

  // Remove SettingsMainPage.tsx - not needed for federated mode
  const settingsMainPagePath = path.join(targetDir, FRONTEND_DIR, 'src', 'app', 'pages', 'SettingsMainPage.tsx');
  const hasSettingsMainPage = await fileExists(settingsMainPagePath);
  if (hasSettingsMainPage) {
    await rm(settingsMainPagePath, { force: true });
  }
}

async function applyFrontendOverlay(flavor: StarterFlavor, targetDir: string) {
  if (flavor === 'kubeflow') {
    return;
  }

  const overlayDir = path.join(FLAVOR_ROOT, flavor, FRONTEND_DIR);
  const frontendTarget = path.join(targetDir, FRONTEND_DIR);
  const hasOverlay = await fileExists(overlayDir);
  if (!hasOverlay) {
    logger.warn(`No overlay files found for flavor "${flavor}" at ${overlayDir}.`);
    return;
  }
  await copyDirectory(overlayDir, frontendTarget);
}

async function updateFrontendDependencies(options: InstallOptions, targetDir: string) {
  if (options.flavor === 'kubeflow') {
    return;
  }

  const packageJsonPath = path.join(targetDir, FRONTEND_DIR, 'package.json');
  const hasPackageJson = await fileExists(packageJsonPath);
  if (!hasPackageJson) {
    logger.warn('Unable to locate frontend/package.json to update dependencies.');
    return;
  }

  const packageJson = await readJSON(packageJsonPath);
  if (packageJson.dependencies) {
    delete packageJson.dependencies['mod-arch-kubeflow'];
    if (options.flavor === 'default') {
      delete packageJson.dependencies['mod-arch-shared'];
    }
  }

  if (options.flavor === 'default' && packageJson.devDependencies) {
    delete packageJson.devDependencies['mod-arch-shared'];
  }
  packageJson.scripts = {
    ...packageJson.scripts,
    'start:default': "STYLE_THEME=patternfly-theme npm run start:dev",
  };
  await writeJSON(packageJsonPath, packageJson);

  if (options.flavor === 'default') {
    const packageLockPath = path.join(targetDir, FRONTEND_DIR, 'package-lock.json');
    const hasPackageLock = await fileExists(packageLockPath);
    if (hasPackageLock) {
      const packageLock = await readJSON(packageLockPath);
      if (packageLock.packages) {
        const rootPackage = packageLock.packages[''];
        if (rootPackage) {
          if (rootPackage.dependencies) {
            delete rootPackage.dependencies['mod-arch-shared'];
          }
          if (rootPackage.devDependencies) {
            delete rootPackage.devDependencies['mod-arch-shared'];
          }
        }
        Object.keys(packageLock.packages).forEach((pkgKey) => {
          if (pkgKey.startsWith('node_modules/mod-arch-shared')) {
            delete packageLock.packages[pkgKey];
          }
        });
      }
      if (packageLock.dependencies) {
        delete packageLock.dependencies['mod-arch-shared'];
      }
      await writeJSON(packageLockPath, packageLock);
    }
  }
}

async function initializeGitRepo(targetDir: string, initializeGit: boolean) {
  if (!initializeGit) {
    return;
  }

  try {
    await runCommand('git', ['init'], { cwd: targetDir });
    await runCommand('git', ['add', '.'], { cwd: targetDir });
    await runCommand('git', ['commit', '-m', 'chore: bootstrap project'], { cwd: targetDir });
  } catch (error) {
    logger.warn(`Failed to initialize git repository: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function installDependencies(targetDir: string, skipInstall: boolean) {
  if (skipInstall) {
    return;
  }

  try {
    await runCommand('npm', ['install'], { cwd: path.join(targetDir, FRONTEND_DIR) });
  } catch (error) {
    logger.warn(`Dependency installation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function renameGitignores(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '.git' && entry.name !== 'node_modules') {
        await renameGitignores(fullPath);
      }
    } else if (entry.name === 'gitignore') {
      const newPath = path.join(dir, '.gitignore');
      await rename(fullPath, newPath);
    }
  }
}

export async function installStarter(options: InstallOptions) {
  const targetDir = path.resolve(process.cwd(), options.targetDir);
  await mkdir(targetDir, { recursive: true });
  logger.info(`Preparing project in ${targetDir} (flavor: ${options.flavor}).`);

  await copyBaseTemplate(targetDir);
  await removeDefaultManifests(options.flavor, targetDir);
  await applyRootOverlay(options.flavor, targetDir);
  await applyFrontendOverlay(options.flavor, targetDir);
  await removeDefaultFolders(options.flavor, targetDir);
  await updateFrontendDependencies(options, targetDir);
  await renameGitignores(targetDir);
  await installDependencies(targetDir, options.skipInstall);
  await initializeGitRepo(targetDir, options.initializeGit);

  logger.success('Installation complete!');
  logger.info('Next steps:');
  logger.info(`  1. cd ${targetDir}/<your-project-folder>`);
  logger.info('  2. make dev-install-dependencies');
  logger.info('  3. Start development in mock mode with make dev-start.');
}
