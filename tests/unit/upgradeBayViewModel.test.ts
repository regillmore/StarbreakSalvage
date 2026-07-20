import { describe, expect, it } from 'vitest';

import { type UpgradeId } from '../../src/content/upgrades';
import { createDefaultSaveData } from '../../src/core/saveData';
import {
  createUpgradeBayViewModel,
  type UpgradeBayViewModel
} from '../../src/ui/UpgradeBayViewModel';

describe('createUpgradeBayViewModel', () => {
  it('summarizes banked scrap, available upgrades, and icon categories', () => {
    const model = createUpgradeBayViewModel({
      ...createDefaultSaveData(),
      salvageBank: 4
    });
    const surveyRig = getCard(model, 'upgrade_contract_survey_rig');
    const escrowIndex = getCard(model, 'upgrade_salvage_escrow_index');

    expect(model.summaryText).toBe('Bank 4 kg | Installed 0/12 | Ready 2');
    expect(model.availableCount).toBe(2);
    expect(surveyRig.categoryLabel).toBe('Hangar');
    expect(surveyRig.iconKey).toBe('contract-scope');
    expect(surveyRig.state).toBe('available');
    expect(surveyRig.stateLabel).toBe('Ready to install');
    expect(surveyRig.canPurchase).toBe(true);
    expect(escrowIndex.categoryLabel).toBe('Salvage');
    expect(escrowIndex.iconKey).toBe('scrap-ledger');
  });

  it('shows purchased and locked upgrade states with prerequisite names', () => {
    const model = createUpgradeBayViewModel({
      ...createDefaultSaveData(),
      salvageBank: 12,
      purchasedUpgradeIds: ['upgrade_contract_survey_rig']
    });
    const surveyRig = getCard(model, 'upgrade_contract_survey_rig');
    const routeUplink = getCard(model, 'upgrade_route_ledger_uplink');
    const relicDossier = getCard(model, 'upgrade_relic_pattern_dossier');

    expect(model.summaryText).toBe('Bank 12 kg | Installed 1/12 | Ready 2');
    expect(surveyRig.state).toBe('purchased');
    expect(surveyRig.actionLabel).toBe('Installed');
    expect(surveyRig.canPurchase).toBe(false);
    expect(routeUplink.state).toBe('available');
    expect(routeUplink.canPurchase).toBe(true);
    expect(relicDossier.state).toBe('locked');
    expect(relicDossier.prerequisiteLabel).toBe('Requires Route Ledger Uplink');
    expect(relicDossier.missingPrerequisiteNames).toEqual(['Route Ledger Uplink']);
  });

  it('keeps unaffordable upgrades distinct from prerequisite locks', () => {
    const model = createUpgradeBayViewModel({
      ...createDefaultSaveData(),
      salvageBank: 2,
      purchasedUpgradeIds: ['upgrade_contract_survey_rig']
    });
    const routeUplink = getCard(model, 'upgrade_route_ledger_uplink');
    const marketDecoder = getCard(model, 'upgrade_market_decoder');

    expect(model.availableCount).toBe(0);
    expect(routeUplink.state).toBe('unaffordable');
    expect(routeUplink.stateLabel).toBe('Need 4 kg scrap');
    expect(routeUplink.actionLabel).toBe('Need 4 kg');
    expect(routeUplink.stateDetail).toBe('Needs 4 kg more scrap.');
    expect(marketDecoder.state).toBe('locked');
    expect(marketDecoder.prerequisiteLabel).toBe('Requires Salvage Escrow Index');
  });
});

function getCard(model: UpgradeBayViewModel, id: UpgradeId) {
  const card = model.cards.find((candidate) => candidate.id === id);

  if (!card) {
    throw new Error(`Missing upgrade card: ${id}`);
  }

  return card;
}
