// ═══════════════════════════════════════════════
//  CROSSHAIR
// ═══════════════════════════════════════════════
function buyItem(type,item){
  if(!currentUser||!item)return;
  if(isOwnedCosmetic(type,item.id)){
    equipItem(type,item);
    return;
  }
  if(item.price>0&&currentUser.gems<item.price){toast('Not enough gems! 💎');return;}
  if(item.price>0)currentUser.gems-=item.price;
  const ownedList=getOwnedCosmeticList(type);
  if(!ownedList.includes(item.id))ownedList.push(item.id);
  equipItem(type,item,{skipSave:true,skipToast:true});
  currentUser.purchases=(currentUser.purchases||0)+1;
  qprog('purchases',1);
  playBuy();
  saveU();
  updateNav();
  toast(`Purchased ${item.name}!`);
}

function equipItem(type,item,options={}){
  if(!currentUser||!item)return false;
  const {skipSave=false,skipToast=false}=options;
  if(!isOwnedCosmetic(type,item.id)){
    toast('Buy this item first.');
    return false;
  }
  if(type==='ball')currentUser.equippedBall=item.id;
  else if(type==='bg'){
    currentUser.equippedBg=item.id;
    currentBgId=item.id;
    if(item.id==='bg_neon')qprog('bg_neon',1);
    if(threeScene)apply3DBackgroundTheme(item.id);
  }
  else if(type==='trail')currentUser.equippedTrail=item.id;
  else if(type==='fx')currentUser.equippedFx=item.id;
  else if(type==='title')currentUser.equippedTitle=item.id;
  if(!skipSave)saveU();
  if(!skipToast)toast('Equipped.');
  return true;
}

var ch={type:'cross',size:12,thick:2,gap:4,dot:4,color:'#00e5ff',outline:1};

function setCrossType(t,btn){
  ch.type=t;
  document.querySelectorAll('.ctype-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('dot-size-row').style.display=t==='dot'?'flex':'none';
  renderCross();
}

function updateCross(k,v){
  ch[k]=k==='color'?v:Number(v);
  document.getElementById('cv-'+k).textContent=k==='color'?'':k==='outline'?['off','on'][v]:v;
  if(k==='outline'){
    const toggle=document.getElementById('cv-outline-toggle');
    if(toggle)toggle.checked=!!Number(v);
  }
  renderCross();
}

function drawCrosshairAt(c,x,y,state){
  if(!c||!state)return;
  const size=Math.max(1,Number.isFinite(Number(state.size))?Number(state.size):12);
  const thick=Math.max(1,Number.isFinite(Number(state.thick))?Number(state.thick):2);
  const gap=Math.max(0,Number.isFinite(Number(state.gap))?Number(state.gap):4);
  const dot=Math.max(1,Number.isFinite(Number(state.dot))?Number(state.dot):4);
  const color=state.color||'#00e5ff';
  const outline=Number.isFinite(Number(state.outline))?Number(state.outline):0;
  const half=Math.round(thick/2);

  const drawRect=(rx,ry,rw,rh,fill)=>{
    c.fillStyle=fill;
    c.fillRect(Math.round(rx),Math.round(ry),Math.max(1,Math.round(rw)),Math.max(1,Math.round(rh)));
  };
  const strokeRect=(rx,ry,rw,rh)=>{
    if(!outline)return;
    drawRect(rx-1,ry-1,rw+2,rh+2,'rgba(0,0,0,0.9)');
  };
  const fillRect=(rx,ry,rw,rh)=>{
    strokeRect(rx,ry,rw,rh);
    drawRect(rx,ry,rw,rh,color);
  };

  if(state.type==='dot'){
    const r=dot/2;
    if(outline){
      c.fillStyle='rgba(0,0,0,0.9)';
      c.beginPath();
      c.arc(x,y,r+1.5,0,Math.PI*2);
      c.fill();
    }
    c.fillStyle=color;
    c.beginPath();
    c.arc(x,y,r,0,Math.PI*2);
    c.fill();
    return;
  }

  if(state.type==='circle'){
    if(outline){
      c.strokeStyle='rgba(0,0,0,0.9)';
      c.lineWidth=thick+2;
      c.beginPath();
      c.arc(x,y,size,0,Math.PI*2);
      c.stroke();
    }
    c.strokeStyle=color;
    c.lineWidth=thick;
    c.beginPath();
    c.arc(x,y,size,0,Math.PI*2);
    c.stroke();
    return;
  }

  const seg=size;
  fillRect(x-gap-seg, y-half, seg, thick);
  fillRect(x+gap, y-half, seg, thick);

  if(state.type==='cross' || state.type==='plus'){
    fillRect(x-half, y-gap-seg, thick, seg);
    fillRect(x-half, y+gap, thick, seg);
  }else if(state.type==='tcross'){
    fillRect(x-half, y+gap, thick, seg);
  }

  if(state.type==='plus'){
    if(outline){
      c.fillStyle='rgba(0,0,0,0.9)';
      c.beginPath();
      c.arc(x,y,dot/2+1,0,Math.PI*2);
      c.fill();
    }
    c.fillStyle=color;
    c.beginPath();
    c.arc(x,y,dot/2,0,Math.PI*2);
    c.fill();
  }
}

function renderCross(){
  const cv=document.getElementById('cross-canvas');if(!cv)return;
  const c=cv.getContext('2d');
  const w=cv.width||220;
  const h=cv.height||220;
  c.clearRect(0,0,w,h);
  c.fillStyle='#111';c.fillRect(0,0,w,h);
  drawCrosshairAt(c,w/2,h/2,ch);
}

function syncCrosshairControls(){
  const setValue=(id,value)=>{
    const el=document.getElementById(id);
    if(el)el.value=value;
  };
  setValue('cv-size-input', ch.size);
  setValue('cv-thick-input', ch.thick);
  setValue('cv-gap-input', ch.gap);
  setValue('cv-dot-input', ch.dot);
  setValue('cv-color', ch.color||'#00e5ff');
  const toggle=document.getElementById('cv-outline-toggle');
  if(toggle)toggle.checked=!!Number(ch.outline);
  ['size','thick','gap','dot','outline'].forEach(key=>{
    const label=document.getElementById('cv-'+key);
    if(label)label.textContent=key==='outline'?(Number(ch.outline)?'on':'off'):ch[key];
  });
  document.getElementById('dot-size-row').style.display=ch.type==='dot'?'flex':'none';
  document.querySelectorAll('.ctype-btn').forEach(btn=>{
    const isActive=btn.textContent.trim().toLowerCase().replace(/[^a-z]/g,'')===String(ch.type).replace(/[^a-z]/g,'');
    btn.classList.toggle('on', isActive);
  });
}

function saveCrosshair(){
  currentUser.crosshair=Object.assign({},ch);
  saveU();toast('✓ Crosshair saved!');
}
