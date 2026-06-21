// ═══════════════════════════════════════════════
//  LEADERBOARD
// ═══════════════════════════════════════════════
function saveLBEntry(mode,score,acc,grade){
  const db=getDB();
  if(!db.lb)db.lb={};
  if(!db.lb[mode])db.lb[mode]=[];
  const now=Date.now();
  const entry={user:currentUser.username,score,acc,grade,ts:now};
  const idx=db.lb[mode].findIndex(e=>e.user.toLowerCase()===currentUser.username.toLowerCase());
  if(idx>=0){if(score>db.lb[mode][idx].score)db.lb[mode][idx]=entry;}
  else db.lb[mode].push(entry);
  db.lb[mode].sort((a,b)=>b.score-a.score);
  if(db.lb[mode].length>100)db.lb[mode]=db.lb[mode].slice(0,100);
  saveDB(db);
  dbSaveLeaderboardEntry(mode, entry);
}

async function getLBData(mode,time){
  const db=getDB();
  let data=(db.lb&&db.lb[mode])||[];
  const now=Date.now();
  if(time==='daily')data=data.filter(e=>e.ts>now-86400000);
  else if(time==='weekly')data=data.filter(e=>e.ts>now-604800000);
  return data.sort((a,b)=>b.score-a.score);
}

function getNextLbReset(time){
  const now=new Date();
  if(time==='daily'){
    const tomorrow=new Date(now);
    tomorrow.setHours(24,0,0,0);
    return tomorrow;
  }
  if(time==='weekly'){
    const day=now.getDay();
    const daysUntilMonday=(8-day)%7 || 7;
    const nextMonday=new Date(now);
    nextMonday.setDate(now.getDate()+daysUntilMonday);
    nextMonday.setHours(0,0,0,0);
    return nextMonday;
  }
  return null;
}

function formatDuration(ms){
  if(ms<=0) return '00:00:00';
  const total=Math.floor(ms/1000);
  const h=Math.floor(total/3600);
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function updateLbTimer(){
  const timerEl=document.getElementById('lb-reset-timer');
  if(!timerEl) return;
  if(lbTime==='alltime'){
    timerEl.textContent='All time leaderboard does not reset.';
    return;
  }
  const next=getNextLbReset(lbTime);
  if(!next){
    timerEl.textContent='Next reset in —';
    return;
  }
  const remaining=next.getTime()-Date.now();
  const label=lbTime==='daily' ? 'Daily reset in' : 'Weekly reset in';
  timerEl.textContent=`${label} ${formatDuration(remaining)}`;
}

async function renderLB(){
  const data=await getLBData(lbMode,lbTime);
  const list=document.getElementById('lb-list');
  const yr=document.getElementById('lb-your-rank');
  updateLbTimer();
  if(!lbTimerInterval){
    lbTimerInterval=setInterval(updateLbTimer,1000);
  }
  list.innerHTML='';
  if(!data.length){list.innerHTML=`<div class="lb-empty">No ${MODES[lbMode]?.label||lbMode} scores yet. Be the first.</div>`;yr.style.display='none';return;}
  const medals=['🥇','🥈','🥉'];
  let myRank=-1;
  data.forEach((e,i)=>{
    if(currentUser&&e.user.toLowerCase()===currentUser.username.toLowerCase())myRank=i+1;
    const isMe=currentUser&&e.user.toLowerCase()===currentUser.username.toLowerCase();
    const d=document.createElement('div');
    let cls='lb-row';
    if(i===0)cls+=' gold-row';else if(i===1)cls+=' silver-row';else if(i===2)cls+=' bronze-row';
    if(isMe)cls+=' me';
    d.className=cls;
    d.innerHTML=`
      <div class="lb-rank" style="color:${i===0?'#ffd700':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--muted)'}">#${i+1}</div>
      <div class="lb-medal">${medals[i]||''}</div>
      <div class="lb-name">${e.user}${isMe?' <span style="font-size:11px;color:var(--accent);">(you)</span>':''}</div>
      <div class="lb-score">${e.score.toLocaleString()}</div>
      <div class="lb-acc">${e.acc}%</div>
      <div class="lb-grade" style="color:${gradeColor(e.grade)}">${e.grade}</div>
    `;
    list.appendChild(d);
  });
  if(myRank>0){
    yr.style.display='flex';
    document.getElementById('lb-yr-rank').textContent='#'+myRank;
    document.getElementById('lb-yr-name').textContent=currentUser.username;
    const me=data[myRank-1];
    document.getElementById('lb-yr-score').textContent='Score: '+me.score.toLocaleString()+' | Acc: '+me.acc+'%';
    document.getElementById('lb-yr-grade').textContent=me.grade;
    document.getElementById('lb-yr-grade').style.color=gradeColor(me.grade);
  } else yr.style.display='none';
}

function setLbMode(m,btn){
  lbMode=m||'trainer3d';
  document.querySelectorAll('.lbtab').forEach(b=>b.classList.remove('on'));
  btn?.classList.add('on');
  renderLB();
}
function setLbTime(t,btn){
  lbTime=t;
  document.querySelectorAll('.lttab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  renderLB();
  updateLbTimer();
}
