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
    displayDefaultChecklist(moduleName.camelCase, moduleName.pascalCase, moduleName.upperSnakeCase, moduleName.kebabCase, targetDir);
  }
}

function displayKubeflowChecklist(targetDir: string): void {
  logger.header('Next Steps');

  logger.listItem(`${pc.bold('1.')} Navigate to your project:`);
  logger.command(`cd ${targetDir}`);
  logger.blank();

  logger.listItem(`${pc.bold('2.')} Install dependencies:`);
  logger.command('make dev-install-dependencies');
  console.log(
    `    ${pc.dim('Commit the generated')} ${pc.yellow('frontend/pnpm-lock.yaml')} ${pc.dim('before building the')}`,
  );
  console.log(`    ${pc.dim('container image — the Dockerfile installs with')} ${pc.cyan('--frozen-lockfile')}${pc.dim('.')}`);
  logger.blank();

  logger.listItem(`${pc.bold('3.')} Start development server:`);
  logger.command('make dev-start');
  logger.blank();

  logger.header('Documentation');
  logger.link('Mod Arch Library', 'https://github.com/opendatahub-io/mod-arch-library/tree/main/docs');
  logger.blank();
}

function displayDefaultChecklist(
  camelCase: string,
  pascalCase: string,
  upperSnake: string,
  kebabCase: string,
  targetDir: string,
): void {
  // The package directory can differ from the module name (e.g. `-n bar ./packages/foo`); paths use
  // the directory, while area/flag identifiers must match what the templates generated from the name.
  const moduleName = path.basename(targetDir);

  logger.header('Next Steps (ODH Dashboard Integration)');
  console.log(
    `  ${pc.dim('Tip: the odh-dashboard')} ${pc.cyan('/module-onboarding')} ${pc.dim('Claude skill automates all of these steps.')}`,
  );
  logger.blank();

  logger.listItem(`${pc.bold('1.')} Register the frontend in the root ${pc.yellow('pnpm-workspace.yaml')}:`);
  console.log(`    ${pc.dim('Add')} ${pc.green(`- packages/${moduleName}/frontend`)} ${pc.dim('to the packages list')}`);
  logger.blank();

  logger.listItem(`${pc.bold('2.')} Register the area and feature flag:`);
  console.log(`    ${pc.yellow('packages/plugin-core/src/areas/types.ts')}  ${pc.green(`PLUGIN_${upperSnake} = 'plugin-${kebabCase}'`)}`);
  console.log(`    ${pc.yellow('packages/k8s-core/src/k8sTypes.ts')}       ${pc.green(`${camelCase}?: boolean;`)} ${pc.dim('(DashboardCommonConfig)')}`);
  console.log(`    ${pc.yellow('frontend/src/concepts/areas/const.ts')}    ${pc.dim('flag default + SupportedAreasStateMap entry')}`);
  console.log(`    ${pc.yellow('manifests/base/crd/odhdashboardconfigs.opendatahub.io.crd.yaml')} ${pc.dim('flag property')}`);
  logger.blank();

  logger.listItem(`${pc.bold('3.')} Install from the odh-dashboard root:`);
  logger.command('pnpm install');
  logger.blank();

  logger.listItem(`${pc.bold('4.')} Validate ports ${pc.dim('(pass --port / --bff-port / --service-port to the installer to set them)')}:`);
  logger.command('pnpm run validate:ports');
  logger.command('pnpm run validate:cypress-mock');
  logger.blank();

  logger.listItem(`${pc.bold('5.')} Start development server ${pc.dim(`(from packages/${moduleName})`)}:`);
  logger.command(`cd packages/${moduleName}`);
  logger.command('make dev-start-federated');
  logger.blank();

  logger.header('Optional Enhancements');
  logger.listItem(`Configure parent area (e.g., ${pc.cyan('gen-ai-studio')})`);
  logger.listItem(`Add navigation icon in ${pc.yellow(`${pascalCase}NavIcon.ts`)}`);
  logger.blank();

  logger.header('Documentation');
  logger.link('Onboarding Guide', 'https://github.com/opendatahub-io/odh-dashboard/blob/main/docs/onboard-modular-architecture.md');
  logger.link('Mod Arch Library', 'https://github.com/opendatahub-io/mod-arch-library/tree/main/docs');
  logger.blank();
}
