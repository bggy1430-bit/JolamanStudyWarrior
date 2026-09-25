/* Extracted module. Gameplay behavior intentionally preserved. */

function getGearPowerNameForGrade(g){ return ({15:'성역',16:'허무',17:'차원절단',18:'시간메아리',19:'무극의극점',20:'태초회귀',21:'절대권능'})[g]||''; }

function itemStatValue(item){
  const g = GRADES[item.grade];
  const base = 8 + item.grade*4.5;
  const ultraGradeMult = item.grade >= 22 ? Math.pow(3.2, item.grade - 21) : 1;
  const transMult = 1 + (item.transcend || 0) * 0.5;
  const ultimateMult = 1 + (item.ultimate || 0) * 0.40;
  const synthMult = 1 + (item.synthLv || 0) * 0.10;
  const awakeningMult = 1 + Math.min(3,item.awakening || 0) * 0.75;
  return Math.round(base * g.mult * ultraGradeMult * (1+item.stage*0.03) * (1 + item.enhance*0.06) * transMult * ultimateMult * synthMult * awakeningMult);
}

function getGearPowerState(){
  const gs=Object.values(S.equip||{}).filter(Boolean).map(it=>Number(it.grade||0));
  return {holy:gs.filter(g=>g>=15).length, void:gs.filter(g=>g>=16).length, dimension:gs.filter(g=>g>=17).length, time:gs.filter(g=>g>=18).length, infinity:gs.filter(g=>g>=19).length, origin:gs.filter(g=>g>=20).length, absolute:gs.filter(g=>g>=21).length};
}

function getGearPowerNames(){
  const h=getGearPowerState(); const a=[]; if(h.holy)a.push('신성·성역'); if(h.void)a.push('허공·허무'); if(h.dimension)a.push('차원·절단'); if(h.time)a.push('시공·메아리'); if(h.infinity)a.push('무극·극점'); if(h.origin)a.push('태초극·회귀'); if(h.absolute)a.push('절대극·절대권능'); return a;
}

function equippedBonus(){
  let atk=0, hp=0;
  ['weapon','helmet','armor','gloves','accessory'].forEach(slot=>{
    const it = S.equip[slot];
    if(!it) return;
    const v = itemStatValue(it);
    if(slot==='weapon') atk += v;
    else if(slot==='helmet'){ hp += Math.round(v*1.55); }
    else if(slot==='armor'){ hp += Math.round(v*2.65); }
    else if(slot==='gloves'){ atk += Math.round(v*0.3); hp += Math.round(v*0.25); }
    else { atk += Math.round(v*0.45); hp += Math.round(v*1.0); }
  });
  return {atk,hp};
}

function getSetBonus(stat){
  let total = 0;
  EQUIP_SETS.forEach(set => {
    const count = Object.values(S.equip).filter(it => it && it.setId === set.id).length;
    Object.entries(set.effects).forEach(([need, effect]) => {
      if(count >= Number(need) && effect[stat]) total += effect[stat];
    });
  });
  return total;
}

function getSetInfo(item){
  const set = EQUIP_SETS.find(x => x.id === item.setId);
  if(!set) return '';
  const count = Object.values(S.equip).filter(it => it && it.setId === set.id).length;
  const activeEffects = [];
  Object.entries(set.effects).forEach(([need, effect]) => {
    if(count >= Number(need)) Object.entries(effect).forEach(([k,v]) => activeEffects.push(`${need}세트 ${k}:${v}%`));
  });
  const active = activeEffects.length ? activeEffects.join(' · ') : '2세트부터 효과 활성화';
  return `${set.name} (${count}/5) · ${active}`;
}

function rollEquipOptions(grade){
  const count = grade <= 3 ? 1 : grade <= 7 ? 2 : grade <= 11 ? 2 : grade <= 15 ? 3 : 4;
  const pool = [...EQUIP_OPTION_POOL];
  const options = [];
  while(options.length < count && pool.length){
    const idx = Math.floor(Math.random()*pool.length);
    const opt = pool.splice(idx,1)[0];
    const highScale = grade >= 22 ? Math.pow(2.4, grade - 21) : 1;
    const value = Math.floor(rand(opt.min, opt.max + 1) * highScale);
    options.push({key:opt.key, name:opt.name, value});
  }
  return options;
}

