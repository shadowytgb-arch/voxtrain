// ═══════════════════════════════════════════════
// PROFILE EDITING - BLOCKLIST & VALIDATION
// ═══════════════════════════════════════════════
const USERNAME_BLOCKLIST=[
  'nigger','nigga','niggas','niggaz','niggas',
  'fuck','fucker','fucking','fucks',
  'cummer','cummers','cumming',
  'racist','racism','sexism','sexist',
  'hate','hater','hateful','hateful',
  'slut','slutty','whore','bitch',
  'asshole','bastard','dick','cock',
  'retard','retarded','gay','fag','faggot'
];

function isValidUsername(name){
  if(!name||name.length<1||name.length>25)return false;
  const lower=name.toLowerCase();
  // Check exact blocklist matches
  if(USERNAME_BLOCKLIST.some(b=>lower===b))return false;
  // Check for blocklist substrings (3+ chars)
  if(USERNAME_BLOCKLIST.some(b=>b.length>=3&&lower.includes(b)))return false;
  // Check for common variations
  const suspicious=/[^a-z0-9_]/gi.test(lower);
  if(suspicious)return false;
  return true;
}

async function legacyRenameUserA(newName){
  if(!currentUser){toast('Not logged in.');return false;}
  if(!isValidUsername(newName)){toast('Invalid or inappropriate username.');return false;}
  newName=newName.trim();
  const oldName=currentUser.username;
  const nameLower=newName.toLowerCase();
  if(nameLower===dbUserKey(currentUser.username)){toast('That is already your username.');return false;}
  if(currentUser.gems<500){toast('You need 500 gems to change your username. 💎');return false;}
  // Check if username is taken
  const check=await getUAsync(newName);
  if(check){toast('That username is taken.');return false;}
  // Proceed with rename
  currentUser.gems-=500;
  const newDoc={...currentUser, username:newName};
  // Remove old user entry
  const db=getDB();
  if(db.users&&db.users[currentUser.username.toLowerCase()]){
    delete db.users[currentUser.username.toLowerCase()];
  }
  // Add new user entry
  if(!db.users)db.users={};
  db.users[nameLower]=newDoc;
  saveDB(db);
  currentUser.username=newName;
  await dbSaveUser(currentUser);
  // Update nav display
  document.getElementById('nav-gems').textContent=currentUser.gems;
  document.getElementById('nav-user').textContent=currentUser.username;
  refreshProfile();
  toast(`Username changed to ${newName}! 🎯`);
  return true;
}

async function renameUser(newName){
  if(!currentUser){toast('Not logged in.');return false;}
  if(!isValidUsername(newName)){toast('Invalid or inappropriate username.');return false;}
  newName=newName.trim();
  const oldName=currentUser.username;
  if(dbUserKey(newName)===dbUserKey(oldName)){toast('That is already your username.');return false;}
  if(currentUser.gems<500){toast('You need 500 gems to change your username.');return false;}
  const check=await getUAsync(newName);
  if(check){toast('That username is taken.');return false;}
  let authRecord=null;
  if(currentUser.authProvider==='password'){
    authRecord=await dbLoadUserAuthByUsername(oldName);
  }
  currentUser.gems-=500;
  currentUser.username=newName;
  currentUser.friends=syncResolvedName(currentUser.friends, oldName, newName);
  cacheUser(currentUser);
  removeCachedUser(oldName);
  await dbSaveUser(currentUser);
  await dbSaveAlias(oldName,newName);
  if(authRecord){
    await dbSavePasswordAuthRecord(newName, authRecord);
    await dbDeletePasswordAuth(oldName);
  }
  await dbDeleteUser(oldName);
  for(const [mode,best] of Object.entries(currentUser.modeBests||{})){
    await dbSaveLeaderboardEntry(mode,{
      user:newName,
      score:best.score||0,
      acc:best.acc||0,
      grade:calcGrade(best.acc||0,best.score||0),
      ts:Date.now()
    });
  }
  localStorage.setItem('vxt_last', currentUser.username);
  updateNav();
  refreshProfile();
  toast(`Username changed to ${newName}.`);
  return true;
}

async function setAvatar(avatarText){
  if(!currentUser){toast('Not logged in.');return false;}
  if(!avatarText||avatarText.length===0){toast('Avatar cannot be empty.');return false;}
  avatarText=avatarText.trim().substring(0,5);
  currentUser.customAvatar=avatarText;
  saveU();
  refreshProfile();
  toast('Avatar updated! ✨');
  return true;
}

