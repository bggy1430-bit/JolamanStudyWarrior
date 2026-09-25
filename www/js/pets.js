/* ===== getPetSynergy ===== */
function getPetSynergy(){
  const eq=new Set(S.equippedPets||[]);
  const out={atkBonus:0,hpBonus:0,critRate:0,critDmg:0,goldBonus:0,expBonus:0,bossDmg:0};
  const names=[],flags=new Set();
  PET_SYNERGIES.forEach(syn=>{
    if(!syn.pets.every(id=>eq.has(id))) return;
    names.push(syn.name);
    Object.entries(syn.bonus).forEach(([k,v])=>out[k]=(out[k]||0)+v);
    flags.add(syn.id);
  });
  return {stats:out,names,flags};
}

/* ===== getPetSynergyBonus ===== */
function getPetSynergyBonus(stat){ return getPetSynergy().stats[stat]||0; }

/* ===== getPetBonus ===== */
function getPetBonus(statName){
  if(!S.equippedPets || S.equippedPets.length === 0) return 0;
  let totalBonus = 0;
  S.equippedPets.forEach(petId => {
    const pet = PET_PRESETS.find(p => p.id === petId);
    if(!pet) return;
    const lv = S.pets[petId] || 1;
    const scale = pet.levelScale || 0.20;
    const totalVal = (pet.val || 0) * (1 + (lv - 1) * scale);
    const statVal = pet.statVal != null ? pet.statVal * (1 + (lv - 1) * scale) : totalVal;
    if(pet.stat === statName || pet.stat2 === statName || (pet.stat === 'all' && ['atkBonus', 'hpBonus', 'hpBonus'].includes(statName))) {
      totalBonus += (pet.stat2 === statName ? statVal : totalVal);
    }
  });
  return totalBonus;
}

/* ===== getPetExtraAtkMult ===== */
function getPetExtraAtkMult(){
  if(!S.equippedPets || S.equippedPets.length === 0) return 0;
  let totalMult = 0;
  S.equippedPets.forEach(petId => {
    const pet = PET_PRESETS.find(p => p.id === petId);
    if(!pet) return;
    if(pet.stat === 'extraAtk' || pet.effect === 'extraAtk') {
      const lv = S.pets[petId] || 1;
      totalMult += pet.val * (1 + (lv - 1) * 0.2);
    }
  });
  return totalMult;
}

/* ===== getPetExtraAtkEntries ===== */
function getPetExtraAtkEntries(){
  return (S.equippedPets||[]).map(petId=>{const pet=PET_PRESETS.find(p=>p.id===petId); if(!pet || !(pet.stat==='extraAtk'||pet.effect==='extraAtk')) return null; const lv=S.pets[petId]||1; return [petId,pet.val*(1+(lv-1)*0.2)];}).filter(Boolean);
}

/* ===== triggerZeroResetVisual ===== */
function triggerZeroResetVisual(){
  const scene = document.getElementById('battleScene') || document.querySelector('.battle-scene') || document.body;
  const fx = document.getElementById('petEffectFx') || scene;
  const burst = document.createElement('div');
  burst.className = 'zeroResetFx';
  fx.appendChild(burst);

  const label = document.createElement('div');
  label.className = 'zeroResetLabel';
  label.textContent = 'ZERO RESET';
  fx.appendChild(label);

  const player = document.getElementById('playerWrap');
  const alphaIndex = (S.equippedPets || []).indexOf('alpha_zero');
  const alphaWrap = alphaIndex >= 0 ? document.getElementById(`petWrap${alphaIndex+1}`) : null;
  [player, alphaWrap].forEach(el=>{
    if(!el) return;
    el.classList.remove('zeroResetShake');
    void el.offsetWidth;
    el.classList.add('zeroResetShake');
    setTimeout(()=>el.classList.remove('zeroResetShake'), 400);
  });

  // 12개의 작은 에너지 파편이 ZERO를 중심으로 퍼지는 연출
  for(let i=0;i<9;i++){
    const shard=document.createElement('div');
    shard.textContent='✦';
    shard.style.position='absolute';
    shard.style.left='50%'; shard.style.top='50%';
    shard.style.zIndex='101'; shard.style.pointerEvents='none';
    shard.style.color=i%2 ? '#00ff99' : '#ffffff';
    shard.style.fontSize=(12 + (i%3)*4)+'px';
    shard.style.textShadow='0 0 8px currentColor';
    shard.style.setProperty('--dx', `${Math.cos(i*Math.PI/6)*105}px`);
    shard.style.setProperty('--dy', `${Math.sin(i*Math.PI/6)*75}px`);
    shard.style.animation='zeroShard 700ms ease-out forwards';
    fx.appendChild(shard);
    setTimeout(()=>shard.remove(),720);
  }
  setTimeout(()=>{burst.remove();label.remove();},1000);
}

