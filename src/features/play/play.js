import template from './play.html?raw';
import { bindActionMap } from '../../core/ui/dom.js';

const DURATION_KEY = 'vox_round_duration';

function getStoredDuration() {
  const raw = localStorage.getItem(DURATION_KEY);
  const n = raw === '0' ? 0 : Number(raw);
  return Number.isFinite(n) ? n : 45;
}

function syncDurationPills() {
  const dur = getStoredDuration();
  document.querySelectorAll('.dur-pill').forEach((btn) => {
    btn.classList.toggle('on', Number(btn.dataset.duration) === dur);
  });
}

function setRoundDuration(value) {
  const n = Number(value);
  localStorage.setItem(DURATION_KEY, String(n));
  syncDurationPills();
}

export default {
  id: 'menu',
  template,
  init(ctx) {
    const root = document.getElementById('pg-menu');
    bindActionMap(root, 'click', {
      'start-mode': (_, target) => {
        const dur = getStoredDuration();
        const options = dur > 0 ? { duration: dur } : { duration: 9999 };
        window.startMode?.(target.dataset.mode, options);
      },
      'navigate': (_, target) => ctx.router.navigate(target.dataset.route),
      'apply-sens': () => window.applySensToTrainer?.(),
      'set-duration': (_, target) => setRoundDuration(target.dataset.duration),
      'start-daily': (_, target) => {
        const mode = target.dataset.mode;
        const duration = Number(target.dataset.duration) || 45;
        window.startMode?.(mode, { duration });
      },
    });
    bindActionMap(root, 'input', { 'calc-sens': () => window.calcSens?.() });
    bindActionMap(root, 'change', { 'calc-sens': () => window.calcSens?.() });
    syncDurationPills();
  },
  enter() {
    window.calcSens?.();
    window.loadSensFromStorage?.();
    syncDurationPills();
    window.renderPlayDaily?.();
  },
};
