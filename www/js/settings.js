/* Extracted module. Gameplay behavior intentionally preserved. */

function saveAppSettings(){
  try{ localStorage.setItem('zolaman_study_settings', JSON.stringify(appSettings)); }catch(e){}
}

function renderSettings(){
  const fx=document.getElementById('settingsFxToggle');
  const vib=document.getElementById('settingsVibrateToggle');
  const bgm=document.getElementById('settingsBgmToggle');
  const sfx=document.getElementById('settingsSfxToggle');
  const gf=document.getElementById('settingsGachaFxToggle');
  const ef=document.getElementById('settingsEnhanceFxToggle');
  const tf=document.getElementById('settingsTranscendFxToggle'), uf=document.getElementById('settingsUltimateFxToggle');
  if(fx) fx.classList.toggle('on', !appSettings.reducedFx);
  if(vib) vib.classList.toggle('on', !!appSettings.vibration);
  if(bgm) bgm.classList.toggle('on', !!appSettings.bgm);
  if(sfx) sfx.classList.toggle('on', !!appSettings.sfx);
  if(gf) gf.classList.toggle('on', !!appSettings.gachaFx);
  if(ef) ef.classList.toggle('on', !!appSettings.enhanceFx);
  if(tf) tf.classList.toggle('on', !!appSettings.transcendFx);
  if(uf) uf.classList.toggle('on', !!appSettings.ultimateFx);
}

function toggleSetting(key){
  appSettings[key]=!appSettings[key];
  saveAppSettings();
  renderSettings();
  if(key==='reducedFx') document.body.classList.toggle('reduced-fx', !!appSettings.reducedFx);
  if(key==='vibration' && appSettings.vibration && navigator.vibrate) navigator.vibrate(12);
  if(key==='bgm') appSettings.bgm ? startAmbientBgm() : stopAmbientBgm();
  if(key==='sfx') ensureAudio();
  const msg={
    reducedFx:appSettings.reducedFx?'✨ 전투 이펙트 줄임':'✨ 전투 이펙트 켬',
    vibration:appSettings.vibration?'📳 진동 켬':'📳 진동 끔',
    bgm:appSettings.bgm?'🎵 잔잔한 BGM 켬':'🎵 BGM 끔',
    sfx:appSettings.sfx?'🔊 효과음 켬':'🔇 효과음 끔',
    gachaFx:appSettings.gachaFx?'✨ 뽑기 연출 켬':'✨ 뽑기 연출 끔',
    enhanceFx:appSettings.enhanceFx?'🔨 강화 연출 켬':'🔨 강화 연출 끔',
    transcendFx:appSettings.transcendFx?'⚡ 초월 연출 켬':'⚡ 초월 연출 끔',
    ultimateFx:appSettings.ultimateFx?'🔥 극의 연출 켬':'🔥 극의 연출 끔'
  }[key] || '설정 변경';
  toast(msg);
}

function confirmResetSave(){
  const title=document.getElementById('resetConfirmTitle');
  const text=document.getElementById('resetConfirmText');
  const action=document.getElementById('resetConfirmAction');
  if(title) title.textContent='저장 데이터를 초기화할까요?';
  if(text) text.innerHTML='캐릭터, 장비, 성장, 재화 등 <strong>현재 저장된 게임 데이터가 모두 삭제</strong>됩니다.<br>이 작업은 되돌릴 수 없습니다.';
  if(action){ action.textContent='다음'; action.onclick=confirmResetSaveStep2; }
  closeModal('settings');
  openModal('resetConfirm');
}

function confirmResetSaveStep2(){
  const title=document.getElementById('resetConfirmTitle');
  const text=document.getElementById('resetConfirmText');
  const action=document.getElementById('resetConfirmAction');
  if(title) title.textContent='정말 초기화할까요?';
  if(text) text.innerHTML='<strong>마지막 확인입니다.</strong><br>저장된 게임 진행도를 전부 지우고 처음부터 시작합니다.';
  if(action){ action.textContent='초기화'; action.onclick=resetSaveNow; }
}

function resetSaveNow(){
  // Set this BEFORE deleting storage so beforeunload/autosave cannot recreate the save.
  resetInProgress = true;
  try{
    if(combatTimer) clearInterval(combatTimer);
    if(autosaveTimer) clearInterval(autosaveTimer);
    if(studyTickTimer) clearInterval(studyTickTimer);
    if(focusCountdownTimer) clearInterval(focusCountdownTimer);

    localStorage.removeItem('zolaman_study_save');
    localStorage.removeItem('zolaman_study_settings');
    localStorage.removeItem('jolaman_player_name_v1');
    localStorage.removeItem('jolaman_intro_seen_v1');
    sessionStorage.clear();

    // Also remove any legacy save keys from older versions of this game.
    Object.keys(localStorage).forEach(function(key){
      var k = String(key).toLowerCase();
      if(k.includes('zolaman') || k.includes('jolaman') || k.includes('studywarrior')){
        localStorage.removeItem(key);
      }
    });
  }catch(e){
    console.warn('reset failed',e);
  }
  window.location.reload();
}