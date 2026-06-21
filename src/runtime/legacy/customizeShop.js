// ═══════════════════════════════════════════════
//  CUSTOMIZE / SHOP
// ═══════════════════════════════════════════════
function setCatalogTab(scope,t,btn){
  catalogTabs[scope]=t;
  document.querySelectorAll(`.mkttab[data-scope="${scope}"]`).forEach(b=>b.classList.remove('on'));
  btn?.classList.add('on');
  document.querySelectorAll(`.mkt-sec[data-scope="${scope}"]`).forEach(s=>s.classList.remove('act'));
  document.getElementById(`${scope}-${t}`)?.classList.add('act');
}

function renderShop(){
  if(!currentUser)return;
  renderGrid('shop-grid-balls',BALLS,b=>isOwnedCosmetic('ball',b.id),b=>currentUser.equippedBall===b.id,b=>buyItem('ball',b),b=>equipItem('ball',b),b=>ballPrevHtml(b));
  renderGrid('shop-grid-bgs',BACKGROUNDS,b=>isOwnedCosmetic('bg',b.id),b=>currentUser.equippedBg===b.id,b=>buyItem('bg',b),b=>equipItem('bg',b),b=>`<div class="bg-prev" style="background:${bgPreviewStyle(b)};"></div>`);
  renderGrid('shop-grid-trails',TRAILS,t=>isOwnedCosmetic('trail',t.id),t=>currentUser.equippedTrail===t.id,t=>buyItem('trail',t),t=>equipItem('trail',t),t=>`<div class="bg-prev" style="background:${t.color==='rainbow'?'linear-gradient(135deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f)':t.color};"></div>`);
  renderGrid('shop-grid-fx',FX,f=>isOwnedCosmetic('fx',f.id),f=>currentUser.equippedFx===f.id,f=>buyItem('fx',f),f=>equipItem('fx',f),f=>`<div class="bg-prev" style="background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:22px;">✨</div>`);
  renderGrid('shop-grid-titles',TITLES,t=>isOwnedCosmetic('title',t.id),t=>currentUser.equippedTitle===t.id,t=>buyItem('title',t),t=>equipItem('title',t),t=>`<div class="bg-prev" style="background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--gemlt);">${t.name}</div>`);
  setCatalogTab('shop', catalogTabs.shop, document.querySelector(`.mkttab[data-scope="shop"][data-tab="${catalogTabs.shop}"]`));
}

function renderCustomize(){
  if(!currentUser)return;
  renderGrid('custom-grid-balls',BALLS.filter(b=>isOwnedCosmetic('ball',b.id)),b=>true,b=>currentUser.equippedBall===b.id,null,b=>equipItem('ball',b),b=>ballPrevHtml(b),'No owned ball colors yet.');
  renderGrid('custom-grid-bgs',BACKGROUNDS.filter(b=>isOwnedCosmetic('bg',b.id)),b=>true,b=>currentUser.equippedBg===b.id,null,b=>equipItem('bg',b),b=>`<div class="bg-prev" style="background:${bgPreviewStyle(b)};"></div>`,'No owned backgrounds yet.');
  renderGrid('custom-grid-trails',TRAILS.filter(t=>isOwnedCosmetic('trail',t.id)),t=>true,t=>currentUser.equippedTrail===t.id,null,t=>equipItem('trail',t),t=>`<div class="bg-prev" style="background:${t.color==='rainbow'?'linear-gradient(135deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f)':t.color};"></div>`,'No owned trails yet.');
  renderGrid('custom-grid-fx',FX.filter(f=>isOwnedCosmetic('fx',f.id)),f=>true,f=>currentUser.equippedFx===f.id,null,f=>equipItem('fx',f),f=>`<div class="bg-prev" style="background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:22px;">✨</div>`,'No owned hit effects yet.');
  renderGrid('custom-grid-titles',TITLES.filter(t=>isOwnedCosmetic('title',t.id)),t=>true,t=>currentUser.equippedTitle===t.id,null,t=>equipItem('title',t),t=>`<div class="bg-prev" style="background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--gemlt);">${t.name}</div>`,'No owned titles yet.');
  setCatalogTab('customize', catalogTabs.customize, document.querySelector(`.mkttab[data-scope="customize"][data-tab="${catalogTabs.customize}"]`));
}

