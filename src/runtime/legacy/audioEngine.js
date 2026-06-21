// ═══════════════════════════════════════════════
//  AUDIO ENGINE
// ═══════════════════════════════════════════════
let actx=null;
const VOL={master:0.8,hit:1,miss:1};

function gac(){if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();return actx;}

function boop(freq,type,dur,vol,ramp){
  try{
    const c=gac(),o=c.createOscillator(),g=c.createGain();
    o.connect(g);g.connect(c.destination);
    o.type=type||'sine';o.frequency.setValueAtTime(freq,c.currentTime);
    if(ramp)o.frequency.exponentialRampToValueAtTime(ramp,c.currentTime+dur);
    const v=(vol||0.3)*VOL.master;
    g.gain.setValueAtTime(v,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
    o.start();o.stop(c.currentTime+dur);
  }catch(e){}
}

function playHit(){if(VOL.hit>0)boop(880,'sine',0.08,0.28*VOL.hit,380);}
function playMiss(){if(VOL.miss>0)boop(180,'sawtooth',0.12,0.15*VOL.miss,80);}
function playBuy(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>boop(f,'sine',0.14,0.18),i*80));}
function playClaim(){[330,440,554,659,880].forEach((f,i)=>setTimeout(()=>boop(f,'sine',0.12,0.2),i*60));}
function playCD(){boop(660,'sine',0.08,0.2);}
function playGo(){[440,554,659].forEach((f,i)=>setTimeout(()=>boop(f,'sine',0.12,0.25),i*55));}
function playStreak(){boop(1200,'sine',0.15,0.3,800);}

function setVol(k,v){
  VOL[k]=v/100;
  document.getElementById('vol-'+k+'-lbl').textContent=v+'%';
  if(currentUser){currentUser.audio=currentUser.audio||{};currentUser.audio[k]=v;saveU();}
}
