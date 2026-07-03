import { expect, test } from '@playwright/test';

test('loads the title screen and arms the placeholder start button', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('./');

  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Starfield flight deck' })).toBeVisible();

  await page.getByRole('button', { name: 'Start Run' }).click();

  await expect(page.getByRole('button', { name: 'Contract Armed' })).toBeVisible();
  await expect(page.getByTestId('boot-status')).toHaveText(
    'Contract board warming up for the first playable slice.'
  );
  expect(browserErrors).toEqual([]);
});
