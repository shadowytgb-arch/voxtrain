export function normalizeHex(value) { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : '#00e5ff'; }
