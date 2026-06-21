function stopGame(){
  gameRunning=false;
  if(timerInt){clearInterval(timerInt);timerInt=null;}
  if(threeAnimId){cancelAnimationFrame(threeAnimId);threeAnimId=null;}
  resetPauseUI();
  document.exitPointerLock?.();
  set3DCrosshair(false);
  threeLastMouseX=null;
  threeLastMouseY=null;
  clear3DEffects();
  clear3DTargets();
  dispose3DRenderer();
  clearSpectateState();
}

function quitGame(){
  if(confirm('Quit? Progress will be lost.')){
    stopGame();
    currentDuelId=null;
    currentDuelTitle='';
    modeDurationOverride=null;
    goMenu();
  }
}

var pauseShown = false;

function isPauseOverlayOpen(){
  return document.getElementById('pause-overlay')?.classList.contains('act');
}

function resetPauseUI(){
  const pauseOverlay=document.getElementById('pause-overlay');
  const pauseMenu=document.getElementById('pause-menu');
  const settingsPause=document.getElementById('settings-pause');
  if(pauseOverlay)pauseOverlay.classList.remove('act');
  if(settingsPause){
    settingsPause.classList.remove('act');
    settingsPause.style.display='none';
  }
  if(pauseMenu)pauseMenu.style.display='flex';
  pauseShown=false;
}

function pauseGame(){
  if(!gameRunning||!is3DMode()||isPauseOverlayOpen()) return;
  gameRunning = false;
  if(threeAnimId) cancelAnimationFrame(threeAnimId);
  threeAnimId = null;
  set3DCrosshair(false);
  document.getElementById('pause-overlay').classList.add('act');
  document.getElementById('pause-menu').style.display='flex';
  document.getElementById('settings-pause').style.display='none';
  document.getElementById('settings-pause').classList.remove('act');
  pauseShown = true;
}

function resumeGame(){
  if(!isPauseOverlayOpen()||document.getElementById('pg-game').classList.contains('act')===false)return;
  resetPauseUI();
  set3DCrosshair(true);
  gameRunning = true;
  threeLastTime = performance.now();
  threeAnimId = requestAnimationFrame(threeLoop);
}

function showSettingsPause(){
  if(!isPauseOverlayOpen())return;
  document.getElementById('pause-menu').style.display = 'none';
  document.getElementById('settings-pause').classList.add('act');
  document.getElementById('settings-pause').style.display = 'block';
}

function hideSettingsPause(){
  if(!isPauseOverlayOpen())return;
  document.getElementById('settings-pause').classList.remove('act');
  document.getElementById('settings-pause').style.display = 'none';
  document.getElementById('pause-menu').style.display = 'flex';
}

function updateSetting(type, val){
  if(type === 'invert'){
    threeInvert = !!val;
    localStorage.setItem('vox_invert', threeInvert);
    return;
  }
  const num = parseFloat(val);
  if(isNaN(num)) return;
  if(type === 'fov'){
    const clamped = Math.max(60, Math.min(120, num));
    if(threeCamera) {
      threeCamera.fov = clamped;
      threeCamera.updateProjectionMatrix();
    }
    document.getElementById('set-fov-lbl').textContent = clamped;
    localStorage.setItem('vox_fov', clamped);
  } else if(type === 'sens'){
    const clamped = Math.max(0.1, Math.min(2.0, num));
    threeSens = clamped;
    document.getElementById('set-sens-lbl').textContent = clamped;
    localStorage.setItem('vox_sens', clamped);
  }
}

var threeSens = 0.4;
var threeInvert = false;
var threeFov = 75;

function loadSettings(){
  try {
    const fov = localStorage.getItem('vox_fov');
    if(fov && !isNaN(parseFloat(fov))) {
      threeFov = Math.max(60, Math.min(120, parseFloat(fov)));
      document.getElementById('set-fov').value = threeFov;
      document.getElementById('set-fov-lbl').textContent = threeFov;
    }
    const sens = localStorage.getItem('vox_sens');
    if(sens && !isNaN(parseFloat(sens))) {
      threeSens = Math.max(0.1, Math.min(2.0, parseFloat(sens)));
      document.getElementById('set-sens').value = threeSens;
      document.getElementById('set-sens-lbl').textContent = threeSens;
    }
    const invert = localStorage.getItem('vox_invert');
    if(invert) {
      threeInvert = invert === 'true';
      document.getElementById('set-invert').checked = threeInvert;
    }
  } catch(e) {
    console.warn('Failed to load settings from localStorage', e);
  }
}

document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){
    e.preventDefault();
    if(isPauseOverlayOpen()){
      if(document.getElementById('settings-pause').style.display === 'block'){
        hideSettingsPause();
      }else{
        resumeGame();
      }
    } else if(gameRunning && is3DMode() && document.getElementById('pg-game').classList.contains('act')){
      pauseGame();
    }
  }
});

document.addEventListener('pointerlockchange', () => {
  const threeCanvas=document.getElementById('threejs-canvas');
  const inGame=document.getElementById('pg-game').classList.contains('act');
  if(gameRunning&&is3DMode()&&inGame&&threeCanvas&&document.pointerLockElement!==threeCanvas&&!isPauseOverlayOpen()){
    pauseGame();
  }
});
