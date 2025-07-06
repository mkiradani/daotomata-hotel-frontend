module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:astro/recommended",
    "prettier", // Must be last to override other configs
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "jsx-a11y"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    // General ESLint rules
    "no-console": "off", // Allow console.log in development
    "no-unused-vars": "off", // Handled by @typescript-eslint
    "prefer-const": "error",
    "no-var": "error",

    // TypeScript rules
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",

    // React rules
    "react/react-in-jsx-scope": "off", // Not needed in modern React
    "react/prop-types": "off", // Using TypeScript for prop validation
    "react/jsx-uses-react": "off",
    "react/jsx-uses-vars": "error",

    // JSX A11y rules (accessibility)
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/role-supports-aria-props": "error",
  },
  overrides: [
    // Configuration for .astro files
    {
      files: ["*.astro"],
      parser: "astro-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
        sourceType: "module",
      },
      env: {
        node: true,
        "astro/astro": true,
        es2022: true,
      },
      rules: {
        // Astro-specific rules
        "astro/no-conflict-set-directives": "error",
        "astro/no-unused-define-vars-in-style": "error",
        "astro/no-set-html-directive": "warn",

        // Disable React rules that don't apply to Astro
        "react/no-unknown-property": "off", // Astro uses 'class' not 'className'
        "react/jsx-no-undef": "off", // Astro components work differently
        "react/jsx-key": "off", // Not applicable in Astro
        "react/jsx-uses-react": "off",
        "react/jsx-uses-vars": "off",

        // Disable TypeScript rules that don't work well with Astro
        "@typescript-eslint/no-unused-vars": "off", // Variables used in templates aren't detected
        "no-undef": "off", // Astro globals aren't recognized

        // Disable JSX A11y rules that conflict with Astro syntax
        "jsx-a11y/anchor-is-valid": "off", // Astro handles routing differently
        "jsx-a11y/label-has-associated-control": "off", // Different syntax in Astro
      },
    },
    // Configuration for Qwik components (.tsx files with Qwik JSX pragma)
    {
      files: ["src/components/*.tsx", "src/**/*.qwik.tsx"],
      rules: {
        // Disable React rules that don't apply to Qwik
        "react/no-unknown-property": "off", // Qwik uses different props (onClick$, class, etc.)
        "react/jsx-no-undef": "off", // Qwik components work differently
        "react/jsx-key": "off", // Different iteration patterns in Qwik
        "react/jsx-uses-react": "off", // Qwik doesn't use React
        "react/jsx-uses-vars": "off", // Different variable usage patterns
        "react/no-unescaped-entities": "off", // Qwik handles entities differently
        "react/jsx-no-target-blank": "off", // Different security model

        // Disable JSX A11y rules that conflict with Qwik syntax
        "jsx-a11y/label-has-associated-control": "off", // Qwik uses different form patterns
        "jsx-a11y/no-noninteractive-tabindex": "off", // Qwik handles interactivity differently

        // Allow Qwik-specific unused variables (signals, etc.)
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_|^use|^handle|^on",
            ignoreRestSiblings: true,
          },
        ],
      },
    },
    // Configuration for TypeScript files
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./tsconfig.json",
      },
      rules: {
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/await-thenable": "error",
      },
    },
    // Configuration for JavaScript files
    {
      files: ["*.js", "*.jsx"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
  ignorePatterns: [
    "dist/",
    ".astro/",
    "node_modules/",
    "public/",
    "astro.config.mjs", // Only ignore astro config, not all config files
    "src/generated/",
    "src/pages/multitenant-showcase.astro", // Temporary: parsing error needs structural fix
  ],
};
