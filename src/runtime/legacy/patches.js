function showRenameConfirm(){
  const newUsername=document.getElementById('prof-edit-username').value.trim();
  const newAvatar=document.getElementById('prof-edit-avatar').value.trim();
  const usernameChanged=newUsername!==currentUser.username;
  const avatarChanged=newAvatar!==currentUser.customAvatar;
  if(!usernameChanged&&!avatarChanged&&!(document.getElementById('profile-image-preview')?.style.display==='block')){ toast('No changes made.'); return; }
  if(usernameChanged&&!isValidUsername(newUsername)){ toast('Invalid or inappropriate username.'); return; }
  const modal=document.createElement('div');
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
  modal.innerHTML=`<div style="background:var(--bg);border:2px solid var(--accent);border-radius:8px;padding:24px;max-width:400px;text-align:center;"><h2 style="color:var(--accent);margin:0 0 16px 0;font-family:Rajdhani;font-size:20px;">Confirm Changes</h2><div style="color:var(--text);margin-bottom:20px;font-size:14px;">${usernameChanged?`<div><strong>Username Change:</strong> 500 gems will be deducted</div>`:''}${avatarChanged?`<div><strong>Avatar:</strong> Will be updated to <strong>${newAvatar}</strong></div>`:''}</div><div style="display:flex;gap:12px;"><button class="fr-btn" data-action="modal-cancel" style="flex:1;">CANCEL</button><button class="fr-btn primary" data-action="modal-confirm" style="flex:1;">CONFIRM</button></div></div>`;
  modal.addEventListener('click', async (event)=>{ const action=event.target.closest('[data-action]')?.dataset.action; if(action==='modal-cancel'){ modal.remove(); } if(action==='modal-confirm'){ await applyProfileChanges(); modal.remove(); } });
  document.body.appendChild(modal);
}

async function viewFriendProfile(name){
  let user=getU(name); if(!user) user = await getUAsync(name); if(!user){toast('Player not found.');return;}
  const canSpectate = currentUser && (currentUser.spectateInvites||[]).some(inv=>inv.from.toLowerCase()===user.username.toLowerCase() && inv.accepted);
  const actionButton = canSpectate ? `<button class="fr-btn primary" data-action="spectate-friend" data-username="${user.username}">SPECTATE</button>` : `<button class="fr-btn primary" data-action="request-spectate" data-username="${user.username}">REQUEST SPECTATE</button>`;
  const rank=await getUserTopRanking(user.username); const trophy=rank?getTrophyEmoji(rank):''; const rankDisplay=rank?`<div style="color:var(--accent);font-size:14px;font-weight:700;">${trophy} #${rank} on Leaderboard</div>`:'';
  const cont=document.getElementById('friend-profile-content'); const trainerBest=user.modeBests?.trainer3d||null;
  const bests=trainerBest ? `<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid var(--border);"><span>${MODES.trainer3d.label}</span><span>${trainerBest.score.toLocaleString()}</span><span>${trainerBest.acc}%</span></div>` : '';
  cont.innerHTML=`<h2 style="font-family:'Orbitron',sans-serif;color:var(--accent);margin-bottom:12px;">${user.username}</h2>${rankDisplay}<div class="social-meta"><div><strong>Total Score</strong><div>${(user.totalScore||0).toLocaleString()}</div></div><div><strong>Games</strong><div>${user.gamesPlayed||0}</div></div><div><strong>Best Acc</strong><div>${(user.bestAcc||0)}%</div></div><div><strong>Best Streak</strong><div>${user.bestStreak||0}</div></div><div><strong>Avg. Reaction</strong><div>${user.avgReact?user.avgReact+'ms':'-'}</div></div><div><strong>Title</strong><div>${user.equippedTitle||'Recruit'}</div></div></div><div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap;">${actionButton}<button class="fr-btn secondary" data-action="close-friend-profile">CLOSE</button></div><div style="margin-top:20px;"><h3 style="font-family:'Orbitron',sans-serif;color:var(--accent);font-size:14px;margin-bottom:10px;">3D Aim Trainer Best</h3>${bests||'<div style="color:var(--muted);font-size:13px;">No best score recorded yet.</div>'}</div>`;
  document.getElementById('friend-profile-overlay').classList.add('act');
}