function getEquipOptionBonus(stat){
  let total = 0;
  Object.values(S.equip).forEach(it => {
    if(!it || !it.options) return;
    it.options.forEach(o => { if(o.key === stat) total += o.value; });
  });
  return total;
}

function renderEquipSlots(){
  const slots = [
    ['weapon','eqWeaponName'],
    ['helmet','eqHelmetName'],
    ['armor','eqArmorName'],
    ['gloves','eqGlovesName'],
    ['accessory','eqAccName']
  ];
  slots.forEach(([slot, elId])=>{
    const el = document.getElementById(elId);
    const it = S.equip[slot];
    if(it){
      el.textContent = it.name.replace(/^\[[^\]]+\]\s*/,'') + (it.enhance>0?` +${it.enhance}`:'');
      el.style.color = GRADES[it.grade].color;
    } else {
      el.textContent = '없음'; el.style.color = 'var(--sub)';
    }
  });
}

function maxGradeOwned(slotKind){
  let max = -1;
  if(S.equip[slotKind]) max = Math.max(max, S.equip[slotKind].grade);
  S.bagEquip.forEach(it=>{ if(it.kind===slotKind) max = Math.max(max, it.grade); });
  return max;
}

function switchBagTab(tab){
  currentBagTab = tab;
  document.getElementById('tabBagJunk').classList.toggle('active', tab==='junk');
  document.getElementById('tabBagEquip').classList.toggle('active', tab==='equip');
  
  document.getElementById('btnBatchJunkSell').style.display = tab==='junk'?'block':'none';
  document.getElementById('btnBatchEquipDismantle').style.display = tab==='equip'?'block':'none';
  
  renderBag();
}

function renderBag(){
  document.getElementById('junkCount').textContent = S.bagJunk.length;
  document.getElementById('equipCount').textContent = S.bagEquip.length;

  const grid = document.getElementById('bagGrid');
  const empty = document.getElementById('bagEmpty');
  grid.innerHTML='';

  const targetList = currentBagTab === 'junk' ? S.bagJunk : S.bagEquip;

  if(targetList.length === 0){ 
    empty.style.display = 'block'; 
    return; 
  }
  empty.style.display = 'none';

  targetList.forEach(it=>{
    const div = document.createElement('div');
    div.className='bagItem';
    const g = GRADES[it.grade] || GRADES[0];
    div.style.borderColor = g.color;
    const enhanceTag = it.enhance > 0 ? `+${it.enhance}` : '';
    const optTxt = (it.options||[]).slice(0,2).map(o=>`${o.name}+${o.value}%`).join(' · ');
    div.innerHTML = `<div class="ic">${slotIcon(it)}</div>
      <div class="gname" style="color:${g.color}">${it.name}${enhanceTag ? ' ' + enhanceTag : ''}</div>
      ${optTxt ? `<div style="font-size:7px;color:var(--sub);line-height:1.1;">${optTxt}</div>` : ''}`;
    div.onclick = ()=> openItemSheet(it.id);
    grid.appendChild(div);
  });
}

