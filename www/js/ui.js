/* Extracted module. Gameplay behavior intentionally preserved. */

function renderDamageReport(){
  const ds=S.damageStats||{player:0,pets:{},artifacts:{}};
  const player=Number(ds.player||0);
  const petEntries=(S.equippedPets||[]).map(id=>[id,Number(ds.pets?.[id]||0)]).filter(([,v])=>v>0);
  if(Number(ds.pets?.zero999||0)>0&&!petEntries.some(([id])=>id==='zero999')) petEntries.push(['zero999',Number(ds.pets.zero999)]);
  const petTotal=petEntries.reduce((x,[,v])=>x+v,0);
  const artifactEntries=Object.entries(ds.artifacts||{}).filter(([,v])=>Number(v)>0);
  const artifactTotal=artifactEntries.reduce((x,[,v])=>x+Number(v),0);
  const total=Math.max(0,player+petTotal+artifactTotal);
  const pct=v=>total>0?((v/total)*100).toFixed(1)+'%':'0%';
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('damageReportTotal',fmt(total)); set('damageReportPlayer',fmt(player)); set('damageReportPlayerPct',pct(player));
  set('damageReportPet',fmt(petTotal)); set('damageReportPetPct',pct(petTotal));
  set('damageReportArtifact',fmt(artifactTotal)); set('damageReportArtifactPct',pct(artifactTotal));
  const list=document.getElementById('damageReportList');
  if(list){
    const directIds=new Set(['combo','thunder','burn','airStrike','zeroCombo','zeroOne','zero999','zeroOmega','errorFixed','absSlaughter','absBoss','absBarrage','absDestroy','goldCoin','goldPickpocket','goldJackpot','goldVault']);
    const direct=(S.equippedPets||[]).filter(id=>{const p=PET_PRESETS.find(x=>x.id===id);return p&&(directIds.has(p.effect)||p.stat==='extraAtk');});
    const rows=direct.map(id=>{const p=PET_PRESETS.find(x=>x.id===id);const v=Number(ds.pets?.[id]||0);return '<div class="damageReportRow"><div class="ic">'+p.ic+'</div><div><div class="name">'+p.name+'</div><div class="sub">전체 피해의 '+pct(v)+'</div></div><div class="dmg">'+fmt(v)+'</div></div>';});
    if(Number(ds.pets?.zero999||0)>0&&!direct.includes('zero999')){const p=PET_PRESETS.find(x=>x.id==='zero999');const v=Number(ds.pets.zero999);if(p)rows.push('<div class="damageReportRow"><div class="ic">'+p.ic+'</div><div><div class="name">'+p.name+'</div><div class="sub">전체 피해의 '+pct(v)+'</div></div><div class="dmg">'+fmt(v)+'</div></div>');}
    list.innerHTML=rows.length?rows.join(''):'<div class="damageReportEmpty">현재 기록된 직접 피해형 펫이 없습니다.</div>';
  }
  const al=document.getElementById('damageReportArtifactList');
  if(al)al.innerHTML=artifactEntries.length?'<div class="damageReportSectionTitle">🌌 유물 피해 기여</div>'+artifactEntries.map(([name,v])=>'<div class="damageReportRow"><div class="ic">🌌</div><div><div class="name">'+name+'</div><div class="sub">전체 피해의 '+pct(Number(v))+'</div></div><div class="dmg">'+fmt(v)+'</div></div>').join(''):'<div class="damageReportEmpty">이번 기록에는 별도 유물 피해 기여가 없습니다.</div>';
}

function resetDamageReport(){
  S.damageStats={player:0,pets:{},artifacts:{}}; saveGame(); renderDamageReport(); toast('📊 누적 데미지 기록을 초기화했습니다.');
}

function renderAll(){
  renderTopStats();
  if(document.getElementById('growthModalBg')?.classList.contains('show')) renderGrowthTree();
  updateHpBars();
  renderBag();
  renderEquipSlots();
  renderStickmanForm();
  renderPetScene();
  renderSceneArtifacts();
  renderSpouseBadge();
  renderDetailStats();
  if(document.getElementById('characterModalBg')?.classList.contains('show')) renderCharacter();
  if(document.getElementById('artifactModalBg')?.classList.contains('show')) renderArtifacts();
}

function toggleDetailStats() {
  S.showDetailStats = !S.showDetailStats;
  renderDetailStats();
  saveGame();
}

