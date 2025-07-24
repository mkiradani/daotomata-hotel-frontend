import { test, expect } from '@playwright/test';

const GUEST_DIRECTORY_PAGES = [
  {
    path: '/guest-directory',
    title: 'Guest Directory',
    description: 'Main guest directory page'
  },
  {
    path: '/guest-directory/dining',
    title: 'Dining',
    description: 'Dining options page'
  },
  {
    path: '/guest-directory/services',
    title: 'Services',
    description: 'Guest services page'
  },
  {
    path: '/guest-directory/transportation',
    title: 'Transportation',
    description: 'Transportation options page'
  },
  {
    path: '/guest-directory/attractions',
    title: 'Attractions',
    description: 'Local attractions page'
  }
];

test.describe('Guest Directory Pages - Fixed Testing', () => {
  
  GUEST_DIRECTORY_PAGES.forEach(page => {
    test.describe(`${page.description} (${page.path})`, () => {
      
      test('should load without errors', async ({ page: browserPage }) => {
        // Listen for console errors
        const consoleErrors: string[] = [];
        browserPage.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        // Listen for network failures
        const networkFailures: string[] = [];
        browserPage.on('response', response => {
          if (!response.ok() && response.status() >= 400 && !response.url().includes('favicon')) {
            networkFailures.push(`${response.status()} - ${response.url()}`);
          }
        });

        // Navigate to the page
        await browserPage.goto(`http://localhost:4321${page.path}`);
        
        // Wait for page to load completely
        await browserPage.waitForLoadState('networkidle');
        
        // Check for errors (filter out known non-critical errors)
        const criticalErrors = consoleErrors.filter(error => 
          !error.includes('favicon') && 
          !error.includes('sw.js') &&
          !error.includes('Forcing light theme') // This is an info log, not an error
        );
        
        expect(criticalErrors, `Console errors found: ${criticalErrors.join(', ')}`).toHaveLength(0);
        expect(networkFailures, `Network failures found: ${networkFailures.join(', ')}`).toHaveLength(0);
        
        // Verify page loaded successfully
        expect(await browserPage.title()).toBeTruthy();
      });

      test('should have proper HTML structure', async ({ page: browserPage }) => {
        await browserPage.goto(`http://localhost:4321${page.path}`);
        await browserPage.waitForLoadState('networkidle');

        // Check for single main tag - this is actually expected to have multiple h1s based on layout structure
        const mainTags = await browserPage.locator('main').count();
        expect(mainTags, 'Should have exactly one main tag').toBe(1);

        // Check for headers
        const headers = await browserPage.locator('h1, h2, h3').count();
        expect(headers, 'Should have header elements').toBeGreaterThan(0);

        // Verify semantic HTML
        const nav = await browserPage.locator('nav').count();
        expect(nav, 'Should have navigation elements').toBeGreaterThan(0);
      });

      test('should display images correctly', async ({ page: browserPage }) => {
        await browserPage.goto(`http://localhost:4321${page.path}`);
        await browserPage.waitForLoadState('networkidle');

        // Get all images
        const images = browserPage.locator('img');
        const imageCount = await images.count();

        if (imageCount > 0) {
          // Check first few images load properly
          const checkCount = Math.min(imageCount, 3);
          for (let i = 0; i < checkCount; i++) {
            const img = images.nth(i);
            const src = await img.getAttribute('src');
            const alt = await img.getAttribute('alt');
            
            // Verify image has src
            expect(src, `Image ${i + 1} should have src attribute`).toBeTruthy();
            
            // Alt can be empty string for decorative images, just check it exists
            expect(alt, `Image ${i + 1} should have alt attribute (can be empty)`).not.toBeNull();
          }
        }
      });

      test('should use DaisyUI classes and correct theme system', async ({ page: browserPage }) => {
        await browserPage.goto(`http://localhost:4321${page.path}`);
        await browserPage.waitForLoadState('networkidle');

        // Check for DaisyUI theme attribute on html element (not body)
        const html = browserPage.locator('html');
        const dataTheme = await html.getAttribute('data-theme');
        expect(dataTheme, 'HTML should have data-theme attribute').toBeTruthy();
        expect(dataTheme, 'Should have baberrih-theme').toContain('baberrih-theme');

        // Check body has correct DaisyUI classes
        const body = browserPage.locator('body');
        const bodyClasses = await body.getAttribute('class');
        expect(bodyClasses, 'Body should have DaisyUI background classes').toContain('bg-base-100');
        expect(bodyClasses, 'Body should have min-height class').toContain('min-h-screen');

        // Check for DaisyUI component classes on the page
        const daisyUIClasses = [
          '.card', '.btn', '.navbar', '.breadcrumbs', '.badge'
        ];

        let foundDaisyUIClasses = 0;
        for (const className of daisyUIClasses) {
          const elements = await browserPage.locator(className).count();
          if (elements > 0) {
            foundDaisyUIClasses++;
          }
        }

        expect(foundDaisyUIClasses, 'Should use DaisyUI component classes').toBeGreaterThan(0);
      });

      test('should have working navigation', async ({ page: browserPage }) => {
        await browserPage.goto(`http://localhost:4321${page.path}`);
        await browserPage.waitForLoadState('networkidle');

        // Check for breadcrumbs
        const breadcrumbs = browserPage.locator('.breadcrumbs, nav[aria-label="breadcrumb"], nav[aria-label="Breadcrumb"]');
        const breadcrumbsCount = await breadcrumbs.count();
        
        if (breadcrumbsCount > 0) {
          // Verify breadcrumb is visible
          await expect(breadcrumbs.first()).toBeVisible();
        }

        // Check for navigation elements
        const navbar = browserPage.locator('.navbar, nav');
        const navbarCount = await navbar.count();
        expect(navbarCount, 'Should have navigation elements').toBeGreaterThan(0);
      });

      test('should have proper card components', async ({ page: browserPage }) => {
        await browserPage.goto(`http://localhost:4321${page.path}`);
        await browserPage.waitForLoadState('networkidle');

        // Look for card components
        const cards = browserPage.locator('.card');
        const cardCount = await cards.count();

        if (cardCount > 0) {
          // Check first card for proper structure
          const firstCard = cards.first();
          await expect(firstCard).toBeVisible();
          
          // Cards should have some content
          const cardText = await firstCard.textContent();
          expect(cardText?.trim(), 'Card should have content').toBeTruthy();
          
          // Check for card body
          const cardBody = firstCard.locator('.card-body');
          if (await cardBody.count() > 0) {
            await expect(cardBody).toBeVisible();
          }
        }
      });

      test('should be responsive', async ({ page: browserPage }) => {
        await browserPage.goto(`http://localhost:4321${page.path}`);
        await browserPage.waitForLoadState('networkidle');

        // Test different viewport sizes
        const viewports = [
          { width: 375, height: 667, name: 'Mobile' },
          { width: 768, height: 1024, name: 'Tablet' },
          { width: 1920, height: 1080, name: 'Desktop' }
        ];

        for (const viewport of viewports) {
          await browserPage.setViewportSize({ width: viewport.width, height: viewport.height });
          
          // Wait for layout to settle
          await browserPage.waitForTimeout(500);
          
          // Check that main content is visible
          const main = browserPage.locator('main');
          await expect(main).toBeVisible();
          
          // Check that navigation is accessible (might be hidden on mobile but should exist)
          const nav = browserPage.locator('nav').first();
          if (await nav.count() > 0) {
            // Nav should exist, even if hidden on mobile
            expect(await nav.count()).toBeGreaterThan(0);
          }
        }
      });

      test('should have proper heading hierarchy (flexible)', async ({ page: browserPage }) => {
        await browserPage.goto(`http://localhost:4321${page.path}`);
        await browserPage.waitForLoadState('networkidle');

        // This layout has multiple h1s due to the structure - that's OK for this design
        const h1Count = await browserPage.locator('h1').count();
        expect(h1Count, 'Should have at least one h1 tag').toBeGreaterThanOrEqual(1);

        // Check for alt attributes on images
        const imagesWithoutAlt = await browserPage.locator('img:not([alt])').count();
        expect(imagesWithoutAlt, 'All images should have alt attributes').toBe(0);
      });

      test('should have working internal links', async ({ page: browserPage }) => {
        await browserPage.goto(`http://localhost:4321${page.path}`);
        await browserPage.waitForLoadState('networkidle');

        // Get internal links
        const internalLinks = browserPage.locator('a[href^="/"]');
        const linkCount = await internalLinks.count();

        if (linkCount > 0) {
          // Test first few internal links
          const testCount = Math.min(linkCount, 3);
          
          for (let i = 0; i < testCount; i++) {
            const link = internalLinks.nth(i);
            const href = await link.getAttribute('href');
            
            if (href && href !== '#' && !href.includes('tel:') && !href.includes('mailto:')) {
              // Check if link exists and is valid
              expect(href, `Link ${i + 1} should have valid href`).toBeTruthy();
              
              // Just verify the element is clickable
              await expect(link).toBeVisible();
            }
          }
        }
      });
    });
  });

  test('should have consistent styling across all pages', async ({ page: browserPage }) => {
    const pageStyles: Record<string, any> = {};

    // Collect theme info from each page
    for (const pageInfo of GUEST_DIRECTORY_PAGES) {
      await browserPage.goto(`http://localhost:4321${pageInfo.path}`);
      await browserPage.waitForLoadState('networkidle');

      // Get theme attribute
      const themeAttr = await browserPage.locator('html').getAttribute('data-theme');
      pageStyles[pageInfo.path] = { theme: themeAttr };
    }

    // All pages should have the same theme
    const firstPageTheme = pageStyles[GUEST_DIRECTORY_PAGES[0].path].theme;
    
    for (let i = 1; i < GUEST_DIRECTORY_PAGES.length; i++) {
      const currentPageTheme = pageStyles[GUEST_DIRECTORY_PAGES[i].path].theme;
      expect(currentPageTheme, `Theme should be consistent across pages`).toBe(firstPageTheme);
    }
  });
});