function openItemSheet(id){
  const it=getItemById(id); if(!it)return;
  const isJunk=it.kind==='junk';
  const canDismantleEquip=!isJunk&&(it.grade>=6||it.grade<maxGradeOwned(it.kind));
  const sellVal=isJunk?getJunkSellValue(it):Math.round(150*GRADES[it.grade].mult);
  const ssVal=isJunk?0:(it.grade+1)*3;
  const artifactVal=!isJunk&&it.grade>=6?8+(it.grade-6)*7:0;
  const essenceVal=isJunk?(it.grade+1)*2:0;
  const g=GRADES[it.grade];
  const synthMatches=!isJunk?S.bagEquip.filter(x=>x.id!==it.id&&x.kind===it.kind&&x.grade===it.grade).length:0;
  const synthCost=!isJunk?Math.floor(Math.pow(it.grade+1,2)*100):0;
  const canSynthesize=!isJunk&&it.enhance<20&&synthMatches>=2;
  document.getElementById('itemSheet').innerHTML=`
    <h4 style="color:${g.color}">${it.name}</h4>
    <div class="desc">${isJunk?'[잡템] 재료 아이템':(slotIcon(it)+' 장비 · 강화 +'+it.enhance)}</div>
    ${!isJunk?`<div class="eqSetHighlight"><div class="eqSetHead"><span>🛡️ 장비 세트</span></div><div class="eqSetEffect active">${getSetInfo(it).replace(/\\n/g,'<br>')}</div></div>`:''}
    ${!isJunk?`<button class="btn-equip" onclick="doEquip('${it.id}')">장착하기</button>`:''}
    ${!isJunk?`<button class="btn-synth" ${canSynthesize?'':'disabled'} onclick="synthesizeEquip('${it.id}')">🔺 같은 등급·종류 3개 합성 강화 · +1 (💎 ${fmt(synthCost)})${canSynthesize?'':' · 재료 2개 필요 / +20까지'}</button>`:''}
    ${isJunk?`<button class="btn-dismantle" onclick="doDismantleJunk('${it.id}')">분해하기 (🌿 생명의 정수 +${essenceVal})</button>`:`
    <button class="${canDismantleEquip?'btn-dismantle':'btn-disabled'}" ${canDismantleEquip?'':'disabled'} onclick="doDismantle('${it.id}')">분해하기 (💎 영혼석 +${ssVal}${artifactVal?` · 🌌 유물의 파편 +${artifactVal}`:''}) ${canDismantleEquip?'':'· 더 높은 등급 보유 시 가능'}</button>`}
    <button class="btn-sell" onclick="doSell('${it.id}')">판매하기 (💰 +${fmt(sellVal)})</button>
    <button class="btn-cancel" onclick="closeItemSheet()">닫기</button>`;
  document.getElementById('itemSheetBg').classList.add('show');
}

function closeItemSheet(){ document.getElementById('itemSheetBg').classList.remove('show'); }

function openEquippedSheet(slot){
  const it=S.equip[slot]; if(!it){toast('장착된 장비가 없습니다');return;}
  const g=GRADES[it.grade];
  document.getElementById('itemSheet').innerHTML=`
    <h4 style="color:${g.color}">${it.name} ${it.enhance>0?('+'+it.enhance):''}</h4>
    <div class="desc">현재 장착 중인 장비입니다.</div>
    <div class="eqSetHighlight"><div class="eqSetHead"><span>🛡️ 장비 세트</span></div><div class="eqSetEffect active">${getSetInfo(it).replace(/\\n/g,'<br>')}</div></div>
    <button class="btn-cancel" onclick="doUnequip('${slot}')">해제하기</button>
    <button class="btn-cancel" onclick="closeItemSheet()">닫기</button>`;
  document.getElementById('itemSheetBg').classList.add('show');
}

function doEquip(id){
  const idx = S.bagEquip.findIndex(x=>x.id===id);
  if(idx<0) return;
  const it = S.bagEquip[idx];
  const old = S.equip[it.kind];
  S.equip[it.kind] = it;
  S.bagEquip.splice(idx,1);
  if(old) S.bagEquip.push(old);
  closeItemSheet(); renderAll(); saveGame();
  toast(`${it.name} 장착 완료!`);
}

function doUnequip(slot){
  const it = S.equip[slot];
  if(!it) return;
  S.equip[slot]=null;
  S.bagEquip.push(it);
  closeItemSheet(); renderAll(); saveGame();
}

function synthesizeEquip(id){
  const idx = S.bagEquip.findIndex(x=>x.id===id);
  if(idx < 0) return;
  const target = S.bagEquip[idx];
  if(target.enhance >= 20){ toast('이 장비는 일반 강화 한계(+20)에 도달했습니다.'); return; }

  const materials = S.bagEquip.filter(x => x.id !== id && x.kind === target.kind && x.grade === target.grade).slice(0,2);
  if(materials.length < 2){ toast('같은 등급·같은 종류의 장비 2개가 더 필요합니다.'); return; }

  const cost = Math.floor(Math.pow(target.grade + 1, 2) * 100);
  if(S.soulStones < cost){ toast(`💎 영혼석이 부족합니다! 합성 강화 필요: ${fmt(cost)}`); return; }

  S.soulStones -= cost;
  const ids = new Set(materials.map(x=>x.id));
  S.bagEquip = S.bagEquip.filter(x=>!ids.has(x.id));
  target.enhance++;
  closeItemSheet();
  renderAll(); saveGame();
  toast(`🔺 합성 강화 성공! ${target.name} +${target.enhance}`);
}

