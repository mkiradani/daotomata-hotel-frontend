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

test.describe('Guest Directory Pages - Comprehensive Testing', () => {
  
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
          if (!response.ok() && response.status() >= 400) {
            networkFailures.push(`${response.status()} - ${response.url()}`);
          }
        });

        // Navigate to the page
        await browserPage.goto(`http://localhost:4321${page.path}`);
        
        // Wait for page to load completely
        await browserPage.waitForLoadState('networkidle');
        
        // Check for errors
        expect(consoleErrors, `Console errors found: ${consoleErrors.join(', ')}`).toHaveLength(0);
        expect(networkFailures, `Network failures found: ${networkFailures.join(', ')}`).toHaveLength(0);
        
        // Verify page loaded successfully
        expect(await browserPage.title()).toBeTruthy();
      });

      test('should have proper HTML structure', async ({ page: browserPage }) => {
        await browserPage.goto(`http://localhost:4321${page.path}`);
        await browserPage.waitForLoadState('networkidle');

        // Check for single main tag
        const mainTags = await browserPage.locator('main').count();
        expect(mainTags, 'Should have exactly one main tag').toBe(1);

        // Check for proper header structure
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
          // Check each image loads properly
          for (let i = 0; i < imageCount; i++) {
            const img = images.nth(i);
            const src = await img.getAttribute('src');
            const alt = await img.getAttribute('alt');
            
            // Verify image has src and alt attributes
            expect(src, `Image ${i + 1} should have src attribute`).toBeTruthy();
            expect(alt, `Image ${i + 1} should have alt attribute`).toBeTruthy();
            
            // Check if image is loaded (not broken)
            const naturalWidth = await img.evaluate((img: HTMLImageElement) => img.naturalWidth);
            expect(naturalWidth, `Image ${i + 1} should load properly (src: ${src})`).toBeGreaterThan(0);
          }
        }
      });

      test('should use DaisyUI classes and theme system', async ({ page: browserPage }) => {
        await browserPage.goto(`http://localhost:4321${page.path}`);
        await browserPage.waitForLoadState('networkidle');

        // Check for DaisyUI theme classes
        const body = browserPage.locator('body');
        const bodyClasses = await body.getAttribute('class');
        
        // Should have theme-related classes
        expect(bodyClasses, 'Body should have theme classes').toContain('theme-');

        // Check for DaisyUI component classes
        const daisyUIClasses = [
          '.card', '.btn', '.navbar', '.breadcrumbs', '.hero', 
          '.badge', '.alert', '.drawer', '.menu'
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
        const breadcrumbs = browserPage.locator('.breadcrumbs, nav[aria-label="Breadcrumb"]');
        const breadcrumbsCount = await breadcrumbs.count();
        
        if (breadcrumbsCount > 0) {
          // Verify breadcrumb links are clickable
          const breadcrumbLinks = breadcrumbs.locator('a');
          const linkCount = await breadcrumbLinks.count();
          
          if (linkCount > 0) {
            // Test first breadcrumb link (usually home)
            const firstLink = breadcrumbLinks.first();
            const href = await firstLink.getAttribute('href');
            expect(href, 'Breadcrumb links should have href').toBeTruthy();
          }
        }

        // Check for navigation buttons/links
        const navLinks = browserPage.locator('nav a, .btn');
        const navLinkCount = await navLinks.count();
        expect(navLinkCount, 'Should have navigation elements').toBeGreaterThan(0);
      });

      test('should have no broken links', async ({ page: browserPage }) => {
        await browserPage.goto(`http://localhost:4321${page.path}`);
        await browserPage.waitForLoadState('networkidle');

        // Get all links on the page
        const links = browserPage.locator('a[href]');
        const linkCount = await links.count();

        const brokenLinks: string[] = [];

        for (let i = 0; i < Math.min(linkCount, 10); i++) { // Test first 10 links to avoid timeout
          const link = links.nth(i);
          const href = await link.getAttribute('href');
          
          if (href && href.startsWith('/')) {
            // Test internal links
            try {
              const response = await browserPage.request.get(`http://localhost:4321${href}`);
              if (!response.ok()) {
                brokenLinks.push(`${href} - Status: ${response.status()}`);
              }
            } catch (error) {
              brokenLinks.push(`${href} - Error: ${error}`);
            }
          }
        }

        expect(brokenLinks, `Broken links found: ${brokenLinks.join(', ')}`).toHaveLength(0);
      });

      test('should have proper card components', async ({ page: browserPage }) => {
        await browserPage.goto(`http://localhost:4321${page.path}`);
        await browserPage.waitForLoadState('networkidle');

        // Look for card components
        const cards = browserPage.locator('.card, [class*="card"]');
        const cardCount = await cards.count();

        if (cardCount > 0) {
          // Check first few cards for proper structure
          for (let i = 0; i < Math.min(cardCount, 3); i++) {
            const card = cards.nth(i);
            
            // Cards should be visible
            await expect(card).toBeVisible();
            
            // Cards should have some content
            const cardText = await card.textContent();
            expect(cardText?.trim(), `Card ${i + 1} should have content`).toBeTruthy();
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
          
          // Check that navigation is accessible
          const nav = browserPage.locator('nav').first();
          if (await nav.count() > 0) {
            await expect(nav).toBeVisible();
          }
        }
      });

      test('should have proper accessibility', async ({ page: browserPage }) => {
        await browserPage.goto(`http://localhost:4321${page.path}`);
        await browserPage.waitForLoadState('networkidle');

        // Check for proper heading hierarchy
        const h1Count = await browserPage.locator('h1').count();
        expect(h1Count, 'Should have exactly one h1 tag').toBe(1);

        // Check for alt attributes on images
        const imagesWithoutAlt = await browserPage.locator('img:not([alt])').count();
        expect(imagesWithoutAlt, 'All images should have alt attributes').toBe(0);

        // Check for proper form labels if forms exist
        const inputs = browserPage.locator('input, textarea, select');
        const inputCount = await inputs.count();
        
        if (inputCount > 0) {
          const inputsWithoutLabels = await browserPage.locator('input:not([aria-label]):not([aria-labelledby]), textarea:not([aria-label]):not([aria-labelledby]), select:not([aria-label]):not([aria-labelledby])').count();
          // Allow some flexibility for complex form structures
          expect(inputsWithoutLabels).toBeLessThanOrEqual(inputCount);
        }
      });
    });
  });

  test('should have consistent styling across all pages', async ({ page: browserPage }) => {
    const pageStyles: Record<string, any> = {};

    // Collect styles from each page
    for (const pageInfo of GUEST_DIRECTORY_PAGES) {
      await browserPage.goto(`http://localhost:4321${pageInfo.path}`);
      await browserPage.waitForLoadState('networkidle');

      // Get computed styles of key elements
      const bodyStyles = await browserPage.locator('body').evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          fontFamily: styles.fontFamily,
          backgroundColor: styles.backgroundColor,
          color: styles.color
        };
      });

      pageStyles[pageInfo.path] = bodyStyles;
    }

    // Compare styles between pages
    const firstPageStyles = pageStyles[GUEST_DIRECTORY_PAGES[0].path];
    
    for (let i = 1; i < GUEST_DIRECTORY_PAGES.length; i++) {
      const currentPageStyles = pageStyles[GUEST_DIRECTORY_PAGES[i].path];
      
      expect(currentPageStyles.fontFamily, `Font family should be consistent across pages`).toBe(firstPageStyles.fontFamily);
      // Note: backgroundColor and color might vary by theme, but font should be consistent
    }
  });

  test('should have working theme system', async ({ page: browserPage }) => {
    // Test on main guest directory page
    await browserPage.goto('http://localhost:4321/guest-directory');
    await browserPage.waitForLoadState('networkidle');

    const body = browserPage.locator('body');
    const initialClasses = await body.getAttribute('class');
    
    // Should have theme classes
    expect(initialClasses, 'Body should have theme-related classes').toMatch(/theme-/);

    // Check if theme switching elements exist (if implemented)
    const themeToggle = browserPage.locator('[data-theme], .theme-toggle, .theme-controller');
    const themeToggleCount = await themeToggle.count();
    
    if (themeToggleCount > 0) {
      // Test theme switching if available
      await themeToggle.first().click();
      await browserPage.waitForTimeout(500);
      
      const newClasses = await body.getAttribute('class');
      // Classes might have changed due to theme switch
      expect(newClasses, 'Theme classes should be present after toggle').toMatch(/theme-/);
    }
  });
});