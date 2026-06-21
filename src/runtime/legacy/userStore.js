// ═══════════════════════════════════════════════
//  LOCAL DATA + AUTH HELPERS
// ═══════════════════════════════════════════════
const PASSWORD_HASH_ITERATIONS = 120000;
const MAX_PROFILE_IMAGE_BYTES = 262144;

function dbUserKey(username){
  return (username||'').trim().toLowerCase();
}

function cloneJSON(value){
  if(value===null||value===undefined)return value;
  return JSON.parse(JSON.stringify(value));
}

function uniqueStrings(values){
  return [...new Set((Array.isArray(values)?values:[]).filter(Boolean).map(v=>String(v)))];
}

function defaultCrosshair(){
  return {type:'cross',size:12,thick:2,gap:4,dot:4,color:'#00e5ff',outline:1};
}

function defaultAudio(){
  return {master:80,hit:100,miss:100};
}

function getDbAliases(){
  const db=getDB();
  if(!db.aliases)db.aliases={};
  return db.aliases;
}

function getUserAuthStore(){
  const db=getDB();
  if(!db.userAuth)db.userAuth={};
  return db.userAuth;
}

function setCachedAlias(oldName,newName){
  const oldKey=dbUserKey(oldName);
  const next=(newName||'').trim();
  if(!oldKey||!next)return;
  const aliases=getDbAliases();
  aliases[oldKey]=next;
  saveDB(getDB());
}

function clearCachedAlias(oldName){
  const aliases=getDbAliases();
  delete aliases[dbUserKey(oldName)];
  saveDB(getDB());
}

function resolveCachedUsername(username){
  let current=(username||'').trim();
  const aliases=getDbAliases();
  const seen=new Set();
  while(current){
    const key=dbUserKey(current);
    if(seen.has(key)||!aliases[key])break;
    seen.add(key);
    current=aliases[key];
  }
  return current;
}

async function resolveCanonicalUsername(username){
  return resolveCachedUsername(username);
}

function newUser(un, provider='password'){
  return{
    username:un,
    gems:500,xp:0,
    totalScore:0,gamesPlayed:0,bestAcc:0,totalHits:0,bestStreak:0,
    avgReact:null,reactAttempts:[],
    ownedBalls:['white'],equippedBall:'white',
    ownedBgs:['bg_black'],equippedBg:'bg_black',
    ownedTrails:['none'],equippedTrail:'none',
    ownedFx:['burst'],equippedFx:'burst',
    ownedTitles:['Recruit'],equippedTitle:'Recruit',
    crosshair:defaultCrosshair(),
    quests:buildQuests(),
    history:[],
    modeBests:{},
    modesPlayed:[],
    friends:[],
    friendRequests:[],
    notifications:[],
    pendingSpectate:[],
    spectateInvites:[],
    loginStreak:0,lastLogin:null,loginDays:[],
    purchases:0,
    audio:defaultAudio(),
    colorblind:false,
    authProvider:provider,
    googleUid:null,
    email:null,
    customAvatar:'🎯'
  };
}

