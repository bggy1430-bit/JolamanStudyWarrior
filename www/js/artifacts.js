/* Extracted module. Gameplay behavior intentionally preserved. */

function setArtifactFilter(filter){ artifactFilter=filter; renderArtifacts(); }

function artifactRole(a){
  if(['atkPct','critRate','critDmg','bossDmg'].includes(a.stat)) return {label:'⚔️ 공격형',cls:'offense'};
  if(['hpPct','hpPct'].includes(a.stat)) return {label:'🛡️ 생존형',cls:'survival'};
  if(['goldPct','expPct'].includes(a.stat)) return {label:'💰 성장형',cls:'growth'};
  return {label:'◆ 특수형',cls:'special'};
}

function artifactSetName(id){ const s=ARTIFACT_SETS.find(x=>x.pieces.includes(id)); return s ? s.name : '미분류'; }

function hasArtifactCombo(...ids){ return ids.every(id=>getEquippedArtifactIds().includes(id)); }

function getArtifactDef(id){ return ARTIFACTS.find(a=>a.id===id); }

function getArtifactLevel(id){ return Math.max(0,Number((S.artifacts||{})[id]?.level||0)); }

function artifactLevelMultiplier(lv){ return lv<=0 ? 0 : 1 + (Math.min(10,lv)-1)*0.24; }

function getEquippedArtifactIds(){ if(!Array.isArray(S.equippedArtifacts) && Array.isArray(S.artifactEquipped)) S.equippedArtifacts=S.artifactEquipped.slice(); return (S.equippedArtifacts||[]).filter(id=>getArtifactLevel(id)>0).slice(0,5); }

function getArtifactSynergy(){
  const eq=new Set(getEquippedArtifactIds()); const abilities=[]; const names=[]; const counts={};
  ARTIFACT_SETS.forEach(set=>{
    const count=set.pieces.filter(id=>eq.has(id)).length; counts[set.id]=count;
    if(count>=2) names.push(set.ic+' '+set.name+' '+count+'/4');
    Object.entries(set.effects).forEach(([need,text])=>{
      if(count>=Number(need)) abilities.push({setId:set.id,setName:set.name,need:Number(need),text});
    });
  });
  ARTIFACT_COMBO_SYNERGIES.forEach(x=>{
    const ids=x.slice(0,-2); const comboName=x[x.length-2]; const text=x[x.length-1];
    if(ids.every(id=>eq.has(id))) { abilities.push({setId:'combo',setName:comboName,need:ids.length,text}); names.push('✦ '+comboName); }
  });
  return {stats:{atkPct:0,hpPct:0,goldPct:0,critRate:0,expPct:0,critDmg:0,bossDmg:0},names,abilities,counts};
}

function hasArtifactSynergy(setId, need=2){ return (getArtifactSynergy().counts?.[setId]||0) >= need; }

function artifactSynergyHasText(setId, need){ return hasArtifactSynergy(setId,need); }

function getArtifactSetCount(set){ return set.pieces.filter(id=>getEquippedArtifactIds().includes(id)).length; }

function renderArtifactSetCodex(){
  const el=document.getElementById('artifactSetCodex'); if(!el) return;
  const eq=getEquippedArtifactIds();
  const setCards=ARTIFACT_SETS.map(set=>{
    const count=getArtifactSetCount(set);
    const setCombos=ARTIFACT_COMBO_SYNERGIES.filter(x=>x.slice(0,-2).every(id=>set.pieces.includes(id)));
    return `<div class="codexCard artifactSetCard"><div class="codexTitle">${set.ic} ${set.name}<span class="setCountBadge ${count>=2?'active':''}">${count}/4 장착</span></div><div class="codexPieces artifactBookPieces">${set.pieces.map(id=>{const a=getArtifactDef(id);const lv=getArtifactLevel(id);const equipped=eq.includes(id);return `<span class="${lv?'owned':''} ${equipped?'equipped':''}"><b>${a?.ic||'?'} ${a?.name||id}</b><small>${equipped?'✓ 장착':lv?'Lv.'+lv:'미획득'}</small></span>`}).join('')}</div>${Object.entries(set.effects).map(([n,e])=>`<div class="codexEffect"><b>${n}세트</b> · ${e}</div>`).join('')}<div class="codexComboTitle">✦ 이 세트의 추가 조합 시너지</div>${setCombos.length?setCombos.map(x=>{const ids=x.slice(0,-2);const comboName=x[x.length-2];const text=x[x.length-1];const comboNames=ids.map(id=>{const a=getArtifactDef(id);return a?.name||id;}).join(' + ');const active=ids.every(id=>eq.includes(id));return `<div class="codexEffect ${active?'active':''}"><b>${comboName}</b> · ${text}<small style="display:block;color:var(--sub);margin-top:2px;">${comboNames}${active?' · ✓ 발동 중':''}</small></div>`}).join(''):'<div class="codexEffect">추가 조합 시너지가 없습니다.</div>'}<div class="codexLore">${set.lore}</div></div>`;
  }).join('');
  const comboBook=`<div class="codexCard artifactComboCodex"><div class="codexTitle">🔗 유물 조합 시너지 도감 <span class="setCountBadge active">${ARTIFACT_COMBO_SYNERGIES.length}종</span></div>${ARTIFACT_COMBO_SYNERGIES.map(x=>{const ids=x.slice(0,-2);const comboName=x[x.length-2];const text=x[x.length-1];const active=ids.every(id=>eq.includes(id));const comboNames=ids.map(id=>{const a=getArtifactDef(id);return `${a?.ic||'?'} ${a?.name||id}`;}).join(' + ');return `<div class="codexEffect ${active?'active':''}"><b>${comboName}</b> · ${text}<small style="display:block;color:var(--sub);margin-top:2px;">${comboNames}${active?' · ✓ 발동 중':''}</small></div>`}).join('')}</div>`;
  el.innerHTML=`<div class="artifactBookSummary">전체 <b>${ARTIFACTS.length}종</b> · 세트 <b>${ARTIFACT_SETS.length}개</b> · 조합 시너지 <b>${ARTIFACT_COMBO_SYNERGIES.length}종</b> · 장착 <b>${eq.length}/5</b></div>`+setCards+comboBook;
}

