const path = require('path');
const { ModuleFederationPlugin } = require('@module-federation/enhanced/webpack');

const deps = require('../package.json').dependencies;

const moduleFederationConfig = {
  name: 'modArch',
  filename: 'remoteEntry.js',

  shared: {
    react: { singleton: true, eager: true, requiredVersion: deps.react },
    'react-dom': { singleton: true, eager: true, requiredVersion: deps['react-dom'] },
    'react-router': { singleton: true, eager: true, requiredVersion: deps['react-router'] },
    'react-router-dom': { singleton: true, eager: true, requiredVersion: deps['react-router-dom'] },
  },
  exposes: {
    // './index': './src/plugin/index.tsx',
    // './plugin': './src/plugin/index.tsx',
  },
  // For module federation to work when optimization.runtimeChunk="single":
  // See https://github.com/webpack/webpack/issues/18810
  runtime: false,
  dts: false,
};

module.exports = {
  moduleFederationPlugins: [new ModuleFederationPlugin(moduleFederationConfig)],
};
