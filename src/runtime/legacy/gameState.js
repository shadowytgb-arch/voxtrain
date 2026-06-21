// ═══════════════════════════════════════════════
//  GAME ENGINE
// ═══════════════════════════════════════════════
const canvas=document.getElementById('game-canvas');
const ctx=canvas.getContext('2d'); 
var gameRunning=false,gameMode='trainer3d';
function is3DMode(){return window.is3DGameMode?window.is3DGameMode(gameMode):!!(MODES[gameMode]&&MODES[gameMode].is3D);}
function getActiveModeConfig(){return window.getModeConfig?window.getModeConfig(gameMode):MODES[gameMode];}
var score=0,hits=0,misses=0,streak=0,bestStreak=0;
var gameTimer=0,timerInt=null;
var rHue=0;
var clickEvents=[];
var reactTimes=[];
var localDBCache=null;
var currentBgId='bg_black';
var currentDuelId=null,currentDuelTitle='';
var modeDurationOverride=null;
var spectateHost=null,spectatePollTimer=null,lastSpectateSave=0;

var threeRenderer=null, threeScene=null, threeCamera=null, threeRaycaster=null;
var threeTargets=[];
var threeAnimId=null, threeSpawnTimer=0, threeTargetLife=3;
var threeLastTime=0;
var threeLastMouseX=null, threeLastMouseY=null, threeYaw=0, threePitch=0;
var threeFxParticles=[], threeShotTrails=[];
var threeFloor=null, threeGrid=null, threeAmbientLight=null, threeHemiLight=null, threeDirLight=null;
var threeInputBound=false;

const MODES=window.MODES||{
  trainer3d:{label:'3D TRAINER',dur:45,pts:120,is3D:true,desc:'First-person speed, precision and tracking drills with adaptive difficulty and laser-sharp raycast shooting.',maxTargets:1,movement:'wave',targetLife:3,spawnMin:0.35,spawnBase:1.2,targetRadius:0.5,adaptive:true},
};

function startMode(m, options={}){
  gameMode=m;
  modeDurationOverride=options&&options.duration?Math.max(15,Math.round(options.duration)):null;
  currentBgId=currentUser?getEquippedBgItem().id:'bg_black';
  const s=MODES[m];
  const duration=modeDurationOverride||s.dur;
  const ov=document.getElementById('cd-overlay');
  document.getElementById('cd-mode').textContent=s.label;
  const modeDescEl=document.getElementById('h-mode-desc');
  if(modeDescEl)modeDescEl.textContent=s.desc||s.label;
  document.getElementById('h-time').textContent=duration;
  ov.classList.add('act');
  let c=3;
  document.getElementById('cd-num').textContent=c;
  playCD();
  const iv=setInterval(()=>{
    c--;
    if(c<=0){clearInterval(iv);document.getElementById('cd-num').textContent='GO!';playGo();setTimeout(()=>{ov.classList.remove('act');launchGame();},550);}
    else{document.getElementById('cd-num').textContent=c;playCD();}
  },1000);
}

function getOwnedCosmeticList(type){
  if(!currentUser)return [];
  if(type==='ball')return currentUser.ownedBalls||[];
  if(type==='bg')return currentUser.ownedBgs||[];
  if(type==='trail')return currentUser.ownedTrails||[];
  if(type==='fx')return currentUser.ownedFx||[];
  if(type==='title')return currentUser.ownedTitles||[];
  return [];
}

function isOwnedCosmetic(type,id){
  if(!currentUser)return false;
  const itemPrice =
    type==='ball' ? (BALLS.find(x=>x.id===id)?.price ?? 0) :
    type==='bg' ? (BACKGROUNDS.find(x=>x.id===id)?.price ?? 0) :
    type==='trail' ? (TRAILS.find(x=>x.id===id)?.price ?? 0) :
    type==='fx' ? (FX.find(x=>x.id===id)?.price ?? 0) :
    type==='title' ? (TITLES.find(x=>x.id===id)?.price ?? 0) :
    0;
  return itemPrice===0 || getOwnedCosmeticList(type).includes(id);
}

function getEquippedBallItem(){
  const equipped=currentUser?.equippedBall||'white';
  return BALLS.find(ball=>ball.id===equipped)||BALLS[0];
}

function getEquippedBgItem(){
  const equipped=currentUser?.equippedBg||'bg_black';
  return BACKGROUNDS.find(bg=>bg.id===equipped)||BACKGROUNDS[0];
}

function getEquippedTrailItem(){
  const equipped=currentUser?.equippedTrail||'none';
  return TRAILS.find(trail=>trail.id===equipped)||TRAILS[0];
}

