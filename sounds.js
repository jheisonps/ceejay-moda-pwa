// ── SONS ──────────────────────────────────────────────────────────────────────
let _actx=null;
function getCtx(){
  if(!_actx)_actx=new(window.AudioContext||window.webkitAudioContext)();
  if(_actx.state==='suspended')_actx.resume();
  return _actx;
}
function playClick(){
  try{
    const ctx=getCtx(),t=ctx.currentTime;
    const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
    f.type='lowpass';f.frequency.value=1800;
    o.connect(f);f.connect(g);g.connect(ctx.destination);
    o.type='sine';
    o.frequency.setValueAtTime(1300,t);
    o.frequency.exponentialRampToValueAtTime(550,t+0.13);
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(0.15,t+0.01);
    g.gain.exponentialRampToValueAtTime(0.001,t+0.16);
    o.start(t);o.stop(t+0.18);
  }catch(e){}
}
function playBonus(){
  try{
    const ctx=getCtx(),t=ctx.currentTime;
    [0,0.1,0.2].forEach((d,i)=>{
      const freq=[1047,1319,1568][i];
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.type='triangle';o.frequency.value=freq;
      g.gain.setValueAtTime(0.13,t+d);
      g.gain.exponentialRampToValueAtTime(0.001,t+d+0.28);
      o.start(t+d);o.stop(t+d+0.3);
    });
  }catch(e){}
}
function playCash(){
  try{
    const ctx=getCtx(),t=ctx.currentTime;
    [0,0.07,0.14,0.22,0.31].forEach((delay,i)=>{
      const freq=[1800,2200,1600,2000,2400][i];
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.type='triangle';
      o.frequency.setValueAtTime(freq,t+delay);
      o.frequency.exponentialRampToValueAtTime(freq*0.5,t+delay+0.18);
      g.gain.setValueAtTime(0.11,t+delay);
      g.gain.exponentialRampToValueAtTime(0.001,t+delay+0.22);
      o.start(t+delay);o.stop(t+delay+0.25);
    });
    const ob=ctx.createOscillator(),gb=ctx.createGain();
    ob.connect(gb);gb.connect(ctx.destination);
    ob.type='sine';ob.frequency.value=880;
    gb.gain.setValueAtTime(0.18,t+0.4);
    gb.gain.exponentialRampToValueAtTime(0.001,t+0.95);
    ob.start(t+0.4);ob.stop(t+1.0);
  }catch(e){}
}
window.playClick=playClick;
window.playCash=playCash;
window.playBonus=playBonus;
function playAllDone(){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const t=ctx.currentTime;
    // Melodia de vitória: sequência de notas ascendentes
    [[523,0],[659,0.15],[784,0.30],[1047,0.45],[880,0.65],[1047,0.85]].forEach(([freq,delay])=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.type='sine';o.frequency.value=freq;
      g.gain.setValueAtTime(0,t+delay);
      g.gain.linearRampToValueAtTime(0.22,t+delay+0.04);
      g.gain.exponentialRampToValueAtTime(0.001,t+delay+0.22);
      o.start(t+delay);o.stop(t+delay+0.25);
    });
  }catch(e){}
}
window.playAllDone=playAllDone;
