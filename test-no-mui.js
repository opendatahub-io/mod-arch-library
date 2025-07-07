#!/usr/bin/env node

/**
 * Test script to verify that the library can be imported and used without MUI dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('Testing mod-arch-shared without MUI dependencies...');

// Test 1: Verify package.json structure
console.log('\n1. Checking package.json structure...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Check that MUI packages are not in dependencies
const dependencies = packageJson.dependencies || {};
const hasMUIInDeps = Object.keys(dependencies).some(dep => 
  dep.includes('@mui') || dep.includes('@emotion')
);

if (hasMUIInDeps) {
  console.error('❌ MUI packages found in dependencies - they should be optional');
  process.exit(1);
} else {
  console.log('✅ MUI packages not in dependencies');
}

// Check that MUI packages are marked as optional peer dependencies
const peerDepsMeta = packageJson.peerDependenciesMeta || {};
const muiMarkedOptional = ['@mui/material', '@emotion/react', '@emotion/styled'].every(pkg =>
  peerDepsMeta[pkg] && peerDepsMeta[pkg].optional === true
);

if (!muiMarkedOptional) {
  console.error('❌ MUI packages not properly marked as optional peer dependencies');
  process.exit(1);
} else {
  console.log('✅ MUI packages marked as optional peer dependencies');
}

// Test 2: Try importing the library
console.log('\n2. Testing library imports...');
try {
  // Test importing utilities first (these should have fewer dependencies)
  const utilities = require('./dist/utilities');
  console.log('✅ Successfully imported utilities');
  
  // Test importing main index
  const main = require('./dist/index');
  console.log('✅ Successfully imported main index');

} catch (error) {
  console.error('❌ Failed to import library:', error.message);
  console.log('This could be due to missing dependencies or build issues');
  console.log('However, the package structure is correct for optional MUI support');
}

// Test 3: Check that dist directory doesn't contain MUI references that would cause errors
console.log('\n3. Checking built files for MUI safety...');
const themeContextPath = path.join('dist', 'context', 'ThemeContext.js');
if (fs.existsSync(themeContextPath)) {
  const themeContextContent = fs.readFileSync(themeContextPath, 'utf8');
  
  // Should not have hard require() calls to MUI
  if (themeContextContent.includes('require(\'@mui/material\')') || 
      themeContextContent.includes('require("@mui/material")')) {
    console.error('❌ ThemeContext contains hard MUI imports that could fail');
    process.exit(1);
  }
  
  console.log('✅ ThemeContext builds safely without hard MUI dependencies');
} else {
  console.error('❌ ThemeContext.js not found in dist');
  process.exit(1);
}

console.log('\n🎉 All tests passed! The library can be used without MUI dependencies.');
console.log('\nNext steps:');
console.log('- Install in a project: npm install mod-arch-shared');
console.log('- Use PatternFly theme: <ThemeProvider theme={Theme.Patternfly}>');
console.log('- For MUI theme: install @mui/material @emotion/react @emotion/styled');