/* Extracted module. Gameplay behavior intentionally preserved. */

function upgradeResearch(type, cost){
  if(S.gold < cost){ toast('골드가 부족합니다!'); return; }
  S.gold -= cost;
  S.research[type]++;
  renderGoldShop();
  renderAll(); saveGame();
  toast('패시브 연구 완료!');
}

function switchEnhTab(tab){
  currentEnhTab = tab;
  const powerTab = document.getElementById('enhTabPower');
  const synthTab = document.getElementById('enhTabSynth');
  const awakenTab = document.getElementById('enhTabAwaken');
  const enhList = document.getElementById('enhList');
  const synthPanel = document.getElementById('synthPanel');
  const awakenPanel = document.getElementById('awakenPanel');
  if(!powerTab || !synthTab || !awakenTab || !enhList || !synthPanel || !awakenPanel) return;
  powerTab.classList.toggle('active', tab==='power');
  synthTab.classList.toggle('active', tab==='synth');
  awakenTab.classList.toggle('active', tab==='awaken');
  enhList.style.display = tab==='power' ? 'block' : 'none';
  synthPanel.style.display = tab==='synth' ? 'block' : 'none';
  awakenPanel.style.display = tab==='awaken' ? 'block' : 'none';
  if(tab==='power') renderEnhance();
  else if(tab==='synth') renderSynthesis();
  else renderAwakening();
}

function renderAwakening(){
  const panel=document.getElementById('awakenPanel'); if(!panel)return;
  const rows=[];
  ['weapon','helmet','armor','gloves','accessory'].forEach(k=>{
    const it=S.equip[k]; if(!it)return;
    const lv=Math.min(3,it.awakening||0); const awakeningCosts=[10000,50000,100000]; const cost=awakeningCosts[lv]||100000;
    const power=it.grade>=15 ? ' · 고유 권능도 각성 단계에 따라 강화됩니다.' : '';
    const disabled=(lv>=3||S.soulStones<cost)?'disabled':'';
    const label=lv>=3?'최대 각성':'🌠 각성 · '+fmt(cost)+' 영혼석';
    rows.push(`<div class="enhCard"><div class="er-top"><div class="er-name" style="color:${GRADES[it.grade].color}">${it.name}</div><div style="color:var(--gold)">각성 ${lv}/3</div></div><div style="font-size:9px;color:var(--sub);margin-top:4px;">각성 1단계마다 장비 자체 능력치가 크게 상승합니다.${power}</div><button class="enhBtn" ${disabled} onclick="awakenEquip('${k}',${cost})">${label}</button></div>`);
  });
  panel.innerHTML=rows.length?rows.join(''):'<div style="text-align:center;color:var(--sub);padding:25px;">장착된 장비가 없습니다.</div>';
}

function awakenEquip(slot,cost){
  const it=S.equip[slot]; if(!it)return; const lv=it.awakening||0; if(lv>=3||S.soulStones<cost)return;
  S.soulStones-=cost; it.awakening=lv+1; renderAwakening(); renderAll(); saveGame(); toast(`🌠 ${it.name} 각성 ${it.awakening}단계!`);
}

function switchSynthType(type){
  currentSynthType = type;
  currentSynthTargetId = null;
  renderSynthesis();
}

function getSynthItems(type){
  // 합성 재료는 가방에 있는 장비만 사용합니다.
  return S.bagEquip.filter(it => it.kind === type);
}

