import template from './customize.html?raw';
  import { bindActionMap } from '../../core/ui/dom.js';

  export default {
    id: 'customize',
    template,
    init(ctx) {
      const root = document.getElementById('pg-customize');
      bindActionMap(root, 'click', {
  'set-cross-type': (_, target) => window.setCrossType?.(target.dataset.crossType, target),
  'save-crosshair': () => window.saveCrosshair?.(),
  'set-catalog-tab': (_, target) => window.setCatalogTab?.(target.dataset.scope, target.dataset.tab, target),
});
bindActionMap(root, 'input', { 'update-cross': (_, target) => window.updateCross?.(target.dataset.crossField, target.type === 'checkbox' ? (target.checked ? 1 : 0) : target.value) });
bindActionMap(root, 'change', { 'update-cross': (_, target) => window.updateCross?.(target.dataset.crossField, target.type === 'checkbox' ? (target.checked ? 1 : 0) : target.value) });
    },
    enter(ctx) {
      if (window.currentUser?.crosshair) window.ch = Object.assign({}, window.defaultCrosshair?.() || {}, window.currentUser.crosshair); window.syncCrosshairControls?.(); window.renderCustomize?.(); window.renderCross?.();
    },
  };
