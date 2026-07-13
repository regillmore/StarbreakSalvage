import { expect, test, type Page } from '@playwright/test';

const SCRAP_BAY_SAVE = {
  version: 5,
  salvageBank: 8,
  unlockedIds: [],
  purchasedUpgradeIds: [],
  achievementIds: [],
  discoveredItemIds: [],
  discoveredItemFamilyIds: [],
  stats: {
    runsEnded: 1,
    deaths: 0,
    forcedTests: 0,
    sectorsCleared: 1,
    bossesDefeated: 0,
    enemiesDestroyed: 8,
    creditsRecovered: 16,
    salvageRecovered: 8,
    distanceTraveled: 1442,
    bestDistanceTraveled: 1442,
    bestSectorsCleared: 1,
    bestSurvivedSeconds: 38,
    itemTriggers: 2
  },
  lastRun: null
} as const;

const HIGH_CONTRAST_SETTINGS = {
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
} as const;

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
  await expect(
    page.getByRole('img', { name: /salvage cutter descending through a shattered orbital ring/i })
  ).toBeVisible();
  await expect(page.getByText('Break the blockade. Build the impossible.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Random Expedition' })).toBeFocused();
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

  await page.locator('summary').filter({ hasText: 'specific expedition code' }).click();
  await page.getByTestId('seed-entry').fill('starbreak smoke');
  await expect(page.getByTestId('seed-status')).toContainText('STARBREAK-SMOKE');
  await page.keyboard.press('Enter');
  await expect(page.locator('.title-shell')).toHaveAttribute('data-launching', 'true');
  await expect(page.getByTestId('launch-status')).toContainText(
    /Authenticating|Triangulating|Contract board/
  );

  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();
  await expect(page.getByTestId('contract-ship-preview')).toHaveCount(3);
  await expect(page.getByTestId('selected-contract-preview')).toContainText(/.+/);
  await expect(page.getByTestId('selected-loadout-preview')).toContainText(/frame/i);
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
  await expect(page.getByTestId('selected-contract-preview')).toContainText('Redline Needle frame');
  await expect(page.getByTestId('selected-contract-preview')).toContainText(
    /Power \d+\/\d+ \| Heat \d+\/\d+ \| Mass \d+\/\d+ \| Command \d+\/\d+/
  );

  await page.getByRole('button', { name: 'Launch Contract' }).click();

  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Breach Levy briefing/ })).toBeVisible();
  await expect(page.getByTestId('mission-objective-preview')).toContainText('ASSAULT');
  await page.keyboard.press('Enter');

  await expectGameplaySector(page, 'Outer Debris Field');
  await expect(page.getByTestId('distance-readout')).toContainText(/Distance \d+\/\d+u/);
  await expect(page.getByTestId('hull-readout')).toContainText('Hull');
  await expect(page.getByTestId('pickup-readout')).toContainText(/Credits .* Salvage/);
  await expect(page.getByTestId('cockpit-hud')).toHaveAttribute('data-hud-theme', 'redline');
  await expect(page.getByTestId('hud-theme-readout')).toContainText('REDLINE COCKPIT');
  await expect(page.getByTestId('hull-meter')).toHaveAttribute('aria-valuenow', '100');
  await expect(page.getByTestId('special-meter')).toHaveAttribute('aria-valuenow', '100');
  await expect(page.getByTestId('bomb-meter')).toHaveAttribute('aria-valuenow', '100');
  await expect(page.getByTestId('weapon-heat-meter')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByTestId('ship-loadout-readout')).toContainText('Redline Needle');
  await expect(page.locator('.debug-overlay')).toContainText(
    /Loadout Redline Needle P\d+\/\d+ H\d+\/\d+ M\d+\/\d+ C\d+\/\d+/
  );
  await expect(page.locator('.debug-overlay')).toContainText(/Foundry I\d+ C\d+ H\d+ P\d+/);
  await expect(page.locator('.debug-overlay')).toContainText('Combined proc none 0/48');
  await expect(page.getByTestId('objective-readout')).toContainText(
    /ASSAULT|hostiles|fortification/i
  );
  await expect(page.getByTestId('expedition-readout')).toContainText(
    'Expedition Outer Debris Field Operation | nodes 2/105'
  );
  await expect(page.getByTestId('hint-readout')).toContainText('Hint');
  await expect(page.getByTestId('verb-readout')).toContainText('Special');
  await expect(page.getByTestId('weapon-readout')).toContainText('Heat');
  await expect(page.getByTestId('boss-readout')).toContainText('Boss');
  await expect(page.getByTestId('item-readout')).toContainText(/Build .+ \| 3 items/);
  await expect(page.locator('.debug-overlay')).toContainText('Theme redline/Debt Runner');
  await expect(page.locator('.debug-overlay')).toContainText('HUD standard');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Expedition expedition_s01_operation 2/105 decisions 0'
  );
  await expect(page.locator('.debug-overlay')).toContainText('Mission combat active');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Contract contract_breach_levy | Objective assault/objective_breach_assault'
  );
  await expect(page.locator('.debug-overlay')).toContainText('Expedition capacity 28.1-36.6m');
  await expect(page.locator('.debug-overlay')).toContainText(
    /Viewport \d+x\d+ \w+ @[0-9.]+ DPR [0-9.]+/
  );
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
  await expectGameplaySector(page, 'Outer Debris Field');

  await page.keyboard.press('8');
  await expect(page.getByTestId('sector-exit-toast')).toContainText(
    /Outer Debris Field clear\. (Main thrusters igniting|Ship accelerating out of sector)/
  );
  await expect(page.locator('.debug-overlay')).toContainText(
    /Exit sectorComplete (ignition|boost|clear|transition) \d+%/
  );
  await expect(page.getByTestId('mission-branch')).toBeVisible();
  await page.getByTestId('mission-branch-optional').click();
  await expect(page.getByTestId('expedition-readout')).toContainText('Black Box Signal');
  await expect(page.locator('.debug-overlay')).toContainText('Mission combat active');
  await page.keyboard.press('8');
  await expect(page.getByTestId('command-deck')).toBeVisible();
  await page.getByTestId('command-deck-continue').click();
  await expect(page.locator('.debug-overlay')).toContainText('Mission combat active');
  await page.keyboard.press('U');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Scenario set-piece:setpiece_ledger_hecaton'
  );
  await expect(page.getByTestId('objective-readout')).toContainText('Hecaton Ledger Ark');
  await page.keyboard.press('8');
  await expect(page.getByTestId('mission-branch')).toBeVisible();
  await page.getByTestId('mission-branch-optional').click();
  await expect(page.locator('.debug-overlay')).toContainText('Mission combat active');
  await page.keyboard.press('8');
  await expect(page.getByTestId('mission-relief')).toBeVisible();
  await page.getByTestId('mission-relief-continue').click();
  await expect(page.getByRole('heading', { name: 'Choose Route' })).toBeVisible();
  await expect(page.getByTestId('route-shop-mission-preview')).toContainText(
    'Next mission: Running Audit / PURSUE'
  );
  await expect(page.locator('.route-panel')).toHaveAttribute('data-contract-theme', 'redline');
  await expect(page.getByTestId('contract-theme-strip')).toContainText(
    'REDLINE CONTRACT | Debt Runner'
  );

  await page.getByTestId('route-shop').click();
  await expect(page.getByRole('heading', { name: 'Shop' })).toBeVisible();
  await expect(page.locator('.shop-panel')).toHaveAttribute('data-contract-theme', 'redline');
  await expect(page.locator('.shop-card').first()).toContainText('Build fit:');
  await expect(
    page
      .locator('.shop-card')
      .first()
      .getByRole('img', { name: /item icon/ })
  ).toBeVisible();
  await expect(page.locator('.shop-card').first()).toContainText(/Live effect|Bridge effect/);

  await page.getByRole('button', { name: /Reroll/ }).click();
  await page.getByRole('button', { name: 'Leave Shop' }).click();
  await expect(page.getByRole('heading', { name: 'Choose Reward' })).toBeVisible();
  await expect(page.locator('.reward-panel')).toHaveAttribute('data-contract-theme', 'redline');
  await expect(page.locator('.reward-card').first()).toContainText('Build fit:');
  await expect(
    page
      .locator('.reward-card')
      .first()
      .getByRole('img', { name: /item icon/ })
  ).toBeVisible();
  await expect(page.locator('.reward-card').first()).toContainText(/Live effect|Bridge effect/);

  await page.getByRole('button', { name: /Take / }).first().click();
  await expect(page.getByTestId('salvage-foundry')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hardpoint Control' })).toBeVisible();
  await expect(page.getByTestId('foundry-boundary')).toContainText(/Undo restores/i);
  await expect(page.getByTestId('foundry-grid-readout')).toContainText('LEGAL DRAFT');
  await expect(page.getByTestId('foundry-command-console')).toBeVisible();
  const attackPreview = page.getByTestId('foundry-attack-preview');
  await expect(attackPreview.getByRole('img')).toBeVisible();
  await expect(attackPreview).toHaveAttribute('aria-label', /owned item hooks/);
  await expect(attackPreview.locator('.ship-preview-weapon-cue')).toHaveCount(0);
  const liveProjectiles = attackPreview.getByTestId('foundry-attack-projectile');
  expect(await liveProjectiles.count()).toBeGreaterThan(0);
  await expect(liveProjectiles.first()).toHaveAttribute('data-velocity', /-?\d+(?:\.\d+)?,-\d+/);
  await expect(liveProjectiles.first()).toHaveAttribute('data-damage', /\d/);
  await expect(page.getByTestId('foundry-attack-projectile-layer')).toHaveAttribute(
    'data-volley-size',
    /[1-9]\d*/
  );
  await expect(page.getByTestId('foundry-mini-hud')).toContainText(/BASELINE|DRAFT DELTA/);
  await expect(page.getByTestId('foundry-meter-power').getByRole('meter')).toBeVisible();
  await expect(page.getByTestId('foundry-attack-impact')).toBeVisible();
  await expect(page.locator('.foundry-cargo-card').first()).toContainText(/scrap \+\d+/i);
  await page.locator('.foundry-cargo-card').first().getByRole('button', { name: /Route/ }).click();
  await expect(page.getByTestId('foundry-pending-history')).toContainText('Reroute');
  await page.getByTestId('foundry-undo').click();
  await expect(page.getByTestId('foundry-pending-history')).toContainText('Draft clean.');
  await page.getByTestId('foundry-commit').click();
  await expect(page.getByRole('heading', { name: /Running Audit briefing/ })).toBeVisible();
  await expect(page.locator('.transition-panel')).toHaveAttribute('data-contract-theme', 'redline');

  await page.getByRole('button', { name: 'Begin Operation' }).click();
  await expectGameplaySector(page, 'Trade War Corridor');

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
  await expect(page.locator('.debug-overlay')).toContainText(
    /Hazard runtime tracked \d+ pause [0-9.]+s\/\d+u/
  );

  await page.keyboard.press('9');
  await expect(page.locator('.debug-overlay')).toContainText('Scenario long-scroll');
  await expect(page.locator('.debug-overlay')).toContainText('Entities 1');
  await expect(page.locator('.debug-overlay')).toContainText('Projectiles 0 (P0/E0)');
  await expect(page.locator('.debug-overlay')).toContainText('Pickups/FX 0/0');
  await expect(page.getByTestId('distance-readout')).toContainText(/Distance [5-9]\d{2}\/\d+u/);

  await page.keyboard.press('7');
  await expect(page.getByTestId('player-destruction-toast')).toContainText(
    /Cockpit failure \| Debt Runner TRANSPONDER LOST/i
  );
  await expect(page.locator('.debug-overlay')).toContainText(/Destruction standard \d+%/);
  await expect(page.getByRole('heading', { name: 'Ship Destroyed' })).toBeVisible();
  await expect(page.locator('.summary-panel')).toHaveAttribute('data-contract-theme', 'redline');
  await expect(page.getByText(/redline theme \| needle silhouette/)).toBeVisible();
  await expect(page.locator('.summary-stats')).toContainText('Redline Needle');
  await expect(page.locator('.summary-stats')).toContainText('Primary: Light Needle Laser');
  await expect(page.locator('.summary-stats')).toContainText(/Power \d+\/\d+ \| Heat \d+\/\d+/);
  await expect(page.locator('.summary-stats')).toContainText('Engineering History');
  await expect(page.locator('.summary-stats')).toContainText('Recovered');
  await expect(page.getByText('permadeath', { exact: true })).toBeVisible();
  await expect(page.getByText('Loss: ship destroyed and contract closed.')).toBeVisible();
  await expect(page.getByTestId('summary-item-list')).toContainText('Route Ledger Spool');
  await expect(page.getByTestId('summary-item-list')).toContainText('Route Economy');
  await expect(
    page.getByTestId('summary-item-list').getByRole('img', {
      name: 'Route Ledger Spool Route Economy item icon'
    })
  ).toBeVisible();
  await expect(page.getByTestId('scrap-breakdown')).toContainText(
    /Earned \+\d+ kg \| Bank \d+ -> \d+ kg/
  );
  await expect(page.getByTestId('upgrade-progress-callout')).toContainText(/upgrade|next/i);
  await expect(page.getByTestId('unlock-summary')).toContainText('Unlocked:');
  await expect(page.getByTestId('seed-share-link')).toHaveValue(/seed=STARBREAK-SMOKE/);
  await expect(page.getByText(/Breach Levy\/Breach Assault: success/)).toBeVisible();

  await page.getByRole('button', { name: 'Copy Seed Link' }).click();
  await expect(page.getByTestId('seed-share-status')).toContainText(/Seed link/);

  await page.getByRole('button', { name: 'Back to Menu' }).click();
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page.getByTestId('boot-status')).toContainText(/Bank [1-9]\d* kg/);

  await page.getByRole('button', { name: 'Unlock Archive' }).click();
  await expect(page.getByRole('heading', { name: 'Unlock Archive' })).toBeVisible();
  await expect(page.getByTestId('discovered-item-list')).toContainText('Route Ledger Spool');
  await expect(page.getByTestId('discovered-item-list')).toContainText('Live effect');

  await page.getByRole('button', { name: 'Export Save' }).click();
  const exportedSave = await page.getByTestId('save-import-box').inputValue();
  expect(exportedSave).toContain('"version": 5');
  expect(exportedSave).toContain('"purchasedUpgradeIds":');
  expect(exportedSave).toContain('"discoveredItemIds":');
  expect(exportedSave).toContain('"discoveredItemFamilyIds":');
  expect(exportedSave).toContain('"expeditionGraphId":');
  expect(exportedSave).toContain('"expeditionVisitedNodeIds":');

  await page.getByRole('button', { name: 'Reset Save' }).click();
  await expect(page.getByTestId('save-status')).toContainText('Save reset.');
  await expect(page.getByText(/Salvage Bank 0 kg \| Unlocks 0\/\d+/)).toBeVisible();

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

