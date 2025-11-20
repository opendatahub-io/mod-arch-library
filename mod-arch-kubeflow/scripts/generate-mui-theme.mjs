#!/usr/bin/env node

/**
 * Generate MUI Theme JSON
 *
 * This script generates a JSON file containing the MUI default theme object.
 * It removes all function references and creates a clean JSON representation
 * for reference purposes.
 *
 * Usage: node scripts/generate-mui-theme.js
 */

import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

// Use createRequire to import CommonJS modules in ESM
const require = createRequire(import.meta.url);
const { createTheme } = require('@mui/material/styles');

// Get __dirname equivalent in ESM
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Serialize the theme object, removing all functions
const serializeTheme = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'function') return undefined;
  if (Array.isArray(obj)) return obj.map(serializeTheme).filter(v => v !== undefined);
  if (typeof obj === 'object') {
    const serialized = {};
    for (const key in obj) {
      if (typeof obj[key] !== 'function') {
        const value = serializeTheme(obj[key]);
        if (value !== undefined) serialized[key] = value;
      }
    }
    return serialized;
  }
  return obj;
};

try {
  console.log('Creating MUI default theme...');
  const theme = createTheme();

  console.log('Serializing theme object...');
  const serializedTheme = serializeTheme(theme);

  const output = {
    _meta: {
      generated: new Date().toISOString(),
      description: 'Auto-generated MUI default theme object for reference'
    },
    ...serializedTheme
  };

  const outputPath = path.join(dirname, '../style/MUI-default-theme-object.json');

  console.log('Writing to file...');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log('✅ Successfully generated MUI-default-theme-object.json');
  console.log(`   Location: ${outputPath}`);
} catch (error) {
  console.error('❌ Error generating MUI theme JSON:');
  console.error(error.message);
  process.exit(1);
}