function doDismantle(id){
  const idx = S.bagEquip.findIndex(x=>x.id===id);
  if(idx<0) return;

  const it = S.bagEquip[idx];
  const maxGrade = maxGradeOwned(it.kind);

  // 일괄/자동과 완전히 같은 규칙:
  // 같은 종류의 현재 최고등급보다 낮은 장비만 분해 가능.
  if(it.grade >= maxGrade){
    toast('현재 같은 종류의 최고등급 장비는 분해할 수 없습니다.');
    return;
  }

  const gain = dismantleEquipItemObject(it);
  const ss = gain.ss;
  const artifactGain = gain.artifactGain;
  S.bagEquip.splice(idx,1);
  closeItemSheet(); renderAll(); saveGame();
  toast(`분해 완료! 영혼석 +${ss}💎${artifactGain?` · 유물의 파편 +${artifactGain}`:''}`);
}

function doDismantleJunk(id){
  const idx = S.bagJunk.findIndex(x=>x.id===id);
  if(idx<0) return;
  const it = S.bagJunk[idx];
  const ess = (it.grade+1)*2;
  S.essence += ess;
  S.bagJunk.splice(idx,1);
  closeItemSheet(); renderAll(); saveGame();
  toast(`잡템 분해 완료! 생명의 정수 +${ess}🌿`);
}

function doSell(id){
  let idx = S.bagJunk.findIndex(x=>x.id===id);
  if(idx >= 0){
    const it = S.bagJunk[idx];
    const val = getJunkSellValue(it);
    S.gold += val;
    S.bagJunk.splice(idx, 1);
    closeItemSheet(); renderAll(); saveGame();
    toast(`판매 완료! 💰 +${fmt(val)}`);
    return;
  }
  
  idx = S.bagEquip.findIndex(x=>x.id===id);
  if(idx >= 0){
    const it = S.bagEquip[idx];
    const val = Math.round(150 * GRADES[it.grade].mult);
    S.gold += val;
    S.bagEquip.splice(idx, 1);
    closeItemSheet(); renderAll(); saveGame();
    toast(`판매 완료! 💰 +${fmt(val)}`);
  }
}

function getOptionRerollCost(it){
  return Math.floor(350 * Math.pow(1.28, it.grade) * (1 + (it.transcend||0)*0.15));
}

function rerollSingleOption(source, id, index){
  let it = source==='equip' ? S.equip[id] : S.bagEquip.find(x=>x.id===id);
  if(!it || !it.options || !it.options[index]) return;
  const cost=getOptionRerollCost(it);
  if(S.gold < cost){ toast(`💰 골드가 부족합니다! 필요: ${fmt(cost)}`); return; }
  const currentKey=it.options[index].key;
  const pool=EQUIP_OPTION_POOL.filter(x=>x.key!==currentKey);
  const opt=pick(pool);
  it.options[index]={key:opt.key,name:opt.name,value:Math.floor(rand(opt.min,opt.max+1))};
  S.gold-=cost;
  closeItemSheet(); renderAll(); saveGame();
  toast(`✨ 옵션 변경 완료! 💰-${fmt(cost)}`);
}

function renderOptionRows(it, source, id){
  const cost=getOptionRerollCost(it);
  return (it.options||[]).map((o,i)=>`<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin:4px 0;"><span>✨ ${o.name} +${o.value}%</span><button class="optRerollBtn" onclick="rerollSingleOption('${source}','${id}',${i})">🔄 ${fmt(cost)}💰</button></div>`).join('');
}

