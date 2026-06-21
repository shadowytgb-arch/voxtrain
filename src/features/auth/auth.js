import template from './auth.html?raw';
  import { bindActionMap } from '../../core/ui/dom.js';

  export default {
    id: 'login',
    template,
    init(ctx) {
      const root = document.getElementById('pg-login');
      bindActionMap(root, 'click', {
  'google-signin': () => window.signInWithGoogle?.(),
  'set-login-mode': (_, target) => window.setLoginMode?.(target.dataset.mode),
  'submit-auth': () => window.doAuth?.(),
});
root.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.closest('#pg-login')) window.doAuth?.();
});
    },
    enter(ctx) {
      // No page-specific enter hook required in phase 1.
    },
  };