/* ===== getPetEffectValue ===== */
function getPetEffectValue(effectKey){
  let total = 0;
  (S.equippedPets || []).forEach(petId => {
    const pet = PET_PRESETS.find(p => p.id === petId);
    if(pet && pet.effect === effectKey){
      const lv = S.pets[petId] || 1;
      const scale = pet.levelScale != null ? pet.levelScale : 0.08;
      total += (pet.val || 0) * (1 + (lv - 1) * scale);
    }
  });
  return total;
}

/* ===== hasPetEffect ===== */
function hasPetEffect(effectKey){ return getPetEffectValue(effectKey) > 0; }

/* ===== petProc ===== */
function petProc(effectKey, chancePct){ const ok=hasPetEffect(effectKey) && Math.random() < chancePct/100; if(ok) triggerPetEffectVisual(effectKey); return ok; }

/* ===== triggerZero999LastStand ===== */
function triggerZero999LastStand(){
  if(!hasPetEffect('limitBreak') || S.zero999LastStandUsed || S.zero999TimeStop) return false;
  S.zero999LastStandUsed = true;
  // ZERO999 발동 시 플레이어는 체력 1로 생존한다.
  S.player.hp = 1;
  S.zero999TimeStop = true;
  const scene = document.getElementById('scene');
  const player = document.getElementById('playerWrap');
  const monster = document.getElementById('monsterWrap');
  const equipped = S.equippedPets || [];
  const zeroIdx = equipped.indexOf('zero999');
  const zeroWrap = zeroIdx >= 0 ? document.getElementById(`petWrap${zeroIdx+1}`) : null;
  if(scene) scene.classList.add('zero999-time-stop');
  [player, monster, ...equipped.map((_,i)=>document.getElementById(`petWrap${i+1}`)).filter(Boolean)].forEach(el=>{
    if(el && el !== zeroWrap) el.classList.add('zero999-frozen');
  });
  if(zeroWrap){ zeroWrap.classList.remove('zero999-frozen'); zeroWrap.classList.add('zero999-last-stand'); }

  const totalHits = 9;
  const hitDelay = 111;
  let hit = 0;
  // ZERO999: 9연격. 매 타격마다 최대 HP의 1%를 고정으로 넣고,
  // 1~8타는 공격력의 10%, 9타째는 공격력의 30%를 추가한다.
  const maxHpDamage = Math.max(1, Math.round(calcMaxHp() * 0.01));
  const playerAttackDamage = Math.max(1, Math.round(calcAtk()));
  const attackOnce = () => {
    if(!S.zero999TimeStop || !S.monster || S.monster.hp <= 0){ return; }
    hit++;
    const petRect = zeroWrap ? zeroWrap.getBoundingClientRect() : null;
    const monRect = monster ? monster.getBoundingClientRect() : null;
    const sceneRect = scene ? scene.getBoundingClientRect() : null;
    // 1~8타: 최대 HP 1% + 공격력 10%.
    // 9타: 최대 HP 5% + 공격력 300%의 필살 일격.
    const isFinisher = hit === totalHits;
    const hpPortion = Math.max(1, Math.round(calcMaxHp() * (isFinisher ? 0.05 : 0.01)));
    const atkPortion = Math.max(1, Math.round(playerAttackDamage * (isFinisher ? 3.00 : 0.10)));
    const dmg = Math.max(1, Math.round((hpPortion + atkPortion) * getSpousePetDamageMult()));
    const beforeHp = S.monster.hp;
    S.monster.hp = Math.max(0, S.monster.hp - dmg);
    const dealt = beforeHp - S.monster.hp;
    recordPetDamage('zero999', dealt);
    S.damageHistory = (S.damageHistory || []).concat([dealt]).slice(-10);
    if(scene && petRect && monRect && sceneRect){
      const sx = petRect.left - sceneRect.left + petRect.width/2;
      const sy = petRect.top - sceneRect.top + petRect.height/2;
      const tx = monRect.left - sceneRect.left + monRect.width/2;
      const ty = monRect.top - sceneRect.top + monRect.height/2;
      const dx = tx-sx, dy=ty-sy;
      const slash=document.createElement('div');
      slash.className='zero999-slash' + (isFinisher ? ' zero999-finisher-slash' : '');
      slash.style.left=`${sx}px`; slash.style.top=`${sy}px`;
      slash.style.setProperty('--angle',`${Math.atan2(dy,dx)*180/Math.PI}deg`);
      slash.style.setProperty('--travel',`${Math.hypot(dx,dy)}px`);
      scene.appendChild(slash);
      setTimeout(()=>slash.remove(),190);
      if(isFinisher){
        const finisherFlash=document.createElement('div');
        finisherFlash.className='zero999-finisher-flash';
        scene.appendChild(finisherFlash);
        setTimeout(()=>finisherFlash.remove(),420);
        const finisherRing=document.createElement('div');
        finisherRing.className='zero999-finisher-ring';
        finisherRing.style.left=`${tx}px`; finisherRing.style.top=`${ty}px`;
        scene.appendChild(finisherRing);
        setTimeout(()=>finisherRing.remove(),520);
        scene.classList.remove('zero999-finisher-shake');
        void scene.offsetWidth;
        scene.classList.add('zero999-finisher-shake');
        setTimeout(()=>scene.classList.remove('zero999-finisher-shake'),380);
      }
      const impact=document.createElement('div');
      impact.className='zero999-impact' + (isFinisher ? ' zero999-finisher-impact' : '');
      impact.textContent=isFinisher ? 'ZERO999 FINISH!' : '999';
      impact.style.left=`${tx}px`; impact.style.top=`${ty-42}px`;
      scene.appendChild(impact);
      setTimeout(()=>impact.remove(),280);
    }
    if(monster){ monster.classList.remove('hurt'); void monster.offsetWidth; monster.classList.add('hurt'); setTimeout(()=>monster.classList.remove('hurt'),100); }
    spawnDmgText('monsterWrap',(isFinisher ? 'ZERO999 FINISH: ' : '999: ')+dealt.toLocaleString(),'dmgText zero999Dmg'+(isFinisher ? ' zero999FinisherDmg' : ''));
    renderTopStats(); updateHpBars();
    if(S.monster.hp <= 0){
      S.zero999TimeStop=false;
      if(scene) scene.classList.remove('zero999-time-stop');
      [player, monster, ...equipped.map((_,i)=>document.getElementById(`petWrap${i+1}`)).filter(Boolean)].forEach(el=>el&&el.classList.remove('zero999-frozen'));
      if(zeroWrap) zeroWrap.classList.remove('zero999-last-stand');
      onMonsterKilled(); renderAll();
    }
  };
  for(let i=1;i<=totalHits;i++) setTimeout(attackOnce, i*hitDelay);
  setTimeout(()=>{
    if(!S.zero999TimeStop) return;
    S.zero999TimeStop=false;
    if(scene) scene.classList.remove('zero999-time-stop');
    [player, monster, ...equipped.map((_,i)=>document.getElementById(`petWrap${i+1}`)).filter(Boolean)].forEach(el=>el&&el.classList.remove('zero999-frozen'));
    if(zeroWrap) zeroWrap.classList.remove('zero999-last-stand');
    if(S.player.hp<=0) onPlayerDefeated();
    renderAll();
  }, totalHits*hitDelay + 120);
  return true;
}

