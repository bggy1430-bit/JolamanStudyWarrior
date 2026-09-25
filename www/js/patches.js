/* ===== PATCH BLOCK 8 ===== */
(function(){
  try{
    S.equippedPets=(S.equippedPets||[]).map(id=>id==='gold_dragon'?'gold_roulette':id).filter(id=>id!=='error'&&id!=='origin_soul');
    if(S.pets){if(S.pets.gold_dragon!=null&&S.pets.gold_roulette==null)S.pets.gold_roulette=S.pets.gold_dragon;delete S.pets.gold_dragon;delete S.pets.error;delete S.pets.origin_soul;}
  }catch(e){}
  const _calcAtk=window.calcAtk;
  if(typeof _calcAtk==='function')window.calcAtk=function(){let v=_calcAtk();const stacks=Math.min(5,Number(S.goldCoinStacks||0));if(stacks&&(S.equippedPets||[]).includes('gold_slime'))v=Math.round(v*(1+.12*stacks));if(Number(S.goldRouletteDamageMult||1)>1)v=Math.round(v*S.goldRouletteDamageMult);return v;};
  function rr(){const r=Math.random()*100;if(r<30)return{icon:'🪙',name:'GOLD',dmg:1.5,gold:1,desc:'+150% 추가 피해 + 스테이지×10 골드'};if(r<55)return{icon:'⚔️',name:'BATTLE',dmg:2,gold:1,desc:'+200% 추가 피해'};if(r<75)return{icon:'💰',name:'대박',dmg:3,gold:2,desc:'+300% 추가 피해 + 처치 골드 ×2'};if(r<90)return{icon:'💎',name:'보물',dmg:4,gold:3,desc:'+400% 추가 피해 + 처치 골드 ×3'};if(r<98)return{icon:'🔥',name:'JACKPOT',dmg:6,gold:5,desc:'+600% 추가 피해 + 처치 골드 ×5'};return{icon:'💀',name:'MISS',dmg:1,gold:1,desc:'효과 없음'};}
  function roulette(){if(!(S.equippedPets||[]).includes('gold_roulette'))return;const x=rr();S.goldRouletteDamageMult=x.dmg;S.goldRouletteGoldMult=x.gold;let o=document.getElementById('goldRouletteOverlay');if(!o){o=document.createElement('div');o.id='goldRouletteOverlay';o.innerHTML='<div class="grBox"><div class="grTitle">🎰 황금 재물룰렛</div><div class="grWheel">🪙 ⚔️ 💰 💎 🔥 💀</div><div class="grSpin">SPINNING...</div><div class="grResult"></div></div>';document.body.appendChild(o);}o.querySelector('.grResult').innerHTML=x.icon+' '+x.name+'<small>'+x.desc+'</small>';o.classList.remove('show','jackpot');void o.offsetWidth;o.classList.add('show');if(x.name==='JACKPOT')o.classList.add('jackpot');setTimeout(()=>o.classList.remove('show'),2400);}
  const _spawn=window.spawnMonster;if(typeof _spawn==='function')window.spawnMonster=function(){S.goldRouletteDamageMult=1;S.goldRouletteGoldMult=1;const r=_spawn.apply(this,arguments);setTimeout(roulette,40);return r;};
  const _kill=window.onMonsterKilled;if(typeof _kill==='function')window.onMonsterKilled=function(){const m=Math.max(1,Number(S.goldRouletteGoldMult||1));if(m>1){const before=S.gold;S.goldRouletteGoldMult=1;const r=_kill.apply(this,arguments);const earned=Math.max(0,S.gold-before);S.gold+=earned*(m-1);S.goldRouletteDamageMult=1;return r;}const r=_kill.apply(this,arguments);S.goldRouletteDamageMult=1;return r;};
  delete S.potions;document.getElementById('tabPotion')?.remove();document.getElementById('shopPotionPane')?.remove();try{saveGame()}catch(e){}
})();

/* ===== PATCH BLOCK 9 ===== */
(function(){
try{S.breakProtectionTickets=Math.max(0,Math.floor(Number(S.breakProtectionTickets||0)));}catch(e){}
try{const pane=document.getElementById("shopGoldPane");if(pane){const original=renderGoldShop;renderGoldShop=function(){original();const item=document.createElement("div");item.className="shopItem";item.innerHTML='<div><div class="si-name">🛡️ 파괴방지권</div><div class="si-desc">극의 실패 시 강등 1회 방지 · 최대 보유 제한 없음 · 현재 '+fmt(S.breakProtectionTickets||0)+'개</div></div><button onclick="buyBreakProtectionTicket()">💎 5,000 영혼석</button>';pane.appendChild(item);};}}catch(e){}
})();

