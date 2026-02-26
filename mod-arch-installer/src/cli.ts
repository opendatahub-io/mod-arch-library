#!/usr/bin/env node
import { Command } from 'commander';
import { input } from '@inquirer/prompts';
import path from 'node:path';
import { installStarter } from './installer.js';
import type { StarterFlavor } from './types.js';
import { logger } from './utils/logger.js';
import { isValidKebabCase, transformModuleName } from './utils/nameTransform.js';

const FLAVORS: StarterFlavor[] = ['kubeflow', 'default'];

const program = new Command();

interface CliOptions {
  flavor: StarterFlavor;
  name?: string;
  install?: boolean;
  git?: boolean;
  // Deprecated options (kept for backward compatibility)
  skipInstall?: boolean;
  noGit?: boolean;
}

program
  .name('mod-arch-installer')
  .description('Bootstrap a new Modular Architecture project from the mod-arch-starter reference implementation.')
  .argument('[base-directory]', 'Base directory where the module folder will be created', '.')
  .option('-f, --flavor <flavor>', 'Starter flavor: default (PatternFly-only) or kubeflow (MUI theme)', 'default')
  .option('-n, --name <module-name>', 'Module name in kebab-case (e.g., auto-rag, model-registry)')
  .option('--install', 'Run npm install after copying the template (skipped by default to avoid monorepo conflicts)')
  .option('--git', 'Initialize a git repository after copying the template (disabled by default)')
  // Deprecated options (hidden but still functional for backward compatibility)
  .option('--skip-install', '(deprecated: use default behavior) Skip dependency installation', false)
  .option('--no-git', '(deprecated: use default behavior) Do not initialize git repository')
  .action(async (baseDirectory: string, options: CliOptions) => {
    // Handle deprecated options with warnings
    if (options.skipInstall) {
      logger.warn('--skip-install is deprecated and will be removed in a future version. Install is now skipped by default; use --install to enable.');
    }
    if (options.noGit === true) {
      logger.warn('--no-git is deprecated and will be removed in a future version. Git init is now disabled by default; use --git to enable.');
    }

    const flavor = options.flavor as StarterFlavor;
    if (!FLAVORS.includes(flavor)) {
      logger.error(`Unknown flavor "${flavor}". Use one of: ${FLAVORS.join(', ')}`);
      process.exitCode = 1;
      return;
    }

    // Get module name from option or prompt
    let moduleName = options.name;
    if (!moduleName) {
      moduleName = await input({
        message: 'Enter module name (kebab-case, e.g., auto-rag):',
        default: 'my-module',
        validate: (value) => {
          if (!isValidKebabCase(value)) {
            return 'Module name must be kebab-case (e.g., auto-rag, model-registry)';
          }
          return true;
        },
      });
    } else if (!isValidKebabCase(moduleName)) {
      logger.error(`Invalid module name "${moduleName}". Must be kebab-case (e.g., auto-rag, model-registry).`);
      process.exitCode = 1;
      return;
    }

    const moduleNames = transformModuleName(moduleName);
    // Create target directory using base directory + module name
    const targetDir = path.resolve(process.cwd(), baseDirectory, moduleName);

    await installStarter({
      projectName: moduleName,
      moduleName: moduleNames,
      targetDir,
      flavor,
      skipInstall: !options.install, // Skip by default, only install if --install flag is passed
      initializeGit: Boolean(options.git), // Git is now opt-in (disabled by default)
    });
  });

program.parseAsync(process.argv).catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
