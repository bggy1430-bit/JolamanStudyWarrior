/* ===== spawnMonster ===== */
function spawnMonster(effect=true){
  S.combatHits = 0; S.errorHitCount = 0; S.enemyAttackCount = 0; S.originMirrorReflect=0; S.pendingMirrorDamage=0; S.zeroComboDisplay = 0; S.zero999LastStandUsed = false; S.zeroOmegaCharge = 0; S.originVoidUsed = false; S.zero999TimeStop = false; S.gearShieldUsed=false; S.gearOriginUsed=false; S.rewindUsed = false; S.secondChanceUsed = false; S.damageHistory = []; S.phaseBoost = 0; S.absCritCharge = 0; S.absCritDamage = 0; S.absVoidEcho = 0; S.absVoidEchoBase = 0; S.absDestroyCharge = 0; S.absSlaughterStacks = 0; S.absSlaughterBurstReady = false; S.originVoidCharge = 0; S.originSoulStacks = 0; S.originTimeCooldownUntil = 0; S.zeroOneStored = 0; S.zeroResetUsed = false; S.zeroResetStartHp = calcMaxHp(); S.artifactBloodMark=false; S.artifactFateCharge=0; S.artifactCritHits=0; S.artifactEnemyHits=0; S.artifactTreasureCycle=0; S.artifactVoidExecuteUsed=false; S.artifactWorldEndUsed=false; S.artifactCelestialUsed=false; S.artifactApocBossHits=0; S.artifactApocStacks=0; S.artifactApocKillCount=0; S.artifactApocKillReady=false; S.artifactApocCollapseUsed=false; S.artifactStarCritCharge=0; S.goldCoinStacks=0; S.goldJackpotReady=false; S.goldVaultReady=false; S.artifactImmortalUsed=false; S.artifactCalamityMark=0;
  let mobIndex = (S.stage-1) % MONSTERS.length;

  const mt = MONSTERS[mobIndex];
  const isRare=!mt.isBoss&&Math.random()<0.04;
  const rareMultHp=isRare?4:1, rareMultAtk=isRare?1.5:1;
  // Normal monster growth: front-loaded difficulty, then strong late-game damping.
  // Each segment compounds from the previous segment so there are no stat resets at breakpoints.
  function piecewiseScale(stage, rates){
    const cuts = [20, 50, 100, 200, 500];
    let mult = 1, prev = 1;
    const end = Math.max(1, Math.floor(stage));
    for(let i=0;i<rates.length;i++){
      const segEnd = i < cuts.length ? cuts[i] : end;
      const count = Math.max(0, Math.min(end, segEnd) - prev);
      if(count > 0) mult *= Math.pow(1 + rates[i], count);
      prev = segEnd;
      if(end <= segEnd) break;
    }
    return mult;
  }
  // 1~20 / 21~50 / 51~100 / 101~200 / 201~500 / 501+
  const hpScale = piecewiseScale(S.stage, [0.11, 0.10, 0.075, 0.035, 0.018, 0.008]);
  const atkScale = piecewiseScale(S.stage, [0.10, 0.09, 0.07, 0.03, 0.015, 0.007]);

  // Bosses are intentionally only moderately stronger than regular monsters.
  // Keep boss growth tied to the normal stage curve so late-game bosses do not explode in power.
  const bossHpScale = hpScale * 2.00;
  const bossAtkScale = atkScale * 1.15;

  let titleCount = Math.random() < 0.3 ? 2 : 1;
  let chosenTitles = [];
  for(let i=0; i<titleCount; i++){
    let t = pick(MONSTER_TITLES);
    if(!chosenTitles.includes(t)) chosenTitles.push(t);
  }
  let fullMonsterName = mt.isBoss ? `[BOSS] ${chosenTitles.join(' ')} ${mt.name}` : (isRare ? `[RARE] ${chosenTitles.join(' ')} ${mt.name}` : `[${chosenTitles.join(' ')}] ${mt.name}`);

  const hp = Math.max(15, Math.round(25 * (mt.isBoss ? bossHpScale : mt.hpM * hpScale) * 2 * rareMultHp));
  const atk = Math.max(2, Math.round(5.0 * mt.atkM * (mt.isBoss ? bossAtkScale : atkScale) * rareMultAtk));

  S.monster = { name:fullMonsterName, baseName:mt.name, ic:mt.ic, hp, maxHp:hp, atk, isBoss:mt.isBoss, isRare };
  
  const scene = document.getElementById('scene');
  const bossOverlay = document.getElementById('bossHpOverlay');

  if(mt.isBoss){
    scene.className = 'bg-boss';
    bossOverlay.classList.add('show');
    document.getElementById('bossOverlayName').textContent = fullMonsterName;
  } else {
    const bgIdx = (S.stage-1) % BACKGROUNDS.length;
    scene.className = BACKGROUNDS[bgIdx].cls;
    bossOverlay.classList.remove('show');
  }

  const bgIdxName = BACKGROUNDS[(S.stage-1) % BACKGROUNDS.length].name;
  document.getElementById('stageTitle').textContent = `STAGE ${S.stage} · ${bgIdxName}`;
  document.getElementById('monsterName').textContent = fullMonsterName;
  document.getElementById('monsterName').classList.toggle('rareMonsterTag', isRare);
  
  const me = document.getElementById('monsterEmoji');
  me.textContent = mt.ic; 
  me.className = mt.isBoss ? 'boss' : (isRare ? 'rare' : '');

  const bBtn = document.getElementById('bossChallengeBtn');
  if(bBtn) bBtn.style.display = (!mt.isBoss && S.stage % 10 === 9 && S.bossRetryAvailable) ? 'block' : 'none';

  renderAll();
}

/* ===== challengeBoss ===== */
function challengeBoss(){
  // 보스에게 패배한 뒤에만 재도전 버튼으로 보스전에 다시 들어간다.
  if(S.monster && S.monster.isBoss) return;
  if(S.stage % 10 !== 9 || !S.bossRetryAvailable) return;
  S.bossRetryAvailable = false;
  S.stage++;
  S.player.hp = calcMaxHp();
  spawnMonster();
}

/* ===== nextStage ===== */
function nextStage(){
  S.bossRetryAvailable = false;
  S.zeroOmegaCharge = 0; S.originVoidUsed = false;
  S.combatHits = 0; S.absDestroyCharge = 0; S.absSlaughterStacks = 0; S.absSlaughterBurstReady = false; S.originVoidCharge = 0; S.originSoulStacks = 0; S.originTimeCooldownUntil = 0; S.artifactBloodMark=false; S.artifactFateCharge=0; S.artifactCritHits=0; S.artifactEnemyHits=0; S.artifactVoidExecuteUsed=false; S.artifactWorldEndUsed=false; S.artifactCelestialUsed=false; S.artifactImmortalUsed=false; S.artifactCalamityMark=0;
  S.damageHistory = [];
  S.secondChanceUsed = false;
  S.rewindUsed = false;
  S.phaseBoost = 0;
  S.stage++;
  if(S.stage > S.maxStage) S.maxStage = S.stage;
  S.player.hp = calcMaxHp(); 
  spawnMonster();
}

/* ===== startCombatLoop ===== */
function startCombatLoop(){
  if(combatTimer) return;
  combatTimer = setInterval(combatTick, 1400);
  autosaveTimer = setInterval(saveGame, 15000);
}

/* ===== stopCombatLoop ===== */
function stopCombatLoop(){
  clearInterval(combatTimer); combatTimer=null;
  clearInterval(autosaveTimer); autosaveTimer=null;
}

