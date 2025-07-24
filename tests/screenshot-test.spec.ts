import { test } from '@playwright/test';

test('Visual verification of guest directory pages', async ({ page }) => {
  const pages = [
    { path: '/guest-directory', name: 'main' },
    { path: '/guest-directory/dining', name: 'dining' },
    { path: '/guest-directory/services', name: 'services' },
    { path: '/guest-directory/transportation', name: 'transportation' },
    { path: '/guest-directory/attractions', name: 'attractions' }
  ];

  for (const pageInfo of pages) {
    await page.goto(`http://localhost:4321${pageInfo.path}`);
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await page.screenshot({ 
      path: `test-results/guest-directory-${pageInfo.name}.png`, 
      fullPage: true 
    });
    
    console.log(`📸 Screenshot saved: guest-directory-${pageInfo.name}.png`);
  }
});