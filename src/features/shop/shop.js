import template from './shop.html?raw';
import { bindActionMap } from '../../core/ui/dom.js';

export default {
  id: 'shop',
  template,
  init(ctx) {
    const root = document.getElementById('pg-shop');
    bindActionMap(root, 'click', { 'set-catalog-tab': (_, target) => window.setCatalogTab?.(target.dataset.scope, target.dataset.tab, target) });
  },
  enter(ctx) {
    window.renderShop?.();
  },
};
