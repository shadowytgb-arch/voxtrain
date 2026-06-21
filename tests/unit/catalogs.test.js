import { describe, expect, it } from 'vitest';
import { BALLS } from '../../src/content/cosmetics/balls.js';
import { MODES } from '../../src/content/gameModes/index.js';

describe('catalog integrity', () => {
  it('keeps unique cosmetic ids and an active trainer mode', () => {
    const ids = new Set(BALLS.map((ball) => ball.id));
    expect(ids.size).toBe(BALLS.length);
    expect(MODES.trainer3d.dur).toBe(45);
  });
});
