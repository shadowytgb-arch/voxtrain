import * as THREE from 'three';
  import { createShell } from './createShell.js';
  import { pageRegistry } from './pageRegistry.js';
  import { createRouter } from './router.js';
  import { appState } from './state.js';
  import { toast } from '../core/ui/toast.js';
  import { defaultCrosshair, defaultAudio, getLevelProgress, xpNeededForLevel, XP_CURVE_BASE, XP_CURVE_LINEAR } from '../content/defaults.js';
  import { buildQuests } from '../content/quests.js';
  import { renderUpdates, updateLog, legacyUpdateLog } from '../content/updates.js';
  import { BALLS } from '../content/cosmetics/balls.js';
  import { BACKGROUNDS } from '../content/cosmetics/backgrounds.js';
  import { TRAILS } from '../content/cosmetics/trails.js';
  import { FX } from '../content/cosmetics/effects.js';
  import { TITLES } from '../content/cosmetics/titles.js';
  import { MODES, MODE_LIST } from '../content/gameModes/index.js';
  import { getDailyRoutine, evaluateDailyTask, ensureDailyState } from '../content/dailyRoutines.js';
  import * as trainerEngine from '../features/game/engine/trainerEngine.js';
  import userStoreSource from '../runtime/legacy/userStore.js?raw';
  import audioSource from '../runtime/legacy/audioEngine.js?raw';
  import localDbSource from '../runtime/legacy/localDb.js?raw';
  import profileEditSource from '../runtime/legacy/profileEditing.js?raw';
  import socialFriendsSource from '../runtime/legacy/friends.js?raw';
  import socialSpectateSource from '../runtime/legacy/spectate.js?raw';
  import socialDuelsSource from '../runtime/legacy/duels.js?raw';
  import appStateSource from '../runtime/legacy/appState.js?raw';
  import authSource from '../runtime/legacy/auth.js?raw';
  import navSource from '../runtime/legacy/nav.js?raw';
  import sensitivitySource from '../runtime/legacy/sensitivity.js?raw';
  import gameStateSource from '../runtime/legacy/gameState.js?raw';
  import gameSceneSource from '../runtime/legacy/gameScene.js?raw';
  import gameEffectsSource from '../runtime/legacy/gameEffects.js?raw';
  import gameInputSource from '../runtime/legacy/gameInput.js?raw';
  import gameTargetsSource from '../runtime/legacy/gameTargets.js?raw';
  import gameControllerSource from '../runtime/legacy/gameController.js?raw';
  import gameUiSource from '../runtime/legacy/gameUi.js?raw';
  import gameResultsSource from '../runtime/legacy/gameResults.js?raw';
  import leaderboardSource from '../runtime/legacy/leaderboard.js?raw';
  import customizeShopSource from '../runtime/legacy/customizeShop.js?raw';
  import crosshairSource from '../runtime/legacy/crosshair.js?raw';
  import progressSource from '../runtime/legacy/progress.js?raw';
  import statsSource from '../runtime/legacy/stats.js?raw';
  import dailyRoutineSource from '../runtime/legacy/dailyRoutine.js?raw';
  import reactionSource from '../runtime/legacy/reaction.js?raw';
  import profileSource from '../runtime/legacy/profile.js?raw';
  import patchesSource from '../runtime/legacy/patches.js?raw';

  function exposeGlobalContent() {
    Object.assign(window, {
      THREE,
      toast,
      defaultCrosshair,
      defaultAudio,
      getLevelProgress,
      xpNeededForLevel,
      XP_CURVE_BASE,
      XP_CURVE_LINEAR,
      buildQuests,
      renderUpdates,
      updateLog,
      legacyUpdateLog,
      BALLS,
      BACKGROUNDS,
      TRAILS,
      FX,
      TITLES,
      MODES,
      MODE_LIST,
      getDailyRoutine,
      evaluateDailyTask,
      ensureDailyState,
      trainerEngine,
      getModeConfig: (id) => trainerEngine.getModeConfig(id, MODES),
      is3DGameMode: (id) => trainerEngine.is3DGameMode(id, MODES),
      cm360ToTrainerSens: trainerEngine.cm360ToTrainerSens,
      computeCm360: trainerEngine.computeCm360,
      computeEdpi: trainerEngine.computeEdpi,
    });
  }

  function loadLegacyRuntime() {
    const sources = [
      userStoreSource,
      audioSource,
      localDbSource,
      profileEditSource,
      socialFriendsSource,
      socialSpectateSource,
      socialDuelsSource,
      appStateSource,
      authSource,
      navSource,
      sensitivitySource,
      gameStateSource,
      gameSceneSource,
      gameEffectsSource,
      gameInputSource,
      gameTargetsSource,
      gameControllerSource,
      gameUiSource,
      gameResultsSource,
      leaderboardSource,
      customizeShopSource,
      crosshairSource,
      progressSource,
      statsSource,
      dailyRoutineSource,
      reactionSource,
      profileSource,
      patchesSource,
    ];
    const script = document.createElement('script');
    script.textContent = sources.join('\n\n');
    document.body.appendChild(script);
  }

  function bindShell(router) {
    const root = document.getElementById('app');
    root.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'navigate') router.navigate(target.dataset.route);
      if (action === 'logout') window.logout?.();
      if (action === 'restart-game') window.restartGame?.();
      if (action === 'go-menu') router.goMenu();
      if (action === 'resume-game') window.resumeGame?.();
      if (action === 'show-pause-settings') window.showSettingsPause?.();
      if (action === 'hide-pause-settings') window.hideSettingsPause?.();
      if (action === 'quit-game') window.quitGame?.();
      if (action === 'stop-spectating') window.stopSpectating?.();
    });
    root.addEventListener('input', (event) => {
      const target = event.target.closest('[data-action="update-setting"]');
      if (!target) return;
      window.updateSetting?.(target.dataset.setting, target.type === 'checkbox' ? target.checked : target.value);
    });
    root.addEventListener('change', (event) => {
      const target = event.target.closest('[data-action="update-setting"]');
      if (!target) return;
      window.updateSetting?.(target.dataset.setting, target.type === 'checkbox' ? target.checked : target.value);
    });
  }

  function bootApp() {
    const last = localStorage.getItem('vxt_last');
    if (last && !window.currentUser) {
      const user = window.getU?.(last);
      if (user) {
        window.currentUser = user;
        window.checkDailyLogin?.();
        window.onLogin?.();
        return;
      }
    }
    window.calcSens?.();
    window.syncCrosshairControls?.();
    window.renderCross?.();
  }

  export function bootstrapApp(root) {
    createShell(root);
    exposeGlobalContent();
    loadLegacyRuntime();
    const ctx = { state: appState, content: { BALLS, BACKGROUNDS, TRAILS, FX, TITLES, MODES, updateLog, legacyUpdateLog }, router: null };
    const router = createRouter(pageRegistry, ctx);
    ctx.router = router;
    window.showPage = router.show;
    window.navGo = router.navigate;
    window.goMenu = router.goMenu;
    bindShell(router);
    pageRegistry.forEach((page) => page.init?.(ctx));
    bootApp();
  }
