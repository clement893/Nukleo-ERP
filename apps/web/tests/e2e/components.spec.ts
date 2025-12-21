import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display DataTable component', async ({ page }) => {
    await page.goto('/components/data');
    
    // Vérifier que la table est visible
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    // Vérifier la recherche
    const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      // Attendre que les résultats se filtrent
      await page.waitForTimeout(500);
    }
  });

  test('should display Form components', async ({ page }) => {
    await page.goto('/components/forms');
    
    // Vérifier les différents champs de formulaire
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
    
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    
    const select = page.locator('select').first();
    if (await select.isVisible()) {
      await expect(select).toBeVisible();
    }
  });

  test('should display Modal component', async ({ page }) => {
    await page.goto('/components/overlay');
    
    // Chercher un bouton qui ouvre une modal
    const openModalButton = page.locator('button:has-text("Ouvrir")').first();
    if (await openModalButton.isVisible()) {
      await openModalButton.click();
      
      // Vérifier que la modal est visible
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible();
      
      // Fermer la modal
      const closeButton = page.locator('button:has-text("Fermer"), button[aria-label*="close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test('should display Pagination component', async ({ page }) => {
    await page.goto('/components/data');
    
    // Chercher la pagination
    const pagination = page.locator('[aria-label*="pagination"], nav[aria-label*="Pagination"]').first();
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();
      
      // Cliquer sur la page suivante
      const nextButton = pagination.locator('button:has-text("Suivant"), button[aria-label*="next"]').first();
      if (await nextButton.isVisible() && !(await nextButton.isDisabled())) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

