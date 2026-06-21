
function writeUser(un,mutate){
  return updateUserRecord(un, mutate);
}

async function notifyUser(username, notification){
  return writeUser(username,u=>{
    u.notifications=u.notifications||[];
    u.notifications.push(Object.assign({seen:false,ts:Date.now()}, notification));
  });
}

function flushNotifications(){
  if(!currentUser||!currentUser.notifications) return;
  const unseen=currentUser.notifications.filter(n=>!n.seen);
  if(!unseen.length) return;
  unseen.forEach((note,i)=>{
    setTimeout(()=>toast(note.message,3200), i*1400);
  });
  currentUser.notifications.forEach(n=>{if(!n.seen)n.seen=true;});
  saveU();
}

async function addFriend(){
  const name=document.getElementById('friend-add-input').value.trim();
  if(!name){toast('Enter a username.');return;}
  if(!currentUser||name.toLowerCase()===currentUser.username.toLowerCase()){toast('You cannot add yourself.');return;}
  const target=await getUAsync(name);
  if(!target){toast('Player not found.');return;}
  if((currentUser.friends||[]).some(u=>u.toLowerCase()===target.username.toLowerCase())){toast('You are already friends.');return;}
  if((target.friendRequests||[]).some(r=>r.from.toLowerCase()===currentUser.username.toLowerCase())){toast('Request already sent.');return;}
  if((currentUser.friendRequests||[]).some(r=>r.from.toLowerCase()===target.username.toLowerCase())){
    const idx=currentUser.friendRequests.findIndex(r=>r.from.toLowerCase()===target.username.toLowerCase());
    if(idx>=0){await acceptFriendRequest(idx);return;}
  }
  await writeUser(target.username,u=>{
    u.friendRequests=u.friendRequests||[];
    if(u.friendRequests.some(r=>r.from.toLowerCase()===currentUser.username.toLowerCase())) return;
    u.friendRequests.push({from:currentUser.username,ts:Date.now()});
    u.notifications=u.notifications||[];
    u.notifications.push({type:'friend_request',from:currentUser.username,message:`${currentUser.username} sent you a friend request`,seen:false});
  });
  toast(`Friend request sent to ${target.username}.`);
}

async function removeFriend(name){
  if(!currentUser)return;
  const canonical=await resolveCanonicalUsername(name);
  currentUser.friends=(currentUser.friends||[]).filter(u=>dbUserKey(u)!==dbUserKey(name)&&dbUserKey(u)!==dbUserKey(canonical));
  saveU();
  if(canonical){
    await writeUser(canonical,u=>{
      u.friends=(u.friends||[]).filter(friend=>dbUserKey(friend)!==dbUserKey(currentUser.username)&&dbUserKey(friend)!==dbUserKey(name));
    });
  }
  renderFriends();
  toast(`Removed ${name} from friends.`);
}

async function viewFriendProfile(name){
  let user=getU(name);
  if(!user){
    user = await getUAsync(name);
  }
  if(!user){toast('Player not found.');return;}
  const canSpectate = currentUser && (currentUser.spectateInvites||[]).some(inv=>inv.from.toLowerCase()===user.username.toLowerCase() && inv.accepted);
  const actionButton = canSpectate
    ? `<button class="fr-btn primary" data-legacy-click="closeFriendProfile();spectateUser('${user.username}')">SPECTATE</button>`
    : `<button class="fr-btn primary" data-legacy-click="sendSpectateRequest('${user.username}')">REQUEST SPECTATE</button>`;
  
  // Get user's ranking
  const rank=await getUserTopRanking(user.username);
  const trophy=rank?getTrophyEmoji(rank):'';
  const rankDisplay=rank?`<div style="color:var(--accent);font-size:14px;font-weight:700;">${trophy} #${rank} on Leaderboard</div>`:'';
  
  const cont=document.getElementById('friend-profile-content');
  const trainerBest=user.modeBests?.trainer3d||null;
  const bests=trainerBest
    ? `<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid var(--border);"><span>${MODES.trainer3d.label}</span><span>${trainerBest.score.toLocaleString()}</span><span>${trainerBest.acc}%</span></div>`
    : '';
  cont.innerHTML=`
    <h2 style="font-family:'Orbitron',sans-serif;color:var(--accent);margin-bottom:12px;">${user.username}</h2>
    ${rankDisplay}
    <div class="social-meta">
      <div><strong>Total Score</strong><div>${(user.totalScore||0).toLocaleString()}</div></div>
      <div><strong>Games</strong><div>${user.gamesPlayed||0}</div></div>
      <div><strong>Best Acc</strong><div>${(user.bestAcc||0)}%</div></div>
      <div><strong>Best Streak</strong><div>${user.bestStreak||0}</div></div>
      <div><strong>Avg. Reaction</strong><div>${user.avgReact?user.avgReact+'ms':'—'}</div></div>
      <div><strong>Title</strong><div>${user.equippedTitle||'Recruit'}</div></div>
    </div>
    <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap;">
      ${actionButton}
      <button class="fr-btn secondary" data-legacy-click="closeFriendProfile()">CLOSE</button>
    </div>
    <div style="margin-top:20px;"><h3 style="font-family:'Orbitron',sans-serif;color:var(--accent);font-size:14px;margin-bottom:10px;">3D Aim Trainer Best</h3>${bests||'<div style="color:var(--muted);font-size:13px;">No best score recorded yet.</div>'}</div>
  `;
  document.getElementById('friend-profile-overlay').classList.add('act');
}

