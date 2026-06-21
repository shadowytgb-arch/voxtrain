import template from './progress.html?raw';
import { bindActionMap } from '../../core/ui/dom.js';

export default {
  id: 'progress',
  template,
  init(ctx) {
    const root = document.getElementById('pg-progress');
    bindActionMap(root, 'click', { 'claim-quest': (_, target) => window.claimQuest?.(target.dataset.questId) });
  },
  enter(ctx) {
    window.renderQuests?.();
    window.renderDailyGrid?.();
    window.renderDailyTraining?.();
    window.drawProgressCharts?.();
  },
};
