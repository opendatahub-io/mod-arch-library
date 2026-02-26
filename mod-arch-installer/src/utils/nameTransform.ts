import type { ModuleNames } from '../types.js';

/**
 * Validates that the input is in kebab-case format.
 * @param name - The module name to validate
 * @returns true if valid kebab-case
 */
export function isValidKebabCase(name: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name);
}

/**
 * Transforms a kebab-case module name into all required naming formats.
 * @param kebabCase - The module name in kebab-case (e.g., "auto-rag")
 * @returns All naming variations
 */
export function transformModuleName(kebabCase: string): ModuleNames {
  if (!isValidKebabCase(kebabCase)) {
    throw new Error(
      `Invalid module name "${kebabCase}". Must be kebab-case (e.g., auto-rag, model-registry, gen-ai).`,
    );
  }

  const words = kebabCase.split('-');

  const camelCase = words[0] + words.slice(1).map(capitalize).join('');
  const pascalCase = words.map(capitalize).join('');
  const titleCase = words.map(capitalize).join(' ');
  const snakeCase = words.join('_');
  const upperSnakeCase = words.map((w) => w.toUpperCase()).join('_');

  return {
    kebabCase,
    camelCase,
    pascalCase,
    titleCase,
    snakeCase,
    upperSnakeCase,
  };
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
