function bind3DInput(){
  const threeCanvas=document.getElementById('threejs-canvas');
  if(!threeCanvas||threeInputBound)return;
  threeInputBound=true;

  threeCanvas.addEventListener('contextmenu', e => e.preventDefault());
  threeCanvas.addEventListener('mousedown', e => {
    if(e.button!==0)return;
    if(!gameRunning||!is3DMode()||!document.getElementById('pg-game').classList.contains('act'))return;
    if(document.pointerLockElement!==threeCanvas){
      threeCanvas.requestPointerLock?.();
      return;
    }
    shoot3D();
  });

  document.addEventListener('mousemove', e => {
    if(!gameRunning||!is3DMode())return;
    if(document.pointerLockElement!==threeCanvas)return;
    const dx=Number.isFinite(e.movementX)?e.movementX:0;
    const dy=Number.isFinite(e.movementY)?e.movementY:0;
    if(!dx&&!dy)return;
    update3DCameraRotation(dx,dy);
  });
}
