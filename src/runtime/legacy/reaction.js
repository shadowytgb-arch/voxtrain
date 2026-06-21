// ═══════════════════════════════════════════════
//  REACTION TEST
// ═══════════════════════════════════════════════
var reactState='idle',reactTimeout=null,reactStart=0;
var reactResults=[];

function reactClick(){
  if(reactState==='idle'||reactState==='result'){
    reactState='waiting';
    const box=document.getElementById('react-box');
    box.className='wait';
    document.getElementById('react-msg').textContent='Wait for green...';
    document.getElementById('react-msg').style.color='var(--muted)';
    const delay=1500+Math.random()*3000;
    reactTimeout=setTimeout(()=>{
      box.className='go';
      document.getElementById('react-msg').textContent='CLICK NOW!';
      document.getElementById('react-msg').style.color='var(--green)';
      reactStart=performance.now();
      reactState='go';
    },delay);
  } else if(reactState==='waiting'){
    clearTimeout(reactTimeout);
    reactState='early';
    const box=document.getElementById('react-box');
    box.className='early';
    document.getElementById('react-msg').textContent='Too early! Click to try again.';
    document.getElementById('react-msg').style.color='var(--a2)';
  } else if(reactState==='go'){
    const rt=Math.round(performance.now()-reactStart);
    reactResults.push(rt);
    reactState='result';
    const box=document.getElementById('react-box');
    box.className='';
    document.getElementById('react-msg').textContent=rt+'ms — Click to go again';
    document.getElementById('react-msg').style.color=rt<200?'var(--green)':rt<300?'var(--accent)':'var(--text)';
    updateReactStats();
    if(currentUser){
      currentUser.reactAttempts=currentUser.reactAttempts||[];
      currentUser.reactAttempts.push(rt);
      const all=currentUser.reactAttempts;
      currentUser.avgReact=Math.round(all.reduce((a,b)=>a+b,0)/all.length);
      if(currentUser.avgReact<250)qprog('react250',1);
      if(currentUser.avgReact<200)qprog('react200',1);
      saveU();
    }
  }
}

function updateReactStats(){
  if(!reactResults.length)return;
  const avg=Math.round(reactResults.reduce((a,b)=>a+b,0)/reactResults.length);
  const best=Math.min(...reactResults);
  const worst=Math.max(...reactResults);
  document.getElementById('rt-avg').textContent=avg+'ms';
  document.getElementById('rt-best').textContent=best+'ms';
  document.getElementById('rt-worst').textContent=worst+'ms';
  document.getElementById('rt-cnt').textContent=reactResults.length;
  const h=document.getElementById('react-hist');h.innerHTML='';
  reactResults.slice(-10).forEach(r=>{
    const p=document.createElement('div');p.className='react-attempt';
    p.style.color=r<200?'var(--green)':r<300?'var(--accent)':'var(--a2)';
    p.textContent=r+'ms';h.appendChild(p);
  });
}

function resetReact(){
  reactResults=[];reactState='idle';
  clearTimeout(reactTimeout);
  const box=document.getElementById('react-box');box.className='';
  document.getElementById('react-msg').textContent='Click to Start';
  document.getElementById('react-msg').style.color='var(--muted)';
  ['rt-avg','rt-best','rt-worst'].forEach(id=>document.getElementById(id).textContent='—');
  document.getElementById('rt-cnt').textContent='0';
  document.getElementById('react-hist').innerHTML='';
}
