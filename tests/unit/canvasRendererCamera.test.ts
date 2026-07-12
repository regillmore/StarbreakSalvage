import { describe, expect, it, vi } from 'vitest';

import { CanvasRenderer } from '../../src/app/CanvasRenderer';
import { calculateViewportLayout } from '../../src/app/ViewportLayout';
import { IDLE_SCREEN_SHAKE } from '../../src/core/screenShake';

describe('CanvasRenderer camera line of sight', () => {
  it('clips the transformed gameplay layer to the stable arena frame', () => {
    const layout = calculateViewportLayout({ width: 1280, height: 720, dpr: 1 });
    const context = {
      save: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn()
    };
    const renderer = Object.create(CanvasRenderer.prototype) as CanvasRenderer;
    Object.assign(renderer, {
      context,
      viewportLayout: layout,
      shakeState: IDLE_SCREEN_SHAKE
    });

    renderer.beginGameplayLayer();

    const frame = layout.gameplaySafeFrame;
    expect(context.save).toHaveBeenCalledOnce();
    expect(context.beginPath).toHaveBeenCalledOnce();
    expect(context.rect).toHaveBeenCalledWith(frame.x, frame.y, frame.width, frame.height);
    expect(context.clip).toHaveBeenCalledOnce();
    expect(context.translate).toHaveBeenCalledWith(frame.x, frame.y);
    expect(context.scale).toHaveBeenCalledWith(layout.canvasScale, layout.canvasScale);
    expect(context.clip.mock.invocationCallOrder[0]).toBeLessThan(
      context.translate.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY
    );
  });
});
