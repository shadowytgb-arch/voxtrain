
async function sendSpectateRequest(targetName){
  if(!currentUser)return;
  const target = await getUAsync(targetName);
  if(!target){toast('Player not found.');return;}
  const user=await writeUser(target.username,u=>{
    u.pendingSpectate=u.pendingSpectate||[];
    if(u.pendingSpectate.some(r=>r.from.toLowerCase()===currentUser.username.toLowerCase()))return;
    u.pendingSpectate.push({from:currentUser.username,ts:Date.now()});
    u.notifications=u.notifications||[];
    u.notifications.push({type:'spectate_request',from:currentUser.username,message:`${currentUser.username} wants to spectate your session`,seen:false});
  });
  if(!user){toast('Player not found.');return;}
  toast(`Spectate request sent to ${user.username}.`);
}

async function acceptSpectateRequest(idx){
  const req=currentUser.pendingSpectate[idx];
  if(!req)return;
  await writeUser(req.from,u=>{
    u.spectateInvites=u.spectateInvites||[];
    u.spectateInvites.push({from:currentUser.username,ts:Date.now(),accepted:true});
  });
  currentUser.pendingSpectate.splice(idx,1);saveU();renderSpectateRequests();toast(`Approved ${req.from}'s spectate request.`);
  qprog('accept_spectate',1);
}

function declineSpectateRequest(idx){
  const req=currentUser.pendingSpectate[idx];
  if(!req)return;
  currentUser.pendingSpectate.splice(idx,1);saveU();renderSpectateRequests();toast(`Declined ${req.from}'s spectate request.`);
}

function checkSpectateInvites(){
  if(!currentUser)return;
  const invites=currentUser.spectateInvites||[];
  const newInvites = invites.filter(inv=>inv.accepted && !inv.notified);
  if(!newInvites.length)return;
  newInvites.forEach((invite,i)=>{
    setTimeout(()=>toast(`${invite.from} approved your spectate request. Open their profile to watch live.`), i*1200);
    invite.notified = true;
  });
  saveU();
}

async function spectateUser(host){
  if(!currentUser) return;
  spectateHost = host;
  document.getElementById('spectate-title').textContent = `Spectating ${host}`;
  document.getElementById('spectate-status').textContent = 'Connecting...';
  document.getElementById('spectate-overlay').classList.add('act');
  resizeSpectateCanvas();
  await pollSpectateState();
  if(spectatePollTimer) clearInterval(spectatePollTimer);
  spectatePollTimer = setInterval(pollSpectateState, 1200);
}

function stopSpectating(){
  if(spectatePollTimer){clearInterval(spectatePollTimer);spectatePollTimer=null;}
  spectateHost=null;
  document.getElementById('spectate-overlay').classList.remove('act');
}

async function pollSpectateState(){
  if(!spectateHost) return;
  const hostUser = await dbLoadUserByUsername(spectateHost);
  if(!hostUser || !hostUser.spectateSession){
    document.getElementById('spectate-status').textContent = 'No live session is available.';
    return;
  }
  const state = hostUser.spectateSession;
  const isLive = state.gameRunning;
  document.getElementById('spectate-status').textContent = isLive
    ? `Live: ${MODES[state.gameMode]?.label||state.gameMode} • Score ${state.score} • ${state.gameTimer}s left`
    : 'This player is not currently in a live session.';
  drawSpectateState(state);
}

function resizeSpectateCanvas(){
  const cv=document.getElementById('spectate-canvas');
  if(!cv) return;
  cv.width=cv.offsetWidth;
  cv.height=420;
}

function drawSpectateState(state){
  const cv=document.getElementById('spectate-canvas');
  if(!cv) return;
  const ctx=cv.getContext('2d');
  const w=cv.width; const h=cv.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#070712'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,0.06)';
  const step=40;
  for(let x=0;x<w;x+=step){ctx.fillRect(x,0,1,h);} for(let y=0;y<h;y+=step){ctx.fillRect(0,y,w,1);}
  const scaleX = state.canvasWidth ? w/state.canvasWidth : 1;
  const scaleY = state.canvasHeight ? h/state.canvasHeight : 1;
  (state.targets||[]).forEach(t=>{
    drawSpectateBall(ctx, t.x*scaleX, t.y*scaleY, t.r*scaleX);
  });
  drawCrosshairAt(ctx, w/2, h/2, state.crosshair || {type:'cross',size:16,thick:3,gap:6,color:'#00e5ff',outline:1});
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(12,12,280,78);
  ctx.fillStyle='#fff'; ctx.font='bold 14px Rajdhani'; ctx.fillText(`${state.host} • ${MODES[state.gameMode]?.label||state.gameMode}`,18,34);
  ctx.font='12px Rajdhani'; ctx.fillStyle='#acd6ff';
  ctx.fillText(`Score: ${state.score||0}`,18,52);
  ctx.fillText(`Hits: ${state.hits||0}  Misses: ${state.misses||0}`,18,68);
  ctx.fillText(`Streak: ${state.streak||0}  Time: ${state.gameTimer||0}s`,18,84);
}

function drawSpectateBall(c,x,y,r){
  c.save();
  c.fillStyle='rgba(0,229,255,0.9)';
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
  c.strokeStyle='rgba(255,255,255,0.8)';c.lineWidth=2; c.stroke();
  c.restore();
}
