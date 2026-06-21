// Extended stats charts for Progress + Profile
function drawProgressCharts(){
  if(!currentUser) return;
  drawScoreTrendChart();
  drawReactionTrendChart();
  drawModeBreakdownChart();
}

function drawScoreTrendChart(){
  const cv=document.getElementById('prog-score-chart');
  if(!cv) return;
  const hist=(currentUser.history||[]).slice(-30);
  cv.width=cv.offsetWidth||600; cv.height=140;
  const c=cv.getContext('2d');
  c.clearRect(0,0,cv.width,cv.height);
  if(hist.length<2){
    drawEmptyChart(c,cv,'Play more games to see score trends');
    return;
  }
  const scores=hist.map(h=>h.score);
  const maxS=Math.max(...scores,1);
  const minS=Math.min(...scores);
  const pad=28;
  const pw=cv.width, ph=cv.height;
  c.strokeStyle='rgba(255,255,255,0.06)'; c.lineWidth=1;
  for(let i=0;i<=4;i++){
    const y=pad+((ph-pad*2)/4)*i;
    c.beginPath(); c.moveTo(pad,y); c.lineTo(pw-pad,y); c.stroke();
  }
  const pts=hist.map((h,i)=>({
    x:pad+(i/(hist.length-1))*(pw-pad*2),
    y:pad+(ph-pad*2)*(1-(h.score-minS)/Math.max(1,maxS-minS))
  }));
  c.strokeStyle='#ffd84d'; c.lineWidth=2; c.lineJoin='round';
  c.beginPath(); pts.forEach((p,i)=>i===0?c.moveTo(p.x,p.y):c.lineTo(p.x,p.y)); c.stroke();
  c.fillStyle='#aaa'; c.font='11px Rajdhani';
  c.fillText('Score trend (last 30)', pad, 14);
}

function drawReactionTrendChart(){
  const cv=document.getElementById('prog-react-chart');
  if(!cv) return;
  const hist=(currentUser.history||[]).filter(h=>h.react).slice(-30);
  cv.width=cv.offsetWidth||600; cv.height=140;
  const c=cv.getContext('2d');
  c.clearRect(0,0,cv.width,cv.height);
  if(hist.length<2){
    drawEmptyChart(c,cv,'Reaction data appears after timed hits');
    return;
  }
  const reacts=hist.map(h=>h.react);
  const maxR=Math.max(...reacts,300);
  const minR=Math.max(80,Math.min(...reacts)-20);
  const pad=28;
  const pw=cv.width, ph=cv.height;
  const pts=hist.map((h,i)=>({
    x:pad+(i/(hist.length-1))*(pw-pad*2),
    y:pad+(ph-pad*2)*((h.react-minR)/(maxR-minR))
  }));
  c.strokeStyle='#ff6fa8'; c.lineWidth=2;
  c.beginPath(); pts.forEach((p,i)=>i===0?c.moveTo(p.x,p.y):c.lineTo(p.x,p.y)); c.stroke();
  c.fillStyle='#aaa'; c.font='11px Rajdhani';
  c.fillText('Avg reaction ms (lower is better)', pad, 14);
}

function drawModeBreakdownChart(){
  const cv=document.getElementById('prog-mode-chart');
  if(!cv) return;
  const hist=currentUser.history||[];
  cv.width=cv.offsetWidth||600; cv.height=120;
  const c=cv.getContext('2d');
  c.clearRect(0,0,cv.width,cv.height);
  const counts={};
  hist.forEach(h=>{ counts[h.mode]=(counts[h.mode]||0)+1; });
  const entries=Object.entries(counts);
  if(!entries.length){
    drawEmptyChart(c,cv,'Mode breakdown appears after you play');
    return;
  }
  const total=entries.reduce((a,[,v])=>a+v,0);
  let x=12;
  const colors=['#00e5ff','#00ff88','#ffd84d','#ff6fa8','#aa44ff','#ff8833'];
  entries.forEach(([mode,count],i)=>{
    const w=Math.max(24,((cv.width-24)/total)*count);
    c.fillStyle=colors[i%colors.length];
    c.fillRect(x,30,w,50);
    c.fillStyle='#ccc'; c.font='10px Rajdhani';
    c.fillText((MODES[mode]?.label||mode).slice(0,8), x+4, 92);
    x+=w+4;
  });
  c.fillStyle='#aaa'; c.font='11px Rajdhani';
  c.fillText('Games per mode', 12, 14);
}

function drawEmptyChart(ctx,cv,text){
  ctx.fillStyle='#52527a';
  ctx.font='13px Rajdhani';
  ctx.textAlign='center';
  ctx.fillText(text,cv.width/2,cv.height/2);
  ctx.textAlign='left';
}

function drawOffsetHeatmap(){
  const hc=document.getElementById('res-offset-heatmap');
  if(!hc) return;
  hc.width=hc.offsetWidth||380; hc.height=120;
  const hctx=hc.getContext('2d');
  hctx.fillStyle='#0e0e1a'; hctx.fillRect(0,0,hc.width,hc.height);
  const points=clickEvents.filter(ev=>ev.ox!=null);
  if(!points.length){
    hctx.fillStyle='#70709a'; hctx.font='12px Rajdhani';
    hctx.fillText('Offset data builds as you shoot.',12,hc.height/2);
    return;
  }
  const cx=hc.width/2, cy=hc.height/2;
  hctx.strokeStyle='rgba(255,255,255,0.1)'; hctx.lineWidth=1;
  hctx.beginPath(); hctx.moveTo(cx,8); hctx.lineTo(cx,hc.height); hctx.stroke();
  hctx.beginPath(); hctx.moveTo(8,cy); hctx.lineTo(hc.width,cy); hctx.stroke();
  const scale=Math.min(hc.width,hc.height)/400;
  points.forEach(ev=>{
    hctx.fillStyle=ev.hit?'rgba(0,255,136,0.75)':'rgba(255,45,110,0.55)';
    hctx.beginPath();
    hctx.arc(cx+ev.ox*scale, cy+ev.oy*scale, ev.hit?4:3, 0, Math.PI*2);
    hctx.fill();
  });
  hctx.fillStyle='#aaa'; hctx.font='11px Rajdhani';
  hctx.fillText('Aim offset from center (px)', 8, 14);
}

function renderSessionCompare(comp){
  const el=document.getElementById('res-compare');
  if(!el) return;
  if(!comp){
    el.textContent='First session in this mode — baseline recorded.';
    return;
  }
  const scoreSign=comp.scoreDelta>=0?'+':'';
  const accSign=comp.accDelta>=0?'+':'';
  el.textContent=`vs last ${MODES[gameMode]?.label||gameMode}: Score ${scoreSign}${comp.scoreDelta} | Acc ${accSign}${comp.accDelta}%`;
}