/* ===== combatTick ===== */
function combatTick(){
  if(!S.studying) return;
  // 황금 재물룰렛이 표시되는 동안에는 전투 공격을 시작하지 않는다.
  // 룰렛이 완전히 사라진 뒤 다음 전투 틱부터 공격이 진행된다.
  const rouletteOverlay=document.getElementById('goldRouletteOverlay');
  if(rouletteOverlay && rouletteOverlay.classList.contains('show')) return;
  if(S.zero999TimeStop) return;
  if(!S.monster) spawnMonster(false);
  if(S.player.hp <= 0) return;
  if(hasPetEffect('limitBreak') && (S.combatHits||0) === 0) triggerPetEffectVisual('limitBreak');

  const critChance = Math.min(0.99, 0.15 + (growthBonus('critRate') + getPetBonus('critRate') + getPetSynergyBonus('critRate') + getPetEffectValue('crit') + getEquipOptionBonus('critRate') + getSetBonus('critRate') + getArtifactBonus('critRate')) / 100);
  let crit = Math.random() < critChance;
  if(crit) S.artifactCritHits=(S.artifactCritHits||0)+1;
  if(hasArtifactSynergy('fate',2) && (S.artifactFateCharge||0)>=6){ crit=true; S.artifactFateCharge=0; spawnDmgText('monsterWrap','FATE FORESEEN!','dmgText crit'); }
  else if(hasArtifactSynergy('fate',2)){ S.artifactFateCharge=(S.artifactFateCharge||0)+1; }
  let attackBase = calcAtk();
  const berserk = getPetEffectValue('berserk');
  if(berserk > 0 && S.player.hp / calcMaxHp() <= 0.30) attackBase = Math.round(attackBase * (1 + berserk/100));
  const eclipse = petProc('eclipse', getPetEffectValue('eclipse'));
  const voidJoker = petProc('voidJoker', getPetEffectValue('voidJoker'));
  const gearPower=getGearPowerState();
  const petDamageBeforeHit=Object.assign({},(S.damageStats&&S.damageStats.pets)||{});
  let dmg = Math.max(1, Math.round(attackBase * rand(0.85,1.15)));
  const artifactBaseDamage=dmg;
  let artifactDirectDamage=0;
  const artifactPetBaseTotal=Object.values((S.damageStats&&S.damageStats.pets)||{}).reduce((x,v)=>x+Number(v||0),0);
  // 유물 시너지 — 확률형 발동 없이 전투 행동/횟수/HP 조건으로만 작동
  const artifactHit = (S.combatHits || 0) + 1;
  const artifactCritHits = Number(S.artifactCritHits||0);
  const artifactEnemyHits = Number(S.artifactEnemyHits||0);

  if(hasArtifactSynergy('bloodmoon',2) && artifactCritHits>0 && artifactCritHits%4===0){
    dmg=Math.round(dmg*2.50); spawnDmgText('monsterWrap','BLOOD MOON!','dmgText crit');
  }
  if(hasArtifactSynergy('bloodmoon',3) && artifactHit%5===0){
    dmg=Math.round(dmg*1.35); spawnDmgText('monsterWrap','MOON TRACE!','dmgText extraDmg');
  }
  if(hasArtifactSynergy('bloodmoon',4) && S.monster.hp/S.monster.maxHp<=0.30){
    dmg=Math.round(dmg*1.50); spawnDmgText('monsterWrap','RED MOON END!','dmgText crit');
  }

  if(hasArtifactSynergy('void',2) && artifactHit%5===0){
    const extra=Math.max(1,Math.round(dmg*0.80)); dmg+=extra; spawnDmgText('monsterWrap','VOID RIFT!','dmgText crit');
  }
  if(hasArtifactSynergy('void',3) && S.monster.isBoss && artifactHit%5===0){
    const cut=Math.max(1,Math.round(S.monster.maxHp*0.002)); dmg+=cut; spawnDmgText('monsterWrap','ABYSS EAT!','dmgText crit');
  }
  if(hasArtifactSynergy('void',4) && S.monster.isBoss && S.monster.hp/S.monster.maxHp<=0.20 && !S.artifactVoidExecuteUsed){
    S.artifactVoidExecuteUsed=true; dmg=Math.max(dmg,S.monster.hp+1); spawnDmgText('monsterWrap','NULL EXECUTION!','dmgText crit');
  }

  if(hasArtifactSynergy('apocalypse',2) && artifactHit%4===0){
    const extra=Math.max(1,Math.round(dmg*0.80)); dmg+=extra; artifactDirectDamage+=extra; spawnDmgText('monsterWrap','STARFALL! +'+extra.toLocaleString(),'dmgText crit');
  }
  if(hasArtifactSynergy('apocalypse',3) && S.monster.isBoss && artifactHit%3===0){
    S.artifactApocBossHits=(S.artifactApocBossHits||0)+1;
    S.artifactApocStacks=(S.artifactApocStacks||0)+1;
    spawnDmgText('monsterWrap','CALAMITY '+S.artifactApocStacks,'dmgText crit');
    if(S.artifactApocStacks>=2){
      const extra=Math.max(1,Math.round(dmg*1.80)); dmg+=extra; artifactDirectDamage+=extra; S.artifactApocStacks=0;
      spawnDmgText('monsterWrap','CALAMITY BURST +'+extra.toLocaleString(),'dmgText crit');
    }
  }
  if(hasArtifactSynergy('apocalypse',4) && S.monster.isBoss && S.monster.hp/S.monster.maxHp<=0.30 && !S.artifactWorldEndUsed){
    S.artifactWorldEndUsed=true; const extra=Math.max(1,Math.round(dmg*3.0)); dmg+=extra; artifactDirectDamage+=extra; spawnDmgText('monsterWrap','WORLD END! +'+extra.toLocaleString(),'dmgText crit');
  }

  // ===== 성계 붕락 특수능력 =====
  if(hasArtifactCombo('star_collapse','world_end_eye') && crit){
    S.artifactStarCritCharge=(S.artifactStarCritCharge||0)+1;
    if(S.artifactStarCritCharge>=3){
      const extra=Math.max(1,Math.round(dmg*2.50)); dmg+=extra; artifactDirectDamage+=extra; S.artifactStarCritCharge=0;
      spawnDmgText('monsterWrap','STAR COLLAPSE +'+extra.toLocaleString(),'dmgText crit');
    }
  }
  if(hasArtifactCombo('apocalypse_mark','endless_flame') && S.monster.isBoss && artifactHit%3===0){
    S.artifactApocStacks=(S.artifactApocStacks||0)+1;
    if(S.artifactApocStacks>=2){
      const extra=Math.max(1,Math.round(dmg*2.50)); dmg+=extra; artifactDirectDamage+=extra; S.artifactApocStacks=0;
      spawnDmgText('monsterWrap','CALAMITY IGNITION +'+extra.toLocaleString(),'dmgText crit');
    }
  }
  if(hasArtifactCombo('star_collapse','endless_flame') && S.artifactApocKillReady){
    const extra=Math.max(1,Math.round(dmg*3.00)); dmg+=extra; artifactDirectDamage+=extra; S.artifactApocKillReady=false;
    spawnDmgText('monsterWrap','STAR EMBER +'+extra.toLocaleString(),'dmgText crit');
  }
  if(hasArtifactCombo('star_collapse','apocalypse_mark','world_end_eye') && S.monster.isBoss && S.monster.hp/S.monster.maxHp<=0.40 && !S.artifactApocCollapseUsed){
    S.artifactApocCollapseUsed=true; const extra=Math.max(1,Math.round(dmg*5.00)); dmg+=extra; artifactDirectDamage+=extra;
    spawnDmgText('monsterWrap','WORLD COLLAPSE +'+extra.toLocaleString(),'dmgText crit');
  }

  if(hasArtifactSynergy('fate',2) && (S.artifactFateCharge||0)>=5){
    crit=true; S.artifactFateCharge=0; spawnDmgText('monsterWrap','FATE FORESEEN!','dmgText crit');
  } else if(hasArtifactSynergy('fate',2)){ S.artifactFateCharge=(S.artifactFateCharge||0)+1; }

  if(hasArtifactSynergy('fate',3) && artifactCritHits>0 && artifactCritHits%5===0){
    const extra=Math.max(1,Math.round(dmg*0.60)); dmg+=extra; spawnDmgText('monsterWrap','FATE ECHO!','dmgText extraDmg');
  }
  if(hasArtifactSynergy('fate',4) && S.monster.isBoss && S.monster.hp/S.monster.maxHp<=0.25 && !S.artifactCelestialUsed){
    S.artifactCelestialUsed=true; dmg=Math.round(dmg*1.80); spawnDmgText('monsterWrap','CELESTIAL VERDICT!','dmgText crit');
  }

  /* 장비 랜덤 발동 효과 제거: TIME / ABSOLUTE */
  // ===== 신화: 능력치 제공 전용 =====
  // 신화 펫은 getPetBonus()를 통해 공격/체력/치명타/골드 등의 능력치만 제공한다.
  // 전투 중 별도 proc은 발생하지 않는다.

  // ===== 태초: 생존 특화형 =====
  // 공격력과 별개로 받는 피해 감소/회복/무효화에 집중한다.


  // ===== 절대극: 직접 피해형 =====
  // 절대극의 추가 피해는 플레이어 공격력에 섞지 않고, 각 펫이 직접 가하는 별도 피해로 처리한다.
  const absHit = (S.combatHits || 0) + 1;

  if((S.combatHits || 0) === 0){ dmg = Math.round(dmg * (1 + getPetEffectValue('firstStrike')/100)); }
  if(S.monster.isBoss){ dmg = Math.round(dmg * (1 + (getPetEffectValue('bossHunter') + getPetSynergyBonus('bossDmg') + getArtifactBonus('bossDmg') + originCoreBossBonus())/100)); }
  
  if(crit || S.forceArtifactCrit){ S.forceArtifactCrit=false;
    if(gearPower.infinity>0){ dmg += Math.max(1,Math.round(dmg*(.35+gearPower.infinity*.03))); spawnDmgText('monsterWrap','MUGUK IMPACT!','dmgText crit'); }
    const critDmgMult = 1.85 + (getPetBonus('critDmg') + getPetSynergyBonus('critDmg') + getEquipOptionBonus('critDmg') + getSetBonus('critDmg') + getArtifactBonus('critDmg')) / 100;
    dmg = Math.round(dmg * critDmgMult);
  }
  // 여기까지의 dmg는 '플레이어의 직접 공격 피해'다. ZERO1은 이 값만 복제한다.
  const zeroOnePlayerDamage = Math.max(1, Math.round(dmg));

  // ===== GOLD: 전투형 경제 특수효과 =====
  const goldHit = (S.combatHits || 0) + 1;
  if(getPetEffectValue('goldCoin') > 0 && goldHit % 3 === 0){
    const gd=Math.max(1,Math.round(attackBase * getPetEffectValue('goldCoin') / 100));
    dmg += gd; recordPetDamage('gold_slime',gd);
    S.goldCoinStacks=Math.min(5,(S.goldCoinStacks||0)+1);
    spawnDmgText('monsterWrap','금화 충격 +'+gd.toLocaleString(),'dmgText extraDmg');
    triggerPetEffectVisual('goldCoin');
  }
  if(getPetEffectValue('goldPickpocket') > 0 && goldHit % 4 === 0){
    const gd=Math.max(1,Math.round(attackBase * 250 / 100));
    dmg += gd; recordPetDamage('gold_goblin',gd);
    const stolen=Math.max(1,Math.floor(S.stage*10));
    S.gold += stolen;
    spawnDmgText('monsterWrap','강탈 +'+gd.toLocaleString(),'dmgText extraDmg');
    spawnDmgText('playerWrap','💰 훔침 +'+stolen.toLocaleString(),'dmgText extraDmg');
    triggerPetEffectVisual('goldPickpocket');
  }
  if(getPetEffectValue('goldJackpot') > 0 && Math.random() < 0.20){
    const gd=Math.max(1,Math.round(attackBase * 500 / 100));
    dmg += gd; recordPetDamage('gold_mimic',gd);
    if(true){ S.goldJackpotReady=true; spawnDmgText('monsterWrap','JACKPOT!','dmgText crit'); }
    else spawnDmgText('monsterWrap','보물 공격 +'+gd.toLocaleString(),'dmgText extraDmg');
    triggerPetEffectVisual('goldJackpot');
  }
  if(getPetEffectValue('goldVault') > 0 && goldHit % 5 === 0){
    const gd=Math.max(1,Math.round(attackBase * getPetEffectValue('goldVault') / 100));
    dmg += gd; recordPetDamage('gold_dragon',gd);
    S.goldVaultReady=true;
    spawnDmgText('monsterWrap','황금 브레스 +'+gd.toLocaleString(),'dmgText crit');
    triggerPetEffectVisual('goldVault');
  }

  // ===== 절대극 직접 추가 피해 =====
  // 각 절대극은 이제 플레이어 피해를 변조하지 않고 자기 이름으로 직접 피해를 기록한다.
  if(getPetEffectValue('absPierce') > 0){
    const petDmg=Math.max(1,Math.round(zeroOnePlayerDamage * getPetEffectValue('absPierce') / 100));
    spawnDmgText('monsterWrap','파멸: +'+petDmg.toLocaleString(),'dmgText extraDmg');
    triggerPetEffectVisual('absPierce');
  }
  if(getPetEffectValue('absSlaughter') > 0){
    S.absSlaughterStacks = Math.min(10, (S.absSlaughterStacks||0) + 1);
    const petDmg=Math.max(1,Math.round(zeroOnePlayerDamage * (getPetEffectValue('absSlaughter')/100) * S.absSlaughterStacks));
    dmg += petDmg; recordPetDamage('absolute_void',petDmg);
    if(S.absSlaughterStacks >= 10 && !S.absSlaughterBurstReady){ S.absSlaughterBurstReady=true; }
    if(S.absSlaughterBurstReady){
      const burst=Math.max(1,Math.round(zeroOnePlayerDamage*10));
      dmg += burst; recordPetDamage('absolute_void',burst);
      S.absSlaughterBurstReady=false; S.absSlaughterStacks=0;
      spawnDmgText('monsterWrap','학살 폭주: +'+burst.toLocaleString(),'dmgText extraDmg');
      triggerPetEffectVisual('absSlaughterBurst');
    }
    triggerPetEffectVisual('absSlaughter');
  }
  if(getPetEffectValue('absExecute') > 0 && S.monster.hp/S.monster.maxHp <= 0.30){
    const petDmg=Math.max(1,Math.round(zeroOnePlayerDamage * getPetEffectValue('absExecute') / 100));
    dmg += petDmg; recordPetDamage('absolute_executioner',petDmg);
    spawnDmgText('monsterWrap','처형: +'+petDmg.toLocaleString(),'dmgText extraDmg');
    triggerPetEffectVisual('absExecute');
  }
  if(getPetEffectValue('absBoss') > 0 && S.monster.isBoss){
    const pctDmg=Math.max(1,Math.round(zeroOnePlayerDamage * getPetEffectValue('absBoss') / 100));
    const bossCut=Math.max(1,Math.round(S.monster.maxHp*0.08));
    const petDmg=pctDmg+bossCut;
    triggerPetEffectVisual('absBoss');
    spawnDmgText('monsterWrap','멸망룡: +'+petDmg.toLocaleString(),'dmgText extraDmg');
  }
  if(getPetEffectValue('absBarrage') > 0 && absHit % 2 === 0){
    const shard=Math.max(1,Math.round(zeroOnePlayerDamage * getPetEffectValue('absBarrage') / 100));
    const extra=shard*6;
    dmg += extra; recordPetDamage('absolute_barrage',extra);
    spawnDmgText('monsterWrap','폭격: +'+extra.toLocaleString(),'dmgText extraDmg');
    triggerPetEffectVisual('absBarrage');
  }
  if(getPetEffectValue('absDestroy') > 0){
    const saved=Math.max(0,Math.round(zeroOnePlayerDamage*0.50));
    S.absDestroyCharge=Math.max(0,(S.absDestroyCharge||0)+saved);
    const threshold=Math.max(1,calcMaxHp());
    if(S.absDestroyCharge>=threshold){
      const burst=S.absDestroyCharge;
      dmg += burst; recordPetDamage('absolute_crit',burst);
      S.absDestroyCharge=0;
      triggerPetEffectVisual('absDestroy');
      spawnDmgText('monsterWrap','파괴신: +'+burst.toLocaleString(),'dmgText extraDmg');
    }
  }
  if(hasArtifactSynergy('fate',3) && crit){ const extra=Math.max(1,Math.round(dmg*0.55)); dmg+=extra; spawnDmgText('monsterWrap','FATE ECHO!','dmgText extraDmg'); }
  if(hasArtifactSynergy('fate',4) && S.monster.isBoss && S.monster.hp/S.monster.maxHp<=0.25 && crit){ dmg=Math.round(dmg*1.80); spawnDmgText('monsterWrap','CELESTIAL VERDICT!','dmgText crit'); }

  const artifactPetDelta=Object.values((S.damageStats&&S.damageStats.pets)||{}).reduce((x,v)=>x+Number(v||0),0)-artifactPetBaseTotal;
  const artifactContribution=Math.max(0,Math.round(artifactDirectDamage));
  if(artifactContribution>0) recordArtifactDamage('유물 직접 피해',artifactContribution);
  // 특수 펫: 시간/도박/처형 효과
  if(hasPetEffect('doubleNext') && (S.combatHits || 0) % 7 === 6){ dmg *= 2; spawnDmgText('monsterWrap', '+'+Math.round(dmg/2).toLocaleString(), 'dmgText extraDmg'); }
  const gamblerChance = Math.min(0.35, getPetEffectValue('gambler') / 100);
  if(gamblerChance > 0 && Math.random() < gamblerChance){ dmg = Math.round(dmg * 4); spawnDmgText('monsterWrap', '+'+Math.round(dmg*0.75).toLocaleString(), 'dmgText extraDmg'); }
  const dice = getPetEffectValue('dice');
  if(dice > 0){
    const diceHit = Math.random() < Math.min(0.35, dice/100);
    dmg = Math.round(dmg * (diceHit ? 4 : 1.5));
    if(diceHit) spawnDmgText('monsterWrap','+'+Math.round(dmg - Math.round(dmg/(diceHit?4:1.5))).toLocaleString(),'dmgText extraDmg');
  }
  if(voidJoker) dmg = Math.round(dmg * 1.4);
  // ZERO1 — 공격 피해 연쇄 복제: 첫 복제 확률 100% → 매 복제마다 10%p 감소, 복제 피해도 다시 복제
  if(hasPetEffect('zeroOne')){
    const zeroOnePetId='zero1';
    let zeroOneChance = 100;
    // ZERO1은 오직 '플레이어의 직접 공격 피해'만 복제한다.
    // 절대극/ERROR/ZERO 계열 등 펫이 직접 추가한 피해는 절대 복제하지 않는다.
    let zeroOneSource = zeroOnePlayerDamage;
    let zeroOneCount = 0;
    let zeroOneTotal = 0;
    while(zeroOneCount < 10 && zeroOneChance > 0){
      if(Math.random() * 100 >= zeroOneChance) break;
      const clone = Math.max(1, Math.round(zeroOneSource * 0.70));
      dmg += clone;
      zeroOneTotal += clone;
      zeroOneCount++;
      zeroOneSource = clone;
      zeroOneChance -= 10;
    }
    window.__zeroOneLastCount = zeroOneCount;
    window.__zeroOneLastDamage = zeroOneTotal;
    if(zeroOneCount > 0){
      recordPetDamage(zeroOnePetId, zeroOneTotal);
      spawnDmgText('monsterWrap',`COPY: ${zeroOneTotal.toLocaleString()}`,'dmgText extraDmg');
      triggerPetEffectVisual('zeroOne');
    }
  }
  // ZERO 전용 무한 콤보: 피격 여부와 관계없이 공격할 때마다 1→2→3→4→5→1... 순환
  if(hasPetEffect('zeroCombo')){
    triggerPetEffectVisual('zeroCombo');
    const zeroHit = Math.min(5, ((S.combatHits || 0) % 5) + 1);
    if(zeroHit === 1){
      const z1 = Math.max(1, Math.round(attackBase * 1.50));
      dmg += z1; recordPetDamage('pet_zero',z1);
      const zHeal1 = Math.max(1, Math.round(z1 * 0.01));
      S.player.hp = Math.min(calcMaxHp(), S.player.hp + zHeal1);
      spawnDmgText('monsterWrap','zero: '+z1.toLocaleString(),'dmgText extraDmg');
      spawnDmgText('playerWrap','ZERO HEAL +'+zHeal1.toLocaleString(),'dmgText extraDmg');
    } else if(zeroHit === 2){
      const z2 = Math.max(1, Math.round(attackBase * 2.50));
      dmg += z2; recordPetDamage('pet_zero',z2);
      // 과거 방어 관통 효과는 이제 순수 추가 피해 효과로 전환됨.
      spawnDmgText('monsterWrap','zero: '+z2.toLocaleString(),'dmgText extraDmg');
    } else if(zeroHit === 3){
      const z3 = Math.max(1, Math.round(S.monster.hp * (S.monster.isBoss ? 0.03 : 0.08)));
      const z3Atk=Math.max(1, Math.round(attackBase * 1.50)); const z3Total=z3+z3Atk;
      dmg += z3Total; recordPetDamage('pet_zero',z3Total);
      const zHeal3 = Math.max(1, Math.round(z3Total * 0.03));
      S.player.hp = Math.min(calcMaxHp(), S.player.hp + zHeal3);
      spawnDmgText('monsterWrap','zero: '+z3Total.toLocaleString(),'dmgText extraDmg');
      spawnDmgText('playerWrap','ZERO HEAL +'+zHeal3.toLocaleString(),'dmgText extraDmg');
    } else if(zeroHit === 4){
      const z4 = Math.max(1, Math.round(attackBase * 4.00));
      dmg += z4; recordPetDamage('pet_zero',z4);
      spawnDmgText('monsterWrap','zero: '+z4.toLocaleString(),'dmgText extraDmg');
    } else {
      const z5 = Math.max(1, Math.round(attackBase * 12.00));
      const z5Hp = Math.max(1, Math.round(S.monster.hp * (S.monster.isBoss ? 0.05 : 0.12)));
      const z5Total=z5+z5Hp;
      dmg += z5Total; recordPetDamage('pet_zero',z5Total);
      const zHeal5 = Math.max(1, Math.round(z5Total * 0.01));
      S.player.hp = Math.min(calcMaxHp(), S.player.hp + zHeal5);
      spawnDmgText('monsterWrap','zero: '+z5Total.toLocaleString(),'dmgText extraDmg');
      spawnDmgText('playerWrap','ZERO HEAL +'+zHeal5.toLocaleString(),'dmgText extraDmg');
    }
  }
  if(hasPetEffect('combo') && (S.combatHits||0) % 3 === 2){ const cd=Math.max(1,Math.round(calcAtk()*getPetEffectValue('combo')/100)); dmg += cd; recordPetDamage('pet_wolf',cd); spawnDmgText('monsterWrap','+'+cd.toLocaleString(),'dmgText extraDmg'); }
  if(hasPetEffect('meteor') && (S.combatHits||0) % 5 === 4){ const md=Math.max(1,Math.round(calcAtk()*getPetEffectValue('meteor')/100)); dmg += md; spawnDmgText('monsterWrap','+'+md.toLocaleString(),'dmgText extraDmg'); }
  // 추가 특수 펫 효과
  if(getPetEffectValue('thunder') > 0 && (S.combatHits||0) % 4 === 3){
    const td = Math.max(1, Math.round(calcAtk()*(getPetEffectValue('thunder')/100))); dmg += td; recordPetDamage('pet_panther',td); spawnDmgText('monsterWrap','+'+td.toLocaleString(),'dmgText extraDmg');
  }
  if(getPetEffectValue('airStrike') > 0 && (S.combatHits||0) % 3 === 2){
    const ad = Math.max(1, Math.round(calcAtk()*(getPetEffectValue('airStrike')/100))); dmg += ad; recordPetDamage('pet_eagle',ad); spawnDmgText('monsterWrap','+'+ad.toLocaleString(),'dmgText extraDmg');
  }
  if(getPetEffectValue('burn') > 0 && Math.random() < getPetEffectValue('burn')/100){
    const bd = Math.max(1, Math.round(S.monster.maxHp*0.04)); const burnDmg=Math.min(bd, S.monster.isBoss ? Math.ceil(S.monster.maxHp*0.015) : bd); dmg += burnDmg; recordPetDamage('pet_dragon_baby',burnDmg); spawnDmgText('monsterWrap','+'+Math.min(bd, S.monster.isBoss ? Math.ceil(S.monster.maxHp*0.015) : bd).toLocaleString(),'dmgText extraDmg');
  }
  if(getPetEffectValue('copy') > 0 && Math.random() < Math.min(0.35, getPetEffectValue('copy')/100)){ const copyDmg=Math.max(1,Math.round(dmg*0.55)); dmg += copyDmg; spawnDmgText('monsterWrap','+'+copyDmg.toLocaleString(),'dmgText extraDmg'); }
  if(getPetEffectValue('phase') > 0 && Math.random() < getPetEffectValue('phase')/100){
    S.phaseBoost = 1.2; spawnDmgText('monsterWrap','PHASE!','dmgText crit');
  }
  if(S.phaseBoost){ dmg = Math.round(dmg*S.phaseBoost); S.phaseBoost = 0; }
  if(getPetEffectValue('haste') > 0 && (S.combatHits||0) % 4 === 3){
    const hd=Math.max(1,Math.round(attackBase*rand(0.85,1.15))); dmg += hd; spawnDmgText('monsterWrap','+'+hd.toLocaleString(),'dmgText extraDmg');
  }
  if(getPetEffectValue('voidBurst') > 0 && (S.combatHits||0) % 5 === 4){
    const vb=Math.max(1,Math.round(S.monster.hp*(S.monster.isBoss?0.07:0.18))); dmg += vb; spawnDmgText('monsterWrap','+'+vb.toLocaleString(),'dmgText extraDmg');
  }
  if(getPetEffectValue('absoluteBonus') > 0 && (S.combatHits||0) % 5 === 4){
    const sd=Math.max(1,Math.round(attackBase*(1+getPetEffectValue('absoluteBonus')/100)*rand(0.9,1.1))); dmg += sd; spawnDmgText('monsterWrap','+'+sd.toLocaleString(),'dmgText extraDmg');
  }
  if(getPetEffectValue('dimension') > 0 && Math.random() < getPetEffectValue('dimension')/100){
    const dd=Math.max(1,Math.round(S.monster.maxHp*(S.monster.isBoss?0.015:0.05))); dmg += dd; spawnDmgText('monsterWrap','+'+dd.toLocaleString(),'dmgText extraDmg');
  }
  if(getPetEffectValue('absolute') > 0 && (S.combatHits||0) % 4 === 3){
    const zd=Math.max(1,Math.round(calcAtk()*12)); dmg += zd; spawnDmgText('monsterWrap','+'+zd.toLocaleString(),'dmgText extraDmg');
  }
  if(getPetEffectValue('apocalypse') > 0 && (S.combatHits||0) % 5 === 4){
    const ap=Math.max(1,Math.round(S.monster.maxHp*(S.monster.isBoss?0.08:0.35))); dmg += ap; spawnDmgText('monsterWrap','+'+ap.toLocaleString(),'dmgText extraDmg');
  }
  if(getPetEffectValue('fate') > 0 && (S.combatHits||0) % 5 === 4){
    const hist=(S.damageHistory||[]); if(hist.length) { const fd=Math.max(...hist.slice(-3)); dmg += fd*2; spawnDmgText('monsterWrap','FATE!','dmgText crit'); }
  }
  const executePct = getPetEffectValue('execute');
  if(executePct > 0 && S.monster.hp / S.monster.maxHp <= executePct/100){ dmg = Math.max(dmg, Math.ceil(S.monster.hp)); spawnDmgText('monsterWrap', 'EXECUTE!', 'dmgText crit'); }

  // ERROR — 플레이어의 '일반 공격'에만 반응.
  // 매 일반 공격마다 최종 플레이어 공격력의 300%를 고정 추가하고,
  // 3번째 일반 공격마다 공격력 1000%의 폭주 피해를 한 번 더 추가한다.
  // 최대 HP/치명타/랜덤 배율을 무시하며 ZERO999의 9연격에는 반응하지 않는다.
  const errorValue = getPetEffectValue('errorFixed');
  if(errorValue > 0){
    S.errorHitCount = (S.errorHitCount || 0) + 1;
    const errorDmg = Math.max(1, Math.round(calcAtk() * (errorValue / 100)));
    dmg += errorDmg; recordPetDamage('error',errorDmg);
    spawnDmgText('monsterWrap','ERROR: '+errorDmg.toLocaleString(),'dmgText errorFixedDmg');
    triggerPetEffectVisual('errorFixed');
    if(S.errorHitCount % 3 === 0){
      const errorBurst = Math.max(1, Math.round(calcAtk() * 10));
      dmg += errorBurst; recordPetDamage('error',errorBurst);
      spawnDmgText('monsterWrap','ERROR BURST: '+errorBurst.toLocaleString(),'dmgText errorFixedDmg');
      triggerPetEffectVisual('errorFixed');
    }
  }

  // ZERO∞ 반사 — 일반 플레이어 공격 직전에 축적 피해를 방출한다.
  // 반사 피해는 '플레이어의 공격'에 반응해 발생하는 별도 효과이므로 ERROR와 ZERO999 9연격을 연쇄 발동시키지 않는다.
  const zeroOmegaCharge = Math.max(0, Math.round(S.zeroOmegaCharge || 0));
  const zeroOmega = getPetEffectValue('zeroOmega');
  if(zeroOmega > 0 && zeroOmegaCharge > 0){
    const reflectMult = 2.00; // 축적 흡수 피해의 200% 반사
    const omegaDmg = Math.max(1, Math.round(zeroOmegaCharge * reflectMult));
    dmg += omegaDmg; recordPetDamage('zeroOmega',omegaDmg);
    spawnDmgText('monsterWrap','ZERO∞ REFLECT: '+omegaDmg.toLocaleString(),'dmgText zeroOmegaDmg');
    triggerPetEffectVisual('zeroOmega', omegaDmg, zeroOmegaCharge);
    S.zeroOmegaCharge = 0;
  }

  S.combatHits = (S.combatHits || 0) + 1;
  const petBeforeTotal=Object.values(petDamageBeforeHit||{}).reduce((a,v)=>a+Number(v||0),0);
  const petRawTotal=Object.values((S.damageStats&&S.damageStats.pets)||{}).reduce((a,v)=>a+Number(v||0),0);
  const petDamageThisHit=Math.max(0,petRawTotal-petBeforeTotal);
  const spouseExtra=applySpousePetDamageScale(petDamageBeforeHit);
  dmg += spouseExtra;
  const artifactDamageThisHit=Math.max(0,artifactContribution||0);
  recordPlayerDamage(Math.max(0,dmg-(petDamageThisHit+spouseExtra+artifactDamageThisHit)));
  if(document.getElementById('damageReportModalBg')?.classList.contains('show')) renderDamageReport();
  S.monster.hp -= dmg;
  sfx(crit ? 'critHit' : 'hit');
  if(gearPower.origin>0 && S.player.hp/calcMaxHp()<=.30 && !S.gearOriginUsed){ S.gearOriginUsed=true; const gh=Math.max(1,Math.round(calcMaxHp()*.18)); S.player.hp=Math.min(calcMaxHp(),S.player.hp+gh); spawnDmgText('playerWrap','PRIMAL RETURN!','dmgText crit'); }
  S.damageHistory = (S.damageHistory || []).concat([dmg]).slice(-10);
  const life = getPetEffectValue('lifesteal');
  if(life > 0){ const heal=Math.max(1,Math.round(dmg*life/100)); S.player.hp=Math.min(calcMaxHp(),S.player.hp+heal); }

  const stick = document.getElementById('stickmanSvg');
  stick.classList.add('attack'); setTimeout(()=>stick.classList.remove('attack'), 280);
  
  const slash = document.getElementById('slashFx');
  slash.className = 'slashFx'; 
  void slash.offsetWidth;
  
  const isTrans = S.equip.weapon && S.equip.weapon.transcend > 0;
  if(isTrans) {
    slash.classList.add('show-transcend');
  } else {
    const weapGrade = S.equip.weapon ? S.equip.weapon.grade : 0;
    if(weapGrade <= 3) slash.classList.add('show-lvl1');
    else if(weapGrade <= 7) slash.classList.add('show-lvl2');
    else if(weapGrade <= 13) slash.classList.add('show-lvl3');
    else slash.classList.add('show-lvl4');
  }
  
  spawnDmgText('monsterWrap', (crit?'CRIT ':'')+dmg, crit?'dmgText crit':'dmgText mdmg');

  // 그림자 잔영 등 추가 데미지 펫 이펙트 및 타격
  const extraMult = getPetExtraAtkMult();
  if(extraMult > 0){
    const extraDmg = Math.max(1, Math.round(dmg * extraMult * getSpousePetDamageMult()));
    S.monster.hp -= extraDmg;
    const extraEntries=getPetExtraAtkEntries();
    const extraSum=extraEntries.reduce((a,[,m])=>a+m,0)||1;
    extraEntries.forEach(([id,m])=>recordPetDamage(id, Math.round(extraDmg*m/extraSum)));
    
    const extraFx = document.getElementById('extraFx');
    extraFx.className = 'extraFx';
    void extraFx.offsetWidth;
    extraFx.classList.add('show');

    setTimeout(() => {
      spawnDmgText('monsterWrap', '+' + extraDmg, 'dmgText extraDmg');
    }, 150);
  }

  const me = document.getElementById('monsterEmoji');
  me.classList.add('hurt'); setTimeout(()=>me.classList.remove('hurt'), 300);

  if(S.monster.hp <= 0){
    onMonsterKilled();
    renderAll();
    return;
  }

  renderTopStats();
  updateHpBars();

  setTimeout(()=>{
    if(!S.studying || !S.monster || S.monster.hp <= 0) return;
    
    const mWrap = document.getElementById('monsterWrap');
    if(S.monster.isBoss){
      mWrap.classList.add('boss-atk');
      setTimeout(()=>mWrap.classList.remove('boss-atk'), 350);
      sfx('heavyHit');
    } else {
      mWrap.classList.add('mob-atk');
      setTimeout(()=>mWrap.classList.remove('mob-atk'), 300);
      sfx('hit');
    }

    let mdmg = Math.max(1, Math.round(S.monster.atk * rand(0.85,1.15)));
    /* 장비 랜덤 발동 효과 제거: VOID — 몬스터 피해를 0으로 만들던 확률 효과 */
    if(gearPower.holy>0 && mdmg>0 && !S.gearShieldUsed){ const shieldReduction=0.20; mdmg=Math.max(1,Math.round(mdmg*(1-shieldReduction))); S.gearShieldUsed=true; spawnDmgText('playerWrap','SANCTUARY!','dmgText extraDmg'); }
    // 생존 펫은 공격 횟수 기반으로 확정 발동
    const enemyHit = (S.enemyAttackCount || 0) + 1;
    S.enemyAttackCount = enemyHit;
    const has = k => getPetEffectValue(k) > 0;
    if(has('guardFixed')){
      const v=getPetEffectValue('guardFixed');
      if(enemyHit%3===0) mdmg=Math.round(mdmg*(1-v/100));
    }
    if(has('slowFixed') && enemyHit%4===0){ mdmg=Math.round(mdmg*(1-getPetEffectValue('slowFixed')/100)); S.enemySlowTurns=1; }
    if(has('dodgeFixed') && (enemyHit===1 || enemyHit%6===0)) mdmg=Math.round(mdmg*(1-getPetEffectValue('dodgeFixed')/100));
    if(has('phaseFixed') && enemyHit%5===0){ const reduction=getPetEffectValue('phaseFixed')/100; mdmg=Math.round(mdmg*(1-reduction)); S.phaseBoost=1.7; }
    if(has('phaseFixed') && enemyHit%6===0){ mdmg=0; S.phaseBoost=1.6; }
    // 태초 생존 특화: 전부 확정 발동이며 공격력에는 관여하지 않는다.
    if(has('originMeteorGuard') && enemyHit%3===0){ mdmg=Math.round(mdmg*0.55); spawnDmgText('playerWrap','METEOR GUARD!','dmgText extraDmg'); triggerPetEffectVisual('originMeteorGuard'); }
    if(has('originTimeGuard') && mdmg>0 && (Date.now() >= (S.originTimeCooldownUntil||0)) && Math.random()<0.15){ mdmg=0; S.originTimeCooldownUntil=Date.now()+3000; spawnDmgText('playerWrap','TIME STOP!','dmgText extraDmg'); triggerPetEffectVisual('originTimeGuard'); }
    // 태초 공허안 — 스테이지당 1회만 발동. 실제 HP 피해의 20%를 저장하고, HP 40% 이하에서 70% 회복
    if(has('originVoidGuard') && mdmg>0 && !S.originVoidUsed){
      const absorbed=Math.max(1,Math.floor(mdmg*0.20));
      S.originVoidCharge=Math.min(calcMaxHp(),(S.originVoidCharge||0)+absorbed);
      S.player.hp=Math.max(1,S.player.hp-(mdmg-absorbed));
      mdmg=0;
      S.originVoidUsed = true;
      if(S.player.hp/calcMaxHp()<=0.40 && S.originVoidCharge>0){
        const heal=Math.max(1,Math.round(S.originVoidCharge*0.70));
        S.player.hp=Math.min(calcMaxHp(),S.player.hp+heal);
        S.originVoidCharge=0;
        triggerPetEffectVisual('originVoidGuard');
        spawnDmgText('playerWrap','VOID HEAL +'+heal.toLocaleString(),'dmgText extraDmg');
      }
    }
    if(has('originChaosGuard') && S.player.hp/calcMaxHp()<=0.50 && mdmg>0){ mdmg=Math.round(mdmg*0.60); spawnDmgText('playerWrap','CHAOS GUARD!','dmgText extraDmg'); triggerPetEffectVisual('originChaosGuard'); }
    if(has('originStarGuard') && mdmg>0){ mdmg=Math.round(mdmg*0.80); if(enemyHit%4===0) triggerPetEffectVisual('originStarGuard'); }
    if((S.originSoulStacks||0)>0 && mdmg>0){ mdmg=Math.round(mdmg * (1 - Math.min(0.15,(S.originSoulStacks||0)*0.03))); }
    if(hasPetSynergy('origin_trinity') && mdmg>0){ mdmg=Math.round(mdmg*0.90); triggerPetEffectVisual('origin_trinity'); }
    if(has('originChaosGuard') && S.player.hp/calcMaxHp()<=0.50 && hasPetSynergy('origin_chaos_star') && mdmg>0){ mdmg=Math.round(mdmg*0.85); triggerPetEffectVisual('origin_chaos_star'); }
    if(hasPetSynergy('origin_chaos_star') && enemyHit%5===0 && mdmg>0){ mdmg=Math.round(mdmg*0.10); triggerPetEffectVisual('origin_chaos_star'); }
    if(has('originMirror') && enemyHit%5===0){ const ref=Math.max(1,Math.round(mdmg*0.40)); mdmg=Math.round(mdmg*0.60); S.originMirrorReflect=(S.originMirrorReflect||0)+ref; }
    if(S.originMirrorReflect>0){ const rd=S.originMirrorReflect; S.originMirrorReflect=0; S.pendingMirrorDamage=rd; }
    S.artifactEnemyHits=(S.artifactEnemyHits||0)+1;
    if(hasArtifactSynergy('immortal',3) && S.player.hp/calcMaxHp()<=0.30 && mdmg>0){ mdmg=Math.max(1,Math.round(mdmg*0.70)); }

    // ZERO∞ — 적에게 받은 실제 피해의 60%를 흡수해 저장하고, 실제 HP 피해를 40%로 줄인다.
    // 회피/무효화로 mdmg가 0이면 흡수도 발생하지 않는다.
    const omegaAbsorbPct = getPetEffectValue('zeroOmega');
    let omegaAbsorbed = 0;
    if(omegaAbsorbPct > 0 && mdmg > 0){
      omegaAbsorbed = Math.max(0, Math.floor(mdmg * omegaAbsorbPct / 100));
      if(omegaAbsorbed > 0){
        S.zeroOmegaCharge = Math.max(0, Math.round((S.zeroOmegaCharge || 0) + omegaAbsorbed));
        mdmg -= omegaAbsorbed;
        triggerPetEffectVisual('zeroOmega', 0, omegaAbsorbed);
        spawnDmgText('playerWrap','ABSORB +'+omegaAbsorbed.toLocaleString(),'dmgText zeroOmegaDmg');
      }
    }

    if(S.pendingMirrorDamage>0){
      const rd=S.pendingMirrorDamage; S.pendingMirrorDamage=0;
      S.monster.hp=Math.max(1,S.monster.hp-rd);
      spawnDmgText('monsterWrap','MIRROR: '+rd.toLocaleString(),'dmgText extraDmg');
    }
    // 일반 적 공격은 최종 피해가 절대 0이 되지 않도록 보정한다.
    // 무효화/회피 계열 효과가 연속 적용되면서 0 피해가 표시되는 문제를 방지한다.
    if(mdmg <= 0 && S.player.hp > 0){ mdmg = 1; }
    if(mdmg > 0){
      S.player.hp -= mdmg;
      if(hasPetEffect('originSoulGuard')){
        const heal=Math.max(1,Math.round(calcMaxHp()*0.04));
        S.originSoulStacks=Math.min(5,(S.originSoulStacks||0)+1);
        S.player.hp=Math.min(calcMaxHp(),S.player.hp+heal);
        spawnDmgText('playerWrap','SOUL REGEN +'+heal.toLocaleString(),'dmgText extraDmg');
        triggerPetEffectVisual('originSoulGuard');
      }
    }
    stick.classList.add('hurt'); setTimeout(()=>stick.classList.remove('hurt'), 300);
    sfx('hurt');
    spawnDmgText('playerWrap', mdmg, 'pdmg');
    if(S.player.hp <= 0){
      if(hasPetEffect('zeroReset') && !S.zeroResetUsed){
        S.zeroResetUsed = true;
        S.player.hp = Math.max(1, Math.round(S.zeroResetStartHp || calcMaxHp()));
        S.secondChanceUsed = true;
        S.rewindUsed = true;
        mdmg = 0;
        triggerZeroResetVisual();
        spawnDmgText('playerWrap','ATTACK NULL!','dmgText crit');
        toast('🛡️ 알파제로 · 치명상을 무효화했습니다!');
      } else if(hasArtifactSynergy('immortal',2) && !S.artifactImmortalUsed){
        S.artifactImmortalUsed=true; S.player.hp=Math.max(1,Math.round(calcMaxHp()*(hasArtifactSynergy('immortal',4)?0.35:0.01))); if(hasArtifactSynergy('immortal',4)) S.player.hp=Math.max(1,Math.round(calcMaxHp()*0.35)); spawnDmgText('playerWrap','IMMORTAL SANCTUARY!','dmgText crit'); toast('🜂 불멸성역이 치명상을 막았습니다!');
      } else {
      const sc = getPetEffectValue('secondChanceFixed');
      if(sc > 0 && !S.secondChanceUsed){
        S.secondChanceUsed=true; S.player.hp=Math.max(1,Math.round(calcMaxHp()*sc/100)); spawnDmgText('playerWrap','SECOND CHANCE!','dmgText crit');
      } else {
        const rw = getPetEffectValue('rewind');
        if(rw > 0 && !S.rewindUsed && Math.random() < rw/100){
          S.rewindUsed = true; S.player.hp = Math.max(1, Math.round(calcMaxHp()*0.30)); spawnDmgText('playerWrap','REWIND!','dmgText crit'); toast('⌛ 시간 모래시계가 치명상을 되돌렸습니다!');
        } else if(triggerZero999LastStand()){
          // 모든 유물/알파제로 생존 판정이 끝난 뒤 ZERO999가 마지막으로 개입한다.
          return;
        } else onPlayerDefeated();
      }
      }
    }
    renderAll();
  }, 500);
}

