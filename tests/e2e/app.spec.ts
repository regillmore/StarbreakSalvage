import { expect, test } from '@playwright/test';

test('loads the shell, starts gameplay, moves, pauses, and opens summary', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('./?debug=1');

  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Starbreak Salvage playfield' })).toBeVisible();

  await page.getByRole('button', { name: 'Start Run' }).click();

  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();

  await page.getByRole('button', { name: 'Launch Contract' }).click();

  await expect(page.getByText('Outer Debris Field')).toBeVisible();
  await expect(page.getByTestId('item-readout')).toContainText('Split Prism');

  const startPosition = await page.getByTestId('player-position').textContent();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(180);
  await page.keyboard.up('ArrowRight');

  await expect.poll(async () => page.getByTestId('player-position').textContent()).not.toBe(
    startPosition
  );
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(220);
  await page.keyboard.up('ArrowLeft');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByText('Outer Debris Field')).toBeVisible();

  await page.keyboard.down('Space');
  await expect
    .poll(async () => page.getByTestId('combat-status').textContent(), { timeout: 6_000 })
    .toContain('Destroyed 1');
  await page.keyboard.up('Space');

  await page.keyboard.press('K');
  await expect(page.getByRole('heading', { name: 'Debug Run Ended' })).toBeVisible();
  await expect(page.getByText('forced test')).toBeVisible();

  expect(browserErrors).toEqual([]);
});
