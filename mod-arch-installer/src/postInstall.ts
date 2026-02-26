import path from 'node:path';
import pc from 'picocolors';
import { logger } from './utils/logger.js';
import type { InstallOptions } from './types.js';

/**
 * Display post-installation checklist with next steps for ODH integration.
 */
export function displayPostInstallChecklist(options: InstallOptions): void {
  const { moduleName, targetDir, flavor } = options;

  logger.blank();
  console.log(pc.bold(pc.green('  ✓ Success!')) + ' Module created at ' + pc.cyan(targetDir));
  logger.blank();

  if (flavor === 'kubeflow') {
    displayKubeflowChecklist(targetDir);
  } else {
    displayDefaultChecklist(moduleName.camelCase, moduleName.pascalCase, targetDir);
  }
}

function displayKubeflowChecklist(targetDir: string): void {
  logger.header('Next Steps');

  logger.listItem(`${pc.bold('1.')} Navigate to your project:`);
  logger.command(`cd ${targetDir}`);
  logger.blank();

  logger.listItem(`${pc.bold('2.')} Install dependencies:`);
  logger.command('make dev-install-dependencies');
  logger.blank();

  logger.listItem(`${pc.bold('3.')} Start development server:`);
  logger.command('make dev-start');
  logger.blank();

  logger.header('Documentation');
  logger.link('Mod Arch Library', 'https://github.com/opendatahub-io/mod-arch-library/tree/main/docs');
  logger.blank();
}

function displayDefaultChecklist(camelCase: string, pascalCase: string, targetDir: string): void {
  const moduleName = path.basename(targetDir);

  logger.header('Next Steps (ODH Dashboard Integration)');

  logger.listItem(`${pc.bold('1.')} Add feature flag to ${pc.yellow('frontend/src/k8sTypes.ts')}:`);
  console.log(`    ${pc.dim('Add:')} ${pc.green(`'${camelCase}Module'`)} to the feature flags`);
  logger.blank();

  logger.listItem(`${pc.bold('2.')} Add config to ${pc.yellow('frontend/src/concepts/areas/const.ts')}`);
  logger.blank();

  logger.listItem(`${pc.bold('3.')} Install dependencies ${pc.dim('(from odh-dashboard root)')}:`);
  logger.command('npm install');
  logger.blank();

  logger.listItem(`${pc.bold('4.')} Start development server ${pc.dim(`(from packages/${moduleName})`)}:`);
  logger.command(`cd packages/${moduleName}`);
  logger.command('make dev-start-federated');
  logger.blank();

  logger.header('Optional Enhancements');
  logger.listItem(`Export types via ${pc.yellow('package.json')} exports field`);
  logger.listItem(`Configure parent area (e.g., ${pc.cyan('gen-ai-studio')})`);
  logger.listItem(`Add navigation icon in ${pc.yellow(`${pascalCase}NavIcon.ts`)}`);
  logger.blank();

  logger.header('Documentation');
  logger.link('Onboarding Guide', 'https://github.com/opendatahub-io/odh-dashboard/blob/main/docs/onboard-modular-architecture.md');
  logger.link('Mod Arch Library', 'https://github.com/opendatahub-io/mod-arch-library/tree/main/docs');
  logger.blank();
}