/* ===== onMonsterKilled ===== */
function onMonsterKilled(){
  S.artifactApocKillCount=(S.artifactApocKillCount||0)+1;
  if(hasArtifactCombo('star_collapse','endless_flame') && S.artifactApocKillCount%3===0) S.artifactApocKillReady=true;
  S.artifactTreasureCycle=(S.artifactTreasureCycle||0)+1;
  const stage = S.stage;
  const isBoss = S.monster.isBoss;
  
  const goldBonus = 1 + (S.research.goldLv * 0.10) + (growthBonus('goldPct')/100) + (getPetBonus('goldBonus') + getPetSynergyBonus('goldBonus') + getEquipOptionBonus('goldBonus') + getSetBonus('goldBonus') + getArtifactBonus('goldPct')) / 100;
  const expBonus = 1 + (growthBonus('expPct')/100) + (getPetBonus('expBonus') + getPetSynergyBonus('expBonus') + getArtifactBonus('expPct')) / 100 + (getPetEffectValue('studyExp') + getPetEffectValue('expBonus')) / 100 + getEquipOptionBonus('expBonus') / 100;
  
  // 몬스터 기본 골드 지급량: 기존 수치 유지
  let baseGold = isBoss ? rand(1200, 1900) : rand(20, 45);
  // 몬스터 골드 목표치: 1스테이지 약 25, 100 약 1만, 500 약 100만,
  // 1000 약 1천만, 2000 약 3천만 수준으로 부드럽게 성장
  // 기준 스케일은 1스테이지 25골드이며, 구간별 지수 보간으로 목표값을 맞춘다.
  const goldStage=Math.max(1,stage);
  const goldAnchors=[
    [1,25],
    [100,10000],
    [500,1000000],
    [1000,10000000],
    [2000,30000000]
  ];
  let baseStageGold=25;
  if(goldStage<=1){
    baseStageGold=25;
  }else{
    let a=goldAnchors[goldAnchors.length-2], b=goldAnchors[goldAnchors.length-1];
    for(let i=0;i<goldAnchors.length-1;i++){
      if(goldStage>=goldAnchors[i][0] && goldStage<=goldAnchors[i+1][0]){
        a=goldAnchors[i]; b=goldAnchors[i+1]; break;
      }
    }
    const t=Math.max(0,Math.min(1,
      (Math.log(goldStage)-Math.log(a[0]))/(Math.log(b[0])-Math.log(a[0]))
    ));
    baseStageGold=Math.exp(Math.log(a[1])+(Math.log(b[1])-Math.log(a[1]))*t);
  }
  const stageVariance=rand(0.94,1.06);
  const rareGoldMult=S.monster.isRare?5:1;
  const goldGain=Math.floor(baseStageGold*stageVariance*rareGoldMult*goldBonus);
  const sellBoost = getPetEffectValue('sellBoost');
  let expGain = Math.floor((18 + stage*3.3) * rand(0.9,1.1) * expBonus);
  if(S.monster.isRare) expGain*=2;
  
  // 생명의 정수(펫 소환 재화): 일반 몬스터는 1~5개, 보스는 현재 스테이지 × 2.5개
  const essenceGain = isBoss ? Math.max(1, Math.floor(stage * 2.5)) : Math.floor(rand(1, 6));
  S.essence += essenceGain;

  let finalGoldGain = goldGain;
  // GOLD 펫 전용 보상: 단순 골드 % 스탯이 아니라 전투에서 만든 상태로 보상을 변화시킨다.
  if((S.goldCoinStacks||0)>0){
    finalGoldGain += Math.floor(S.goldCoinStacks * Math.max(1, stage * 20));
  }
  if(S.goldJackpotReady){
    finalGoldGain *= 4;
    S.goldJackpotReady=false;
  }
  if(S.goldVaultReady){
    finalGoldGain *= (isBoss ? 6 : 3);
    S.goldVaultReady=false;
  }
  if(hasArtifactSynergy('treasure',2) && (S.artifactTreasureCycle||0)>0 && (S.artifactTreasureCycle%3===0)) finalGoldGain*=3;
  if(hasArtifactSynergy('treasure',4) && !isBoss && (S.artifactTreasureCycle||0)>0 && (S.artifactTreasureCycle%10===0)) finalGoldGain*=5;
  if(hasArtifactSynergy('treasure',3) && isBoss) addArtifactShards(Math.max(5,Math.floor(stage*1)),'역천의 금고');
  const treasureChance = Math.min(0.40, getPetEffectValue('treasure') / 100);
  if(treasureChance > 0 && Math.random() < treasureChance){ finalGoldGain *= 3; toast('🪙 보물 펫 발동! 골드 3배!'); }
  const essenceBonus = getPetEffectValue('essence');
  S.gold += finalGoldGain;
  if(essenceBonus > 0 && Math.random() < essenceBonus/100) S.essence += essenceGain;
  const essenceLuck = getPetEffectValue('essenceLuck');
  if(essenceLuck > 0 && Math.random() < essenceLuck/100) S.essence += essenceGain;
  const soulPet = getPetEffectValue('soul');
  if(soulPet > 0 && Math.random() < soulPet/100) S.soulStones += 1;
  gainExp(expGain);
  if(S.focusMode){
    S.focusSession.gold += finalGoldGain;
    S.focusSession.exp += expGain;
    S.focusSession.kills += 1;
    if(S.focusSession.kills % 10 === 0 || isBoss) S.focusSession.boxes += isBoss ? 2 : 1;
  }

  document.getElementById('monsterEmoji').classList.add('dead');

  // 몬스터 처치 시 잡템 드롭: 기본 50%
  const item = Math.random() < 0.50 ? rollDropItem(stage, isBoss) : null;
  
  if(item) S.bagJunk.push(item);
  if(item && sellBoost > 0) item.sellBonus = sellBoost;
  if(item && getPetEffectValue('junkLuck') > 0 && Math.random() < Math.min(0.45, getPetEffectValue('junkLuck')/100)){ const extra = {...item, id:uid()}; S.bagJunk.push(extra); }
  if(getPetEffectValue('essenceFind') > 0 && Math.random() < Math.min(0.45, getPetEffectValue('essenceFind')/100)) S.essence += 2;
  if(getPetEffectValue('tripleLoot') > 0 && Math.random() < Math.min(0.40, getPetEffectValue('tripleLoot')/100)){ S.essence += essenceGain; S.soulStones += 1; }
  let artifactDrop=0;
  if(isBoss){ artifactDrop=Math.floor(rand(8,15)); S.artifactShards += artifactDrop; }
  else if(Math.random() < 0.0035){ artifactDrop=Math.floor(rand(1,3)); S.artifactShards += artifactDrop; }
  toast(`+💰${fmt(finalGoldGain)} · 🌿+${essenceGain}${artifactDrop?` · 🌌+${artifactDrop} 유물 파편`:''}${item?` · [잡템] ${item.name}`:' · 잡템 없음'}`);

  setTimeout(()=> {
    // 일반 진행에서는 9, 19, 29... 스테이지 클리어 후 바로 다음 보스전으로 진입한다.
    // 보스에게 패배했을 때만 이전 9단계로 돌아가 재도전 버튼이 나타난다.
    nextStage();
  }, 260);
}

/* ===== onPlayerDefeated ===== */
function onPlayerDefeated(){
  S.player.hp = calcMaxHp();
  if(S.monster && S.monster.isBoss){
    S.stage = Math.max(1, S.stage - 1);
    S.pendingBoss = false;
  S.bossRetryAvailable = false;
    toast('💥 보스에게 패배했습니다! 전 스테이지로 후퇴합니다.');
  } else {
    S.stage = Math.max(1, S.stage-1);
    toast('💥 졸라맨이 쓰러졌습니다! 이전 스테이지로 후퇴합니다.');
  }
  spawnMonster(false);
}