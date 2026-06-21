import { describe, it, expect } from 'vitest';
import {
  cm360ToTrainerSens,
  computeCm360,
  getSpawnInterval,
  computeReactionStats,
  compareToPrevious,
  getTargetRadius,
} from '../src/features/game/engine/trainerEngine.js';
import { MODES } from '../src/content/gameModes/index.js';
import { evaluateDailyTask, getDailyRoutine } from '../src/content/dailyRoutines.js';

describe('trainerEngine', () => {
  it('maps cm/360 to trainer sensitivity', () => {
    expect(cm360ToTrainerSens(40)).toBe(0.4);
    expect(cm360ToTrainerSens(20)).toBe(0.8);
    expect(cm360ToTrainerSens(100)).toBe(0.16);
  });

  it('computes cm/360 from edpi', () => {
    expect(computeCm360(360, 2000)).toBeCloseTo(7.09, 1);
  });

  it('returns spawn intervals within bounds', () => {
    const interval = getSpawnInterval(MODES.flick, 10, 500);
    expect(interval).toBeGreaterThanOrEqual(MODES.flick.spawnMin);
  });

  it('computes reaction stats', () => {
    const stats = computeReactionStats([200, 220, 180]);
    expect(stats.avg).toBe(200);
    expect(stats.stdDev).toBeGreaterThan(0);
  });

  it('compares to previous session', () => {
    const history = [{ mode: 'flick', score: 1000, acc: 80 }];
    const comp = compareToPrevious(history, 'flick', 1200, 85);
    expect(comp.scoreDelta).toBe(200);
    expect(comp.accDelta).toBe(5);
  });

  it('shrinks targets in mixed mode at high intensity', () => {
    expect(getTargetRadius(MODES.mixed, 0.8)).toBeLessThan(MODES.mixed.targetRadius);
  });
});

describe('dailyRoutines', () => {
  it('generates stable daily tasks for a date', () => {
    const d = new Date('2026-06-09T12:00:00');
    const a = getDailyRoutine(d);
    const b = getDailyRoutine(d);
    expect(a.tasks.length).toBe(3);
    expect(a.dateKey).toBe(b.dateKey);
    expect(a.tasks[0].mode).toBe(b.tasks[0].mode);
  });

  it('evaluates flick daily task', () => {
    const task = { mode: 'flick' };
    expect(evaluateDailyTask(task, { hits: 15, acc: 80 })).toBe(true);
    expect(evaluateDailyTask(task, { hits: 10, acc: 90 })).toBe(false);
  });
});
