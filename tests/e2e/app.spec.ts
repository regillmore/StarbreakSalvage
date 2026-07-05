import { expect, test } from '@playwright/test';

test('loads the shell, starts gameplay, moves, pauses, and enters the sector loop', async ({
  page
}) => {
  test.setTimeout(90_000);

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
  await expect(page.getByTestId('contract-ship-preview')).toHaveCount(3);
  await expect(page.getByTestId('selected-contract-preview')).toContainText(/.+/);
  await expect(
    page.getByTestId('selected-contract-preview').getByRole('img', { name: /ship preview/ })
  ).toBeVisible();

  const firstPreviewText = await page.getByTestId('selected-contract-preview').textContent();
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(async () => page.getByTestId('selected-contract-preview').textContent())
    .not.toBe(firstPreviewText);

  await page
    .locator('article')
    .filter({ hasText: 'Missile Accountant' })
    .getByRole('button', { name: /Select|Selected/ })
    .click();
  await expect(page.getByTestId('selected-contract-preview')).toContainText('Missile Accountant');
  await expect(
    page
      .getByTestId('selected-contract-preview')
      .getByRole('img', { name: /Missile Accountant ship preview/ })
  ).toBeVisible();

  await page
    .locator('article')
    .filter({ hasText: 'Debt Runner' })
    .getByRole('button', { name: /Select|Selected/ })
    .click();
  await expect(page.getByTestId('selected-contract-preview')).toContainText('Debt Runner');

  await page.getByRole('button', { name: 'Launch Contract' }).click();

  await expect(page.getByText('Outer Debris Field')).toBeVisible();
  await expect(page.getByTestId('distance-readout')).toContainText(/Distance \d+\/\d+u/);
  await expect(page.getByTestId('hull-readout')).toContainText('Hull');
  await expect(page.getByTestId('pickup-readout')).toContainText(/Credits .* Salvage/);
  await expect(page.getByTestId('cockpit-hud')).toHaveAttribute('data-hud-theme', 'redline');
  await expect(page.getByTestId('hud-theme-readout')).toContainText('REDLINE COCKPIT');
  await expect(page.getByTestId('hull-meter')).toHaveAttribute('aria-valuenow', '100');
  await expect(page.getByTestId('special-meter')).toHaveAttribute('aria-valuenow', '100');
  await expect(page.getByTestId('bomb-meter')).toHaveAttribute('aria-valuenow', '100');
  await expect(page.getByTestId('weapon-heat-meter')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByTestId('objective-readout')).toContainText(/waves|targets|Boss/i);
  await expect(page.getByTestId('hint-readout')).toContainText('Hint');
  await expect(page.getByTestId('verb-readout')).toContainText('Special');
  await expect(page.getByTestId('weapon-readout')).toContainText('Heat');
  await expect(page.getByTestId('boss-readout')).toContainText('Boss');
  await expect(page.getByTestId('item-readout')).toContainText('Split Prism');
  await expect(page.locator('.debug-overlay')).toContainText('Theme redline/Debt Runner');
  await expect(page.locator('.debug-overlay')).toContainText('HUD standard');
  await expect(page.locator('.debug-overlay')).toContainText(/Viewport \d+x\d+ \w+ @[0-9.]+ DPR [0-9.]+/);
  await expect(page.locator('.debug-overlay')).toContainText(/Canvas \d+x\d+/);
  await expect(page.locator('.debug-overlay')).toContainText(/Safe \d+,\d+ \d+x\d+/);

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

  await page.keyboard.press('8');
  await expect(page.getByRole('heading', { name: 'Choose Route' })).toBeVisible();
  await expect(page.locator('.route-panel')).toHaveAttribute('data-contract-theme', 'redline');
  await expect(page.getByTestId('contract-theme-strip')).toContainText(
    'REDLINE CONTRACT | Debt Runner'
  );

  await page.getByTestId('route-shop').click();
  await expect(page.getByRole('heading', { name: 'Shop' })).toBeVisible();
  await expect(page.locator('.shop-panel')).toHaveAttribute('data-contract-theme', 'redline');

  await page.getByRole('button', { name: /Reroll/ }).click();
  await page.getByRole('button', { name: 'Leave Shop' }).click();
  await expect(page.getByRole('heading', { name: 'Choose Reward' })).toBeVisible();
  await expect(page.locator('.reward-panel')).toHaveAttribute('data-contract-theme', 'redline');

  await page.getByRole('button', { name: /Take / }).first().click();
  await expect(page.getByRole('heading', { name: /Entering Trade War Corridor/ })).toBeVisible();
  await expect(page.locator('.transition-panel')).toHaveAttribute('data-contract-theme', 'redline');

  await page.getByRole('button', { name: 'Enter Sector' }).click();
  await expect(page.getByText('Trade War Corridor')).toBeVisible();

  await page.keyboard.press('5');
  await expect(page.getByTestId('boss-readout')).toContainText('The Core Wreck');

  await page.keyboard.press('0');
  await expect(page.getByTestId('boss-warning')).toContainText('DENSE PERF LANE');
  await expect(page.locator('.debug-overlay')).toContainText(/Entities [5-9]\d/);
  await expect(page.locator('.debug-overlay')).toContainText('Scenario dense-combat');
  await expect(page.locator('.debug-overlay')).toContainText(/Projectiles 42 \(P0\/E42\)/);
  await expect(page.locator('.debug-overlay')).toContainText('Pickups/FX 0/1');
  await expect(page.locator('.debug-overlay')).toContainText('Telegraphs 3');
  await expect(page.locator('.debug-overlay')).toContainText(/Distance \d+\/\d+/);
  await expect(page.locator('.debug-overlay')).toContainText(/Scroll \d+u\/s/);
  await expect(page.locator('.debug-overlay')).toContainText(/Bg \d+p\/4l/);
  await expect(page.locator('.debug-overlay')).toContainText(/Features L\d+\/H\d+/);

  await page.keyboard.press('9');
  await expect(page.locator('.debug-overlay')).toContainText('Scenario long-scroll');
  await expect(page.locator('.debug-overlay')).toContainText('Entities 1');
  await expect(page.locator('.debug-overlay')).toContainText('Projectiles 0 (P0/E0)');
  await expect(page.locator('.debug-overlay')).toContainText('Pickups/FX 0/0');
  await expect(page.getByTestId('distance-readout')).toContainText(/Distance 1\d{3}\/\d+u/);

  await page.keyboard.press('K');
  await expect(page.getByRole('heading', { name: 'Debug Run Ended' })).toBeVisible();
  await expect(page.locator('.summary-panel')).toHaveAttribute('data-contract-theme', 'redline');
  await expect(page.getByText(/redline theme \| needle silhouette/)).toBeVisible();
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

test('launches gameplay with reduced motion and high contrast settings by keyboard', async ({
  page
}) => {
  const browserErrors: string[] = [];
  const accessibleSettings = {
    version: 1,
    keyBindings: {
      moveUp: 'W',
      moveDown: 'S',
      moveLeft: 'A',
      moveRight: 'D',
      fire: ' ',
      special: 'Shift',
      bomb: 'X',
      pause: 'P',
      confirm: 'Enter',
      back: 'Escape'
    },
    muted: false,
    masterVolume: 0.8,
    reducedMotion: true,
    screenShake: 0,
    bulletContrast: 'high',
    fullscreenPreferred: false,
    performanceMode: true
  };

  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.addInitScript((settings) => {
    window.localStorage.setItem('starbreak.settings.v1', JSON.stringify(settings));
  }, accessibleSettings);

  await page.goto('./?debug=1&seed=STARBREAK-SMOKE');

  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-bullet-contrast', 'high');
  await expect(page.locator('html')).toHaveAttribute('data-performance-mode', 'true');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.getByText('Outer Debris Field')).toBeVisible();
  await expect(page.getByTestId('cockpit-hud')).toHaveAttribute('data-hud-mode', 'contrast');
  await expect(page.getByTestId('distance-readout')).toContainText(/Distance \d+\/\d+u/);
  await expect(page.getByTestId('hint-readout')).toContainText('Hint');
  await expect(page.locator('.debug-overlay')).toContainText(/Scroll \d+u\/s/);
  await expect(page.locator('.debug-overlay')).toContainText('HUD contrast');

  expect(browserErrors).toEqual([]);
});

test('supports keyboard-only start, pause, end-run, and summary flow', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('./?debug=1&seed=STARBREAK-SMOKE');

  await expect(page.getByTestId('seed-entry')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Start Run' })).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();

  const firstPreviewText = await page.getByTestId('selected-contract-preview').textContent();
  await expect(page.getByRole('button', { name: 'Launch Contract' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(async () => page.getByTestId('selected-contract-preview').textContent())
    .not.toBe(firstPreviewText);

  await page.keyboard.press('Enter');
  await expect(page.getByText('Outer Debris Field')).toBeVisible();
  await expect(page.getByTestId('cockpit-hud')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume' })).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Settings' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'End Run' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { name: 'Contract Suspended' })).toBeVisible();
  await expect(page.getByText('Abandoned: pilot exited before resolution.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to Menu' })).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();

  expect(browserErrors).toEqual([]);
});

test('supports pointer-guided movement and primary-button fire during gameplay', async ({
  page
}) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('./?debug=1&seed=STARBREAK-SMOKE');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.getByText('Outer Debris Field')).toBeVisible();

  const startPosition = await page.getByTestId('player-position').textContent();
  await page.mouse.move(760, 550);
  await expect(page.locator('.debug-overlay')).toContainText('Input pointer');
  await expect(page.locator('.debug-overlay')).toContainText(/Safe \d+,\d+ \d+x\d+/);

  await expect
    .poll(async () => page.getByTestId('player-position').textContent())
    .not.toBe(startPosition);

  await page.mouse.down();
  await expect(page.getByTestId('combat-status')).toContainText(/Shots [1-9]/);
  await page.mouse.up();

  expect(browserErrors).toEqual([]);
});

test('keeps the gameplay HUD and safe frame readable in a narrow viewport', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('./?debug=1&seed=STARBREAK-SMOKE');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.getByText('Outer Debris Field')).toBeVisible();
  await expect(page.locator('.debug-overlay')).toContainText('Viewport 390x700 narrow @0.57 DPR 1.00');
  await expect(page.locator('.debug-overlay')).toContainText('Canvas 390x700');
  await expect(page.locator('.debug-overlay')).toContainText('Safe 14,204 362x407');
  await expect(page.locator('.debug-overlay')).toContainText('World 640x720');
  await expect(page.locator('.debug-overlay')).toContainText('Input none');
  await expect(page.locator('.debug-overlay')).toContainText('HUD standard');
  await expect(page.getByTestId('objective-readout')).toBeVisible();

  const hudBox = await page.locator('.game-hud').boundingBox();
  if (!hudBox) {
    throw new Error('Expected the gameplay HUD to have a browser layout box.');
  }

  expect(hudBox.width).toBeLessThanOrEqual(390);
  expect(hudBox.y + hudBox.height).toBeLessThanOrEqual(175);

  expect(browserErrors).toEqual([]);
});