function legacyUploadProfilePicA(input){
  if(!input.files||input.files.length===0)return;
  const file=input.files[0];
  if(file.size>2097152){toast('Image too large. Max 2MB.');input.value='';return;}
  const reader=new FileReader();
  reader.onload=function(e){
    const base64=e.target.result;
    currentUser.profileImage=base64;
    document.getElementById('pic-preview').innerHTML=`<img src="${base64}" style="width:100%;height:100%;object-fit:cover;">`;
    refreshProfile();
  };
  reader.readAsDataURL(file);
}

function uploadProfilePic(input){
  if(!input.files||input.files.length===0)return;
  const file=input.files[0];
  if(file.size>MAX_PROFILE_IMAGE_BYTES){
    toast('Image too large. Max 256KB.');
    input.value='';
    return;
  }
  const reader=new FileReader();
  reader.onload=function(e){
    const base64=e.target.result;
    currentUser.profileImage=base64;
    document.getElementById('pic-preview').innerHTML=`<img src="${base64}" style="width:100%;height:100%;object-fit:cover;">`;
    refreshProfile();
  };
  reader.readAsDataURL(file);
}

function clearProfilePic(){
  delete currentUser.profileImage;
  document.getElementById('prof-pic-upload').value='';
  document.getElementById('pic-preview').innerHTML='<div style="color:var(--muted);font-size:12px;">No image selected</div>';
  document.getElementById('prof-avatar').innerHTML='🎯';
  saveU();
  refreshProfile();
  toast('Profile picture cleared! 🗑️');
}

async function toggleProfileEdit(){
  const editMode=document.getElementById('prof-edit-mode');
  const viewMode=document.getElementById('prof-view-mode');
  if(editMode.style.display==='none'){
    editMode.style.display='block';
    viewMode.style.display='none';
    // Populate edit fields
    document.getElementById('prof-edit-username').value=currentUser.username;
    document.getElementById('prof-edit-avatar').value=currentUser.customAvatar||'🎯';
    // Show preview if image exists
    const preview=document.getElementById('pic-preview');
    if(currentUser.profileImage){
      preview.innerHTML=`<img src="${currentUser.profileImage}" style="width:100%;height:100%;object-fit:cover;">`;
    }else{
      preview.innerHTML='<div style="color:var(--muted);font-size:12px;">No image selected</div>';
    }
  }else{
    editMode.style.display='none';
    viewMode.style.display='block';
  }
}

function showRenameConfirm(){
  const newUsername=document.getElementById('prof-edit-username').value.trim();
  const newAvatar=document.getElementById('prof-edit-avatar').value.trim();
  const usernameChanged=newUsername!==currentUser.username;
  const avatarChanged=newAvatar!==currentUser.customAvatar;
  if(!usernameChanged&&!avatarChanged){
    toast('No changes made.');
    return;
  }
  if(usernameChanged&&!isValidUsername(newUsername)){
    toast('Invalid or inappropriate username.');
    return;
  }
  // Show confirmation modal
  const modal=document.createElement('div');
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
  modal.innerHTML=`
    <div style="background:var(--bg);border:2px solid var(--accent);border-radius:8px;padding:24px;max-width:400px;text-align:center;">
      <h2 style="color:var(--accent);margin:0 0 16px 0;font-family:Rajdhani;font-size:20px;">Confirm Changes</h2>
      <div style="color:var(--text);margin-bottom:20px;font-size:14px;">
        ${usernameChanged?`<div>💎 <strong>Username Change:</strong> 500 gems will be deducted</div>`:``}
        ${avatarChanged?`<div>✨ <strong>Avatar:</strong> Will be updated to <strong>${newAvatar}</strong></div>`:``}
      </div>
      <div style="display:flex;gap:12px;">
        <button class="fr-btn" style="flex:1;" data-legacy-click="this.parentElement.parentElement.parentElement.remove()">✕ CANCEL</button>
        <button class="fr-btn primary" style="flex:1;" data-legacy-click="applyProfileChanges();this.parentElement.parentElement.parentElement.remove()">✓ CONFIRM</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function applyProfileChanges(){
  const newUsername=document.getElementById('prof-edit-username').value.trim();
  const newAvatar=document.getElementById('prof-edit-avatar').value.trim();
  if(newUsername!==currentUser.username){
    if(!await renameUser(newUsername))return;
  }
  if(newAvatar!==currentUser.customAvatar){
    await setAvatar(newAvatar);
  }
  // Final save to ensure profile image is persisted
  saveU();
  document.getElementById('prof-edit-mode').style.display='none';
  document.getElementById('prof-view-mode').style.display='block';
}
