export const XP_CURVE_BASE = 40;
export const XP_CURVE_LINEAR = 60;

export function defaultCrosshair() {
  return { type: 'cross', size: 12, thick: 2, gap: 4, dot: 4, color: '#00e5ff', outline: 1 };
}

export function defaultAudio() {
  return { master: 80, hit: 100, miss: 100 };
}

export function xpNeededForLevel(level) {
  return Math.max(100, Math.round(XP_CURVE_BASE * Math.pow(level, 1.5) + XP_CURVE_LINEAR * level));
}

export function getLevelProgress(totalXp) {
  let xp = Math.max(0, Math.floor(totalXp || 0));
  let level = 1;
  let needed = xpNeededForLevel(level);
  while (xp >= needed) {
    xp -= needed;
    level += 1;
    needed = xpNeededForLevel(level);
  }
  return { level, current: xp, needed };
}
