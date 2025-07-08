/**
 * @type {import('prettier').Config}
 */
export default {
  // Basic formatting options
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 80,

  // Plugin configuration
  plugins: ['prettier-plugin-astro'],

  // Override settings for specific file types
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};
