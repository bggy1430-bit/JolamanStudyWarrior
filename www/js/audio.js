/* Extracted module. Gameplay behavior intentionally preserved. */

function ensureAudio(){
  try{
    if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
    if(appSettings.bgm) startAmbientBgm();
  }catch(e){}
  return audioCtx;
}

function tone(freq,dur,type='sine',gain=.05,delay=0){
  if(!appSettings.sfx) return;
  const ctx=ensureAudio(); if(!ctx) return;
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type=type; o.frequency.setValueAtTime(freq,ctx.currentTime+delay);
  g.gain.setValueAtTime(0,ctx.currentTime+delay);
  g.gain.linearRampToValueAtTime(gain*(appSettings.masterVolume||.72),ctx.currentTime+delay+.008);
  g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+delay+dur);
  o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime+delay); o.stop(ctx.currentTime+delay+dur+.02);
}

function sfx(name){
  if(!appSettings.sfx) return;
  const patterns={
    click:[[520,.045,'sine',.025,0]],
    coin:[[740,.07,'triangle',.035,0],[980,.09,'triangle',.03,.06]],
    gacha:[[220,.12,'sine',.035,0],[330,.12,'sine',.04,.10],[520,.16,'triangle',.05,.20],[880,.22,'sine',.06,.34]],
    pet:[[180,.12,'sine',.03,0],[260,.12,'sine',.04,.10],[420,.15,'triangle',.05,.22],[720,.25,'sine',.06,.35]],
    hammer:[[120,.09,'square',.045,0],[82,.14,'triangle',.07,.09],[440,.10,'triangle',.04,.20]],
    success:[[520,.10,'triangle',.04,0],[740,.12,'triangle',.05,.09],[1040,.22,'sine',.06,.20]],
    fail:[[180,.18,'sawtooth',.045,0],[120,.25,'sawtooth',.035,.15]],
    equip:[[360,.08,'triangle',.035,0],[540,.12,'triangle',.045,.09]],
    hit:[[95,.055,'square',.075,0],[58,.085,'triangle',.06,.025],[210,.045,'triangle',.028,.06]],
    critHit:[[70,.07,'square',.09,0],[130,.06,'sawtooth',.055,.035],[360,.09,'triangle',.045,.08]],
    hurt:[[115,.10,'sawtooth',.055,0],[78,.13,'square',.045,.055]],
    heavyHit:[[65,.10,'square',.10,0],[48,.14,'triangle',.075,.045],[180,.12,'sawtooth',.045,.10]]
  };
  (patterns[name]||patterns.click).forEach(a=>tone(...a));
}

function stopAmbientBgm(){
  if(bgmTimer){clearTimeout(bgmTimer);bgmTimer=null;}  bgmNodes.forEach(n=>{try{n.stop()}catch(e){}});
  bgmNodes=[];
}

function startAmbientBgm(){ stopAmbientBgm(); }

function playForgeFx(icon,label='FORGE!'){
  if(!appSettings.enhanceFx || appSettings.reducedFx) return 0;
  const box=document.getElementById('forgeHammerOverlay'); if(!box)return 0;
  document.getElementById('forgeTarget').textContent=icon||'⚔️';
  document.getElementById('forgeText').textContent=label;
  box.classList.remove('show'); void box.offsetWidth; box.classList.add('show');
  sfx('hammer');
  setTimeout(()=>box.classList.remove('show'),800);
  return 800;
}