function renderGrid(gridId,catalog,ownedFn,equippedFn,buyFn,equipFn,previewFn,emptyText='Nothing to show here yet.'){
  const grid=document.getElementById(gridId);
  if(!grid)return;grid.innerHTML='';
  if(!catalog.length){
    grid.innerHTML=`<div class="lb-empty">${emptyText}</div>`;
    return;
  }
  catalog.forEach((item,idx)=>{
    const owned=ownedFn(item),equipped=equippedFn(item),canBuy=!owned&&currentUser.gems>=item.price;
    const div=document.createElement('div');
    div.className='mkt-item'+(equipped?' eqpd':owned?' owned':'');
    const typeLabel=item.type==='premium'?'✨ Premium':item.type==='special'?'🐾 Special':item.type==='custom'?'⚡ Custom':'Basic';
    const typeColor=item.type==='premium'||item.type==='custom'?'#a855f7':item.type==='special'?'#ff8c00':'#52527a';
    div.innerHTML=`
      ${previewFn(item)}
      <h4>${item.name}</h4>
      <div class="mkt-type" style="color:${typeColor}">${typeLabel}</div>
      <div class="mkt-price">${item.price===0?'<span style="color:var(--green)">FREE</span>':'💎 '+item.price}</div>
    `;
    const btn=document.createElement('button');btn.className='mkt-btn';
    if(equipped){btn.className+=' mb-eqd';btn.textContent='EQUIPPED';btn.disabled=true;}
    else if(owned){btn.className+=' mb-equip';btn.textContent='EQUIP';btn.__legacyClick=()=>{equipFn(item);renderCustomize();renderShop();};}
    else if((canBuy||item.price===0) && buyFn){btn.className+=' mb-buy';btn.textContent=item.price===0?'GET FREE':'BUY';btn.__legacyClick=()=>{buyFn(item);renderCustomize();renderShop();};}
    else{btn.className+=' mb-poor';btn.textContent='NOT ENOUGH 💎';btn.disabled=true;}
    div.appendChild(btn);grid.appendChild(div);
  });
}

function ballPrevHtml(b){
  const bg=b.color==='rainbow'?'linear-gradient(135deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f)':b.color==='neon'?'#001a0d':b.color==='galaxy'?'linear-gradient(135deg,#000044,#3366ff,#aa44ff)':b.color==='lava'?'linear-gradient(135deg,#440000,#cc0000,#ff6600,#ffff00)':b.color;
  return`<div class="ball-prev" style="background:${bg};width:60px;height:60px;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:24px;">${b.isCat?'🐱':''}</div>`;
}

function bgPreviewStyle(bg){
  const m={grid:'repeating-linear-gradient(0deg,transparent,transparent 9px,rgba(0,229,255,0.1) 9px,rgba(0,229,255,0.1) 10px),repeating-linear-gradient(90deg,transparent,transparent 9px,rgba(0,229,255,0.1) 9px,rgba(0,229,255,0.1) 10px),#050510',dots:'radial-gradient(circle,rgba(0,229,255,0.3) 1px,transparent 1px) 0 0/12px 12px,#080818',circuit:'linear-gradient(135deg,#050a05,#001500)',neon_city:'linear-gradient(180deg,#0a001a,#00001a)',galaxy:'radial-gradient(ellipse at center,#3a0066,#010010)',matrix:'linear-gradient(180deg,#000500,#001000)',fire:'linear-gradient(180deg,#0a0000,#400000)',red_neon:'linear-gradient(135deg,#25000e,#56002c,#a30460)',eclipse:'radial-gradient(circle at 40% 40%,#7a00ff 0%,#080010 70%)',aurora:'linear-gradient(180deg,#050927,#2a2c7f,#050c1a)',rain:'linear-gradient(180deg,#041725,#02040f)',vapor:'linear-gradient(135deg,#3f007a,#8700d4,#1b0c4b)'};
  return m[bg.css]||bg.css||'#000';
}

function legacyBuyItemOld(type,item){
  if(item.price>0&&currentUser.gems<item.price){toast('Not enough gems! 💎');return;}
  if(item.price>0)currentUser.gems-=item.price;
  if(type==='ball')currentUser.ownedBalls.push(item.id);
  else if(type==='bg')currentUser.ownedBgs.push(item.id);
  else if(type==='trail')currentUser.ownedTrails.push(item.id);
  else if(type==='fx')currentUser.ownedFx.push(item.id);
  else if(type==='title')currentUser.ownedTitles.push(item.id);
  equipItem(type,item);
  currentUser.purchases=(currentUser.purchases||0)+1;
  qprog('purchases',1);
  playBuy();saveU();updateNav();
  toast(`🎉 Purchased ${item.name}!`);
}

function legacyEquipItem(type,item){
  if(type==='ball')currentUser.equippedBall=item.id;
  else if(type==='bg'){currentUser.equippedBg=item.id; if(item.id==='bg_neon')qprog('bg_neon',1);}
  else if(type==='trail')currentUser.equippedTrail=item.id;
  else if(type==='fx')currentUser.equippedFx=item.id;
  else if(type==='title')currentUser.equippedTitle=item.id;
  saveU();toast('✓ Equipped!');
}
