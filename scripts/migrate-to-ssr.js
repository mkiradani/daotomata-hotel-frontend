#!/usr/bin/env node

/**
 * Script to migrate Astro pages from SSG to SSR
 * Replaces getStaticPaths with runtime detection logic
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SSR template for simple pages (facilities, experiences, restaurant, etc.)
const SSR_TEMPLATE_SIMPLE = `// SSR mode - detect hotel from runtime request
const isSubdomain = isSubdomainBasedRouting(Astro.url.hostname);
const hotelDomain = getHotelDomainFromRequest(Astro.url, Astro.params);
const hotelSubdomain = isSubdomain 
  ? getSubdomainFromHostname(Astro.url.hostname) 
  : Astro.params.hotel;

console.log(
  \`🏨 SSR Loading PAGE_NAME for subdomain: \${hotelSubdomain}, full domain: \${hotelDomain}\`
);

// Get hotel data from Directus
const hotel = await getHotelByDomain(hotelDomain);

if (!hotel) {
  console.error(\`❌ Hotel not found for domain: \${hotelDomain}\`);
  return Astro.redirect('/404');
}

// Extract hotel properties for SSR mode
const hotelId = hotel.id;
const hotelName = hotel.name;
const defaultLanguage = hotel.default_language || 'en-US';
const defaultCurrency = hotel.default_currency || 'USD';`;

// SSR template for detail pages (activities/[slug], facilities/[slug])
const SSR_TEMPLATE_DETAIL = `// SSR mode - detect hotel from runtime request
const isSubdomain = isSubdomainBasedRouting(Astro.url.hostname);
const hotelDomain = getHotelDomainFromRequest(Astro.url, Astro.params);
const hotelSubdomain = isSubdomain 
  ? getSubdomainFromHostname(Astro.url.hostname) 
  : Astro.params.hotel;

console.log(
  \`🏨 SSR Loading ITEM_TYPE page for subdomain: \${hotelSubdomain}, slug: \${Astro.params.slug}\`
);

// Get hotel data from Directus
const hotel = await getHotelByDomain(hotelDomain);

if (!hotel) {
  console.error(\`❌ Hotel not found for domain: \${hotelDomain}\`);
  return Astro.redirect('/404');
}

// Find the ITEM_TYPE by slug
const itemSlug = Astro.params.slug;
const item = hotel.COLLECTION_NAME?.find(item => {
  const slug = item.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug === itemSlug;
});

if (!item) {
  console.error(\`❌ ITEM_TYPE not found for slug: \${itemSlug}\`);
  return Astro.redirect('/404');
}

// Default values
const defaultLanguage = hotel.default_language || 'en-US';
const defaultCurrency = hotel.default_currency || 'USD';`;

// Required imports for SSR
const SSR_IMPORTS = `import { 
  isSubdomainBasedRouting, 
  getHotelDomainFromRequest, 
  getSubdomainFromHostname 
} from '../../lib/domain-mapping.js';`;

const SSR_IMPORTS_DETAIL = `import { 
  isSubdomainBasedRouting, 
  getHotelDomainFromRequest, 
  getSubdomainFromHostname 
} from '../../../lib/domain-mapping.js';`;

// Files to migrate
const MIGRATION_CONFIG = [
  {
    file: 'src/pages/[hotel]/facilities.astro',
    type: 'simple',
    pageName: 'facilities page',
    propsPattern:
      /const\s*{\s*hotel:\s*hotelData,\s*hotelSubdomain,\s*defaultLanguage,\s*isSubdomain,?\s*}\s*=\s*Astro\.props;/,
    newProps: `// SSR variables
const hotelData = hotel;`,
  },
  {
    file: 'src/pages/[hotel]/experiences.astro',
    type: 'simple',
    pageName: 'experiences page',
    propsPattern:
      /const\s*{\s*hotel:\s*hotelData,\s*hotelSubdomain,\s*defaultLanguage,\s*defaultCurrency,\s*isSubdomain,?\s*}\s*=\s*Astro\.props;/,
    newProps: `// SSR variables
const hotelData = hotel;`,
  },
  {
    file: 'src/pages/[hotel]/restaurant.astro',
    type: 'simple',
    pageName: 'restaurant page',
    propsPattern:
      /const\s*{\s*hotel:\s*hotelData,\s*hotelSubdomain,\s*defaultLanguage,\s*defaultCurrency,\s*isSubdomain,?\s*}\s*=\s*Astro\.props;/,
    newProps: `// SSR variables
const hotelData = hotel;`,
  },
  {
    file: 'src/pages/[hotel]/book.astro',
    type: 'simple',
    pageName: 'booking page',
    propsPattern:
      /const\s*{\s*hotel,\s*hotelSubdomain,\s*defaultLanguage,\s*defaultCurrency,\s*isSubdomain,?\s*}\s*=\s*Astro\.props;/,
    newProps: `// SSR variables already defined above`,
  },
];

function migrateFile(config) {
  const filePath = path.join(__dirname, '..', config.file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${config.file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already migrated
  if (content.includes('isSubdomainBasedRouting(Astro.url.hostname)')) {
    console.log(`✅ Already migrated: ${config.file}`);
    return;
  }

  console.log(`🔄 Migrating: ${config.file}`);

  // Add SSR imports
  const importPattern = /import\s+{[^}]+}\s+from\s+['"][^'"]*directus\.js['"];/;
  const imports = config.type === 'detail' ? SSR_IMPORTS_DETAIL : SSR_IMPORTS;
  content = content.replace(importPattern, (match) => `${match}\n${imports}`);

  // Remove getStaticPaths function
  const getStaticPathsPattern =
    /export\s+async\s+function\s+getStaticPaths\(\)\s*{[\s\S]*?^}/m;
  content = content.replace(getStaticPathsPattern, '');

  // Replace props destructuring with SSR logic
  const template = SSR_TEMPLATE_SIMPLE.replace('PAGE_NAME', config.pageName);
  content = content.replace(
    config.propsPattern,
    `${template}\n\n${config.newProps}`
  );

  // Clean up extra newlines
  content = content.replace(/\n{3,}/g, '\n\n');

  fs.writeFileSync(filePath, content);
  console.log(`✅ Migrated: ${config.file}`);
}

// Run migrations
console.log('🚀 Starting SSG to SSR migration...');

MIGRATION_CONFIG.forEach(migrateFile);

console.log('✅ Migration completed!');
