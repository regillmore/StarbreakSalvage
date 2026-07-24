import { describe, expect, it } from 'vitest';

import { getItemById, type ItemDefinition } from '../../src/content/items';
import { createItemCardViewModel } from '../../src/ui/ItemCardViewModel';

describe('item card view model', () => {
  it('formats reward item cards with a compact identity and authored circuit trigger', () => {
    const model = createItemCardViewModel(getItemById('item_split_prism'), {
      sourceLabel: 'Starter pool'
    });

    expect(model).toEqual(
      expect.objectContaining({
        itemId: 'item_split_prism',
        name: 'Split Prism',
        rarityLabel: 'Uncommon',
        familyLabel: 'Laser Split',
        sourceLabel: 'Starter pool',
        triggerLabel: 'Volley',
        effectStateLabel: 'Live effect',
        effectStateKind: 'live',
        iconKind: 'laser-split',
        iconLabel: 'Laser Split item icon'
      })
    );
    expect(model.badges).toEqual(['Split']);
  });

  it('includes shop price and run acquisition labels when present', () => {
    const model = createItemCardViewModel(getItemById('item_relic_ash_compass'), {
      sourceLabel: 'vault source',
      price: 9,
      acquisitionOrder: 3
    });

    expect(model.priceLabel).toBe('9 credits');
    expect(model.acquisitionLabel).toBe('Slot 4');
    expect(model.triggerLabel).toBe('Reward roll');
    expect(model.badges).toEqual(['Relic', 'Vault']);
  });

  it('distinguishes bridge and planned implementation status copy', () => {
    const bridge = createItemCardViewModel({
      ...getItemById('item_cursed_hull_plate'),
      metadata: {
        ...getItemById('item_cursed_hull_plate').metadata,
        implementationStatus: 'bridge',
        implementationNote: 'Synthetic bridge fixture.'
      }
    } satisfies ItemDefinition);
    const planned = createItemCardViewModel({
      ...getItemById('item_split_prism'),
      id: 'item_split_prism',
      metadata: {
        ...getItemById('item_split_prism').metadata,
        implementationStatus: 'planned'
      }
    } satisfies ItemDefinition);

    expect(bridge.effectStateLabel).toBe('Bridge effect');
    expect(bridge.effectStateKind).toBe('bridge');
    expect(planned.effectStateLabel).toBe('Planned effect');
    expect(planned.effectStateKind).toBe('planned');
  });

  it('joins multiple activation hooks into one compact trigger readout', () => {
    const model = createItemCardViewModel(getItemById('item_salvage_dividend_chip'));

    expect(model.triggerLabel).toBe('Enemy kill + Object break');
  });
});