function renderDetailStats() {
  const panel=document.getElementById('detailStatsPanel');
  const btn=document.getElementById('detailStatsToggleBtn');
  if(!panel) return;

  // 버튼을 눌렀을 때는 항상 현재 저장 상태를 다시 계산한다.
  if(S.showDetailStats){
    panel.classList.add('show');
    panel.style.setProperty('display','flex','important');
    if(btn) btn.textContent='📊 상세 스탯표 닫기 ▲';
  }else{
    panel.classList.remove('show');
    panel.style.removeProperty('display');
    if(btn) btn.textContent='📊 상세 스탯표 보기 ▼';
  }

  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};
  const safe=(fn,fallback=0)=>{try{const v=fn();const n=Number(v);return Number.isFinite(n)?n:fallback;}catch(e){return fallback;}};
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};

  const p=S.player||{};
  let b={atk:0,hp:0};
  try{b=equippedBonus()||b;}catch(e){}
  b.atk=num(b.atk); b.hp=num(b.hp);

  const focusAtkPct=num(S.focusUpgrades?.atk)*5;
  const focusHpPct=num(S.focusUpgrades?.hp)*5;
  const focusAtkMult=1+focusAtkPct/100;
  const focusHpMult=1+focusHpPct/100;
  const baseAtk=num(p.atk)+b.atk;
  const baseHp=num(p.maxHp)+b.hp;

  const atkResearch=num(S.research?.atkLv)*5;
  const atkGrowth=safe(()=>growthBonus('atkPct'));
  const atkPet=safe(()=>getPetBonus('atkBonus'))+safe(()=>getPetSynergyBonus('atkBonus'));
  const atkEquip=safe(()=>getEquipOptionBonus('atkPct'))+safe(()=>getSetBonus('atkPct'))+safe(()=>getArtifactBonus('atkPct'));
  const atkMult=1+(atkResearch+atkGrowth+atkPet+atkEquip)/100;
  const originMult=safe(()=>originCoreMultiplier(),1);

  const hpGrowth=safe(()=>growthBonus('hpPct'));
  const hpPet=safe(()=>getPetBonus('hpBonus'))+safe(()=>getPetSynergyBonus('hpBonus'));
  const hpEquip=safe(()=>getEquipOptionBonus('hpPct'))+safe(()=>getSetBonus('hpPct'))+safe(()=>getArtifactBonus('hpPct'));
  const hpMult=1+(hpGrowth+hpPet+hpEquip)/100;

  const finalAtk=safe(()=>calcAtk(),Math.round(baseAtk*focusAtkMult*atkMult*originMult));
  const finalHp=safe(()=>calcMaxHp(),Math.round(baseHp*focusHpMult*hpMult*originMult));

  const critRate=Math.min(99,15+safe(()=>growthBonus('critRate'))+safe(()=>getPetBonus('critRate'))+safe(()=>getEquipOptionBonus('critRate'))+safe(()=>getSetBonus('critRate'))+safe(()=>getArtifactBonus('critRate')));
  const critDmg=185+safe(()=>growthBonus('critDmg'))+safe(()=>getPetBonus('critDmg'))+safe(()=>getPetSynergyBonus('critDmg'))+safe(()=>getEquipOptionBonus('critDmg'))+safe(()=>getSetBonus('critDmg'))+safe(()=>getArtifactBonus('critDmg'));
  const goldBonus=num(S.research?.goldLv)*10+safe(()=>growthBonus('goldPct'))+safe(()=>getPetBonus('goldBonus'))+safe(()=>getPetSynergyBonus('goldBonus'))+safe(()=>getEquipOptionBonus('goldBonus'))+safe(()=>getSetBonus('goldBonus'))+safe(()=>getArtifactBonus('goldPct'));
  const expBonus=safe(()=>growthBonus('expPct'))+safe(()=>getPetBonus('expBonus'))+safe(()=>getPetSynergyBonus('expBonus'))+safe(()=>getEquipOptionBonus('expBonus'))+safe(()=>getSetBonus('expBonus'))+safe(()=>getArtifactBonus('expPct'));
  const bossDmg=safe(()=>getPetSynergyBonus('bossDmg'))+safe(()=>getEquipOptionBonus('bossDmg'))+safe(()=>getSetBonus('bossDmg'))+safe(()=>getArtifactBonus('bossDmg'));
  const spousePetDmg=safe(()=>getSpousePetDamageBonus());
  const spouseMult=safe(()=>getSpousePetDamageMult(),1);
  const spouse=safe(()=>getEquippedSpouse(),null);

  set('detailAtkChar',fmt(num(p.atk))); set('detailAtkEquipBase','+'+fmt(b.atk)); set('detailBaseAtk',fmt(baseAtk));
  set('detailAtkResearch','+'+atkResearch.toFixed(1)+'%'); set('detailAtkGrowth','+'+atkGrowth.toFixed(1)+'%'); set('detailAtkPet','+'+atkPet.toFixed(1)+'%'); set('detailAtkEquipPct','+'+atkEquip.toFixed(1)+'%');
  set('detailAtkMult','×'+atkMult.toFixed(4)); set('detailAtkOrigin','×'+originMult.toFixed(4)); set('detailFinalAtk',fmt(finalAtk));

  set('detailHpChar',fmt(num(p.maxHp))); set('detailHpEquipBase','+'+fmt(b.hp)); set('detailBaseHp',fmt(baseHp));
  set('detailHpGrowth','+'+hpGrowth.toFixed(1)+'%'); set('detailHpPet','+'+hpPet.toFixed(1)+'%'); set('detailHpEquipPct','+'+hpEquip.toFixed(1)+'%');
  set('detailHpMult','×'+hpMult.toFixed(4)); set('detailHpOrigin','×'+originMult.toFixed(4)); set('detailFinalHp',fmt(finalHp));

  set('detailCritRate',critRate.toFixed(1)+'%'); set('detailCritDmg',critDmg.toFixed(1)+'%');
  set('detailGoldBonus','+'+Math.round(goldBonus)+'%'); set('detailExpBonus','+'+Math.round(expBonus)+'%'); set('detailBossDmg','+'+Math.round(bossDmg)+'%');
  set('detailSpousePetDmg','+'+Math.round(spousePetDmg)+'% · ×'+spouseMult.toFixed(2)+(spouse?' · '+spouse.name:' · 미장착'));
  const focusAtkFixed=Math.max(0,Math.round(baseAtk*(focusAtkMult-1)));
  const focusHpFixed=Math.max(0,Math.round(baseHp*(focusHpMult-1)));
  set('detailAtkFocus','+'+fmt(focusAtkFixed));
  set('detailHpFocus','+'+fmt(focusHpFixed));
  set('detailPetCount',(S.equippedPets||[]).length+' / 12');
  set('detailArtifactCount',getEquippedArtifactIds().length+' / 5');
  set('detailFocusAtkLv','Lv.'+num(S.focusUpgrades?.atk)+' · +'+focusAtkPct+'%');
  set('detailFocusHpLv','Lv.'+num(S.focusUpgrades?.hp)+' · +'+focusHpPct+'%');
  set('detailProtectionTickets',num(S.breakProtectionTickets)+'개');
  set('detailOriginLv','Lv.'+num(S.originCoreLv)+' / 50');
  set('detailStage',fmt(S.stage));
  set('detailMonsterHp',fmt(num(S.monster?.hp)));
  set('detailMonsterAtk',fmt(num(S.monster?.atk)));
  const artifactSyn=safe(()=>getArtifactSynergy(),{names:[]});
  set('detailArtifactSynergyCount',(artifactSyn.names||[]).length+'개 · '+((artifactSyn.names||[]).join(', ')||'없음'));
  set('detailApocHitState',String(num(S.artifactApocBossHits)));
  set('detailApocCritState',String(num(S.artifactStarCritCharge))+' / 3');
  set('detailApocStackState',String(num(S.artifactApocStacks))+' / 2');
  set('detailApocKillState',String(num(S.artifactApocKillCount))+(S.artifactApocKillReady?' · 다음 공격 준비':''));
  const dsNow=S.damageStats||{player:0,pets:{},artifacts:{}};
  const artifactDirectTotal=Object.values(dsNow.artifacts||{}).reduce((x,v)=>x+num(v),0);
  set('detailArtifactDirectDamage',fmt(artifactDirectTotal));
  set('detailDamageTotal',fmt(num(dsNow.player)+Object.values(dsNow.pets||{}).reduce((x,v)=>x+num(v),0)+Object.values(dsNow.artifacts||{}).reduce((x,v)=>x+num(v),0)));
}