function renderSynthesis(){
  const panel = document.getElementById('synthPanel');
  if(!panel) return;

  const types = [
    ['weapon','⚔️','무기'],
    ['helmet','🪖','투구'],
    ['armor','🛡️','갑옷'],
    ['gloves','🥊','장갑'],
    ['accessory','💍','장신구']
  ];

  const equipped = S.equip[currentSynthType];
  const items = getSynthItems(currentSynthType);

  let html = `
    <div class="synthTypeTabs">
      ${types.map(([key,ic,name])=>`
        <button class="synthTypeTab ${key===currentSynthType?'active':''}" onclick="switchSynthType('${key}')">${ic} ${name}</button>
      `).join('')}
    </div>
    <div style="font-size:10px;color:var(--sub);margin-bottom:8px;">
      <b>현재 착용 중인 장비</b>와 같은 <b>종류 + 같은 등급</b>의 가방 장비 1개를 재료로 사용합니다.
      합성할 때마다 해당 장비가 <b>약 10%</b> 강해집니다.
    </div>
  `;

  if(!equipped){
    html += `<div class="synthEmpty">현재 착용 중인 ${types.find(x=>x[0]===currentSynthType)[2]}가 없습니다.<br>장비를 먼저 착용하세요.</div>`;
  }else{
    const g = GRADES[equipped.grade] || GRADES[0];
    const synthLv = equipped.synthLv || 0;
    const material = items.find(it => it.id !== equipped.id && it.grade === equipped.grade);

    const beforeValue = itemStatValue(equipped);
    const preview = Object.assign({}, equipped, {synthLv:synthLv+1});
    const afterValue = itemStatValue(preview);
    const actualPct = beforeValue > 0 ? ((afterValue / beforeValue - 1) * 100) : 10;
    const cost = Math.floor((equipped.grade + 1) * 100);
    const can = !!material;

    html += `
      <div class="synthTarget" id="synthTargetBox">
        <div class="synthTitle" style="color:${g.color}">${slotIcon(equipped)} ${equipped.name} +${equipped.enhance||0}</div>
        <div style="font-size:10px;color:var(--sub);margin-top:3px;">
          ${g.name} · 합성 ${synthLv}회 · 현재 장착 중
        </div>
        <div class="synthPreview">
          <div class="synthStat">
            현재
            <b>${fmt(beforeValue)}</b>
            <span style="font-size:9px;color:var(--sub)">장비 능력치</span>
          </div>
          <div class="synthArrow">➜</div>
          <div class="synthStat">
            합성 후
            <b>${fmt(afterValue)}</b>
            <span style="font-size:9px;color:#ffb347">+${actualPct.toFixed(1)}%</span>
          </div>
        </div>
        <div class="synthMaterials">
          <div class="synthMat"><div class="ic">${slotIcon(equipped)}</div><div>착용 장비</div></div>
          <div style="align-self:center;font-size:20px;color:#ffb347">+</div>
          <div class="synthMat"><div class="ic">${material ? slotIcon(material) : '❌'}</div><div>${material ? '재료 1개' : '재료 없음'}</div></div>
        </div>
        <div style="font-size:10px;color:var(--sub);">
          소모: <b>착용 장비 + 같은 등급/종류 가방 장비 1개</b> · 비용 💎 ${fmt(cost)}
        </div>
        <button class="synthBtn" ${can?'':'disabled'} onclick="doSynthesisInPanel('${currentSynthType}',${cost})">
          🔺 ${can ? `합성 강화 · 능력치 +${actualPct.toFixed(1)}% · 💎 ${fmt(cost)}` : '같은 등급·종류의 가방 장비가 필요합니다'}
        </button>
      </div>
    `;

    if(items.length){
      html += `<div style="font-size:11px;font-weight:900;margin:10px 0 6px;">📦 사용 가능한 ${types.find(x=>x[0]===currentSynthType)[2]} 재료</div>`;
      const mats = items.filter(it=>it.id!==equipped.id && it.grade===equipped.grade);
      if(mats.length){
        html += mats.map(it=>{
          return `<div class="synthEquipCard">
            <div class="ic">${slotIcon(it)}</div>
            <div class="synthEquipMeta">
              <div class="name" style="color:${g.color}">${it.name} +${it.enhance||0}</div>
              <div class="sub">${g.name} · 합성 재료로 1개 소모</div>
            </div>
            <div style="font-size:10px;color:#ffb347">재료</div>
          </div>`;
        }).join('');
      }else{
        html += `<div class="synthEmpty">같은 등급의 ${types.find(x=>x[0]===currentSynthType)[2]} 재료가 없습니다.</div>`;
      }
    }
  }

  panel.innerHTML = html;
}

