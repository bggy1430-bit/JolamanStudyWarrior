/* Extracted module. Gameplay behavior intentionally preserved. */

function playGachaFx(kind, icon, label, sub){
  if(!appSettings.gachaFx || appSettings.reducedFx) return;
  const box=document.getElementById('gachaFxOverlay'); if(!box)return;
  box.className='gachaFxOverlay show '+kind;
  document.getElementById('gachaFxCore').textContent=icon;
  document.getElementById('gachaFxLabel').innerHTML=`${label}<small>${sub||''}</small>`;
  sfx(kind==='pet'?'pet':'gacha');
  setTimeout(()=>box.className='gachaFxOverlay '+kind,1000);
}

function openMysteryBox(){
  const cost = boxCost();
  if(S.gold < cost){ toast('골드가 부족합니다!'); return; }
  
  S.gold -= cost;
  S.mbox.pulls++;

  const { weights, total } = getBoxProbabilities();
  let r = Math.random()*total, grade = 0;
  for(let g = 0; g < GRADES.length; g++){
    r -= weights[g];
    if(r <= 0){ grade = g; break; }
  }
  
  const slot = pick(['weapon','helmet','armor','gloves','accessory']);
  const item = makeEquip(slot, grade, S.stage);
  S.bagEquip.push(item);
  const autoGain = autoProcessEquip(item);
  const g = GRADES[grade];
  playGachaFx('equip', slotIcon(slot), 'EQUIPMENT SUMMON', `${g.name} · ${item.name}`);
  document.getElementById('boxResultWrap').innerHTML = `
    <div id="boxResult" style="text-align:center; padding:12px 0;">
      <div style="font-size:44px;">${slotIcon(slot)}</div>
      <div style="font-size:14px; font-weight:800; margin-top:4px; color:${g.color}">${item.name}</div>
    </div>`;
  updateBoxCost();
  renderAll(); saveGame();
  toast(autoGain ? `🎁 [${g.name}] ${item.name} 획득 → ⚙️ 하위등급 자동 분해! 영혼석 +${autoGain.ss}${autoGain.artifactGain?` · 유물의 파편 +${autoGain.artifactGain}`:''}` : `🎁 [${g.name}] 등급 장비 획득!`);
}

function openMysteryBox100(){
  const count = 100;
  let totalCost = 0;
  let tempPulls = S.mbox.pulls;

  for(let i=0; i<count; i++){
    totalCost += Math.floor(150 + (tempPulls * 2.5));
    tempPulls++;
  }

  if(S.gold < totalCost){
    toast(`💰 골드가 부족합니다! 100회 필요: ${fmt(totalCost)}`);
    return;
  }

  S.gold -= totalCost;
  const counts = Array(GRADES.length).fill(0);
  let best = null;

  for(let i=0; i<count; i++){
    S.mbox.pulls++;

    const { weights, total } = getBoxProbabilities();
    let r = Math.random()*total, grade = 0;
    for(let g=0; g<GRADES.length; g++){
      r -= weights[g];
      if(r <= 0){ grade = g; break; }
    }

    const slot = pick(['weapon','helmet','armor','gloves','accessory']);
    const item = makeEquip(slot, grade, S.stage);
    S.bagEquip.push(item);
    counts[grade]++;

    if(!best || grade > best.grade) best = { grade, slot, item };
  }

  let autoCount = 0, autoSs = 0, autoArtifact = 0;
  if(S.autoEquipDismantle){
    // 단일 뽑기/일괄분해와 같은 중앙 규칙으로 정리한다.
    const result = dismantleLowerGradeEquipments();
    autoCount = result.count;
    autoSs = result.totalSs;
    autoArtifact = result.totalArtifactShards;
  }

  const batch = document.getElementById('boxBatchResult');
  batch.style.display = 'block';
  batch.innerHTML = `
    <div style="background:var(--panel2); border:1px solid var(--line); border-radius:12px; padding:10px;">
      <div style="font-weight:800; margin-bottom:7px;">🎉 100회 뽑기 결과</div>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:5px;">
        ${GRADES.map((g,i)=>`
          <div style="padding:5px; border-radius:7px; background:rgba(255,255,255,.04); text-align:center;">
            <span style="color:${g.color}; font-weight:700;">${g.name}</span>
            <b style="margin-left:3px;">${counts[i]}</b>
          </div>`).join('')}
      </div>
      <div style="margin-top:8px; font-size:10.5px; color:var(--sub); text-align:center;">
        총 비용 💰${fmt(totalCost)} · 누적 ${S.mbox.pulls}회
        ${S.autoEquipDismantle && autoCount ? `<div style="margin-top:4px;color:#ffd166;">⚙️ 자동 분해 ${autoCount}개 · 영혼석 +${autoSs}${autoArtifact?` · 유물의 파편 +${autoArtifact}`:''}</div>` : S.autoEquipDismantle ? '<div style="margin-top:4px;color:#8bd7a5;">⚙️ 자동 분해: 해당 없음</div>' : ''}
      </div>
    </div>`;

  const g = GRADES[best.grade];
  document.getElementById('boxResultWrap').innerHTML = `
    <div id="boxResult" style="text-align:center; padding:12px 0;">
      <div style="font-size:38px;">${slotIcon(best.slot)}</div>
      <div style="font-size:13px; font-weight:800; margin-top:4px; color:${g.color}">
        최고 등급: ${best.item.name}
      </div>
    </div>`;

  updateBoxCost();
  renderAll();
  saveGame();
  toast(`🎁 100회 뽑기 완료! 최고 등급: [${g.name}]`);
}

