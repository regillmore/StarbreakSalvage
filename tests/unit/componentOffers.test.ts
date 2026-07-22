import { describe, expect, it } from 'vitest';

import { getShipModuleById } from '../../src/content/shipModules';
import {
  createSectorPrimaryWeaponOffer,
  createShopPrimaryWeaponOffer
} from '../../src/game/ComponentOffers';
import { acquireComponent } from '../../src/game/Foundry';
import { generateRunSkeleton } from '../../src/game/Generation';
import { createRunSession, incrementShopRerollCount } from '../../src/game/RunSession';

describe('primary weapon offers', () => {
  it('creates an explicit deterministic sector reward for the current frame', () => {
    const run = generateRunSkeleton('PRIMARY-SECTOR-REWARD');
    const session = createRunSession(run, run.contracts[0]!);
    const first = createSectorPrimaryWeaponOffer(run, session);
    const second = createSectorPrimaryWeaponOffer(run, session);

    expect(second).toEqual(first);
    expect(getShipModuleById(first.moduleId).slot).toBe('primary');
    expect(first.compatibility.compatibleHardpointIds.length).toBeGreaterThan(0);
  });

  it('depletes one stable shop weapon per roll and refills it on reroll', () => {
    const run = generateRunSkeleton('PRIMARY-SHOP-OFFER');
    const session = createRunSession(run, run.contracts[0]!);
    const first = createShopPrimaryWeaponOffer(run, session);

    expect(first.depleted).toBe(false);
    expect(first.price).toBeGreaterThan(0);
    session.engineering = acquireComponent(session.engineering, first.component);

    const reopened = createShopPrimaryWeaponOffer(run, session);
    expect(reopened.component.id).toBe(first.component.id);
    expect(reopened.depleted).toBe(true);

    incrementShopRerollCount(session, run.sectors[0]!.index);
    const rerolled = createShopPrimaryWeaponOffer(run, session);
    expect(rerolled.component.id).not.toBe(first.component.id);
    expect(rerolled.depleted).toBe(false);
  });
});
