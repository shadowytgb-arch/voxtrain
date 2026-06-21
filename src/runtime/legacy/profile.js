// ═══════════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════════
function toggleCB(){
  colorblindMode=document.getElementById('cb-mode').checked;
  currentUser.colorblind=colorblindMode;saveU();
  toast(colorblindMode?'Colorblind mode ON':'Colorblind mode OFF');
}

function refreshProfile(){
  if(!currentUser)return;
  const lvlNames=['Recruit','Private','Corporal','Sergeant','Lieutenant','Captain','Major','Colonel','General','Legend'];
  const lvl=getLevelProgress(currentUser.xp||0).level;
  const title=currentUser.equippedTitle||lvlNames[Math.min(lvl-1,9)];
  const avatar=currentUser.customAvatar||'🎯';
  // Display profile image or emoji avatar
  const profAvatar=document.getElementById('prof-avatar');
  if(currentUser.profileImage){
    profAvatar.innerHTML=`<img src="${currentUser.profileImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  }else{
    profAvatar.textContent=avatar;
  }
  document.getElementById('prf-name').textContent=currentUser.username;
  document.getElementById('prf-title').textContent=title;
  
  // Fetch and display trophy if user has top 3 ranking
  (async()=>{
    const rank=await getUserTopRanking(currentUser.username);
    const trophyEl=document.getElementById('prof-trophy');
    if(rank){
      const trophy=getTrophyEmoji(rank);
      trophyEl.innerHTML=`${trophy} #${rank} on Leaderboard`;
    }else{
      trophyEl.innerHTML='';
    }
  })();
  
  document.getElementById('prf-score').textContent=(currentUser.totalScore||0).toLocaleString();
  document.getElementById('prf-games').textContent=currentUser.gamesPlayed||0;
  document.getElementById('prf-acc').textContent=(currentUser.bestAcc||0)+'%';
  document.getElementById('prf-hits').textContent=(currentUser.totalHits||0).toLocaleString();
  document.getElementById('prf-streak').textContent=currentUser.bestStreak||0;
  document.getElementById('prf-react').textContent=currentUser.avgReact?currentUser.avgReact+'ms':'—';
  // Ensure edit mode is hidden and view mode is shown
  document.getElementById('prof-edit-mode').style.display='none';
  document.getElementById('prof-view-mode').style.display='block';
  const mb=document.getElementById('mode-bests');mb.innerHTML='';
  Object.keys(currentUser.modeBests||{}).forEach(m=>{
    const b=currentUser.modeBests[m];
    const d=document.createElement('div');d.style.cssText='display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid var(--border);';
    d.innerHTML=`<span style="color:var(--muted)">${MODES[m]?.label||m}</span><span style="color:var(--accent);font-weight:700">${b.score.toLocaleString()}</span><span style="color:var(--muted)">${b.acc}%</span>`;
    mb.appendChild(d);
  });
  if(!Object.keys(currentUser.modeBests||{}).length)mb.innerHTML='<div style="color:var(--muted);font-size:13px;">Play some games to see your bests!</div>';
  if(currentUser.crosshair)ch=Object.assign({},currentUser.crosshair);
  syncCrosshairControls();
  drawHistoryGraph();
}

function drawHistoryGraph(){
  const cv=document.getElementById('history-canvas');if(!cv)return;
  const hist=(currentUser.history||[]).slice(-20);
  cv.width=cv.offsetWidth||800;cv.height=160;
  const c=cv.getContext('2d');
  c.clearRect(0,0,cv.width,cv.height);
  if(hist.length<2){c.fillStyle='#52527a';c.font='14px Rajdhani';c.textAlign='center';c.fillText('Play at least 2 games to see your history',cv.width/2,80);return;}
  const accs=hist.map(h=>h.acc);
  const maxA=100,minA=Math.max(0,Math.min(...accs)-10);
  const pw=cv.width,ph=cv.height;
  const pad=24;
  c.strokeStyle='rgba(255,255,255,0.05)';c.lineWidth=1;
  for(let i=0;i<=4;i++){const y=pad+((ph-pad*2)/4)*i;c.beginPath();c.moveTo(pad,y);c.lineTo(pw-pad,y);c.stroke();}
  const pts=hist.map((h,i)=>({x:pad+(i/(hist.length-1))*(pw-pad*2),y:pad+(ph-pad*2)*(1-(h.acc-minA)/(maxA-minA))}));
  c.beginPath();c.moveTo(pts[0].x,ph-pad);
  pts.forEach(p=>c.lineTo(p.x,p.y));
  c.lineTo(pts[pts.length-1].x,ph-pad);c.closePath();
  const g=c.createLinearGradient(0,pad,0,ph);g.addColorStop(0,'rgba(0,229,255,0.25)');g.addColorStop(1,'rgba(0,229,255,0)');
  c.fillStyle=g;c.fill();
  c.strokeStyle='#00e5ff';c.lineWidth=2;c.lineJoin='round';
  c.beginPath();pts.forEach((p,i)=>i===0?c.moveTo(p.x,p.y):c.lineTo(p.x,p.y));c.stroke();
  pts.forEach(p=>{c.fillStyle='#00e5ff';c.beginPath();c.arc(p.x,p.y,3,0,Math.PI*2);c.fill();});
  c.fillStyle='rgba(90,90,122,0.9)';c.font='11px Rajdhani';c.textAlign='right';
  c.fillText('100%',pad-2,pad+4);c.fillText(Math.round(minA)+'%',pad-2,ph-pad+4);
}
