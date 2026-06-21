import { describe, expect, it } from 'vitest';
import { defaultCrosshair } from '../../src/content/defaults.js';

describe('crosshair defaults', () => {
  it('keeps zero-gap capable defaults as numeric values', () => {
    const crosshair = defaultCrosshair();
    expect(typeof crosshair.gap).toBe('number');
    expect(crosshair.outline).toBe(1);
  });
});
