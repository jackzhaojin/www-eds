module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
  },
  overrides: [{
    // Explainer engines are ports of the source's per-article scripts: loop and
    // reassignment idioms are kept so the port stays checkable against the source.
    files: ['blocks/explainer/engines/*.js'],
    rules: {
      'no-plusplus': 'off',
      'no-param-reassign': 'off',
      'no-nested-ternary': 'off',
      'no-restricted-syntax': 'off',
      'no-await-in-loop': 'off',
      'no-mixed-operators': 'off',
      'max-len': ['error', {
        code: 140, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreRegExpLiterals: true,
      }],
    },
  }],
};