function closeFriendProfile(){document.getElementById('friend-profile-overlay').classList.remove('act');}

function renderFriends(){
  if(!currentUser)return;
  const list=document.getElementById('friend-list');list.innerHTML='';
  const friends=currentUser.friends||[];
  if(!friends.length){list.innerHTML='<div class="lb-empty">Add friends to start comparing stats and spectating sessions.</div>';renderFriendRequests();renderSpectateRequests();return;}
  friends.forEach(name=>{
    const div=document.createElement('div');div.className='friend-row';
    div.innerHTML=`<div><div class="friend-name">${name}</div><div style="color:var(--muted);font-size:13px;">View profile and spectate options</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="fr-btn secondary" data-legacy-click="viewFriendProfile('${name}')">VIEW</button><button class="fr-btn primary" data-legacy-click="removeFriend('${name}')">REMOVE</button></div>`;
    list.appendChild(div);
  });
  renderFriendRequests();
  renderSpectateRequests();
}

function renderSpectateRequests(){
  if(!currentUser)return;
  const list=document.getElementById('spectate-request-list');list.innerHTML='';
  const reqs=currentUser.pendingSpectate||[];
  if(!reqs.length){list.innerHTML='<div class="lb-empty">No pending spectate requests.</div>';return;}
  reqs.forEach((req,idx)=>{
    const row=document.createElement('div');row.className='friend-row';
    row.innerHTML=`<div><div class="friend-name">${req.from}</div><div style="color:var(--muted);font-size:13px;">${req.from} wants to spectate your session</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="fr-btn primary" data-legacy-click="acceptSpectateRequest(${idx})">APPROVE</button><button class="fr-btn secondary" data-legacy-click="declineSpectateRequest(${idx})">DECLINE</button></div>`;
    list.appendChild(row);
  });
}

function renderFriendRequests(){
  if(!currentUser)return;
  const list=document.getElementById('friend-request-list');list.innerHTML='';
  const reqs=currentUser.friendRequests||[];
  if(!reqs.length){list.innerHTML='<div class="lb-empty">No friend requests right now.</div>';return;}
  reqs.forEach((req,idx)=>{
    const row=document.createElement('div');row.className='friend-row';
    row.innerHTML=`<div><div class="friend-name">${req.from}</div><div style="color:var(--muted);font-size:13px;">Sent you a friend request</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="fr-btn primary" data-legacy-click="acceptFriendRequest(${idx})">ACCEPT</button><button class="fr-btn secondary" data-legacy-click="declineFriendRequest(${idx})">DECLINE</button></div>`;
    list.appendChild(row);
  });
}

async function acceptFriendRequest(idx){
  const req=currentUser.friendRequests[idx];
  if(!req)return;
  currentUser.friendRequests.splice(idx,1);
  currentUser.friends=currentUser.friends||[];
  if(!currentUser.friends.includes(req.from))currentUser.friends.push(req.from);
  saveU();
  await writeUser(req.from,u=>{
    u.friends=u.friends||[];
    if(!u.friends.includes(currentUser.username))u.friends.push(currentUser.username);
    u.notifications=u.notifications||[];
    u.notifications.push({type:'friend_accept',from:currentUser.username,message:`${currentUser.username} accepted your friend request`,seen:false});
  });
  renderFriendRequests();
  renderFriends();
  toast(`You are now friends with ${req.from}.`);
}

function declineFriendRequest(idx){
  const req=currentUser.friendRequests[idx];
  if(!req)return;
  currentUser.friendRequests.splice(idx,1);
  saveU();
  renderFriendRequests();
  toast(`Declined friend request from ${req.from}.`);
}

function populateDuelInvites(){
  const select=document.getElementById('duel-invite-select');
  if(!select||!currentUser) return;
  select.innerHTML='';
  (currentUser.friends||[]).forEach(name=>{
    const opt=document.createElement('option');opt.value=name;opt.textContent=name;select.appendChild(opt);
  });
}
