/* Extracted module. Gameplay behavior intentionally preserved. */

function getPlayerGrowthPoints(){ return Math.max(0,(S.player.level||1)-1); }

function growthLevel(id){ return Math.max(0, Number((S.growthSkills||{})[id]||0)); }

function growthSpent(tree){ return tree.reduce((n,x)=>n+growthLevel(x.id),0); }

function growthBonus(stat){
  let total=0;
  [...PET_GROWTH_TREE,...PLAYER_GROWTH_TREE].forEach(n=>{if(n.stat===stat) total += growthLevel(n.id)*n.step;});
  return total;
}

function buyGrowthNode(id, treeName){
  const tree = treeName==='pet' ? PET_GROWTH_TREE : PLAYER_GROWTH_TREE;
  const node = tree.find(x=>x.id===id); if(!node) return;
  const spent = growthSpent(tree);
  const available = treeName==='pet' ? getPetGrowthPoints() : getPlayerGrowthPoints();
  const lv = growthLevel(id);
  if(lv>=node.max){ toast('🌳 이 성장 노드는 최대 레벨입니다.'); return; }
  if(spent>=available){ toast('🌳 성장 포인트가 부족합니다.'); return; }
  S.growthSkills[id]=lv+1;
  if(treeName==='pet') S.petGrowthSpent=spent+1; else S.playerGrowthSpent=spent+1;
  renderGrowthTree(); renderAll(); saveGame();
  toast(`${node.icon} ${node.name} Lv.${lv+1} 달성!`);
}

function resetGrowthTree(treeName){
  const tree = treeName==='pet' ? PET_GROWTH_TREE : PLAYER_GROWTH_TREE;
  const label = treeName==='pet' ? '펫 성장 스킬트리' : '플레이어 성장 스킬트리';
  const spent = growthSpent(tree);
  if(spent<=0){ toast('🌳 초기화할 스킬 포인트가 없습니다.'); return; }
  const cost = growthResetCost(treeName);
  if((S.gold||0) < cost){ toast(`💰 골드가 부족합니다. 초기화 비용 ${fmt(cost)}G`); return; }
  if(!confirm(`'${label}'을(를) 초기화할까요?\n사용 골드: ${fmt(cost)}G\n투자한 포인트 ${spent}개가 모두 반환됩니다.`)) return;
  S.gold -= cost;
  tree.forEach(n=>{ S.growthSkills[n.id]=0; });
  if(treeName==='pet') S.petGrowthSpent=0; else S.playerGrowthSpent=0;
  renderGrowthTree(); renderAll(); saveGame();
  toast(`🌳 ${label} 초기화 완료! ${spent} 포인트 반환`);
}

function buyGrowthNode10(id,type,e){
  if(e){ e.preventDefault(); e.stopPropagation(); }
  const tree=type==='pet'?PET_GROWTH_TREE:PLAYER_GROWTH_TREE;
  const node=tree.find(n=>n.id===id);
  if(!node) return;
  let count=0;
  while(count<10){
    const spent=growthSpent(tree);
    const available=type==='pet'?getPetGrowthPoints():getPlayerGrowthPoints();
    const lv=growthLevel(id);
    if(lv>=node.max || spent>=available) break;
    S.growthSkills[id]=lv+1;
    count++;
  }
  if(count>0){
    renderGrowthTree();
    renderAll();
    saveGame();
    toast(`${node.icon} ${node.name} +${count}단계 강화!`);
  }else{
    toast('🌳 성장 포인트가 부족합니다.');
  }
}

function buyTree10(type,e){
  if(e){ e.preventDefault(); e.stopPropagation(); }
  const tree=type==='pet'?PET_GROWTH_TREE:PLAYER_GROWTH_TREE;
  const target=tree.find(n=>growthLevel(n.id)<n.max);
  if(!target){ toast('🌳 모든 성장 스킬이 최대 레벨입니다.'); return; }
  buyGrowthNode10(target.id,type,e);
}

