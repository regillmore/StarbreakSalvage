import { describe, expect, it } from 'vitest';

import { ACT_ROUTE_CONTRACTS } from '../../src/content/actRouteContracts';
import { getEligibleActRouteContracts } from '../../src/game/ActRouteContracts';
import { generateRunSkeleton } from '../../src/game/Generation';

describe('Act II route contracts', () => {
  it('keeps fresh and progressed save eligibility deterministic', () => {
    const context = {
      actId: 'act_core_descent' as const,
      sectorId: 'sector_bio_machine_bloom' as const,
      backgroundId: 'background_bio_machine_bloom' as const,
      bossFactionId: 'faction_bloom_hive' as const,
      objectiveKind: 'clearWaves' as const
    };
    const fresh = getEligibleActRouteContracts({
      ...context,
      unlockedIds: []
    });
    const progressed = getEligibleActRouteContracts({
      ...context,
      unlockedIds: ['unlock_faction_bloom_hive']
    });

    expect(fresh.map((contract) => contract.id)).not.toContain('act2_bloom_graft_cache');
    expect(progressed.map((contract) => contract.id)).toContain('act2_bloom_graft_cache');
    expect(new Set(ACT_ROUTE_CONTRACTS.map((contract) => contract.kind))).toEqual(
      new Set(['shop', 'elite', 'vault', 'repair', 'glitch', 'factionAmbush'])
    );
  });

  it('generates distinct Act II route-card copy without changing Act I generic routes', () => {
    const run = generateRunSkeleton('ACT2-ROUTE-COPY-SMOKE');
    const actOneRoutes = run.sectors.slice(0, 5).flatMap((sector) => sector.routeOptions);
    const actTwoRoutes = run.sectors.slice(5).map((sector) => ({
      sector: sector.sectorId,
      routes: sector.routeOptions.map((route) => ({
        kind: route.kind,
        label: route.label,
        actRouteId: route.actRouteId,
        tags: route.routeTags,
        pressureHint: route.pressureHint,
        rewardTierHint: route.rewardTierHint,
        environmentalHint: route.environmentalHint
      }))
    }));

    expect(actOneRoutes.every((route) => route.actRouteId === undefined)).toBe(true);
    expect(actTwoRoutes.flatMap((sector) => sector.routes).every((route) => route.actRouteId)).toBe(
      true
    );
    expect(actTwoRoutes).toMatchInlineSnapshot(`
      [
        {
          "routes": [
            {
              "actRouteId": "act2_faction_heist",
              "environmentalHint": "escort lanes favor faction-colored crossfire windows",
              "kind": "factionAmbush",
              "label": "Faction Heist",
              "pressureHint": "high combat pressure with faction-specific reward bias",
              "rewardTierHint": "focused faction cache with escalated salvage",
              "tags": [
                "faction",
                "pressure",
                "economy",
              ],
            },
            {
              "actRouteId": "act2_bloom_graft_cache",
              "environmentalHint": "bio-lanes favor spores, dust fronts, and organic cover beats",
              "kind": "vault",
              "label": "Bloom Graft Cache",
              "pressureHint": "medium spread pressure with strong build-shaping upside",
              "rewardTierHint": "vault-tier relic pool biased toward shield, curse, and bloom tech",
              "tags": [
                "bio",
                "relic",
                "hazard",
              ],
            },
            {
              "actRouteId": "act2_seed_shear",
              "environmentalHint": "hazard timing may feel less regular after the shear",
              "kind": "glitch",
              "label": "Seed Shear",
              "pressureHint": "high variance pressure with possible curse exposure",
              "rewardTierHint": "extra reward choice with phase and heat bias",
              "tags": [
                "seedShear",
                "hazard",
                "pressure",
              ],
            },
          ],
          "sector": "sector_bio_machine_bloom",
        },
        {
          "routes": [
            {
              "actRouteId": "act2_overseer_bounty",
              "environmentalHint": "formation lanes are more likely to stack near hazards",
              "kind": "elite",
              "label": "Overseer Bounty",
              "pressureHint": "high combat pressure with boss-approach implications",
              "rewardTierHint": "escalated salvage plus an extra reward look",
              "tags": [
                "bossApproach",
                "pressure",
                "core",
              ],
            },
            {
              "actRouteId": "act2_core_broker_permit",
              "environmentalHint": "stable dock lane with fewer surprise hazards before launch",
              "kind": "shop",
              "label": "Core Broker Permit",
              "pressureHint": "low combat pressure, high economy commitment",
              "rewardTierHint": "escalated shop stock and price pressure",
              "tags": [
                "deepMarket",
                "economy",
                "core",
              ],
            },
            {
              "actRouteId": "act2_bloom_graft_cache",
              "environmentalHint": "bio-lanes favor spores, dust fronts, and organic cover beats",
              "kind": "vault",
              "label": "Bloom Graft Cache",
              "pressureHint": "medium spread pressure with strong build-shaping upside",
              "rewardTierHint": "vault-tier relic pool biased toward shield, curse, and bloom tech",
              "tags": [
                "bio",
                "relic",
                "hazard",
              ],
            },
          ],
          "sector": "sector_lunar_surface",
        },
        {
          "routes": [
            {
              "actRouteId": "act2_faction_heist",
              "environmentalHint": "escort lanes favor faction-colored crossfire windows",
              "kind": "factionAmbush",
              "label": "Faction Heist",
              "pressureHint": "high combat pressure with faction-specific reward bias",
              "rewardTierHint": "focused faction cache with escalated salvage",
              "tags": [
                "faction",
                "pressure",
                "economy",
              ],
            },
            {
              "actRouteId": "act2_core_broker_permit",
              "environmentalHint": "stable dock lane with fewer surprise hazards before launch",
              "kind": "shop",
              "label": "Core Broker Permit",
              "pressureHint": "low combat pressure, high economy commitment",
              "rewardTierHint": "escalated shop stock and price pressure",
              "tags": [
                "deepMarket",
                "economy",
                "core",
              ],
            },
            {
              "actRouteId": "act2_field_suture",
              "environmentalHint": "repair lanes favor readable corridors over dense clutter",
              "kind": "repair",
              "label": "Field Suture",
              "pressureHint": "low combat pressure, low immediate reward ceiling",
              "rewardTierHint": "safer reward bias with Act II credit tension",
              "tags": [
                "repair",
                "economy",
              ],
            },
          ],
          "sector": "sector_trade_war_corridor",
        },
        {
          "routes": [
            {
              "actRouteId": "act2_core_broker_permit",
              "environmentalHint": "stable dock lane with fewer surprise hazards before launch",
              "kind": "shop",
              "label": "Core Broker Permit",
              "pressureHint": "low combat pressure, high economy commitment",
              "rewardTierHint": "escalated shop stock and price pressure",
              "tags": [
                "deepMarket",
                "economy",
                "core",
              ],
            },
            {
              "actRouteId": "act2_seed_shear",
              "environmentalHint": "hazard timing may feel less regular after the shear",
              "kind": "glitch",
              "label": "Seed Shear",
              "pressureHint": "high variance pressure with possible curse exposure",
              "rewardTierHint": "extra reward choice with phase and heat bias",
              "tags": [
                "seedShear",
                "hazard",
                "pressure",
              ],
            },
            {
              "actRouteId": "act2_relic_undertow",
              "environmentalHint": "vault doors sit close to unstable lanes and late telegraphs",
              "kind": "vault",
              "label": "Relic Undertow",
              "pressureHint": "medium combat pressure, high build variance",
              "rewardTierHint": "vault-tier relic pool with Act II rarity pressure",
              "tags": [
                "relic",
                "hazard",
                "core",
              ],
            },
          ],
          "sector": "sector_corporate_kill_grid",
        },
        {
          "routes": [
            {
              "actRouteId": "act2_relic_undertow",
              "environmentalHint": "vault doors sit close to unstable lanes and late telegraphs",
              "kind": "vault",
              "label": "Relic Undertow",
              "pressureHint": "medium combat pressure, high build variance",
              "rewardTierHint": "vault-tier relic pool with Act II rarity pressure",
              "tags": [
                "relic",
                "hazard",
                "core",
              ],
            },
            {
              "actRouteId": "act2_overseer_bounty",
              "environmentalHint": "formation lanes are more likely to stack near hazards",
              "kind": "elite",
              "label": "Overseer Bounty",
              "pressureHint": "high combat pressure with boss-approach implications",
              "rewardTierHint": "escalated salvage plus an extra reward look",
              "tags": [
                "bossApproach",
                "pressure",
                "core",
              ],
            },
            {
              "actRouteId": "act2_seed_shear",
              "environmentalHint": "hazard timing may feel less regular after the shear",
              "kind": "glitch",
              "label": "Seed Shear",
              "pressureHint": "high variance pressure with possible curse exposure",
              "rewardTierHint": "extra reward choice with phase and heat bias",
              "tags": [
                "seedShear",
                "hazard",
                "pressure",
              ],
            },
          ],
          "sector": "sector_core_wreck",
        },
      ]
    `);
  });
});
