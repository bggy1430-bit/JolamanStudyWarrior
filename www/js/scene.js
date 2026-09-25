/* Extracted module. Gameplay behavior intentionally preserved. */

function renderSceneArtifacts(){
  const box=document.getElementById('playerArtifactLoadout'); if(!box) return;
  const equipped=getEquippedArtifactIds();
  const slots=[];
  for(let i=0;i<5;i++){
    const id=equipped[i];
    if(id){ const a=getArtifactDef(id), lv=getArtifactLevel(id); slots.push(`<div class="sceneArtifactSlot equipped" title="${a?.name||id} · Lv.${lv}" onclick="openModal('artifact')">${a?.ic||'◆'}<span class="sceneArtifactLv">${lv}</span></div>`); }
    else slots.push(`<div class="sceneArtifactSlot empty" title="빈 유물 슬롯" onclick="openModal('artifact')">＋</div>`);
  }
  box.innerHTML=slots.join('');
}