function renderArsenal(){
  const slots=[['weapon','⚔️','무기'],['helmet','🪖','투구'],['armor','🛡️','갑옷'],['gloves','🥊','장갑'],['accessory','💍','장신구']];
  const box=document.getElementById('arsenalSlots'); if(!box) return;
  box.innerHTML=slots.map(([k,ic,n])=>{ const it=S.equip[k]; const g=it?GRADES[it.grade]:null; const v=it?itemStatValue(it):0; const exact=it?({weapon:`공격력 +${fmt(v)}`,helmet:`최대 HP +${fmt(Math.round(v*1.55))}`,armor:`최대 HP +${fmt(Math.round(v*2.65))}`,gloves:`공격력 +${fmt(Math.round(v*.3))} · 최대 HP +${fmt(Math.round(v*.25))}`,accessory:`공격력 +${fmt(Math.round(v*.45))} · 최대 HP +${fmt(v)}`}[k]):'장착되지 않음'; return `<div class="arsenalSlot ${it?'equipped':''}" onclick="openEquippedSheet('${k}')"><div class="aic">${ic}</div><div class="aname" style="color:${g?g.color:'var(--sub)'}">${it?it.name:n}</div><div class="arsenalExact">${exact}</div><div class="aval">${it?'장비 자체 수치 '+fmt(v):'미장착'}</div></div>`; }).join('');
  const b=equippedBonus();
  const atk=calcAtk(),hp=calcMaxHp();
  const baseAtk=S.player.atk,baseHp=S.player.maxHp;
  const equipBreakdown=Object.entries(S.equip).filter(([_,it])=>it).map(([slot,it])=>{const v=itemStatValue(it);const n={weapon:'무기',helmet:'투구',armor:'갑옷',gloves:'장갑',accessory:'장신구'}[slot];const q={weapon:`공격력 +${fmt(v)}`,helmet:`최대 HP +${fmt(Math.round(v*1.55))}`,armor:`최대 HP +${fmt(Math.round(v*2.65))}`,gloves:`공격력 +${fmt(Math.round(v*.3))} · 최대 HP +${fmt(Math.round(v*.25))}`,accessory:`공격력 +${fmt(Math.round(v*.45))} · 최대 HP +${fmt(v)}`}[slot];return `<div><span>${n}</span><b>${q}</b></div>`;}).join('');
  document.getElementById('arsenalSummary').innerHTML=`<div style="font-weight:900">⚔️ 무구가 실제로 더하는 능력치</div><div class="arsenalPower">${equipBreakdown||'<div><span>장착 장비</span><b>없음</b></div>'}<div><span>장비 합산</span><b>공격력 +${fmt(b.atk)} · 최대 HP +${fmt(b.hp)}</b></div><div><span>최종 능력치</span><b>공격력 ${fmt(atk)} · 최대 HP ${fmt(hp)}</b></div></div>`;
  const preview=document.getElementById('arsenalPreview');
  const original=document.getElementById('stickmanSvg');
  if(preview && original){ const clone=original.cloneNode(true); clone.id='arsenalStickmanSvg'; clone.classList.remove('down','attack','hurt'); preview.innerHTML=''; preview.appendChild(clone); }
  const totalEquipPower=Object.values(S.equip).filter(Boolean).reduce((n,it)=>n+itemStatValue(it),0);
  const info=document.getElementById('arsenalEquipInfo');
  info.innerHTML=`<div style="font-weight:900;margin-bottom:5px">📈 무구 총 전투력 <b style="color:var(--gold)">${fmt(totalEquipPower)}</b></div><div class="arsenalMeter">${[['공격','atk',b.atk],['체력','hp',b.hp]].map(([n,k,v])=>{const max=Math.max(1,k==='atk'?baseAtk:baseHp);return `<div class="arsenalMeterRow"><span>${n} 기여</span><div class="arsenalMeterTrack"><div class="arsenalMeterFill" style="width:${Math.min(100,(v/(max+v))*100)}%"></div></div><b>+${fmt(v)}</b></div>`}).join('')}</div>`;
  const bag=document.getElementById('arsenalBagEquip');
  const equipItems=S.bagEquip||[];
  bag.innerHTML= equipItems.length ? `<div style="font-size:11px;font-weight:800;margin:8px 0">🎒 대기 중인 장비 — 눌러서 장착</div>`+equipItems.slice(0,30).map(it=>{const g=GRADES[it.grade];return `<div class="petCard" style="cursor:pointer" onclick="doEquipFromArsenal('${it.id}')"><div class="petInfo"><div class="petIc">${slotIcon(it)}</div><div><div style="font-size:11px;color:${g.color};font-weight:800">${it.name} +${it.enhance||0}</div><div style="font-size:9px;color:var(--sub)">능력치 ${fmt(itemStatValue(it))}</div></div></div><button class="batchBtn" style="background:var(--accent);color:#fff">장착</button></div>`}).join('') : '<div style="text-align:center;color:var(--sub);font-size:10px;padding:12px">가방에 장착 가능한 장비가 없습니다.</div>';
}

