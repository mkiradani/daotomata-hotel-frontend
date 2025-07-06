/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  // JavaScript/TypeScript files in src/ - run ESLint with auto-fix, then format
  "src/**/*.{js,jsx,ts,tsx}": [
    "eslint --fix --max-warnings=0",
    "prettier --write",
  ],

  // Config files in root - format only (ESLint can be too strict for config files)
  "*.{js,mjs,cjs}": ["prettier --write"],

  // Astro files - run ESLint with auto-fix, then format
  "*.astro": ["eslint --fix --max-warnings=0", "prettier --write"],

  // JSON, Markdown, YAML files - format only
  "*.{json,md,yaml,yml}": ["prettier --write"],

  // CSS files - format only (no stylelint configured yet)
  "*.{css,scss}": ["prettier --write"],
};
