import { describe, expect, it } from 'vitest';

import { getItemById, type ItemDefinition } from '../../src/content/items';
import { createItemCardViewModel } from '../../src/ui/ItemCardViewModel';

describe('item card view model', () => {
  it('formats reward item cards with rarity, family, source, tags, and effect state', () => {
    const model = createItemCardViewModel(getItemById('item_split_prism'), {
      sourceLabel: 'Starter pool',
      synergyText: 'Build fit: Prism +5'
    });

    expect(model).toEqual(
      expect.objectContaining({
        itemId: 'item_split_prism',
        name: 'Split Prism',
        rarityLabel: 'Uncommon',
        familyLabel: 'Laser Split',
        sourceLabel: 'Starter pool',
        effectStateLabel: 'Live effect',
        effectStateKind: 'live',
        iconKind: 'laser-split',
        iconLabel: 'Laser Split item icon',
        synergyText: 'Build fit: Prism +5'
      })
    );
    expect(model.badges).toEqual(['Split']);
    expect(model.metaLine).toBe('Uncommon | Laser Split | Starter pool | Live effect');
  });

  it('includes shop price and run acquisition labels when present', () => {
    const model = createItemCardViewModel(getItemById('item_relic_ash_compass'), {
      sourceLabel: 'vault source',
      price: 9,
      acquisitionOrder: 3
    });

    expect(model.priceLabel).toBe('9 credits');
    expect(model.acquisitionLabel).toBe('Slot 4');
    expect(model.metaLine).toBe('Rare | Curse Relic | vault source | Live effect | 9 credits');
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
});
