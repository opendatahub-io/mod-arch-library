#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';
import { installStarter } from './installer.js';
import type { StarterFlavor } from './types.js';
import { logger } from './utils/logger.js';

const FLAVORS: StarterFlavor[] = ['kubeflow', 'default'];

const program = new Command();

program
  .name('install-mod-arch-starter')
  .description('Bootstrap a new Modular Architecture project from the mod-arch-starter reference implementation.')
  .argument('[project-directory]', 'Target directory where the starter will be copied', '.')
  .option('-f, --flavor <flavor>', 'Starter flavor: kubeflow (default) or default', 'kubeflow')
  .option('--skip-install', 'Skip dependency installation steps', false)
  .option('--no-git', 'Do not initialize a git repository after copying the template', false)
  .action(async (projectDirectory: string, options: { flavor: StarterFlavor; skipInstall?: boolean; git?: boolean }) => {
    const flavor = options.flavor as StarterFlavor;
    if (!FLAVORS.includes(flavor)) {
      logger.error(`Unknown flavor "${flavor}". Use one of: ${FLAVORS.join(', ')}`);
      process.exitCode = 1;
      return;
    }

    const targetDir = path.resolve(process.cwd(), projectDirectory);

    await installStarter({
      projectName: path.basename(targetDir),
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
