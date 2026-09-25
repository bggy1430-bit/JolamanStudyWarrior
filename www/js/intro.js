/* Extracted module. Gameplay behavior intentionally preserved. */

function findNameTargets(){
    return [
      document.querySelector('#playerName'),
      document.querySelector('#player-name'),
      document.querySelector('.playerName'),
      document.querySelector('[data-player-name]')
    ].filter(Boolean);
  }

function applyPlayerName(name){
    if(!name) return;
    window.playerName = name;
    window.PLAYER_NAME = name;

    // Common global/state names used by prototypes.
    try{
      if(typeof player !== 'undefined' && player){
        if('name' in player) player.name = name;
      }
    }catch(e){}

    findNameTargets().forEach(el => {
      if('value' in el) el.value = name;
      else el.textContent = name;
    });

    // Replace only visible player-name text nodes, avoiding scripts/styles.
    document.querySelectorAll('*').forEach(el=>{
      if(el.id === 'introOverlay' || el.closest('#introOverlay')) return;
      if(el.children.length === 0 && el.textContent.trim() === '졸라맨'){
        el.textContent = name;
      }
    });
  }

function openIntro(){
    const ov=document.getElementById('introOverlay');
    const input=document.getElementById('introName');
    if(!ov) return;
    ov.classList.add('show');
    ov.setAttribute('aria-hidden','false');
    setTimeout(()=>input && input.focus(),80);
  }

function closeIntro(name){
    localStorage.setItem(NAME_KEY,name);
    localStorage.setItem(INTRO_KEY,'1');
    applyPlayerName(name);
    const ov=document.getElementById('introOverlay');
    if(ov){
      ov.classList.remove('show');
      ov.setAttribute('aria-hidden','true');
    }
  }

function init(){
    const saved=localStorage.getItem(NAME_KEY);
    const seen=localStorage.getItem(INTRO_KEY);
    const input=document.getElementById('introName');
    const btn=document.getElementById('introStart');

    if(saved) applyPlayerName(saved);

    if(btn){
      btn.addEventListener('click',()=>{
        const name=(input.value||'').trim();
        if(!name){
          input.focus();
          input.animate(
            [{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],
            {duration:180}
          );
          return;
        }
        closeIntro(name);
      });
    }
    if(input) input.addEventListener('keydown',e=>{
      if(e.key==='Enter') btn && btn.click();
    });

    // First launch only. If the game is reset, the reset handler below
    // removes these keys so the intro appears again.
    if(!saved || !seen) openIntro();
  }

// Bootstrap extracted intro module after the HTML exists.
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
else init();
