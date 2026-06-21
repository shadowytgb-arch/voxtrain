const ROUTINE_POOL = [
  { mode: 'flick', duration: 45, label: 'Flick Warmup', goal: 'Hit 15 targets with 80%+ accuracy' },
  { mode: 'tracking', duration: 60, label: 'Tracking Flow', goal: 'Maintain 70%+ accuracy for 60 seconds' },
  { mode: 'switching', duration: 45, label: 'Switch Drill', goal: 'Score 3000+ in switching mode' },
  { mode: 'micro', duration: 45, label: 'Micro Precision', goal: 'Land 10 hits on micro targets' },
  { mode: 'mixed', duration: 60, label: 'Mixed Grind', goal: 'Complete a full mixed session' },
  { mode: 'trainer3d', duration: 45, label: 'Classic Trainer', goal: 'Beat your last 3D trainer score' },
];

function dateSeed(date = new Date()) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

export function getDailyRoutine(date = new Date()) {
  const seed = dateSeed(date);
  const primary = ROUTINE_POOL[seed % ROUTINE_POOL.length];
  const secondary = ROUTINE_POOL[(seed * 7 + 3) % ROUTINE_POOL.length];
  const bonus = ROUTINE_POOL[(seed * 13 + 5) % ROUTINE_POOL.length];
  return {
    dateKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    tasks: [
      { ...primary, id: 'daily-1', reward: 40, type: 'primary' },
      { ...secondary, id: 'daily-2', reward: 30, type: 'secondary' },
      { ...bonus, id: 'daily-3', reward: 50, type: 'bonus' },
    ],
  };
}

export function evaluateDailyTask(task, result) {
  if (!task || !result) return false;
  switch (task.mode) {
    case 'flick':
      return result.hits >= 15 && result.acc >= 80;
    case 'tracking':
      return result.acc >= 70;
    case 'switching':
      return result.score >= 3000;
    case 'micro':
      return result.hits >= 10;
    case 'mixed':
    case 'trainer3d':
      return result.hits >= 5;
    default:
      return result.hits >= 10;
  }
}

export function ensureDailyState(user, date = new Date()) {
  if (!user) return null;
  const routine = getDailyRoutine(date);
  if (!user.dailyTraining || user.dailyTraining.dateKey !== routine.dateKey) {
    user.dailyTraining = {
      dateKey: routine.dateKey,
      completed: {},
      claimed: {},
    };
  }
  return user.dailyTraining;
}
