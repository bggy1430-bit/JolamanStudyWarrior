/* Extracted module. Gameplay behavior intentionally preserved. */

function spawnDmgText(wrapId, text, cls){
  const wrap = document.getElementById(wrapId);
  const scene = document.getElementById('scene');
  if(!wrap || !scene) return;

  const raw = String(text).trim();
  // 전투 중 "발동! / IMPACT!" 같은 설명 문구는 데미지 숫자와 겹치므로 표시하지 않는다.
  // 실제 피해 숫자(일반/CRIT/+추가피해)만 표시한다.
  // 실제 데미지만 허용: 일반 숫자 + ZERO의 zero: + ZERO1의 COPY:
  const isPlainDamage = /^\+?\s*(?:CRIT\s*)?\d[\d,]*(?:\.\d+)?$/.test(raw);
  const isZeroDamage = /^zero:\s*\+?\d[\d,]*(?:\.\d+)?$/i.test(raw);
  const isCopyDamage = /^COPY:\s*\+?\d[\d,]*(?:\.\d+)?$/i.test(raw);
  if(!isPlainDamage && !isZeroDamage && !isCopyDamage) return;

  const d = document.createElement('div');
  d.className = 'dmgText '+cls;
  d.classList.add(isPlainDamage ? 'playerDmgText' : 'petDmgText');
  if(isZeroDamage) d.classList.add('zeroDmgText');
  if(isCopyDamage) d.classList.add('copyDmgText');
  d.textContent = raw;
  d.style.zIndex = (wrapId === 'playerWrap') ? '32' : '31';
  d.style.maxWidth = 'calc(100vw - 16px)';
  d.style.overflow = 'visible';
  d.style.whiteSpace = 'nowrap';

  // 중요: 데미지 숫자는 wrap 안에 append되므로 absolute 기준점도 wrap이다.
  // scene 좌표를 left에 넣으면 #playerWrap/#monsterWrap의 left/right 위치가
  // 한 번 더 더해져 숫자가 오른쪽으로 밀린다. 대상 자체의 정중앙(50%)을 사용한다.
  d.style.left = '50%';
  d.style.transform = 'translateX(-50%)';

  // 머리 바로 위를 기준점으로 잡고, 같은 대상에서 이미 떠 있는 숫자만큼만 위로 쌓는다.
  const active = [...wrap.querySelectorAll('.dmgText')].filter(x => x.isConnected);
  const lane = active.length;
  const top = -50 - Math.min(lane, 8) * 23;
  d.style.setProperty('--dmg-top', `${top}px`);
  d.dataset.dmgLane = String(lane);
  wrap.appendChild(d);

  setTimeout(()=>d.remove(),800);
}

function triggerOriginAwakening(lv){
  const fx=document.createElement('div'); fx.className='originForgeFx';
  fx.innerHTML=`<div class="core">🜂</div><div class="label">ABSOLUTE ORIGIN · LV.${lv}</div>`;
  document.body.appendChild(fx); setTimeout(()=>fx.remove(),1200);
}

function spawnUltimateParticles(success){
  const box=document.getElementById('ultimateParticles'); if(!box) return;
  box.innerHTML='';
  const count=success?70:48;
  for(let i=0;i<count;i++){
    const p=document.createElement('i'); p.className='ultimateParticle';
    const angle=Math.random()*Math.PI*2, dist=(success?120:90)+Math.random()*Math.min(innerWidth,innerHeight)*.45;
    p.style.left='50%'; p.style.top='47%'; p.style.setProperty('--dx',`${Math.cos(angle)*dist}px`); p.style.setProperty('--dy',`${Math.sin(angle)*dist}px`);
    p.style.animationDelay=`${Math.random()*.18}s`;
    p.style.color=success?(Math.random()>.35?'#ffd166':'#00eaff'):'#ff315a';
    box.appendChild(p);
  }
}

