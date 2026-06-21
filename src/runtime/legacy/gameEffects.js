function spawn3DShotTrail(endPoint, didHit){
  const trail=getEquippedTrailItem();
  if(!threeScene||!threeCamera||!trail||trail.id==='none')return;
  const start=threeCamera.position.clone();
  const style=get3DTrailStyle(trail.id, threeShotTrails.length);
  const line=new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([start,endPoint.clone()]),
    new THREE.LineBasicMaterial({color:style.color, transparent:true, opacity:style.opacity})
  );
  line.userData={life:style.life,maxLife:style.life,trailId:trail.id,didHit,hueSeed:Math.random()};
  threeScene.add(line);
  threeShotTrails.push(line);
}

function spawn3DHitFx(point){
  if(!threeScene)return;
  const fx=getEquippedFxItem();
  const ball=getEquippedBallItem();
  const count=
    fx.id==='lightning'?20:
    fx.id==='vortex'?18:
    fx.id==='confetti'?22:
    fx.id==='shatter'?14:
    fx.id==='pixel'?16:
    12;
  const geometry=
    fx.id==='pixel' ? new THREE.BoxGeometry(0.08,0.08,0.08) :
    fx.id==='shatter' ? new THREE.TetrahedronGeometry(0.075) :
    new THREE.SphereGeometry(fx.id==='lightning'?0.05:0.06,8,8);
  for(let i=0;i<count;i++){
    const color=
      fx.id==='confetti'
        ? getBallFxThreeColorAt(i, count, ball)
        : fx.id==='lightning'
          ? getBallFxThreeColorAt(i, count, ball).lerp(new THREE.Color('#ffffff'),0.28)
          : fx.id==='vortex'
            ? getBallFxThreeColorAt(i, count, ball).lerp(new THREE.Color('#111111'),0.12)
            : getBallFxThreeColorAt(i, count, ball);
    const material=new THREE.MeshStandardMaterial({
      color,
      emissive:color.clone().multiplyScalar(fx.id==='vortex'?0.9:0.55),
      transparent:true,
      opacity:0.95,
      roughness:0.2,
      metalness:fx.id==='pixel'?0.15:0.35
    });
    const particle=new THREE.Mesh(geometry.clone(), material);
    particle.position.copy(point);
    const angle=(i/count)*Math.PI*2;
    const speed=
      fx.id==='lightning'?5.8+Math.random()*4.4:
      fx.id==='vortex'?2.2+Math.random()*1.2:
      2.8+Math.random()*3.2;
    particle.userData={
      fxId:fx.id,
      life:fx.id==='vortex'?0.55:0.42+Math.random()*0.18,
      maxLife:fx.id==='vortex'?0.55:0.42+Math.random()*0.18,
      velocity:new THREE.Vector3(
        Math.cos(angle)*(speed*(fx.id==='vortex'?0.35:1)),
        (Math.random()-0.18)*(fx.id==='lightning'?1.8:2.6),
        Math.sin(angle)*(speed*(fx.id==='vortex'?0.35:1))
      ),
      center:point.clone(),
      orbitAngle:angle,
      orbitRadius:0.14+Math.random()*0.2,
      spin:new THREE.Vector3((Math.random()-0.5)*8,(Math.random()-0.5)*8,(Math.random()-0.5)*8)
    };
    threeScene.add(particle);
    threeFxParticles.push(particle);
  }
}

function clear3DEffects(){
  if(threeScene){
    threeShotTrails.forEach(obj=>{threeScene.remove(obj);dispose3DTarget(obj);});
    threeFxParticles.forEach(obj=>{threeScene.remove(obj);dispose3DTarget(obj);});
  }
  threeShotTrails=[];
  threeFxParticles=[];
}

function update3DEffects(dt, time){
  for(let i=threeShotTrails.length-1;i>=0;i--){
    const trail=threeShotTrails[i];
    trail.userData.life-=dt;
    if(trail.material){
      if(trail.userData.trailId==='trail_rainbow'){
        trail.material.color.setHSL(((time*0.15+trail.userData.hueSeed)%1),1,0.62);
      }
      trail.material.opacity=Math.max(0, (trail.userData.life/trail.userData.maxLife)*(trail.userData.didHit?0.95:0.7));
    }
    if(trail.userData.life<=0){
      threeScene.remove(trail);
      dispose3DTarget(trail);
      threeShotTrails.splice(i,1);
    }
  }
  for(let i=threeFxParticles.length-1;i>=0;i--){
    const particle=threeFxParticles[i];
    const data=particle.userData;
    data.life-=dt;
    if(data.fxId==='vortex'){
      data.orbitAngle+=dt*8;
      data.orbitRadius=Math.max(0.02, data.orbitRadius-dt*0.22);
      particle.position.set(
        data.center.x+Math.cos(data.orbitAngle)*data.orbitRadius,
        data.center.y+dt*0.9+(data.maxLife-data.life)*0.4,
        data.center.z+Math.sin(data.orbitAngle)*data.orbitRadius
      );
    }else{
      particle.position.addScaledVector(data.velocity, dt);
      data.velocity.y-=dt*(data.fxId==='lightning'?2.4:4.6);
    }
    particle.rotation.x+=data.spin.x*dt;
    particle.rotation.y+=data.spin.y*dt;
    particle.rotation.z+=data.spin.z*dt;
    if(particle.material){
      particle.material.opacity=Math.max(0, data.life/data.maxLife);
      particle.material.emissiveIntensity=0.45+(1-particle.material.opacity)*0.15;
    }
    if(data.life<=0){
      threeScene.remove(particle);
      dispose3DTarget(particle);
      threeFxParticles.splice(i,1);
    }
  }
}
