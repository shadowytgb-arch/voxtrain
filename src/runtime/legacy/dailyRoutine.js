// Daily training routine UI + completion tracking
function renderPlayDaily(){
  if(!window.getDailyRoutine) return;
  const host=document.getElementById('play-daily-tasks');
  if(!host) return;
  const routine=window.getDailyRoutine();
  const state=currentUser?window.ensureDailyState?.(currentUser):null;
  host.innerHTML=routine.tasks.map(task=>{
    const done=state?.completed?.[task.id];
    const claimed=state?.claimed?.[task.id];
    const modeLabel=MODES[task.mode]?.label||task.mode;
    return `<div class="daily-task-row ${done?'done':''}">
      <div><strong>${task.label}</strong><div class="daily-task-meta">${modeLabel} · ${task.duration}s · ${task.goal}</div></div>
      <div class="daily-task-actions">
        ${claimed?'<span class="daily-claimed">✅ Claimed</span>':done?`<button class="fr-btn primary" data-action="claim-daily" data-task-id="${task.id}">CLAIM ${task.reward}💎</button>`:`<button class="fr-btn secondary" data-action="start-daily" data-mode="${task.mode}" data-duration="${task.duration}">START</button>`}
      </div>
    </div>`;
  }).join('');
}

function claimDailyReward(taskId){
  if(!currentUser||!window.getDailyRoutine) return;
  const routine=window.getDailyRoutine();
  const task=routine.tasks.find(t=>t.id===taskId);
  const state=window.ensureDailyState(currentUser);
  if(!task||!state.completed[taskId]||state.claimed[taskId]) return;
  state.claimed[taskId]=true;
  currentUser.gems=(currentUser.gems||0)+task.reward;
  saveU();updateNav();renderPlayDaily();renderDailyTraining?.();
  toast(`💎 +${task.reward} Gems — daily task complete!`);
}

function checkDailyAfterGame(mode, result){
  if(!currentUser||!window.getDailyRoutine||!window.evaluateDailyTask) return;
  const routine=window.getDailyRoutine();
  const state=window.ensureDailyState(currentUser);
  routine.tasks.forEach(task=>{
    if(task.mode===mode&&window.evaluateDailyTask(task,result)){
      state.completed[task.id]=true;
    }
  });
  saveU();
  renderPlayDaily?.();
  renderDailyTraining?.();
}

document.addEventListener('click',(e)=>{
  const btn=e.target.closest('[data-action="claim-daily"]');
  if(btn) claimDailyReward(btn.dataset.taskId);
});

function renderDailyTraining(){
  const host=document.getElementById('progress-daily-tasks');
  if(!host||!window.getDailyRoutine) return;
  const routine=window.getDailyRoutine();
  const state=currentUser?window.ensureDailyState?.(currentUser):null;
  host.innerHTML=routine.tasks.map(task=>{
    const done=state?.completed?.[task.id];
    const claimed=state?.claimed?.[task.id];
    return `<div class="daily-task-row ${done?'done':''}">
      <div><strong>${task.label}</strong><div class="daily-task-meta">${MODES[task.mode]?.label||task.mode} · ${task.goal} · Reward ${task.reward}💎</div></div>
      <div>${claimed?'✅':done?'Ready to claim':'In progress'}</div>
    </div>`;
  }).join('');
}