/* ===== renderPetEquipSlots ===== */
function renderPetEquipSlots(){
  const box = document.getElementById('petEquipSlots');
  if(!box) return;
  box.innerHTML = '';
  const equipped = (S.equippedPets || []).slice(0,12);
  for(let i=0;i<12;i++){
    const slot = document.createElement('div');
    slot.className = 'petEquipSlot' + (equipped[i] ? ' filled' : '');
    if(equipped[i]){
      const p = PET_PRESETS.find(x => x.id === equipped[i]);
      if(p){
        const gObj = PET_GRADES[p.grade] || {};
        slot.innerHTML = `<div class="petSlotIcon">${p.ic}</div>
          <div class="petSlotName" style="color:${gObj.color || 'var(--sub)'}">${p.name}</div>
          <button class="petSlotRemove" onclick="unequipPet('${p.id}')" title="해제">×</button>`;
      }
    }else{
      slot.innerHTML = `<div class="petSlotEmpty">＋</div><div class="petSlotName">빈 슬롯</div>`;
    }
    box.appendChild(slot);
  }
}

/* ===== renderPetList ===== */
function renderPetList(){
  renderPetEquipSlots();
  document.getElementById('petGoldVal').textContent = fmt(S.gold);
  document.getElementById('petEssenceVal').textContent = fmt(S.essence);

  const ps=document.getElementById('petSynergyPanel'); if(ps){
    ps.innerHTML=`<div class="artifactSynergyHead">✦ 펫 시너지 도감 <b>${(S.equippedPets||[]).length}/12</b></div>
      <div style="font-size:9px;color:var(--sub);margin-top:4px;">시너지 상세 조합과 효과는 아래 <b>📚 펫 시너지 전체 보기</b>에서 확인하세요.</div>`;
  }
  const list = document.getElementById('petList');
  list.innerHTML = '';
  
  const presets = PET_PRESETS.filter(p => p.grade === currentPetTab);
  
  presets.forEach(p => {
    const ownedLv = S.pets[p.id] || 0;
    const isEquipped = S.equippedPets && S.equippedPets.includes(p.id);
    const gObj = PET_GRADES[p.grade] || {name:'GOLD',color:'#ffd700'};
    
    const card = document.createElement('div');
    card.className = `petCard ${isEquipped ? 'active' : ''}`;
    
    let btnHtml = '';
    if(ownedLv > 0){
      if(isEquipped){
        btnHtml = `<button class="batchBtn" onclick="unequipPet('${p.id}')">해제</button>`;
      } else {
        btnHtml = `<button class="batchBtn" style="background:var(--accent); color:#fff;" onclick="equipPet('${p.id}')">장착</button>`;
      }
    } else {
      btnHtml = `<button class="batchBtn btn-disabled" disabled>미보유</button>`;
    }

    card.innerHTML = `
      <div class="petInfo">
        <div class="petIc">${p.ic}</div>
        <div>
          <div style="font-size:12.5px; font-weight:700; color:${gObj.color}">
            ${p.name} ${ownedLv > 0 ? `<span style="font-size:10px; color:var(--gold)">[Lv.${ownedLv}]</span>` : ''}
          </div>
          <div style="font-size:10px; color:var(--sub); margin-top:2px;">${p.desc}</div>
        </div>
      </div>
      <div style="min-width:60px; text-align:right;">${btnHtml}</div>
    `;
    list.appendChild(card);
  });
}