/* ===== PATCH BLOCK 10 ===== */
(function(){
  // 장비 자체의 추가 효과/권능/옵션은 모두 제거한다. 기본 장비 능력치와 장비 세트 효과는 유지한다.
  window.getGearPowerState=function(){ return {holy:0,void:0,dimension:0,time:0,infinity:0,origin:0,absolute:0}; };
  window.getGearPowerNames=function(){ return []; };
  window.getGearPowerNameForGrade=function(){ return ''; };
  window.getEquipOptionBonus=function(){ return 0; };
  window.rollEquipOptions=function(){ return []; };

  const setStatNames={atkPct:'공격력',hpPct:'최대 체력',critRate:'치명타 확률',critDmg:'치명타 피해',bossDmg:'보스 피해',goldBonus:'골드 획득량',expBonus:'전투 경험치'};
  function setEffectText(effect){
    return Object.entries(effect||{}).map(([k,v])=>{
      const n=setStatNames[k]||k;
      return n+' +'+v+'%';
    }).join(' · ');
  }
  window.getSetInfo=function(item){
    const set=EQUIP_SETS.find(x=>x.id===item?.setId);
    if(!set) return '세트 없음';
    const count=Object.values(S.equip||{}).filter(it=>it&&it.setId===set.id).length;
    const rows=Object.entries(set.effects).map(([need,e])=>{
      const active=count>=Number(need);
      return (active?'✓ ':'')+need+'세트 · '+setEffectText(e)+(active?'':' · 미활성');
    });
    return set.name+' · '+count+'/5\\n'+rows.join(' | ');
  };

  // 장비 가방에서는 기존 옵션/고유 권능을 표시하지 않는다.
  window.renderBag=function(){
    const junkCount=document.getElementById('junkCount'), equipCount=document.getElementById('equipCount');
    if(junkCount) junkCount.textContent=S.bagJunk.length;
    if(equipCount) equipCount.textContent=S.bagEquip.length;
    const grid=document.getElementById('bagGrid'), empty=document.getElementById('bagEmpty'); if(!grid||!empty)return;
    grid.innerHTML='';
    const targetList=currentBagTab==='junk'?S.bagJunk:S.bagEquip;
    if(targetList.length===0){empty.style.display='block';return;} empty.style.display='none';
    targetList.forEach(it=>{
      const div=document.createElement('div'); div.className='bagItem';
      const g=GRADES[it.grade]||GRADES[0]; div.style.borderColor=g.color;
      const enhanceTag=it.enhance>0?' +'+it.enhance:'';
      div.innerHTML='<div class="ic">'+slotIcon(it)+'</div><div class="gname" style="color:'+g.color+'">'+it.name+enhanceTag+'</div>';
      div.onclick=()=>openItemSheet(it.id); grid.appendChild(div);
    });
  };

  function setBook(){
    const el=document.getElementById('equipSetBook'); if(!el)return;
    const equipped=Object.values(S.equip||{}).filter(Boolean);
    el.innerHTML='<div class="codexCard"><div class="codexTitle">🛡️ 장비 세트 효과</div><div class="codexEffect">장비의 개별 옵션과 고유 권능은 제거되었습니다. 아래 세트 효과만 적용됩니다.</div></div>'+EQUIP_SETS.map(set=>{
      const count=equipped.filter(it=>it.setId===set.id).length;
      return '<div class="codexCard eqSetBookCard"><div class="eqSetHighlight"><div class="eqSetHead"><span>⚔️ '+set.name+'</span><span class="eqSetCount">'+count+'/5 장착</span></div>'+Object.entries(set.effects).map(([need,e])=>'<div class="eqSetEffect '+(count>=Number(need)?'active':'')+'"><b>'+need+'세트</b> · '+setEffectText(e)+(count>=Number(need)?' · ✓ 발동 중':' · 잠김')+'</div>').join('')+'</div></div>';
    }).join('');
  }
  window.renderEquipSetBook=setBook;

  // 배우자 능력은 등급/기본 펫 피해/특별 능력을 모두 명확하게 표시한다.
  const specialText={
    doublePetChance:'펫 공격 피해 2배',
    petHeal:'펫이 준 피해의 3%만큼 플레이어 회복',
    bossPetDamage:'보스 대상 펫 피해 +60%',
    lowHpPetDamage:'플레이어 HP 30% 이하일 때 펫 피해 +80%',
    executePetDamage:'적 HP 20% 이하일 때 펫 피해 +150%'
  };
  SPOUSE_PRESETS.forEach(sp=>{ if(sp.special&&specialText[sp.special]) sp.specialText=specialText[sp.special]; });

  const oldRenderSpouse=window.renderSpouse;
  window.renderSpouse=function(){
    oldRenderSpouse();
    const grid=document.getElementById('spouseGrid'); if(!grid)return;
    grid.innerHTML=SPOUSE_PRESETS.map(sp=>{
      const owned=Number(S.spouses?.[sp.id]||0)>0, eq=S.equippedSpouse===sp.id, color=SPOUSE_GRADE_COLORS[sp.grade]||'#fff';
      return '<div class="spouseCard '+(owned?'':'locked')+' '+(eq?'equipped':'')+'">'+
        '<div class="spouseIcon">'+(owned?sp.ic:'❔')+'</div><div>'+
        '<div class="spouseGrade" style="color:'+color+'">'+sp.grade+'등급</div>'+
        '<div class="spouseName">'+(owned?sp.name:'???')+'</div>'+
        '<div class="spouseTitle">'+(owned?'「'+sp.title+'」':'미획득')+'</div>'+
        '<div class="spouseAbilityBox"><b>기본 능력</b><br>펫 피해 +'+sp.bonus+'%</div>'+ 
        (sp.specialText?'<div class="spouseAbilityBox special"><b>특별 능력</b><br>'+sp.specialText+'</div>':'')+
        '</div><div>'+(owned?(eq?'<button class="spouseBtn remove" onclick="unequipSpouse()">해제</button>':'<button class="spouseBtn" onclick="equipSpouse(\\''+sp.id+'\\')">장착</button>'):'')+'</div></div>';
    }).join('');
  };
})();
