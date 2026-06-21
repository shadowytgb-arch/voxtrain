import template from './leaderboard.html?raw';
  import { bindActionMap } from '../../core/ui/dom.js';

  export default {
    id: 'lb',
    template,
    init(ctx) {
      const root = document.getElementById('pg-lb');
      bindActionMap(root, 'click', {
  'set-lb-mode': (_, target) => window.setLbMode?.(target.dataset.lbMode, target),
  'set-lb-time': (_, target) => window.setLbTime?.(target.dataset.lbTime, target),
});
    },
    enter(ctx) {
      window.renderLB?.();
    },
  };
