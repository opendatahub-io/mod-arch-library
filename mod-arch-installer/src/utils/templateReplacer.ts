import { readFile, writeFile, readdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import type { ModuleNames } from '../types.js';

interface ReplacementRule {
  pattern: RegExp;
  replacement: (names: ModuleNames) => string;
}

/**
 * Replacement rules for transforming hardcoded module names in templates.
 * Order matters - more specific patterns should come first.
 */
const REPLACEMENT_RULES: ReplacementRule[] = [
  // Package names (kebab-case)
  { pattern: /mod-arch-ui/g, replacement: (n) => `${n.kebabCase}-ui` },
  { pattern: /mod-arch-module/g, replacement: (n) => `${n.kebabCase}-module` },
  { pattern: /@odh-dashboard\/mod-arch/g, replacement: (n) => `@odh-dashboard/${n.kebabCase}` },

  // Module Federation names (must match specific patterns)
  { pattern: /name:\s*['"]modArch['"]/g, replacement: (n) => `name: '${n.camelCase}'` },
  { pattern: /"name":\s*"modArch"/g, replacement: (n) => `"name": "${n.camelCase}"` },

  // Extension IDs with suffixes (more specific first)
  { pattern: /'mod-arch-view'/g, replacement: (n) => `'${n.kebabCase}-view'` },
  { pattern: /"mod-arch-view"/g, replacement: (n) => `"${n.kebabCase}-view"` },

  // Extension IDs (bare mod-arch in quotes)
  { pattern: /'mod-arch'/g, replacement: (n) => `'${n.kebabCase}'` },
  { pattern: /"mod-arch"/g, replacement: (n) => `"${n.kebabCase}"` },

  // URL paths and routes
  { pattern: /\/mod-arch\//g, replacement: (n) => `/${n.kebabCase}/` },
  { pattern: /\/mod-arch'/g, replacement: (n) => `/${n.kebabCase}'` },
  { pattern: /\/mod-arch"/g, replacement: (n) => `/${n.kebabCase}"` },
  { pattern: /\/mod-arch`/g, replacement: (n) => `/${n.kebabCase}\`` },

  // Dynamic imports for renamed files
  { pattern: /\.\/ModArchWrapper/g, replacement: (n) => `./${n.pascalCase}Wrapper` },
  { pattern: /\.\/ModArchNavIcon/g, replacement: (n) => `./${n.pascalCase}NavIcon` },

  // Group identifiers (snake_case)
  { pattern: /mod_arch/g, replacement: (n) => n.snakeCase },

  // Constants (UPPER_SNAKE_CASE)
  { pattern: /MOD_ARCH/g, replacement: (n) => n.upperSnakeCase },

  // Feature flags and identifiers (camelCase)
  { pattern: /modArchModule/g, replacement: (n) => `${n.camelCase}Module` },

  // Variable/function names (camelCase) - be careful with boundaries
  { pattern: /\bmodArch\b/g, replacement: (n) => n.camelCase },

  // Component/class names (PascalCase)
  { pattern: /\bModArch\b/g, replacement: (n) => n.pascalCase },

  // Display names in docs/comments (Title Case)
  { pattern: /Mod Arch/g, replacement: (n) => n.titleCase },
];

/**
 * Files and patterns to process for replacements.
 */
const FILES_TO_PROCESS = [
  // Frontend
  'frontend/package.json',
  'frontend/config/moduleFederation.js',
  'frontend/config/webpack.dev.js',
  'frontend/src/app/utilities/const.ts',
  'frontend/src/odh/extensions.ts',
  'frontend/src/odh/ModArchWrapper.tsx',
  'frontend/src/odh/ModArchNavIcon.ts',
  // Cypress tests
  'frontend/src/__tests__/cypress/cypress/support/commands/api.ts',
  // API
  'api/openapi/mod-arch.yaml',
  // BFF
  'bff/cmd/main.go',
  // Documentation
  'README.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/dev-setup.md',
  // Root package.json (for default flavor)
  'package.json',
];

/**
 * Apply all replacement rules to file content.
 */
function applyReplacements(content: string, names: ModuleNames): string {
  let result = content;
  for (const rule of REPLACEMENT_RULES) {
    result = result.replace(rule.pattern, rule.replacement(names));
  }
  return result;
}

/**
 * Process a single file, applying module name replacements.
 */
async function processFile(filePath: string, names: ModuleNames): Promise<boolean> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    // File doesn't exist or can't be read - skip silently
    return false;
  }

  const newContent = applyReplacements(content, names);
  if (content !== newContent) {
    // Write errors should propagate to surface issues like permissions or disk full
    await writeFile(filePath, newContent, 'utf-8');
    return true;
  }
  return false;
}

/**
 * Rename files that contain "mod-arch" in their name.
 */
async function renameModArchFiles(targetDir: string, names: ModuleNames): Promise<void> {
  // Rename OpenAPI file
  const oldApiPath = path.join(targetDir, 'api', 'openapi', 'mod-arch.yaml');
  const newApiPath = path.join(targetDir, 'api', 'openapi', `${names.kebabCase}.yaml`);

  try {
    const apiStat = await stat(oldApiPath);
    if (apiStat.isFile()) {
      await rename(oldApiPath, newApiPath);
    }
  } catch {
    // File doesn't exist - skip
  }

  // Rename ModArch wrapper files (for default flavor)
  const wrapperRenames = [
    {
      from: path.join(targetDir, 'frontend', 'src', 'odh', 'ModArchWrapper.tsx'),
      to: path.join(targetDir, 'frontend', 'src', 'odh', `${names.pascalCase}Wrapper.tsx`),
    },
    {
      from: path.join(targetDir, 'frontend', 'src', 'odh', 'ModArchNavIcon.ts'),
      to: path.join(targetDir, 'frontend', 'src', 'odh', `${names.pascalCase}NavIcon.ts`),
    },
  ];

  for (const { from, to } of wrapperRenames) {
    try {
      const fileStat = await stat(from);
      if (fileStat.isFile()) {
        await rename(from, to);
      }
    } catch {
      // File doesn't exist - skip
    }
  }
}

/**
 * Replace all hardcoded module names in the target directory.
 */
export async function replaceModuleNames(targetDir: string, names: ModuleNames): Promise<void> {
  // Process known files
  for (const relPath of FILES_TO_PROCESS) {
    const fullPath = path.join(targetDir, relPath);
    await processFile(fullPath, names);
  }

  // Also process all TypeScript files in frontend/src/odh (for default flavor)
  const odhDir = path.join(targetDir, 'frontend', 'src', 'odh');
  try {
    const entries = await readdir(odhDir);
    for (const entry of entries) {
      if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        await processFile(path.join(odhDir, entry), names);
      }
    }
  } catch {
    // Directory doesn't exist - skip
  }

  // Rename files containing "mod-arch"
  await renameModArchFiles(targetDir, names);
}
