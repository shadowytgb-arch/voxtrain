
async function createDuel(){
  if(!currentUser)return;
  const title=document.getElementById('duel-title-input').value.trim()||'Open Duel';
  const mode=document.getElementById('duel-mode-select').value;
  const duration=parseInt(document.getElementById('duel-period-input').value,10)||30;
  const inviteEl=document.getElementById('duel-invite-select');
  const invited=inviteEl?Array.from(inviteEl.selectedOptions).map(o=>o.value).filter(v=>v):[];
  const cleanInvited=[...new Set([currentUser.username,...invited])];
  const db=getDB();if(!db.duels)db.duels=[];
  const duel={id:'duel_'+Date.now(),title,mode,duration,host:currentUser.username,ts:Date.now(),status:'open',players:[currentUser.username],invited:cleanInvited,results:[]};
  db.duels.push(duel);
  saveDB(db);
  await dbSaveDuel(duel);
  await Promise.all(cleanInvited.filter(name=>name.toLowerCase()!==currentUser.username.toLowerCase()).map(name=>
    notifyUser(name,{type:'duel_invite',from:currentUser.username,message:`${currentUser.username} invited you to a duel: ${title}`,seen:false})
  ));
  await renderDuels();
  toast('Duel created. Invited players have been notified.');
}

async function renderDuels(){
  const list=document.getElementById('duel-list');if(!list)return;
  let duels=null;
  const remoteDuels = await dbLoadDuels();
  if(remoteDuels && remoteDuels.length){
    duels = remoteDuels;
    const db=getDB();if(!db.duels)db.duels=[];
    db.duels = duels;
    saveDB(db);
  } else {
    const db=getDB();duels=(db.duels||[]).slice();
  }
  duels.sort((a,b)=>b.ts-a.ts);
  list.innerHTML='';
  if(!duels.length){list.innerHTML='<div class="lb-empty">No duels yet. Create one to start competing.</div>';return;}
  duels.forEach(d=>{
    const row=document.createElement('div');row.className='duel-row';
    const top=`<div><div class="friend-name">${d.title}</div><div style="color:var(--muted);font-size:13px;">Mode: ${MODES[d.mode]?.label||d.mode} • Duration: ${d.duration}s • Host: ${d.host}</div></div>`;
    const invitedLabel=d.invited&&d.invited.length?`Invited: ${d.invited.join(', ')}`:'Invite only';
    const invitedLower=(d.invited||[]).map(u=>u.toLowerCase());
    const canJoin=currentUser && (d.host===currentUser.username || invitedLower.includes(currentUser.username.toLowerCase()));
    const joinBtn=canJoin?`<button class="fr-btn primary" data-legacy-click="joinDuel('${d.id}')">JOIN</button>`:`<button class="fr-btn mb-poor" disabled>INVITE ONLY</button>`;
    const scoreList=(d.results||[]).slice(-3).map(r=>`${r.user}: ${r.score}`).join(' | ');
    row.innerHTML=`<div style="flex:1;min-width:220px;">${top}<div style="margin-top:8px;color:var(--muted);font-size:13px;">Players: ${d.players.length} • ${scoreList||'No results yet'}</div><div style="margin-top:8px;color:var(--muted);font-size:12px;">${invitedLabel}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;">${joinBtn}</div>`;
    list.appendChild(row);
  });
}

function joinDuel(id){
  if(!currentUser)return;
  const db=getDB();const duel=(db.duels||[]).find(x=>x.id===id);
  if(!duel){toast('Duel not found.');return;}
  if(duel.status!=='open'){toast('Duel is closed.');return;}
  const invitedLower=(duel.invited||[]).map(u=>u.toLowerCase());
  if(duel.host!==currentUser.username && !invitedLower.includes(currentUser.username.toLowerCase())){toast('You are not invited to this duel.');return;}
  if(!duel.players.includes(currentUser.username))duel.players.push(currentUser.username);
  saveDB(db);dbSaveDuel(duel);
  renderDuels();
  currentDuelId=id;currentDuelTitle=duel.title;
  toast(`Joined duel "${duel.title}".`);
  startMode(duel.mode,{duration:duel.duration});
}

function updateDuelResult(score,acc){
  if(!currentUser||!currentDuelId)return;
  const db=getDB();const duel=(db.duels||[]).find(x=>x.id===currentDuelId);
  if(!duel)return;
  duel.results=duel.results||[];
  duel.results.push({user:currentUser.username,score,acc,ts:Date.now()});
  if(!duel.players.includes(currentUser.username))duel.players.push(currentUser.username);
  if(duel.results.length>=duel.players.length)duel.status='closed';
  saveDB(db);
  dbSaveDuel(duel);
  const bestScore=Math.max(...duel.results.map(r=>r.score));
  if(score===bestScore)qprog('win_duel',1);
  qprog('join_duel',1);
  currentDuelId=null;
}

function legacyNewUser(un,pw){
  return newUser(un,'password');
}
