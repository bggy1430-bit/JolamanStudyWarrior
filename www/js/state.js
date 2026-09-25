/* Extracted module. Gameplay behavior intentionally preserved. */

function defaultState(){
  return {
    player:{ level:1, exp:0, atk:10, maxHp:80, hp:80 },
    gold:500, soulStones:0, essence:0,
    stage:1, maxStage:1,
    pendingBoss: false,
    monster:null,
    equip:{ weapon:null, helmet:null, armor:null, gloves:null, accessory:null },
    bagJunk:[],
    bagEquip:[],
    pets:{},
    equippedPets:[], // 최대 12개 착용 지원
    mbox:{ pulls:0 },
    autoEquipDismantle: false,
    research:{ atkLv:0, hpLv:0, goldLv:0 },
    studying:false,
    totalStudySec:0,
    lastSaveAt:0,
    showDetailStats: false,
    petGrowthSpent: 0,
    playerGrowthSpent: 0,
    growthSkills: {},
    artifactShards: 0,
    artifacts: {},
    equippedArtifacts: [],
    artifactPresets: [{name:'사냥',pets:[],artifacts:[],equip:{}},{name:'보스',pets:[],artifacts:[],equip:{}},{name:'파밍',pets:[],artifacts:[],equip:{}}],
    spouses:{}, equippedSpouse:null,
    zeroOmegaCharge: 0, focusMode:false, focusEndAt:0, focusSession:{gold:0,exp:0,boxes:0,kills:0}, focusBoxes:0, focusCrystal:0, focusUpgrades:{atk:0,hp:0}, breakProtectionTickets:0, originCoreLv:0, originCorePity:0, errorHitCount:0, damageStats:{player:0,pets:{},artifacts:{}}, artifactApocBossHits:0, artifactApocStacks:0, artifactApocKillCount:0, artifactApocKillReady:false, artifactApocCollapseUsed:false, artifactStarCritCharge:0
  };
}

function saveGame(){
  try{
    S.lastSaveAt = Date.now();
    localStorage.setItem('zolaman_study_save', JSON.stringify(S));
  }catch(e){ console.error(e); }
}

