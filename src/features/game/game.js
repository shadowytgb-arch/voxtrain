import template from './game.html?raw';
import { bindActionMap } from '../../core/ui/dom.js';

export default {
  id: 'game',
  template,
  init(ctx) {
    const root = document.getElementById('pg-game');
    bindActionMap(root, 'click', { 'quit-game': () => window.quitGame?.() });
  },
  enter(ctx) {
    // No page-specific enter hook required in phase 1.
  },
};
