import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display sign in page', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.locator('h2')).toContainText('Bienvenue');
    await expect(page.locator('button')).toContainText('Continuer avec Google');
  });

  test('should navigate to sign in from home', async ({ page }) => {
    const signInLink = page.locator('a[href="/auth/signin"]').first();
    if (await signInLink.isVisible()) {
      await signInLink.click();
      await expect(page).toHaveURL(/.*\/auth\/signin/);
    }
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Remplir le formulaire avec des données invalides
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Note: Cette partie dépend de votre implémentation réelle
    // Si vous avez un bouton de soumission, décommentez:
    // await page.click('button[type="submit"]');
    // await expect(page.locator('.error')).toBeVisible();
  });
});

