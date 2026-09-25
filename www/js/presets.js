/* Extracted module. Gameplay behavior intentionally preserved. */

function findOwnedItemById(id){
  if(!id) return null;
  for(const slot of ['weapon','helmet','armor','gloves','accessory']) if(S.equip[slot]?.id===id) return S.equip[slot];
  return S.bagEquip.find(x=>x.id===id)||null;
}

function capturePreset(index){
  const p=S.artifactPresets[index]; p.pets=[...(S.equippedPets||[])]; p.artifacts=[...getEquippedArtifactIds()]; p.equip={}; ['weapon','helmet','armor','gloves','accessory'].forEach(k=>{p.equip[k]=S.equip[k]?.id||null;}); saveGame(); renderPresetModal(); toast(`⚔️ ${p.name} 프리셋 저장 완료!`);
}

function applyPreset(index){
  const p=S.artifactPresets[index]; if(!p)return;
  ['weapon','helmet','armor','gloves','accessory'].forEach(k=>{
    const want=p.equip?.[k]||null, cur=S.equip[k];
    if(cur?.id===want)return;
    if(cur) S.bagEquip.push(cur); S.equip[k]=null;
    if(want){ const idx=S.bagEquip.findIndex(x=>x.id===want); if(idx>=0){ S.equip[k]=S.bagEquip.splice(idx,1)[0]; } }
  });
  S.equippedPets=(p.pets||[]).filter(id=>(S.pets[id]||0)>0).slice(0,12);
  S.equippedArtifacts=(p.artifacts||[]).filter(id=>getArtifactLevel(id)>0).slice(0,5);
  renderAll(); renderPresetModal(); saveGame(); toast(`⚔️ ${p.name} 프리셋 적용 완료!`);
}

function renderPresetModal(){
  const el=document.getElementById('presetGrid'); if(!el)return;
  el.innerHTML=(S.artifactPresets||[]).map((p,i)=>`<div class="presetCard"><b>${p.name}</b><div style="font-size:8px;color:var(--sub);margin-top:4px;">펫 ${(p.pets||[]).length} · 유물 ${(p.artifacts||[]).length} · 장비 ${Object.values(p.equip||{}).filter(Boolean).length}</div><button onclick="applyPreset(${i})">적용</button><button onclick="capturePreset(${i})" style="background:var(--panel);border:1px solid var(--line)">현재 세팅 저장</button></div>`).join('');
}