test('opens the Upgrade Bay and purchases an upgrade from banked scrap', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 700 });
  await page.addInitScript(
    ({ save, settings }) => {
      window.localStorage.setItem('starbreak.save.v5', JSON.stringify(save));
      window.localStorage.setItem('starbreak.settings.v1', JSON.stringify(settings));
    },
    { save: SCRAP_BAY_SAVE, settings: HIGH_CONTRAST_SETTINGS }
  );

  await page.goto('./?debug=1');

  await expect(page.locator('html')).toHaveAttribute('data-bullet-contrast', 'high');
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await page.getByRole('button', { name: 'Upgrade Bay' }).click();

  await expect(page.getByRole('heading', { name: 'Upgrade Bay' })).toBeVisible();
  await expect(page.locator('.debug-overlay')).toContainText(
    'Progress Bank 8kg Upgrades 0/6 Ready 2'
  );
  await expect(page.getByTestId('upgrade-bay-summary')).toContainText(
    'Bank 8 kg | Installed 0/6 | Ready 2'
  );
  await expect(page.locator('[data-testid^="upgrade-card-"]')).toHaveCount(6);

  const bayBox = await page.locator('.upgrade-bay-panel').boundingBox();
  if (!bayBox) {
    throw new Error('Expected the Upgrade Bay panel to have a browser layout box.');
  }
  expect(bayBox.width).toBeLessThanOrEqual(390);

  const surveyRig = page.getByTestId('upgrade-card-upgrade_contract_survey_rig');
  await expect(surveyRig.getByRole('img', { name: 'Contract Survey Rig icon' })).toBeVisible();
  await expect(surveyRig).toContainText('Hangar');
  await expect(surveyRig).toContainText('Ready to install');
  await surveyRig.getByRole('button', { name: 'Install Contract Survey Rig' }).click();

  await expect(page.getByTestId('upgrade-bay-status')).toContainText(
    'Purchased Contract Survey Rig.'
  );
  await expect(page.getByTestId('upgrade-bay-summary')).toContainText(
    'Bank 4 kg | Installed 1/6 | Ready 1'
  );
  await expect(page.locator('.debug-overlay')).toContainText(
    'Progress Bank 4kg Upgrades 1/6 Ready 1'
  );
  await expect(surveyRig).toContainText('Installed in the archive.');

  const savedUpgradeIds = await page.evaluate(() => {
    const raw = window.localStorage.getItem('starbreak.save.v5');
    return raw ? JSON.parse(raw).purchasedUpgradeIds : [];
  });
  expect(savedUpgradeIds).toEqual(['upgrade_contract_survey_rig']);

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page.getByTestId('boot-status')).toContainText('Bank 4 kg');
  await expect(page.getByTestId('boot-status')).toContainText('Upgrades 1');

  await page.getByRole('button', { name: 'Start Random Expedition' }).click();
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();
  await expect(page.getByText(/Contract Board \| Seed RANDOM-/)).toBeVisible();
  await expect(page.getByTestId('contract-upgrade-intel')).toContainText('Contract Survey Rig');
  await expect(page.locator('.contract-survey-note').first()).toContainText('Survey:');

  expect(browserErrors).toEqual([]);
});

