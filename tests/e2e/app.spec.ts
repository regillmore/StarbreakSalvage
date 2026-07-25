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

const PHASE_PREVIEW_SAVE = {
  ...SCRAP_BAY_SAVE,
  salvageBank: 0,
  unlockedIds: [
    'unlock_ship_phase_courier',
    'unlock_ship_shield_bruiser',
    'unlock_ship_scrap_monk',
    'unlock_ship_corporate_test_pilot',
    'unlock_ship_relic_thief'
  ]
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
  await expect(page.getByRole('heading', { name: 'Open the contract channel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Expedition' })).toBeFocused();
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
  await expect(page.locator('[data-testid^="contract-ignition-ship_"]')).toHaveCount(3);
  await expect(page.getByTestId('selected-contract-preview')).toContainText(/.+/);
  await expect(page.getByTestId('selected-loadout-preview')).toContainText(/frame/i);
  await expect(page.getByTestId('contract-attack-preview')).toBeVisible();
  await expect(page.getByTestId('contract-attack-projectile-layer')).toHaveAttribute(
    'data-volley-size',
    /\d+/
  );
  expect(await page.getByTestId('contract-attack-projectile').count()).toBeGreaterThan(0);
  await expect(page.getByTestId('selected-contract-ignition')).toBeVisible();
  await expect(
    page.getByTestId('selected-contract-preview').getByRole('img', { name: /ship preview/ })
  ).toBeVisible();

  const firstPreviewText = await page.getByTestId('selected-contract-preview').textContent();
  const firstIgnitionText = await page.getByTestId('selected-contract-ignition').textContent();
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(async () => page.getByTestId('selected-contract-preview').textContent())
    .not.toBe(firstPreviewText);
  await expect
    .poll(async () => page.getByTestId('selected-contract-ignition').textContent())
    .not.toBe(firstIgnitionText);

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
  const missilePreviewShots = page.getByTestId('contract-attack-projectile');
  expect(await missilePreviewShots.count()).toBeGreaterThan(0);
  await expect(missilePreviewShots.first()).toHaveAttribute('data-flight-kind', 'missile');
  await expect(missilePreviewShots.first()).toHaveAttribute('data-tags', /missile/);

  await page
    .locator('article')
    .filter({ hasText: 'Debt Runner' })
    .getByRole('button', { name: /Select|Selected/ })
    .click();
  await expect(page.getByTestId('selected-contract-preview')).toContainText('Debt Runner');
  await expect(page.getByTestId('selected-contract-preview')).toContainText('Redline Needle frame');
  await expect(
    page.getByTestId('selected-contract-preview').locator('.contract-metric-grid-hero')
  ).toBeVisible();
  await expect(
    page.getByTestId('selected-contract-preview').locator('.contract-metric')
  ).toHaveCount(5);
  await expect(
    page.getByTestId('selected-contract-preview').locator('.contract-trait')
  ).toHaveCount(2);
  await expect(page.getByTestId('selected-contract-preview')).not.toContainText('Mounted:');
  const needlePreviewShots = page.locator(
    '[data-testid="contract-attack-projectile"][data-laser-kind="needle"]'
  );
  expect(await needlePreviewShots.count()).toBeGreaterThan(0);
  await expect(needlePreviewShots.first()).toHaveAttribute('data-tags', /laser/);
  await expect(needlePreviewShots.first().locator('.attack-simulation-laser-core')).toHaveCount(1);
  await expect(page.getByTestId('contract-attack-preview')).toHaveAttribute(
    'aria-label',
    /velocity-aligned luminous bodies.*needle/i
  );

  await page.getByRole('button', { name: 'Launch Contract' }).click();

  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Breach Levy briefing/ })).toBeVisible();
  await expect(page.getByTestId('mission-story-brief')).toContainText(
    'Open the debris customs line by force.'
  );
  await expect(page.getByTestId('mission-objective-preview')).toContainText('ASSAULT');
  const briefingMetricCount = await page.locator('.navigation-detail-body > *').count();
  expect(briefingMetricCount).toBeGreaterThanOrEqual(2);
  expect(briefingMetricCount).toBeLessThanOrEqual(4);
  await expect(page.getByTestId('navigation-map')).toBeVisible();
  await expect(page.getByTestId('navigation-map')).toHaveAttribute(
    'data-constellation-view',
    'focus'
  );
  await expect(page.getByTestId('navigation-map-view-toggle')).toHaveText('View Full Act');
  await expect(page.locator('.navigation-map-routes')).not.toHaveAttribute(
    'viewBox',
    '0 0 100 100'
  );
  await page.getByTestId('navigation-map-view-toggle').click();
  await expect(page.getByTestId('navigation-map')).toHaveAttribute(
    'data-constellation-view',
    'overview'
  );
  await expect(page.locator('.navigation-map-routes')).toHaveAttribute('viewBox', '0 0 100 100');
  await expect(page.getByTestId('navigation-map-view-toggle')).toHaveText('Focus Choices');
  await page.getByTestId('navigation-map-view-toggle').click();
  await expect(page.locator('.constellation-node[data-node-kind="sector"]')).toHaveCount(9);
  await expect(page.locator('.constellation-node[data-node-kind="service"]')).toHaveCount(5);
  await expect(page.locator('.navigation-map-routes line')).toHaveCount(14);
  await expect(
    page.locator('.constellation-node[data-constellation-status="revealed"]')
  ).toHaveCount(0);
  await expect(
    page.locator('.constellation-node[data-node-kind="sector"][data-constellation-status="hidden"]')
  ).toHaveCount(8);
  await expect(page.getByTestId('navigation-sector-2')).toContainText('Unknown');
  await expect(page.getByTestId('navigation-sector-2')).toContainText('UNRESOLVED');
  await expect(page.getByTestId('navigation-sector-2')).toBeDisabled();
  await expect(page.getByTestId('navigation-destination-launch')).toHaveCSS(
    'animation-name',
    'none'
  );
  expect(
    await page
      .getByTestId('navigation-destination-launch')
      .evaluate((element) => getComputedStyle(element, '::after').animationName)
  ).toContain('constellation-sector-pulse');
  await expect(page.getByTestId('open-shop')).toHaveAttribute('aria-label', /available/);
  await expect(page.getByTestId('open-hardpoint-control')).toHaveAttribute(
    'aria-label',
    /available/
  );
  await expect(page.getByTestId('open-fleet-bay')).toHaveAttribute('aria-label', /available/);
  await expect(page.getByTestId('open-apex-dossier')).toHaveAttribute('aria-label', /available/);
  await expect(page.getByTestId('open-apex-dossier').locator('.apex-glyph')).toHaveAttribute(
    'data-glyph-id',
    'tri-vector'
  );
  await page.getByTestId('open-apex-dossier').click();
  await expect(page.getByTestId('apex-service-network').locator('.apex-glyph')).toHaveAttribute(
    'data-glyph-id',
    'tri-vector'
  );
  await page.getByTestId('navigation-destination-launch').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.navigation-destination-node:focus')).not.toHaveAttribute(
    'data-destination-id',
    'launch'
  );
  await page.getByTestId('navigation-destination-launch').click();
  await page.getByTestId('navigation-destination-action').focus();
  await page.keyboard.press('Enter');

  await expectGameplaySector(page, 'Outer Debris Field');
  await expect(page.getByTestId('apex-contact-banner')).toBeVisible();
  await expect(page.getByTestId('apex-contact-banner')).toContainText('Acquire trace');
  await expect(page.getByTestId('apex-contact-banner').locator('.apex-glyph')).toHaveAttribute(
    'data-apex-surface',
    'contact-banner'
  );
  await expect(page.getByTestId('apex-readout')).toBeVisible();
  await expect(page.getByTestId('apex-readout')).toContainText('Acquire trace');
  await expect(page.getByTestId('apex-readout').locator('.apex-glyph')).toHaveAttribute(
    'data-apex-surface',
    'combat-readout'
  );
  await expect(page.getByTestId('distance-readout')).toContainText(/Distance \d+\/\d+u/);
  await expect(page.getByTestId('hull-readout')).toContainText('Hull');
  await expect(page.getByTestId('pickup-readout')).toContainText(/Credits .* Salvage/);
  await expect(page.getByTestId('cockpit-hud')).toHaveAttribute('data-hud-theme', 'redline');
  await expect(page.getByTestId('hud-theme-readout')).toContainText('REDLINE COCKPIT');
  await expect(page.getByTestId('arena-hud-frame')).toHaveAttribute('data-hud-theme', 'redline');
  await expect(page.getByTestId('arena-hud-frame')).toHaveAttribute('data-rail-mode', 'side');
  await expect(page.getByTestId('arena-hud-designator')).toContainText('PURSUIT VECTOR');
  await expect(page.getByTestId('arena-hud-designator')).toContainText('Debt Runner');
  const arenaFrameBox = await page.getByTestId('arena-hud-frame').boundingBox();
  const arenaLeftMetersBox = await page.getByTestId('arena-hud-left-meters').boundingBox();
  const arenaRightMetersBox = await page.getByTestId('arena-hud-right-meters').boundingBox();
  if (!arenaFrameBox || !arenaLeftMetersBox || !arenaRightMetersBox) {
    throw new Error('Expected the wide contract frame and both meter consoles.');
  }
  expect(arenaFrameBox).toMatchObject({ x: 381, y: 94, width: 519, height: 584 });
  expect(arenaLeftMetersBox.x + arenaLeftMetersBox.width).toBeLessThan(arenaFrameBox.x);
  expect(arenaRightMetersBox.x).toBeGreaterThan(arenaFrameBox.x + arenaFrameBox.width);
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
    'S1 Outer Debris Field | Breach Assault: sector operation'
  );
  await expect(page.getByTestId('pickup-readout')).toBeHidden();
  await expect(page.getByTestId('combat-status')).toBeHidden();
  await expect(page.getByTestId('item-readout')).toBeHidden();
  await expect(page.getByTestId('ship-loadout-readout')).toBeHidden();
  await expect(page.locator('.crew-command-bar')).toHaveCount(0);
  await expect(page.getByTestId('hint-readout')).toContainText('Hint');
  await expect(page.getByTestId('verb-readout')).toContainText('Special');
  await expect(page.getByTestId('weapon-readout')).toContainText('Heat');
  await expect(page.getByTestId('boss-readout')).toContainText('Boss');
  await expect(page.getByTestId('item-readout')).toContainText(/Build .+ \| 1 item/);
  await expect(page.locator('.debug-overlay')).toContainText('Theme redline/Debt Runner');
  await expect(page.locator('.debug-overlay')).toContainText('HUD standard');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Expedition expedition_s01_gate_operation 2/108 decisions 0'
  );
  await expect(page.locator('.debug-overlay')).toContainText('Mission combat active');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Contract contract_breach_levy | Objective assault/objective_breach_assault'
  );
  await expect(page.locator('.debug-overlay')).toContainText('Expedition capacity 16.8-21.0m');
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
  await expect(page.getByTestId('pause-dossier')).toBeVisible();
  await expect(page.locator('.pause-metric')).toHaveCount(4);
  await expect(page.locator('.pause-dossier-card')).toHaveCount(4);
  await expect(page.getByTestId('pause-section-operation')).toContainText('Current operation');
  await expect(page.getByTestId('pause-section-sector')).toContainText('Sector conditions');
  await expect(page.getByTestId('pause-section-ship')).toContainText('Signal circuit');
  await expect(page.getByTestId('pause-section-ledger')).toContainText('Expected boss');

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expectGameplaySector(page, 'Outer Debris Field');

  await page.keyboard.press('U');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Scenario set-piece:setpiece_ledger_hecaton'
  );
  await expect(page.getByTestId('objective-readout')).toContainText('Shield Emitter');
  await page.keyboard.press('8');
  await expect(page.getByTestId('sector-exit-toast')).toContainText(
    /Outer Debris Field clear\. (Recalling .+|Wing collected; main thrusters igniting|Ship and wing accelerating out of sector|Main thrusters igniting|Ship accelerating out of sector)/
  );
  await expect(page.locator('.debug-overlay')).toContainText(
    /Exit sectorComplete (rendezvous|ignition|boost|clear|transition) \d+%/
  );
  await expect(page.getByTestId('command-deck')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Choose Reward' })).toBeVisible();
  await expect(page.locator('.reward-panel')).toHaveAttribute('data-contract-theme', 'redline');
  await expect(page.getByTestId('reward-grid')).toHaveAttribute('data-item-choice-count', '3');
  await expect(page.getByTestId('reward-grid')).toHaveAttribute('data-total-choice-count', '5');
  await expect(page.locator('.reward-card')).toHaveCount(5);
  await expect(page.locator('.reward-panel')).toHaveJSProperty('scrollTop', 0);
  expect(
    await page
      .locator('.reward-panel')
      .evaluate((panel) => panel.scrollHeight <= panel.clientHeight + 1)
  ).toBe(true);
  await expect(page.locator('.reward-card').filter({ hasText: 'Build fit:' })).toHaveCount(0);
  await expect(
    page
      .locator('.reward-card')
      .first()
      .getByRole('img', { name: /item icon/ })
  ).toBeVisible();
  await expect(page.locator('.reward-card').first()).toContainText('Trigger');
  await expect(page.locator('.reward-card').first()).toContainText('Take circuit');
  await expect(
    page.locator('.reward-card .item-badge-status[data-effect-state="live"]')
  ).toHaveCount(0);
  await expect(page.getByTestId('reward-primary-weapon')).toContainText('Primary Weapon');
  const rewardWeaponIcon = page.getByTestId('reward-primary-weapon').locator('.weapon-icon');
  await expect(rewardWeaponIcon).toHaveCount(1);
  await expect(rewardWeaponIcon).toHaveAttribute('aria-label', /weapon icon$/);
  await expect(rewardWeaponIcon).toHaveAttribute('data-icon-kind', /\w+/);
  await expect(page.getByTestId('reward-primary-weapon')).toContainText('Mounted delta');
  await expect(page.getByTestId('reward-primary-weapon')).toContainText('Take Weapon to Cargo');
  await page.getByRole('button', { name: /Take / }).first().click();
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await expect(page.getByTestId('navigation-destination-optional')).toContainText('OPTIONAL');
  await expect(page.getByTestId('navigation-destination-route')).toContainText(
    /2A .* Trade War Corridor/
  );
  await expect(page.getByTestId('navigation-destination-route')).toContainText('EASIER');
  await expect(page.locator('.constellation-node[data-destination-id^="route:"]')).toHaveCount(2);
  await expect(page.locator('.constellation-node[data-signal="apex-track"]')).toHaveCount(1);
  await expect(page.locator('.constellation-node[data-signal="apex-break"]')).toHaveCount(1);
  await expect(page.locator('.constellation-node[data-signal="apex-track"]')).toContainText(
    'TRACK'
  );
  await expect(page.locator('.constellation-node[data-signal="apex-break"]')).toContainText(
    'BREAKS TRACK'
  );
  await expect(
    page.locator('.constellation-node[data-signal="apex-track"] .apex-glyph')
  ).toHaveCount(1);
  await expect(
    page.locator('.constellation-node[data-signal="apex-track"] .apex-glyph')
  ).toHaveAttribute('data-glyph-id', 'tri-vector');
  await expect(
    page.locator('.constellation-node[data-signal="apex-break"] .apex-glyph')
  ).toHaveCount(0);
  await page.getByTestId('navigation-map-view-toggle').click();
  await expect(page.getByTestId('navigation-map')).toHaveAttribute(
    'data-constellation-view',
    'overview'
  );
  await expect(
    page.locator('.constellation-node[data-signal="apex-track"] .apex-glyph')
  ).toHaveCount(1);
  await page.getByTestId('navigation-map-view-toggle').click();
  await expect(page.getByTestId('navigation-map')).toHaveAttribute(
    'data-constellation-view',
    'focus'
  );
  await expect(page.getByTestId('navigation-destination-route')).toHaveAttribute(
    'data-constellation-status',
    'choice'
  );
  await expect(page.getByTestId('navigation-destination-route')).toBeEnabled();
  await expect(page.getByTestId('navigation-destination-continue')).toHaveCount(0);
  await expect(
    page.locator('.constellation-node[data-node-kind="sector"][data-constellation-status="choice"]')
  ).toHaveCount(3);
  await expect(
    page
      .locator('.constellation-node[data-node-kind="sector"][data-constellation-status="choice"]')
      .last()
  ).toHaveCSS('opacity', '1');
  await expect(page.getByTestId('navigation-map')).toHaveAttribute(
    'data-constellation-focus-count',
    '3'
  );
  const readyNodeBoxes = await page
    .locator('.constellation-node[data-node-kind="sector"][data-constellation-status="choice"]')
    .evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          left: bounds.left,
          right: bounds.right,
          top: bounds.top,
          bottom: bounds.bottom
        };
      })
    );
  for (let leftIndex = 0; leftIndex < readyNodeBoxes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < readyNodeBoxes.length; rightIndex += 1) {
      const left = readyNodeBoxes[leftIndex]!;
      const right = readyNodeBoxes[rightIndex]!;
      const overlaps =
        left.left < right.right &&
        left.right > right.left &&
        left.top < right.bottom &&
        left.bottom > right.top;
      expect(overlaps).toBe(false);
    }
  }
  expect(
    await page
      .getByTestId('navigation-destination-route')
      .evaluate((element) => getComputedStyle(element, '::after').animationName)
  ).toContain('constellation-sector-pulse');
  expect(
    await page
      .getByTestId('navigation-destination-optional')
      .evaluate((element) => getComputedStyle(element, '::after').animationName)
  ).toContain('constellation-sector-pulse');
  expect(
    await page
      .getByTestId('navigation-destination-optional')
      .evaluate((element) => getComputedStyle(element).borderTopColor)
  ).toContain('255, 209, 102');
  expect(
    await page
      .locator('.constellation-node[data-signal="apex-track"]')
      .evaluate((element) => getComputedStyle(element).borderTopColor)
  ).toContain('255, 209, 102');
  expect(
    await page
      .locator('.constellation-node[data-signal="apex-break"]')
      .evaluate((element) => getComputedStyle(element).borderTopColor)
  ).toContain('255, 209, 102');
  expect(
    await page
      .locator('.constellation-node[data-signal="apex-track"] .navigation-node-glyph')
      .evaluate((element) => getComputedStyle(element).color)
  ).toContain('255, 209, 102');
  await expect(page.getByTestId('navigation-route-effect')).toBeVisible();
  await expect(page.getByTestId('navigation-route-effect')).toContainText('BASE ROUTE EFFECT');
  await expect(page.getByTestId('apex-pursuit-route-preview')).toContainText(
    /TRACK LOCK|TRACK BREAK/
  );
  await expect(
    page.getByTestId('apex-pursuit-route-preview').locator('.apex-glyph')
  ).toHaveAttribute('data-glyph-id', 'tri-vector');
  await expect(page.getByTestId('navigation-route-commit')).toBeEnabled();
  await expect(page.locator('.navigation-route-card')).toHaveCount(0);
  const openingRouteEffect =
    (await page.getByTestId('navigation-route-effect').textContent()) ?? '';
  const openingEffectName =
    (await page.locator('.navigation-route-effect-heading strong').textContent()) ?? '';
  await expect(page.getByTestId('navigation-destination-route')).toContainText(
    openingEffectName.toUpperCase()
  );
  await expect(page.getByTestId('navigation-optional-action')).toHaveCount(0);
  expect(
    await page
      .locator('.navigation-route-body')
      .evaluate((element) => element.scrollHeight <= element.clientHeight + 1)
  ).toBe(true);
  await page.getByTestId('navigation-destination-optional').click();
  await expect(page.getByTestId('navigation-route-effect')).toHaveCount(0);
  await expect(page.getByTestId('navigation-optional-action')).toBeEnabled();
  await page.getByTestId('navigation-optional-action').click();
  await expect(page.locator('.debug-overlay')).toContainText('Mission combat active');
  await page.keyboard.press('8');
  await expect(page.getByRole('heading', { name: 'Choose Reward' })).toHaveCount(0);
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Running Audit briefing/ })).toBeVisible();
  await expect(page.getByTestId('navigation-destination-route')).toContainText('EASIER');
  await expect(page.getByTestId('navigation-route-effect')).toBeVisible();
  await expect(page.getByTestId('navigation-route-commit')).toBeEnabled();
  await expect(page.getByTestId('mission-relief')).toHaveCount(0);
  await expect(page.getByTestId('route-edge-preview')).toContainText(
    'Outer Debris Field → Trade War Corridor'
  );
  await expect(page.getByTestId('route-mission-preview')).toContainText('PURSUE · Running Pursuit');
  await expect(page.getByTestId('navigation-destination-detail')).not.toContainText('Campaign:');
  await expect(page.getByTestId('navigation-destination-detail')).not.toContainText(
    'Seed Exchange'
  );
  await expect(page.getByRole('heading', { name: 'Choose Route' })).toHaveCount(0);
  await expect(page.locator('.transition-panel')).toHaveAttribute('data-contract-theme', 'redline');
  await expect(page.getByTestId('contract-theme-strip')).toContainText(
    'REDLINE CONTRACT | Debt Runner'
  );
  await page.setViewportSize({ width: 1600, height: 1200 });
  const navigationSuspend = page.getByTestId('suspend-navigation');
  await expect(navigationSuspend).toBeVisible();
  await expect(
    page.locator('.navigation-hub-header').getByTestId('suspend-navigation')
  ).toHaveCount(1);
  await expect(
    page.locator('.navigation-hub-footer').getByTestId('suspend-navigation')
  ).toHaveCount(0);
  const navigationHeaderGeometry = await page
    .locator('.navigation-hub-header')
    .evaluate((header) => {
      const suspend = header.querySelector<HTMLElement>('[data-testid="suspend-navigation"]');
      const resources = header.querySelector<HTMLElement>('.navigation-resource-strip');
      const suspendRect = suspend?.getBoundingClientRect();
      const resourceRect = resources?.getBoundingClientRect();
      return {
        suspendBottom: suspendRect?.bottom ?? Number.POSITIVE_INFINITY,
        suspendRight: suspendRect?.right ?? Number.NEGATIVE_INFINITY,
        resourceTop: resourceRect?.top ?? Number.NEGATIVE_INFINITY,
        resourceRight: resourceRect?.right ?? Number.POSITIVE_INFINITY
      };
    });
  expect(navigationHeaderGeometry.suspendBottom).toBeLessThanOrEqual(
    navigationHeaderGeometry.resourceTop
  );
  expect(
    Math.abs(navigationHeaderGeometry.suspendRight - navigationHeaderGeometry.resourceRight)
  ).toBeLessThanOrEqual(1);
  const navigationPanelOverflow = await page
    .getByTestId('mission-briefing')
    .evaluate((panel) => panel.scrollHeight - panel.clientHeight);
  expect(navigationPanelOverflow).toBeLessThanOrEqual(1);
  await page.getByTestId('suspend-navigation').click();
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page.getByTestId('run-snapshot-summary')).toContainText(
    'Suspended at route plot after sector 1'
  );
  await expect(page.getByTestId('run-snapshot-panel')).toContainText(
    'settled operational map checkpoint'
  );
  await expect(page.getByTestId('run-snapshot-notice')).toContainText(
    'suspended safely at the constellation'
  );
  await page.getByTestId('resume-expedition').click();
  await expect(page.getByTestId('navigation-route-effect')).toBeVisible();
  await expect(page.getByTestId('navigation-route-effect')).toHaveText(openingRouteEffect);
  await expect(page.getByTestId('navigation-route-commit')).toBeEnabled();

  await page.getByTestId('open-hardpoint-control').click();
  await expect(page.getByTestId('navigation-destination-detail')).toContainText(
    'Hardpoint Control'
  );
  await page.getByTestId('navigation-destination-action').click();
  await expect(page.getByTestId('salvage-foundry')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 700 });
  await expect(page.getByRole('heading', { name: 'Hardpoint Control' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Evolution(?: \/ \d+)?$/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Route \// })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Clock \// })).toHaveCount(0);
  await expect(page.getByTestId('foundry-boundary')).toContainText(/Undo restores/i);
  await expect(page.getByTestId('foundry-hardpoint-assignments')).toHaveCount(0);
  await expect(page.getByTestId('foundry-primary-selector')).toBeVisible();
  const mountedWeaponIcon = page.getByTestId('foundry-primary-selector').locator('.weapon-icon');
  await expect(mountedWeaponIcon).toHaveCount(1);
  await expect(mountedWeaponIcon).toHaveAttribute('aria-label', /weapon icon$/);
  await expect(page.getByTestId('foundry-primary-assignment')).toHaveValue(
    'component-contract-nose-primary'
  );
  await expect(page.getByTestId('foundry-primary-assignment').locator('option')).toHaveCount(1);
  await expect(page.getByTestId('foundry-cargo-menu')).toHaveCount(0);
  await expect(page.getByTestId('foundry-open-cargo')).toContainText('Primary Cargo / 0');
  await expect(page.getByTestId('foundry-grid-readout')).toHaveCount(0);
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
  await expect(page.locator('[data-testid^="foundry-meter-"]')).toHaveCount(0);
  await expect(
    page.getByTestId('foundry-primary-selector').locator('[data-stat="circuit"]')
  ).toHaveCount(1);
  await expect(
    page.getByTestId('foundry-primary-selector').locator('[data-stat="power"]')
  ).toHaveCount(0);
  await expect(page.locator('.foundry-circuit-contribution')).toHaveCount(0);
  await expect(page.getByTestId('foundry-attack-impact')).toBeVisible();
  await expect(page.getByTestId('foundry-attack-baseDps')).toBeVisible();
  await expect(page.getByTestId('foundry-attack-baseDps')).toContainText(/\d+\.\d/);
  await expect(page.getByTestId('foundry-attack-dps-note')).toHaveText(
    /^[1-9]\d*-VOLLEY MEASURE · DIRECT PROJECTILE DAMAGE · HIT PROCS EXCLUDED$/
  );
  const upgradeCircuit = page.getByTestId('foundry-upgrade-circuit');
  await expect(
    upgradeCircuit.getByRole('heading', { name: 'Primary Weapon Circuit' })
  ).toBeVisible();
  await expect(upgradeCircuit).toContainText('2/3 LIVE / 1 OPEN');
  await expect(upgradeCircuit).toContainText(/PRIMARY BUS -> .* -> MUZZLE/);
  await expect(upgradeCircuit).toContainText('Every upgrade fits every primary-weapon conduit');
  await expect(page.getByTestId('foundry-circuit-extension')).toHaveCount(1);
  await expect(page.getByTestId('foundry-circuit-extension')).toContainText(
    /3.*PRIMARY WEAPON SLOTS/
  );
  const activeCircuitNodes = upgradeCircuit.locator(
    '.foundry-circuit-node:not(.foundry-circuit-node-empty)'
  );
  await expect(activeCircuitNodes).toHaveCount(2);
  await expect(page.getByTestId('foundry-circuit-open-node')).toHaveCount(1);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await expect(activeCircuitNodes.first().locator('.foundry-circuit-output')).toContainText(
    'OUTPUT'
  );
  const originalFirstStage = await activeCircuitNodes.first().getByRole('heading').textContent();
  await activeCircuitNodes
    .first()
    .getByRole('button', { name: /Move .* later/ })
    .click();
  await expect(page.getByTestId('foundry-status')).toContainText(/moved later/i);
  await expect(activeCircuitNodes.first().getByRole('heading')).not.toHaveText(
    originalFirstStage ?? ''
  );
  await activeCircuitNodes.first().getByRole('button', { name: 'Eject' }).click();
  await expect(page.getByTestId('foundry-status')).toContainText(/upgrade rack/i);
  const rackUpgrade = upgradeCircuit.locator('.foundry-upgrade-card').first();
  await expect(rackUpgrade.getByRole('button', { name: /Append .* to the circuit/ })).toBeEnabled();
  await rackUpgrade.getByRole('button', { name: /Append .* to the circuit/ }).click();
  await expect(page.getByTestId('foundry-status')).toContainText(/appended/i);
  await expect(activeCircuitNodes).toHaveCount(2);
  await page.getByTestId('foundry-undo').click();
  await expect(page.getByTestId('foundry-upgrade-circuit')).toContainText('2/3 LIVE / 1 OPEN');
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.locator('.foundry-cargo-card')).toHaveCount(0);
  await expect(page.getByTestId('foundry-pending-history')).toContainText('Draft clean.');
  await page.getByTestId('foundry-commit').click();
  await expect(page.getByRole('heading', { name: /Running Audit briefing/ })).toBeVisible();
  await expect(page.locator('.transition-panel')).toHaveAttribute('data-contract-theme', 'redline');
  await expect(page.getByTestId('open-hardpoint-control')).toHaveAttribute('data-visited', 'true');

  await page.getByTestId('navigation-destination-route').click();
  await commitSelectedDestinationAndDepart(page);
  await expect(page.getByRole('heading', { name: 'Choose Reward' })).toHaveCount(0);
  await expect(page.getByTestId('mission-briefing')).toHaveCount(0);
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
  await expect(page.getByTestId('distance-readout')).toContainText(/Distance \d{3,4}\/\d+u/);

  await page.keyboard.press('7');
  await expect(page.getByTestId('player-destruction-toast')).toContainText(
    /Cockpit failure \| Debt Runner TRANSPONDER LOST/i
  );
  await expect(page.locator('.debug-overlay')).toContainText(/Destruction standard \d+%/);
  await expect(page.getByRole('heading', { name: 'Ship Destroyed' })).toBeVisible();
  await expect(page.locator('.summary-panel')).toHaveAttribute('data-contract-theme', 'redline');
  await expect(page.getByText(/redline contract \| debt runner/i)).toBeVisible();
  await expect(page.getByTestId('summary-final-build')).toContainText('Redline Needle');
  await expect(page.getByTestId('summary-final-build')).toContainText(
    'Primary: Light Needle Laser'
  );
  await expect(page.getByTestId('summary-final-build')).toContainText(
    /Power \d+\/\d+ \| Heat \d+\/\d+/
  );
  await expect(page.getByTestId('summary-metrics').locator('.summary-metric')).toHaveCount(6);
  await expect(page.getByTestId('summary-flight-path')).toContainText('Act I');
  await expect(page.getByTestId('summary-flight-path')).toContainText('1A');
  await expect(page.getByTestId('summary-highlight-list')).toBeVisible();
  await expect(page.getByText('Engineering History', { exact: true })).toHaveCount(0);
  await expect(page.getByText('permadeath', { exact: true })).toBeVisible();
  await expect(page.getByText('Loss: ship destroyed and contract closed.')).toBeVisible();
  const summaryBounds = await page.locator('.summary-panel').boundingBox();
  expect(summaryBounds?.width ?? 0).toBeGreaterThan(900);
  const summarySize = await page.locator('.summary-panel').evaluate((panel) => ({
    clientHeight: panel.clientHeight,
    scrollHeight: panel.scrollHeight
  }));
  expect(summarySize.scrollHeight).toBeLessThanOrEqual(summarySize.clientHeight);
  expect(await page.locator('.summary-item-card').count()).toBeLessThanOrEqual(3);
  await expect(page.getByTestId('summary-item-list')).toContainText('Prototype Vent Script');
  await expect(page.getByTestId('summary-item-list')).toContainText('Heat Prototype');
  await expect(
    page.getByTestId('summary-item-list').getByRole('img', {
      name: 'Prototype Vent Script Heat Prototype item icon'
    })
  ).toBeVisible();
  await expect(page.getByTestId('scrap-breakdown')).toContainText(
    /Earned \+\d+ kg \| Bank \d+ -> \d+ kg/
  );
  await expect(page.getByTestId('upgrade-progress-callout')).toContainText(/upgrade|next/i);
  await expect(page.getByTestId('unlock-summary')).toContainText('Unlocked');
  await expect(page.getByTestId('seed-share-link')).toHaveValue(/seed=STARBREAK-SMOKE/);

  await page.getByRole('button', { name: 'Copy Seed Link' }).click();
  await expect(page.getByTestId('seed-share-status')).toContainText(/Seed link/);

  await page.getByRole('button', { name: 'Back to Menu' }).click();
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page.getByTestId('boot-status')).toContainText(/Bank [1-9]\d* kg/);

  await page.getByRole('button', { name: 'Unlock Archive' }).click();
  await expect(page.getByRole('heading', { name: 'Unlock Archive' })).toBeVisible();
  await expect(page.getByTestId('discovered-item-list')).toContainText('Prototype Vent Script');
  await expect(page.getByTestId('discovered-item-list')).toContainText('Trigger');
  await expect(page.locator('.archive-item-card .item-badge-status')).toHaveCount(0);

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

test('renders a real Phase Grazer volley with the shared phase identity', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(
    ({ save, settings }) => {
      window.localStorage.setItem('starbreak.save.v5', JSON.stringify(save));
      window.localStorage.setItem('starbreak.settings.v1', JSON.stringify(settings));
    },
    { save: PHASE_PREVIEW_SAVE, settings: HIGH_CONTRAST_SETTINGS }
  );

  await page.goto('./?debug=1&seed=RANDOM-1UB0590-26CZ9L');
  await expect(page.locator('html')).toHaveAttribute('data-bullet-contrast', 'high');
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-performance-mode', 'true');
  await page.getByRole('button', { name: 'Start Expedition' }).click();
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();
  const phaseContract = page.locator('article').filter({ hasText: 'Phase Courier' });
  await expect(phaseContract).toContainText('Phase Grazer');
  await phaseContract.getByRole('button', { name: /Select|Selected/ }).click();
  await expect(page.getByTestId('selected-contract-preview')).toContainText('Phase Courier');
  await expect(page.getByTestId('selected-contract-ignition')).toContainText('Phase Grazer');

  const phasePreviewShots = page.locator(
    '[data-testid="contract-attack-projectile"][data-tags~="phase"]'
  );
  expect(await phasePreviewShots.count()).toBeGreaterThan(0);
  await expect(phasePreviewShots.first()).toHaveAttribute('data-flight-kind', 'phase');
  await expect(phasePreviewShots.first().locator('.attack-simulation-phase-shell')).toHaveCount(1);
  await expect
    .poll(async () =>
      phasePreviewShots
        .first()
        .locator('.attack-simulation-phase-shell')
        .evaluate((shell) => getComputedStyle(shell).animationName)
    )
    .toBe('none');
  await expect(page.getByTestId('contract-attack-preview')).toHaveAttribute(
    'aria-label',
    /refracted core, displaced afterimages, and a broken wake/i
  );
  await expect(page.getByTestId('contract-attack-preview')).toHaveAttribute(
    'aria-label',
    /first damaging contact pierces and collapses the phase/i
  );
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
    'Progress Bank 8kg Upgrades 0/18 Ready 2'
  );
  await expect(page.getByTestId('upgrade-bay-summary')).toContainText(
    'Bank 8 kg | Installed 0/18 | Ready 2'
  );
  await expect(page.locator('[data-testid^="upgrade-card-"]')).toHaveCount(18);
  await expect(page.getByTestId('upgrade-card-upgrade_exit_toll_transponder')).toContainText(
    'Each sector begins with a 1-3 credit refund'
  );
  await expect(page.getByTestId('upgrade-card-upgrade_coupon_cascade_fuse')).toContainText(
    'Every shop trims prices by 1 credit'
  );
  await expect(page.getByTestId('upgrade-card-upgrade_low_orbit_ore_scrip')).toContainText(
    'Shop and Repair destinations refund 1 credit'
  );
  await expect(page.getByTestId('upgrade-card-upgrade_route_ledger_spool')).toContainText(
    'Every route reward cash-out carries 1 additional credit'
  );
  await expect(page.getByTestId('upgrade-card-upgrade_market_echo_locator')).toContainText(
    'Shop and Repair rewards gain one extra credit/magnet-biased choice'
  );
  await expect(page.getByTestId('upgrade-card-upgrade_ambush_insurance_stamp')).toContainText(
    'Elite and Faction Ambush routes pay 1 salvage'
  );
  await expect(page.getByTestId('upgrade-card-upgrade_surface_beacon_drone')).toContainText(
    'Lunar sectors begin with 1 salvage and 5% special charge'
  );
  await expect(page.getByTestId('upgrade-card-upgrade_crater_shadow_lens')).toContainText(
    'Lunar sectors begin with 8% instead'
  );

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
    'Bank 4 kg | Installed 1/18 | Ready 1'
  );
  await expect(page.locator('.debug-overlay')).toContainText(
    'Progress Bank 4kg Upgrades 1/18 Ready 1'
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

  await page.getByRole('button', { name: 'Start Expedition' }).click();
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

  await forceCompleteSectorAndEnterNext(page, 'Lunar Surface', {
    takeOptional: true,
    routeDifficulty: 'harder'
  });
  await expectGameplaySector(page, 'Lunar Surface', 3);
  await expect(page.locator('.debug-overlay')).toContainText('Sector S3 Lunar Surface');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Plan sector_lunar_surface/background_lunar_surface/paced'
  );
  await expect(page.locator('.debug-overlay')).toContainText(/Bg \d+p\/5l/);
  await expect(page.locator('.debug-overlay')).toContainText(/Features L\d+\/H\d+/);
  await expect(page.locator('.debug-overlay')).toContainText(/Run Credits \d+ Salvage \d+/);
  await expect(page.getByTestId('distance-readout')).toContainText(/Distance \d+\/\d+u/);

  await forceCompleteSectorAndEnterNext(page, 'Trade War Corridor', {
    routeDifficulty: 'harder'
  });
  await expectGameplaySector(page, 'Trade War Corridor', 6);
  await forceCompleteSectorAndEnterNext(page, 'Bio-Machine Bloom', {
    routeDifficulty: 'harder'
  });
  await expectGameplaySector(page, 'Bio-Machine Bloom', 8);

  await page.keyboard.press('8');
  await expect(page.getByRole('heading', { name: 'Choose Reward' })).toBeVisible();
  await page.getByRole('button', { name: /Take / }).first().click();
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  for (const sectorNumber of [1, 3, 6]) {
    await expect(page.getByTestId(`navigation-sector-${sectorNumber}`)).toContainText('CHARTED');
  }
  for (const sectorNumber of [2, 5, 7]) {
    await expect(page.getByTestId(`navigation-sector-${sectorNumber}`)).toContainText('BYPASSED');
  }
  await expect(page.getByTestId('navigation-destination-optional')).toContainText('4B');
  await expect(page.getByTestId('navigation-destination-route')).toContainText('5A');

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
  await expect(page.locator('.debug-overlay')).toContainText('Items 29 (29 unique)');
  await expect(page.locator('.debug-overlay')).toContainText(
    /Haste ACTIVE .* sources 6 drain coast-hold cooldown x0\.75/
  );
  await expect(page.getByTestId('weapon-readout')).toContainText('HASTE');
  await expect(page.getByTestId('weapon-readout')).toContainText('COAST');
  await expect(page.locator('.debug-overlay')).toContainText(/Hooks 10\/14 \d+ apps/);
  await expect(page.locator('.debug-overlay')).toContainText(/Proc on[A-Za-z]+ \d+\/48 skip 0/);
  await expect(page.locator('.debug-overlay')).toContainText(/Build .+ \| 29 items/);
  await expect(page.locator('.debug-overlay')).toContainText('Projectiles 30 (P0/E30)');
  await expect(page.locator('.debug-overlay')).toContainText('Telegraphs 2');
  await expect(page.getByTestId('item-readout')).toContainText(/Build .+ \| 29 items/);

  await page.keyboard.down(' ');
  await expect(page.getByTestId('combat-status')).toContainText(/Shots [1-9]/);
  await expect(page.getByTestId('combat-status')).toContainText(/Hooks [1-9]/);
  await expect(page.locator('.debug-overlay')).toContainText(/Combined proc onFire \d+\/\d+/);
  await expect(page.locator('.debug-overlay')).toContainText(/Heat shots F[1-9]\d*\/X[1-9]\d*/, {
    timeout: 10_000
  });
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

  await forceCompleteSectorAndEnterNext(page, 'Lunar Surface', {
    routeDifficulty: 'harder'
  });
  await expectGameplaySector(page, 'Lunar Surface', 3);
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
  await expect(page.getByTestId('boss-warning')).toContainText(
    /(?:METEOR STORM|ROUTE METEORS|PACED METEORS) \| \d+ MARKED \| \d+ IMPACTING/
  );

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
  await expect(page.getByTestId('mission-briefing')).toHaveCount(0);
  await expect(page.getByTestId('navigation-route-effect')).toHaveCount(0);
  await expect(page.locator('.route-card')).toHaveCount(0);
  await expect(page.locator('.debug-overlay')).toContainText('Scene inter-act-junction');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Act Act II Core Descent 1/5 escalated/elevated'
  );
  await expect(page.locator('.debug-overlay')).toContainText('Junction Core Descent choices');

  await page.keyboard.press('I');
  await expectGameplaySector(page, 'Trade War Corridor', 10);
  await expect(page.getByTestId('cockpit-hud')).toHaveAttribute('data-hud-mode', 'contrast');
  await expect(page.locator('.debug-overlay')).toContainText('Viewport 390x700 narrow');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Act Act II Core Descent 1/5 escalated/elevated'
  );
  await expect(page.locator('.debug-overlay')).toContainText('Act pressure');
  await expect(page.locator('.debug-overlay')).toContainText('Sector S10 Trade War Corridor');
  await expect(page.locator('.debug-overlay')).toContainText(/Plan .*tags:/);
  await expect(page.locator('.debug-overlay')).toContainText(/Objective .+/);

  await page.keyboard.press('E');
  await expect(page.getByTestId('boss-warning')).toContainText('ENEMY RICH LANE');
  await expect(page.locator('.debug-overlay')).toContainText('Scenario enemy-rich');
  await expect(page.locator('.debug-overlay')).toContainText('Enemy budget');

  await page.keyboard.press('F');
  await expectGameplaySector(page, 'The Core Wreck', 18);
  await expect(page.getByTestId('boss-readout')).toContainText('The Core Wreck');
  await expect(page.locator('.debug-overlay')).toContainText('Scenario finale-smoke');
  await expect(page.locator('.debug-overlay')).toContainText('Finale');
  await expect(page.locator('.debug-overlay')).toContainText(
    'Act Act II Core Descent 5/5 escalated/elevated'
  );
  await expect(page.locator('.debug-overlay')).toContainText(/Hazards 4 zones \+1 P4\/R\d/);
  await expect(page.locator('.debug-overlay')).toContainText(/Features L\d+\/H0/);

  await page.keyboard.press('8');
  await expect(page.getByRole('heading', { name: 'Choose Reward' })).toBeVisible();
  await page.getByRole('button', { name: /Take / }).first().click();
  await expect(page.getByRole('heading', { name: 'The Frontier Is Optional' })).toBeVisible();
  await expect(page.getByTestId('navigation-destination-optional')).toHaveCount(0);
  await expect(page.getByTestId('navigation-route-effect')).toHaveCount(0);
  await expect(page.getByText(/Glass Meridian|Black Current|Silent Crown/)).toBeVisible();

  await page.keyboard.press('F');
  await expectGameplaySector(page, 'The Core Wreck', 18);

  await page.keyboard.press('Y');
  await expect(page.getByRole('heading', { name: 'Debug Run Ended' })).toBeVisible();
  await expect(page.getByText('Debug: forced test summary.')).toBeVisible();
  await expect(page.locator('.summary-reached')).toContainText(
    'The Core Wreck · Act II 5A / layer 5 of 5'
  );
  await expect(
    page
      .getByTestId('summary-metrics')
      .locator('.summary-metric')
      .filter({ hasText: 'Sectors' })
      .locator('strong')
  ).toHaveText('9');
  await expect(page.getByTestId('summary-flight-path')).toContainText('Act II');
  await expect(page.getByTestId('summary-flight-path')).toContainText('5A');
  await expect(page.getByTestId('summary-highlight-list')).toContainText('Patch Hull');

  await page.keyboard.press('G');
  await expect(page.getByRole('heading', { name: 'The Frontier Is Optional' })).toBeVisible();
  await expect(page.getByText(/Glass Meridian|Black Current|Silent Crown/)).toBeVisible();
  await page.getByTestId('frontier-choice-breach').click();
  await expect(page.getByText(/Act III Null Frontier/)).toBeVisible();

  await page.keyboard.press('G');
  await page.getByTestId('frontier-choice-extract').click();
  await expect(page.getByRole('heading', { name: 'Victory Confirmed' })).toBeVisible();
  await expect(
    page
      .getByTestId('summary-metrics')
      .locator('.summary-metric')
      .filter({ hasText: 'Sectors' })
      .locator('strong')
  ).toHaveText('10');
  await expect(page.locator('.summary-reached')).toContainText(
    'The Core Wreck · Act II 5A / layer 5 of 5'
  );
  await expect(page.getByText('final boss salvaged', { exact: true })).toBeVisible();

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
  await expect(page.getByTestId('apex-contact-banner')).toBeHidden();

  await page.keyboard.press('R');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await expect(page.getByTestId('faction-campaign-brief')).toContainText('RIVAL');
  await expect(page.locator('.debug-overlay')).toContainText('Campaign rivals');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('objective-readout')).not.toContainText('Rival');
  await expect(page.locator('.debug-overlay')).toContainText('Active rival');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pause-section-operation')).toContainText('Rival contact');
  await page.keyboard.press('Escape');

  await page.keyboard.press('T');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await expect(page.getByTestId('crew-brief')).toContainText('3 active wingmates');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('crew-command-readout')).toBeHidden();
  await expect(page.getByTestId('crew-command-readout')).toContainText('Automatic support');
  await expect(page.locator('.crew-command-button')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pause-section-ledger')).toContainText('Automatic support');
  await page.keyboard.press('Escape');
  await expect(page.locator('.debug-overlay')).toContainText('Crew focus');

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

  await expect(page.getByRole('button', { name: 'Start Expedition' })).toBeFocused();
  for (let index = 0; index < 4; index += 1) await page.keyboard.press('Tab');
  await expect(page.getByTestId('open-scenario-lab')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  await expect(page.getByTestId('scenario-lab-intro')).toContainText('deterministic session');
  await expect(page.locator('[data-testid^="scenario-lab-lab_"]')).toHaveCount(17);
  await expect(page.locator('.debug-overlay')).toContainText('Scenario Lab catalog 17 cases');

  for (let index = 0; index < 6; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cockpit-hud')).toBeVisible();
  await expect(page.locator('.debug-overlay')).toContainText('Scenario lab:combined');
  await expect(page.locator('.debug-overlay')).toContainText('Scenario Lab combined 17 cases');
  await expect(page.locator('.debug-overlay')).toContainText('Set-piece');
  await expect(page.locator('.debug-overlay')).toContainText('Allies');
  await expect(page.locator('.debug-overlay')).toContainText('Combined proc');
  await expect(page.locator('.debug-overlay')).toContainText('Timeline');

  await page.keyboard.press('B');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  for (let index = 0; index < 7; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cockpit-hud')).toHaveAttribute('data-operation-mode', 'boarding');
  await expect(page.getByTestId('cockpit-hud')).not.toHaveAttribute(
    'data-environment-kind',
    'openSpace'
  );
  await expect(page.getByTestId('boarding-readout')).toContainText(/rooms .* bulkheads/);
  await expect(page.getByTestId('boarding-readout')).toContainText(/interior/i);
  await expect(page.locator('.debug-overlay')).toContainText('Boarding');
  await expect(page.locator('.debug-overlay')).toContainText('Boarding environment');

  await page.keyboard.press('B');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();
  for (let index = 0; index < 8; index += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cockpit-hud')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pause-section-operation')).toContainText(
    /Faction front.*reinforcements/
  );
  await page.keyboard.press('Escape');
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
  await expect(page.getByTestId('apex-dossier-masthead').locator('.apex-glyph')).toHaveAttribute(
    'data-apex-surface',
    'dossier-masthead'
  );
  await expect(page.getByTestId('apex-contact-track')).toContainText('Contact resolved');
  await expect(page.getByTestId('apex-subsystems')).toContainText(/Disabled|Breached/);
  await expect(page.getByTestId('apex-evidence')).toContainText('Trace intelligence');
  await expect(page.getByTestId('apex-pressure')).toContainText('Escape risk');
  await expect(page.getByTestId('apex-dispositions')).toContainText(/Ready|Locked/);
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
  await expect(page.getByRole('heading', { name: 'Hardpoint Control' })).toBeVisible();
  await expect(page.getByTestId('foundry-hardpoint-assignments')).toHaveCount(0);
  await expect(page.getByTestId('foundry-primary-selector')).toBeVisible();
  const fixtureMountedIcon = page.getByTestId('foundry-primary-selector').locator('.weapon-icon');
  await expect(fixtureMountedIcon).toHaveCount(1);
  const originalWeaponIconId = await fixtureMountedIcon.getAttribute('data-weapon-id');
  expect(originalWeaponIconId).toBeTruthy();
  await expect(page.getByTestId('foundry-cargo-menu')).toHaveCount(0);
  await expect(page.locator('.foundry-cargo-card')).toHaveCount(0);

  const assignment = page.getByTestId('foundry-primary-assignment');
  const reserveOption = await assignment
    .locator('option')
    .evaluateAll(
      (options) =>
        (
          options.find((option) => option.textContent?.startsWith('RESERVE -')) as
            HTMLOptionElement | undefined
        )?.value ?? ''
    );
  expect(reserveOption).not.toBe('');
  await assignment.selectOption(reserveOption);
  await expect(page.getByTestId('foundry-status')).toContainText(/mounted/i);
  await expect(assignment).toHaveValue(reserveOption);
  await expect(fixtureMountedIcon).not.toHaveAttribute('data-weapon-id', originalWeaponIconId!);

  await page.getByTestId('foundry-open-cargo').click();
  await expect(page.getByRole('heading', { name: 'Primary Cargo' })).toBeVisible();
  await expect(page.getByTestId('foundry-cargo-menu')).toBeVisible();
  await expect(page.getByTestId('foundry-hardpoint-assignments')).toHaveCount(0);
  await expect(page.getByTestId('foundry-command-console')).toHaveCount(0);
  await expect(page.getByTestId('foundry-upgrade-circuit')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  const cargoCards = page.locator('.foundry-cargo-card');
  const cargoCount = await cargoCards.count();
  expect(cargoCount).toBe(1);
  const primaryCargoCount = await cargoCards.evaluateAll(
    (cards) =>
      cards.filter((card) =>
        [...card.querySelectorAll('.foundry-badge')].some(
          (badge) => badge.textContent?.trim() === 'PRIMARY'
        )
      ).length
  );
  expect(primaryCargoCount).toBe(cargoCount);
  await expect(cargoCards.locator('.weapon-icon')).toHaveCount(cargoCount);
  await expect(cargoCards.locator('.weapon-icon')).toHaveAttribute(
    'data-weapon-id',
    originalWeaponIconId!
  );
  await expect(cargoCards.locator('[data-stat="impact"]')).toHaveCount(cargoCount);
  await expect(cargoCards.locator('[data-stat="cadence"]')).toHaveCount(cargoCount);
  await expect(cargoCards.locator('[data-stat="velocity"]')).toHaveCount(cargoCount);
  await expect(cargoCards.locator('[data-stat="circuit"]')).toHaveCount(cargoCount);
  await expect(cargoCards.locator('[data-stat="power"]')).toHaveCount(0);
  await expect(cargoCards.locator('[data-stat="salvage"]')).toHaveCount(0);
  await expect(cargoCards.getByRole('button', { name: /^Route \// })).toHaveCount(0);
  await expect(cargoCards.getByRole('button', { name: /^Clock \// })).toHaveCount(0);
  await expect(cargoCards.getByRole('button', { name: /^Install \// })).toHaveCount(0);
  await expect(cargoCards.getByRole('button', { name: /^Scrap \+/ })).toHaveCount(cargoCount);
  await expect(cargoCards.locator('.foundry-cargo-fit')).toHaveCount(0);
  await expect(page.getByTestId('foundry-boundary')).toContainText('Scenario Lab fixture');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Hardpoint Control' })).toBeVisible();
  await expect(page.getByTestId('foundry-primary-assignment')).toHaveValue(reserveOption);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('scenario-lab')).toBeVisible();

  expect(browserErrors).toEqual([]);
});

test('shows one exclusive apex circuit spoil without widening the sector reward grid', async ({
  page
}) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('./?debug=1&seed=SCENARIO-LAB-APEX-SPOILS');
  await page.getByRole('button', { name: 'Scenario Lab [Debug]' }).click();
  await page.getByTestId('scenario-lab-lab_apex_spoils').click();

  await expect(page.getByRole('heading', { name: 'Choose Reward' })).toBeVisible();
  await expect(page.getByTestId('reward-grid')).toHaveAttribute('data-item-choice-count', '3');
  await expect(page.getByTestId('reward-grid')).toHaveAttribute('data-total-choice-count', '5');
  await expect(page.getByTestId('reward-grid')).toHaveAttribute('data-apex-reward-count', '1');
  await expect(page.getByTestId('apex-reward-card')).toHaveCount(1);
  await expect(page.getByTestId('apex-reward-card')).toContainText('Apex Spoil');
  await expect(page.getByTestId('apex-reward-card').locator('.apex-glyph')).toHaveAttribute(
    'data-apex-surface',
    'reward-provenance'
  );
  await expect(page.getByTestId('apex-reward-card')).toHaveAttribute(
    'aria-label',
    /^Apex spoil from .+: .+$/
  );
  await expect(page.locator('.reward-card')).toHaveCount(5);
  expect(
    await page
      .locator('.reward-panel')
      .evaluate((panel) => panel.scrollHeight <= panel.clientHeight + 1)
  ).toBe(true);
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

  await expect(page.getByRole('heading', { name: 'Open the contract channel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Expedition' })).toBeFocused();
  await expect(page.getByTestId('seed-entry')).toHaveValue('STARBREAK-SMOKE');
  await expect(page.locator('details.seed-options')).toHaveAttribute('open', '');
  await expect(page.getByText('Route signal acquired', { exact: true })).toHaveCount(0);

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
  await expect(page.getByRole('button', { name: 'Suspend & Main Menu' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'End Run' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { name: 'Contract Suspended' })).toBeVisible();
  await expect(page.getByText('Abandoned: pilot exited before resolution.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to Menu' })).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page).not.toHaveURL(/(?:\?|&)seed=/);
  await expect(page.getByRole('button', { name: 'Start Expedition' })).toBeFocused();
  const retryLastSeed = page.getByTestId('retry-last-seed');
  await expect(retryLastSeed).toContainText('Retry Last Seed');
  await expect(retryLastSeed).toContainText('STARBREAK-SMOKE');
  await expect(page.getByTestId('seed-entry')).toHaveValue('');

  await retryLastSeed.click();
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();
  await expect(page.locator('body')).toContainText('Contract Board | Seed STARBREAK-SMOKE');

  expect(browserErrors).toEqual([]);
});

test('keeps a random title across consecutive suspends and restores the expedition snapshot', async ({
  page
}) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('./?debug=1');
  await expect(page.getByRole('button', { name: 'Start Expedition' })).toBeFocused();
  await expect(page.getByTestId('seed-entry')).toHaveValue('');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page.getByTestId('run-snapshot-panel')).toContainText(
    'saved constellation checkpoint'
  );
  await expect(page).not.toHaveURL(/(?:\?|&)seed=/);
  await expect(page.getByRole('heading', { name: 'Open the contract channel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Expedition' })).toBeFocused();
  await expect(page.getByTestId('seed-entry')).toHaveValue('');

  await page.getByTestId('resume-expedition').click();
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page.getByTestId('run-snapshot-panel')).toContainText(
    'saved constellation checkpoint'
  );
  await expect(page).not.toHaveURL(/(?:\?|&)seed=/);
  await expect(page.getByRole('heading', { name: 'Open the contract channel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Expedition' })).toBeFocused();
  await expect(page.getByTestId('seed-entry')).toHaveValue('');

  await page.getByTestId('resume-expedition').click();
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
  await expect(page.getByRole('heading', { name: 'Open the contract channel' })).toBeVisible();
  await expect(page.getByTestId('seed-entry')).toHaveValue('');

  await page.reload();
  await expect(page.getByTestId('run-snapshot-panel')).toBeVisible();
  await expect(page.getByTestId('seed-entry')).toHaveValue('');
  await page.getByTestId('resume-expedition').click();
  await expectGameplaySector(page, 'Outer Debris Field');
  await expect(page.locator('.debug-overlay')).toContainText('Scene gameplay');

  await page.keyboard.press('8');
  await expect(page.getByRole('heading', { name: 'Choose Reward' })).toBeVisible();
  await page.getByRole('button', { name: /Take / }).first().click();
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('run-snapshot-panel')).toContainText(
    'post-sector choice checkpoint'
  );
  await page.getByTestId('resume-expedition').click();
  await expect(page.getByTestId('mission-briefing')).toBeVisible();

  await page.keyboard.press('G');
  await expect(page.getByRole('heading', { name: 'The Frontier Is Optional' })).toBeVisible();
  await page.getByTestId('frontier-choice-extract').click();
  await expect(page.getByRole('heading', { name: 'Victory Confirmed' })).toBeVisible();
  await expect(page.getByText('final boss salvaged', { exact: true })).toBeVisible();
  await expect(
    page
      .getByTestId('summary-metrics')
      .locator('.summary-metric')
      .filter({ hasText: 'Sectors' })
      .locator('strong')
  ).toHaveText('10');
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
  await expect(page.getByTestId('arena-hud-frame')).toHaveAttribute(
    'data-viewport-class',
    'narrow'
  );
  await expect(page.getByTestId('arena-hud-frame')).toHaveAttribute('data-rail-mode', 'stacked');
  await expect(page.getByTestId('pickup-readout')).toBeHidden();
  await expect(page.locator('.crew-command-bar')).toHaveCount(0);

  const hudBox = await page.locator('.game-hud').boundingBox();
  if (!hudBox) {
    throw new Error('Expected the gameplay HUD to have a browser layout box.');
  }

  expect(hudBox.width).toBeLessThanOrEqual(390);
  expect(hudBox.y + hudBox.height).toBeLessThanOrEqual(156);

  const arenaFrameBox = await page.getByTestId('arena-hud-frame').boundingBox();
  const meterBankBox = await page.getByTestId('arena-hud-left-meters').boundingBox();
  const missionRailBox = await page.locator('.arena-hud-mission-rail').boundingBox();
  if (!arenaFrameBox || !meterBankBox || !missionRailBox) {
    throw new Error('Expected the stacked narrow contract frame and its surrounding rails.');
  }
  expect(arenaFrameBox).toMatchObject({ x: 14, y: 204, width: 362, height: 407 });
  expect(meterBankBox.y + meterBankBox.height).toBeLessThan(arenaFrameBox.y);
  expect(missionRailBox.y).toBeGreaterThan(arenaFrameBox.y + arenaFrameBox.height);
  expect(missionRailBox.y + missionRailBox.height).toBeLessThanOrEqual(700);

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pause-dossier')).toBeVisible();
  const pauseBox = await page.getByTestId('pause-dossier').boundingBox();
  if (!pauseBox) throw new Error('Expected the pause dossier to have a browser layout box.');
  expect(pauseBox.width).toBeLessThanOrEqual(390);

  expect(browserErrors).toEqual([]);
});

test('keeps hardpoint live-fire geometry on one combat scale across viewport widths', async ({
  page
}) => {
  await page.goto('./?debug=1&seed=FOUNDRY-PREVIEW-GEOMETRY');
  await page.getByRole('button', { name: 'Scenario Lab [Debug]' }).click();
  await page.getByTestId('scenario-lab-lab_engineering_foundry').click();
  await expect(page.getByTestId('salvage-foundry')).toBeVisible();
  const cadenceShift = page.getByTestId('foundry-circuit-cadence-shift');
  const ventOutput = page.getByTestId('foundry-circuit-node-1').locator('.foundry-circuit-output');
  await expect(ventOutput).toContainText('CONDITION MET · 1 EARLIER PERIODIC VOLLEY LINKED');
  await expect(ventOutput).toHaveAttribute('data-condition', 'met');
  await expect(cadenceShift).toHaveText(
    'VENT SCRIPT · EVERY 4TH -> 5TH VOLLEY · +1 HEAT SHOT · SPENDS 32% HEAT · COOL = EXHAUST'
  );
  await expect(page.getByTestId('attack-simulation-heat-exhaust')).toHaveCount(1);
  await expect(page.getByTestId('foundry-attack-dps-note')).toHaveText(
    '5-VOLLEY MEASURE · DIRECT PROJECTILE DAMAGE · HIT PROCS EXCLUDED'
  );
  await page
    .getByRole('button', { name: 'Move Prototype Vent Script earlier in the circuit' })
    .click();
  await expect(cadenceShift).toHaveCount(0);
  await expect(ventOutput).toContainText('CONDITION NOT MET · NEEDS AN EARLIER PERIODIC VOLLEY');
  await expect(ventOutput).toHaveAttribute('data-condition', 'unmet');
  await page
    .getByRole('button', { name: 'Move Prototype Vent Script later in the circuit' })
    .click();
  await expect(cadenceShift).toHaveCount(1);
  await expect(ventOutput).toContainText('CONDITION MET · 1 EARLIER PERIODIC VOLLEY LINKED');
  await expect(ventOutput).toHaveAttribute('data-condition', 'met');
  await page.evaluate(() => {
    document.documentElement.dataset.reducedMotion = 'true';
  });

  const readGeometry = () =>
    page.evaluate(() => {
      const preview = document.querySelector<HTMLElement>('[data-testid="foundry-attack-preview"]');
      const ship = preview?.querySelector<SVGSVGElement>('.ship-preview-combat');
      const shot = preview?.querySelector<HTMLElement>('[data-testid="foundry-attack-projectile"]');
      const exhaust = preview?.querySelector<HTMLElement>(
        '[data-testid="attack-simulation-heat-exhaust"]'
      );
      if (!preview || !ship || !shot || !exhaust) {
        throw new Error('Hardpoint preview geometry is unavailable.');
      }
      const previewRect = preview.getBoundingClientRect();
      const shipRect = ship.getBoundingClientRect();
      const shotRect = shot.getBoundingClientRect();
      const exhaustRect = exhaust.getBoundingClientRect();
      const cameraWidth = Number(preview.dataset.cameraWidth);
      const cameraHeight = Number(preview.dataset.cameraHeight);
      const shipRadius = Number(preview.dataset.shipRadius);
      const projectileRadius = Number(shot.dataset.radius);
      const shotStyle = shot.style;

      return {
        previewAspect: previewRect.width / previewRect.height,
        expectedAspect: cameraWidth / cameraHeight,
        shipWidthRatio: shipRect.width / previewRect.width,
        expectedShipWidthRatio: (shipRadius * 5) / cameraWidth,
        shotWidthRatio: shotRect.width / previewRect.width,
        expectedShotWidthRatio: Math.max(4, projectileRadius * 2) / cameraWidth,
        shotAspect: shotRect.width / shotRect.height,
        endRisePercent: Number.parseFloat(shotStyle.getPropertyValue('--shot-end-rise')),
        exhaustVisible: Number.parseFloat(getComputedStyle(exhaust).opacity),
        exhaustInsideCamera:
          exhaustRect.left >= previewRect.left &&
          exhaustRect.right <= previewRect.right &&
          exhaustRect.top >= previewRect.top &&
          exhaustRect.bottom <= previewRect.bottom
      };
    });

  await page.setViewportSize({ width: 390, height: 700 });
  const narrow = await readGeometry();
  await page.setViewportSize({ width: 1280, height: 800 });
  const wide = await readGeometry();

  for (const geometry of [narrow, wide]) {
    expect(geometry.previewAspect).toBeCloseTo(geometry.expectedAspect, 2);
    expect(geometry.shipWidthRatio).toBeCloseTo(geometry.expectedShipWidthRatio, 2);
    expect(geometry.shotWidthRatio).toBeCloseTo(geometry.expectedShotWidthRatio, 2);
    expect(geometry.shotAspect).toBeCloseTo(1, 1);
    expect(geometry.endRisePercent).toBeGreaterThanOrEqual(96);
    expect(geometry.exhaustVisible).toBeGreaterThan(0.6);
    expect(geometry.exhaustInsideCamera).toBe(true);
  }
  expect(narrow.shipWidthRatio).toBeCloseTo(wide.shipWidthRatio, 2);
  expect(narrow.shotWidthRatio).toBeCloseTo(wide.shotWidthRatio, 2);
});

test('keeps contract live-fire comparison responsive and updates the seeded ignition', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./?debug=1&seed=STARBREAK-SMOKE');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();
  await expect(page.locator('[data-testid^="contract-ignition-ship_"]')).toHaveCount(3);
  const contractWeaponIcons = page.locator('.contract-card-weapon .weapon-icon');
  await expect(contractWeaponIcons).toHaveCount(3);
  expect(
    await contractWeaponIcons.evaluateAll((icons) =>
      icons.every(
        (icon) =>
          icon.getAttribute('aria-label')?.endsWith(' weapon icon') === true &&
          Boolean(icon.getAttribute('data-weapon-id'))
      )
    )
  ).toBe(true);
  const initialSelectedWeaponId = await page
    .getByTestId('selected-contract-weapon')
    .locator('.weapon-icon')
    .getAttribute('data-weapon-id');
  expect(initialSelectedWeaponId).toBeTruthy();

  const readPreviewGeometry = () =>
    page.evaluate(() => {
      const preview = document.querySelector<HTMLElement>(
        '[data-testid="contract-attack-preview"]'
      );
      if (!preview) throw new Error('Contract attack preview is unavailable.');
      const bounds = preview.getBoundingClientRect();
      return {
        aspect: bounds.width / bounds.height,
        expectedAspect: Number(preview.dataset.cameraWidth) / Number(preview.dataset.cameraHeight),
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });

  const narrow = await readPreviewGeometry();
  expect(narrow.aspect).toBeCloseTo(narrow.expectedAspect, 2);
  expect(narrow.horizontalOverflow).toBe(false);

  await page
    .getByTestId('contract-card-ship_drone_chaplain')
    .getByRole('button', { name: 'Select' })
    .click();
  const droneWeaponId = await page
    .getByTestId('contract-card-ship_drone_chaplain')
    .locator('.weapon-icon')
    .getAttribute('data-weapon-id');
  expect(droneWeaponId).toBeTruthy();
  await expect(
    page.getByTestId('selected-contract-weapon').locator('.weapon-icon')
  ).toHaveAttribute('data-weapon-id', droneWeaponId!);
  await expect(page.getByTestId('selected-contract-ignition')).toContainText('Signal Clone Stamp');
  await expect(page.getByTestId('contract-attack-projectile-layer')).toHaveAttribute(
    'data-volley-size',
    '5'
  );
  await expect(
    page.getByTestId('contract-attack-preview').getByTestId('attack-simulation-drone')
  ).toHaveCount(3);
  expect(
    await page.getByTestId('contract-attack-preview').evaluate((preview) => {
      const ship = preview
        .querySelector<SVGSVGElement>('.ship-preview-combat')
        ?.getBoundingClientRect();
      if (!ship) throw new Error('Contract ship preview is unavailable.');
      return [...preview.querySelectorAll<HTMLElement>('.attack-simulation-drone')].every(
        (drone) => {
          const bounds = drone.getBoundingClientRect();
          return (
            bounds.right < ship.left ||
            bounds.left > ship.right ||
            bounds.bottom < ship.top ||
            bounds.top > ship.bottom
          );
        }
      );
    })
  ).toBe(true);

  await page.setViewportSize({ width: 1280, height: 900 });
  const wide = await readPreviewGeometry();
  expect(wide.aspect).toBeCloseTo(wide.expectedAspect, 2);
  expect(wide.aspect).toBeCloseTo(narrow.aspect, 2);
  expect(wide.horizontalOverflow).toBe(false);
});

test('carries hull into navigation and sells repeatable repair service in the shop', async ({
  page
}) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('./?debug=1&seed=SHOP-HULL-REPAIR-SMOKE');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();

  const openingHullText = (await page.getByTestId('navigation-hull').textContent()) ?? '';
  const openingHull = /Hull(\d+)\/(\d+)/.exec(openingHullText.replaceAll(/\s/g, ''));
  expect(openingHull).not.toBeNull();
  const maxHull = Number(openingHull![2]);
  expect(Number(openingHull![1])).toBe(maxHull);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await page.evaluate(() => {
    const key = 'starbreak.run.v12';
    const raw = window.localStorage.getItem(key);
    if (!raw) throw new Error('Expected a suspended run snapshot.');
    const snapshot = JSON.parse(raw) as {
      session: { mission: { checkpoint: { hull: number | null } } };
    };
    snapshot.session.mission.checkpoint.hull = 1;
    window.localStorage.setItem(key, JSON.stringify(snapshot));
  });
  await page.reload();
  await page.getByTestId('resume-expedition').click();
  await expect(page.getByTestId('navigation-hull')).toContainText(`1/${maxHull}`);
  await expect(page.getByTestId('navigation-hull')).toHaveAttribute('data-tone', 'critical');

  await page.getByTestId('open-shop').click();
  await expect(page.getByText('3+ seeded offers', { exact: true })).toBeVisible();
  await page.getByTestId('navigation-destination-action').click();
  await expect(page.getByRole('heading', { name: 'Shop' })).toBeVisible();
  await expect(page.getByTestId('shop-repair-service')).toHaveAttribute('data-state', 'critical');
  await expect(page.getByTestId('shop-repair-gauge')).toContainText(`Hull 1/${maxHull}`);
  await expect(page.getByTestId('shop-repair-action')).toHaveText('Repair +1 Hull -4');
  await expect(page.getByTestId('shop-repair-action')).toBeEnabled();
  await page.getByTestId('shop-repair-action').click();
  await expect(page.getByTestId('shop-repair-gauge')).toContainText(`Hull 2/${maxHull}`);

  await page.getByRole('button', { name: 'Leave Shop' }).click();
  await expect(page.getByTestId('navigation-hull')).toContainText(`2/${maxHull}`);
  await page.getByTestId('navigation-destination-launch').click();
  await page.getByTestId('navigation-destination-action').click();
  await expectGameplaySector(page, 'Outer Debris Field');
  await expect(page.getByTestId('hull-readout')).toContainText(`Hull 2/${maxHull}`);
  expect(browserErrors).toEqual([]);
});

test('depletes fixed shop slots until reroll restocks the rack', async ({ page }) => {
  await page.goto('./?debug=1&seed=SHOP-DEPLETION-SMOKE');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Choose Contract' })).toBeVisible();
  const droneCard = page.getByTestId('contract-card-ship_drone_chaplain');
  const selectDrone = droneCard.getByRole('button', { name: 'Select' });
  if ((await selectDrone.count()) > 0) await selectDrone.click();
  await page.getByRole('button', { name: 'Launch Contract' }).click();
  await expect(page.getByTestId('mission-briefing')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await page.evaluate(() => {
    const key = 'starbreak.run.v12';
    const raw = window.localStorage.getItem(key);
    if (!raw) throw new Error('Expected a suspended run snapshot.');
    const snapshot = JSON.parse(raw) as { session: { credits: number } };
    snapshot.session.credits = 100;
    window.localStorage.setItem(key, JSON.stringify(snapshot));
  });
  await page.reload();
  await page.getByTestId('resume-expedition').click();
  await expect(page.getByTestId('mission-briefing')).toBeVisible();

  await page.getByTestId('open-shop').click();
  await page.getByTestId('navigation-destination-action').click();
  await expect(page.getByRole('heading', { name: 'Shop' })).toBeVisible();
  await expect(page.locator('.shop-card').filter({ hasText: 'Build fit:' })).toHaveCount(0);
  await expect(page.getByTestId('shop-repair-service')).toHaveAttribute('data-state', 'full');
  await expect(page.getByTestId('shop-repair-action')).toBeDisabled();
  const primaryOffer = page.getByTestId('shop-primary-offer');
  await expect(primaryOffer).toHaveAttribute('data-state', 'available');
  await expect(primaryOffer).toContainText('Primary Weapon');
  await expect(primaryOffer.locator('.weapon-icon')).toHaveCount(1);
  await expect(primaryOffer.locator('.weapon-icon')).toHaveAttribute('aria-label', /weapon icon$/);
  const firstPrimaryId = await primaryOffer.getAttribute('data-component-id');
  await primaryOffer.click();
  await expect(primaryOffer).toHaveAttribute('data-state', 'empty');
  await expect(primaryOffer).toContainText('Empty Weapon Cradle');

  const shopSlots = page.locator('[data-testid^="shop-slot-"]');
  const initialSlotCount = await shopSlots.count();
  expect(initialSlotCount).toBe(3);
  const affordableCards = page.locator('.shop-card[data-state="available"]:not(:disabled)');
  const affordablePrices = await affordableCards.evaluateAll((cards) =>
    cards.map((card) => Number(/(\d+) credits/i.exec(card.textContent ?? '')?.[1] ?? Infinity))
  );
  const purchaseIndex = affordablePrices.findIndex((price) => price <= 14);
  expect(purchaseIndex).toBeGreaterThanOrEqual(0);
  const purchasedSlot = affordableCards.nth(purchaseIndex);
  const purchasedTestId = await purchasedSlot.getAttribute('data-testid');
  await purchasedSlot.click();

  expect(await shopSlots.count()).toBe(initialSlotCount);
  const emptySlot = page.getByTestId(purchasedTestId!);
  await expect(emptySlot).toHaveAttribute('data-state', 'empty');
  await expect(emptySlot).toContainText('Empty Slot');
  await expect(emptySlot).toContainText('Reroll to restock');

  await page.getByRole('button', { name: 'Leave Shop' }).click();
  await page.getByTestId('open-shop').click();
  await page.getByTestId('navigation-destination-action').click();
  await expect(page.getByTestId(purchasedTestId!)).toHaveAttribute('data-state', 'empty');
  await expect(primaryOffer).toHaveAttribute('data-state', 'empty');

  await page.getByRole('button', { name: /Reroll -/ }).click();
  await expect(page.locator('.shop-card[data-state="empty"]')).toHaveCount(0);
  await expect(shopSlots).toHaveCount(initialSlotCount);
  await expect(primaryOffer).toHaveAttribute('data-state', 'available');
  await expect(primaryOffer).not.toHaveAttribute('data-component-id', firstPrimaryId!);
});

async function forceCompleteSectorAndEnterNext(
  page: Page,
  nextSectorName: string,
  options: {
    readonly takeOptional?: boolean;
    readonly routeDifficulty?: 'easier' | 'harder';
  } = {}
): Promise<void> {
  await page.keyboard.press('8');
  await expect(page.getByTestId('sector-exit-toast')).toContainText(
    /clear\. (Recalling .+|Wing collected; main thrusters igniting|Ship and wing accelerating out of sector|Main thrusters igniting|Ship accelerating out of sector)/
  );
  await expect(page.getByTestId('command-deck')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Choose Reward' })).toBeVisible();
  await page.getByRole('button', { name: /Take / }).first().click();
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await expect(page.getByTestId('navigation-route-effect')).toBeVisible();
  await expect(page.getByTestId('navigation-route-commit')).toBeEnabled();
  await expect(page.getByTestId('navigation-optional-action')).toHaveCount(0);
  await expect(page.getByTestId('navigation-destination-optional')).toContainText('OPTIONAL');
  await expect(page.getByTestId('navigation-destination-continue')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Choose Route' })).toHaveCount(0);
  await expect(page.getByTestId('mission-relief')).toHaveCount(0);

  if (options.takeOptional) {
    await page.getByTestId('navigation-destination-optional').click();
    await expect(page.getByTestId('navigation-optional-action')).toBeEnabled();
    await page.getByTestId('navigation-optional-action').click();
    await expect(page.locator('.debug-overlay')).toContainText('Mission combat active');
    await page.keyboard.press('8');
    await expect(page.getByRole('heading', { name: 'Choose Reward' })).toHaveCount(0);
    await expect(page.getByTestId('mission-briefing')).toBeVisible();
    await expect(page.getByTestId('navigation-route-effect')).toBeVisible();
    await expect(page.getByTestId('navigation-route-commit')).toBeEnabled();
  }

  if (options.routeDifficulty === 'harder') {
    await page
      .locator('.constellation-node[data-destination-id^="route:"]')
      .filter({ hasText: 'HARDER' })
      .click();
    await expect(page.getByTestId('navigation-route-effect')).toBeVisible();
  }

  await commitSelectedDestinationAndDepart(page);
  await expect(page.getByTestId('mission-briefing')).toHaveCount(0);
  await expectGameplaySector(page, nextSectorName);
}

async function expectGameplaySector(
  page: Page,
  sectorName: string,
  sectorIndex?: number
): Promise<void> {
  const expectedText = sectorIndex === undefined ? sectorName : `S${sectorIndex} ${sectorName}`;

  await expect(page.getByTestId('expedition-readout')).toContainText(expectedText);
}

async function commitSelectedDestinationAndDepart(page: Page): Promise<void> {
  const commit = page.getByTestId('navigation-route-commit');
  const routeKind = await commit.getAttribute('data-route-kind');

  await commit.click();

  if (routeKind === 'shop') {
    await expect(page.getByRole('heading', { name: 'Shop' })).toBeVisible();
    await page.getByRole('button', { name: 'Leave Shop' }).click();
  } else {
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Choose Reward' })).toHaveCount(0);
}