function openMysteryBox10000(){
  const count = 10000;
  let totalCost = 0;
  let tempPulls = S.mbox.pulls;

  for(let i=0; i<count; i++){
    totalCost += Math.floor(150 + (tempPulls * 2.5));
    tempPulls++;
  }

  if(S.gold < totalCost){
    toast(`💰 골드가 부족합니다! 1만회 필요: ${fmt(totalCost)}`);
    return;
  }

  S.gold -= totalCost;
  const counts = Array(GRADES.length).fill(0);
  let best = null;

  for(let i=0; i<count; i++){
    S.mbox.pulls++;
    const { weights, total } = getBoxProbabilities();
    let r = Math.random()*total, grade = 0;
    for(let g=0; g<GRADES.length; g++){
      r -= weights[g];
      if(r <= 0){ grade = g; break; }
    }
    const slot = pick(['weapon','helmet','armor','gloves','accessory']);
    const item = makeEquip(slot, grade, S.stage);
    S.bagEquip.push(item);
    counts[grade]++;
    if(!best || grade > best.grade) best = { grade, slot, item };
  }

  let autoCount = 0, autoSs = 0, autoArtifact = 0;
  if(S.autoEquipDismantle){
    const result = dismantleLowerGradeEquipments();
    autoCount = result.count;
    autoSs = result.totalSs;
    autoArtifact = result.totalArtifactShards;
  }

  const batch = document.getElementById('boxBatchResult');
  batch.style.display = 'block';
  batch.innerHTML = `
    <div style="background:var(--panel2); border:1px solid var(--line); border-radius:12px; padding:10px;">
      <div style="font-weight:800; margin-bottom:7px;">🎉 1만회 뽑기 결과</div>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:5px;">
        ${GRADES.map((g,i)=>`
          <div style="padding:5px; border-radius:7px; background:rgba(255,255,255,.04); text-align:center;">
            <span style="color:${g.color}; font-weight:700;">${g.name}</span>
            <b style="margin-left:3px;">${counts[i]}</b>
          </div>`).join('')}
      </div>
      <div style="margin-top:8px; font-size:10.5px; color:var(--sub); text-align:center;">
        총 비용 💰${fmt(totalCost)} · 누적 ${S.mbox.pulls}회
        ${S.autoEquipDismantle && autoCount ? `<div style="margin-top:4px;color:#ffd166;">⚙️ 자동 분해 ${autoCount}개 · 영혼석 +${autoSs}${autoArtifact?` · 유물의 파편 +${autoArtifact}`:''}</div>` : S.autoEquipDismantle ? '<div style="margin-top:4px;color:#8bd7a5;">⚙️ 자동 분해: 해당 없음</div>' : ''}
      </div>
    </div>`;

  const g = GRADES[best.grade];
  document.getElementById('boxResultWrap').innerHTML = `
    <div id="boxResult" style="text-align:center; padding:12px 0;">
      <div style="font-size:38px;">${slotIcon(best.slot)}</div>
      <div style="font-size:13px; font-weight:800; margin-top:4px; color:${g.color}">
        최고 등급: ${best.item.name}
      </div>
    </div>`;

  updateBoxCost();
  renderAll();
  saveGame();
  toast(`🎁 1만회 뽑기 완료! 최고 등급: [${g.name}]`);
}