function ensureUserShape(user){
  if(!user||!user.username)return null;
  const provider=user.googleUid?'google':(user.authProvider||'password');
  const next=Object.assign(newUser(String(user.username).trim(), provider), cloneJSON(user));
  next.username=String(next.username).trim();
  next.authProvider=next.googleUid?'google':(next.authProvider||'password');
  next.ownedBalls=uniqueStrings(next.ownedBalls);
  next.ownedBgs=uniqueStrings(next.ownedBgs);
  next.ownedTrails=uniqueStrings(next.ownedTrails);
  next.ownedFx=uniqueStrings(next.ownedFx);
  next.ownedTitles=uniqueStrings(next.ownedTitles);
  next.friends=uniqueStrings(next.friends);
  next.loginDays=uniqueStrings(next.loginDays);
  next.modesPlayed=uniqueStrings(next.modesPlayed);
  next.crosshair=Object.assign(defaultCrosshair(), next.crosshair||{});
  next.audio=Object.assign(defaultAudio(), next.audio||{});
  next.history=Array.isArray(next.history)?next.history:[];
  next.modeBests=next.modeBests&&typeof next.modeBests==='object'?next.modeBests:{};
  next.friendRequests=Array.isArray(next.friendRequests)?next.friendRequests:[];
  next.notifications=Array.isArray(next.notifications)?next.notifications:[];
  next.pendingSpectate=Array.isArray(next.pendingSpectate)?next.pendingSpectate:[];
  next.spectateInvites=Array.isArray(next.spectateInvites)?next.spectateInvites:[];
  next.reactAttempts=Array.isArray(next.reactAttempts)?next.reactAttempts:[];
  const freshQuests=buildQuests();
  const existingQuests=Array.isArray(next.quests)?next.quests:[];
  next.quests=freshQuests.map(q=>Object.assign({}, q, existingQuests.find(old=>old.id===q.id)||{}));
  return next;
}

function sanitizeUserRecord(user){
  const next=ensureUserShape(user);
  if(!next)return null;
  delete next.password;
  delete next.passwordHash;
  delete next.passwordSalt;
  delete next.authVersion;
  delete next.email;
  return next;
}

function cacheUser(user){
  const clean=sanitizeUserRecord(user);
  if(!clean)return null;
  const db=getDB();
  if(!db.users)db.users={};
  db.users[dbUserKey(clean.username)]=clean;
  saveDB(db);
  return clean;
}

function removeCachedUser(username){
  const db=getDB();
  if(db.users)delete db.users[dbUserKey(username)];
  saveDB(db);
}

function getRawU(un){
  const db=getDB();
  const key=dbUserKey(resolveCachedUsername(un));
  return(db.users&&db.users[key])||null;
}

function getU(un){
  const raw=getRawU(un);
  return raw?sanitizeUserRecord(raw):null;
}

