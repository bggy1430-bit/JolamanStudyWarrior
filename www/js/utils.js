/* Extracted module. Gameplay behavior intentionally preserved. */

function rand(a,b){ return Math.random()*(b-a)+a; }

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function fmt(n){ return Math.floor(n).toLocaleString(); }

function toast(msg, ms=1800){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove('show'), ms);
}

/* Extracted module. Gameplay behavior intentionally preserved. */

function uid(){ return 'it'+(uidSeed++)+'_'+Date.now().toString(36); }