import template from './reaction.html?raw';
  import { bindActionMap } from '../../core/ui/dom.js';

  export default {
    id: 'react',
    template,
    init(ctx) {
      const root = document.getElementById('pg-react');
      bindActionMap(root, 'click', {
  'navigate': (_, target) => ctx.router.navigate(target.dataset.route),
  'react-click': () => window.reactClick?.(),
  'reset-react': () => window.resetReact?.(),
});
    },
    enter(ctx) {
      // No page-specific enter hook required in phase 1.
    },
  };
