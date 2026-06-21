function shoot3D(){
  if(!threeCamera||!threeRaycaster) return;
  threeCamera.updateMatrixWorld();
  threeRaycaster.setFromCamera(new THREE.Vector2(0,0),threeCamera);
  const hitsList=threeRaycaster.intersectObjects(threeTargets,true);
  if(hitsList.length){
    const hit=hitsList[0];
    const root=threeTargets.find(target=>target===hit.object||target.children.includes(hit.object))||hit.object;
    on3DHit(root, hit.point);
  } else {
    const cx=(canvas.width||window.innerWidth)/2;
    const cy=(canvas.height||window.innerHeight)/2;
    record3DResultPoint(null, false, {x:cx,y:cy,ox:0,oy:0});
    const missPoint=new THREE.Vector3();
    threeCamera.getWorldDirection(missPoint);
    missPoint.multiplyScalar(14).add(threeCamera.position);
    spawn3DShotTrail(missPoint, false);
    misses++;streak=0;playMiss();updateHUD();flashHitEffect(false);
  }
}

function update3D(dt,time){
  const mode=getActiveModeConfig()||MODES.trainer3d;
  const intensity=window.trainerEngine?window.trainerEngine.getIntensity(hits,score,mode.adaptive!==false):0;
  rHue=(rHue+200*dt)%360;
  threeSpawnTimer -= dt;
  update3DEffects(dt,time/1000);
  if(threeSpawnTimer<=0){
    spawn3DTarget();
    threeSpawnTimer=window.trainerEngine?window.trainerEngine.getSpawnInterval(mode,hits,score):Math.max(0.35,1.2 - Math.min(0.75,(hits + score/120) * 0.025) + (Math.random()*0.4-0.2));
  }
  for(let i=threeTargets.length-1;i>=0;i--){
    const t=threeTargets[i];
    const elapsed=(time-(t.userData.spawnedAt||time))/1000;
    if(window.trainerEngine){
      window.trainerEngine.updateTargetMotion(t,elapsed,dt,mode,intensity);
    }else{
      const x=t.userData.baseX + Math.sin(elapsed*t.userData.waveSpeed + t.userData.pulseOffset)*t.userData.waveAmpX + t.userData.driftX*elapsed;
      const y=t.userData.baseY + Math.cos(elapsed*(t.userData.waveSpeed*0.75) + t.userData.pulseOffset)*t.userData.waveAmpY + t.userData.driftY*elapsed;
      const z=t.userData.baseZ + Math.sin(elapsed*(t.userData.waveSpeed*0.55) + t.userData.pulseOffset)*0.45;
      t.position.x=THREE.MathUtils.clamp(x,-4.2,4.2);
      t.position.y=THREE.MathUtils.clamp(y,0.9,3.4);
      t.position.z=THREE.MathUtils.clamp(z,-8,-3.6);
      t.rotation.y+=t.userData.rotateSpeed*dt;
      t.rotation.x=Math.sin(elapsed+t.userData.pulseOffset)*0.25;
    }
    const pulse=1+Math.sin(elapsed*5+t.userData.pulseOffset)*0.06;
    t.scale.setScalar(pulse);
    update3DTargetAppearance(t, elapsed);
    t.userData.life -= dt;
    if(t.userData.life<=0){
      threeScene.remove(t);
      dispose3DTarget(t);
      threeTargets.splice(i,1);
      misses++;streak=0;updateHUD();
      continue;
    }
  }
}

function threeLoop(now){
  if(!gameRunning||!is3DMode())return;
  const dt=Math.min((now-threeLastTime)/1000,0.1);
  threeLastTime=now;
  update3D(dt,now);
  updateSpectateState();
  if(threeRenderer&&threeScene&&threeCamera){
    threeRenderer.render(threeScene,threeCamera);
  }
  threeAnimId=requestAnimationFrame(threeLoop);
}

