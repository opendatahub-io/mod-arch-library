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
  skipInstall?: boolean;
  git?: boolean;
}

program
  .name('install-mod-arch-starter')
  .description('Bootstrap a new Modular Architecture project from the mod-arch-starter reference implementation.')
  .argument('[project-directory]', 'Target directory where the starter will be copied', '.')
  .option('-f, --flavor <flavor>', 'Starter flavor: kubeflow (default) or default', 'kubeflow')
  .option('-n, --name <module-name>', 'Module name in kebab-case (e.g., auto-rag, model-registry)')
  .option('--skip-install', 'Skip dependency installation steps', false)
  .option('--no-git', 'Do not initialize a git repository after copying the template', false)
  .action(async (projectDirectory: string, options: CliOptions) => {
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
    const targetDir = path.resolve(process.cwd(), projectDirectory);

    await installStarter({
      projectName: path.basename(targetDir),
      moduleName: moduleNames,
      targetDir,
      flavor,
      skipInstall: Boolean(options.skipInstall),
      initializeGit: options.git !== false,
    });
  });

program.parseAsync(process.argv).catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