function renderFriends(){ if(!currentUser)return; const list=document.getElementById('friend-list');list.innerHTML=''; const friends=currentUser.friends||[]; if(!friends.length){list.innerHTML='<div class="lb-empty">Add friends to start comparing stats and spectating sessions.</div>';renderFriendRequests();renderSpectateRequests();return;} friends.forEach(name=>{ const div=document.createElement('div');div.className='friend-row'; div.innerHTML=`<div><div class="friend-name">${name}</div><div style="color:var(--muted);font-size:13px;">View profile and spectate options</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="fr-btn secondary" data-action="view-friend-profile" data-username="${name}">VIEW</button><button class="fr-btn primary" data-action="remove-friend" data-username="${name}">REMOVE</button></div>`; list.appendChild(div); }); renderFriendRequests(); renderSpectateRequests(); }
function renderSpectateRequests(){ if(!currentUser)return; const list=document.getElementById('spectate-request-list');list.innerHTML=''; const reqs=currentUser.pendingSpectate||[]; if(!reqs.length){list.innerHTML='<div class="lb-empty">No pending spectate requests.</div>';return;} reqs.forEach((req,idx)=>{ const row=document.createElement('div');row.className='friend-row'; row.innerHTML=`<div><div class="friend-name">${req.from}</div><div style="color:var(--muted);font-size:13px;">${req.from} wants to spectate your session</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="fr-btn primary" data-action="accept-spectate-request" data-request-index="${idx}">APPROVE</button><button class="fr-btn secondary" data-action="decline-spectate-request" data-request-index="${idx}">DECLINE</button></div>`; list.appendChild(row); }); }
function renderFriendRequests(){ if(!currentUser)return; const list=document.getElementById('friend-request-list');list.innerHTML=''; const reqs=currentUser.friendRequests||[]; if(!reqs.length){list.innerHTML='<div class="lb-empty">No friend requests right now.</div>';return;} reqs.forEach((req,idx)=>{ const row=document.createElement('div');row.className='friend-row'; row.innerHTML=`<div><div class="friend-name">${req.from}</div><div style="color:var(--muted);font-size:13px;">Sent you a friend request</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="fr-btn primary" data-action="accept-friend-request" data-request-index="${idx}">ACCEPT</button><button class="fr-btn secondary" data-action="decline-friend-request" data-request-index="${idx}">DECLINE</button></div>`; list.appendChild(row); }); }
async function renderDuels(){ const list=document.getElementById('duel-list');if(!list)return; let duels=null; const remoteDuels = await dbLoadDuels(); if(remoteDuels && remoteDuels.length){ duels = remoteDuels; const db=getDB();if(!db.duels)db.duels=[]; db.duels = duels; saveDB(db); } else { const db=getDB();duels=(db.duels||[]).slice(); } duels.sort((a,b)=>b.ts-a.ts); list.innerHTML=''; if(!duels.length){list.innerHTML='<div class="lb-empty">No duels yet. Create one to start competing.</div>';return;} duels.forEach(d=>{ const row=document.createElement('div');row.className='duel-row'; const top=`<div><div class="friend-name">${d.title}</div><div style="color:var(--muted);font-size:13px;">Mode: ${MODES[d.mode]?.label||d.mode} | Duration: ${d.duration}s | Host: ${d.host}</div></div>`; const invitedLabel=d.invited&&d.invited.length?`Invited: ${d.invited.join(', ')}`:'Invite only'; const invitedLower=(d.invited||[]).map(u=>u.toLowerCase()); const canJoin=currentUser && (d.host===currentUser.username || invitedLower.includes(currentUser.username.toLowerCase())); const joinBtn=canJoin?`<button class="fr-btn primary" data-action="join-duel" data-duel-id="${d.id}">JOIN</button>`:`<button class="fr-btn mb-poor" disabled>INVITE ONLY</button>`; const scoreList=(d.results||[]).slice(-3).map(r=>`${r.user}: ${r.score}`).join(' | '); row.innerHTML=`<div style="flex:1;min-width:220px;">${top}<div style="margin-top:8px;color:var(--muted);font-size:13px;">Players: ${d.players.length} | ${scoreList||'No results yet'}</div><div style="margin-top:8px;color:var(--muted);font-size:12px;">${invitedLabel}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;">${joinBtn}</div>`; list.appendChild(row); }); }
function renderGrid(gridId,catalog,ownedFn,equippedFn,buyFn,equipFn,previewFn,emptyText='Nothing here yet.'){
  const grid=document.getElementById(gridId);
  if(!grid)return;
  grid.innerHTML='';
  if(!catalog.length){
    grid.innerHTML=`<div class="lb-empty">${emptyText}</div>`;
    return;
  }
  catalog.forEach((item)=>{
    const owned=ownedFn(item);
    const equipped=equippedFn(item);
    const canBuy=!owned&&currentUser.gems>=item.price;
    const div=document.createElement('div');
    div.className='mkt-item'+(equipped?' eqpd':owned?' owned':'');
    const typeLabel=item.type==='premium'?'Premium':item.type==='special'?'Special':item.type==='custom'?'Custom':'Basic';
    const typeColor=item.type==='premium'||item.type==='custom'?'#a855f7':item.type==='special'?'#ff8c00':'#52527a';
    div.innerHTML=`${previewFn(item)}<h4>${item.name}</h4><div class="mkt-type" style="color:${typeColor}">${typeLabel}</div><div class="mkt-price">${item.price===0?'<span style="color:var(--green)">FREE</span>':item.price+' Gems'}</div>`;
    const btn=document.createElement('button');
    btn.className='mkt-btn';
    if(equipped){
      btn.className+=' mb-eqd';
      btn.textContent='EQUIPPED';
      btn.disabled=true;
    }else if(owned){
      btn.className+=' mb-equip';
      btn.textContent='EQUIP';
      btn.addEventListener('click',()=>{equipFn(item);renderCustomize();renderShop();});
    }else if((canBuy||item.price===0) && buyFn){
      btn.className+=' mb-buy';
      btn.textContent=item.price===0?'GET FREE':'BUY';
      btn.addEventListener('click',()=>{buyFn(item);renderCustomize();renderShop();});
    }else{
      btn.className+=' mb-poor';
      btn.textContent='NOT ENOUGH GEMS';
      btn.disabled=true;
    }
    div.appendChild(btn);
    grid.appendChild(div);
  });
}

