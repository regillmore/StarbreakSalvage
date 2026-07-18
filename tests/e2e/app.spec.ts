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
  await expect(page.getByTestId('apex-contact-banner')).toBeHidden();
  await expect(page.getByTestId('apex-readout')).toBeHidden();
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
    'Expedition Outer Debris Field Gate Operation | nodes 2/108'
  );
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
  await expect(page.getByTestId('objective-readout')).toContainText('Hecaton Ledger Ark');
  await page.keyboard.press('8');
  await expect(page.getByTestId('sector-exit-toast')).toContainText(
    /Outer Debris Field clear\. (Main thrusters igniting|Ship accelerating out of sector)/
  );
  await expect(page.locator('.debug-overlay')).toContainText(
    /Exit sectorComplete (ignition|boost|clear|transition) \d+%/
  );
  await expect(page.getByTestId('command-deck')).toHaveCount(0);
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
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await expect(page.getByTestId('navigation-destination-optional')).toContainText('OPTIONAL');
  await expect(page.getByTestId('navigation-destination-route')).toContainText(
    /2A .* Trade War Corridor/
  );
  await expect(page.getByTestId('navigation-destination-route')).toContainText('EASIER');
  await expect(page.locator('.constellation-node[data-destination-id^="route:"]')).toHaveCount(2);
  await expect(page.getByTestId('navigation-destination-route')).toHaveAttribute(
    'data-constellation-status',
    'choice'
  );
  await expect(page.getByTestId('navigation-destination-route')).toBeEnabled();
  await expect(page.getByTestId('navigation-destination-continue')).toHaveCount(0);
  await expect(
    page.locator('.constellation-node[data-node-kind="sector"][data-constellation-status="choice"]')
  ).toHaveCount(3);
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
  for (const nodeId of ['navigation-destination-optional', 'navigation-destination-route']) {
    expect(
      await page.getByTestId(nodeId).evaluate((element) => getComputedStyle(element).borderTopColor)
    ).toContain('255, 209, 102');
  }
  await expect(page.getByTestId('navigation-route-effect')).toBeVisible();
  await expect(page.getByTestId('navigation-route-effect')).toContainText('BASE ROUTE EFFECT');
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
  await expect(page.getByTestId('foundry-meter-circuit')).toContainText('Circuit');
  await expect(page.getByTestId('foundry-meter-circuit').getByRole('meter')).toBeVisible();
  await expect(page.locator('.foundry-installed-card [data-stat="circuit"]')).toHaveCount(3);
  await expect(page.locator('.foundry-circuit-contribution')).toHaveCount(0);
  await expect(page.getByTestId('foundry-attack-impact')).toBeVisible();
  const upgradeCircuit = page.getByTestId('foundry-upgrade-circuit');
  await expect(upgradeCircuit.getByRole('heading', { name: 'Signal Circuit' })).toBeVisible();
  await expect(upgradeCircuit).toContainText('2/3 LIVE / 1 OPEN');
  await expect(upgradeCircuit).toContainText(/CORE -> .* -> WEAPON/);
  await expect(upgradeCircuit).toContainText('Every upgrade fits every conduit');
  await expect(page.getByTestId('foundry-circuit-extension')).toHaveCount(3);
  await expect(page.getByTestId('foundry-circuit-extension')).toHaveText([
    /\+1.*UNIVERSAL/,
    /\+1.*UNIVERSAL/,
    /\+1.*UNIVERSAL/
  ]);
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
  await page.getByRole('button', { name: 'Start Seeded Expedition' }).click();
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
    'Progress Bank 8kg Upgrades 0/8 Ready 2'
  );
  await expect(page.getByTestId('upgrade-bay-summary')).toContainText(
    'Bank 8 kg | Installed 0/8 | Ready 2'
  );
  await expect(page.locator('[data-testid^="upgrade-card-"]')).toHaveCount(8);

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
    'Bank 4 kg | Installed 1/8 | Ready 1'
  );
  await expect(page.locator('.debug-overlay')).toContainText(
    'Progress Bank 4kg Upgrades 1/8 Ready 1'
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
  await expect(page.locator('.debug-overlay')).toContainText('Items 25 (25 unique)');
  await expect(page.locator('.debug-overlay')).toContainText(/Hooks 14\/14 \d+ apps/);
  await expect(page.locator('.debug-overlay')).toContainText(/Proc on[A-Za-z]+ \d+\/48 skip 0/);
  await expect(page.locator('.debug-overlay')).toContainText(/Build .+ \| 25 items/);
  await expect(page.locator('.debug-overlay')).toContainText('Projectiles 30 (P0/E30)');
  await expect(page.locator('.debug-overlay')).toContainText('Telegraphs 2');
  await expect(page.getByTestId('item-readout')).toContainText(/Build .+ \| 25 items/);

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
  await expect(page.getByTestId('apex-contact-banner')).toBeVisible();
  await expect(page.getByTestId('apex-contact-banner')).toContainText(/APEX|Grave Choir|Ambush/i);

  await page.keyboard.press('R');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await expect(page.getByTestId('faction-campaign-brief')).toContainText('RIVAL');
  await expect(page.locator('.debug-overlay')).toContainText('Campaign rivals');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('objective-readout')).toContainText('Rival');
  await expect(page.locator('.debug-overlay')).toContainText('Active rival');

  await page.keyboard.press('T');
  await expect(page.getByTestId('mission-briefing')).toBeVisible();
  await expect(page.getByTestId('crew-brief')).toContainText('3 active wingmates');
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
  const cargoCards = page.locator('.foundry-cargo-card');
  const cargoCount = await cargoCards.count();
  expect(cargoCount).toBeGreaterThan(0);
  await expect(cargoCards.locator('[data-stat="circuit"]')).toHaveCount(cargoCount);
  await expect(cargoCards.locator('[data-stat="salvage"]')).toHaveCount(0);
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
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Starbreak Salvage' })).toBeVisible();
  await expect(page.getByTestId('run-snapshot-panel')).toContainText(
    'saved constellation checkpoint'
  );
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('resume-expedition')).toBeFocused();
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

  const hudBox = await page.locator('.game-hud').boundingBox();
  if (!hudBox) {
    throw new Error('Expected the gameplay HUD to have a browser layout box.');
  }

  expect(hudBox.width).toBeLessThanOrEqual(390);
  expect(hudBox.y + hudBox.height).toBeLessThanOrEqual(175);

  expect(browserErrors).toEqual([]);
});