function getEquippedFxItem(){
  const equipped=currentUser?.equippedFx||'burst';
  return FX.find(fx=>fx.id===equipped)||FX[0];
}

function get3DBackgroundTheme(bgId){
  const bg=BACKGROUNDS.find(item=>item.id===bgId)||BACKGROUNDS[0];
  const simpleHex=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(bg.css||'')?bg.css:'#050814';
  const base={
    clear:simpleHex,
    fog:simpleHex,
    fogDensity:0.005,
    ambientColor:'#8aaaff',
    ambientIntensity:0.34,
    hemiSky:'#8899ff',
    hemiGround:'#221122',
    hemiIntensity:0.88,
    dirColor:'#ffffff',
    dirIntensity:1.35,
    floor:'#08101f',
    floorEmissive:'#000000',
    gridMajor:'#203054',
    gridMinor:'#10182c',
    gridOpacity:0.32,
    showGrid:true
  };
  switch(bg.css){
    case 'grid': return {...base, clear:'#050510', fog:'#050510', gridMajor:'#2d5f8f', gridMinor:'#11213b', gridOpacity:0.5};
    case 'dots': return {...base, clear:'#070718', fog:'#070718', floor:'#0d1220', gridMajor:'#133b4a', gridMinor:'#0a1720', gridOpacity:0.2};
    case 'circuit': return {...base, clear:'#030a03', fog:'#030a03', ambientColor:'#5dff96', hemiSky:'#48ff88', hemiGround:'#081108', floor:'#041108', gridMajor:'#1fbf72', gridMinor:'#0b2f18', dirColor:'#b8ffcf'};
    case 'neon_city': return {...base, clear:'#08001a', fog:'#0b0120', ambientColor:'#ff66b3', hemiSky:'#4cd9ff', hemiGround:'#210621', floor:'#120321', floorEmissive:'#1a0838', gridMajor:'#7d36ff', gridMinor:'#2b1150'};
    case 'galaxy': return {...base, clear:'#010010', fog:'#08001a', ambientColor:'#8e6bff', hemiSky:'#7257ff', hemiGround:'#11081f', floor:'#09021a', floorEmissive:'#120033', gridMajor:'#5636a8', gridMinor:'#1b0f33'};
    case 'matrix': return {...base, clear:'#000500', fog:'#001000', ambientColor:'#54ff88', hemiSky:'#36ff72', hemiGround:'#061007', floor:'#021006', gridMajor:'#1ecb56', gridMinor:'#0b2d12', dirColor:'#d4ffd7'};
    case 'fire': return {...base, clear:'#090000', fog:'#220000', ambientColor:'#ff9255', hemiSky:'#ff7a33', hemiGround:'#2a0600', floor:'#220500', floorEmissive:'#2b0900', gridMajor:'#a83b16', gridMinor:'#330d05'};
    case 'red_neon': return {...base, clear:'#06060e', fog:'#12020b', ambientColor:'#ff5b8c', hemiSky:'#ff3f76', hemiGround:'#24020b', floor:'#18030a', floorEmissive:'#24030f', gridMajor:'#a80c4a', gridMinor:'#2d0a18'};
    case 'eclipse': return {...base, clear:'#080010', fog:'#120018', ambientColor:'#b277ff', hemiSky:'#934cff', hemiGround:'#14031d', floor:'#120218', floorEmissive:'#1e0627', gridMajor:'#6e2bd9', gridMinor:'#200932'};
    case 'aurora': return {...base, clear:'#050927', fog:'#09122c', ambientColor:'#7ef0ff', hemiSky:'#58ffe1', hemiGround:'#0b1630', floor:'#08162a', floorEmissive:'#07111b', gridMajor:'#2db0d6', gridMinor:'#123450'};
    case 'rain': return {...base, clear:'#041725', fog:'#071621', ambientColor:'#72d6ff', hemiSky:'#4db8ff', hemiGround:'#07101a', floor:'#07131c', floorEmissive:'#040a11', gridMajor:'#2a74a8', gridMinor:'#11304a'};
    case 'vapor': return {...base, clear:'#120a28', fog:'#170b2d', ambientColor:'#ff85eb', hemiSky:'#5db5ff', hemiGround:'#180c2e', floor:'#160d24', floorEmissive:'#1b0f36', gridMajor:'#c14dff', gridMinor:'#33165e'};
    default: return {...base, clear:simpleHex, fog:simpleHex, floor:simpleHex};
  }
}