test('reaches and instruments the deterministic lunar sector smoke path', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('./?debug=1&seed=LUNAR-SURFACE-LANE');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await page.keyboard.press('Enter');
  await expectGameplaySector(page, 'Outer Debris Field', 1);
  await expect(page.locator('.debug-overlay')).toContainText('Sector S1 Outer Debris Field');

  await forceCompleteSectorAndEnterNext(page, 'Trade War Corridor');
  await expect(page.locator('.debug-overlay')).toContainText('Sector S2 Trade War Corridor');
  await page.keyboard.press('H');
  await expect(page.locator('.debug-overlay')).toContainText('Scenario environment-stress');
  await expect(page.locator('.debug-overlay')).toContainText(
    /Hazards .* B\[(TOP|RIGHT|BOTTOM|LEFT) \d+% to (TOP|RIGHT|BOTTOM|LEFT) \d+%\]/
  );

  await forceCompleteSectorAndEnterNext(page, 'Lunar Surface');
  await expectGameplaySector(page, 'Lunar Surface');
  await expect(page.locator('.debug-overlay')).toContainText('Sector S3 Lunar Surface');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Plan sector_lunar_surface/background_lunar_surface/paced'
  );
  await expect(page.locator('.debug-overlay')).toContainText(/Bg \d+p\/5l/);
  await expect(page.locator('.debug-overlay')).toContainText(/Features L\d+\/H\d+/);
  await expect(page.locator('.debug-overlay')).toContainText(/Run Credits \d+ Salvage \d+/);
  await expect(page.getByTestId('distance-readout')).toContainText(/Distance \d+\/\d+u/);

  expect(browserErrors).toEqual([]);
});