function openMysteryBox1000(){
  const count = 1000;
  let totalCost = 0;
  let tempPulls = S.mbox.pulls;

  for(let i=0; i<count; i++){
    totalCost += Math.floor(150 + (tempPulls * 2.5));
    tempPulls++;
  }

  if(S.gold < totalCost){
    toast(`💰 골드가 부족합니다! 1000회 필요: ${fmt(totalCost)}`);
    return;
  }

  S.gold -= totalCost;
  const counts = Array(GRADES.length).fill(0);
  let best = null;

  for(let i=0; i<count; i++){
    S.mbox.pulls++;

    const { weights, total } = getBoxProbabilities();
    let r = Math.random()*total, grade = 0;
    for(let g=0; g<GRADES.length; g++){
      r -= weights[g];
      if(r <= 0){ grade = g; break; }
    }

    const slot = pick(['weapon','helmet','armor','gloves','accessory']);
    const item = makeEquip(slot, grade, S.stage);
    S.bagEquip.push(item);
    counts[grade]++;

    if(!best || grade > best.grade) best = { grade, slot, item };
  }

  let autoCount = 0, autoSs = 0, autoArtifact = 0;
  if(S.autoEquipDismantle){
    // 단일 뽑기/일괄분해와 같은 중앙 규칙으로 정리한다.
    const result = dismantleLowerGradeEquipments();
    autoCount = result.count;
    autoSs = result.totalSs;
    autoArtifact = result.totalArtifactShards;
  }

  const batch = document.getElementById('boxBatchResult');
  batch.style.display = 'block';
  batch.innerHTML = `
    <div style="background:var(--panel2); border:1px solid var(--line); border-radius:12px; padding:10px;">
      <div style="font-weight:800; margin-bottom:7px;">🎉 1000회 뽑기 결과</div>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:5px;">
        ${GRADES.map((g,i)=>`
          <div style="padding:5px; border-radius:7px; background:rgba(255,255,255,.04); text-align:center;">
            <span style="color:${g.color}; font-weight:700;">${g.name}</span>
            <b style="margin-left:3px;">${counts[i]}</b>
          </div>`).join('')}
      </div>
      <div style="margin-top:8px; font-size:10.5px; color:var(--sub); text-align:center;">
        총 비용 💰${fmt(totalCost)} · 누적 ${S.mbox.pulls}회
        ${S.autoEquipDismantle && autoCount ? `<div style="margin-top:4px;color:#ffd166;">⚙️ 자동 분해 ${autoCount}개 · 영혼석 +${autoSs}${autoArtifact?` · 유물의 파편 +${autoArtifact}`:''}</div>` : S.autoEquipDismantle ? '<div style="margin-top:4px;color:#8bd7a5;">⚙️ 자동 분해: 해당 없음</div>' : ''}
      </div>
    </div>`;

  const g = GRADES[best.grade];
  document.getElementById('boxResultWrap').innerHTML = `
    <div id="boxResult" style="text-align:center; padding:12px 0;">
      <div style="font-size:38px;">${slotIcon(best.slot)}</div>
      <div style="font-size:13px; font-weight:800; margin-top:4px; color:${g.color}">
        최고 등급: ${best.item.name}
      </div>
    </div>`;

  updateBoxCost();
  renderAll();
  saveGame();
  toast(`🎁 1000회 뽑기 완료! 최고 등급: [${g.name}]`);
}

function renderWeaponShop(){
  const pane = document.getElementById('weaponShopList');
  let html = '';
  const shopCosts = [400, 700, 1550];
  for(let g = 0; g <= 2; g++){
    const cost = shopCosts[g];
    const gObj = GRADES[g];
    const wName = WEAPON_WORDS[g];
    html += `
      <div class="shopItem">
        <div>
          <div class="si-name" style="color:${gObj.color}">[${gObj.name}] ${wName}</div>
          <div class="si-desc">기초 추천 확정 무구</div>
        </div>
        <button onclick="buyFixedWeapon(${g}, ${cost})">💰 ${fmt(cost)} 구매</button>
      </div>`;
  }
  pane.innerHTML = html;
  pane.insertAdjacentHTML('afterbegin','<button class="enhBtn" style="width:100%;margin-bottom:8px;background:linear-gradient(135deg,#00bcd4,#536dfe)" onclick="doEnhanceContinuousAll()">⚡ 연속 강화 · 장착 장비를 초월 전까지 자동 강화</button>');
}

