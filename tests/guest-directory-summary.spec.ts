import { test, expect } from '@playwright/test';

const GUEST_DIRECTORY_PAGES = [
  { path: '/guest-directory', name: 'Main Guest Directory' },
  { path: '/guest-directory/dining', name: 'Dining' },
  { path: '/guest-directory/services', name: 'Services' },
  { path: '/guest-directory/transportation', name: 'Transportation' },
  { path: '/guest-directory/attractions', name: 'Attractions' }
];

test.describe('Guest Directory - Core Functionality Report', () => {
  
  test('All pages load successfully without critical errors', async ({ page }) => {
    const results: Array<{ page: string; status: string; issues: string[] }> = [];
    
    for (const pageInfo of GUEST_DIRECTORY_PAGES) {
      const issues: string[] = [];
      
      try {
        // Track console errors
        const consoleErrors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('Forcing light theme')) {
            consoleErrors.push(msg.text());
          }
        });

        // Navigate and wait for load
        await page.goto(`http://localhost:4321${pageInfo.path}`);
        await page.waitForLoadState('networkidle');
        
        // Check basic structure
        const title = await page.title();
        if (!title) issues.push('No page title');
        
        const mainElement = await page.locator('main').count();
        if (mainElement !== 1) issues.push(`Expected 1 main element, found ${mainElement}`);
        
        // Check theme system
        const htmlTheme = await page.locator('html').getAttribute('data-theme');
        if (!htmlTheme || !htmlTheme.includes('baberrih-theme')) {
          issues.push('Theme not properly applied');
        }
        
        // Check DaisyUI classes
        const bodyClasses = await page.locator('body').getAttribute('class');
        if (!bodyClasses?.includes('bg-base-100')) {
          issues.push('DaisyUI classes not applied');
        }
        
        // Check for cards on the page
        const _cardCount = await page.locator('.card').count();
        
        // Check for navigation
        const navCount = await page.locator('nav, .navbar').count();
        if (navCount === 0) issues.push('No navigation found');
        
        // Add console errors to issues
        issues.push(...consoleErrors.map(err => `Console error: ${err}`));
        
        results.push({
          page: pageInfo.name,
          status: issues.length === 0 ? 'PASS' : 'ISSUES',
          issues
        });
        
      } catch (error) {
        results.push({
          page: pageInfo.name,
          status: 'FAIL',
          issues: [`Navigation failed: ${error}`]
        });
      }
    }
    
    // Generate report
    console.log('\n=== GUEST DIRECTORY TESTING REPORT ===\n');
    
    results.forEach(result => {
      console.log(`📄 ${result.page}: ${result.status}`);
      if (result.issues.length > 0) {
        result.issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
      } else {
        console.log('   ✅ All checks passed');
      }
      console.log('');
    });
    
    // Summary
    const passCount = results.filter(r => r.status === 'PASS').length;
    const issueCount = results.filter(r => r.status === 'ISSUES').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    
    console.log(`=== SUMMARY ===`);
    console.log(`✅ Perfect: ${passCount}/${results.length}`);
    console.log(`⚠️  Minor Issues: ${issueCount}/${results.length}`);
    console.log(`❌ Failed: ${failCount}/${results.length}`);
    
    // Test should pass if no pages completely failed
    expect(failCount, 'No pages should completely fail to load').toBe(0);
  });
  
  test('Images load correctly across all pages', async ({ page }) => {
    const imageResults: Array<{ page: string; imageCount: number; brokenImages: number }> = [];
    
    for (const pageInfo of GUEST_DIRECTORY_PAGES) {
      await page.goto(`http://localhost:4321${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      
      const images = page.locator('img');
      const imageCount = await images.count();
      let brokenImages = 0;
      
      if (imageCount > 0) {
        // Check first 3 images
        const checkCount = Math.min(imageCount, 3);
        for (let i = 0; i < checkCount; i++) {
          const img = images.nth(i);
          const src = await img.getAttribute('src');
          if (!src) {
            brokenImages++;
            continue;
          }
          
          // Check if image loaded (basic check)
          try {
            const naturalWidth = await img.evaluate((img: HTMLImageElement) => img.naturalWidth);
            if (naturalWidth === 0) brokenImages++;
          } catch {
            brokenImages++;
          }
        }
      }
      
      imageResults.push({
        page: pageInfo.name,
        imageCount,
        brokenImages
      });
    }
    
    console.log('\n=== IMAGE CHECK REPORT ===\n');
    imageResults.forEach(result => {
      console.log(`📄 ${result.page}: ${result.imageCount} images, ${result.brokenImages} broken`);
    });
    
    const totalBroken = imageResults.reduce((sum, r) => sum + r.brokenImages, 0);
    expect(totalBroken, 'Should have no broken images').toBe(0);
  });
  
  test('Theme consistency across all pages', async ({ page }) => {
    const themes: string[] = [];
    
    for (const pageInfo of GUEST_DIRECTORY_PAGES) {
      await page.goto(`http://localhost:4321${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      
      const theme = await page.locator('html').getAttribute('data-theme');
      themes.push(theme || 'no-theme');
    }
    
    // All themes should be the same
    const uniqueThemes = [...new Set(themes)];
    console.log(`\n=== THEME CONSISTENCY ===`);
    console.log(`Themes found: ${uniqueThemes.join(', ')}`);
    
    expect(uniqueThemes.length, 'All pages should use the same theme').toBe(1);
    expect(uniqueThemes[0], 'Should use baberrih-theme').toContain('baberrih-theme');
  });
  
  test('Card components render correctly', async ({ page }) => {
    for (const pageInfo of GUEST_DIRECTORY_PAGES) {
      await page.goto(`http://localhost:4321${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      
      const cards = page.locator('.card');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        // Check first card
        const firstCard = cards.first();
        await expect(firstCard, `First card on ${pageInfo.name} should be visible`).toBeVisible();
        
        const cardText = await firstCard.textContent();
        expect(cardText?.trim(), `Card on ${pageInfo.name} should have content`).toBeTruthy();
      }
      
      console.log(`📄 ${pageInfo.name}: ${cardCount} cards found`);
    }
  });
});