function renderCharacterPreview(){
  const target=document.getElementById('characterHeroVisual');
  const source=document.getElementById('stickmanSvg');
  if(!target || !source) return;
  const clone=source.cloneNode(true);
  clone.removeAttribute('id');
  clone.classList.add('characterHeroPreviewSvg');
  clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  target.replaceChildren(clone);
}

function renderCharacter(){
  renderCharacterPreview();
  const levelEl=document.getElementById('characterLevelVal');
  const atkEl=document.getElementById('characterAtkVal');
  const hpEl=document.getElementById('characterHpVal');
  if(levelEl) levelEl.textContent=S.player.level;
  if(atkEl) atkEl.textContent=fmt(calcAtk());
  if(hpEl) hpEl.textContent=fmt(calcMaxHp());

  const grid=document.getElementById('characterEquipmentGrid');
  if(grid){
    const slots=[
      ['weapon','⚔️','무기'],
      ['helmet','🪖','투구'],
      ['armor','🛡️','갑옷'],
      ['gloves','🥊','장갑'],
      ['accessory','💍','장신구']
    ];
    grid.innerHTML=slots.map(([slot,icon,label])=>{
      const it=S.equip?.[slot];
      if(!it){
        return `<div class="characterEquipCard">
          <div class="characterEquipIcon">${icon}</div>
          <div class="characterEquipSlot">${label}</div>
          <div class="characterEquipName" style="color:var(--sub)">없음</div>
          <div class="characterEquipStat">장착 장비 없음</div>
        </div>`;
      }
      const g=GRADES[it.grade]||GRADES[0];
      const value=itemStatValue(it);
      let contribution='';
      if(slot==='weapon') contribution=`공격 +${fmt(value)}`;
      else if(slot==='helmet') contribution=`HP +${fmt(Math.round(value*1.55))}`;
      else if(slot==='armor') contribution=`HP +${fmt(Math.round(value*2.65))}`;
      else if(slot==='gloves') contribution=`공격 +${fmt(Math.round(value*.3))} · HP +${fmt(Math.round(value*.25))}`;
      else contribution=`공격 +${fmt(Math.round(value*.45))} · HP +${fmt(value)}`;
      const options=(it.options||[]).map(o=>`${o.name} +${o.value}%`).join('<br>');
      return `<div class="characterEquipCard" style="border-color:${g.color}">
        <div class="characterEquipIcon">${icon}</div>
        <div class="characterEquipSlot">${label}</div>
        <div class="characterEquipName" style="color:${g.color}">${it.name.replace(/^\[[^\]]+\]\s*/,'')}${it.enhance>0?` +${it.enhance}`:''}</div>
        <div class="characterEquipGrade" style="color:${g.color}">${g.name || ('등급 '+it.grade)}</div>
        <div class="characterEquipStat">${contribution}</div>
        ${options?`<div class="characterEquipOptions">${options}</div>`:''}
      </div>`;
    }).join('');
  }

  const summary=document.getElementById('characterCompanionSummary');
  if(summary){
    const petCount=(S.equippedPets||[]).length;
    const artifactCount=getEquippedArtifactIds().length;
    const spouse=getEquippedSpouse?.();
    summary.innerHTML=`
      <div class="ccard">🐾 장착 펫<b>${petCount} / 12</b></div>
      <div class="ccard">🌌 장착 유물<b>${artifactCount} / 5</b></div>
      <div class="ccard">💍 배우자<b>${spouse?spouse.name:'없음'}</b></div>`;
  }
}

