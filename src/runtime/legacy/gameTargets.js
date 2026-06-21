function dispose3DTarget(mesh){
  if(!mesh) return;
  if(mesh.geometry){mesh.geometry.dispose();}
  if(mesh.material){
    if(Array.isArray(mesh.material)){
      mesh.material.forEach(m=>{ if(m.map) m.map.dispose(); m.dispose(); });
    } else {
      if(mesh.material.map) mesh.material.map.dispose();
      mesh.material.dispose();
    }
  }
  if(mesh.children && mesh.children.length){
    mesh.children.forEach(child=>dispose3DTarget(child));
  }
}

function clear3DTargets(){
  if(!threeScene) return;
  threeTargets.forEach(t=>{
    threeScene.remove(t);
    dispose3DTarget(t);
  });
  threeTargets=[];
}

function spawn3DTarget(){
  const mode=getActiveModeConfig()||MODES[gameMode]||MODES.trainer3d;
  const maxTargets=mode.maxTargets||1;
  if(!threeScene || threeTargets.length>=maxTargets) return;
  const intensity=window.trainerEngine?window.trainerEngine.getIntensity(hits,score,mode.adaptive!==false):Math.min(1,Math.max(0,(hits + score/120) / 24));
  const ball=getEquippedBallItem();
  const radius=window.trainerEngine?window.trainerEngine.getTargetRadius(mode,intensity):(mode.targetRadius||0.5);
  const target=create3DTarget(ball, intensity, radius);
  const ud=window.trainerEngine?window.trainerEngine.initTargetUserData(mode,intensity,performance.now()):null;
  if(ud){
    target.position.set(ud.baseX,ud.baseY,ud.baseZ);
    target.userData={...target.userData,...ud};
  }else{
    const distance=4.5+Math.random()*2.3;
    const baseX=(Math.random()*2-1)*(1.2+intensity*2.2);
    const baseY=1.1+Math.random()*1.5;
    target.position.set(baseX,baseY,-distance);
    target.userData={
      ...target.userData,
      life:threeTargetLife + (1-intensity)*1.3,
      spawnedAt:performance.now(),
      baseX,baseY,baseZ:-distance,
      waveAmpX:0.2+Math.random()*1.35,
      waveAmpY:0.1+Math.random()*0.55,
      waveSpeed:1.2+Math.random()*1.6+intensity*0.9,
      driftX:(Math.random()*2-1)*(0.18+intensity*0.35),
      driftY:(Math.random()*2-1)*0.08,
      pulseOffset:Math.random()*Math.PI*2,
      rotateSpeed:(Math.random()-0.5)*(1.2+intensity)
    };
  }
  threeScene.add(target);
  threeTargets.push(target);
}

function flashHitEffect(isHit=true){
  const flash=document.getElementById('hit-flash');
  if(!flash) return;
  flash.style.backgroundColor = isHit ? 'rgba(0,255,190,0.16)' : 'rgba(255,80,80,0.12)';
  flash.classList.add('active');
  clearTimeout(flash._timeout);
  flash._timeout=setTimeout(()=>flash.classList.remove('active'),120);
}

function on3DHit(target, hitPoint){
  const idx=threeTargets.indexOf(target);
  if(idx<0) return;
  const rt=Math.round(performance.now()-(target.userData.spawnedAt||performance.now()));
  if(rt>50&&rt<5000)reactTimes.push(rt);
  record3DResultPoint(target, true);
  spawn3DShotTrail((hitPoint||target.position).clone(), true);
  spawn3DHitFx((hitPoint||target.position).clone());
  threeScene.remove(target);
  dispose3DTarget(target);
  threeTargets.splice(idx,1);
  score += MODES[gameMode].pts || 120;
  hits++;
  streak++;
  bestStreak=Math.max(bestStreak,streak);
  playHit();
  updateHUD();
  flashHitEffect(true);
  spawn3DTarget();
  const cross=document.getElementById('crosshair-center');
  if(cross){ cross.style.background='rgba(0,255,136,0.22)'; setTimeout(()=>cross.style.background='transparent',90); }
}

function update3DCameraRotation(dx,dy){
  const scalar=0.0025*threeSens;
  threeYaw -= dx * scalar;
  threePitch -= (threeInvert ? -dy : dy) * scalar;
  threePitch = Math.max(-1.2, Math.min(1.2, threePitch));
  if(threeCamera) threeCamera.rotation.set(threePitch, threeYaw, 0);
}

function project3DPointToCanvas(point){
  if(!threeCamera||!point)return null;
  const projected=point.clone().project(threeCamera);
  if(!Number.isFinite(projected.x)||!Number.isFinite(projected.y)||projected.z>1)return null;
  return {
    x:((projected.x+1)/2)*(canvas.width||window.innerWidth),
    y:((1-projected.y)/2)*(canvas.height||window.innerHeight)
  };
}

function record3DResultPoint(target, hit, missOffset){
  if(hit && target){
    threeCamera?.updateMatrixWorld();
    target.updateMatrixWorld?.();
    const pos=project3DPointToCanvas(target.getWorldPosition(new THREE.Vector3()));
    if(!pos)return;
    const cx=(canvas.width||window.innerWidth)/2;
    const cy=(canvas.height||window.innerHeight)/2;
    clickEvents.push({x:pos.x,y:pos.y,hit,kind:'target',ox:pos.x-cx,oy:pos.y-cy});
    return;
  }
  if(missOffset){
    clickEvents.push({x:missOffset.x,y:missOffset.y,hit:false,kind:'miss',ox:missOffset.ox,oy:missOffset.oy});
  }
}