test('exposes item-heavy hook storm debug instrumentation', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('./?debug=1&seed=HOOK-STORM-SMOKE');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await page.keyboard.press('Enter');
  await expectGameplaySector(page, 'Outer Debris Field');

  await page.keyboard.press('6');
  await expect(page.getByTestId('boss-warning')).toContainText('ITEM HOOK STORM');
  await expect(page.locator('.debug-overlay')).toContainText('Scenario item-storm');
  await expect(page.locator('.debug-overlay')).toContainText('Items 23 (23 unique)');
  await expect(page.locator('.debug-overlay')).toContainText(/Hooks 14\/14 \d+ apps/);
  await expect(page.locator('.debug-overlay')).toContainText(/Proc on[A-Za-z]+ \d+\/48 skip 0/);
  await expect(page.locator('.debug-overlay')).toContainText(/Build .+ \| 23 items/);
  await expect(page.locator('.debug-overlay')).toContainText('Projectiles 30 (P0/E30)');
  await expect(page.locator('.debug-overlay')).toContainText('Telegraphs 2');
  await expect(page.getByTestId('item-readout')).toContainText(/Build .+ \| 23 items/);

  await page.keyboard.down(' ');
  await expect(page.getByTestId('combat-status')).toContainText(/Shots [1-9]/);
  await expect(page.getByTestId('combat-status')).toContainText(/Hooks [1-9]/);
  await expect(page.locator('.debug-overlay')).toContainText(/Combined proc onFire \d+\/\d+/);
  await page.keyboard.up(' ');

  expect(browserErrors).toEqual([]);
});