function artifactStatLabel(key){ return ({atkPct:'공격력',hpPct:'최대 HP',goldPct:'골드 획득량',critRate:'치명타 확률',expPct:'전투 경험치 획득량',critDmg:'치명타 피해',bossDmg:'보스에게 가하는 피해'})[key]||key; }

function getArtifactBonus(stat){
  let total=0;
  getEquippedArtifactIds().forEach(id=>{
    const a=getArtifactDef(id), lv=getArtifactLevel(id);
    if(a && lv>0 && a.stat===stat) total += a.base * artifactLevelMultiplier(lv);
  });
  return total;
}

function addArtifactShards(n, reason=''){
  n=Math.max(0,Math.floor(n||0)); if(!n) return;
  S.artifactShards=(S.artifactShards||0)+n;
  if(reason) toast(`🌌 유물의 파편 +${n} · ${reason}`);
}

function weightedArtifactRarity(){
  const r=Math.random()*100; let acc=0;
  for(const [name,rate] of ARTIFACT_RATES){ acc+=rate; if(r<acc) return name; }
  return 'common';
}

function pickArtifact(){
  const rarity=weightedArtifactRarity();
  const pool=ARTIFACTS.filter(a=>a.rarity===rarity);
  return pool[Math.floor(Math.random()*pool.length)];
}

function artifactPullCost(n){ return n===10 ? 9000 : 1000; }

function triggerArtifactSummonFx(n){
  const fx=document.getElementById('artifactSummonFx'); if(!fx) return;
  fx.classList.remove('show'); void fx.offsetWidth; fx.classList.add('show');
  const seal=fx.querySelector('.seal'), words=fx.querySelector('.words');
  if(seal) seal.textContent=n===10?'✦ ᛉ ◈ ᛟ ◈ ᛉ ✦':'✦ ᛉ ◈ ᛟ ✦';
  if(words) words.innerHTML=n===10?'열 개의 봉인이 동시에 깨어난다<small>THE TENFOLD RELIQUARY</small>':'유물의 문이 열린다<small>THE RELIQUARY REMEMBERS</small>';
  setTimeout(()=>fx.classList.remove('show'),2800);
}

function drawArtifact(n=1){
  n=Number(n)===10?10:1; const cost=artifactPullCost(n);
  if((S.artifactShards||0)<cost){ toast(`🌌 유물의 파편이 부족합니다! 필요: ${cost}`); return; }
  S.artifactShards-=cost;
  triggerArtifactSummonFx(n);
  const results=[];
  for(let i=0;i<n;i++){
    const a=pickArtifact(); const old=getArtifactLevel(a.id);
    if(old>=10){ addArtifactShards(30); results.push({a,lv:10,max:true}); }
    else { S.artifacts[a.id]={level:old+1}; results.push({a,lv:old+1,max:false}); }
  }
  renderArtifacts(results); renderAll(); saveGame();
}

function upgradeArtifact(id){
  const a=getArtifactDef(id), lv=getArtifactLevel(id); if(!a||lv<=0||lv>=10) return;
  const cost=Math.floor(60 + lv*45 + lv*lv*12);
  if((S.artifactShards||0)<cost){toast(`🌌 유물의 파편이 부족합니다! 필요: ${cost}`);return;}
  S.artifactShards-=cost; S.artifacts[id].level=Math.min(10,lv+1);
  renderArtifacts(); renderAll(); saveGame(); toast(`🌌 ${a.name} Lv.${lv+1} 강화!`);
}

