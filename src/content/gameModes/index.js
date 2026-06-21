import { TRAINER_3D_MODE } from './trainer3d.js';
import { FLICK_MODE } from './flick.js';
import { TRACKING_MODE } from './tracking.js';
import { SWITCHING_MODE } from './switching.js';
import { MICRO_MODE } from './micro.js';
import { MIXED_MODE } from './mixed.js';

export const MODES = {
  trainer3d: TRAINER_3D_MODE,
  flick: FLICK_MODE,
  tracking: TRACKING_MODE,
  switching: SWITCHING_MODE,
  micro: MICRO_MODE,
  mixed: MIXED_MODE,
};

export const MODE_LIST = Object.entries(MODES).map(([id, mode]) => ({ id, ...mode }));
