/* Extracted module. Gameplay behavior intentionally preserved. */

function hasAllPetsForSpouse(){ return PET_PRESETS.length>0 && PET_PRESETS.every(p=>Number(S.pets?.[p.id]||0)>0); }

function getEquippedSpouse(){ return SPOUSE_PRESETS.find(x=>x.id===S.equippedSpouse) || null; }

function getSpousePetDamageMult(){ const sp=getEquippedSpouse(); if(!sp)return 1; let mult=1+sp.bonus/100; if(sp.special==='doublePetChance')mult*=2; if(sp.special==='bossPetDamage'&&S.monster?.isBoss)mult*=1.60; if(sp.special==='lowHpPetDamage'&&S.player?.hp<=calcMaxHp()*0.30)mult*=1.80; if(sp.special==='executePetDamage'&&S.monster?.hp<=S.monster?.maxHp*0.20)mult*=2.50; return mult; }

function getSpousePetDamageBonus(){ const sp=getEquippedSpouse(); return sp ? sp.bonus : 0; }

function isSpouseUnlocked(){ return hasAllPetsForSpouse(); }

function renderSpouseBadge(){
  const box=document.getElementById('spouseSceneBadge'); const sp=getEquippedSpouse();
  if(!box) return;
  if(!sp){ box.classList.remove('show'); return; }
  box.classList.add('show');
  const n=document.getElementById('spouseSceneName'), t=document.getElementById('spouseSceneTitle');
  const aura=SPOUSE_GRADE_COLORS[sp.grade]||'#ffd700';
  box.style.setProperty('--spouse-aura',aura);
  if(n) n.textContent=sp.ic;
  if(t) t.textContent='';
}

function renderSpouse(){
  const unlocked=isSpouseUnlocked();
  const area=document.getElementById('spouseUnlockArea');
  const count=PET_PRESETS.filter(p=>Number(S.pets?.[p.id]||0)>0).length;
  if(area) area.innerHTML=unlocked
    ? `<div class="spouseUnlockBox"><b>💍 배우자 시스템 해금 완료</b><div style="font-size:9px;color:var(--sub);margin-top:4px;">전체 펫 ${count}/${PET_PRESETS.length}종 획득 · 1명만 장착 가능</div></div>`
    : `<div class="spouseUnlockBox locked"><b>🔒 배우자 시스템 잠금</b><div style="font-size:9px;color:var(--sub);margin-top:4px;">모든 펫 획득 시 해금 · 현재 ${count}/${PET_PRESETS.length}종 획득</div></div>`;
  const ev=document.getElementById('spouseEssenceVal'); if(ev) ev.textContent=fmt(S.essence||0);
  const btn=document.getElementById('spousePullBtn'); if(btn){ btn.disabled=!unlocked || S.essence<10000 || SPOUSE_PRESETS.every(x=>Number(S.spouses?.[x.id]||0)>0); btn.textContent=SPOUSE_PRESETS.every(x=>Number(S.spouses?.[x.id]||0)>0)?'✨ 모든 배우자 획득 완료':`💍 1회 소환 · 🌿 10,000`; }
  const rateWrap=document.getElementById('spouseRateTableWrap');
  if(rateWrap){
    rateWrap.innerHTML=`<table class="spouseRateTable"><thead><tr><th>등급</th><th>배우자</th><th>펫 피해</th><th>확률</th></tr></thead><tbody>${SPOUSE_PRESETS.map(sp=>`<tr><td>${sp.grade}등급</td><td>${sp.name}</td><td>+${sp.bonus}%</td><td>${sp.rate}%</td></tr>`).join('')}</tbody></table>`;
  }
  const result=document.getElementById('spouseResult');
  const grid=document.getElementById('spouseGrid'); if(!grid)return;
  grid.innerHTML=SPOUSE_PRESETS.map(sp=>{
    const owned=Number(S.spouses?.[sp.id]||0)>0, eq=S.equippedSpouse===sp.id, color=SPOUSE_GRADE_COLORS[sp.grade]||'#fff';
    return `<div class="spouseCard ${owned?'':'locked'} ${eq?'equipped':''}">
      <div class="spouseIcon">${owned?sp.ic:'❔'}</div>
      <div><div class="spouseGrade" style="color:${color}">${sp.grade}등급</div><div class="spouseName">${owned?sp.name:'???'}</div><div class="spouseTitle">${owned?'「'+sp.title+'」':'미획득'}</div><div class="spouseDesc">펫 피해 <b style="color:#ffd54a">+${sp.bonus}%</b>${sp.specialText?'<br><span style="color:#8ff0ff">✦ '+sp.specialText+'</span>':''}</div></div>
      <div>${owned?(eq?`<button class="spouseBtn remove" onclick="unequipSpouse()">해제</button>`:`<button class="spouseBtn" onclick="equipSpouse('${sp.id}')">장착</button>`):''}</div>
    </div>`;
  }).join('');
}