test('exposes enemy-rich formation pressure under high-contrast narrow smoke', async ({ page }) => {
  test.setTimeout(90_000);

  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 700 });
  await page.addInitScript((settings) => {
    window.localStorage.setItem('starbreak.settings.v1', JSON.stringify(settings));
  }, HIGH_CONTRAST_SETTINGS);

  await page.goto('./?debug=1&seed=LUNAR-SURFACE-LANE');

  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-bullet-contrast', 'high');
  await expect(page.locator('html')).toHaveAttribute('data-performance-mode', 'true');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await page.keyboard.press('Enter');
  await expectGameplaySector(page, 'Outer Debris Field', 1);

  await forceCompleteSectorAndEnterNext(page, 'Trade War Corridor');
  await forceCompleteSectorAndEnterNext(page, 'Lunar Surface');
  await expectGameplaySector(page, 'Lunar Surface');
  await expect(page.getByTestId('cockpit-hud')).toHaveAttribute('data-hud-mode', 'contrast');
  await expect(page.locator('.debug-overlay')).toContainText('Viewport 390x700 narrow');
  await expect(page.locator('.debug-overlay')).toContainText(
    /Plan sector_lunar_surface\/background_lunar_surface\/paced\/[A-Za-z]+/
  );
  await expect(page.locator('.debug-overlay')).toContainText(
    /Pacing (Vault transit|Low-orbit traverse|Intercept run|Shear corridor|Long caravan|Boss approach)/
  );

  await page.keyboard.press('E');
  await expect(page.getByTestId('boss-warning')).toContainText('ENEMY RICH LANE');
  await expect(page.locator('.debug-overlay')).toContainText('Scenario enemy-rich');
  await expect(page.locator('.debug-overlay')).toContainText('Enemies 10');
  await expect(page.locator('.debug-overlay')).toContainText('Projectiles 36 (P0/E36)');
  await expect(page.locator('.debug-overlay')).toContainText('Telegraphs 4');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Roles scout:2 bruiser:2 screener:4 disruptor:2'
  );
  await expect(page.locator('.debug-overlay')).toContainText('Enemy budget E36/54 T4/6 ok');
  await expect(page.locator('.debug-overlay')).toContainText(/Enemy meta V10 .*F10/);
  await expect(page.locator('.debug-overlay')).toContainText('screen:3');
  await expect(page.locator('.debug-overlay')).toContainText('pincer:2');
  await expect(page.locator('.debug-overlay')).toContainText('escort:2');
  await expect(page.locator('.debug-overlay')).toContainText('stagger:3');

  expect(browserErrors).toEqual([]);
});

test('exposes environmental stress budgets under high-contrast narrow smoke', async ({ page }) => {
  test.setTimeout(90_000);

  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 700 });
  await page.addInitScript((settings) => {
    window.localStorage.setItem('starbreak.settings.v1', JSON.stringify(settings));
  }, HIGH_CONTRAST_SETTINGS);

  await page.goto('./?debug=1&seed=ENVIRONMENT-STRESS-SMOKE');

  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-bullet-contrast', 'high');
  await expect(page.locator('html')).toHaveAttribute('data-performance-mode', 'true');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await page.keyboard.press('Enter');
  await expectGameplaySector(page, 'Outer Debris Field');
  await expect(page.locator('.debug-overlay')).toContainText('Viewport 390x700 narrow');

  await page.keyboard.press('H');
  await expect(page.locator('.debug-overlay')).toContainText('Scenario environment-stress');
  await expect(page.locator('.debug-overlay')).toContainText('Environment 6 (D4/O2)');
  await expect(page.locator('.debug-overlay')).toContainText('Loose 10/48 V32/120 C24/S8');
  await expect(page.locator('.debug-overlay')).toContainText(
    /Env stress H[0-4]\/4 (?:none|[a-z/]+) Obj6\/16 D4\/O2 Loose \d+\/48 V\d+\/120 ok/
  );
  await expect(page.getByTestId('pickup-readout')).toContainText(/Credits .* Salvage/);
  await expect(page.getByTestId('boss-warning')).not.toContainText('Warning clear');

  expect(browserErrors).toEqual([]);
});

