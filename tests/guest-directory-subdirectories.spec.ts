import { test, expect } from '@playwright/test';

const GUEST_DIRECTORY_PAGES = [
  { path: '/guest-directory', name: 'Main Guest Directory' },
  { path: '/guest-directory/dining', name: 'Dining' },
  { path: '/guest-directory/services', name: 'Services' },
  { path: '/guest-directory/transportation', name: 'Transportation' },
  { path: '/guest-directory/attractions', name: 'Attractions' }
];

test.describe('Guest Directory - All Subdirectories Content Display', () => {
  
  GUEST_DIRECTORY_PAGES.forEach(({ path, name }) => {
    test(`${name} page should display content correctly`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      // Check that the page title is correct
      await expect(page).toHaveTitle(new RegExp(name === 'Main Guest Directory' ? 'Guest Directory' : name));
      
      // Check that the main heading exists (first h1 on page)
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
      
      // Check that at least one card is visible (content is displayed)
      const cards = page.locator('.card');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        // If there are cards, verify they have content
        await expect(cards.first()).toBeVisible();
        
        // Each card should have a title
        const cardTitle = cards.first().locator('.card-title, h2, h3');
        await expect(cardTitle).toBeVisible();
        
        // Each card should have some text content
        const cardBody = cards.first().locator('.card-body');
        await expect(cardBody).toBeVisible();
        
        console.log(`✅ ${name}: Found ${cardCount} cards with content`);
      } else {
        // If no cards, check for "No content" message or similar
        const noContentMessage = page.locator('text=/no.*available/i, text=/empty/i, text=/coming soon/i');
        const hasNoContentMessage = await noContentMessage.count() > 0;
        
        if (!hasNoContentMessage) {
          throw new Error(`❌ ${name}: No cards found and no "no content" message displayed`);
        }
        
        console.log(`⚠️  ${name}: No content available (expected behavior)`);
      }
      
      // Check that CTA section exists at the bottom  
      const ctaSection = page.locator('section').filter({ has: page.locator('h2') }).last();
      await expect(ctaSection).toBeVisible();
    });
  });

  test('Navigation between guest directory pages works', async ({ page }) => {
    // Start at main guest directory
    await page.goto('/guest-directory');
    await page.waitForLoadState('networkidle');
    
    // Click on dining card if it exists
    const diningCard = page.locator('.card').filter({ has: page.locator('text=/dining/i') });
    if (await diningCard.count() > 0) {
      const exploreButton = diningCard.locator('.btn-primary, a[href*="dining"]').first();
      await exploreButton.click();
      
      // Should navigate to dining page
      await expect(page).toHaveURL(/\/guest-directory\/dining/);
      
      // Verify dining page loads
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('All pages have proper breadcrumb navigation', async ({ page }) => {
    for (const { path } of GUEST_DIRECTORY_PAGES) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      // Check for breadcrumb component
      const breadcrumb = page.locator('nav, .breadcrumb, [aria-label*="breadcrumb"]');
      
      if (path !== '/guest-directory') {
        // Subpages should have breadcrumbs
        await expect(breadcrumb).toBeVisible();
        
        // Should contain "Guest Directory" text for subpages
        const guestDirectoryText = page.locator('text="Guest Directory"');
        await expect(guestDirectoryText).toBeVisible();
      }
    }
  });
});