/* Extracted module. Gameplay behavior intentionally preserved. */

function getJunkSellValue(item) {
  // 잡템 판매가: (20 + 등급 × 250) × (스테이지 × 3)
  // 내부 grade 0도 그대로 0으로 계산합니다.
  const grade = item.grade;
  const baseGold = 250;
  const stageBonus = item.stage * 3;
  const sellBoost = 1 + ((getPetEffectValue('sellBoost') || 0) / 100);
  const lateExponent=Math.pow(1.18,Math.max(0,Number(item.stage||0))/100);
  return Math.max(20,Math.round((20+grade*baseGold)*stageBonus*lateExponent*sellBoost));
}

function gainExp(amount){
  const h=new Date().getHours(), burning=h>=17&&h<21;
  const banner=document.getElementById('burningEventBanner');if(banner)banner.classList.toggle('show',burning);
  amount=Math.max(1,Math.round((Number(amount)||0)*(burning?2:1)*(1+growthBonus('expPct')/100)));
  S.player.exp += amount;
  let leveled=false;
  while(S.player.exp >= expNeeded(S.player.level)){
    S.player.exp -= expNeeded(S.player.level);
    S.player.level++;
    S.player.maxHp += 22 + S.player.level*5;
    S.player.atk += 3 + Math.floor(S.player.level/2);
    S.player.maxHp += 8 + Math.floor(S.player.level/2);
    leveled = true;
  }
  if(leveled){
    S.player.hp = calcMaxHp();
    toast(`🎉 레벨업! Lv.${S.player.level}`);
  }
}

function rollDropItem(stage, isBoss = false){
  const jGrade = Math.min(GRADES.length - 1, Math.max(0, Math.floor((stage - 1) / 100)));
  // 잡템 등급은 100스테이지마다 1등급 상승합니다.
  // 1~100스테이지는 일반, 101~200은 고급 ... 식으로 올라갑니다.
  const tmpl = pick(JUNK_TEMPLATES);
  const name = `[${GRADES[jGrade].name}] ${tmpl.name}`;
  return { id:uid(), kind:'junk', name, icon:tmpl.icon, grade:jGrade, stage, enhance:0, transcend:0 };
}

function makeEquip(slot, grade, stage){
  const words = slot==='weapon'?WEAPON_WORDS: slot==='helmet'?HELMET_WORDS: slot==='armor'?ARMOR_WORDS: slot==='gloves'?GLOVES_WORDS:ACC_WORDS;
  const gname = GRADES[grade].name;
  const name = `[${gname}] ${words[grade]}`;
  const set = getSetForGrade(grade);
  return { id:uid(), kind:slot, name, grade, stage, enhance:0, transcend:0, ultimate:0, options:rollEquipOptions(grade), setId:set ? set.id : null };}

function slotIcon(item){
  if(typeof item === 'object' && item.kind === 'junk') return item.icon || '📦';
  const kind = typeof item === 'string' ? item : item.kind;
  return ({weapon:'⚔️', helmet:'🪖', armor:'🛡️', gloves:'🥊', accessory:'💍', junk:'📦'}[kind] || '📦');
}