test('exposes Act II junction, entry, finale, and two-act summary debug paths', async ({
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
  await page.setViewportSize({ width: 390, height: 700 });
  await page.addInitScript((settings) => {
    window.localStorage.setItem('starbreak.settings.v1', JSON.stringify(settings));
  }, HIGH_CONTRAST_SETTINGS);

  await page.goto('./?debug=1&seed=ACT2-FINALE-SMOKE');

  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-bullet-contrast', 'high');
  await expect(page.locator('html')).toHaveAttribute('data-performance-mode', 'true');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();

  await page.keyboard.press('J');
  await expect(page.getByRole('heading', { name: 'Midpoint Refit' })).toBeVisible();
  await expect(page.locator('.debug-overlay')).toContainText('Scene inter-act-junction');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Act Act II Core Descent 1/5 escalated/elevated'
  );
  await expect(page.locator('.debug-overlay')).toContainText('Junction Core Descent choices');

  await page.keyboard.press('I');
  await expectGameplaySector(page, 'Bio-Machine Bloom', 6);
  await expect(page.getByTestId('cockpit-hud')).toHaveAttribute('data-hud-mode', 'contrast');
  await expect(page.locator('.debug-overlay')).toContainText('Viewport 390x700 narrow');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Act Act II Core Descent 1/5 escalated/elevated'
  );
  await expect(page.locator('.debug-overlay')).toContainText('Act pressure');
  await expect(page.locator('.debug-overlay')).toContainText('Sector S6 Bio-Machine Bloom');
  await expect(page.locator('.debug-overlay')).toContainText(/Plan .*tags:/);
  await expect(page.locator('.debug-overlay')).toContainText(/Objective .+/);

  await page.keyboard.press('E');
  await expect(page.getByTestId('boss-warning')).toContainText('ENEMY RICH LANE');
  await expect(page.locator('.debug-overlay')).toContainText('Scenario enemy-rich');
  await expect(page.locator('.debug-overlay')).toContainText('Enemy budget');

  await page.keyboard.press('F');
  await expectGameplaySector(page, 'The Core Wreck', 10);
  await expect(page.getByTestId('boss-readout')).toContainText('The Core Wreck');
  await expect(page.locator('.debug-overlay')).toContainText('Scenario finale-smoke');
  await expect(page.locator('.debug-overlay')).toContainText('Finale');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Act Act II Core Descent 5/5 escalated/elevated'
  );
  await expect(page.locator('.debug-overlay')).toContainText(/Hazards .* A[1-4]/);
  await expect(page.locator('.debug-overlay')).toContainText(/Features L\d+\/H0/);

  await page.keyboard.press('Y');
  await expect(page.getByRole('heading', { name: 'Debug Run Ended' })).toBeVisible();
  await expect(page.getByText('Act II Core Descent 5/5 | 1/3 acts secured')).toBeVisible();
  await expect(
    page.getByText(/Debug: .* smoke path ended before official resolution/)
  ).toBeVisible();
  await expect(page.getByText(/Act II 4\/5 S9 .* \[/)).toBeVisible();
  await expect(page.getByText(/Junction: [+-]?\d+c\/[+-]?\d+kg/)).toBeVisible();

  await page.keyboard.press('G');
  await expect(page.getByRole('heading', { name: 'The Frontier Is Optional' })).toBeVisible();
  await expect(page.getByText(/Glass Meridian|Black Current|Silent Crown/)).toBeVisible();
  await page.getByTestId('frontier-choice-breach').click();
  await expect(page.getByText(/Act III Null Frontier/)).toBeVisible();

  await page.keyboard.press('G');
  await page.getByTestId('frontier-choice-extract').click();
  await expect(page.getByRole('heading', { name: 'Victory Confirmed' })).toBeVisible();
  await expect(page.getByText(/Core Extraction: complete victory/)).toBeVisible();
  await expect(
    page.getByText('Sectors Cleared', { exact: true }).locator('xpath=following-sibling::dd[1]')
  ).toHaveText('10');
  await expect(page.getByText('Act II Core Descent 5/5 | 2/3 acts secured')).toBeVisible();

  await page.keyboard.press('Q');
  await expect(page.getByTestId('command-deck')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Command Deck/ })).toBeVisible();
  await expect(page.getByTestId('carrier-risk-readout')).toContainText(
    /Hull .* Heat .* Debt .* Pursuit/
  );
  await expect(page.locator('[data-facility]')).toHaveCount(4);
  await page.locator('[data-testid^="carrier-service-"]').click();
  await expect(page.locator('.debug-overlay')).toContainText('Carrier');
  await expect(page.getByTestId('command-deck-continue')).toHaveText('Launch Gate Operation');
  await page.getByTestId('command-deck-continue').focus();
  await page.keyboard.press('Enter');
  await expectGameplaySector(page, 'Trade War Corridor', 2);

  await page.keyboard.press('M');
  await expect(page.getByTestId('mission-objective-preview')).toContainText('SABOTAGE');
  await page.keyboard.press('N');
  await expect(page.getByTestId('objective-readout')).toContainText('SABOTAGE');

  await page.keyboard.press('R');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await expect(page.getByTestId('faction-campaign-brief')).toContainText('Faction campaign:');
  await expect(page.getByTestId('faction-campaign-brief')).toContainText('RIVAL');
  await expect(page.locator('.debug-overlay')).toContainText('Campaign rivals');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('objective-readout')).toContainText('Rival');
  await expect(page.locator('.debug-overlay')).toContainText('Active rival');

  await page.keyboard.press('T');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await expect(page.getByTestId('crew-brief')).toContainText('Crew manifest:');
  await expect(page.getByTestId('crew-brief')).toContainText(':active:');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('crew-command-readout')).toContainText(
    /Wing C[1-3]\/F[0-2] active/
  );
  await page.getByTestId('crew-command-screen').click();
  await expect(page.getByTestId('crew-command-readout')).toContainText('SCREEN');
  await expect(page.locator('.debug-overlay')).toContainText('Crew screen');

  expect(browserErrors).toEqual([]);
});

