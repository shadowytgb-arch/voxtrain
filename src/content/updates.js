export const updateLog = [
  {date:'2026-06-09',desc:'Added Flick, Tracking, Switching, Micro, and Mixed training modes with distinct target behavior.'},
  {date:'2026-06-09',desc:'Sensitivity converter now applies cm/360° directly to in-game trainer sensitivity.'},
  {date:'2026-06-09',desc:'Configurable round duration: 30s, 45s, 60s, 90s, or Endless from the play menu.'},
  {date:'2026-06-09',desc:'Daily training routine with 3 generated drills and gem rewards on completion.'},
  {date:'2026-06-09',desc:'Progress page analytics: score trend, reaction trend, and mode breakdown charts.'},
  {date:'2026-06-09',desc:'Post-round stats: TTK, reaction consistency (σ), aim offset heatmap, and session comparison.'},
  {date:'2026-06-09',desc:'Refactored 3D trainer engine into a modular movement/spawn system shared across all modes.'},
  {date:'2026-06-09',desc:'Leaderboard now tracks scores separately for each training mode.'},
  {date:'2026-04-09',desc:'Simplified the project to local-only mode by removing Firebase dependencies from the active runtime.'},
  {date:'2026-04-09',desc:'Removed the old 2D trainer path and standardized the app around the 3D Aim Trainer.'},
  {date:'2026-04-09',desc:'Fixed 3D input handling so pointer lock, mouse look, and shooting work reliably again.'},
  {date:'2026-04-09',desc:'Fixed fullscreen sizing, crosshair alignment, and hit registration in the 3D trainer.'},
  {date:'2026-04-09',desc:'Applied purchased ball colors, backgrounds, trails, and hit effects correctly in the live 3D scene.'},
  {date:'2026-04-09',desc:'Improved the pause flow, round timer display, target respawn timing, and end-of-round target position map.'},
  {date:'2026-04-09',desc:'Replaced the flat XP system with a gradual hybrid level curve for smoother long-term progression.'},
  {date:'2026-04-09',desc:'Cleaned up corrupted text and rewrote UI wording so the interface reads clearly and consistently in English.'}
];

export const legacyUpdateLog = [
  {date:'2026-04-07',desc:'Added spectate requests and live view feature for friends approved to watch your gameplay.'},
  {date:'2026-04-08',desc:'Re-enabled trainer duels with stable duration handling and cloud-backed invite delivery.'},
  {date:'2026-04-07',desc:'Fixed friend search to fetch players from cloud storage when not found in local cache.'},
  {date:'2026-04-08',desc:'Hardened account storage to stop syncing private password data through public user records.'}
];

export function renderUpdates() {
  const list = document.getElementById('updates-list');
  const legacyList = document.getElementById('legacy-updates-list');
  if (!list || !legacyList) return;
  list.innerHTML = updateLog.map((update) => `
    <div class="update-item">
      <time>${update.date}</time>
      <p>${update.desc}</p>
    </div>
  `).join('');
  legacyList.innerHTML = legacyUpdateLog.map((update) => `
    <div class="update-item">
      <time>${update.date}</time>
      <p>${update.desc}</p>
    </div>
  `).join('');
}
