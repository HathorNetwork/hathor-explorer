module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: ['airbnb-base', 'plugin:react/recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: 'module',
  },
  plugins: ['react', 'prettier'],
  rules: {
    'react/prop-types': 'off', // Disable prop-types rule as this is used selectively in this repo
    'no-console': 'warn', // Warn on console statements
    'react/react-in-jsx-scope': 'off', // React 17 specific jsx-runtime enabled, so React import is not required
    'prettier/prettier': 'error', // Add Prettier errors as ESLint errors
    'arrow-parens': ['error', 'as-needed'],
    'import/no-named-as-default': 0,
    'import/prefer-default-export': 0,
    quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'comma-dangle': 0,
    'object-curly-newline': 'off', // This rule is better handled by prettier
    eqeqeq: [1, 'allow-null'],
    'no-continue': 0,
    'no-cond-assign': 1,
    'no-constant-condition': 0,
    'no-control-regex': 1,
    'no-debugger': 1,
    'no-dupe-keys': 1,
    'no-ex-assign': 1,
    'no-extra-boolean-cast': 1,
    'no-func-assign': 1,
    'no-regex-spaces': 1,
    'no-unreachable': 1,
    'no-fallthrough': 1,
    'no-lone-blocks': 1,
    'no-delete-var': 1,
    'no-shadow': 'warn',
    'no-shadow-restricted-names': 1,
    'no-undef': 2,
    'no-undef-init': 1,
    'no-use-before-define': 0,
    'no-unused-vars': [
      'warn',
      {
        vars: 'all',
        args: 'after-used',
        varsIgnorePattern: '^_', // Allow variables starting with _ to be unused
      },
    ],
    'no-underscore-dangle': 0,
    'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
    'no-await-in-loop': 'off',
    'no-plusplus': 'off',
    'guard-for-in': 'off',
    'no-bitwise': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
      },
    ],
    'jest/no-disabled-tests': 'off', // It's useful to have skipped tests on our suites

    camelcase: 'off', // Conflicts with variables obtained directly from the fullnode endpoints
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
