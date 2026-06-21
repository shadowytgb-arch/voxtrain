import template from './social.html?raw';
  import { bindActionMap } from '../../core/ui/dom.js';

  export default {
    id: 'social',
    template,
    init(ctx) {
      const root = document.getElementById('pg-social');
      const handlers = {
  'add-friend': () => window.addFriend?.(),
  'create-duel': () => window.createDuel?.(),
  'view-friend-profile': (_, target) => window.viewFriendProfile?.(target.dataset.username),
  'remove-friend': (_, target) => window.removeFriend?.(target.dataset.username),
  'accept-friend-request': (_, target) => window.acceptFriendRequest?.(Number(target.dataset.requestIndex)),
  'decline-friend-request': (_, target) => window.declineFriendRequest?.(Number(target.dataset.requestIndex)),
  'accept-spectate-request': (_, target) => window.acceptSpectateRequest?.(Number(target.dataset.requestIndex)),
  'decline-spectate-request': (_, target) => window.declineSpectateRequest?.(Number(target.dataset.requestIndex)),
  'join-duel': (_, target) => window.joinDuel?.(target.dataset.duelId),
  'close-friend-profile': () => window.closeFriendProfile?.(),
  'spectate-friend': (_, target) => { window.closeFriendProfile?.(); window.spectateUser?.(target.dataset.username); },
  'request-spectate': (_, target) => window.sendSpectateRequest?.(target.dataset.username),
};
bindActionMap(root, 'click', handlers);
bindActionMap(document.body, 'click', handlers);
    },
    enter(ctx) {
      window.renderFriends?.(); window.populateDuelInvites?.(); window.renderDuels?.();
    },
  };
