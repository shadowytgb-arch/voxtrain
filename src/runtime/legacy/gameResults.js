function endGame(){
  stopGame();
  const tot=hits+misses;
  const acc=tot?Math.round(hits/tot*100):0;
  const reactStats=window.trainerEngine?window.trainerEngine.computeReactionStats(reactTimes):{avg:reactTimes.length?Math.round(reactTimes.reduce((a,b)=>a+b,0)/reactTimes.length):null};
  const avgRT=reactStats.avg;
  const grade=calcGrade(acc,score);
  const gemsEarned=Math.floor(score/80)+Math.floor(hits/4);
  const xpEarned=Math.floor(score/50)+hits*2;
  const compare=window.trainerEngine?window.trainerEngine.compareToPrevious(currentUser?.history,gameMode,score,acc):null;

  document.getElementById('res-grade').textContent=grade;
  document.getElementById('res-grade').style.color=gradeColor(grade);
  document.getElementById('rs-score').textContent=score.toLocaleString();
  document.getElementById('rs-acc').textContent=acc+'%';
  document.getElementById('rs-hits').textContent=hits;
  document.getElementById('rs-streak').textContent=bestStreak;
  document.getElementById('rs-react').textContent=avgRT?avgRT+'ms':'—';
  document.getElementById('rs-mode').textContent=MODES[gameMode].label;
  const ttkEl=document.getElementById('rs-ttk');
  const stdEl=document.getElementById('rs-std');
  if(ttkEl) ttkEl.textContent=avgRT?avgRT+'ms':'—';
  if(stdEl) stdEl.textContent=reactStats.stdDev!=null?reactStats.stdDev+'ms':'—';
  document.getElementById('gems-row').textContent=`+${gemsEarned} Gems | +${xpEarned} XP`;
  drawHeatmap();
  drawOffsetHeatmap?.();
  renderSessionCompare?.(compare);

  currentUser.gems+=gemsEarned;
  currentUser.xp=(currentUser.xp||0)+xpEarned;
  currentUser.totalScore+=score;
  currentUser.gamesPlayed++;
  currentUser.bestAcc=Math.max(currentUser.bestAcc||0,acc);
  currentUser.totalHits=(currentUser.totalHits||0)+hits;
  currentUser.bestStreak=Math.max(currentUser.bestStreak||0,bestStreak);
  if(avgRT){
    const all=currentUser.reactAttempts||[];all.push(avgRT);
    currentUser.reactAttempts=all;
    currentUser.avgReact=Math.round(all.reduce((a,b)=>a+b,0)/all.length);
  }
  currentUser.history=currentUser.history||[];
  currentUser.history.push({mode:gameMode,score,acc,hits,streak:bestStreak,react:avgRT,reactStd:reactStats.stdDev,ts:Date.now()});
  if(currentUser.history.length>50)currentUser.history=currentUser.history.slice(-50);
  currentUser.modeBests=currentUser.modeBests||{};
  if(!currentUser.modeBests[gameMode]||score>currentUser.modeBests[gameMode].score){
    currentUser.modeBests[gameMode]={score,acc,streak:bestStreak};
  }
  saveLBEntry(gameMode,score,acc,grade);
  if(currentDuelId)updateDuelResult(score,acc);
  qprog('hits',hits);qprog('streak',bestStreak);qprog('games',1);qprog('score',score,true);
  if(acc>=95)qprog('acc95',1);
  if(avgRT&&avgRT<250)qprog('react250',1);
  if(avgRT&&avgRT<200)qprog('react200',1);

  checkDailyAfterGame?.(gameMode,{score,acc,hits,streak:bestStreak,react:avgRT});

  saveU();updateNav();
  document.getElementById('results-overlay').classList.add('act');
}

