import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyDirectory, ensureEmptyDirectory, fileExists, readJSON, writeJSON } from './utils/filesystem.js';
import { logger } from './utils/logger.js';
import { runCommand } from './utils/runCommand.js';
import type { InstallOptions, StarterFlavor } from './types.js';

const TEMPLATE_ROOT = path.resolve(fileURLToPath(new URL('../templates/mod-arch-starter', import.meta.url)));
const FLAVOR_ROOT = path.resolve(fileURLToPath(new URL('../flavors', import.meta.url)));
const FRONTEND_DIR = 'frontend';

async function copyBaseTemplate(targetDir: string) {
  await ensureEmptyDirectory(targetDir);
  await copyDirectory(TEMPLATE_ROOT, targetDir);
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

export async function installStarter(options: InstallOptions) {
  const targetDir = path.resolve(process.cwd(), options.targetDir);
  await mkdir(targetDir, { recursive: true });
  logger.info(`Preparing project in ${targetDir} (flavor: ${options.flavor}).`);

  await copyBaseTemplate(targetDir);
  await applyFrontendOverlay(options.flavor, targetDir);
  await updateFrontendDependencies(options, targetDir);
  await installDependencies(targetDir, options.skipInstall);
  await initializeGitRepo(targetDir, options.initializeGit);

  logger.success('Installation complete!');
  logger.info('Next steps:');
  logger.info(`  1. cd ${targetDir}/<your-project-folder>`);
  logger.info('  2. make dev-install-dependencies');
  logger.info('  3. Start development in mock mode with make dev-start.');
}