test('opens voyage Scenario Lab fixtures under narrow accessible performance settings', async ({
  page
}) => {
  test.setTimeout(90_000);
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 700 });
  await page.addInitScript((settings) => {
    window.localStorage.setItem('starbreak.settings.v1', JSON.stringify(settings));
  }, HIGH_CONTRAST_SETTINGS);

  await page.goto('./?debug=1&seed=SCENARIO-LAB-SMOKE');
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-bullet-contrast', 'high');
  await expect(page.locator('html')).toHaveAttribute('data-performance-mode', 'true');

  await expect(page.getByRole('button', { name: 'Start Seeded Expedition' })).toBeFocused();
  for (let index = 0; index < 4; index += 1) await page.keyboard.press('Tab');
  await expect(page.getByTestId('open-scenario-lab')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  await expect(page.getByTestId('scenario-lab-intro')).toContainText('deterministic session');
  await expect(page.locator('[data-testid^="scenario-lab-lab_"]')).toHaveCount(16);
  await expect(page.locator('.debug-overlay')).toContainText('Scenario Lab catalog 16 cases');

  for (let index = 0; index < 6; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cockpit-hud')).toBeVisible();
  await expect(page.locator('.debug-overlay')).toContainText('Scenario lab:combined');
  await expect(page.locator('.debug-overlay')).toContainText('Scenario Lab combined 16 cases');
  await expect(page.locator('.debug-overlay')).toContainText('Set-piece');
  await expect(page.locator('.debug-overlay')).toContainText('Allies');
  await expect(page.locator('.debug-overlay')).toContainText('Combined proc');
  await expect(page.locator('.debug-overlay')).toContainText('Timeline');

  await page.keyboard.press('B');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  for (let index = 0; index < 7; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cockpit-hud')).toHaveAttribute('data-operation-mode', 'boarding');
  await expect(page.getByTestId('boarding-readout')).toContainText(/rooms .* bulkheads/);
  await expect(page.locator('.debug-overlay')).toContainText('Boarding');

  await page.keyboard.press('B');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  for (let index = 0; index < 8; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cockpit-hud')).toBeVisible();
  await expect(page.getByTestId('objective-readout')).toContainText(/owner .* reinforcements/);
  await expect(page.locator('.debug-overlay')).toContainText('Front ending');

  await page.keyboard.press('B');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  for (let index = 0; index < 9; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('crew-quarters')).toBeVisible();
  await expect(page.getByTestId('crew-arc-roster')).toContainText('trust');
  await expect(page.getByTestId('crew-relationships')).toBeVisible();
  await expect(page.locator('.debug-overlay')).toContainText('Crew arcs pending');

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  for (let index = 0; index < 10; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('fleet-bay')).toBeVisible();
  await expect(page.getByTestId('fleet-roster')).toContainText(/ready|damaged/);
  await expect(page.getByTestId('fleet-capacity')).toContainText('four crew-plus-fleet allies');
  await expect(page.locator('.debug-overlay')).toContainText('Fleet budget');
  await page.locator('[data-testid^="fleet-doctrine-"]').first().click();
  await expect(page.getByTestId('fleet-bay')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  for (let index = 0; index < 11; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('apex-dossier')).toBeVisible();
  await expect(page.getByTestId('apex-threats')).toContainText(/wounded|awaitingResolution/);
  await expect(page.getByTestId('apex-budget')).toContainText('shared boss/projectile/effect caps');
  await expect(page.locator('.debug-overlay')).toContainText('Apex budget');

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  for (let index = 0; index < 12; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('command-deck')).toBeVisible();
  await expect(page.getByTestId('carrier-risk-readout')).toContainText(/Hull .* Heat .* Debt/);
  await page.getByTestId('command-deck-continue').click();
  await expect(page.getByTestId('cockpit-hud')).toBeVisible();

  await page.keyboard.press('B');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  for (let index = 0; index < 13; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'The Frontier Is Optional' })).toBeVisible();
  const saveBeforeLabEnding = await page.evaluate(() =>
    window.localStorage.getItem('starbreak.save.v5')
  );
  await page.getByTestId('frontier-choice-extract').click();
  await expect(page.getByRole('heading', { name: 'Victory Confirmed' })).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('starbreak.save.v5'))).toBe(
    saveBeforeLabEnding
  );
  await page.getByRole('button', { name: 'Back to Menu' }).click();

  await page.getByRole('button', { name: 'Scenario Lab [Debug]' }).click();
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  for (let index = 0; index < 14; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('voyage-release-audit')).toBeVisible();
  await expect(page.getByTestId('voyage-audit-snapshot')).toContainText('Run snapshot v9');
  await expect(page.getByTestId('voyage-audit-measurements')).toContainText('completionist');
  await expect(page.getByTestId('voyage-audit-caveat')).toContainText('not player stopwatch time');

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  for (let index = 0; index < 15; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('scenario-timeline')).toBeVisible();
  await expect(page.getByTestId('scenario-timeline-list')).toContainText('decision:fixture');
  await expect(page.getByTestId('scenario-timeline-list')).toContainText('boss:fixture');

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  for (let index = 0; index < 2; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('salvage-foundry')).toBeVisible();
  await expect(page.getByTestId('foundry-boundary')).toContainText('Scenario Lab fixture');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();

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
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await page.keyboard.press('Enter');
  await expectGameplaySector(page, 'Outer Debris Field');
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

  await expect(page.getByRole('button', { name: 'Start Seeded Expedition' })).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();

  const firstPreviewText = await page.getByTestId('selected-contract-preview').textContent();
  await expect(page.getByRole('button', { name: 'Launch Contract' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(async () => page.getByTestId('selected-contract-preview').textContent())
    .not.toBe(firstPreviewText);

  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await page.keyboard.press('Enter');
  await expectGameplaySector(page, 'Outer Debris Field');
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

test('suspends, reloads, resumes, and clears a versioned expedition snapshot', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('./?debug=1&seed=VOYAGE-SNAPSHOT-ROUNDTRIP');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await page.keyboard.press('Enter');
  await expectGameplaySector(page, 'Outer Debris Field');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();
  await page.getByTestId('suspend-expedition').click();
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page.getByTestId('run-snapshot-summary')).toContainText(
    'Manually suspended operation'
  );
  await expect(page.getByTestId('run-snapshot-panel')).toContainText(
    'restarts the current operation'
  );

  await page.reload();
  await expect(page.getByTestId('run-snapshot-panel')).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('resume-expedition')).toBeFocused();
  await page.keyboard.press('Enter');
  await expectGameplaySector(page, 'Outer Debris Field');
  await expect(page.locator('.debug-overlay')).toContainText('Scene gameplay');

  await page.keyboard.press('8');
  await expect(page.getByTestId('mission-branch')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('run-snapshot-panel')).toContainText(
    'settled operational map checkpoint'
  );
  await page.getByTestId('resume-expedition').click();
  await expect(page.getByTestId('mission-branch')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('command-deck')).toBeVisible();
  await page.getByTestId('command-deck-continue').click();
  await expectGameplaySector(page, 'Outer Debris Field');

  await page.keyboard.press('G');
  await expect(page.getByRole('heading', { name: 'The Frontier Is Optional' })).toBeVisible();
  await page.getByTestId('frontier-choice-extract').click();
  await expect(page.getByRole('heading', { name: 'Victory Confirmed' })).toBeVisible();
  await expect(page.getByText(/Core Extraction: complete victory/)).toBeVisible();
  await page.getByRole('button', { name: 'Back to Menu' }).click();
  await expect(page.getByTestId('run-snapshot-panel')).toHaveCount(0);

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
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await page.keyboard.press('Enter');
  await expectGameplaySector(page, 'Outer Debris Field');

  const startPosition = await readPlayerPosition(page);
  await page.mouse.move(1200, 550);
  await expect(page.locator('.debug-overlay')).toContainText('Input pointer');
  await expect(page.locator('.debug-overlay')).toContainText(/Safe \d+,\d+ \d+x\d+/);

  await expect
    .poll(async () => (await readPlayerPosition(page)).x)
    .toBeGreaterThan(startPosition.x + 100);

  await expect.poll(async () => (await readPlayerPosition(page)).x).toBeGreaterThan(585);
  const edgePosition = await readPlayerPosition(page);

  await page.mouse.move(1200, 300);
  await expect
    .poll(async () => (await readPlayerPosition(page)).y)
    .toBeLessThan(edgePosition.y - 80);

  const slidePosition = await readPlayerPosition(page);
  expect(slidePosition.x).toBeGreaterThanOrEqual(edgePosition.x - 4);

  await page.mouse.down();
  await expect(page.getByTestId('combat-status')).toContainText(/Shots [1-9]/);
  await page.mouse.up();

  expect(browserErrors).toEqual([]);
});

async function readPlayerPosition(page: Page): Promise<{ x: number; y: number }> {
  const text = await page.getByTestId('player-position').textContent();
  const match = text?.match(/^Player (\d+),(\d+)$/);

  if (!match) {
    throw new Error(`Unable to parse player position: ${text ?? 'missing'}`);
  }

  return {
    x: Number(match[1]),
    y: Number(match[2])
  };
}

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
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await page.keyboard.press('Enter');
  await expectGameplaySector(page, 'Outer Debris Field');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Viewport 390x700 narrow @0.57 DPR 1.00'
  );
  await expect(page.locator('.debug-overlay')).toContainText('Canvas 390x700');
  await expect(page.locator('.debug-overlay')).toContainText('Safe 14,204 362x407');
  await expect(page.locator('.debug-overlay')).toContainText('World 640x720');
  await expect(page.locator('.debug-overlay')).toContainText('Input none');
  await expect(page.locator('.debug-overlay')).toContainText('HUD standard');
  await expect(page.getByTestId('objective-readout')).toBeVisible();
  await expect(page.getByTestId('expedition-readout')).toBeVisible();

  const hudBox = await page.locator('.game-hud').boundingBox();
  if (!hudBox) {
    throw new Error('Expected the gameplay HUD to have a browser layout box.');
  }

  expect(hudBox.width).toBeLessThanOrEqual(390);
  expect(hudBox.y + hudBox.height).toBeLessThanOrEqual(175);

  expect(browserErrors).toEqual([]);
});