function playSpouseSummonFx(sp){
  const fx=document.getElementById('spouseSummonFx');
  if(!fx) return Promise.resolve();
  const n=document.getElementById('summonName'), g=document.getElementById('summonGrade'), t=document.getElementById('summonTitle');
  if(n) n.textContent=`${sp.ic} ${sp.name}`;
  if(g) g.textContent=`${sp.grade}등급 · 펫 피해 +${sp.bonus}%${sp.specialText?' · ✦ 특별 능력':''}`;
  if(t) t.textContent=`「${sp.title}」`;
  fx.classList.toggle('mythic',sp.grade===10); fx.classList.add('show');
  return new Promise(resolve=>setTimeout(()=>{fx.classList.remove('show','mythic');resolve();},3000));
}

function drawSpouse(){
  if(!isSpouseUnlocked()){ toast('모든 펫을 획득해야 배우자가 해금됩니다!'); return; }
  if(S.essence<10000){ toast('생명의 정수가 부족합니다! (10,000 필요)'); return; }
  const available=SPOUSE_PRESETS.filter(x=>!S.spouses?.[x.id]);
  if(!available.length){ toast('모든 배우자를 이미 획득했습니다!'); return; }
  S.essence-=10000;
  // 모든 소환은 아래 확률표의 고정 확률을 그대로 1회 판정합니다.
  let r=Math.random()*100, picked=SPOUSE_PRESETS[SPOUSE_PRESETS.length-1];
  for(const sp of SPOUSE_PRESETS){ r-=sp.rate; if(r<=0){ picked=sp; break; } }
  const alreadyOwned=Number(S.spouses?.[picked.id]||0)>0;
  if(alreadyOwned){
    const result=document.getElementById('spouseResult');
    if(result) result.innerHTML=`<div class="spouseResult"><div style="font-size:24px">🔁</div><b style="font-size:14px">중복 소환</b><div style="font-size:10px;color:var(--sub);margin-top:3px;">${picked.name} · 확률 ${picked.rate}%</div></div>`;
    toast(`🔁 ${picked.name} 중복 소환 · 추가 보상 없음`);
    renderSpouse(); renderAll(); saveGame();
    return;
  }
  S.spouses[picked.id]=1;
  const result=document.getElementById('spouseResult');
  await playSpouseSummonFx(picked);
  if(result) result.innerHTML=`<div class="spouseResult"><div style="font-size:24px">${picked.ic}</div><b style="font-size:15px;color:${SPOUSE_GRADE_COLORS[picked.grade]}">${picked.grade}등급 · ${picked.name}</b><div style="font-size:10px;color:var(--sub);margin-top:3px;">「${picked.title}」 · 펫 피해 +${picked.bonus}%</div></div>`;
  toast(`💍 ${picked.name}이(가) 강림했습니다! 펫 피해 +${picked.bonus}%`);
  renderSpouse(); renderAll(); saveGame();
}

function equipSpouse(id){ if(!isSpouseUnlocked() || !S.spouses?.[id]) return; S.equippedSpouse=id; renderSpouse(); renderSpouseBadge(); saveGame(); toast(`💍 ${SPOUSE_PRESETS.find(x=>x.id===id)?.name||id} 장착!`); }

function unequipSpouse(){ S.equippedSpouse=null; renderSpouse(); renderSpouseBadge(); saveGame(); toast('배우자를 해제했습니다.'); }

/* Extracted module. Gameplay behavior intentionally preserved. */

function applySpousePetDamageScale(petDamageBefore){
  const mult=getSpousePetDamageMult();
  if(mult===1) return 0;
  const pets=S.damageStats?.pets||{};
  let beforeTotal=0, afterTotal=0;
  Object.keys(pets).forEach(id=>{ beforeTotal+=Number(petDamageBefore?.[id]||0); afterTotal+=Number(pets[id]||0); });
  const currentDelta=Math.max(0,afterTotal-beforeTotal);
  if(currentDelta<=0) return 0;
  let target=Math.max(0,Math.round(currentDelta*mult));
  const ids=Object.keys(pets).filter(id=>Number(pets[id]||0)>Number(petDamageBefore?.[id]||0));
  let assigned=0;
  ids.forEach((id,i)=>{
    const delta=Number(pets[id]||0)-Number(petDamageBefore?.[id]||0);
    const val=i===ids.length-1 ? target-assigned : Math.round(delta*mult);
    pets[id]=Number(petDamageBefore?.[id]||0)+Math.max(0,val); assigned+=Math.max(0,val);
  });
  return Math.max(0,target-currentDelta);
}