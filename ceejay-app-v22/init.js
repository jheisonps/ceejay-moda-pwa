// SPLASH
setTimeout(()=>{
  const s=document.getElementById('splash');
  s.style.opacity='0';setTimeout(()=>s.style.display='none',600);
},1800);

// INIT
function initTarDate(){
  const now=new Date();
  const y=now.getFullYear();const m=String(now.getMonth()+1).padStart(2,'0');const d=String(now.getDate()).padStart(2,'0');
  const today=`${y}-${m}-${d}`;
  $('tar-date').value=today;
  $('tar-date-end').value=today;
}
refreshUserDisplay();
addItem();
initTarDate();
initResDate();
// Define data máxima do campo nascimento como hoje
(function(){const hoje=new Date();const y=hoje.getFullYear();const m=String(hoje.getMonth()+1).padStart(2,'0');const d=String(hoje.getDate()).padStart(2,'0');const el=$('cli-nascimento');if(el)el.max=`${y}-${m}-${d}`;})();
