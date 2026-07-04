import { expect, test } from '@playwright/test';

test('loads the shell, starts gameplay, moves, pauses, and enters the sector loop', async ({
  page
}) => {
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

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Mute' }).check();
  await page.getByRole('button', { name: 'Back', exact: true }).click();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('checkbox', { name: 'Mute' })).toBeChecked();
  await page.getByRole('button', { name: 'Back', exact: true }).click();

  await page.getByTestId('seed-entry').fill('starbreak smoke');
  await expect(page.getByTestId('seed-status')).toContainText('STARBREAK-SMOKE');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();
  await page
    .locator('article')
    .filter({ hasText: 'Missile Accountant' })
    .getByRole('button', { name: 'Select' })
    .click();

  await page.getByRole('button', { name: 'Launch Contract' }).click();

  await expect(page.getByText('Outer Debris Field')).toBeVisible();
  await expect(page.getByTestId('hull-readout')).toContainText('Hull');
  await expect(page.getByTestId('pickup-readout')).toContainText(/Credits .* Salvage/);
  await expect(page.getByTestId('objective-readout')).toContainText(/waves|targets|Boss/i);
  await expect(page.getByTestId('hint-readout')).toContainText('Hint');
  await expect(page.getByTestId('verb-readout')).toContainText('Special');
  await expect(page.getByTestId('weapon-readout')).toContainText('Heat');
  await expect(page.getByTestId('boss-readout')).toContainText('Boss');
  await expect(page.getByTestId('item-readout')).toContainText('Split Prism');

  const startPosition = await page.getByTestId('player-position').textContent();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(180);
  await page.keyboard.up('ArrowRight');

  await expect
    .poll(async () => page.getByTestId('player-position').textContent())
    .not.toBe(startPosition);
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(220);
  await page.keyboard.up('ArrowLeft');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByText('Outer Debris Field')).toBeVisible();

  await page.keyboard.down('Space');
  await expect(page.getByRole('heading', { name: 'Choose Route' })).toBeVisible({
    timeout: 6_000
  });
  await page.keyboard.up('Space');

  await page.getByTestId('route-shop').click();
  await expect(page.getByRole('heading', { name: 'Shop' })).toBeVisible();

  await page.getByRole('button', { name: /Reroll/ }).click();
  await page.getByRole('button', { name: 'Leave Shop' }).click();
  await expect(page.getByRole('heading', { name: 'Choose Reward' })).toBeVisible();

  await page.getByRole('button', { name: /Take / }).first().click();
  await expect(page.getByRole('heading', { name: /Entering Trade War Corridor/ })).toBeVisible();

  await page.getByRole('button', { name: 'Enter Sector' }).click();
  await expect(page.getByText('Trade War Corridor')).toBeVisible();

  await page.keyboard.press('1');
  await expect(page.getByTestId('boss-readout')).toContainText('Auditor Drone XL');

  await page.keyboard.press('K');
  await expect(page.getByRole('heading', { name: 'Debug Run Ended' })).toBeVisible();
  await expect(page.getByText('forced test', { exact: true })).toBeVisible();
  await expect(page.getByText('Debug: forced test summary.')).toBeVisible();
  await expect(page.getByTestId('unlock-summary')).toContainText('Unlocked:');
  await expect(page.getByTestId('seed-share-link')).toHaveValue(/seed=STARBREAK-SMOKE/);

  await page.getByRole('button', { name: 'Copy Seed Link' }).click();
  await expect(page.getByTestId('seed-share-status')).toContainText(/Seed link/);

  await page.getByRole('button', { name: 'Back to Menu' }).click();
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page.getByTestId('boot-status')).toContainText(/Bank [1-9]\d* kg/);

  await page.getByRole('button', { name: 'Unlock Archive' }).click();
  await expect(page.getByRole('heading', { name: 'Unlock Archive' })).toBeVisible();

  await page.getByRole('button', { name: 'Export Save' }).click();
  const exportedSave = await page.getByTestId('save-import-box').inputValue();
  expect(exportedSave).toContain('"version": 2');

  await page.getByRole('button', { name: 'Reset Save' }).click();
  await expect(page.getByTestId('save-status')).toContainText('Save reset.');
  await expect(page.getByText('Salvage Bank 0 kg | Unlocks 0/10')).toBeVisible();

  await page.getByTestId('save-import-box').fill(exportedSave);
  await page.getByRole('button', { name: 'Import Save' }).click();
  await expect(page.getByTestId('save-status')).toContainText('Save imported.');
  await expect(page.getByRole('heading', { name: 'Phase Courier' })).toBeVisible();

  await page.getByRole('button', { name: 'Back' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page.getByTestId('boot-status')).toContainText(/Bank [1-9]\d* kg/);

  expect(browserErrors).toEqual([]);
});