function doSynthesisInPanel(type, cost){
  if(isEnhancing) return;

  const target = S.equip[type];
  if(!target){ toast('착용 중인 장비가 없습니다.'); return; }

  const material = S.bagEquip.find(
    x => x.kind === type && x.grade === target.grade && x.id !== target.id
  );
  if(!material){
    toast('같은 종류·같은 등급의 가방 장비 1개가 필요합니다.');
    return;
  }
  if(S.soulStones < cost){
    toast(`💎 영혼석이 부족합니다! 필요: ${fmt(cost)}`);
    return;
  }

  isEnhancing = true;
  S.soulStones -= cost;

  const materialId = material.id;
  S.bagEquip = S.bagEquip.filter(x=>x.id !== materialId);

  const beforeValue = itemStatValue(target);
  const oldSynth = target.synthLv || 0;
  const preview = Object.assign({}, target, {synthLv:oldSynth+1});
  const afterValue = itemStatValue(preview);
  const pct = beforeValue > 0 ? ((afterValue / beforeValue - 1) * 100) : 10;

  const overlay = document.getElementById('enhAnimOverlay');
  const animTxt = document.getElementById('animTxt');
  if(overlay) overlay.classList.remove('show');
  playForgeFx(slotIcon(target), '합성 강화!');

  setTimeout(()=>{
    target.synthLv = oldSynth + 1;

    if(overlay) overlay.classList.remove('show');
    isEnhancing = false;

    renderSynthesis();
    renderAll();
    saveGame();

    const box = document.getElementById('synthTargetBox');
    if(box){
      box.classList.remove('synthFlash');
      void box.offsetWidth;
      box.classList.add('synthFlash');
    }

    toast(`🔺 합성 성공! ${target.name} 능력치 ${fmt(beforeValue)} → ${fmt(afterValue)} (+${pct.toFixed(1)}%)`);
    if(animTxt) animTxt.textContent = '초월 에너지 응축 중...';
  }, 850);
}

function renderEnhance(){
  document.getElementById('enhSsVal').textContent = fmt(S.soulStones);
  const pane = document.getElementById('enhList');
  let html = '';
  
  const slots = [
    {key:'weapon', name:'무기', ic:'⚔️'},
    {key:'helmet', name:'투구', ic:'🪖'},
    {key:'armor', name:'갑옷', ic:'🛡️'},
    {key:'gloves', name:'장갑', ic:'🥊'},
    {key:'accessory', name:'장신구', ic:'💍'}
  ];

  slots.forEach(s => {
    const it = S.equip[s.key];
    if(!it){
      html += `<div class="enhCard"><div class="er-top"><span class="er-name">${s.ic} ${s.name}</span> <span style="font-size:11px; color:var(--sub)">장착 장비 없음</span></div></div>`;
      return;
    }

    const g = GRADES[it.grade];
    const isTranscend = it.enhance >= 20;

    if(!isTranscend){
      const cost = Math.floor((10 + Math.pow(it.enhance, 1.45) * 6) / 2);
      html += `
        <div class="enhCard">
          <div class="er-top">
            <span class="er-name" style="color:${g.color}">${s.ic} ${it.name} (+${it.enhance})</span>
            <span style="font-size:11px; color:var(--gold)">스탯 +${it.enhance*6}%</span>
          </div>
          <button class="enhBtn" onclick="doEnhance('${s.key}', ${cost})">강화하기 (💎 ${fmt(cost)} 필요)</button>
        </div>`;
    } else {
      const t = it.transcend || 0;
      const tMax = 5;
      if(t < tMax){
        const cost = Math.floor((t + 1) * 350 / 2);
        const transRates = [50, 38, 28, 18, 10];
        const transRate = transRates[t] || 10;
        html += `
          <div class="enhCard" style="border-color:#00ffff;">
            <div class="er-top">
              <span class="er-name" style="color:#00ffff">${s.ic} ${it.name} [초월 ${t}단계]</span>
              <span style="font-size:11px; color:#ff00ea">초월 보너스 +${t*50}%</span>
            </div>
            <button class="enhBtn trans-btn" onclick="doTranscend('${s.key}', ${cost})">⚡ 초월 돌파 ${t+1}단계 · 성공률 ${transRate}% (💎 ${fmt(cost)} 필요)</button>
          </div>`;
      } else {
        const u = it.ultimate || 0;
        const uMax = 10;
        const ultimateRates = [50, 40, 30, 20, 15, 10, 7, 4, 2, 1];
        const uRate = ultimateRates[u] || 1;
        if(u < uMax){
          const uCost = (u + 1) * 500;
          html += `
            <div class="enhCard" style="border-color:#ff8c00;">
              <div class="er-top">
                <span class="er-name" style="color:#ffb347">${s.ic} ${it.name} [극의 ${u}단계]</span><span style="font-size:11px;color:#7fffe0">🎫 ${Number(S.breakProtectionTickets||0)}개</span>
                <span style="font-size:11px; color:#ffb347">극의 보너스 +${u*40}%</span>
              </div>
              <div style="font-size:10px;color:var(--sub);margin-top:5px;">초월 5단계 이후 해금 · 성공률 50% → 1% · 실패 시 일정 확률로 1단계 강등 · 🎫 보유 시 강등 방지</div>
              <button class="enhBtn ultimate-btn" onclick="doUltimate('${s.key}', ${uCost})">🔥 극의 돌파 ${u+1}단계 · 성공률 ${uRate}% (💎 ${fmt(uCost)} 필요)</button>
            </div>`;
        }else{
          html += `
            <div class="enhCard" style="border-color:#ff8c00;">
              <div class="er-top">
                <span class="er-name" style="color:#ffb347">${s.ic} ${it.name} [극의 MAX]</span>
                <span style="font-size:11px; color:#ffb347">+400% 극의</span>
              </div>
              <button class="enhBtn btn-disabled" disabled>최고 극의 단계 달성</button>
            </div>`;
        }
      }
    }
  });

  pane.innerHTML = html;
}

