// ═══════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════
function setLoginMode(m){
  loginMode=m;
  document.getElementById('ltab-login').classList.toggle('on',m==='login');
  document.getElementById('ltab-reg').classList.toggle('on',m==='register');
  document.getElementById('l-pass2').style.display=m==='register'?'block':'none';
  document.getElementById('l-submit').textContent=m==='register'?'CREATE ACCOUNT':'LOG IN';
  document.getElementById('l-err').textContent='';
}

async function doAuth(){
  const un=document.getElementById('l-user').value.trim();
  const pw=document.getElementById('l-pass').value;
  const pw2=document.getElementById('l-pass2').value;
  const err=document.getElementById('l-err');
  try{
  if(!un){err.textContent='Enter a username.';return;}
  if(!pw){err.textContent='Enter a password.';return;}
  if(loginMode==='register'){
    if(un.length<3){err.textContent='Username must be 3+ characters.';return;}
    if(!isValidUsername(un)){err.textContent='Use letters, numbers, and underscores only.';return;}
    if(pw.length<4){err.textContent='Password must be 4+ characters.';return;}
    if(pw!==pw2){err.textContent='Passwords do not match.';return;}
    if(await getUAsync(un)){err.textContent='Username already taken.';return;}
    currentUser=newUser(un,'password');
    const authSaved=await dbSavePasswordAuth(currentUser.username, pw);
    if(!authSaved){err.textContent='Unable to create your account right now.';return;}
    saveU();
  } else {
    const localRaw=getRawU(un);
    const user=ensureUserShape(localRaw);
    if(user && user.googleUid && user.authProvider==='google'){err.textContent='This account uses an unavailable sign-in method.';return;}
    let authRecord=await dbLoadUserAuthByUsername(un);
    let valid=false;
    const legacyUser=localRaw&&localRaw.password?localRaw:null;
    if(legacyUser&&legacyUser.password){
      valid=legacyUser.password===pw;
      if(valid){
        await migrateLegacyPasswordAccount(legacyUser, pw);
        authRecord=await dbLoadUserAuthByUsername(legacyUser.username);
      }
    }
    if(!valid && authRecord){
      valid=await verifyPasswordRecord(authRecord, pw);
    }
    if(!valid){err.textContent='Invalid username or password.';return;}
    currentUser=ensureUserShape(user);
    saveU();
  }
  checkDailyLogin();
  err.textContent='';
  document.getElementById('l-user').value='';
  document.getElementById('l-pass').value='';
  document.getElementById('l-pass2').value='';
  onLogin();
  }catch(e){
    console.warn('Auth failed', e);
    err.textContent=e&&e.message?e.message:'Unable to sign you in right now.';
  }
}

function checkDailyLogin(){
  const today=new Date().toDateString();
  if(currentUser.lastLogin===today)return;
  const yesterday=new Date(Date.now()-86400000).toDateString();
  if(currentUser.lastLogin===yesterday){
    currentUser.loginStreak=(currentUser.loginStreak||0)+1;
  } else if(currentUser.lastLogin!==today){
    currentUser.loginStreak=1;
  }
  currentUser.lastLogin=today;
  if(!currentUser.loginDays)currentUser.loginDays=[];
  currentUser.loginDays.push(today);
  const bonusMap=[25,25,25,50,50,50,200];
  const day=Math.min((currentUser.loginStreak||1),7)-1;
  const bonus=bonusMap[day];
  currentUser.gems+=bonus;
  saveU();
  setTimeout(()=>toast(`🗓 Day ${currentUser.loginStreak} login! +${bonus} 💎 Gems`),800);
}

function onLogin(){
  document.getElementById('main-nav').style.display='flex';
  document.getElementById('pg-login').classList.remove('act');
  if(currentUser.audio){
    Object.keys(currentUser.audio).forEach(k=>{
      const value=currentUser.audio[k] ?? defaultAudio()[k];
      VOL[k]=value/100;
      const el=document.getElementById('vol-'+k);
      if(el)el.value=value;
      const lbl=document.getElementById('vol-'+k+'-lbl');
      if(lbl)lbl.textContent=value+'%';
    });
  }
  colorblindMode=currentUser.colorblind||false;
  document.getElementById('cb-mode').checked=colorblindMode;
  localStorage.setItem('vxt_last', currentUser.username);
  updateNav();
  flushNotifications();
  populateDuelInvites();
  checkSpectateInvites();
  showPage('menu');
  calcSens();
}

function logout(){
  stopGame();
  currentUser=null;
  currentDuelId=null;
  currentDuelTitle='';
  modeDurationOverride=null;
  localStorage.removeItem('vxt_last');
  document.exitPointerLock?.();
  document.getElementById('main-nav').style.display='none';
  document.querySelectorAll('.spage').forEach(p=>p.classList.remove('act'));
  document.getElementById('pg-game').classList.remove('act');
  document.getElementById('pg-login').classList.add('act');
}
