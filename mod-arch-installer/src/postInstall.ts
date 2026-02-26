import { logger } from './utils/logger.js';
import type { InstallOptions } from './types.js';

/**
 * Display post-installation checklist with next steps for ODH integration.
 */
export function displayPostInstallChecklist(options: InstallOptions): void {
  const { moduleName, targetDir, flavor } = options;

  logger.log('');
  logger.success(`Module created at ${targetDir}`);
  logger.log('');

  if (flavor === 'kubeflow') {
    displayKubeflowChecklist(targetDir);
  } else {
    displayDefaultChecklist(moduleName.camelCase, moduleName.pascalCase);
  }
}

function displayKubeflowChecklist(targetDir: string): void {
  logger.log('Next steps:');
  logger.log(`  1. cd ${targetDir}`);
  logger.log('  2. make dev-install-dependencies');
  logger.log('  3. Start development in mock mode with make dev-start');
  logger.log('');
  logger.log('Documentation:');
  logger.log('  - https://github.com/opendatahub-io/mod-arch-library/tree/main/docs');
  logger.log('');
}

function displayDefaultChecklist(camelCase: string, pascalCase: string): void {
  logger.log('Next steps for ODH Dashboard integration:');
  logger.log('');
  logger.log('Required:');
  logger.log(`  1. Add '${camelCase}Module' feature flag to`);
  logger.log('     frontend/src/k8sTypes.ts');
  logger.log('');
  logger.log('  2. Add default config to');
  logger.log('     frontend/src/concepts/areas/const.ts');
  logger.log('');
  logger.log("  3. Run 'npm install' at repo root");
  logger.log('');
  logger.log("  4. Start with 'make dev-start-federated'");
  logger.log('');
  logger.log('Optional:');
  logger.log('  - Export types via package.json exports field');
  logger.log('  - Configure parent area (e.g., gen-ai-studio)');
  logger.log(`  - Add navigation icon in ${pascalCase}NavIcon.ts`);
  logger.log('');
  logger.log('Documentation:');
  logger.log('  - https://github.com/opendatahub-io/odh-dashboard/blob/main/docs/onboard-modular-architecture.md');
  logger.log('  - https://github.com/opendatahub-io/mod-arch-library/tree/main/docs');
  logger.log('');
}