function megaEquipShape(slot,g,c){
  const glow=`filter="drop-shadow(0 0 7px ${c})"`;
  const n=g-22;
  const motifs=[
    // 22 초월신: 쌍날개
    {w:`<g ${glow}><path d="M43 40L62 8L69 12L51 44Z" fill="${c}"/><path d="M45 36L31 20L35 18L50 33M57 20L72 5L75 9L61 27" fill="none" stroke="#fff" stroke-width="2"/><circle cx="69" cy="10" r="3" fill="#fff"/></g>`,h:`<path d="M8 11Q28 -8 48 11V25H8Z" fill="${c}" ${glow}/><path d="M10 10L2 -2L20 6L28 -13L36 6L54 -2L46 10" fill="none" stroke="#fff" stroke-width="2"/>`,a:`<path d="M9 19H47L41 62H15Z" fill="${c}" ${glow}/><path d="M12 24L-4 8L10 50M44 24L60 8L46 50" fill="${c}"/><path d="M28 20V60M15 38H41" stroke="#fff" stroke-width="2"/>`,g:`<path d="M12 27L20 18L28 27L20 36Z M36 41L44 32L52 41L44 50Z" fill="${c}" ${glow}/><path d="M15 27H25M39 41H49" stroke="#fff" stroke-width="2"/>`,x:`<g class="rot-rune"><circle cx="28" cy="45" r="39" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="4,7" ${glow}/><path d="M28 5L35 35L65 45L35 55L28 85L21 55L-9 45L21 35Z" fill="none" stroke="#fff" stroke-width="2"/></g>`},
    // 23 창조신: 창조의 왕관
    {w:`<path d="M41 41L65 0L73 6L50 45Z" fill="${c}" ${glow}/><path d="M50 32L65 12M55 20L69 26" stroke="#fff" stroke-width="2"/><circle cx="65" cy="5" r="5" fill="none" stroke="#fff"/>`,h:`<path d="M7 18Q28 -12 49 18V25H7Z" fill="${c}" ${glow}/><path d="M8 17L5 -5L19 8L28 -16L37 8L51 -5L48 17" fill="${c}" stroke="#fff" stroke-width="1.5"/>`,a:`<path d="M7 18H49L42 63H14Z" fill="${c}" ${glow}/><path d="M7 24L-7 6L11 48M49 24L63 6L45 48" fill="${c}"/><path d="M28 18V63M14 37H42M18 50H38" stroke="#fff" stroke-width="2"/>`,g:`<circle cx="12" cy="26" r="10" fill="${c}" ${glow}/><circle cx="44" cy="40" r="10" fill="${c}" ${glow}/><path d="M5 26L12 19L19 26L12 33M37 40L44 33L51 40L44 47" fill="none" stroke="#fff"/>`,x:`<g class="rot-rune"><circle cx="28" cy="45" r="40" fill="none" stroke="${c}" stroke-width="3" ${glow}/><path d="M28 7L34 25L53 25L38 36L44 55L28 43L12 55L18 36L3 25L22 25Z" fill="none" stroke="#fff" stroke-width="2"/><circle cx="28" cy="45" r="7" fill="${c}"/></g>`},
    // 24 무한계: 무한 루프
    {w:`<path d="M42 41L67 -2L76 5L51 46Z" fill="${c}" ${glow}/><path d="M47 35Q60 18 69 4M52 42Q65 25 73 12" stroke="#fff" stroke-width="2" fill="none"/>`,h:`<path d="M7 10Q28 -15 49 10V25H7Z" fill="${c}" ${glow}/><path d="M13 13Q28 0 43 13Q28 26 13 13Z" fill="none" stroke="#fff" stroke-width="2"/>`,a:`<path d="M8 18H48L41 64H15Z" fill="${c}" ${glow}/><path d="M12 27Q28 13 44 27Q28 41 12 27M12 45Q28 31 44 45Q28 59 12 45" fill="none" stroke="#fff" stroke-width="2"/>`,g:`<path d="M4 26Q12 14 20 26Q12 38 4 26ZM36 40Q44 28 52 40Q44 52 36 40Z" fill="none" stroke="${c}" stroke-width="4" ${glow}/><circle cx="12" cy="26" r="3" fill="#fff"/><circle cx="44" cy="40" r="3" fill="#fff"/>`,x:`<g class="rot-rune"><circle cx="28" cy="45" r="39" fill="none" stroke="${c}" stroke-width="3" ${glow}/><path d="M9 45C9 25 47 25 47 45C47 65 9 65 9 45M28 26C48 26 48 64 28 64C8 64 8 26 28 26" fill="none" stroke="#fff" stroke-width="2"/></g>`},
    // 25 혼돈계: 깨진 왕관
    {w:`<path d="M41 42L63 -5L75 3L51 46Z" fill="${c}" ${glow}/><path d="M45 35L58 28L52 18L68 9M52 42L69 31" stroke="#fff" stroke-width="2" fill="none"/>`,h:`<path d="M6 18L12 -6L24 8L29 -15L36 7L51 -5L47 22Z" fill="${c}" ${glow}/><path d="M13 15L43 15M20 8L35 22" stroke="#fff" stroke-width="2"/>`,a:`<path d="M9 18L48 23L40 64L13 58Z" fill="${c}" ${glow}/><path d="M10 28L24 34L15 48L34 43L43 55" fill="none" stroke="#fff" stroke-width="2"/><path d="M28 20L24 61" stroke="#fff"/>`,g:`<path d="M4 20L15 17L20 28L10 35Z M36 34L47 31L52 42L42 49Z" fill="${c}" ${glow}/><path d="M7 25L17 28M39 39L49 42" stroke="#fff" stroke-width="2"/>`,x:`<g class="rot-rune"><path d="M28 4L39 23L67 24L47 43L55 72L28 56L1 72L9 43L-11 24L17 23Z" fill="none" stroke="${c}" stroke-width="3" ${glow}/><path d="M28 15L35 35L55 45L35 49L28 68L21 49L1 45L21 35Z" fill="none" stroke="#fff"/></g>`},
    // 26 영원계: 왕좌의 갑주
    {w:`<path d="M40 43L62 -8L78 0L52 47Z" fill="${c}" ${glow}/><path d="M45 36L72 2M50 43L70 29" stroke="#fff" stroke-width="2"/><circle cx="70" cy="2" r="4" fill="#fff"/>`,h:`<path d="M5 12Q28 -18 51 12V26H5Z" fill="${c}" ${glow}/><path d="M8 12L8 -6L19 4L28 -16L37 4L48 -6L48 12" fill="none" stroke="#fff" stroke-width="2"/><circle cx="28" cy="12" r="4" fill="#fff"/>`,a:`<path d="M7 17H49L43 64H13Z" fill="${c}" ${glow}/><path d="M8 25L-7 8L10 51M48 25L63 8L46 51" fill="${c}"/><path d="M28 18V64M14 36H42M18 50H38" stroke="#fff" stroke-width="2"/><circle cx="28" cy="39" r="5" fill="#fff"/>`,g:`<circle cx="12" cy="26" r="11" fill="${c}" ${glow}/><circle cx="44" cy="40" r="11" fill="${c}" ${glow}/><circle cx="12" cy="26" r="4" fill="#fff"/><circle cx="44" cy="40" r="4" fill="#fff"/>`,x:`<g class="rot-rune"><circle cx="28" cy="45" r="41" fill="none" stroke="${c}" stroke-width="4" ${glow}/><circle cx="28" cy="45" r="31" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M28 4V86M-13 45H69" stroke="${c}" stroke-width="2"/></g>`},
    // 27 초공간: 차원문
    {w:`<path d="M42 42L65 -10L78 -2L52 46Z" fill="${c}" ${glow}/><path d="M44 38L74 -2M49 43L75 19" stroke="#00eaff" stroke-width="2"/><path d="M67 -8L73 -15L79 -4" fill="none" stroke="#fff"/>`,h:`<path d="M5 15Q28 -20 51 15V27H5Z" fill="${c}" ${glow}/><path d="M8 14L28 -12L48 14M15 14L28 3L41 14" fill="none" stroke="#00eaff" stroke-width="2"/>`,a:`<path d="M7 17H49L43 64H13Z" fill="${c}" ${glow}/><path d="M28 17V64M13 37H43" stroke="#00eaff" stroke-width="3"/><ellipse cx="28" cy="40" rx="11" ry="15" fill="none" stroke="#fff" stroke-width="2"/>`,g:`<circle cx="12" cy="26" r="12" fill="none" stroke="${c}" stroke-width="4" ${glow}/><circle cx="44" cy="40" r="12" fill="none" stroke="${c}" stroke-width="4" ${glow}/><path d="M4 26H20M36 40H52" stroke="#fff"/>`,x:`<g class="rot-rune"><ellipse cx="28" cy="45" rx="39" ry="26" fill="none" stroke="${c}" stroke-width="4" ${glow}/><ellipse cx="28" cy="45" rx="26" ry="39" fill="none" stroke="#00eaff" stroke-width="2"/><circle cx="28" cy="45" r="6" fill="#fff"/></g>`},
    // 28 근원: 별의 핵
    {w:`<path d="M41 42L65 -9L77 -1L51 47Z" fill="${c}" ${glow}/><path d="M66 1L70 8L78 9L72 14L74 22L66 17L59 22L61 14L55 9L63 8Z" fill="#fff"/>`,h:`<path d="M5 15Q28 -18 51 15V27H5Z" fill="${c}" ${glow}/><path d="M28 -10L33 8L51 13L33 18L28 36L23 18L5 13L23 8Z" fill="none" stroke="#fff" stroke-width="2"/>`,a:`<path d="M7 18H49L43 64H13Z" fill="${c}" ${glow}/><path d="M28 19L34 34L49 40L34 46L28 62L22 46L7 40L22 34Z" fill="none" stroke="#fff" stroke-width="2"/>`,g:`<path d="M12 13L15 22L24 25L15 28L12 37L9 28L0 25L9 22Z M44 27L47 36L56 39L47 42L44 51L41 42L32 39L41 36Z" fill="${c}" ${glow}/><circle cx="12" cy="25" r="2" fill="#fff"/><circle cx="44" cy="39" r="2" fill="#fff"/>`,x:`<g class="rot-rune"><circle cx="28" cy="45" r="39" fill="none" stroke="${c}" stroke-width="3" ${glow}/><path d="M28 5L36 32L64 45L36 58L28 85L20 58L-8 45L20 32Z" fill="none" stroke="#fff" stroke-width="2"/><circle cx="28" cy="45" r="9" fill="${c}"/></g>`},
    // 29 절대근원: 절대의 날개
    {w:`<path d="M40 43L64 -11L79 -2L52 48Z" fill="${c}" ${glow}/><path d="M47 38L31 23L38 20L53 31M57 20L75 4L79 10L62 28" fill="none" stroke="#fff" stroke-width="2.5"/>`,h:`<path d="M4 15Q28 -21 52 15V28H4Z" fill="${c}" ${glow}/><path d="M7 14L0 -7L20 7L28 -18L36 7L56 -7L49 14" fill="none" stroke="#fff" stroke-width="2.5"/><circle cx="28" cy="13" r="5" fill="#fff"/>`,a:`<path d="M6 16H50L44 65H12Z" fill="${c}" ${glow}/><path d="M7 23L-10 4L10 51M49 23L66 4L46 51" fill="${c}"/><path d="M28 17V65M12 37H44M17 51H39" stroke="#fff" stroke-width="2.5"/><circle cx="28" cy="40" r="6" fill="#fff"/>`,g:`<circle cx="12" cy="26" r="12" fill="${c}" ${glow}/><circle cx="44" cy="40" r="12" fill="${c}" ${glow}/><path d="M3 26L12 17L21 26L12 35ZM35 40L44 31L53 40L44 49Z" fill="none" stroke="#fff" stroke-width="2"/>`,x:`<g class="rot-rune"><circle cx="28" cy="45" r="42" fill="none" stroke="${c}" stroke-width="4" ${glow}/><path d="M28 1L36 29L64 45L36 61L28 89L20 61L-8 45L20 29Z" fill="none" stroke="#fff" stroke-width="2.5"/><circle cx="28" cy="45" r="10" fill="none" stroke="#00eaff" stroke-width="2"/></g>`},
    // 30 무한신격: 신격의 왕관
    {w:`<path d="M39 44L64 -12L80 -2L53 49Z" fill="${c}" ${glow}/><path d="M44 36L60 23L53 13L70 8L67 -2L77 8" fill="none" stroke="#fff" stroke-width="2.5"/>`,h:`<path d="M3 16Q28 -23 53 16V29H3Z" fill="${c}" ${glow}/><path d="M5 14L-2 -9L17 6L28 -21L39 6L58 -9L51 14L42 23H14Z" fill="${c}" stroke="#fff"/><circle cx="28" cy="13" r="5" fill="#fff"/>`,a:`<path d="M5 15H51L44 66H12Z" fill="${c}" ${glow}/><path d="M5 23L-12 2L9 52M51 23L68 2L47 52" fill="${c}"/><path d="M28 15V66M12 36H44M17 51H39" stroke="#fff" stroke-width="2.5"/><path d="M18 43L28 33L38 43L28 53Z" fill="none" stroke="#00eaff"/>`,g:`<circle cx="12" cy="26" r="13" fill="${c}" ${glow}/><circle cx="44" cy="40" r="13" fill="${c}" ${glow}/><path d="M12 16V36M2 26H22M44 30V50M34 40H54" stroke="#fff" stroke-width="2"/>`,x:`<g class="rot-rune"><circle cx="28" cy="45" r="43" fill="none" stroke="${c}" stroke-width="4" ${glow}/><circle cx="28" cy="45" r="31" fill="none" stroke="#fff" stroke-width="2"/><path d="M28 0L34 34L69 45L34 56L28 90L22 56L-13 45L22 34Z" fill="none" stroke="#00eaff" stroke-width="2"/><circle cx="28" cy="45" r="8" fill="#fff"/></g>`},
    // 31 최종차원: 최종 붕괴
    {w:`<path d="M38 45L63 -15L82 -3L54 50Z" fill="${c}" ${glow}/><path d="M43 39L22 18L31 15L50 31M57 25L77 5L82 12L64 34" fill="none" stroke="#fff" stroke-width="3"/><circle cx="69" cy="3" r="6" fill="#fff"/>`,h:`<path d="M2 17Q28 -26 54 17V30H2Z" fill="${c}" ${glow}/><path d="M4 15L-5 -12L17 4L28 -24L39 4L61 -12L52 15L42 27H14Z" fill="none" stroke="#fff" stroke-width="3"/><circle cx="28" cy="14" r="6" fill="#fff"/>`,a:`<path d="M4 14H52L45 67H11Z" fill="${c}" ${glow}/><path d="M4 22L-14 0L8 54M52 22L70 0L48 54" fill="${c}"/><path d="M28 14V67M11 36H45M16 52H40" stroke="#fff" stroke-width="3"/><circle cx="28" cy="40" r="7" fill="#fff"/><circle cx="28" cy="40" r="13" fill="none" stroke="#00eaff" stroke-width="2"/>`,g:`<circle cx="12" cy="26" r="14" fill="${c}" ${glow}/><circle cx="44" cy="40" r="14" fill="${c}" ${glow}/><path d="M2 26L22 26M12 16L12 36M34 40L54 40M44 30L44 50" stroke="#fff" stroke-width="3"/>`,x:`<g class="rot-rune"><circle cx="28" cy="45" r="44" fill="none" stroke="${c}" stroke-width="5" ${glow}/><circle cx="28" cy="45" r="34" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="2,3"/><path d="M28 -2L37 32L75 45L37 58L28 92L19 58L-19 45L19 32Z" fill="none" stroke="#00eaff" stroke-width="2.5"/><circle cx="28" cy="45" r="10" fill="#fff"/></g>`}
  ];
  const m=motifs[Math.min(n,motifs.length-1)];
  return m[slot==='accessory'?'x':slot] || '';
}