/* ===== drawPet ===== */
function drawPet(){
  if(S.essence < 50){ toast('생명의 정수가 부족합니다! (50 필요)'); return; }
  S.essence -= 50;
  
  let r = Math.random() * 100;
  let chosenGrade = 0;
  for(let g=0; g<PET_GRADES.length; g++){
    r -= PET_GRADES[g].rate;
    if(r <= 0){ chosenGrade = PET_GRADES[g].grade; break; }
  }

  let pool = PET_PRESETS.filter(p => p.grade === chosenGrade);
  if(!pool.length){
    chosenGrade = Math.max(0, Math.min(7, chosenGrade - 1));
    pool = PET_PRESETS.filter(p => p.grade === chosenGrade);
  }
  const pickedPet = pick(pool);

  if(!S.pets[pickedPet.id]){
    S.pets[pickedPet.id] = 1;
    toast(`🐣 축하합니다! [${PET_GRADES[chosenGrade].name}] ${pickedPet.name} 획득!`);
  } else {
    S.pets[pickedPet.id]++;
    toast(`✨ [${PET_GRADES[chosenGrade].name}] ${pickedPet.name} 중복 획득! 레벨업 (Lv.${S.pets[pickedPet.id]})`);
  }

  switchPetTab(chosenGrade);
  playGachaFx('pet', pickedPet.ic, 'PET HATCH', `${PET_GRADES[chosenGrade].name} · ${pickedPet.name}`);
  renderAll(); saveGame();
}