async function forceCompleteSectorAndEnterNext(page: Page, nextSectorName: string): Promise<void> {
  await page.keyboard.press('8');
  await expect(page.getByTestId('sector-exit-toast')).toContainText(
    /clear\. (Main thrusters igniting|Ship accelerating out of sector)/
  );
  await expect(page.getByTestId('mission-branch')).toBeVisible();
  await page.getByTestId('mission-branch-direct').click();
  await page.getByTestId('command-deck-continue').click();
  await expect(page.locator('.debug-overlay')).toContainText('Mission combat active');
  await page.keyboard.press('8');
  await expect(page.getByTestId('mission-branch')).toBeVisible();
  await page.getByTestId('mission-branch-direct').click();
  await page.getByTestId('mission-relief-continue').click();
  await expect(page.getByRole('heading', { name: 'Choose Route' })).toBeVisible();

  await chooseFirstRouteAndReward(page);
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await expect(page.getByTestId('mission-objective-preview')).toContainText(
    /ASSAULT|PURSUE|SALVAGE|RESCUE|DEFEND|SCAN|SABOTAGE|ESCAPE|ESCORT|BREACH GATE/
  );

  await page.getByRole('button', { name: 'Begin Operation' }).click();
  await expectGameplaySector(page, nextSectorName);
}

async function expectGameplaySector(
  page: Page,
  sectorName: string,
  sectorIndex?: number
): Promise<void> {
  const expectedText =
    sectorIndex === undefined ? sectorName : `Sector ${sectorIndex} | ${sectorName}`;

  await expect(page.locator('.hud-pill').filter({ hasText: expectedText })).toBeVisible();
}

async function chooseFirstRouteAndReward(page: Page): Promise<void> {
  const firstRoute = page.locator('.route-card').first();
  const routeTestId = await firstRoute.getAttribute('data-testid');

  await firstRoute.click();

  if (routeTestId === 'route-shop') {
    await expect(page.getByRole('heading', { name: 'Shop' })).toBeVisible();
    await page.getByRole('button', { name: 'Leave Shop' }).click();
  } else {
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Choose Reward' })).toBeVisible();
  await page.getByRole('button', { name: /Take / }).first().click();
  await expect(page.getByTestId('salvage-foundry')).toBeVisible();
  await page.getByTestId('foundry-skip').click();
}
