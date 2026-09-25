/* Extracted module. Gameplay behavior intentionally preserved. */

function originCoreMultiplier(){ return 1 + (Math.max(0,Number(S.originCoreLv||0)) * 0.025); }

function originCoreBossBonus(){ const lv=Math.max(0,Number(S.originCoreLv||0)); return Math.floor(lv/10)*5; }

function originCoreCritBonus(){ const lv=Math.max(0,Number(S.originCoreLv||0)); return Math.floor(lv/5)*2; }

function originCoreHpGuard(){ const lv=Math.max(0,Number(S.originCoreLv||0)); return Math.floor(lv/10)*2; }

function calcOriginSuccessRate(){
  const lv=Math.max(0,Number(S.originCoreLv||0));
  if(lv>=50) return 0;
  return Math.min(90, Math.max(5, 72 - lv*1.35 + Number(S.originCorePity||0)));
}

function originCoreCost(){
  const lv=Math.max(0,Number(S.originCoreLv||0));
  return Math.floor(3000 * Math.pow(1.16, lv) + lv*lv*lv*50);
}

function attemptOriginCore(){
  const lv=Math.max(0,Number(S.originCoreLv||0));
  if(lv>=50){ toast('🜂 절대적 근원은 이미 최종 단계입니다.'); return; }
  const cost=originCoreCost();
  if((S.artifactShards||0)<cost){ toast(`🌌 유물의 파편이 부족합니다. 필요: ${fmt(cost)}`); return; }
  S.artifactShards-=cost;
  const rate=calcOriginSuccessRate();
  if(Math.random()*100 < rate){
    S.originCoreLv=lv+1; S.originCorePity=0;
    triggerOriginAwakening(S.originCoreLv);
    toast(`🜂 근원의 봉인이 열렸습니다! 절대적 근원 Lv.${S.originCoreLv}`);
  }else{
    S.originCorePity=Math.min(88,Number(S.originCorePity||0)+6);
    toast(`🜂 근원 강화 실패... 다음 성공 확률 +5% (현재 ${calcOriginSuccessRate().toFixed(1)}%)`);
  }
  renderGrowthTree(); renderAll(); saveGame();
}

function renderOriginGrowth(){
  const box=document.getElementById('originGrowthCore'); if(!box)return;
  const lv=Math.max(0,Number(S.originCoreLv||0)), cost=originCoreCost(), rate=calcOriginSuccessRate();
  const bonus=(lv*2.5).toFixed(1), boss=originCoreBossBonus(), crit=originCoreCritBonus(), guard=originCoreHpGuard();
  const maxed=lv>=50;
  box.innerHTML=`<div class="originCore"><div class="coreIcon">🜂</div><div class="coreLv">절대적 근원 Lv.${lv} / 50</div><div class="coreRate">${maxed?'✦ 근원 완전 개방':'다음 강화 성공 확률 '+rate.toFixed(1)+'%'}</div><div class="coreBonus">현재 권능: <b>공격력 +${bonus}% · 최대 HP +${bonus}%</b><br>5레벨마다 <b>치명타 피해 +2%</b> · 10레벨마다 <b>보스 피해 +5%</b> · 10레벨마다 <b>받는 피해 -2%</b></div><div class="originMilestone">${lv<10?'Lv.10 — 첫 번째 근원문 개방: 보스 피해 +5%':lv<20?'Lv.20 — 두 번째 근원문 개방: 받는 피해 -4%':lv<30?'Lv.30 — 세 번째 근원문 개방: 보스 피해 +15%':lv<40?'Lv.40 — 네 번째 근원문 개방: 치명타 피해 +16%':lv<50?'Lv.50 — 최종 근원문: 모든 근원 권능 극한 개방':'✦ 모든 근원문이 열렸습니다.'}</div><button class="originAttempt" ${maxed||((S.artifactShards||0)<cost)?'disabled':''} onclick="attemptOriginCore()">${maxed?'✦ 근원 완전 개방':`🜂 근원 개방 · ${fmt(cost)} 유물의 파편`}</button><div class="originInfo">현재 유물의 파편: <b>${fmt(S.artifactShards||0)}</b><br>강화 비용은 단계가 오를수록 급격히 증가합니다. 실패해도 단계가 하락하지 않으며, 실패할 때마다 성공 확률 <b>+6%p</b>가 누적됩니다.</div></div>`;
  const tab=document.getElementById('originGrowthTabText'); if(tab)tab.textContent=`Lv.${lv}`;
  const shard=document.getElementById('originShardVal'); if(shard)shard.textContent=fmt(S.artifactShards||0);
}