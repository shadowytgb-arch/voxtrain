// ═══════════════════════════════════════════════
//  QUESTS
// ═══════════════════════════════════════════════
function qprog(type,val,isMax=false){
  if(!currentUser)return;
  currentUser.quests.forEach(q=>{
    if(q.type===type&&!q.claimed){
      if(isMax)q.progress=Math.max(q.progress,val);
      else q.progress=Math.min(q.goal,q.progress+val);
    }
  });
}

function renderQuests(){
  if(!currentUser)return;
  const grid=document.getElementById('qgrid');grid.innerHTML='';
  currentUser.quests.forEach(q=>{
    const pct=Math.min(100,Math.round(q.progress/q.goal*100));
    const done=q.progress>=q.goal;
    const div=document.createElement('div');div.className='qcard'+(q.claimed?' done':'');
    div.innerHTML=`
      <div class="qtop">
        <div class="qicon">${q.icon}</div>
        <div class="qinfo"><h4>${q.title}</h4><p>${q.desc}</p></div>
        <div class="qreward">💎 ${q.reward}</div>
      </div>
      <div class="qbar"><div class="qfill" style="width:${pct}%"></div></div>
      <div class="qlabel"><span>${q.progress}/${q.goal}</span><span>${pct}%</span></div>
      ${q.claimed?'<div class="qclaimed">✅ CLAIMED</div>':`<button class="qclaim" ${done?'':'disabled'} data-legacy-click="claimQuest('${q.id}')">${done?'CLAIM REWARD':'In Progress'}</button>`}
    `;
    grid.appendChild(div);
  });
}

function renderDailyGrid(){
  if(!currentUser)return;
  document.getElementById('login-streak-num').textContent=currentUser.loginStreak||0;
  const bonuses=[25,25,25,50,50,50,200];
  const g=document.getElementById('daily-grid');g.innerHTML='';
  for(let i=0;i<7;i++){
    const div=document.createElement('div');div.className='daily-day';
    const streak=currentUser.loginStreak||0;
    const claimed=i<streak;
    const isToday=i===Math.min(streak,6);
    if(claimed)div.classList.add('claimed');
    if(isToday)div.classList.add('today');
    div.innerHTML=`<div class="day-num">Day ${i+1}</div><div class="day-gem">${claimed?'✅':'+'+bonuses[i]+' 💎'}</div>`;
    g.appendChild(div);
  }
}

function claimQuest(id){
  const q=currentUser.quests.find(x=>x.id===id);
  if(!q||q.claimed||q.progress<q.goal)return;
  q.claimed=true;currentUser.gems+=q.reward;
  playClaim();saveU();updateNav();renderQuests();
  toast(`💎 +${q.reward} Gems claimed!`);
}