function getQuestIcon(q){
  if(q?.icon) return q.icon;
  const iconByType={
    hits:'🎯',
    streak:'⚡',
    games:'🎮',
    score:'🏆',
    purchases:'💎',
    react250:'⚡',
    react200:'🏎',
    acc95:'🎯',
    join_duel:'⚔',
    accept_spectate:'👁',
    bg_neon:'🌃',
    win_duel:'🏆'
  };
  return iconByType[q?.type]||'🎯';
}

function renderQuests(){
  if(!currentUser)return;
  const grid=document.getElementById('qgrid');
  if(!grid)return;
  grid.innerHTML='';
  currentUser.quests.forEach(q=>{
    const pct=Math.min(100,Math.round(q.progress/q.goal*100));
    const done=q.progress>=q.goal;
    const div=document.createElement('div');
    div.className='qcard'+(q.claimed?' done':'');
    div.innerHTML=`<div class="qtop"><div class="qicon">${getQuestIcon(q)}</div><div class="qinfo"><h4>${q.title}</h4><p>${q.desc}</p></div><div class="qreward">${q.reward} Gems</div></div><div class="qbar"><div class="qfill" style="width:${pct}%"></div></div><div class="qlabel"><span>${q.progress}/${q.goal}</span><span>${pct}%</span></div>${q.claimed?'<div class="qclaimed">CLAIMED</div>':`<button class="qclaim" ${done?'':'disabled'} data-action="claim-quest" data-quest-id="${q.id}">${done?'CLAIM REWARD':'In Progress'}</button>`}`;
    grid.appendChild(div);
  });
}

function clampColorChannel(value){
  return Math.max(0, Math.min(255, Math.round(value)));
}

function transformHexColor(hex, amount){
  const raw=(hex||'').toString().trim();
  const normalized=raw.startsWith('#') ? raw.slice(1) : raw;
  if(!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(normalized)) return raw || '#ffffff';
  const full=normalized.length===3 ? normalized.split('').map(ch=>ch+ch).join('') : normalized;
  const value=parseInt(full,16);
  const r=clampColorChannel(((value>>16)&255)+amount);
  const g=clampColorChannel(((value>>8)&255)+amount);
  const b=clampColorChannel((value&255)+amount);
  return `#${[r,g,b].map(channel=>channel.toString(16).padStart(2,'0')).join('')}`;
}

function lc(hex, amount=35){
  return transformHexColor(hex, Math.abs(amount));
}

function dc(hex, amount=35){
  return transformHexColor(hex, -Math.abs(amount));
}

function getQuestIcon(q){
  const savedIcon=(q?.icon||'').trim();
  if(savedIcon && savedIcon!=='?' && savedIcon!=='??') return savedIcon;
  const iconByType={
    hits:'\u{1F3AF}',
    streak:'\u26A1',
    games:'\u{1F3AE}',
    score:'\u{1F3C6}',
    purchases:'\u{1F48E}',
    react250:'\u26A1',
    react200:'\u{1F3CE}',
    acc95:'\u{1F3AF}',
    join_duel:'\u2694',
    accept_spectate:'\u{1F441}',
    bg_neon:'\u{1F303}',
    win_duel:'\u{1F3C6}'
  };
  return iconByType[q?.type]||'\u{1F3AF}';
}