function launchGame(){
  showPage('game');
  resizeCv();
  score=0;hits=0;misses=0;streak=0;bestStreak=0;
  clickEvents=[];reactTimes=[];rHue=0;
  gameRunning=true;
  const s=MODES[gameMode];
  gameTimer=modeDurationOverride||s.dur;
  updateHUD();
  document.getElementById('game-canvas').style.display='none';
  document.getElementById('threejs-canvas').style.display='block';
  set3DCrosshair(true);
  clear3DEffects();
  clear3DTargets();
  init3DScene();
  threeSpawnTimer=0;
  const maxSpawn=Math.min((getActiveModeConfig()?.maxTargets)||1,3);
  for(let i=0;i<maxSpawn;i++)spawn3DTarget();
  threeLastTime=performance.now();
  threeAnimId=requestAnimationFrame(threeLoop);
  timerInt=setInterval(()=>{
    if(!gameRunning)return;
    gameTimer--;
    document.getElementById('h-time').textContent=gameTimer;
    if(gameTimer<=0)endGame();
  },1000);
}

function resizeCv(){
  const stage=document.getElementById('game-stage');
  if(!stage)return;
  const rect=stage.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  canvas.width = w;
  canvas.height = h;
  const threeCanvas=document.getElementById('threejs-canvas');
  if(threeCanvas){
    threeCanvas.width = w;
    threeCanvas.height = h;
    if(threeRenderer) threeRenderer.setSize(w, h, false);
    if(threeCamera){
      threeCamera.aspect = w / h;
      threeCamera.updateProjectionMatrix();
    }
  }
}
window.addEventListener('resize',()=>{if(document.getElementById('pg-game').classList.contains('act'))resizeCv(); if(spectateHost)resizeSpectateCanvas();});
window.addEventListener('fullscreenchange',()=>{if(document.getElementById('pg-game').classList.contains('act'))resizeCv();});
window.visualViewport?.addEventListener('resize',()=>{if(document.getElementById('pg-game').classList.contains('act'))resizeCv();});

async function updateSpectateState(){
  if(!currentUser||!gameRunning||!threeCamera) return;
  const now=Date.now();
  if(now - lastSpectateSave < 1000) return;
  lastSpectateSave = now;
  threeCamera.updateMatrixWorld();
  const spectateTargets=threeTargets.map(target=>{
    const projected=target.position.clone().project(threeCamera);
    return {
      x:((projected.x+1)/2)*(canvas.width||window.innerWidth),
      y:((1-projected.y)/2)*(canvas.height||(window.innerHeight-58-72)),
      r:Math.max(18,34/(Math.abs(target.position.z)+1))
    };
  }).filter(t=>Number.isFinite(t.x)&&Number.isFinite(t.y));
  currentUser.spectateSession = {
    host: currentUser.username,
    gameMode,
    score,
    hits,
    misses,
    streak,
    bestStreak,
    gameTimer,
    gameRunning,
    canvasWidth: canvas.width||window.innerWidth,
    canvasHeight: canvas.height||(window.innerHeight - 58 - 72),
    targets: spectateTargets,
    crosshair: currentUser.crosshair,
    bgId: currentBgId,
    ball: currentUser.equippedBall,
    trail: currentUser.equippedTrail,
    ts: now
  };
  saveU();
}
function clearSpectateState(){
  if(!currentUser) return;
  currentUser.spectateSession = currentUser.spectateSession || {host: currentUser.username};
  currentUser.spectateSession.gameRunning = false;
  currentUser.spectateSession.gameTimer = 0;
  currentUser.spectateSession.ts = Date.now();
  saveU();
}function updateHUD(){
  document.getElementById('h-score').textContent=score;
  document.getElementById('h-hits').textContent=hits;
  document.getElementById('h-miss').textContent=misses;
  const tot=hits+misses;
  document.getElementById('h-acc').textContent=tot?Math.round(hits/tot*100)+'%':'—';
  document.getElementById('h-streak').textContent=streak;
}

function dispose3DRenderer(){
  if(threeRenderer){
    threeRenderer.dispose();
    threeRenderer=null;
  }
  threeScene=null;
  threeCamera=null;
  threeRaycaster=null;
  threeFloor=null;
  threeGrid=null;
  threeAmbientLight=null;
  threeHemiLight=null;
  threeDirLight=null;
}
