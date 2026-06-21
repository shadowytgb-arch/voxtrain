/** Central 3D trainer engine — movement, spawn timing, sensitivity mapping. */

export function getModeConfig(modeId, modes = {}) {
  return modes[modeId] || modes.trainer3d || null;
}

export function is3DGameMode(modeId, modes = {}) {
  return !!getModeConfig(modeId, modes)?.is3D;
}

export function getIntensity(hits, score, adaptive = true) {
  if (!adaptive) return 0.45;
  return Math.min(1, Math.max(0, (hits + score / 120) / 24));
}

export function getSpawnInterval(mode, hits, score) {
  const cfg = mode || {};
  const intensity = getIntensity(hits, score, cfg.adaptive !== false);
  const base = cfg.spawnBase ?? 1.2;
  const min = cfg.spawnMin ?? 0.35;
  const adaptiveCut = cfg.adaptive !== false ? Math.min(0.75, intensity * 0.025 * (hits + score / 120)) : 0;
  return Math.max(min, base - adaptiveCut + (Math.random() * 0.4 - 0.2));
}

export function getTargetRadius(mode, intensity = 0) {
  const base = mode?.targetRadius ?? 0.5;
  if (mode?.movement === 'mixed' && intensity > 0.5) {
    return Math.max(0.26, base - intensity * 0.08);
  }
  return base;
}

export function cm360ToTrainerSens(cm360) {
  const cm = Math.max(5, Number(cm360) || 40);
  return Math.max(0.1, Math.min(2.0, Math.round((16 / cm) * 100) / 100));
}

export function computeEdpi(sens, dpi) {
  return (Number(sens) || 1) * (Number(dpi) || 800);
}

export function computeCm360(gameYaw, edpi) {
  const yaw = Number(gameYaw) || 360;
  const e = Math.max(1, edpi);
  return yaw / (e * 0.0254);
}

export function updateTargetMotion(target, elapsed, dt, mode, intensity = 0) {
  if (!target?.userData) return;
  const ud = target.userData;
  const movement = mode?.movement || 'wave';

  if (movement === 'static') {
    target.position.x = ud.baseX;
    target.position.y = ud.baseY;
    target.position.z = ud.baseZ;
    target.rotation.y += (ud.rotateSpeed || 0) * dt * 0.3;
    return;
  }

  if (movement === 'orbit') {
    const radius = ud.orbitRadius ?? 1.4;
    const speed = ud.orbitSpeed ?? 1.1;
    ud.orbitAngle = (ud.orbitAngle ?? 0) + speed * dt;
    target.position.x = ud.orbitCenterX + Math.cos(ud.orbitAngle) * radius;
    target.position.y = ud.orbitCenterY + Math.sin(ud.orbitAngle * 0.7) * (radius * 0.35);
    target.position.z = ud.orbitCenterZ + Math.sin(ud.orbitAngle) * (radius * 0.55);
    target.rotation.y += dt * 1.2;
    return;
  }

  if (movement === 'linear') {
    ud.linearT = (ud.linearT ?? 0) + dt * (ud.linearSpeed ?? 1.4);
    const t = Math.sin(ud.linearT);
    target.position.x = ud.baseX + t * (ud.linearAmp ?? 2.2);
    target.position.y = ud.baseY;
    target.position.z = ud.baseZ;
    target.rotation.y += (ud.rotateSpeed || 0) * dt;
    return;
  }

  // wave / mixed / default
  const waveMul = movement === 'mixed' && intensity > 0.6 ? 1.35 : 1;
  const x = ud.baseX
    + Math.sin(elapsed * ud.waveSpeed + ud.pulseOffset) * ud.waveAmpX * waveMul
    + ud.driftX * elapsed;
  const y = ud.baseY
    + Math.cos(elapsed * (ud.waveSpeed * 0.75) + ud.pulseOffset) * ud.waveAmpY * waveMul
    + ud.driftY * elapsed;
  const z = ud.baseZ + Math.sin(elapsed * (ud.waveSpeed * 0.55) + ud.pulseOffset) * 0.45;

  target.position.x = clamp(x, -4.2, 4.2);
  target.position.y = clamp(y, 0.9, 3.4);
  target.position.z = clamp(z, -8, -3.6);
  target.rotation.y += (ud.rotateSpeed || 0) * dt;
  target.rotation.x = Math.sin(elapsed + ud.pulseOffset) * 0.25;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function initTargetUserData(mode, intensity, performanceNow) {
  const movement = mode?.movement || 'wave';
  const distance = (mode?.targetRadius ?? 0.5) < 0.35
    ? 5.5 + Math.random() * 2.8
    : 4.5 + Math.random() * 2.3;
  const baseX = (Math.random() * 2 - 1) * (1.2 + intensity * 2.2);
  const baseY = 1.1 + Math.random() * 1.5;
  const baseZ = -distance;

  const data = {
    life: (mode?.targetLife ?? 3) + (mode?.adaptive !== false ? (1 - intensity) * 1.3 : 0),
    spawnedAt: performanceNow,
    baseX,
    baseY,
    baseZ,
    waveAmpX: movement === 'static' ? 0 : 0.2 + Math.random() * 1.35,
    waveAmpY: movement === 'static' ? 0 : 0.1 + Math.random() * 0.55,
    waveSpeed: 1.2 + Math.random() * 1.6 + intensity * 0.9,
    driftX: movement === 'static' ? 0 : (Math.random() * 2 - 1) * (0.18 + intensity * 0.35),
    driftY: movement === 'static' ? 0 : (Math.random() * 2 - 1) * 0.08,
    pulseOffset: Math.random() * Math.PI * 2,
    rotateSpeed: (Math.random() - 0.5) * (1.2 + intensity),
    movement,
  };

  if (movement === 'orbit') {
    data.orbitCenterX = baseX * 0.4;
    data.orbitCenterY = baseY;
    data.orbitCenterZ = baseZ;
    data.orbitRadius = 0.9 + Math.random() * 1.1 + intensity * 0.5;
    data.orbitSpeed = 0.9 + Math.random() * 0.8;
    data.orbitAngle = Math.random() * Math.PI * 2;
  }

  if (movement === 'linear') {
    data.linearAmp = 1.6 + Math.random() * 1.4;
    data.linearSpeed = 1 + Math.random() * 0.8;
    data.linearT = Math.random() * Math.PI * 2;
  }

  return data;
}

export function computeReactionStats(reactTimes) {
  if (!reactTimes?.length) {
    return { avg: null, min: null, max: null, stdDev: null, ttk: null };
  }
  const sum = reactTimes.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / reactTimes.length);
  const min = Math.min(...reactTimes);
  const max = Math.max(...reactTimes);
  const variance = reactTimes.reduce((acc, v) => acc + (v - avg) ** 2, 0) / reactTimes.length;
  const stdDev = Math.round(Math.sqrt(variance));
  return { avg, min, max, stdDev, ttk: avg };
}

export function compareToPrevious(history, mode, score, acc) {
  const prev = [...(history || [])].reverse().find((h) => h.mode === mode);
  if (!prev) return null;
  return {
    scoreDelta: score - prev.score,
    accDelta: acc - prev.acc,
    prevScore: prev.score,
    prevAcc: prev.acc,
  };
}
