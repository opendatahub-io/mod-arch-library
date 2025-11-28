module.exports = require('@odh-dashboard/eslint-config')
  .extend({
    ignorePatterns: ['api', 'bff', 'frontend'],
  })
  .recommendedReactTypescript(__dirname);
