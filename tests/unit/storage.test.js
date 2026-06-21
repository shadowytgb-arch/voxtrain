import { describe, expect, it } from 'vitest';
import { normalizeHex } from '../../src/core/utils/color.js';

describe('storage-adjacent utilities', () => {
  it('normalizes invalid hex input to the default accent color', () => {
    expect(normalizeHex('bad')).toBe('#00e5ff');
    expect(normalizeHex('#ffffff')).toBe('#ffffff');
  });
});