test('keeps hardpoint live-fire geometry on one combat scale across viewport widths', async ({
  page
}) => {
  await page.goto('./?debug=1&seed=FOUNDRY-PREVIEW-GEOMETRY');
  await page.getByRole('button', { name: 'Scenario Lab [Debug]' }).click();
  await page.getByTestId('scenario-lab-lab_engineering_foundry').click();
  await expect(page.getByTestId('salvage-foundry')).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.dataset.reducedMotion = 'true';
  });

  const readGeometry = () =>
    page.evaluate(() => {
      const preview = document.querySelector<HTMLElement>('[data-testid="foundry-attack-preview"]');
      const ship = preview?.querySelector<SVGSVGElement>('.ship-preview-combat');
      const shot = preview?.querySelector<HTMLElement>('[data-testid="foundry-attack-projectile"]');
      if (!preview || !ship || !shot) throw new Error('Hardpoint preview geometry is unavailable.');
      const previewRect = preview.getBoundingClientRect();
      const shipRect = ship.getBoundingClientRect();
      const shotRect = shot.getBoundingClientRect();
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
        endRisePercent: Number.parseFloat(shotStyle.getPropertyValue('--shot-end-rise'))
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
  await expect(page.getByTestId('selected-contract-ignition')).toContainText('Signal Clone Stamp');
  await expect(page.getByTestId('contract-attack-projectile-layer')).toHaveAttribute(
    'data-volley-size',
    '4'
  );

  await page.setViewportSize({ width: 1280, height: 900 });
  const wide = await readPreviewGeometry();
  expect(wide.aspect).toBeCloseTo(wide.expectedAspect, 2);
  expect(wide.aspect).toBeCloseTo(narrow.aspect, 2);
  expect(wide.horizontalOverflow).toBe(false);
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

  await page.getByTestId('open-shop').click();
  await page.getByTestId('navigation-destination-action').click();
  await expect(page.getByRole('heading', { name: 'Shop' })).toBeVisible();

  const shopSlots = page.locator('[data-testid^="shop-slot-"]');
  const initialSlotCount = await shopSlots.count();
  expect(initialSlotCount).toBeGreaterThanOrEqual(4);
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

  await page.getByRole('button', { name: /Reroll -/ }).click();
  await expect(page.locator('.shop-card[data-state="empty"]')).toHaveCount(0);
  await expect(shopSlots).toHaveCount(initialSlotCount);
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
    /clear\. (Main thrusters igniting|Ship accelerating out of sector)/
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
  const expectedText =
    sectorIndex === undefined ? sectorName : `Sector ${sectorIndex} | ${sectorName}`;

  await expect(page.locator('.hud-pill').filter({ hasText: expectedText })).toBeVisible();
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
