/* ===== recordPetDamage ===== */
function recordPetDamage(petId, amount){ const sp=getEquippedSpouse(); if(sp?.special==='petHeal'&&amount>0&&S.player)S.player.hp=Math.min(calcMaxHp(),Number(S.player.hp||0)+Math.max(1,Math.round(amount*0.03)));
  amount=Math.max(0,Math.round(amount||0)); if(!amount) return;
  if(!S.damageStats || typeof S.damageStats!=='object') S.damageStats={player:0,pets:{}};
  if(!S.damageStats.pets || typeof S.damageStats.pets!=='object') S.damageStats.pets={};
  S.damageStats.pets[petId]=(S.damageStats.pets[petId]||0)+amount;
}

/* ===== recordPlayerDamage ===== */
function recordPlayerDamage(amount){
  amount=Math.max(0,Math.round(amount||0)); if(!amount) return;
  if(!S.damageStats || typeof S.damageStats!=='object') S.damageStats={player:0,pets:{},artifacts:{}};
  if(!S.damageStats.artifacts || typeof S.damageStats.artifacts!=='object') S.damageStats.artifacts={};
  S.damageStats.player=(S.damageStats.player||0)+amount;
}

/* ===== recordArtifactDamage ===== */
function recordArtifactDamage(label, amount){
  amount=Math.max(0,Math.round(amount||0)); if(!amount) return;
  if(!S.damageStats || typeof S.damageStats!=='object') S.damageStats={player:0,pets:{},artifacts:{}};
  if(!S.damageStats.artifacts || typeof S.damageStats.artifacts!=='object') S.damageStats.artifacts={};
  S.damageStats.artifacts[label]=(S.damageStats.artifacts[label]||0)+amount;
}

/* ===== calcAtk ===== */
function calcAtk(){
  const b = equippedBonus();
  let baseAtk = S.player.atk + b.atk;
  const focusAtkMult = 1 + ((S.focusUpgrades?.atk||0) * 0.05);
  const researchMult = 1 + (S.research.atkLv * 0.05) + (growthBonus('atkPct')/100) + ((getPetBonus('atkBonus') + getPetSynergyBonus('atkBonus'))/100) + (getEquipOptionBonus('atkPct') + getSetBonus('atkPct') + getArtifactBonus('atkPct'))/100;
  return Math.round(baseAtk * focusAtkMult * researchMult * originCoreMultiplier());
}

/* ===== calcMaxHp ===== */
function calcMaxHp(){
  const baseHp = S.player.maxHp + equippedBonus().hp;
  const focusHpMult = 1 + ((S.focusUpgrades?.hp||0) * 0.05);
  const hpBonusMult = 1 + (growthBonus('hpPct')/100) + ((getPetBonus('hpBonus') + getPetSynergyBonus('hpBonus'))/100) + (getEquipOptionBonus('hpPct') + getSetBonus('hpPct') + getArtifactBonus('hpPct'))/100;
  return Math.round(baseHp * focusHpMult * hpBonusMult * originCoreMultiplier());
}