function doEnhance(slotKey, cost){
  if(isEnhancing) return;
  const it = S.equip[slotKey];
  if(!it) return;
  if(S.soulStones < cost){ toast('영혼석이 부족합니다!'); return; }

  isEnhancing=true;
  S.soulStones -= cost;
  const overlay=document.getElementById('enhAnimOverlay');
  if(overlay) overlay.classList.remove('show');

  let wait=0;
  try{
    wait=Number(playForgeFx(slotKey==='weapon'?'⚔️':slotKey==='helmet'?'🪖':slotKey==='armor'?'🛡️':slotKey==='gloves'?'🥊':'💍','강화!'))||0;
  }catch(e){ wait=0; }

  setTimeout(()=>{
    it.enhance=(it.enhance||0)+1;
    isEnhancing=false;
    if(overlay) overlay.classList.remove('show');
    renderEnhance();
    renderAll(); saveGame();
    sfx('success');
    toast(`✨ ${it.name} +${it.enhance} 강화 성공!`);
  }, Math.min(900,Math.max(0,wait)));
}

function doEnhanceContinuousAll(){
  if(isEnhancing)return;
  let total=0,done=0;
  ['weapon','helmet','armor','gloves','accessory'].forEach(slotKey=>{
    const it=S.equip[slotKey];if(!it||it.enhance>=20)return;
    while(it.enhance<20){
      const cost=Math.floor((10+Math.pow(it.enhance,1.45)*6)/2);
      if(S.soulStones<cost)break;
      S.soulStones-=cost;total+=cost;it.enhance++;done++;
    }
  });
  if(done===0){toast('💎 연속 강화에 필요한 영혼석이 부족합니다.');return;}
  renderEnhance();renderAll();saveGame();toast('⚡ 연속 강화 완료! '+done+'회 · 💎-'+fmt(total));
}

function doTranscend(slotKey, cost){
  if(isEnhancing) return;
  const it = S.equip[slotKey];
  if(!it) return;
  if(S.soulStones < cost){ toast('영혼석이 부족합니다!'); return; }

  isEnhancing = true;
  S.soulStones -= cost;
  
  const overlay = document.getElementById('enhAnimOverlay');
  const useTransFx=appSettings.transcendFx!==false;
  if(useTransFx)overlay.classList.add('show');

  setTimeout(() => {
    const t = it.transcend || 0;
    const transRates = [50, 38, 28, 18, 10];
    const chance = transRates[t] || 10;
    const success = Math.random() * 100 < chance;

    overlay.classList.remove('show');
    isEnhancing = false;

    if(success){
      it.transcend = t + 1;
      renderEnhance();
      renderAll(); saveGame();
      toast(`⚡ ${it.name} 초월 ${it.transcend}단계 돌파 성공!`);
    }else{
      renderEnhance();
      renderAll(); saveGame();
      toast(`💥 초월 실패! ${it.name}은(는) 그대로 유지됩니다. (성공률 ${chance}%)`);
    }
  }, useTransFx ? 1200 : 0);
}