/* ===== drawPet10 ===== */
function drawPet10(){
  const cost=500;
  if(S.essence < cost){ toast('생명의 정수가 부족합니다! (10회 = 500 필요)'); return; }
  S.essence -= cost;
  const counts={};
  const names=[];
  for(let i=0;i<10;i++){
    let r=Math.random()*100, chosenGrade=PET_GRADES.length-1;
    for(let g=0;g<PET_GRADES.length;g++){ r-=PET_GRADES[g].rate; if(r<=0){ chosenGrade=g; break; } }
    let pool=PET_PRESETS.filter(p=>p.grade===chosenGrade);
    if(!pool.length) pool=PET_PRESETS.filter(p=>p.grade===Math.max(0,chosenGrade-1));
    const pet=pick(pool);
    S.pets[pet.id]=(S.pets[pet.id]||0)+1;
    counts[PET_GRADES[pet.grade].name]=(counts[PET_GRADES[pet.grade].name]||0)+1;
    names.push(pet.name);
  }
  const summary=Object.entries(counts).map(([k,v])=>`${k} ×${v}`).join(' · ');
  switchPetTab(Math.max(...PET_GRADES.map(g=>counts[g.name]?g.grade:0)));
  renderAll(); saveGame();
  const result=document.getElementById('petBatchResult');
  if(result){ result.style.display='block'; result.innerHTML=`<div style="background:rgba(0,234,255,.08);border:1px solid rgba(0,234,255,.25);border-radius:10px;padding:9px;font-size:10px;text-align:center;">✨ 10회 소환 완료 · ${summary}<br><span style="color:var(--sub)">${names.join(' · ')}</span></div>`; }
  toast(`✨ 펫 10회 소환 완료! ${summary}`);
}

/* ===== equipPet ===== */
function equipPet(petId){
  if(!S.equippedPets) S.equippedPets = [];
  if(S.equippedPets.includes(petId)) return;

  if(S.equippedPets.length >= 12){
    toast('펫은 최대 12마리까지 장착할 수 있습니다!');
    return;
  }
  S.equippedPets.push(petId);
  renderPetList();
  renderAll(); saveGame();
  toast('펫을 장착했습니다!');
}

/* ===== unequipPet ===== */
function unequipPet(petId){
  if(!S.equippedPets) return;
  const idx = S.equippedPets.indexOf(petId);
  if(idx >= 0){
    S.equippedPets.splice(idx, 1);
    renderPetList();
    renderAll(); saveGame();
    toast('펫을 해제했습니다.');
  }
}