import { expect, test } from '@playwright/test';

test('loads the shell, starts gameplay, moves, pauses, and opens summary', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('./');

  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Starbreak Salvage playfield' })).toBeVisible();

  await page.getByRole('button', { name: 'Start Run' }).click();

  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();

  await page.getByRole('button', { name: 'Launch Contract' }).click();

  await expect(page.getByText('Outer Debris Field')).toBeVisible();

  const startPosition = await page.getByTestId('player-position').textContent();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(180);
  await page.keyboard.up('ArrowRight');

  await expect.poll(async () => page.getByTestId('player-position').textContent()).not.toBe(
    startPosition
  );

  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByText('Outer Debris Field')).toBeVisible();

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'End Run' }).click();
  await expect(page.getByRole('heading', { name: 'Contract Suspended' })).toBeVisible();

  expect(browserErrors).toEqual([]);
});