function doUltimate(slotKey, cost){
  if(isEnhancing) return;
  const it=S.equip[slotKey]; if(!it) return;
  if((it.transcend||0)<5){toast('초월 5단계를 먼저 달성해야 합니다.');return;}
  const u=it.ultimate||0; if(u>=10){toast('극의 강화가 최대 단계입니다.');return;}
  if(S.soulStones<cost){toast(`💎 영혼석이 부족합니다! 극의 강화 필요: ${fmt(cost)}`);return;}
  isEnhancing=true; S.soulStones-=cost;
  const overlay=document.getElementById('ultimateFxOverlay');
  const useUltimateFx=appSettings.ultimateFx!==false;
  const txt=document.getElementById('ultimateFxText');
  const result=document.getElementById('ultimateResult');
  const chance=([50,40,30,20,15,10,7,4,2,1][u]||1);
  if(useUltimateFx)overlay.className='show event-charge';
  if(result) result.textContent='';
  if(txt) txt.innerHTML=`🔥 극의 ${u+1}단계<small>${it.name} · 운명을 판정한다</small>`;
  const svg=document.getElementById('stickmanSvg'); if(svg){svg.classList.add('ultimate-stage');}
  setTimeout(()=>{
    const success=Math.random()*100<chance;
    if(useUltimateFx){overlay.classList.remove('event-charge');overlay.classList.add(success?'event-success':'event-fail');}
    if(useUltimateFx)spawnUltimateParticles(success);
    if(success){
      it.ultimate=u+1;
      if(txt) txt.innerHTML=`⚡ 극의 ${it.ultimate}단계<small>${it.name} · 한계를 초월한 흔적</small>`;
      if(result) result.innerHTML=`극의 돌파<br><small style="font-size:12px;letter-spacing:1px">SUCCESS · ${chance}%</small>`;
      toast(`🔥 ${it.name} 극의 ${it.ultimate}단계 돌파 성공! (성공률 ${chance}%)`);
    }else{
      const failShard=3+Math.floor(u/3);
      S.artifactShards=(S.artifactShards||0)+failShard;
      const wouldDowngrade=u>0 && Math.random()<0.30;
      const protectedDowngrade=wouldDowngrade && Number(S.breakProtectionTickets||0)>0;
      if(protectedDowngrade) S.breakProtectionTickets=Math.max(0,Number(S.breakProtectionTickets||0)-1);
      const downgrade=wouldDowngrade && !protectedDowngrade;
      if(downgrade) it.ultimate=u-1;
      if(txt) txt.innerHTML=`💥 극의 붕괴<small>${it.name} · 한계가 거부했다</small>`;
      if(result) result.innerHTML=downgrade?`극의 붕괴<br><small style="font-size:12px;letter-spacing:1px">${u} → ${it.ultimate} · 파편 +${failShard}</small>`:protectedDowngrade?`극의 실패 방어<br><small style="font-size:12px;letter-spacing:1px">등급 유지 · 🎫 파괴방지권 -1 · 파편 +${failShard}</small>`:`극의 실패<br><small style="font-size:12px;letter-spacing:1px">단계 유지 · 파편 +${failShard}</small>`;
      if(useUltimateFx&&downgrade){overlay.classList.remove('event-fail');overlay.classList.add('event-collapse');}
      if(downgrade) toast(`💥 극의 붕괴! ${it.name} ${u} → ${it.ultimate}단계 강등 · 🌌 유물 파편 +${failShard}`);
      else if(protectedDowngrade) toast(`🛡️ 극의 붕괴 방지! ${it.name} ${u}단계 유지 · 🎫 파괴방지권 1개 소모 · 🌌 유물 파편 +${failShard}`);
      else toast(`💥 극의 실패! 단계 유지 (${chance}%) · 🌌 유물 파편 +${failShard}`);
    }
    renderEnhance(); renderAll(); saveGame();
    setTimeout(()=>{
      if(useUltimateFx)overlay.className=''; if(txt) txt.innerHTML='🔥 극의의 문이 열린다<small>THE LIMIT AWAITS</small>'; if(result) result.textContent='';
      const particles=document.getElementById('ultimateParticles'); if(particles) particles.innerHTML='';
      isEnhancing=false;
    },useUltimateFx ? 1900 : 0);
  },useUltimateFx ? 1500 : 0);
}