function artifactExactText(a,val){
  const n=(v)=>Number(v.toFixed(2));
  const map={atkPct:`공격력 ${n(val)}% 상승`,hpPct:`최대 HP ${n(val)}% 상승`,goldPct:`골드 획득량 ${n(val)}% 상승`,critRate:`치명타 확률 ${n(val)}%p 상승`,expPct:`전투 경험치 획득량 ${n(val)}% 상승`,critDmg:`치명타 피해 ${n(val)}% 상승`,bossDmg:`보스에게 가하는 피해 ${n(val)}% 상승`};
  return map[a.stat]||`기록되지 않은 권능 ${n(val)}`;
}

function artifactMysteryText(a,lv){
  const t={atkPct:['칼날이 조금 더 무거워진다.','전장의 기류가 그 주위를 따른다.','힘의 근원이 서서히 드러난다.','그 힘은 결국 공격으로 귀결될 것이다.'],hpPct:['심장이 아닌 것이 박동한다.','죽음의 문턱이 한 걸음 물러난다.','육신의 경계가 희미해진다.','그 권능은 생명을 붙든다.'],goldPct:['금속이 주인을 기억한다.','손에 닿지 않은 재물의 향이 난다.','재화의 흐름이 한쪽으로 기운다.','그 권능은 재물의 귀환을 부른다.'],critRate:['눈동자 너머에 다른 시선이 있다.','아직 오지 않은 한 점을 본다.','명중의 순간이 먼저 보인다.','그 권능은 필연을 겨눈다.'],expPct:['읽지 않은 문장이 스스로 열린다.','시간이 지식의 편을 든다.','배움의 흔적이 깊어진다.','그 권능은 기억을 가속한다.'],critDmg:['상처보다 먼저 균열이 생긴다.','한 번의 궤적이 길어진다.','파괴의 깊이가 모습을 드러낸다.','그 권능은 치명적인 결말을 부른다.'],bossDmg:['거대한 존재를 향해 반응한다.','왕의 그림자에만 불이 켜진다.','종언을 가진 적에게 균열이 생긴다.','그 권능은 거대한 적을 겨눈다.']}[a.stat]||['봉인이 흔들린다.','기록이 되살아난다.','권능의 윤곽이 드러난다.','마침내 이름을 알 수 있을 것 같다.'];
  return t[Math.min(lv-1,3)];
}

function toggleArtifactEquip(id){
  const lv=getArtifactLevel(id); if(lv<=0) return;
  if(!Array.isArray(S.equippedArtifacts)) S.equippedArtifacts=[];
  const idx=S.equippedArtifacts.indexOf(id);
  if(idx>=0){ S.equippedArtifacts.splice(idx,1); toast('🌌 유물을 장착 해제했습니다.'); }
  else { if(S.equippedArtifacts.length>=5){toast('유물은 최대 5개까지 장착할 수 있습니다!');return;} S.equippedArtifacts.push(id); toast('🌌 유물을 장착했습니다!'); }
  renderArtifacts(); renderAll(); saveGame();
}

function renderArtifactSynergy(){
  const el=document.getElementById('artifactSynergyPanel'); if(!el) return;
  const syn=getArtifactSynergy();
  el.innerHTML=`<div class="artifactSynergyHead">✦ 유물 시너지 <b>${getEquippedArtifactIds().length}/5</b></div><div class="artifactEquippedList">${getEquippedArtifactIds().map(id=>{const a=getArtifactDef(id);return `<span>${a.ic} ${a.name}</span>`}).join('')||'<span>아직 선택된 유물이 없습니다.</span>'}</div><div class="artifactSynergyNames">${syn.names.length?syn.names.map(n=>`<b>✦ ${n}</b>`).join(' · '):'세트 유물이 2개 이상 모이면 특수 능력이 깨어납니다.'}</div><div class="artifactSynergyDesc">${syn.abilities.length?syn.abilities.map(a=>`<div>🔹 <b>${a.setName} ${a.need}세트</b> · ${a.text}</div>`).join(''):'<div style="color:var(--sub)">현재 발동 중인 유물 시너지가 없습니다.</div>'}</div>`;
}