function doEquipFromArsenal(id){ doEquip(id); renderArsenal(); }

function getItemById(id){
  return S.bagJunk.find(x=>x.id===id) || S.bagEquip.find(x=>x.id===id);
}

function renderEquipSetBook(){
  const el=document.getElementById('equipSetBook'); if(!el) return;
  el.innerHTML=EQUIP_SETS.map(set=>`<div class="codexCard"><div class="codexTitle">⚔️ ${set.name}</div><div class="codexPieces">대상 등급: ${GRADES[set.grades[0]].name} ~ ${GRADES[set.grades[1]].name}</div>${Object.entries(set.effects).map(([n,e])=>`<div class="codexEffect"><b>${n}세트</b> · ${Object.entries(e).map(([k,v])=>`${k} +${v}%`).join(' · ')}</div>`).join('')}</div>`).join('');
}

function boxCost(){ return Math.floor(150 + (S.mbox.pulls * 2.5)); }

function updateBoxCost(){
  document.getElementById('boxCost').textContent = fmt(boxCost());
  document.getElementById('pullCountVal').textContent = S.mbox.pulls;
  const auto = document.getElementById('autoEquipDismantle');
  if(auto) auto.checked = !!S.autoEquipDismantle;
}

function toggleAutoEquipDismantle(enabled){
  S.autoEquipDismantle = !!enabled;
  saveGame();
  toast(S.autoEquipDismantle ? '⚙️ 자동 장비 분해 ON — 같은 종류의 최고등급보다 낮은 장비만 분해합니다.' : '⚙️ 자동 장비 분해 OFF');
}

function dismantleEquipItemObject(item){
  if(!item) return null;
  const ss = (item.grade + 1) * 3;
  const artifactGain = item.grade >= 6 ? 8 + (item.grade - 6) * 7 : 0;
  S.soulStones += ss;
  if(artifactGain) S.artifactShards = (S.artifactShards || 0) + artifactGain;
  return {ss, artifactGain};
}

function dismantleLowerGradeEquipments(){
  // 장착 장비 + 가방 장비 전체에서 종류별 최고등급을 계산한다.
  // 규칙: 같은 종류에서 최고등급보다 낮은 가방 장비만 분해한다.
  // 최고등급과 같은 장비는 몇 개든 보존하며, 장착 장비는 절대 분해하지 않는다.
  const maxByKind = {};

  Object.values(S.equip).forEach(it=>{
    if(it) maxByKind[it.kind] = Math.max(maxByKind[it.kind] ?? -1, it.grade);
  });
  S.bagEquip.forEach(it=>{
    maxByKind[it.kind] = Math.max(maxByKind[it.kind] ?? -1, it.grade);
  });

  let count = 0, totalSs = 0, totalArtifactShards = 0;

  for(let i=S.bagEquip.length-1; i>=0; i--){
    const it = S.bagEquip[i];
    const maxGrade = maxByKind[it.kind] ?? -1;

    if(it.grade < maxGrade){
      const gain = dismantleEquipItemObject(it);
      totalSs += gain.ss;
      totalArtifactShards += Math.floor(Number(gain.artifactGain));
      count++;
      S.bagEquip.splice(i,1);
    }
  }

  return {count, totalSs, totalArtifactShards};
}

function autoProcessEquip(item){
  if(!item || !S.autoEquipDismantle) return false;

  // 새 장비 하나만 검사하지 않고, 현재 보유 장비 전체를
  // "종류별 최고등급보다 낮은 장비" 규칙으로 정리한다.
  const result = dismantleLowerGradeEquipments();

  if(result.count === 0) return false;
  return {
    ss: result.totalSs,
    artifactGain: result.totalArtifactShards,
    count: result.count
  };
}