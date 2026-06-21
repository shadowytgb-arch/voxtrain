// ═══════════════════════════════════════════════
//  NAV / XP
// ═══════════════════════════════════════════════
function updateNav(){
  if(!currentUser)return;
  document.getElementById('nav-gems').textContent=currentUser.gems;
  document.getElementById('nav-user').textContent=currentUser.username;
  const xp=currentUser.xp||0;
  const lvl=Math.floor(xp/200)+1;
  const need=lvl*200;
  const cur=xp%200;
  document.getElementById('nav-level').textContent='Lv '+lvl;
  document.getElementById('nav-xp-label').textContent=cur+' / 200 XP';
  document.getElementById('nav-xp-bar').style.width=Math.round(cur/200*100)+'%';
}

const XP_CURVE_BASE=40;
const XP_CURVE_LINEAR=60;

function xpNeededForLevel(level){
  return Math.max(100,Math.round(XP_CURVE_BASE*Math.pow(level,1.5)+XP_CURVE_LINEAR*level));
}

function getLevelProgress(totalXp){
  let xp=Math.max(0,Math.floor(totalXp||0));
  let level=1;
  let needed=xpNeededForLevel(level);
  while(xp>=needed){
    xp-=needed;
    level++;
    needed=xpNeededForLevel(level);
  }
  return {level,current:xp,needed};
}

function updateNav(){
  if(!currentUser)return;
  document.getElementById('nav-gems').textContent=currentUser.gems;
  document.getElementById('nav-user').textContent=currentUser.username;
  const progress=getLevelProgress(currentUser.xp||0);
  document.getElementById('nav-level').textContent='Lv '+progress.level;
  document.getElementById('nav-xp-label').textContent=progress.current+' / '+progress.needed+' XP';
  document.getElementById('nav-xp-bar').style.width=Math.round(progress.current/progress.needed*100)+'%';
}
