import template from './profile.html?raw';
  import { bindActionMap } from '../../core/ui/dom.js';

  export default {
    id: 'profile',
    template,
    init(ctx) {
      const root = document.getElementById('pg-profile');
      bindActionMap(root, 'click', {
  'toggle-profile-edit': () => window.toggleProfileEdit?.(),
  'open-profile-upload': () => document.getElementById('prof-pic-upload')?.click(),
  'clear-profile-pic': () => window.clearProfilePic?.(),
  'show-rename-confirm': () => window.showRenameConfirm?.(),
});
bindActionMap(root, 'input', { 'set-volume': (_, target) => window.setVol?.(target.dataset.audioKey, target.value) });
bindActionMap(root, 'change', {
  'upload-profile-pic': (_, target) => window.uploadProfilePic?.(target),
  'toggle-colorblind': () => window.toggleCB?.(),
});
    },
    enter(ctx) {
      window.refreshProfile?.();
    },
  };
