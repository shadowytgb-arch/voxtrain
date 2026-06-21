// ═══════════════════════════════════════════════
//  SENSITIVITY CALC
// ═══════════════════════════════════════════════
function calcSens(){
  const game=parseFloat(document.getElementById('sens-game').value)||360;
  const sens=parseFloat(document.getElementById('sens-val').value)||1;
  const dpi=parseFloat(document.getElementById('sens-dpi').value)||800;
  const edpi=sens*dpi;
  document.getElementById('sens-edpi').value=Math.round(edpi);
  const cmFn=window.computeCm360||((y,e)=>y/(e*0.0254));
  const cm=cmFn(game,edpi).toFixed(2);
  const inch=(game/edpi).toFixed(2);
  document.getElementById('sens-cm').textContent=cm+' cm';
  document.getElementById('sens-inch').textContent=inch+'"';
  const applyLbl=document.getElementById('sens-applied-lbl');
  if(applyLbl) applyLbl.textContent='';
}

function applySensToTrainer(){
  const game=parseFloat(document.getElementById('sens-game').value)||360;
  const sens=parseFloat(document.getElementById('sens-val').value)||1;
  const dpi=parseFloat(document.getElementById('sens-dpi').value)||800;
  const edpi=sens*dpi;
  const cmFn=window.computeCm360||((y,e)=>y/(e*0.0254));
  const cm360=cmFn(game,edpi);
  const mapped=window.cm360ToTrainerSens?window.cm360ToTrainerSens(cm360):Math.max(0.1,Math.min(2,16/cm360));
  threeSens=mapped;
  localStorage.setItem('vox_sens', mapped);
  localStorage.setItem('vox_sens_cm360', cm360.toFixed(2));
  localStorage.setItem('vox_sens_game', document.getElementById('sens-game').value);
  localStorage.setItem('vox_sens_val', sens);
  localStorage.setItem('vox_sens_dpi', dpi);
  const setSens=document.getElementById('set-sens');
  const setSensLbl=document.getElementById('set-sens-lbl');
  if(setSens) setSens.value=mapped;
  if(setSensLbl) setSensLbl.textContent=mapped;
  const applyLbl=document.getElementById('sens-applied-lbl');
  if(applyLbl) applyLbl.textContent=`Applied ${mapped} trainer sens (${cm360.toFixed(1)} cm/360°)`;
  toast?.(`Sensitivity applied: ${mapped} (${cm360.toFixed(1)} cm/360°)`);
}

function loadSensFromStorage(){
  try{
    const game=localStorage.getItem('vox_sens_game');
    const sens=localStorage.getItem('vox_sens_val');
    const dpi=localStorage.getItem('vox_sens_dpi');
    if(game) document.getElementById('sens-game').value=game;
    if(sens) document.getElementById('sens-val').value=sens;
    if(dpi) document.getElementById('sens-dpi').value=dpi;
    calcSens();
    const applyLbl=document.getElementById('sens-applied-lbl');
    const cm=localStorage.getItem('vox_sens_cm360');
    if(applyLbl&&cm) applyLbl.textContent=`Trainer sens: ${localStorage.getItem('vox_sens')||'—'} (${cm} cm/360°)`;
  }catch(e){}
}

loadSensFromStorage();