function renderArtifacts(results){
  const shardCount=fmt(S.artifactShards||0); const cur=document.getElementById('artifactShardVal'); if(cur) cur.textContent=shardCount; const navShard=document.getElementById('artifactNavShard'); if(navShard) navShard.textContent=shardCount;
  const ownedCount=ARTIFACTS.filter(a=>getArtifactLevel(a.id)>0).length;
  const owned=document.getElementById('artifactOwnedCount'); if(owned) owned.textContent=ownedCount;
  const ec=document.getElementById('artifactEquippedCount'); if(ec) ec.textContent=getEquippedArtifactIds().length;
  renderArtifactSynergy();
  const grid=document.getElementById('artifactGrid'); if(!grid) return;

  const filters=`<div class="artifactGuide">
    <div class="artifactGuideHead"><b>🌌 유물 선택</b><span>장착한 5개만 능력치가 적용됩니다.</span></div>
    <div class="artifactFilterBtns">
      ${[['all','전체'],['owned','보유'],['equipped','장착중'],['offense','⚔️ 공격'],['survival','🛡️ 생존'],['growth','💰 성장']].map(([k,t])=>`<button class="artifactFilter ${artifactFilter===k?'active':''}" onclick="setArtifactFilter('${k}')">${t}</button>`).join('')}
    </div>
    <div class="artifactLegend"><span class="legendEquipped">● 장착</span><span>🟣 전설/영웅 등급</span><span>🟢 보유</span><span>⚪ 미획득</span></div>
  </div>`;

  let sorted=[...ARTIFACTS].sort((a,b)=>{const ea=getEquippedArtifactIds().includes(a.id),eb=getEquippedArtifactIds().includes(b.id); if(ea!==eb)return eb-ea; const la=getArtifactLevel(a.id),lb=getArtifactLevel(b.id); if(la!==lb)return lb-la; return a.id.localeCompare(b.id);});
  sorted=sorted.filter(a=>{const lv=getArtifactLevel(a.id),eq=getEquippedArtifactIds().includes(a.id),role=artifactRole(a).cls; if(artifactFilter==='owned')return lv>0; if(artifactFilter==='equipped')return eq; if(['offense','survival','growth'].includes(artifactFilter))return role===artifactFilter; return true;});
  grid.innerHTML=filters+`<div class="artifactGridInner">`+sorted.map(a=>{
    const lv=getArtifactLevel(a.id); const val=lv?a.base*artifactLevelMultiplier(lv):0; const ownedLv=lv>0; const equippedNow=getEquippedArtifactIds().includes(a.id);
    const cost=lv>0&&lv<5?Math.floor(60+lv*45+lv*lv*12):0;
    const role=artifactRole(a); const set=ARTIFACT_SETS.find(x=>x.pieces.includes(a.id)); const setCount=set?getArtifactSetCount(set):0;
    const powerText=a.stat==='atkPct'?'공격력':a.stat==='hpPct'?'최대 HP':a.stat==='hpPct'?'최대 HP':a.stat==='goldPct'?'골드 획득량':a.stat==='critRate'?'치명타 확률':a.stat==='expPct'?'전투 경험치':a.stat==='critDmg'?'치명타 피해':'보스 피해';
    const exact=artifactExactText(a,val); const reveal=lv===0?'미획득 · 소환에서 획득할 수 있습니다.':lv<5?artifactMysteryText(a,lv):exact;
    return `<div class="artifactCard ${a.rarity} ${equippedNow?'artifactSelected':''} ${ownedLv?'ownedArtifact':''}" onclick="${ownedLv?`toggleArtifactEquip('${a.id}')`:''}">
      <div class="artifactStatus">${equippedNow?'✓ 장착중':ownedLv?'보유':'미획득'}</div>
      <div class="artifactIc">${a.ic}</div><div class="artifactName">${a.name}</div>
      <div class="artifactRarity" style="color:${a.rarity==='legendary'?'#ffd166':a.rarity==='epic'?'#b06cff':a.rarity==='rare'?'#4da6ff':'#aaa'}">${ARTIFACT_RARITY_NAMES[a.rarity]}</div>
      <div class="artifactRole ${role.cls}">${role.label}</div><div class="artifactSetLine">${set?set.ic+' '+set.name+' · '+setCount+'/4':''}</div>
      <div class="artifactLv">${ownedLv?'Lv.'+lv:'미획득'}</div><div class="artifactDesc"><b>${powerText}</b><br>${reveal}${lv===5?' · 「완전개방」':''}</div>
      ${ownedLv&&lv<5?`<button class="artifactUpgrade" onclick="event.stopPropagation();upgradeArtifact('${a.id}')">⬆️ 봉인 해제 · ${cost} 파편</button>`:''}
      ${ownedLv?`<button class="artifactEquipBtn" onclick="event.stopPropagation();toggleArtifactEquip('${a.id}')">${equippedNow?'✓ 장착 해제':'＋ 장착하기'}</button>`:''}
    </div>`;
  }).join('')+`</div>`;
  const result=document.getElementById('artifactPullResult');
  if(results && results.length){ result.style.display='block'; result.innerHTML='<div class="artifactPullResult"><b>🌌 유물 소환 결과</b><div>'+results.map(x=>`<span class="artifactResultItem">${x.a.ic} ${x.a.name} ${x.max?'· MAX 중복 → +30 파편':'Lv.'+x.lv}</span>`).join('')+'</div></div>'; }
}