function apply3DBackgroundTheme(bgId=currentBgId){
  if(!threeScene)return;
  const theme=get3DBackgroundTheme(bgId);
  const sceneColor=new THREE.Color(theme.clear);
  threeScene.background=sceneColor;
  threeScene.fog=new THREE.FogExp2(new THREE.Color(theme.fog), theme.fogDensity);
  if(threeAmbientLight){
    threeAmbientLight.color.set(theme.ambientColor);
    threeAmbientLight.intensity=theme.ambientIntensity;
  }
  if(threeHemiLight){
    threeHemiLight.color.set(theme.hemiSky);
    threeHemiLight.groundColor.set(theme.hemiGround);
    threeHemiLight.intensity=theme.hemiIntensity;
  }
  if(threeDirLight){
    threeDirLight.color.set(theme.dirColor);
    threeDirLight.intensity=theme.dirIntensity;
  }
  if(threeFloor&&threeFloor.material){
    threeFloor.material.color.set(theme.floor);
    threeFloor.material.emissive.set(theme.floorEmissive);
  }
  if(threeGrid){
    const mats=Array.isArray(threeGrid.material)?threeGrid.material:[threeGrid.material];
    if(mats[0]&&mats[0].color)mats[0].color.set(theme.gridMajor);
    if(mats[1]&&mats[1].color)mats[1].color.set(theme.gridMinor);
    mats.forEach(mat=>{
      mat.transparent=true;
      mat.opacity=theme.gridOpacity;
    });
    threeGrid.visible=theme.showGrid!==false;
  }
}

function create3DTargetMaterial(ball, intensity){
  const opts={roughness:0.2,metalness:0.3};
  if(ball.id==='gold'){opts.color='#ffd54a';opts.emissive='#6a4200';opts.roughness=0.22;opts.metalness=0.88;}
  else if(ball.id==='silver'){opts.color='#dfe7ff';opts.emissive='#29344f';opts.roughness=0.14;opts.metalness=0.92;}
  else if(ball.color==='neon'){opts.color='#5bffd8';opts.emissive='#00ff99';opts.roughness=0.08;opts.metalness=0.18;}
  else if(ball.color==='galaxy'){opts.color='#6953ff';opts.emissive='#381177';opts.roughness=0.28;opts.metalness=0.56;}
  else if(ball.color==='lava'){opts.color='#ff7b1a';opts.emissive='#d62600';opts.roughness=0.36;opts.metalness=0.16;}
  else if(ball.color==='rainbow'){opts.color='#7cf9ff';opts.emissive='#004b72';opts.roughness=0.16;opts.metalness=0.44;}
  else if(ball.isCat||ball.id==='cat'){opts.color='#ffb347';opts.emissive='#6a2c00';opts.roughness=0.35;opts.metalness=0.08;}
  else{
    opts.color=ball.color||'#ffffff';
    opts.emissive=ball.type==='premium'?'#0a3040':'#102030';
    opts.roughness=ball.type==='premium'?0.12:0.22;
    opts.metalness=ball.type==='premium'?0.55:0.28;
  }
  const material=new THREE.MeshStandardMaterial(opts);
  material.emissiveIntensity=0.45+intensity*0.35;
  return material;
}

function getBallFxPalette(ball=getEquippedBallItem()){
  if(!ball)return ['#00e5ff','#66f2ff','#ffffff'];
  if(ball.id==='gold')return ['#ffd54a','#ffec8a','#9b6900'];
  if(ball.id==='silver')return ['#dfe7ff','#ffffff','#7d8aa6'];
  if(ball.color==='neon')return ['#5bffd8','#00ff99','#c8fff4'];
  if(ball.color==='galaxy')return ['#6953ff','#aa44ff','#7cf9ff'];
  if(ball.color==='lava')return ['#ffff80','#ff7b1a','#d62600'];
  if(ball.color==='rainbow')return ['#ff4d6d','#ffd84d','#4dff88','#4ddcff','#7a5cff','#ff5cf0'];
  if(ball.isCat||ball.id==='cat')return ['#ffb347','#ff8c00','#ff6fa8','#fff0c2'];
  const base=ball.color||'#ffffff';
  return [lc(base,45), base, dc(base,35)];
}

function getBallFxColorAt(index, total, ball=getEquippedBallItem()){
  const palette=getBallFxPalette(ball);
  if(ball?.color==='rainbow'){
    const hue=((rHue||0)+((index/Math.max(1,total))*360))%360;
    return `hsl(${hue},100%,60%)`;
  }
  return palette[index%palette.length];
}