function calcGrade(acc,score){
  const s=score+acc*10;
  if(s>=2000)return'S+';if(s>=1500)return'S';if(s>=1000)return'A';
  if(s>=600)return'B';if(s>=300)return'C';if(s>=100)return'D';return'F';
}
function gradeColor(g){
  const m={S:'#ffd700','S+':'#ff8c00',A:'#00ff88',B:'#00e5ff',C:'#aa44ff',D:'#ff8833',F:'#ff2d6e'};
  return m[g]||'#fff';
}

function drawHeatmap(){
  const hc=document.getElementById('res-heatmap');
  const title=document.getElementById('res-heatmap-title');
  hc.width=hc.offsetWidth||380;hc.height=120;
  const hctx=hc.getContext('2d');
  hctx.fillStyle='#0e0e1a';hctx.fillRect(0,0,hc.width,hc.height);
  if(title)title.textContent='Target Position Map';
  const sourceW=Math.max(1,canvas.width||hc.width);
  const sourceH=Math.max(1,canvas.height||hc.height);
  const points=clickEvents.map(ev=>({x:ev.x,y:ev.y,hit:ev.hit}));
  let mapPoint=(x,y)=>({x:(x/sourceW)*hc.width,y:(y/sourceH)*hc.height});
  if(points.length>=2){
    let maxDistSq=0;
    let a=points[0];
    let b=points[1];
    for(let i=0;i<points.length;i++){
      for(let j=i+1;j<points.length;j++){
        const dx=points[i].x-points[j].x;
        const dy=points[i].y-points[j].y;
        const distSq=dx*dx+dy*dy;
        if(distSq>maxDistSq){
          maxDistSq=distSq;
          a=points[i];
          b=points[j];
        }
      }
    }
    const spread=Math.max(18,Math.sqrt(maxDistSq));
    const midX=(a.x+b.x)/2;
    const midY=(a.y+b.y)/2;
    const usableW=Math.max(40,hc.width-56);
    const usableH=Math.max(28,hc.height-40);
    const scale=Math.min(usableW/spread, usableH/spread);
    mapPoint=(x,y)=>({
      x:hc.width/2 + (x-midX)*scale,
      y:hc.height/2 + (y-midY)*scale
    });
  }
  const centerAim=mapPoint(sourceW/2, sourceH/2);
  hctx.strokeStyle='rgba(255,255,255,0.08)';
  hctx.lineWidth=1;
  hctx.beginPath();
  hctx.moveTo(centerAim.x,18);
  hctx.lineTo(centerAim.x,hc.height);
  hctx.stroke();
  hctx.beginPath();
  hctx.moveTo(0,centerAim.y);
  hctx.lineTo(hc.width,centerAim.y);
  hctx.stroke();
  hctx.fillStyle='rgba(255,255,255,0.8)';
  hctx.font='11px Rajdhani';
  hctx.fillText('Center Aim', Math.min(hc.width-64,centerAim.x+8), Math.max(12,centerAim.y-6));
  points.forEach(ev=>{
    const pt=mapPoint(ev.x,ev.y);
    hctx.fillStyle=ev.hit?'rgba(0,255,136,0.7)':'rgba(255,45,110,0.6)';
    hctx.beginPath();hctx.arc(pt.x,pt.y,ev.hit?5:4,0,Math.PI*2);hctx.fill();
  });
  hctx.fillStyle='rgba(0,255,136,0.8)';hctx.beginPath();hctx.arc(12,12,5,0,Math.PI*2);hctx.fill();
  hctx.fillStyle='#aaa';hctx.font='11px Rajdhani';hctx.fillText('Hit',20,16);
  hctx.fillStyle='rgba(255,45,110,0.8)';hctx.beginPath();hctx.arc(60,12,4,0,Math.PI*2);hctx.fill();
  hctx.fillStyle='#aaa';hctx.fillText('Miss',68,16);
  if(!clickEvents.length){
    hctx.fillStyle='#70709a';
    hctx.font='12px Rajdhani';
    hctx.fillText('No target-position data recorded.', 12, hc.height-10);
  }
}

loadSettings();

function restartGame(){document.getElementById('results-overlay').classList.remove('act');startMode(gameMode,{duration:modeDurationOverride});}
