// ═══════════════════════════════════════════════
//  STORAGE
// ═══════════════════════════════════════════════
var localDBCache=null;
function getDB(){
  if(localDBCache) return localDBCache;
  try{localDBCache=JSON.parse(localStorage.getItem('vxtrain')||'{}');}catch(e){localDBCache={};}
  return localDBCache;
}
function saveDB(db){
  localDBCache=db;
  try{localStorage.setItem('vxtrain', JSON.stringify(db));}catch(e){console.warn('Failed to save local DB', e);}
}
function saveU(){
  if(!currentUser)return;
  currentUser=ensureUserShape(currentUser);
  dbSaveUser(currentUser);
}

async function migrateLegacyPasswordAccount(user, password){
  if(!user||!password)return false;
  user=ensureUserShape(user);
  const authRecord=await dbSavePasswordAuth(user.username, password);
  if(!authRecord)return false;
  delete user.password;
  user.authProvider='password';
  cacheUser(user);
  if(currentUser&&dbUserKey(currentUser.username)===dbUserKey(user.username)){
    currentUser=user;
  }
  await dbSaveUser(user);
  return true;
}

function syncResolvedName(list, originalName, nextName){
  return uniqueStrings((Array.isArray(list)?list:[]).map(name=>{
    return dbUserKey(name)===dbUserKey(originalName)?nextName:name;
  }));
}

async function updateUserRecord(username, mutate){
  const canonical=await resolveCanonicalUsername(username);
  if(!canonical)return null;
  let user=getU(canonical);
  if(!user){
    user=await dbLoadUserByUsername(canonical);
  }
  if(!user)return null;
  user=ensureUserShape(user);
  mutate(user);
  cacheUser(user);
  if(currentUser&&dbUserKey(currentUser.username)===dbUserKey(user.username)){
    currentUser=user;
  }
  await dbSaveUser(user);
  return user;
}

async function notifyUser(username, notification){
  return updateUserRecord(username,u=>{
    u.notifications=u.notifications||[];
    u.notifications.push(Object.assign({seen:false,ts:Date.now()}, notification));
  });
}
