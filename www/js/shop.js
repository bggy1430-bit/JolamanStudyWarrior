/* Extracted module. Gameplay behavior intentionally preserved. */

function openModal(name){
  document.getElementById(name+'ModalBg').classList.add('show');
  if(name==='bag') { switchBagTab(currentBagTab); renderEquipSlots(); }
  if(name==='settings'){ renderSettings(); }
  if(name==='character'){ renderCharacter(); renderDetailStats(); }
  if(name==='shop'){ updateBoxCost(); renderWeaponShop(); renderGoldShop(); }
  if(name==='damageReport'){ renderDamageReport(); }
  if(name==='pet') switchPetTab(currentPetTab);
  if(name==='spouse') renderSpouse();
  if(name==='enh') { switchEnhTab(currentEnhTab || 'power'); }
  if(name==='growth') { renderGrowthTree(); }
  if(name==='arsenal') { renderArsenal(); }
  if(name==='artifact') { renderArtifacts(); renderArtifactSetCodex(); }
  if(name==='artifactSets') { renderArtifactSetCodex(); }
  if(name==='petSynergyBook') { renderPetSynergyBook(); }
  if(name==='equipSetBook') { renderEquipSetBook(); }
  if(name==='preset') { renderPresetModal(); }
}

function closeModal(name){ document.getElementById(name+'ModalBg').classList.remove('show'); }

function switchShopTab(tab){
  if(tab==='potion') tab='box';
  document.getElementById('tabBox').classList.toggle('active', tab==='box');
  document.getElementById('tabGold').classList.toggle('active', tab==='gold');
  document.getElementById('shopBoxPane').style.display = tab==='box'?'block':'none';
  document.getElementById('shopGoldPane').style.display = tab==='gold'?'block':'none';
  if(tab==='gold') renderGoldShop(); else updateBoxCost();
}

function sellAllJunk(){
  if(S.bagJunk.length === 0){ toast('판매할 잡템이 없습니다.'); return; }
  let totalGold = 0, count = S.bagJunk.length;
  S.bagJunk.forEach(it => { totalGold += getJunkSellValue(it); });
  S.bagJunk = [];
  S.gold += totalGold;
  renderAll(); saveGame();
  toast(`📦 잡템 ${count}개 일괄 판매 완료! +💰${fmt(totalGold)}`);
}

function dismantleAllUnequipped(){
  const result = dismantleLowerGradeEquipments();

  if(result.count > 0){
    renderAll(); saveGame();
    toast(`💎 장비 ${result.count}개 일괄 분해 완료! 영혼석 +${result.totalSs}${result.totalArtifactShards>0?` · 🌌 유물의 파편 +${result.totalArtifactShards}`:''}`);
  } else {
    toast('분해 가능한 하위 등급 장비가 없습니다.');
  }
}