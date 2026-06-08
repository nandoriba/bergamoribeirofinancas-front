import { expect, test } from '@playwright/test';

test('login shell renders dark and light themes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Finanças' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Entrar no sistema financeiro' })).toBeVisible();

  await page.getByRole('button', { name: 'Ativar tema claro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
