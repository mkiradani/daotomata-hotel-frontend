import { test, expect } from '@playwright/test';

test.describe('Guest Directory Fix #15', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-directory');
  });

  test('should display guest directory sections correctly', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Guest Directory/);
    
    // Check that the main heading exists
    const heading = page.locator('h1').filter({ hasText: 'Guest Directory' });
    await expect(heading).toBeVisible();
    
    // Check that at least one directory card is visible
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
    
    // Verify that the cards have content (not empty)
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    // Check that each card has required elements
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      
      // Each card should have a title
      const cardTitle = card.locator('.card-title');
      await expect(cardTitle).toBeVisible();
      
      // Each card should have an icon
      const icon = card.locator('.text-4xl');
      await expect(icon).toBeVisible();
      
      // Each card should have a description
      const description = card.locator('p.text-base-content\\/70');
      await expect(description).toBeVisible();
      
      // Each card should have an explore button
      const button = card.locator('.btn-primary');
      await expect(button).toBeVisible();
      await expect(button).toContainText('Explore');
      
      // Each card should have a badge showing count
      const badge = card.locator('.badge-secondary');
      await expect(badge).toBeVisible();
      await expect(badge).toContainText('options');
    }
  });

  test('should navigate to dining section when clicking explore', async ({ page }) => {
    // Find and click the Dining card's explore button
    const diningCard = page.locator('.card').filter({ has: page.locator('.card-title:has-text("Dining")') });
    const exploreButton = diningCard.locator('.btn-primary');
    
    // Click the explore button
    await exploreButton.click();
    
    // Should navigate to dining page
    await expect(page).toHaveURL(/\/guest-directory\/dining/);
    
    // Check that dining page loads correctly
    const diningHeading = page.locator('h1').filter({ hasText: 'Dining Guide' });
    await expect(diningHeading).toBeVisible();
  });

  test('should display correct section counts', async ({ page }) => {
    // Get all badges with counts
    const badges = page.locator('.badge-secondary');
    const badgeCount = await badges.count();
    
    // Each badge should contain a number followed by "options"
    for (let i = 0; i < badgeCount; i++) {
      const badgeText = await badges.nth(i).textContent();
      expect(badgeText).toMatch(/^\d+ options$/);
    }
  });

  test('should have proper styling and hover effects', async ({ page }) => {
    // Get first card
    const firstCard = page.locator('.card').first();
    
    // Check initial styling
    await expect(firstCard).toHaveClass(/bg-base-100/);
    await expect(firstCard).toHaveClass(/shadow-lg/);
    
    // Check hover effect class exists
    await expect(firstCard).toHaveClass(/hover:shadow-xl/);
    
    // The transition class should be present
    await expect(firstCard).toHaveClass(/transition-shadow/);
  });

  test('should display CTA section at the bottom', async ({ page }) => {
    // Scroll to bottom to ensure CTA is in view
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check CTA title
    const ctaTitle = page.locator('h2').filter({ hasText: 'Need Personal Assistance?' });
    await expect(ctaTitle).toBeVisible();
    
    // Check CTA buttons
    const contactButton = page.locator('.btn-primary').filter({ hasText: 'Contact Concierge' });
    const callButton = page.locator('.btn-outline').filter({ hasText: 'Call Front Desk' });
    
    await expect(contactButton).toBeVisible();
    await expect(callButton).toBeVisible();
  });
});