/* Extracted module. Gameplay behavior intentionally preserved. */

function expNeeded(level){ return Math.round(25 * Math.pow(level, 1.35)); }

function renderFocusUpgrades(){
  const box=document.getElementById('focusUpgradeList'); if(!box)return;
  const c=Number(S.focusCrystal||0), u=S.focusUpgrades||{atk:0,hp:0};
  const rows=[['atk','⚔️','기본 공격력'],['hp','❤️','기본 최대체력']];
  box.innerHTML=rows.map(([k,ic,name])=>{
    const lv=Number(u[k]||0), pct=lv*5, cost=1+lv*2;
    return `<div class="focusUpgradeRow"><div>${ic} <b>${name} +${pct}%</b><div style="font-size:9px;color:var(--sub);margin-top:2px;">집중 결정 ${cost}개 · 구매할 때마다 +5%</div></div><button ${c<cost?'disabled':''} onclick="buyFocusUpgrade('${k}')">강화</button></div>`;
  }).join('');
  const cv=document.getElementById('focusCrystalVal'); if(cv)cv.textContent=c; const ft=document.getElementById('focusCrystalTabText'); if(ft)ft.textContent=`${c} 결정`;
}

function buyFocusUpgrade(type){
  if(!S.focusUpgrades)S.focusUpgrades={atk:0,hp:0};
  const lv=Number(S.focusUpgrades[type]||0), cost=1+lv*2;
  if((S.focusCrystal||0)<cost){toast('⏱️ 집중 결정이 부족합니다.');return;}
  S.focusCrystal-=cost; S.focusUpgrades[type]=lv+1;
  renderFocusUpgrades(); renderAll(); saveGame();
  toast('✨ 기본 능력치 강화 완료!');
}

function startFocusHour(){  if(S.focusMode) return;
  if(!S.studying){ toast('먼저 📖 공부 시작을 눌러주세요.'); return; }
  S.focusMode=true; S.focusEndAt=Date.now()+60*60*1000;
  S.focusSession={gold:0,exp:0,boxes:0,kills:0};
  const overlay=document.getElementById('focusLockOverlay'); if(overlay)overlay.classList.add('show');
  const btn=document.getElementById('focusHourBtn'); if(btn)btn.disabled=true;
  updateFocusCountdown();
  clearInterval(focusCountdownTimer); focusCountdownTimer=setInterval(updateFocusCountdown,1000);
  saveGame(); toast('⏱️ 1시간 집중 시작! 공부에 집중하세요.',2500);
}

function updateFocusCountdown(){
  if(!S.focusMode)return;
  const remain=Math.max(0,S.focusEndAt-Date.now());
  const sec=Math.ceil(remain/1000), m=Math.floor(sec/60), ss=sec%60;
  const el=document.getElementById('focusRemainText'); if(el)el.textContent=`${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  if(remain<=0) finishFocusHour();
}

function finishFocusHour(){
  if(!S.focusMode)return;
  S.focusMode=false;
  clearInterval(focusCountdownTimer); focusCountdownTimer=null;
  const r={...S.focusSession};
  S.focusBoxes += r.boxes;
  const crystal=Math.max(1,Math.floor(r.kills/20)+Math.floor(r.boxes/2));
  S.focusCrystal += crystal;
  const protectionReward=5;
  S.breakProtectionTickets=Math.max(0,Number(S.breakProtectionTickets||0))+protectionReward;
  const overlay=document.getElementById('focusLockOverlay'); if(overlay)overlay.classList.remove('show');
  const btn=document.getElementById('focusHourBtn'); if(btn)btn.disabled=false;
  S.focusEndAt=0;
  renderFocusUpgrades(); renderAll(); saveGame();
  // 집중 시간이 끝나도 공부/자동전투는 종료하지 않는다. 결과만 보여준다.
  showFocusReward(r,crystal);
  toast(`⏱️ 1시간 집중 완료! 🎫 파괴방지권 +${protectionReward} · 보유 ${S.breakProtectionTickets}개`,4000);
}

function showFocusReward(r,crystal){
  const box=document.getElementById('focusRewardResult');
  if(box){box.innerHTML=`<div class="focusReward"><div style="font-weight:900;font-size:16px">⏱️ 1시간 집중 완료!</div><div style="margin-top:9px">📦 집중 상자 <span class="big">${fmt(r.boxes)}</span>개</div><div>💰 골드 <span class="big">${fmt(r.gold)}</span></div><div>✨ 경험치 <span class="big">${fmt(r.exp)}</span></div><div>🔷 집중 결정 <span class="big">+${fmt(crystal)}</span></div><div style="margin-top:6px;color:var(--sub);font-size:10px">처치 ${fmt(r.kills)}마리 · 집중 결정으로 기본 공격력/최대 체력을 레벨당 5%씩 강화할 수 있습니다.</div></div>`; box.style.display='block';}
  toast(`⏱️ 집중 완료! 상자 ${r.boxes}개 · 집중 결정 +${crystal} · 🎫 파괴방지권 +${protectionReward}`,4000);
}

function toggleStudy(){
  if(S.focusMode) return;
  S.studying = !S.studying;
  const btn = document.getElementById('studyBtn');
  const focusBtn = document.getElementById('focusHourBtn');
  const actionRow = document.getElementById('studyActionRow');
  if(S.studying){
    actionRow?.classList.add('started');
    btn.textContent = '⏸ 공부 종료';
    btn.classList.add('on');
    if(focusBtn){ focusBtn.style.display='block'; focusBtn.disabled=false; }
    studySessionStart = Date.now();
    startCombatLoop();
    studyTickTimer = setInterval(()=>{
      document.getElementById('studyTimer').textContent =
        `누적 학습시간 ${Math.floor((S.totalStudySec + (Date.now()-studySessionStart)/1000)/60)}분`;
    }, 1000);
    toast('공부 시작! 자동 전투를 진행합니다 📖');
  }else{
    actionRow?.classList.remove('started');
    btn.textContent = '📖 공부 시작';
    btn.classList.remove('on');
    if(focusBtn){ focusBtn.style.display='none'; }
    S.totalStudySec += (Date.now()-studySessionStart)/1000;
    stopCombatLoop();
    clearInterval(studyTickTimer);
    document.getElementById('studyTimer').textContent = `누적 학습시간 ${Math.floor(S.totalStudySec/60)}분`;
    saveGame();
    toast('공부 종료! 게임이 저장되었습니다 💾');
  }
}