function bytesToHex(buffer){
  return Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function makeSalt(bytes=16){
  const raw=new Uint8Array(bytes);
  crypto.getRandomValues(raw);
  return Array.from(raw).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function hashPassword(password, salt){
  if(!(crypto&&crypto.subtle)){
    throw new Error('Secure password hashing is unavailable in this browser context.');
  }
  const enc=new TextEncoder();
  const key=await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits=await crypto.subtle.deriveBits({
    name:'PBKDF2',
    salt:enc.encode(salt),
    iterations:PASSWORD_HASH_ITERATIONS,
    hash:'SHA-256'
  }, key, 256);
  return bytesToHex(bits);
}

async function verifyPasswordRecord(record, password){
  if(!record||!record.passwordHash||!record.salt)return false;
  const hash=await hashPassword(password, record.salt);
  return hash===record.passwordHash;
}

async function dbLoadRawUserByUsername(username){
  const resolved=await resolveCanonicalUsername(username);
  if(!resolved)return null;
  return cloneJSON(getRawU(resolved));
}

async function dbLoadUserByUsername(username){
  const raw=await dbLoadRawUserByUsername(username);
  return raw ? sanitizeUserRecord(raw) : null;
}

async function getUAsync(un){
  return getU(un);
}

async function dbLoadUserByUid(uid){
  return getUByUid(uid);
}

async function dbSaveUser(user){
  const clean=sanitizeUserRecord(user);
  if(!clean)return null;
  clean.updatedAt=Date.now();
  cacheUser(clean);
  return clean;
}

async function dbDeleteUser(username){
  removeCachedUser(username);
}

async function dbLoadUserAuthByUsername(username){
  const resolved=await resolveCanonicalUsername(username);
  if(!resolved)return null;
  const store=getUserAuthStore();
  const record=store[dbUserKey(resolved)];
  return record?Object.assign({username:resolved}, cloneJSON(record)):null;
}

async function dbSavePasswordAuthRecord(username, record){
  const clean={
    username,
    salt:record.salt,
    passwordHash:record.passwordHash,
    authVersion:1,
    updatedAt:Date.now()
  };
  const db=getDB();
  const store=getUserAuthStore();
  store[dbUserKey(username)]=clean;
  saveDB(db);
  return clean;
}

async function dbSavePasswordAuth(username, password){
  const salt=makeSalt();
  const record={
    salt,
    passwordHash:await hashPassword(password, salt)
  };
  return dbSavePasswordAuthRecord(username, record);
}

async function dbDeletePasswordAuth(username){
  const db=getDB();
  if(db.userAuth)delete db.userAuth[dbUserKey(username)];
  saveDB(db);
}

async function dbSaveAlias(oldName, newName){
  setCachedAlias(oldName,newName);
}

async function dbSaveLeaderboardEntry(mode, entry){
  return Object.assign({mode,ts:entry.ts||Date.now()}, entry);
}

async function dbGetLBData(mode, time){
  return [];
}

async function dbGetLegacyLBData(mode, time){
  return [];
}

// Get user's best ranking across all modes
async function legacyGetUserTopRankingA(username){
  try{
    const modes=Object.keys(MODES)||[];
    let bestRank=null;
    for(const mode of modes){
      const lb=await getLBData(mode,'alltime');
      if(!lb)continue;
      const rankIdx=lb.findIndex(entry=>entry.user&&entry.user.toLowerCase()===username.toLowerCase());
      if(rankIdx>=0&&rankIdx<=2){
        const rank=rankIdx+1;
        if(!bestRank||rank<bestRank)bestRank=rank;
        if(rank===1)break; // Found #1, no need to search further
      }
    }
    return bestRank;
  }catch(e){
    console.warn('Failed to get user ranking', e);
    return null;
  }
}

function legacyGetTrophyEmojiA(rank){
  if(rank===1)return '🥇'; // Gold
  if(rank===2)return '🥈'; // Silver
  if(rank===3)return '🥉'; // Bronze
  return null;
}

async function getUserTopRanking(username){
  try{
    const modes=Object.keys(MODES)||[];
    let bestRank=null;
    for(const mode of modes){
      const lb=await getLBData(mode,'alltime');
      if(!lb)continue;
      const rankIdx=lb.findIndex(entry=>entry.user&&dbUserKey(entry.user)===dbUserKey(username));
      if(rankIdx>=0&&rankIdx<=2){
        const rank=rankIdx+1;
        if(!bestRank||rank<bestRank)bestRank=rank;
        if(rank===1)break;
      }
    }
    return bestRank;
  }catch(e){
    console.warn('Failed to get user ranking', e);
    return null;
  }
}

function legacyGetTrophyEmoji(rank){
  if(rank===1)return '🥇';
  if(rank===2)return '🥈';
  if(rank===3)return '🥉';
  return null;
}

function getTrophyEmoji(rank){
  if(rank===1)return '\u{1F947}';
  if(rank===2)return '\u{1F948}';
  if(rank===3)return '\u{1F949}';
  return null;
}

async function dbSaveDuel(duel){
  const db=getDB();
  if(!Array.isArray(db.duels))db.duels=Object.values(db.duels||{});
  const idx=db.duels.findIndex(entry=>entry.id===duel.id);
  if(idx>=0)db.duels[idx]=cloneJSON(duel);
  else db.duels.push(cloneJSON(duel));
  saveDB(db);
}

async function dbLoadDuels(){
  const db=getDB();
  const duels=Array.isArray(db.duels)?db.duels.slice():Object.values(db.duels||{});
  return duels.sort((a,b)=>(b.ts||0)-(a.ts||0));
}

async function signInWithGoogle(){
  const msg='External sign-in is unavailable in local mode.';
  const err=document.getElementById('l-err');
  if(err)err.textContent=msg;
  toast(msg);
}

function getUByUid(uid){
  const db = getDB();
  if(!db.users) return null;
  const match=Object.values(db.users).find(u => u.googleUid === uid);
  return match?sanitizeUserRecord(match):null;
}