function buyFixedWeapon(grade, cost){
  if(S.gold < cost){ toast('골드가 부족합니다!'); return; }
  S.gold -= cost;
  const item = makeEquip('weapon', grade, S.stage);
  S.bagEquip.push(item);
  renderAll(); saveGame();
  toast(`🛒 [${GRADES[grade].name}] ${item.name} 구매 완료!`);
}

function buyBreakProtectionTicket(){const cost=5000;if((S.soulStones||0)<cost){toast('💎 영혼석이 부족합니다! 필요: 5,000');return;}S.soulStones-=cost;S.breakProtectionTickets=Math.max(0,Number(S.breakProtectionTickets||0))+1;renderGoldShop();renderAll();saveGame();toast('🛡️ 파괴방지권 1개 구매 완료!');}

function getBoxProbabilities(){
  const pulls = S.mbox.pulls;
  const weights = [];

  for(let g = 0; g < GRADES.length; g++){
    let baseWeight = Math.pow(0.33, g);
    // 고등급 가속: 누적 뽑기가 늘수록 높은 등급에 추가 가중치를 주어
    // 절대극(21등급)이 약 1,000만 회에서 0.01% 부근에 도달하도록 조정합니다.
    let pullBonus = 1 + (pulls * 0.100 * Math.pow(g, 1.4));
    const highGradeBoost = Math.pow(1 + (pulls / 1000000), (4.7463674428 * g / 21));
    weights.push(baseWeight * pullBonus * highGradeBoost);
  }

  const total = weights.reduce((a,b)=>a+b,0);
  return { weights, total };
}

function toggleRateTable(){
  const wrap = document.getElementById('rateTableWrap');
  if(wrap.style.display==='none'){
    const { weights, total } = getBoxProbabilities();
    let rows = '';
    for(let g=0; g<GRADES.length; g++){
      const prob = ((weights[g]/total)*100).toFixed(3);
      rows += `<tr>
        <td style="color:${GRADES[g].color}; font-weight:700;">${GRADES[g].name}</td>
        <td>x${GRADES[g].mult}</td>
        <td>${prob}%</td>
      </tr>`;
    }
    wrap.innerHTML = `<table class="rateTable">
      <thead><tr><th>등급</th><th>능력치 배율</th><th>현재 확률</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
    wrap.style.display = 'block';
  } else {
    wrap.style.display = 'none';
  }
}

/* Extracted module. Gameplay behavior intentionally preserved. */

function renderGoldShop(){
  const pane = document.getElementById('shopGoldPane');
  const atkCost = Math.floor(300 * Math.pow(1.3, S.research.atkLv));
  const hpCost = Math.floor(300 * Math.pow(1.3, S.research.hpLv||0));
  const goldCost = Math.floor(500 * Math.pow(1.4, S.research.goldLv));

  pane.innerHTML = `
    <div class="shopItem">
      <div>
        <div class="si-name">⚔️ 공격력 단련 (Lv.${S.research.atkLv})</div>
        <div class="si-desc">모든 공격력 +5% 증가 (현재: +${S.research.atkLv*5}%)</div>
      </div>
      <button onclick="upgradeResearch('atkLv', ${atkCost})">💰 ${fmt(atkCost)}</button>
    </div>
    <div class="shopItem">
      <div>
        <div class="si-name">❤️ 최대 HP 단련 (Lv.${S.research.hpLv||0})</div>
        <div class="si-desc">최대 HP +5% 증가 (현재: +${(S.research.hpLv||0)*5}%)</div>
      </div>
      <button onclick="upgradeResearch('hpLv', ${hpCost})">💰 ${fmt(hpCost)}</button>
    </div>
    <div class="shopItem">
      <div>
        <div class="si-name">💰 행운 단련 (Lv.${S.research.goldLv})</div>
        <div class="si-desc">골드 획득량 +10% 증가 (현재: +${S.research.goldLv*10}%)</div>
      </div>
      <button onclick="upgradeResearch('goldLv', ${goldCost})">💰 ${fmt(goldCost)}</button>
    </div>
  `;
}