function loadGame(){
  try{
    const rawData = localStorage.getItem('zolaman_study_save');
    if(rawData){
      const loaded = JSON.parse(rawData);
      if(loaded.bag && Array.isArray(loaded.bag)){
        loaded.bagJunk = loaded.bag.filter(x=>x.kind==='junk');
        loaded.bagEquip = loaded.bag.filter(x=>x.kind!=='junk');
        delete loaded.bag;
      }
      S = Object.assign(defaultState(), loaded);
      if(typeof S.autoEquipDismantle !== 'boolean') S.autoEquipDismantle = false;
      if(!Number.isFinite(S.artifactShards)) S.artifactShards = 0;
      if(!Number.isFinite(S.originCoreLv)) S.originCoreLv = 0;
      if(!Number.isFinite(S.originCorePity)) S.originCorePity = 0;
      if(!Number.isFinite(S.breakProtectionTickets)) S.breakProtectionTickets = 0;
      S.breakProtectionTickets=Math.max(0,Math.floor(S.breakProtectionTickets));
      if(!S.artifacts || typeof S.artifacts !== 'object') S.artifacts = {};
      if(!Array.isArray(S.equippedArtifacts)) S.equippedArtifacts=[];
      S.equippedArtifacts=S.equippedArtifacts.filter(id=>S.artifacts[id] && Number(S.artifacts[id].level)>0).slice(0,5);
      Object.keys(S.artifacts).forEach(id=>{ if(Number(S.artifacts[id].level)>10) S.artifacts[id].level=10; });
      if(!Array.isArray(S.artifactPresets) || S.artifactPresets.length<3) S.artifactPresets=[{name:'사냥',pets:[],artifacts:[],equip:{}},{name:'보스',pets:[],artifacts:[],equip:{}},{name:'파밍',pets:[],artifacts:[],equip:{}}];
          if(!S.spouses || typeof S.spouses!=='object') S.spouses={};
      if(!S.equippedSpouse || !S.spouses[S.equippedSpouse]) S.equippedSpouse=null;
      if(!S.bagJunk) S.bagJunk = [];
      if(!S.bagEquip) S.bagEquip = [];
      if(Array.isArray(S.pets)){
        const oldPets = S.pets;
        S.pets = {};
        oldPets.forEach(pId => { S.pets[pId] = 1; });
      } else if(!S.pets){
        S.pets = {};
      }
      // Prototype v1 migration: permanently remove retired pet entries from old saves.
      const retiredPetsV1 = ['myth_guardian','myth_treasure_god','origin_time','origin_void','absolute_annihilator','absolute_boss'];
      retiredPetsV1.forEach(id=>{ if(S.pets && Object.prototype.hasOwnProperty.call(S.pets,id)) delete S.pets[id]; });
      if(Array.isArray(S.equippedPets)) S.equippedPets=S.equippedPets.filter(id=>!retiredPetsV1.includes(id));
      if(Array.isArray(S.artifactPresets)) S.artifactPresets.forEach(p=>{
        if(Array.isArray(p.pets)) p.pets=p.pets.filter(id=>!retiredPetsV1.includes(id));
      });

      if(!S.equippedPets){
        S.equippedPets = [];
        if(S.equippedPet) {
          S.equippedPets.push(S.equippedPet);
          delete S.equippedPet;
        }
      }

      // PET_REBUILD_V16: 기존 신화/태초/절대극 보유분을 모두 폐기하고 새 6+6+6 체계로 시작
      const legacyHighPetIds = new Set([
        'pet_crit_master','pet_shadow_echo','pet_reaper','pet_gambler','pet_gravity_jelly','pet_cursed_dice','pet_hourglass','pet_void_jester',
        'pet_star_whale','pet_soul_collector','pet_ancient_mimic','pet_essence_wisp','pet_void_dragon','pet_time_dragon','pet_black_hole','pet_soul_merger',
        'pet_absolute_god','pet_dimension_eater','pet_fate_weaver','pet_apocalypse_clock','pet_prism_fairy','pet_dimension_fox','pet_eternal_sword','pet_endless_eye','pet_creator_dragon','pet_final_crown','pet_star_judge',
        'pet_storm_hawk','pet_rune_golem','pet_dream_eater'
      ]);
      Object.keys(S.pets).forEach(id => { if(legacyHighPetIds.has(id)) delete S.pets[id]; });
      S.equippedPets = S.equippedPets.filter(id => !legacyHighPetIds.has(id));

      if(!S.essence) S.essence = 0;
      if(!S.research || typeof S.research !== 'object') S.research = { atkLv:0, hpLv:0, goldLv:0 };
      if(S.research.hpLv === undefined) S.research.hpLv = Number(S.research.defLv||0);
      delete S.research.defLv;
      if(S.player && 'def' in S.player) delete S.player.def;
      if(S.focusUpgrades && 'def' in S.focusUpgrades){ S.focusUpgrades.hp = Number(S.focusUpgrades.hp||0) + Number(S.focusUpgrades.def||0); delete S.focusUpgrades.def; }
      if(!S.mbox) S.mbox = { pulls:0 };
      if(S.pendingBoss === undefined) S.pendingBoss = false;
      if(S.showDetailStats === undefined) S.showDetailStats = false;
      if(S.petGrowthSpent === undefined) S.petGrowthSpent = 0;
      if(S.playerGrowthSpent === undefined) S.playerGrowthSpent = 0;
      if(!S.growthSkills || typeof S.growthSkills !== 'object') S.growthSkills = {};
      if(!S.focusSession || typeof S.focusSession !== 'object') S.focusSession={gold:0,exp:0,boxes:0,kills:0};
      if(!Number.isFinite(S.focusBoxes)) S.focusBoxes=0; if(!Number.isFinite(S.focusCrystal)) S.focusCrystal=0;
      if(!S.focusUpgrades || typeof S.focusUpgrades !== 'object') S.focusUpgrades={atk:0,hp:0};
      S.focusMode=false; S.focusEndAt=0;
      if(!S.damageStats || typeof S.damageStats!=='object') S.damageStats={player:0,pets:{},artifacts:{}};
      if(!Number.isFinite(S.damageStats.player)) S.damageStats.player=0;
      if(!S.damageStats.pets || typeof S.damageStats.pets!=='object') S.damageStats.pets={}; if(!S.damageStats.artifacts || typeof S.damageStats.artifacts!=='object') S.damageStats.artifacts={};
      S.studying = false;
    }
  }catch(e){ console.error(e); }
  
  ['weapon','helmet','armor','gloves','accessory'].forEach(slot => {
    if(S.equip[slot] && S.equip[slot].transcend === undefined) S.equip[slot].transcend = 0;
  });
  S.bagEquip.forEach(it => {
    if(it.transcend === undefined) it.transcend = 0;
    if(!it.options) it.options = rollEquipOptions(it.grade || 0);
    if(!it.setId) { const set = getSetForGrade(it.grade || 0); it.setId = set ? set.id : null; }
  });
  ['weapon','helmet','armor','gloves','accessory'].forEach(slot => {
    const it = S.equip[slot];
    if(it){
      if(!it.options) it.options = rollEquipOptions(it.grade || 0);
      if(!it.setId) { const set = getSetForGrade(it.grade || 0); it.setId = set ? set.id : null; }
    }
  });

  if(!S.monster) spawnMonster(false);
  renderAll();
  document.getElementById('studyTimer').textContent = `누적 학습시간 ${Math.floor(S.totalStudySec/60)}분`;
}