function renderGrowthTree(){
  const petPts=getPetGrowthPoints(), playerPts=getPlayerGrowthPoints();
  const petSpent=growthSpent(PET_GROWTH_TREE), playerSpent=growthSpent(PLAYER_GROWTH_TREE);
  const petEl=document.getElementById('petGrowthTree'), playerEl=document.getElementById('playerGrowthTree');
  if(!petEl||!playerEl) return;
  renderFocusUpgrades();
  renderOriginGrowth();
  document.getElementById('petGrowthPointText').textContent=`${Math.max(0,petPts-petSpent)} / ${petPts}`;
  document.getElementById('playerGrowthPointText').textContent=`${Math.max(0,playerPts-playerSpent)} / ${playerPts}`;
  const branch=(tree,type)=>tree.map((n,i)=>{
    const lv=growthLevel(n.id), max=n.max;
    const total=(lv*n.step);
    const can=(type==='pet'?petPts-petSpent:playerPts-playerSpent)>0 && lv<max;
    return `<div class="growthNode ${lv>=max?'maxed':''}">
      <div class="growthNodeIcon">${n.icon}</div>
      <div><div class="growthNodeName">${n.name}</div><div class="growthNodeDesc">${n.desc} · 현재 +${Number(total.toFixed(1))}%</div><div class="growthNodeLv">Lv.${lv} / ${max}</div></div>
      <div class="growthBuyGroup">
        <button class="growthBuy" ${can?'':'disabled'} onclick="buyGrowthNode('${n.id}','${type}')">+1</button>
        <button class="growthBuy growthBuy10" ${can?'':'disabled'} onclick="buyGrowthNode10('${n.id}','${type}',event)">+10</button>
      </div>
    </div>`;
  }).join('');
  petEl.innerHTML='<div class="growthBranch"><div class="growthBranchTitle growthPetTag">🐾 소소한 성장 — 5개 계열 × 100단계 <span class="treeQuickActions"><button class="growthBulk10" onclick="buyTree10(\'pet\',event)">+10 추가</button><button class="growthReset" onclick="resetGrowthTree(\'pet\')">💰 초기화 <span>'+fmt(growthResetCost('pet'))+'G</span></button></span></div><div class="growthNodes">'+branch(PET_GROWTH_TREE,'pet')+'</div></div>';
  playerEl.innerHTML='<div class="growthBranch"><div class="growthBranchTitle growthPlayerTag">🧍 메인 성장 — 6개 계열 × 100단계 <span class="treeQuickActions"><button class="growthBulk10" onclick="buyTree10(\'player\',event)">+10 추가</button><button class="growthReset" onclick="resetGrowthTree(\'player\')">💰 초기화 <span>'+fmt(growthResetCost('player'))+'G</span></button></span></div><div class="growthNodes">'+branch(PLAYER_GROWTH_TREE,'player')+'</div></div>';
  const summary=document.getElementById('growthSummary');
  if(summary) summary.innerHTML=`🐾 펫 추가레벨 <b>${petPts}</b> → 남은 펫 포인트 <b>${Math.max(0,petPts-petSpent)}</b>　|　🧍 플레이어 Lv.${S.player.level} → 남은 플레이어 포인트 <b>${Math.max(0,playerPts-playerSpent)}</b><br><span style="color:var(--sub);font-size:9px">펫 트리는 작은 보너스, 플레이어 트리는 체감되는 일반 성장 보너스입니다.</span>`;
}

function switchGrowthTree(type){
  const pet=document.getElementById('petGrowthScreen'), player=document.getElementById('playerGrowthScreen'), focus=document.getElementById('focusUpgradePanel'), origin=document.getElementById('originGrowthPanel');
  const pt=document.getElementById('growthTabPet'), pl=document.getElementById('growthTabPlayer'), ft=document.getElementById('growthTabFocus'), ot=document.getElementById('growthTabOrigin');
  if(!pet||!player||!focus||!origin) return;
  pet.style.display=type==='pet'?'block':'none';
  player.style.display=type==='player'?'block':'none';
  focus.style.display=type==='focus'?'block':'none';
  origin.style.display=type==='origin'?'block':'none';
  pt.classList.toggle('active',type==='pet');
  pl.classList.toggle('active',type==='player');
  ft.classList.toggle('active',type==='focus');
  ot.classList.toggle('active',type==='origin');
  if(type==='focus') renderFocusUpgrades();
  if(type==='origin') renderOriginGrowth();
}

function openGrowthModal(){ renderGrowthTree(); switchGrowthTree('pet'); document.getElementById('growthModalBg').classList.add('show'); }

function bulkUpgrade10(singleFn){
  let n=0;
  const run=()=>{
    if(n>=10) return;
    n++;
    try{ singleFn(); }catch(e){ console.warn(e); }
    requestAnimationFrame(run);
  };
  run();
}

function buyPlayerTree10(e){
  if(e) e.stopPropagation();
  if(typeof upgradePlayerTree==='function') return bulkUpgrade10(upgradePlayerTree);
  if(typeof buyPlayerTree==='function') return bulkUpgrade10(buyPlayerTree);
  if(typeof playerTreeUpgrade==='function') return bulkUpgrade10(playerTreeUpgrade);
  if(typeof upgradePlayer==='function') return bulkUpgrade10(upgradePlayer);
}