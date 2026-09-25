/* JolamanStudyWarrior update checker */
(function(){
  const APP_VERSION='0.1.0';
  const VERSION_URL='https://raw.githubusercontent.com/bggy1430-bit/JolamanStudyWarrior/main/www/version.json';
  function newer(a,b){const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)<(y[i]||0);}return false;}
  window.checkForGameUpdate=async function(){
    try{const r=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)return false;const v=await r.json();
      if(newer(APP_VERSION,v.version)){
        const ok=confirm('새 게임 버전 '+v.version+'이 있습니다.\n업데이트 페이지를 열까요?');
        if(ok&&v.url) location.href=v.url;
        return true;
      }
    }catch(e){}
    return false;
  };
  setTimeout(()=>window.checkForGameUpdate(),3000);
})();
