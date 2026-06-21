import template from './updates.html?raw';
import { bindActionMap } from '../../core/ui/dom.js';

export default {
  id: 'updates',
  template,
  init(ctx) {
    const root = document.getElementById('pg-updates');
    const input = document.getElementById('updates-gems-input');
    const applyGemValue = () => {
      if (!window.currentUser) {
        window.toast?.('Log in first.');
        return;
      }
      const nextValue = Number(input?.value ?? '');
      if (!Number.isFinite(nextValue) || nextValue < 0) {
        window.toast?.('Enter a valid gem amount.');
        return;
      }
      window.currentUser.gems = Math.floor(nextValue);
      window.saveU?.();
      window.updateNav?.();
      if (input) input.value = String(window.currentUser.gems);
      window.toast?.(`Gems set to ${window.currentUser.gems}.`);
    };

    bindActionMap(root, 'click', {
      'set-test-gems': () => applyGemValue(),
    });

    input?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyGemValue();
      }
    });
  },
  enter(ctx) {
    const input = document.getElementById('updates-gems-input');
    if (input && window.currentUser) input.value = String(window.currentUser.gems ?? 0);
    window.renderUpdates?.();
  },
};
