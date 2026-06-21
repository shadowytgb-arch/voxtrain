import { appState } from './state.js';

export function createRouter(pages, ctx) {
  const byId = new Map(pages.map((page) => [page.id, page]));

  function setActiveNav(id) {
    document.querySelectorAll('.nav-btn').forEach((button) => button.classList.remove('on'));
    const navId = id === 'react' ? 'menu' : id;
    document.getElementById(`nb-${navId}`)?.classList.add('on');
  }

  function setPageVisibility(id) {
    const leavingGame = id !== 'game' && document.getElementById('pg-game')?.classList.contains('act');
    if (leavingGame) window.stopGame?.();
    if (id !== 'game') window.resetPauseUI?.();
    document.querySelectorAll('.spage').forEach((page) => page.classList.remove('act'));
    document.getElementById('pg-game')?.classList.remove('act');
    document.getElementById('pg-login')?.classList.remove('act');
    document.getElementById(`pg-${id}`)?.classList.add('act');
    setActiveNav(id);
    appState.currentPage = id;
  }

  function show(id) {
    byId.get(appState.currentPage)?.leave?.(ctx);
    setPageVisibility(id);
    byId.get(id)?.enter?.(ctx);
  }

  function navigate(id) {
    if (document.getElementById('pg-game')?.classList.contains('act') && id !== 'game') {
      if (!window.confirm('Quit current game?')) return;
      window.stopGame?.();
    }
    show(id);
  }

  function goMenu() {
    document.getElementById('results-overlay')?.classList.remove('act');
    window.resetPauseUI?.();
    show('menu');
  }

  return { show, navigate, goMenu };
}