function getBallFxThreeColorAt(index, total, ball=getEquippedBallItem()){
  if(ball?.color==='rainbow'){
    const hue=(((rHue||0)+((index/Math.max(1,total))*360))%360)/360;
    return new THREE.Color().setHSL(hue,1,0.62);
  }
  return new THREE.Color(getBallFxColorAt(index,total,ball));
}

function decorate3DTarget(target, ball){
  if(!(ball.isCat||ball.id==='cat'))return;
  const earGeo=new THREE.ConeGeometry(0.13,0.24,4);
  const earMat=new THREE.MeshStandardMaterial({color:'#ffb347',emissive:'#6a2c00',roughness:0.4,metalness:0.06});
  const leftEar=new THREE.Mesh(earGeo,earMat);
  leftEar.position.set(-0.24,0.46,0);
  leftEar.rotation.z=Math.PI*0.12;
  const rightEar=leftEar.clone();
  rightEar.position.x=0.24;
  rightEar.rotation.z=-Math.PI*0.12;

  const eyeGeo=new THREE.SphereGeometry(0.045,10,10);
  const eyeMat=new THREE.MeshStandardMaterial({color:'#23252c',roughness:0.7,metalness:0});
  const leftEye=new THREE.Mesh(eyeGeo,eyeMat);
  leftEye.position.set(-0.15,0.05,0.45);
  const rightEye=leftEye.clone();
  rightEye.position.x=0.15;

  const noseGeo=new THREE.SphereGeometry(0.035,8,8);
  const noseMat=new THREE.MeshStandardMaterial({color:'#ff6fa8',emissive:'#5c1736',roughness:0.5,metalness:0});
  const nose=new THREE.Mesh(noseGeo,noseMat);
  nose.position.set(0,-0.08,0.48);

  target.add(leftEar,rightEar,leftEye,rightEye,nose);
}

function create3DTarget(ball, intensity, radius=0.5){
  const target=new THREE.Mesh(new THREE.SphereGeometry(radius,26,22), create3DTargetMaterial(ball, intensity));
  target.userData.ballId=ball.id;
  target.userData.materialMode=
    ball.color==='rainbow'?'rainbow':
    ball.color==='neon'?'neon':
    ball.color==='lava'?'lava':
    ball.color==='galaxy'?'galaxy':
    ball.id==='gold'?'gold':
    ball.id==='silver'?'silver':
    null;
  target.userData.baseColorOffset=Math.random();
  decorate3DTarget(target, ball);
  return target;
}

function update3DTargetAppearance(target, elapsed){
  if(!target||!target.material)return;
  const mat=target.material;
  const mode=target.userData.materialMode;
  if(mode==='rainbow'){
    const hue=(elapsed*0.16+target.userData.baseColorOffset)%1;
    mat.color.setHSL(hue,0.88,0.64);
    mat.emissive.setHSL((hue+0.08)%1,0.92,0.28);
  }else if(mode==='neon'){
    const pulse=0.75+Math.sin(elapsed*8+target.userData.pulseOffset)*0.35;
    mat.emissiveIntensity=0.7+pulse*0.65;
  }else if(mode==='lava'){
    const pulse=0.45+Math.sin(elapsed*6+target.userData.pulseOffset)*0.28;
    mat.emissiveIntensity=0.7+pulse*0.55;
  }else if(mode==='galaxy'){
    const hue=0.68+Math.sin(elapsed*1.6+target.userData.baseColorOffset*Math.PI*2)*0.06;
    mat.color.setHSL(hue,0.72,0.58);
    mat.emissive.setHSL((hue+0.08)%1,0.78,0.18);
  }else if(mode==='gold'||mode==='silver'){
    mat.emissiveIntensity=0.35+Math.sin(elapsed*4+target.userData.baseColorOffset*Math.PI*2)*0.12;
  }
}

function get3DTrailStyle(trailId, seed=0){
  if(trailId==='trail_rainbow'){
    return {color:new THREE.Color().setHSL(((rHue+seed*12)%360)/360,1,0.62), opacity:0.95, life:0.14};
  }
  if(trailId==='trail_fire')return {color:new THREE.Color('#ff5a1f'), opacity:0.9, life:0.14};
  if(trailId==='trail_ice')return {color:new THREE.Color('#55d8ff'), opacity:0.88, life:0.16};
  if(trailId==='trail_electric')return {color:new THREE.Color('#ffe84f'), opacity:0.94, life:0.11};
  if(trailId==='trail_ghost')return {color:new THREE.Color('#f4f8ff'), opacity:0.46, life:0.18};
  return {color:new THREE.Color('#ffffff'), opacity:0.8, life:0.12};
}
