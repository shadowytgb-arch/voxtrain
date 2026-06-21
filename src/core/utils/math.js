export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
export function distance(a, b) { return Math.hypot((a.x||0)-(b.x||0), (a.y||0)-(b.y||0)); }