function renderStickmanForm(){
  ['weapon','helmet','armor','gloves','accessory','transcend','ultimate'].forEach(k=>{
    const el=document.getElementById(`vis-${k}`); if(el) el.innerHTML='';
  });
  const stickSvg=document.getElementById('stickmanSvg');
  stickSvg.classList.remove('ultimate-stage','absolute-stage');
  const equippedGrades=Object.values(S.equip).filter(Boolean).map(it=>it.grade);
  const highestEquippedGrade=equippedGrades.length?Math.max(...equippedGrades):-1;
  if(highestEquippedGrade>=21) stickSvg.classList.add('absolute-stage');
  else if(highestEquippedGrade>=20) stickSvg.classList.add('ultimate-stage');
  let totalTranscend=0;
  const glow=(c)=>`filter="drop-shadow(0 0 5px ${c})"`;

  // 5개 장비 각각 독립적인 실루엣을 가지며, 희귀(3)까지는 절제된 외형.
  if(S.equip.weapon){
    const g=S.equip.weapon.grade,c=GRADES[g].color; totalTranscend+=S.equip.weapon.transcend||0;
    let x='';
    if(g>=22) x=megaEquipShape('weapon',g,c);
    else if(g<=2) x=`<line x1="44" y1="40" x2="56" y2="17" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
    else if(g===3) x=`<line x1="44" y1="40" x2="58" y2="12" stroke="${c}" stroke-width="4"/><path d="M47 34l8 4" stroke="${c}" stroke-width="2"/>`;
    else if(g<=7) x=`<path d="M43 40L58 7L62 10L48 42Z" fill="${c}"/><path d="M45 37L58 10" stroke="#fff" stroke-width="1" opacity=".7"/>`;
    else if(g<=11) x=`<path d="M43 40L60 4L65 8L49 43Z" fill="${c}" ${glow(c)}/><path d="M56 9l7 3M53 15l7 3" stroke="#fff" stroke-width="1.2"/>`;
    else if(g<=15) x=`<path d="M42 41L62 0L69 5L49 44Z" fill="${c}" ${glow(c)}/><path d="M49 31L66 5" stroke="#fff" stroke-width="2"/><circle cx="65" cy="5" r="3" fill="#fff"/>`;
    else if(g<=18) x=`<path d="M41 41L64 -3L73 3L50 45Z" fill="${c}" ${glow(c)}/><path d="M47 35L69 3M52 25L61 29" stroke="#fff" stroke-width="1.5"/><circle cx="69" cy="3" r="4" fill="#00eaff"/>`;
    else x=`<path d="M40 42L66 -9L77 -1L51 46Z" fill="${c}" ${glow(c)}/><path d="M45 37L72 0M49 29L68 36" stroke="#fff" stroke-width="2"/><path d="M67 -8L72 -16L77 -5" fill="none" stroke="#fff" stroke-width="1.5"/>`;
    document.getElementById('vis-weapon').innerHTML=x;
  }
  if(S.equip.helmet){
    const g=S.equip.helmet.grade,c=GRADES[g].color; totalTranscend+=S.equip.helmet.transcend||0; let x='';
    if(g>=22) x=megaEquipShape('helmet',g,c);
    else if(g<=2) x=`<path d="M18 15Q28 7 38 15L38 18H18Z" fill="${c}"/>`;
    else if(g===3) x=`<path d="M17 10Q28 3 39 10V18H17Z" fill="${c}" stroke="${c}"/>`;
    else if(g<=7) x=`<path d="M15 8H41V19H15Z" fill="${c}"/><path d="M15 9L20 3L24 9M32 9L36 3L41 9" fill="${c}"/>`;
    else if(g<=11) x=`<path d="M14 8Q28 -2 42 8V20H14Z" fill="${c}" ${glow(c)}/><path d="M19 8Q28 2 37 8" stroke="#fff" stroke-width="1.5"/>`;
    else if(g<=15) x=`<path d="M12 9Q28 -7 44 9V21H12Z" fill="${c}" ${glow(c)}/><path d="M16 8L12 1L23 5M40 8L44 1L33 5" stroke="#fff" stroke-width="1.5"/>`;
    else if(g<=18) x=`<path d="M10 10Q28 -12 46 10V22H10Z" fill="${c}" ${glow(c)}/><path d="M15 9L8 -1L22 5M41 9L48 -1L34 5" stroke="#00eaff" stroke-width="2"/>`;
    else x=`<path d="M8 10Q28 -17 48 10V23H8Z" fill="${c}" ${glow(c)}/><path d="M12 8L4 -5L20 4L28 -13L36 4L52 -5L44 8" fill="none" stroke="#fff" stroke-width="2"/><circle cx="28" cy="12" r="4" fill="#fff"/>`;
    document.getElementById('vis-helmet').innerHTML=x;
  }
  if(S.equip.armor){
    const g=S.equip.armor.grade,c=GRADES[g].color; totalTranscend+=S.equip.armor.transcend||0; let x='';
    if(g>=22) x=megaEquipShape('armor',g,c);
    else if(g<=2) x=`<rect x="23" y="27" width="10" height="22" rx="2" fill="${c}"/>`;
    else if(g===3) x=`<path d="M20 26H36L33 52H23Z" fill="${c}"/>`;
    else if(g<=7) x=`<path d="M19 25H37L34 53H22Z" fill="${c}"/><path d="M20 28L12 23L19 37M36 28L44 23L37 37" fill="${c}"/>`;
    else if(g<=11) x=`<path d="M17 24H39L35 55H21Z" fill="${c}" ${glow(c)}/><path d="M17 27L8 20L18 39M39 27L48 20L38 39" fill="${c}"/> <path d="M28 27V52M21 39H35" stroke="#fff" stroke-width="1.4"/>`;
    else if(g<=15) x=`<path d="M15 22H41L37 57H19Z" fill="${c}" ${glow(c)}/><path d="M16 26L5 17L15 43M40 26L51 17L41 43" fill="${c}"/><path d="M28 24V55M19 39H37" stroke="#fff" stroke-width="2"/>`;
    else if(g<=18) x=`<path d="M13 21H43L38 59H18Z" fill="${c}" ${glow(c)}/><path d="M15 24L1 13L13 48M41 24L55 13L43 48" fill="${c}" opacity=".9"/><path d="M28 22V57M18 38H38M21 48H35" stroke="#00eaff" stroke-width="1.8"/><circle cx="28" cy="39" r="4" fill="#fff"/>`;
    else x=`<path d="M10 20H46L40 61H16Z" fill="${c}" ${glow(c)}/><path d="M13 23L-3 9L11 51M43 23L59 9L45 51" fill="${c}"/><path d="M28 20V59M16 37H40M19 48H37" stroke="#fff" stroke-width="2"/><circle cx="28" cy="39" r="5" fill="#fff"/><circle cx="28" cy="39" r="9" fill="none" stroke="#00eaff"/>`;
    document.getElementById('vis-armor').innerHTML=x;
  }
  if(S.equip.gloves){
    const g=S.equip.gloves.grade,c=GRADES[g].color; totalTranscend+=S.equip.gloves.transcend||0; let r=g<=2?4:g===3?5:g<=7?6:g<=11?7:g<=15?8:g<=18?9:10;
    if(g>=22){ document.getElementById('vis-gloves').innerHTML=megaEquipShape('gloves',g,c); } else {
    const extra=g<=3?'':`<path d="M${12-r} 26L12 ${18-r}L${12+r} 26M${44-r} 40L44 ${32-r}L${44+r} 40" stroke="#fff" stroke-width="1.2"/>`;
    document.getElementById('vis-gloves').innerHTML=`<circle cx="12" cy="26" r="${r}" fill="${c}" ${g>=8?glow(c):''}/><circle cx="44" cy="40" r="${r}" fill="${c}" ${g>=8?glow(c):''}/>${extra}${g>=16?`<circle cx="12" cy="26" r="${r+3}" fill="none" stroke="#00eaff" stroke-dasharray="2,2"/><circle cx="44" cy="40" r="${r+3}" fill="none" stroke="#00eaff" stroke-dasharray="2,2"/>`:''}`;
    }
  }
  if(S.equip.accessory){
    const g=S.equip.accessory.grade,c=GRADES[g].color; totalTranscend+=S.equip.accessory.transcend||0; let x='';
    if(g>=22) x=megaEquipShape('accessory',g,c);
    else if(g<=2) x=`<circle cx="28" cy="39" r="13" fill="none" stroke="${c}" stroke-width="1" stroke-dasharray="3,3"/>`;
    else if(g===3) x=`<circle cx="28" cy="38" r="15" fill="none" stroke="${c}" stroke-width="1.5"/>`;
    else if(g<=7) x=`<ellipse cx="28" cy="45" rx="20" ry="13" fill="none" stroke="${c}" stroke-width="2"/> <circle cx="28" cy="32" r="3" fill="${c}"/>`;
    else if(g<=11) x=`<g class="rot-rune"><circle cx="28" cy="45" r="26" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="7,4"/><circle cx="28" cy="45" r="4" fill="${c}"/></g>`;
    else if(g<=15) x=`<g class="rot-rune"><circle cx="28" cy="45" r="31" fill="none" stroke="${c}" stroke-width="2.5" stroke-dasharray="8,3"/><path d="M28 11L34 27L51 27L37 37L42 54L28 44L14 54L19 37L5 27L22 27Z" fill="none" stroke="${c}" stroke-width="1.5"/></g>`;
    else if(g<=18) x=`<g class="rot-rune"><circle cx="28" cy="45" r="35" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="10,4" ${glow(c)}/><circle cx="28" cy="45" r="9" fill="none" stroke="#fff"/><circle cx="28" cy="45" r="3" fill="#fff"/></g>`;
    else x=`<g class="rot-rune"><circle cx="28" cy="45" r="39" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="12,3" ${glow(c)}/><circle cx="28" cy="45" r="28" fill="none" stroke="#00eaff" stroke-width="1.5" stroke-dasharray="3,5"/><path d="M28 5L34 34L63 45L34 56L28 85L22 56L-7 45L22 34Z" fill="none" stroke="#fff" stroke-width="1.5"/></g>`;
    document.getElementById('vis-accessory').innerHTML=x;
  }
  // 기존 초월/최상위 외형 연출 유지
  if(highestEquippedGrade>=22){
    const auraColors=['#00ffd5','#7cff00','#00aaff','#ff4dff','#ffffff','#5effff','#ff9d00','#ff3158','#a875ff','#ffe66d'];
    const ac=auraColors[Math.min(9,highestEquippedGrade-22)];
    document.getElementById('vis-ultimate').innerHTML=`<g class="ultimate-aura"><circle cx="28" cy="45" r="44" fill="none" stroke="${ac}" stroke-width="2.5" stroke-dasharray="2,4"/><circle cx="28" cy="45" r="36" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="8,3"/><circle cx="28" cy="45" r="10" fill="${ac}" opacity=".75"/></g>`;
  } else if(highestEquippedGrade===20){
    document.getElementById('vis-ultimate').innerHTML=`<g class="ultimate-aura"><circle cx="28" cy="45" r="42" fill="none" stroke="#e55039" stroke-width="1.5" stroke-dasharray="3,5"/><circle cx="28" cy="45" r="37" fill="none" stroke="#ff6b4a"/></g><path d="M18 11L22 2L27 11M38 11L34 2L29 11" fill="#e55039" stroke="#ffb199"/><path d="M18 29L8 23L13 34L7 40L20 38M38 29L48 23L43 34L49 40L36 38" fill="#e55039"/><circle cx="28" cy="39" r="4" fill="#fff"/>`;
  } else if(highestEquippedGrade>=21){
    document.getElementById('vis-ultimate').innerHTML=`<g class="ultimate-aura"><circle cx="28" cy="45" r="44" fill="none" stroke="#e84393" stroke-width="2" stroke-dasharray="2,4"/><circle cx="28" cy="45" r="38" fill="none" stroke="#7d5fff" stroke-width="1.5" stroke-dasharray="8,3"/></g><path d="M18 11L15 -1L24 7L28 -5L32 7L41 -1L38 11" fill="#fff" stroke="#e84393"/><path d="M18 27L4 17L11 31L2 38L18 36L11 48L23 43M38 27L52 17L45 31L54 38L38 36L45 48L33 43" fill="#7d5fff" stroke="#e84393"/><circle cx="28" cy="39" r="5" fill="#fff"/>`;
  }
  if(totalTranscend>0){
    const maxTranscend=Math.max(...Object.values(S.equip).filter(Boolean).map(it=>it.transcend||0));
    let tSvg=`<circle cx="28" cy="45" r="42" fill="none" stroke="#00ffff" stroke-width="2" class="trans-aura-svg" stroke-dasharray="6,3"/>`;
    if(maxTranscend>=2)tSvg+=`<circle cx="28" cy="45" r="36" fill="none" stroke="#7d5fff" stroke-width="1.5" stroke-dasharray="3,6" class="rot-rune"/>`;
    if(maxTranscend>=3)tSvg+=`<circle cx="28" cy="4" r="3" fill="#fff"/><circle cx="28" cy="86" r="3" fill="#ff00ea"/>`;
    if(maxTranscend>=4)tSvg+=`<path d="M10 30Q-2 45 10 60M46 30Q58 45 46 60" fill="none" stroke="#00ffff" stroke-width="2.5"/>`;
    if(maxTranscend>=5)tSvg+=`<polygon points="28,-4 32,8 45,8 35,16 39,29 28,21 17,29 21,16 11,8 24,8" fill="none" stroke="#fff" stroke-width="1.5"/><circle cx="28" cy="39" r="6" fill="#fff"/>`;
    document.getElementById('vis-transcend').innerHTML=tSvg;
  }
}

function renderTopStats(){
  document.getElementById('lvVal').textContent = S.player.level;
  document.getElementById('goldVal').textContent = fmt(S.gold);
  document.getElementById('ssVal').textContent = fmt(S.soulStones);
  document.getElementById('essenceVal').textContent = fmt(S.essence);
  document.getElementById('maxStageVal').textContent = S.maxStage;
  document.getElementById('atkVal').textContent = fmt(calcAtk());
  document.getElementById('hpVal').textContent = `${Math.max(0,Math.floor(S.player.hp))}/${fmt(calcMaxHp())}`;
  const need = expNeeded(S.player.level);
  document.getElementById('expBar').style.width = Math.min(100, (S.player.exp/need)*100)+'%';
  const burningEl=document.getElementById('burningEventBanner');if(burningEl){const h=new Date().getHours();burningEl.classList.toggle('show',h>=17&&h<21);}
  document.getElementById('lvText').textContent = `EXP ${Math.floor(S.player.exp)} / ${fmt(need)}`;
  const stick = document.getElementById('stickmanSvg');
  if(S.player.hp<=0) stick.classList.add('down'); else stick.classList.remove('down');
}

function updateHpBars(){
  const maxHp = calcMaxHp();
  document.getElementById('playerHpBar').style.width = Math.max(0,(S.player.hp/maxHp)*100)+'%';
  if(S.monster){
    const pct = Math.max(0,(S.monster.hp/S.monster.maxHp)*100);
    document.getElementById('monsterHpBar').style.width = pct + '%';
    if(S.monster.isBoss){
      document.getElementById('bossHpFill').style.width = pct + '%';
      document.getElementById('bossOverlayNum').textContent = `${Math.max(0, Math.floor(S.monster.hp))} / ${fmt(S.monster.maxHp)}`;
    }
  }
}

function setActiveNav(tab){
  document.querySelectorAll('#bottomNav button[data-tab]').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
}

function toggleMoreMenu(){
  document.getElementById('moreMenu')?.classList.toggle('show');
}

function closeMoreMenu(){
  document.getElementById('moreMenu')?.classList.remove('show');
}

function closeAllMenus(){ closeMoreMenu(); }

function scrollToTopBattle(){
  setActiveNav('shop');
  openModal('shop');
}

function isDisabled(el){
    return !!el.disabled || el.getAttribute('aria-disabled') === 'true';
  }

function press(el){
    if(!el || isDisabled(el)) return;
    el.classList.add('is-pressing');
  }

function release(el){
    if(!el) return;
    el.classList.remove('is-pressing');
  }

function ripple(el, x, y){
    if(!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const r=document.createElement('span');
    r.className='buttonRipple';
    const rect=el.getBoundingClientRect();
    r.style.left=(x-rect.left)+'px';
    r.style.top=(y-rect.top)+'px';
    el.appendChild(r);
    setTimeout(()=>r.remove(),460);
  }